import { type User, type InsertUser, type Bet, type InsertBet, type Setting, type Message, type InsertMessage, type Affiliate, type InsertAffiliate, type AffiliateCommission, type Announcement, type InsertAnnouncement, users, bets, settings, messages, affiliates, affiliateCommissions, announcements } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, sql, gte } from "drizzle-orm";

export interface UserVolume {
  userId: string;
  username: string;
  name: string;
  volume: number;
  betCount: number;
}

export interface SymbolVolume {
  symbol: string;
  volume: number;
  betCount: number;
}

export interface CommissionWithDetails {
  id: number;
  affiliateId: string;
  userId: string;
  username: string;
  betId: number;
  symbol: string;
  betAmount: string;
  commissionAmount: string;
  status: string;
  createdAt: Date;
  settledAt: Date | null;
}

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

  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesForUser(userId: string): Promise<Message[]>;
  getUnreadMessagesForUser(userId: string): Promise<Message[]>;
  markMessageAsRead(messageId: number): Promise<void>;
  markAllMessagesAsRead(userId: string): Promise<void>;

  // Affiliate methods
  createAffiliate(affiliate: InsertAffiliate): Promise<Affiliate>;
  getAffiliate(id: string): Promise<Affiliate | undefined>;
  getAffiliateByUsername(username: string): Promise<Affiliate | undefined>;
  getAffiliateByReferralCode(code: string): Promise<Affiliate | undefined>;
  getAllAffiliates(): Promise<Affiliate[]>;
  updateAffiliate(id: string, data: Partial<Affiliate>): Promise<Affiliate>;
  deleteAffiliate(id: string): Promise<void>;
  getUsersByAffiliateId(affiliateId: string): Promise<User[]>;
  getAffiliateTradingVolume(affiliateId: string, since?: Date): Promise<number>;
  getAffiliateCommissions(affiliateId: string): Promise<AffiliateCommission[]>;
  createAffiliateCommission(affiliateId: string, userId: string, betId: number, betAmount: string, commissionAmount: string): Promise<AffiliateCommission>;
  settleAffiliateCommissions(affiliateId: string): Promise<void>;
  
  // Affiliate analytics methods
  getAffiliateUserVolumes(affiliateId: string, since?: Date): Promise<UserVolume[]>;
  getAffiliateSymbolVolumes(affiliateId: string, since?: Date): Promise<SymbolVolume[]>;
  getAffiliateCommissionsWithDetails(affiliateId: string, since?: Date): Promise<CommissionWithDetails[]>;

  // Announcement methods
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getAnnouncement(id: number): Promise<Announcement | undefined>;
  getAllAnnouncements(): Promise<Announcement[]>;
  getActiveAnnouncements(): Promise<Announcement[]>;
  updateAnnouncement(id: number, data: Partial<Announcement>): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<void>;
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

  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessagesForUser(userId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.receiverId, userId))
      .orderBy(desc(messages.createdAt));
  }

  async getUnreadMessagesForUser(userId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(and(
        eq(messages.receiverId, userId),
        eq(messages.isRead, false)
      ))
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
  }

  async markAllMessagesAsRead(userId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.receiverId, userId));
  }

  // Affiliate methods
  async createAffiliate(affiliate: InsertAffiliate): Promise<Affiliate> {
    const [newAffiliate] = await db.insert(affiliates).values(affiliate).returning();
    return newAffiliate;
  }

  async getAffiliate(id: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.id, id));
    return affiliate || undefined;
  }

  async getAffiliateByUsername(username: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.username, username));
    return affiliate || undefined;
  }

  async getAffiliateByReferralCode(code: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.referralCode, code));
    return affiliate || undefined;
  }

  async getAllAffiliates(): Promise<Affiliate[]> {
    return await db.select().from(affiliates).orderBy(desc(affiliates.createdAt));
  }

  async updateAffiliate(id: string, data: Partial<Affiliate>): Promise<Affiliate> {
    const [updated] = await db.update(affiliates)
      .set(data)
      .where(eq(affiliates.id, id))
      .returning();
    return updated;
  }

  async deleteAffiliate(id: string): Promise<void> {
    // Also remove affiliate reference from users
    await db.update(users)
      .set({ affiliateId: null })
      .where(eq(users.affiliateId, id));
    await db.delete(affiliateCommissions).where(eq(affiliateCommissions.affiliateId, id));
    await db.delete(affiliates).where(eq(affiliates.id, id));
  }

  async getUsersByAffiliateId(affiliateId: string): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.affiliateId, affiliateId))
      .orderBy(desc(users.createdAt));
  }

  async getAffiliateTradingVolume(affiliateId: string, since?: Date): Promise<number> {
    const affiliateUsers = await this.getUsersByAffiliateId(affiliateId);
    if (affiliateUsers.length === 0) return 0;

    const userIds = affiliateUsers.map(u => u.id);
    let allBets: Bet[] = [];
    
    for (const userId of userIds) {
      const userBets = await this.getBets(userId);
      allBets = allBets.concat(userBets);
    }

    if (since) {
      allBets = allBets.filter(bet => bet.createdAt >= since);
    }

    return allBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
  }

  async getAffiliateCommissions(affiliateId: string): Promise<AffiliateCommission[]> {
    return await db.select().from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateId, affiliateId))
      .orderBy(desc(affiliateCommissions.createdAt));
  }

  async createAffiliateCommission(affiliateId: string, userId: string, betId: number, betAmount: string, commissionAmount: string): Promise<AffiliateCommission> {
    const [commission] = await db.insert(affiliateCommissions)
      .values({ affiliateId, userId, betId, betAmount, commissionAmount })
      .returning();
    
    // Update affiliate pending commission
    const affiliate = await this.getAffiliate(affiliateId);
    if (affiliate) {
      const newPending = (parseFloat(affiliate.pendingCommission || '0') + parseFloat(commissionAmount)).toString();
      await this.updateAffiliate(affiliateId, { pendingCommission: newPending });
    }

    return commission;
  }

  async settleAffiliateCommissions(affiliateId: string): Promise<void> {
    const affiliate = await this.getAffiliate(affiliateId);
    if (!affiliate) return;

    // Mark all pending commissions as settled
    await db.update(affiliateCommissions)
      .set({ status: 'settled', settledAt: new Date() })
      .where(and(
        eq(affiliateCommissions.affiliateId, affiliateId),
        eq(affiliateCommissions.status, 'pending')
      ));

    // Move pending to total and reset pending
    const newTotal = (parseFloat(affiliate.totalCommission || '0') + parseFloat(affiliate.pendingCommission || '0')).toString();
    await this.updateAffiliate(affiliateId, {
      totalCommission: newTotal,
      pendingCommission: '0',
    });
  }

  async getAffiliateUserVolumes(affiliateId: string, since?: Date): Promise<UserVolume[]> {
    const affiliateUsers = await this.getUsersByAffiliateId(affiliateId);
    if (affiliateUsers.length === 0) return [];

    const results: UserVolume[] = [];
    for (const user of affiliateUsers) {
      let userBets = await this.getBets(user.id);
      if (since) {
        userBets = userBets.filter(bet => bet.createdAt >= since);
      }
      const volume = userBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
      results.push({
        userId: user.id,
        username: user.username,
        name: user.name || user.username,
        volume,
        betCount: userBets.length,
      });
    }
    return results.sort((a, b) => b.volume - a.volume);
  }

  async getAffiliateSymbolVolumes(affiliateId: string, since?: Date): Promise<SymbolVolume[]> {
    const affiliateUsers = await this.getUsersByAffiliateId(affiliateId);
    if (affiliateUsers.length === 0) return [];

    const userIds = affiliateUsers.map(u => u.id);
    let allBets: Bet[] = [];
    for (const userId of userIds) {
      const userBets = await this.getBets(userId);
      allBets = allBets.concat(userBets);
    }

    if (since) {
      allBets = allBets.filter(bet => bet.createdAt >= since);
    }

    const symbolMap: Record<string, { volume: number; betCount: number }> = {};
    for (const bet of allBets) {
      if (!symbolMap[bet.symbol]) {
        symbolMap[bet.symbol] = { volume: 0, betCount: 0 };
      }
      symbolMap[bet.symbol].volume += parseFloat(bet.amount);
      symbolMap[bet.symbol].betCount += 1;
    }

    return Object.entries(symbolMap)
      .map(([symbol, data]) => ({ symbol, ...data }))
      .sort((a, b) => b.volume - a.volume);
  }

  async getAffiliateCommissionsWithDetails(affiliateId: string, since?: Date): Promise<CommissionWithDetails[]> {
    const commissions = await this.getAffiliateCommissions(affiliateId);
    const results: CommissionWithDetails[] = [];

    for (const commission of commissions) {
      if (since && commission.createdAt < since) continue;
      
      const user = await this.getUser(commission.userId);
      const bet = await this.getBet(commission.betId);
      
      results.push({
        id: commission.id,
        affiliateId: commission.affiliateId,
        userId: commission.userId,
        username: user?.username || 'Unknown',
        betId: commission.betId,
        symbol: bet?.symbol || 'Unknown',
        betAmount: commission.betAmount,
        commissionAmount: commission.commissionAmount,
        status: commission.status,
        createdAt: commission.createdAt,
        settledAt: commission.settledAt,
      });
    }

    return results;
  }

  // Announcement methods
  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [created] = await db.insert(announcements)
      .values(announcement)
      .returning();
    return created;
  }

  async getAnnouncement(id: number): Promise<Announcement | undefined> {
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    return announcement || undefined;
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements)
      .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements)
      .where(eq(announcements.isActive, true))
      .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
  }

  async updateAnnouncement(id: number, data: Partial<Announcement>): Promise<Announcement> {
    const [updated] = await db.update(announcements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return updated;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }
}

export const storage = new DatabaseStorage();
