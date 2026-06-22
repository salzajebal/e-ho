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
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Branches table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS affiliates (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        display_name TEXT NOT NULL,
        phone TEXT,
        referral_code TEXT NOT NULL UNIQUE,
        commission_rate DECIMAL(5, 2) NOT NULL DEFAULT '5.00',
        total_commission DECIMAL(20, 0) NOT NULL DEFAULT '0',
        pending_commission DECIMAL(20, 0) NOT NULL DEFAULT '0',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Affiliates table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        phone TEXT,
        birth_date TEXT,
        resident_number TEXT,
        region TEXT,
        bank_name TEXT,
        account_holder TEXT,
        account_number TEXT,
        balance DECIMAL(20, 0) NOT NULL DEFAULT '0',
        total_deposit DECIMAL(20, 0) NOT NULL DEFAULT '0',
        total_withdrawal DECIMAL(20, 0) NOT NULL DEFAULT '0',
        total_bet DECIMAL(20, 0) NOT NULL DEFAULT '0',
        total_win DECIMAL(20, 0) NOT NULL DEFAULT '0',
        role TEXT NOT NULL DEFAULT 'user',
        branch_code TEXT,
        affiliate_id VARCHAR,
        is_active BOOLEAN NOT NULL DEFAULT true,
        approval_status TEXT NOT NULL DEFAULT 'pending',
        last_login_at TIMESTAMP,
        last_login_ip TEXT,
        auto_bet_enabled BOOLEAN NOT NULL DEFAULT false,
        auto_bet_multiplier REAL NOT NULL DEFAULT 10,
        is_betting_blocked BOOLEAN NOT NULL DEFAULT false,
        forced_bet_direction TEXT,
        max_execution_enabled BOOLEAN NOT NULL DEFAULT true,
        pending_balance_adjustment DECIMAL(20, 0) NOT NULL DEFAULT '0',
        grade TEXT NOT NULL DEFAULT '브론즈',
        always_pending_enabled BOOLEAN NOT NULL DEFAULT false,
        telegram_notify_enabled BOOLEAN NOT NULL DEFAULT false,
        withdrawal_password TEXT,
        is_withdrawal_locked BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // 기존 테이블에 누락된 컬럼 추가 (마이그레이션)
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS withdrawal_password TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_withdrawal_locked BOOLEAN NOT NULL DEFAULT false`);
    console.log('Users table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS bets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        symbol TEXT NOT NULL,
        direction TEXT NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        duration INTEGER NOT NULL,
        round_number INTEGER NOT NULL DEFAULT 1,
        strike_price DECIMAL(20, 8) NOT NULL,
        close_price DECIMAL(20, 8),
        payout DECIMAL(20, 8),
        multiplier DECIMAL(5, 2) NOT NULL DEFAULT '2.00',
        outcome TEXT NOT NULL DEFAULT 'pending',
        forced_outcome TEXT,
        max_execution_applied BOOLEAN NOT NULL DEFAULT false,
        original_amount DECIMAL(20, 8),
        balance_before DECIMAL(20, 8),
        balance_after DECIMAL(20, 8),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        settled_at TIMESTAMP
      )
    `);
    console.log('Bets table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS round_forced_directions (
        id SERIAL PRIMARY KEY,
        symbol TEXT NOT NULL,
        duration INTEGER NOT NULL,
        round_number INTEGER NOT NULL,
        forced_direction TEXT NOT NULL,
        date_key TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Round forced directions table ready');

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
        deleted_for_user BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Messages table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        display_date TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Announcements table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS affiliate_commissions (
        id SERIAL PRIMARY KEY,
        affiliate_id VARCHAR NOT NULL,
        user_id VARCHAR NOT NULL,
        bet_id INTEGER NOT NULL,
        bet_amount DECIMAL(20, 0) NOT NULL,
        commission_amount DECIMAL(20, 0) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        settled_at TIMESTAMP
      )
    `);
    console.log('Affiliate commissions table ready');

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
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id SERIAL PRIMARY KEY,
        ip_address TEXT NOT NULL UNIQUE,
        reason TEXT,
        blocked_by VARCHAR NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Blocked IPs table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS maintenance_symbols (
        id SERIAL PRIMARY KEY,
        symbol TEXT NOT NULL UNIQUE,
        reason TEXT,
        started_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR NOT NULL
      )
    `);
    console.log('Maintenance symbols table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS transaction_requests (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        amount DECIMAL(20, 0) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        bank_name TEXT,
        account_holder TEXT,
        account_number TEXT,
        sender_name TEXT,
        admin_note TEXT,
        processed_by VARCHAR,
        processed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Transaction requests table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        reply TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        replied_by VARCHAR,
        replied_at TIMESTAMP,
        is_reply_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Inquiries table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS round_results (
        id SERIAL PRIMARY KEY,
        symbol TEXT NOT NULL,
        duration INTEGER NOT NULL,
        round_number INTEGER NOT NULL,
        round_date TEXT NOT NULL,
        open_price DECIMAL(20, 8) NOT NULL,
        close_price DECIMAL(20, 8) NOT NULL,
        high_price DECIMAL(20, 8) NOT NULL,
        low_price DECIMAL(20, 8) NOT NULL,
        direction TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Round results table ready');

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
      CREATE TABLE IF NOT EXISTS inquiry_templates (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Inquiry templates table ready');

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

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        CONSTRAINT "user_sessions_pkey" PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON user_sessions (expire)
    `);
    console.log('Session table ready');

    client.release();

    console.log('Seeding admin user...');
    // Check for old admin username first (migration)
    const [oldAdmin] = await db.select().from(schema.users).where(eq(schema.users.username, 'admin'));
    if (oldAdmin) {
      await db.update(schema.users)
        .set({ username: 'gemi488', password: '488153', approvalStatus: 'approved' })
        .where(eq(schema.users.username, 'admin'));
      console.log('Admin user migrated: admin → gemi488');
    }

    const [existingAdmin] = await db.select().from(schema.users).where(eq(schema.users.username, 'gemi488'));

    if (!existingAdmin) {
      await db.insert(schema.users).values({
        username: 'gemi488',
        password: '488153',
        name: '관리자',
        role: 'admin',
        balance: '100000000',
        approvalStatus: 'approved',
      });
      console.log('Admin user created: gemi488');
    } else {
      await db.update(schema.users)
        .set({ approvalStatus: 'approved', password: '488153' })
        .where(eq(schema.users.username, 'gemi488'));
      console.log('Admin user verified: gemi488');
    }

    console.log('Database initialization complete');

  } catch (error) {
    console.error('Database initialization failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}
