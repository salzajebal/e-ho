import { type User, type InsertUser, type Bet, type InsertBet, type Setting, users, bets, settings } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, newBalance: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getPendingUsers(): Promise<User[]>;
  approveUser(userId: string): Promise<User>;
  rejectUser(userId: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;
  updateUserStats(userId: string, betAmount: number, winAmount: number): Promise<void>;

  // Bet methods
  getBets(userId: string, outcome?: string): Promise<Bet[]>;
  getActiveBets(userId: string): Promise<Bet[]>;
  getBet(id: number): Promise<Bet | undefined>;
  createBet(bet: InsertBet): Promise<Bet>;
  settleBet(id: number, closePrice: string, outcome: 'win' | 'lose', payout: string): Promise<Bet>;
  getExpiredPendingBets(): Promise<Bet[]>;
  getAllBets(): Promise<Bet[]>;
  getUserBetStats(userId: string): Promise<{ totalBet: number; totalWin: number; betCount: number; winCount: number }>;

  // Settings methods
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getPendingUsers(): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.approvalStatus, 'pending'))
      .orderBy(desc(users.createdAt));
  }

  async approveUser(userId: string): Promise<User> {
    const [updated] = await db.update(users)
      .set({ approvalStatus: 'approved' })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async rejectUser(userId: string): Promise<User> {
    const [updated] = await db.update(users)
      .set({ approvalStatus: 'rejected' })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [updated] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(bets).where(eq(bets.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async updateLastLogin(userId: string): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserStats(userId: string, betAmount: number, winAmount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const newTotalBet = (parseFloat(user.totalBet || '0') + betAmount).toString();
    const newTotalWin = (parseFloat(user.totalWin || '0') + winAmount).toString();

    await db.update(users)
      .set({ 
        totalBet: newTotalBet,
        totalWin: newTotalWin,
      })
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

  async getAllBets(): Promise<Bet[]> {
    return await db.select().from(bets).orderBy(desc(bets.createdAt));
  }

  async getUserBetStats(userId: string): Promise<{ totalBet: number; totalWin: number; betCount: number; winCount: number }> {
    const userBets = await this.getBets(userId);
    const settledBets = userBets.filter(b => b.outcome !== 'pending');
    
    const totalBet = settledBets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const totalWin = settledBets
      .filter(b => b.outcome === 'win')
      .reduce((sum, b) => sum + parseFloat(b.payout || '0'), 0);
    const betCount = settledBets.length;
    const winCount = settledBets.filter(b => b.outcome === 'win').length;

    return { totalBet, totalWin, betCount, winCount };
  }

  async updateBetOutcome(betId: number, outcome: 'win' | 'lose', closePrice: string): Promise<Bet> {
    const bet = await this.getBet(betId);
    if (!bet) throw new Error("Bet not found");

    const betAmount = parseFloat(bet.amount);
    const multiplier = parseFloat(bet.multiplier);
    const payout = outcome === 'win' ? (betAmount * multiplier).toString() : '0';

    const [updated] = await db.update(bets)
      .set({ 
        outcome,
        closePrice,
        payout,
        settledAt: new Date(),
      })
      .where(eq(bets.id, betId))
      .returning();

    return updated;
  }

  async getAllBetsWithUsers(): Promise<(Bet & { username: string })[]> {
    const allBets = await db.select().from(bets).orderBy(desc(bets.createdAt));
    const allUsers = await this.getAllUsers();
    const userMap = new Map(allUsers.map(u => [u.id, u.username]));

    return allBets.map(bet => ({
      ...bet,
      username: userMap.get(bet.userId) || 'Unknown',
    }));
  }

  // Settings methods
  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db.insert(settings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });
  }
}

export const storage = new DatabaseStorage();
