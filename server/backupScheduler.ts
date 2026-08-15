import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import cron from "node-cron";

const execAsync = promisify(exec);

const REPO_ROOT = path.resolve(process.cwd());
const BACKUP_FILE = "production_backup.sql";

export async function runDatabaseBackup(): Promise<{ success: boolean; message: string }> {
  const dbUrl = process.env.DATABASE_URL;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!dbUrl) {
    return { success: false, message: "DATABASE_URL 환경변수가 없습니다." };
  }
  if (!githubToken) {
    return { success: false, message: "GITHUB_TOKEN 환경변수가 없습니다." };
  }

  try {
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kst = new Date(now.getTime() + kstOffset);
    const dateStr = kst.toISOString().slice(0, 16).replace("T", " ");

    console.log(`[Backup] DB 백업 시작: ${dateStr} KST`);

    // 1. pg_dump 실행 (헤더 + INSERT 포맷)
    const tables = [
      "branches",
      "affiliates",
      "users",
      "bets",
      "transaction_requests",
      "login_history",
      "announcements",
      "blocked_ips",
      "inquiries",
      "messages",
      "round_forced_directions",
      "settings",
      "user_sessions",
    ];

    const tableArgs = tables.map((t) => `-t ${t}`).join(" ");
    const dumpCmd = `pg_dump "${dbUrl}" ${tableArgs} --column-inserts --data-only --no-owner --no-acl`;

    const { stdout: rawDump } = await execAsync(dumpCmd, {
      cwd: REPO_ROOT,
      env: { ...process.env, PGPASSWORD: undefined },
      maxBuffer: 50 * 1024 * 1024,
    });

    // 헤더 추가
    const header = [
      `-- Production Database Backup`,
      `-- Generated: ${now.toISOString()}`,
      `-- Tables: ${tables.join(", ")}`,
      "",
      `SET client_encoding = 'UTF8';`,
      `SET standard_conforming_strings = on;`,
      "",
    ].join("\n");

    const fullDump = header + rawDump;

    // 2. 파일 저장
    const { writeFileSync } = await import("fs");
    writeFileSync(path.join(REPO_ROOT, BACKUP_FILE), fullDump, "utf-8");
    console.log(`[Backup] ${BACKUP_FILE} 저장 완료`);

    // 3. git 원격에 토큰 인라인 설정
    const remoteUrl = await execAsync("git remote get-url origin", { cwd: REPO_ROOT });
    const originUrl = remoteUrl.stdout.trim();

    // https://TOKEN@github.com/... 형태로 변환
    const authedUrl = originUrl.replace(
      /^https:\/\//,
      `https://${githubToken}@`
    );

    // 4. git add → commit → push
    await execAsync(`git config user.email "backup-bot@gemini.app"`, { cwd: REPO_ROOT });
    await execAsync(`git config user.name "Gemini Backup Bot"`, { cwd: REPO_ROOT });
    await execAsync(`git add ${BACKUP_FILE}`, { cwd: REPO_ROOT });

    // 변경사항이 없으면 건너뜀
    const { stdout: statusOut } = await execAsync("git status --porcelain", { cwd: REPO_ROOT });
    if (!statusOut.trim()) {
      console.log("[Backup] 변경사항 없음 — 커밋 건너뜀");
      return { success: true, message: "변경사항 없음 — 백업 데이터 동일" };
    }

    await execAsync(`git commit -m "chore: 프로덕션 DB 자동 백업 (${dateStr} KST)"`, { cwd: REPO_ROOT });
    await execAsync(`git push "${authedUrl}" main`, { cwd: REPO_ROOT });

    const msg = `백업 완료: ${dateStr} KST`;
    console.log(`[Backup] ✅ ${msg}`);
    return { success: true, message: msg };

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Backup] ❌ 오류:", message);
    return { success: false, message };
  }
}

/**
 * 매일 새벽 3시 KST (18:00 UTC)에 자동 백업 실행
 */
export function startBackupScheduler(): void {
  // 새벽 3시 KST = UTC 18시
  cron.schedule("0 18 * * *", async () => {
    console.log("[Backup] 🕑 정기 백업 시작 (매일 새벽 3시 KST)");
    const result = await runDatabaseBackup();
    if (!result.success) {
      console.error("[Backup] 정기 백업 실패:", result.message);
    }
  });

  console.log("[Backup] 스케줄러 등록 완료 (매일 새벽 3시 KST 자동 백업)");
}
