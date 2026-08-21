import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;
const LOCAL_DATABASE_URL = "postgresql://postgres:password@localhost:5432/myapp";

function printUsage() {
  console.log(`
Usage:
  node scripts/migrate-data.js export
  node scripts/migrate-data.js import <dump-file> [--force]
  node scripts/migrate-data.js migrate [--force]

Environment:
  SOURCE_DATABASE_URL        Source database. Falls back to DATABASE_URL for export/migrate.
  TARGET_DATABASE_URL        Destination database. Falls back to DATABASE_URL, then the local development URL.
  DATABASE_URL               Application database URL. On Lightsail this is normally the migration target.
  SOURCE_DATABASE_QUIESCED   Must be "true" while running export or migrate.
  DATABASE_EXPORT_DIR  Directory for custom-format dumps. Defaults to ./backups.

The target must be empty unless --force is passed. --force is destructive: it allows
restoring into a database that already has public tables.
`);
}

function parseUrl(connectionString, label) {
  try {
    const url = new URL(connectionString);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) {
      throw new Error("not a PostgreSQL URL");
    }
    if (!url.pathname || url.pathname === "/") {
      throw new Error("database name is missing");
    }
    return url;
  } catch {
    throw new Error(`${label} must be a valid PostgreSQL connection string.`);
  }
}

function isSupabase(url) {
  return url.hostname.endsWith(".supabase.co") || url.hostname.includes(".pooler.supabase.");
}

function sslConfig(connectionString) {
  const url = parseUrl(connectionString, "Database URL");
  const sslMode = url.searchParams.get("sslmode");
  const requiresSsl =
    sslMode === "require" ||
    sslMode === "verify-ca" ||
    sslMode === "verify-full" ||
    isSupabase(url);

  if (!requiresSsl || sslMode === "disable") {
    return undefined;
  }

  const ca = (process.env.DATABASE_SSL_CA || process.env.SUPABASE_CA_CERT)?.replace(/\\n/g, "\n");
  const verifyCertificate =
    Boolean(ca) ||
    sslMode === "verify-ca" ||
    sslMode === "verify-full" ||
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true";

  return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: verifyCertificate };
}

