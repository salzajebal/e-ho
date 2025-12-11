import { type User, type InsertUser, type Position, type InsertPosition, type Trade, type InsertTrade, users, positions, trades } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, newBalance: string): Promise<void>;

  // Position methods
  getPositions(userId: string, isOpen?: boolean): Promise<Position[]>;
  getPosition(id: number): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, updates: Partial<InsertPosition>): Promise<Position>;
  closePosition(id: number, closePrice: string, pnl: string): Promise<Position>;

  // Trade methods
  getTrades(userId: string, limit?: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
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

  // Position methods
  async getPositions(userId: string, isOpen?: boolean): Promise<Position[]> {
    const conditions = [eq(positions.userId, userId)];
    if (isOpen !== undefined) {
      conditions.push(eq(positions.isOpen, isOpen));
    }
    return await db.select().from(positions)
      .where(and(...conditions))
      .orderBy(desc(positions.openedAt));
  }

  async getPosition(id: number): Promise<Position | undefined> {
    const [position] = await db.select().from(positions).where(eq(positions.id, id));
    return position || undefined;
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const [newPosition] = await db
      .insert(positions)
      .values(position)
      .returning();
    return newPosition;
  }

  async updatePosition(id: number, updates: Partial<InsertPosition>): Promise<Position> {
    const [updated] = await db
      .update(positions)
      .set(updates)
      .where(eq(positions.id, id))
      .returning();
    return updated;
  }

  async closePosition(id: number, closePrice: string, pnl: string): Promise<Position> {
    const [closed] = await db
      .update(positions)
      .set({ 
        isOpen: false, 
        closedAt: new Date(),
        markPrice: closePrice,
        pnl
      })
      .where(eq(positions.id, id))
      .returning();
    return closed;
  }

  // Trade methods
  async getTrades(userId: string, limit: number = 50): Promise<Trade[]> {
    return await db.select().from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.executedAt))
      .limit(limit);
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const [newTrade] = await db
      .insert(trades)
      .values(trade)
      .returning();
    return newTrade;
  }
}

export const storage = new DatabaseStorage();
