import { readFile } from "node:fs/promises";

const lockfilePath = new URL("../package-lock.json", import.meta.url);
const lockfile = await readFile(lockfilePath, "utf8");

if (lockfile.includes("package-firewall.replit.local")) {
  console.error(
    "package-lock.json contains Replit-internal package URLs. Regenerate or repair the lockfile with public npm registry URLs before deploying to Render.",
  );
  process.exit(1);
}

console.log("Render lockfile check passed.");