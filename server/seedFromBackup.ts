import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 프로덕션 백업 SQL을 DB에 적용합니다.
 * 유저 테이블이 비어있을 때만 실행됩니다 (최초 배포 또는 초기화 상태).
 */
export async function seedFromProductionBackup(pool: pg.Pool): Promise<void> {
  try {
    // 기존 유저 수 확인 (admin 제외)
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users WHERE role != 'admin'`
    );
    const nonAdminCount = parseInt(countResult.rows[0].count, 10);

    if (nonAdminCount > 0) {
      console.log(`[Seed] 기존 유저 ${nonAdminCount}명 존재 — 백업 임포트 건너뜀`);
      return;
    }

    // 백업 파일 경로 (프로젝트 루트 기준)
    const backupPath = path.resolve(__dirname, "..", "production_backup.sql");

    if (!fs.existsSync(backupPath)) {
      console.log("[Seed] production_backup.sql 파일 없음 — 건너뜀");
      return;
    }

    console.log("[Seed] 프로덕션 백업 데이터 임포트 시작...");

    const sql = fs.readFileSync(backupPath, "utf-8");

    // 각 INSERT 문을 파싱하여 실행
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // SET 구문 제거, INSERT 문만 추출
      const insertStatements = sql
        .split("\n")
        .filter((line) => line.trim().startsWith("INSERT INTO"))
        .join("\n");

      if (insertStatements.trim()) {
        await client.query(insertStatements);
      }

      await client.query("COMMIT");
      console.log("[Seed] 프로덕션 백업 데이터 임포트 완료 ✅");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("[Seed] 임포트 중 오류 발생 — 롤백:", err instanceof Error ? err.message : err);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[Seed] seedFromProductionBackup 오류:", err instanceof Error ? err.message : err);
  }
}
