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
        password: 'admin123',
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
  } catch (error) {
    console.error('Database initialization failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}
