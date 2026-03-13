import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set. Did you forget to provision a database?");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("Initializing database connection...");
console.log("Database URL prefix:", process.env.DATABASE_URL?.substring(0, 30) + "...");

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 20,
  statement_timeout: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

pool.on('connect', () => {
  console.log('Database pool connected');
});

export const db = drizzle(pool, { schema });

export async function testConnection(): Promise<boolean> {
  const maxRetries = 5;
  const baseDelay = 2000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Testing database connection (attempt ${attempt}/${maxRetries})...`);
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as time');
      client.release();
      console.log('Database connection test successful at:', result.rows[0]?.time);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Database connection attempt ${attempt} failed:`, errorMessage);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('All database connection attempts failed');
  return false;
}

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database schema...');
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        phone TEXT,
        bank_name TEXT,
        account_holder TEXT,
        account_number TEXT,
        balance DECIMAL(20, 0) NOT NULL DEFAULT '0',
        total_deposit DECIMAL(20, 0) NOT NULL DEFAULT '0',
        total_withdrawal DECIMAL(20, 0) NOT NULL DEFAULT '0',
        total_bet DECIMAL(20, 0) NOT NULL DEFAULT '0',
        total_win DECIMAL(20, 0) NOT NULL DEFAULT '0',
        role TEXT NOT NULL DEFAULT 'user',
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Users table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS bets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        symbol TEXT NOT NULL,
        direction TEXT NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        duration INTEGER NOT NULL,
        strike_price DECIMAL(20, 8) NOT NULL,
        close_price DECIMAL(20, 8),
        payout DECIMAL(20, 8),
        multiplier DECIMAL(5, 2) NOT NULL DEFAULT '2.00',
        outcome TEXT NOT NULL DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        settled_at TIMESTAMP
      )
    `);
    console.log('Bets table ready');

    try {
      await client.query(`DROP INDEX IF EXISTS idx_bets_user_round`);
    } catch (e) {
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Settings table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR NOT NULL REFERENCES users(id),
        receiver_id VARCHAR NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Messages table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS affiliate_settlements (
        id SERIAL PRIMARY KEY,
        affiliate_id VARCHAR NOT NULL,
        amount DECIMAL(20, 0) NOT NULL,
        memo TEXT,
        settled_by VARCHAR NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Affiliate settlements table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        username TEXT NOT NULL,
        ip TEXT NOT NULL,
        user_agent TEXT,
        login_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Login history table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS forex_candles (
        id SERIAL PRIMARY KEY,
        symbol TEXT NOT NULL,
        duration INTEGER NOT NULL,
        time INTEGER NOT NULL,
        open DECIMAL(15, 6) NOT NULL,
        high DECIMAL(15, 6) NOT NULL,
        low DECIMAL(15, 6) NOT NULL,
        close DECIMAL(15, 6) NOT NULL,
        UNIQUE(symbol, duration, time)
      )
    `);
    console.log('Forex candles table ready');

    // Ensure all admin users are approved (migration for existing data)
    await client.query(`
      UPDATE users SET approval_status = 'approved' WHERE role = 'admin' AND approval_status != 'approved'
    `);
    console.log('Admin users approval status verified');
    
    client.release();

    console.log('Seeding admin user if not exists...');
    const [existingAdmin] = await db.select().from(schema.users).where(eq(schema.users.username, 'admin'));
    
    if (!existingAdmin) {
      await db.insert(schema.users).values({
        username: 'admin',
        password: 'admin5882',
        name: '관리자',
        role: 'admin',
        balance: '100000000',
        approvalStatus: 'approved',
      });
      console.log('Admin user created: admin/admin123');
    } else {
      // Ensure existing admin is approved
      if (existingAdmin.approvalStatus !== 'approved') {
        await db.update(schema.users)
          .set({ approvalStatus: 'approved' })
          .where(eq(schema.users.username, 'admin'));
        console.log('Admin user approval status updated');
      }
      console.log('Admin user already exists');
    }

    const [existingDemo] = await db.select().from(schema.users).where(eq(schema.users.username, 'demo'));
    
    if (!existingDemo) {
      await db.insert(schema.users).values({
        username: 'demo',
        password: 'demo123',
        name: '데모 사용자',
        role: 'user',
        balance: '10000000',
        approvalStatus: 'approved',
      });
      console.log('Demo user created: demo/demo123 (일반 사용자)');
    } else {
      // Ensure existing demo is approved
      if (existingDemo.approvalStatus !== 'approved') {
        await db.update(schema.users)
          .set({ approvalStatus: 'approved' })
          .where(eq(schema.users.username, 'demo'));
        console.log('Demo user approval status updated');
      }
      console.log('Demo user already exists');
    }

    console.log('Database initialization complete');

    const balanceCorrectionApplied = await db.select().from(schema.settings).where(eq(schema.settings.key, 'balance_correction_20260312'));
    if (balanceCorrectionApplied.length === 0) {
      console.log('🔧 [잔고보정] 2026-03-12 재정산 버그 잔고 보정 시작...');
      const corrections: { username: string; name: string; balance: string }[] = [
        { username: 'sunny343', name: '김숭기', balance: '1316495' },
        { username: 'pkg3232', name: '박관규', balance: '1064500' },
        { username: 'remon782', name: '허수정', balance: '1113400' },
        { username: 'Lhj09000', name: '임현주', balance: '1016800' },
        { username: 'lee0301', name: '이선희', balance: '1134150' },
        { username: '333', name: '김종국', balance: '122050' },
        { username: 'kitano mina', name: '김동복', balance: '31450' },
        { username: 'narimiya4', name: '김현빈', balance: '1023950' },
        { username: 'wks9510', name: '우경식', balance: '1134200' },
        { username: 'sky4000kr', name: '최동열', balance: '948500' },
        { username: 'ywjjao', name: '전정수', balance: '808050' },
        { username: '6464jo', name: '조철익', balance: '658950' },
        { username: 'As8114as', name: '강민성', balance: '1097800' },
      ];
      for (const c of corrections) {
        const [user] = await db.select().from(schema.users).where(eq(schema.users.username, c.username));
        if (user) {
          await db.update(schema.users).set({ balance: c.balance }).where(eq(schema.users.username, c.username));
          console.log(`  ✅ ${c.username} (${c.name}): ${parseFloat(user.balance).toLocaleString()}원 → ${parseFloat(c.balance).toLocaleString()}원`);
        } else {
          console.log(`  ⚠️ ${c.username} (${c.name}): 회원 없음`);
        }
      }
      await db.insert(schema.settings).values({ key: 'balance_correction_20260312', value: 'applied' });
      console.log('🔧 [잔고보정] 완료');
    }

    const richimamCorrection = await db.select().from(schema.settings).where(eq(schema.settings.key, 'richimam_correction_20260312'));
    if (richimamCorrection.length === 0) {
      console.log('🔧 [강삼경 보정] 글로벌 강제 우선순위 버그로 인한 베팅 결과 보정 시작...');
      const betCorrections = [
        { betId: 4407, correctOutcome: 'win' as const, roundNumber: 1063 },
        { betId: 4386, correctOutcome: 'win' as const, roundNumber: 1059 },
        { betId: 4375, correctOutcome: 'win' as const, roundNumber: 1057 },
        { betId: 4354, correctOutcome: 'win' as const, roundNumber: 1051 },
        { betId: 4289, correctOutcome: 'win' as const, roundNumber: 823 },
      ];

      const richimamId = 'a71f8323-f754-4006-8001-adc074389f02';

      for (const bc of betCorrections) {
        const [bet] = await db.select().from(schema.bets).where(eq(schema.bets.id, bc.betId));
        if (bet && bet.userId === richimamId && bet.outcome !== bc.correctOutcome) {
          const amount = parseFloat(bet.amount);
          const multiplier = parseFloat(bet.multiplier);
          const newPayout = bc.correctOutcome === 'win' ? amount * multiplier : 0;
          const strikePrice = parseFloat(bet.strikePrice);
          const variation = strikePrice * 0.001;
          const newClosePrice = bet.direction === 'long'
            ? (bc.correctOutcome === 'win' ? strikePrice + variation : strikePrice - variation)
            : (bc.correctOutcome === 'win' ? strikePrice - variation : strikePrice + variation);

          await db.update(schema.bets).set({
            outcome: bc.correctOutcome,
            payout: newPayout.toString(),
            closePrice: newClosePrice.toString(),
          }).where(eq(schema.bets.id, bc.betId));
          console.log(`  ✅ Bet #${bc.betId} R${bc.roundNumber}: ${bet.outcome} → ${bc.correctOutcome}, 배당: ${newPayout.toLocaleString()}원`);
        }
      }

      const [richimam] = await db.select().from(schema.users).where(eq(schema.users.id, richimamId));
      if (richimam) {
        const currentBalance = parseFloat(richimam.balance);
        const addAmount = 405600;
        const newBalance = (currentBalance + addAmount).toString();
        await db.update(schema.users).set({ balance: newBalance }).where(eq(schema.users.id, richimamId));
        console.log(`  ✅ 강삼경 잔고: ${currentBalance.toLocaleString()}원 + ${addAmount.toLocaleString()}원 = ${parseFloat(newBalance).toLocaleString()}원`);
      }

      await db.insert(schema.settings).values({ key: 'richimam_correction_20260312', value: 'applied' });
      console.log('🔧 [강삼경 보정] 완료');
    }

  } catch (error) {
    console.error('Database initialization failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}
