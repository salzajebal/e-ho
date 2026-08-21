import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import pg from "pg";

const { Pool } = pg;

const APP_TABLES = [
  "branches",
  "affiliates",
  "users",
  "bets",
  "round_forced_directions",
  "settings",
  "messages",
  "announcements",
  "affiliate_commissions",
  "affiliate_settlements",
  "blocked_ips",
  "maintenance_symbols",
  "transaction_requests",
  "inquiries",
  "round_results",
  "login_history",
  "inquiry_templates",
  "forex_candles",
  "user_sessions",
];

type TableCounts = Record<string, number>;

interface ExportManifest {
  format: "custom";
  createdAt: string;
  sourceTables: TableCounts;
  dumpFile: string;
}

function requireConnectionString(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }

  throw new Error(`필수 환경변수가 없습니다: ${keys.join(" 또는 ")}`);
}

function parseConnectionString(connectionString: string): URL {
  try {
    return new URL(connectionString);
  } catch {
    throw new Error("PostgreSQL connection string 형식이 올바르지 않습니다.");
  }
}

function isSupabaseHost(hostname: string): boolean {
  return hostname.endsWith(".supabase.co") || hostname.includes(".pooler.supabase.");
}

function getCaCertificate(): string | undefined {
  return (process.env.SUPABASE_CA_CERT || process.env.DATABASE_SSL_CA)?.replace(/\\n/g, "\n");
}

function getSslConfig(
  connectionString: string,
): { rejectUnauthorized: boolean; ca?: string } | undefined {
  const url = parseConnectionString(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  const isSupabase = isSupabaseHost(url.hostname);

  if (isSupabase && sslMode === "disable") {
    throw new Error("Supabase 연결에는 TLS가 필요합니다. DATABASE_URL에서 sslmode=disable을 제거하세요.");
  }

  if (
    sslMode === "require" ||
    sslMode === "verify-ca" ||
    sslMode === "verify-full" ||
    isSupabase
  ) {
    const ca = getCaCertificate();
    const verifyCertificate =
      Boolean(ca) ||
      sslMode === "verify-ca" ||
      sslMode === "verify-full" ||
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true";
    return ca
      ? { rejectUnauthorized: true, ca }
      : { rejectUnauthorized: verifyCertificate };
  }

  return undefined;
}

async function getPgEnvironment(
  connectionString: string,
): Promise<{ env: NodeJS.ProcessEnv; cleanup: () => Promise<void> }> {
  const url = parseConnectionString(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  const isSupabase = isSupabaseHost(url.hostname);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.replace(/^\/+/, "")),
    PGSSLMODE:
      sslMode === "verify-ca" || sslMode === "verify-full"
        ? sslMode
        : sslMode === "disable" && !isSupabase
          ? "disable"
          : isSupabase || sslMode === "require"
            ? "require"
            : "prefer",
  };

  // Do not let a child process accidentally fall back to a different URL.
  delete env.DATABASE_URL;
  delete env.SOURCE_DATABASE_URL;
  delete env.SUPABASE_DATABASE_URL;
  delete env.TARGET_DATABASE_URL;

  const ca = getCaCertificate();
  let certificateFile: string | undefined;
  if (ca) {
    certificateFile = path.join(tmpdir(), `e-ho-supabase-ca-${process.pid}-${Date.now()}.pem`);
    await writeFile(certificateFile, ca, { mode: 0o600 });
    env.PGSSLROOTCERT = certificateFile;
    env.PGSSLMODE = "verify-full";
  }

  return {
    env,
    cleanup: async () => {
      if (certificateFile) {
        await unlink(certificateFile).catch(() => undefined);
      }
    },
  };
}

function runCommand(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      reject(new Error(`${command}를 실행할 수 없습니다: ${error.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const detail = stderr.trim().split("\n").slice(-3).join(" ");
      reject(new Error(`${command}가 실패했습니다 (exit ${code ?? "unknown"}): ${detail}`));
    });
  });
}

function quoteIdentifier(identifier: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`예상하지 못한 테이블 이름입니다: ${identifier}`);
  }
  return `"${identifier}"`;
}

async function getTableCounts(connectionString: string): Promise<TableCounts> {
  const pool = new Pool({
    connectionString,
    ssl: getSslConfig(connectionString),
    max: 2,
    connectionTimeoutMillis: 15000,
  });

  try {
    const tables = await pool.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const counts: TableCounts = {};

    for (const { table_name: tableName } of tables.rows) {
      const result = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM public.${quoteIdentifier(tableName)}`,
      );
      counts[tableName] = Number(result.rows[0]?.count ?? 0);
    }

    return counts;
  } finally {
    await pool.end();
  }
}

