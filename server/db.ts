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
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    client.release();
    console.log('Database connection test successful at:', result.rows[0]?.time);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error instanceof Error ? error.message : error);
    return false;
  }
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
        balance DECIMAL(20, 0) NOT NULL DEFAULT '10000000',
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
        multiplier DECIMAL(5, 2) NOT NULL DEFAULT '1.90',
        outcome TEXT NOT NULL DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        settled_at TIMESTAMP
      )
    `);
    console.log('Bets table ready');
    
    client.release();
    
    console.log('Seeding admin user if not exists...');
    const [existingAdmin] = await db.select().from(schema.users).where(eq(schema.users.username, 'admin'));
    
    if (!existingAdmin) {
      await db.insert(schema.users).values({
        username: 'admin',
        password: 'admin123',
        name: '관리자',
        role: 'admin',
        balance: '100000000',
      });
      console.log('Admin user created: admin/admin123');
    } else {
      console.log('Admin user already exists');
    }

    const [existingDemo] = await db.select().from(schema.users).where(eq(schema.users.username, 'demo'));
    
    if (!existingDemo) {
      await db.insert(schema.users).values({
        username: 'demo',
        password: 'demo123',
        name: '데모 사용자',
        role: 'admin',
        balance: '50000000',
      });
      console.log('Demo user created: demo/demo123');
    } else {
      console.log('Demo user already exists');
    }

    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}
