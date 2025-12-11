import { type User, type InsertUser, type Bet, type InsertBet, users, bets } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, newBalance: string): Promise<void>;

  // Bet methods
  getBets(userId: string, outcome?: string): Promise<Bet[]>;
  getActiveBets(userId: string): Promise<Bet[]>;
  getBet(id: number): Promise<Bet | undefined>;
  createBet(bet: InsertBet): Promise<Bet>;
  settleBet(id: number, closePrice: string, outcome: 'win' | 'lose', payout: string): Promise<Bet>;
  getExpiredPendingBets(): Promise<Bet[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<void> {
    await db.update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId));
  }

  // Bet methods
  async getBets(userId: string, outcome?: string): Promise<Bet[]> {
    const conditions = [eq(bets.userId, userId)];
    if (outcome !== undefined) {
      conditions.push(eq(bets.outcome, outcome));
    }
    return await db.select().from(bets)
      .where(and(...conditions))
      .orderBy(desc(bets.createdAt));
  }

  async getActiveBets(userId: string): Promise<Bet[]> {
    return await db.select().from(bets)
      .where(and(
        eq(bets.userId, userId),
        eq(bets.outcome, 'pending')
      ))
      .orderBy(desc(bets.createdAt));
  }

  async getBet(id: number): Promise<Bet | undefined> {
    const [bet] = await db.select().from(bets).where(eq(bets.id, id));
    return bet || undefined;
  }

  async createBet(bet: InsertBet): Promise<Bet> {
    const [newBet] = await db
      .insert(bets)
      .values(bet)
      .returning();
    return newBet;
  }

  async settleBet(id: number, closePrice: string, outcome: 'win' | 'lose', payout: string): Promise<Bet> {
    const [settled] = await db
      .update(bets)
      .set({ 
        closePrice,
        outcome,
        payout,
        settledAt: new Date(),
      })
      .where(eq(bets.id, id))
      .returning();
    return settled;
  }

  async getExpiredPendingBets(): Promise<Bet[]> {
    return await db.select().from(bets)
      .where(and(
        eq(bets.outcome, 'pending'),
        lt(bets.expiresAt, new Date())
      ));
  }
}

export const storage = new DatabaseStorage();