async function assertTargetIsSafe(connectionString: string): Promise<void> {
  const counts = await getTableCounts(connectionString);
  const existingAppTables = Object.keys(counts).filter((tableName) => APP_TABLES.includes(tableName));

  if (existingAppTables.length > 0 && process.env.ALLOW_NON_EMPTY_TARGET !== "true") {
    throw new Error(
      `대상 DB에 기존 앱 테이블이 있습니다: ${existingAppTables.join(", ")}. ` +
      "데이터 병합을 명시적으로 승인하려면 ALLOW_NON_EMPTY_TARGET=true를 설정하세요.",
    );
  }
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function exportDatabase(sourceConnectionString: string): Promise<{ dumpFile: string; manifestFile: string }> {
  const outputDir = path.resolve(process.env.DATABASE_EXPORT_DIR || "backups");
  await mkdir(outputDir, { recursive: true });

  const suffix = timestamp();
  const dumpFile = path.join(outputDir, `database-${suffix}.dump`);
  const manifestFile = path.join(outputDir, `database-${suffix}.manifest.json`);
  const sourceTables = await getTableCounts(sourceConnectionString);

  const pgConnection = await getPgEnvironment(sourceConnectionString);
  try {
    await runCommand(
      process.env.PG_DUMP_PATH || "pg_dump",
      [
        `--file=${dumpFile}`,
        "--format=custom",
        "--no-owner",
        "--no-acl",
        `--dbname=${parseConnectionString(sourceConnectionString).pathname.replace(/^\/+/, "")}`,
      ],
      pgConnection.env,
    );
  } finally {
    await pgConnection.cleanup();
  }

  const manifest: ExportManifest = {
    format: "custom",
    createdAt: new Date().toISOString(),
    sourceTables,
    dumpFile,
  };
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`DB export complete: ${dumpFile}`);
  console.log(`Manifest written: ${manifestFile}`);
  console.log(`Tables exported: ${Object.keys(sourceTables).length}`);
  return { dumpFile, manifestFile };
}

async function importDatabase(targetConnectionString: string, dumpFile: string): Promise<void> {
  if (!existsSync(dumpFile)) {
    throw new Error(`덤프 파일을 찾을 수 없습니다: ${dumpFile}`);
  }

  const targetUrl = parseConnectionString(targetConnectionString);
  if (!isSupabaseHost(targetUrl.hostname) && process.env.ALLOW_NON_SUPABASE_TARGET !== "true") {
    throw new Error("대상 DB가 Supabase로 확인되지 않았습니다. 안전을 위해 중단합니다.");
  }

  await assertTargetIsSafe(targetConnectionString);
  const pgConnection = await getPgEnvironment(targetConnectionString);
  try {
    await runCommand(
      process.env.PG_RESTORE_PATH || "pg_restore",
      [
        `--dbname=${targetUrl.pathname.replace(/^\/+/, "")}`,
        "--no-owner",
        "--no-acl",
        "--exit-on-error",
        "--single-transaction",
        dumpFile,
      ],
      pgConnection.env,
    );
  } finally {
    await pgConnection.cleanup();
  }

  const manifestFile = dumpFile.replace(/\.dump$/, ".manifest.json");
  if (existsSync(manifestFile)) {
    const manifest = JSON.parse(await readFile(manifestFile, "utf8")) as ExportManifest;
    const targetTables = await getTableCounts(targetConnectionString);
    const mismatches = Object.entries(manifest.sourceTables).filter(
      ([tableName, sourceCount]) => targetTables[tableName] !== sourceCount,
    );

    if (mismatches.length > 0) {
      throw new Error(
        `복원 후 행 수 검증 실패: ${mismatches
          .map(([tableName, sourceCount]) => `${tableName}=${sourceCount}->${targetTables[tableName] ?? 0}`)
          .join(", ")}`,
      );
    }

    console.log(`Row-count verification passed: ${Object.keys(manifest.sourceTables).length} tables`);
  } else {
    console.log("Manifest not found; restore completed without row-count verification.");
  }

  console.log(`DB import complete: ${dumpFile}`);
}

async function main(): Promise<void> {
  const operation = process.argv[2];

  if (operation === "export") {
    await exportDatabase(requireConnectionString("SOURCE_DATABASE_URL", "DATABASE_URL"));
    return;
  }

  if (operation === "import") {
    const dumpFile = process.argv[3] || process.env.DUMP_FILE;
    if (!dumpFile) {
      throw new Error("사용법: npm run db:import -- backups/database-YYYYMMDDTHHMMSSZ.dump");
    }
    await importDatabase(
      requireConnectionString("SUPABASE_DATABASE_URL", "TARGET_DATABASE_URL"),
      path.resolve(dumpFile),
    );
    return;
  }

  if (operation === "migrate") {
    const exportResult = await exportDatabase(requireConnectionString("SOURCE_DATABASE_URL", "DATABASE_URL"));
    await importDatabase(
      requireConnectionString("SUPABASE_DATABASE_URL", "TARGET_DATABASE_URL"),
      exportResult.dumpFile,
    );
    return;
  }

  throw new Error("사용법: tsx script/database-transfer.ts <export|import|migrate>");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});