async function pgEnvironment(connectionString) {
  const url = parseUrl(connectionString, "Database URL");
  const sslMode = url.searchParams.get("sslmode");
  const env = {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGSSLMODE:
      sslMode === "verify-ca" || sslMode === "verify-full"
        ? sslMode
        : sslMode === "require" || isSupabase(url)
          ? "require"
          : "disable",
  };

  delete env.DATABASE_URL;
  delete env.SOURCE_DATABASE_URL;
  delete env.TARGET_DATABASE_URL;

  const ca = (process.env.DATABASE_SSL_CA || process.env.SUPABASE_CA_CERT)?.replace(/\\n/g, "\n");
  let certificatePath;
  if (ca) {
    certificatePath = path.join(tmpdir(), `e-ho-db-ca-${process.pid}-${Date.now()}.pem`);
    await writeFile(certificatePath, ca, { mode: 0o600 });
    env.PGSSLROOTCERT = certificatePath;
    env.PGSSLMODE = "verify-full";
  }

  return {
    env,
    async cleanup() {
      if (certificatePath) {
        await unlink(certificatePath).catch(() => undefined);
      }
    },
  };
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ["ignore", "inherit", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on("error", (error) => {
      reject(
        new Error(
          `${command} could not start: ${error.message}. Install the PostgreSQL client tools first.`,
        ),
      );
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} failed (exit ${code ?? "unknown"}): ${stderr.trim().split("\n").slice(-3).join(" ")}`));
    });
  });
}

async function tableCounts(connectionString) {
  const pool = new Pool({
    connectionString,
    ssl: sslConfig(connectionString),
    max: 2,
    connectionTimeoutMillis: 15000,
  });

  try {
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const counts = {};

    for (const { table_name: tableName } of tables.rows) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)) {
        throw new Error(`Unexpected table name returned by PostgreSQL: ${tableName}`);
      }
      const result = await pool.query(`SELECT COUNT(*)::text AS count FROM public."${tableName}"`);
      counts[tableName] = Number(result.rows[0]?.count ?? 0);
    }

    return counts;
  } finally {
    await pool.end();
  }
}

function sameDatabase(sourceConnectionString, targetConnectionString) {
  const source = parseUrl(sourceConnectionString, "SOURCE_DATABASE_URL");
  const target = parseUrl(targetConnectionString, "TARGET_DATABASE_URL");
  return (
    source.hostname === target.hostname &&
    (source.port || "5432") === (target.port || "5432") &&
    source.pathname === target.pathname &&
    decodeURIComponent(source.username) === decodeURIComponent(target.username)
  );
}

async function assertSafeTarget(targetConnectionString, force) {
  const counts = await tableCounts(targetConnectionString);
  const existingTables = Object.keys(counts);
  if (existingTables.length > 0 && !force) {
    throw new Error(
      `Target database already has public tables (${existingTables.join(", ")}). ` +
        "Use a newly created database, or pass --force only after taking a verified backup.",
    );
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function exportDatabase(sourceConnectionString) {
  if (process.env.SOURCE_DATABASE_QUIESCED !== "true") {
    throw new Error(
      "Set SOURCE_DATABASE_QUIESCED=true only after writes to the source application have been stopped or placed in maintenance mode.",
    );
  }

  const exportDir = path.resolve(process.env.DATABASE_EXPORT_DIR || "backups");
  await mkdir(exportDir, { recursive: true });

  const dumpFile = path.join(exportDir, `database-${timestamp()}.dump`);
  const manifestFile = dumpFile.replace(/\.dump$/, ".manifest.json");
  const sourceTables = await tableCounts(sourceConnectionString);
  const connection = await pgEnvironment(sourceConnectionString);

  try {
    await run("pg_dump", ["--format=custom", "--no-owner", "--no-acl", `--file=${dumpFile}`], connection.env);
  } finally {
    await connection.cleanup();
  }

  await writeFile(
    manifestFile,
    `${JSON.stringify({ format: "custom", createdAt: new Date().toISOString(), sourceTables, dumpFile }, null, 2)}\n`,
    "utf8",
  );
  console.log(`Export complete: ${dumpFile}`);
  console.log(`Table manifest: ${manifestFile}`);
  return dumpFile;
}

async function importDatabase(targetConnectionString, dumpFile, force) {
  if (!existsSync(dumpFile)) {
    throw new Error(`Dump file not found: ${dumpFile}`);
  }

  await assertSafeTarget(targetConnectionString, force);
  const connection = await pgEnvironment(targetConnectionString);
  try {
    await run(
      "pg_restore",
      [
        "--no-owner",
        "--no-acl",
        "--exit-on-error",
        "--single-transaction",
        ...(force ? ["--clean", "--if-exists"] : []),
        path.resolve(dumpFile),
      ],
      connection.env,
    );
  } finally {
    await connection.cleanup();
  }

  const manifestFile = path.resolve(dumpFile).replace(/\.dump$/, ".manifest.json");
  if (!existsSync(manifestFile)) {
    console.warn("Restore complete, but no manifest was found; row-count verification was skipped.");
    return;
  }

  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  const targetTables = await tableCounts(targetConnectionString);
  const mismatches = Object.entries(manifest.sourceTables).filter(
    ([table, sourceCount]) => targetTables[table] !== sourceCount,
  );
  if (mismatches.length > 0) {
    throw new Error(
      `Restore row-count verification failed: ${mismatches
        .map(([table, count]) => `${table}=${count}->${targetTables[table] ?? 0}`)
        .join(", ")}`,
    );
  }

  console.log(`Restore complete and verified across ${Object.keys(manifest.sourceTables).length} tables.`);
}

function requiredSourceUrl() {
  const source = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
  if (!source) {
    throw new Error("Set SOURCE_DATABASE_URL to the current database before exporting or migrating.");
  }
  return source;
}

async function main() {
  const [operation, ...args] = process.argv.slice(2);
  if (!operation || operation === "--help" || operation === "-h") {
    printUsage();
    return;
  }

  const force = args.includes("--force");
  const dumpFile = args.find((arg) => !arg.startsWith("--"));
  const target = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL || LOCAL_DATABASE_URL;

  if (operation === "export") {
    await exportDatabase(requiredSourceUrl());
    return;
  }

  if (operation === "import") {
    if (!dumpFile) {
      throw new Error("Provide a dump file: node scripts/migrate-data.js import backups/database-*.dump");
    }
    await importDatabase(target, dumpFile, force);
    return;
  }

  if (operation === "migrate") {
    const source = requiredSourceUrl();
    if (sameDatabase(source, target)) {
      throw new Error("Source and target resolve to the same database. Set TARGET_DATABASE_URL to a different database.");
    }
    const dump = await exportDatabase(source);
    await importDatabase(target, dump, force);
    return;
  }

  printUsage();
  throw new Error(`Unknown operation: ${operation}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});