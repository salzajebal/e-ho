import { type User, type InsertUser, type Bet, type InsertBet, type Setting, type Message, type InsertMessage, type Affiliate, type InsertAffiliate, type AffiliateCommission, type AffiliateSettlement, type InsertAffiliateSettlement, type Announcement, type InsertAnnouncement, type BlockedIp, type InsertBlockedIp, type MaintenanceSymbol, type InsertMaintenanceSymbol, type TransactionRequest, type InsertTransactionRequest, type Inquiry, type InsertInquiry, type RoundResult, type InsertRoundResult, type LoginHistory, type InsertLoginHistory, type InquiryTemplate, type InsertInquiryTemplate, type RoundForcedDirection, type InsertRoundForcedDirection, users, bets, settings, messages, affiliates, affiliateCommissions, affiliateSettlements, announcements, blockedIps, maintenanceSymbols, transactionRequests, inquiries, roundResults, loginHistory, inquiryTemplates, roundForcedDirections } from "@shared/schema";
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

export interface DailyStats {
  date: string;
  totalBetAmount: number;
  totalPayoutAmount: number;
  houseProfitLoss: number;
  betCount: number;
  winCount: number;
  loseCount: number;
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
  holdUser(userId: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  updateLastLogin(userId: string, ip?: string): Promise<void>;
  updateUserStats(userId: string, betAmount: number, winAmount: number): Promise<void>;
  setPendingBalanceAdjustment(userId: string, amount: string): Promise<void>;
  applyPendingBalanceAdjustment(userId: string): Promise<string>;

  // Bet methods
  getBets(userId: string, outcome?: string): Promise<Bet[]>;
  getActiveBets(userId: string): Promise<Bet[]>;
  getBet(id: number): Promise<Bet | undefined>;
  createBet(bet: InsertBet): Promise<Bet>;
  settleBet(id: number, closePrice: string, outcome: 'win' | 'lose', payout: string): Promise<Bet>;
  setForcedOutcome(betId: number, forcedOutcome: 'win' | 'lose' | null): Promise<Bet>;
  getExpiredPendingBets(): Promise<Bet[]>;
  getAllBets(): Promise<Bet[]>;
  getUserBetStats(userId: string): Promise<{ totalBet: number; totalWin: number; betCount: number; winCount: number }>;
  deleteAllBetsForUser(userId: string): Promise<number>;

  // Settings methods
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;

  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesForUser(userId: string): Promise<Message[]>;
  getUnreadMessagesForUser(userId: string): Promise<Message[]>;
  getAllMessagesForAdmin(userId: string): Promise<Message[]>;
  softDeleteMessageForUser(messageId: number): Promise<void>;
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

  // Blocked IP methods
  addBlockedIp(ip: InsertBlockedIp): Promise<BlockedIp>;
  removeBlockedIp(id: number): Promise<void>;
  getAllBlockedIps(): Promise<BlockedIp[]>;
  isIpBlocked(ipAddress: string): Promise<boolean>;

  // Maintenance symbol methods
  addMaintenanceSymbol(symbol: InsertMaintenanceSymbol): Promise<MaintenanceSymbol>;
  removeMaintenanceSymbol(id: number): Promise<void>;
  getAllMaintenanceSymbols(): Promise<MaintenanceSymbol[]>;
  isSymbolUnderMaintenance(symbol: string): Promise<boolean>;

  // Affiliate settlement methods
  createAffiliateSettlement(settlement: InsertAffiliateSettlement): Promise<AffiliateSettlement>;
  getAffiliateSettlements(affiliateId: string): Promise<AffiliateSettlement[]>;
  getAllAffiliateSettlements(): Promise<(AffiliateSettlement & { affiliateName?: string })[]>;
  getAffiliateTotalSettled(affiliateId: string): Promise<number>;

  // Transaction request methods (입출금 신청)
  createTransactionRequest(request: InsertTransactionRequest): Promise<TransactionRequest>;
  getTransactionRequest(id: number): Promise<TransactionRequest | undefined>;
  getTransactionRequestsForUser(userId: string): Promise<TransactionRequest[]>;
  getPendingTransactionRequests(): Promise<TransactionRequest[]>;
  getAllTransactionRequests(): Promise<TransactionRequest[]>;
  processTransactionRequest(id: number, status: 'approved' | 'rejected' | 'hold', processedBy: string, adminNote?: string): Promise<TransactionRequest>;

  // Daily stats methods (날짜별 수익)
  getDailyStats(days?: number): Promise<DailyStats[]>;

  // Inquiry methods (1:1 문의)
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiry(id: number): Promise<Inquiry | undefined>;
  getInquiriesForUser(userId: string): Promise<Inquiry[]>;
  getAllInquiries(): Promise<Inquiry[]>;
  getPendingInquiries(): Promise<Inquiry[]>;
  replyToInquiry(id: number, reply: string, repliedBy: string): Promise<Inquiry>;
  deleteAllInquiriesForUser(userId: string): Promise<number>;

  // Round result methods (라운드 결과 - 차트 캔들용)
  createRoundResult(result: InsertRoundResult): Promise<RoundResult>;
  getRoundResults(symbol: string, duration: number, limit?: number): Promise<RoundResult[]>;
  getRoundResult(symbol: string, duration: number, roundNumber: number, roundDate: string): Promise<RoundResult | undefined>;
  upsertRoundResult(result: InsertRoundResult): Promise<RoundResult>;

  // Login history methods (로그인 기록)
  addLoginHistory(entry: InsertLoginHistory): Promise<LoginHistory>;
  getLoginHistoryForUser(userId: string): Promise<LoginHistory[]>;
  getAllLoginHistory(limit?: number): Promise<LoginHistory[]>;

  // Inquiry template methods (1:1 문의 답변 템플릿)
  createInquiryTemplate(template: InsertInquiryTemplate): Promise<InquiryTemplate>;
  getInquiryTemplate(id: number): Promise<InquiryTemplate | undefined>;
  getAllInquiryTemplates(): Promise<InquiryTemplate[]>;
  updateInquiryTemplate(id: number, data: Partial<InquiryTemplate>): Promise<InquiryTemplate>;
  deleteInquiryTemplate(id: number): Promise<void>;

  // Round forced direction methods (회차별 강제설정)
  setRoundForcedDirection(symbol: string, duration: number, roundNumber: number, dateKey: string, forcedDirection: 'up' | 'down'): Promise<RoundForcedDirection>;
  getRoundForcedDirection(symbol: string, duration: number, roundNumber: number, dateKey: string): Promise<RoundForcedDirection | undefined>;
  getRoundForcedDirectionsForDate(dateKey: string): Promise<RoundForcedDirection[]>;
  deleteRoundForcedDirection(symbol: string, duration: number, roundNumber: number, dateKey: string): Promise<void>;
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
    // Include both 'pending' and 'hold' status users
    return await db.select().from(users)
      .where(sql`${users.approvalStatus} IN ('pending', 'hold')`)
      .orderBy(desc(users.createdAt));
  }

  async holdUser(userId: string): Promise<User> {
    const [updated] = await db.update(users)
      .set({ approvalStatus: 'hold' })
      .where(eq(users.id, userId))
      .returning();
    return updated;
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
    // Delete all related data first (foreign key constraints)
    await db.delete(bets).where(eq(bets.userId, id));
    await db.delete(transactionRequests).where(eq(transactionRequests.userId, id));
    await db.delete(inquiries).where(eq(inquiries.userId, id));
    await db.delete(loginHistory).where(eq(loginHistory.userId, id));
    await db.delete(messages).where(eq(messages.senderId, id));
    await db.delete(messages).where(eq(messages.receiverId, id));
    await db.delete(affiliateCommissions).where(eq(affiliateCommissions.userId, id));
    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async updateLastLogin(userId: string, ip?: string): Promise<void> {
    const updateData: { lastLoginAt: Date; lastLoginIp?: string } = { lastLoginAt: new Date() };
    if (ip) {
      updateData.lastLoginIp = ip;
    }
    await db.update(users)
      .set(updateData)
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

  async setPendingBalanceAdjustment(userId: string, amount: string): Promise<void> {
    await db.update(users)
      .set({ pendingBalanceAdjustment: amount })
      .where(eq(users.id, userId));
  }

  async applyPendingBalanceAdjustment(userId: string): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) return "0";

    const pendingAmount = parseFloat(user.pendingBalanceAdjustment || '0');
    if (pendingAmount === 0) return "0";

    // Reset pending amount to 0, balance will be updated separately with payout
    await db.update(users)
      .set({ pendingBalanceAdjustment: "0" })
      .where(eq(users.id, userId));

    return pendingAmount.toString();
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

  async deleteAllBetsForUser(userId: string): Promise<number> {
    const userBets = await this.getBets(userId);
    const count = userBets.length;
    await db.delete(bets).where(eq(bets.userId, userId));
    return count;
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

  async setForcedOutcome(betId: number, forcedOutcome: 'win' | 'lose' | null): Promise<Bet> {
    const [updated] = await db.update(bets)
      .set({ forcedOutcome })
      .where(eq(bets.id, betId))
      .returning();
    return updated;
  }

  async getAllBetsWithUsers(
    status?: string,
    symbol?: string,
    userId?: string
  ): Promise<(Bet & { username: string; name: string; userForcedDirection: string | null })[]> {
    let query = db.select().from(bets);
    
    const conditions = [];
    if (status) {
      conditions.push(eq(bets.outcome, status));
    }
    if (symbol) {
      conditions.push(eq(bets.symbol, symbol));
    }
    if (userId) {
      conditions.push(eq(bets.userId, userId));
    }
    
    let allBets;
    if (conditions.length > 0) {
      allBets = await db.select().from(bets)
        .where(and(...conditions))
        .orderBy(desc(bets.createdAt));
    } else {
      allBets = await db.select().from(bets).orderBy(desc(bets.createdAt));
    }
    
    const allUsers = await this.getAllUsers();
    const userMap = new Map(allUsers.map(u => [u.id, { username: u.username, name: u.name, forcedBetDirection: u.forcedBetDirection }]));

    return allBets.map(bet => ({
      ...bet,
      username: userMap.get(bet.userId)?.username || 'Unknown',
      name: userMap.get(bet.userId)?.name || 'Unknown',
      userForcedDirection: userMap.get(bet.userId)?.forcedBetDirection || null,
    }));
  }

  async updateBetAmount(betId: number, newAmount: string): Promise<Bet> {
    const [updated] = await db.update(bets)
      .set({ amount: newAmount })
      .where(eq(bets.id, betId))
      .returning();
    return updated;
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
      .where(and(
        eq(messages.receiverId, userId),
        eq(messages.deletedForUser, false)
      ))
      .orderBy(desc(messages.createdAt));
  }

  async getUnreadMessagesForUser(userId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(and(
        eq(messages.receiverId, userId),
        eq(messages.isRead, false),
        eq(messages.deletedForUser, false)
      ))
      .orderBy(desc(messages.createdAt));
  }

  async getAllMessagesForAdmin(userId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.receiverId, userId))
      .orderBy(desc(messages.createdAt));
  }

  async softDeleteMessageForUser(messageId: number): Promise<void> {
    await db.update(messages)
      .set({ deletedForUser: true })
      .where(eq(messages.id, messageId));
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

  // Blocked IP methods
  async addBlockedIp(ip: InsertBlockedIp): Promise<BlockedIp> {
    const [created] = await db.insert(blockedIps)
      .values(ip)
      .returning();
    return created;
  }

  async removeBlockedIp(id: number): Promise<void> {
    await db.delete(blockedIps).where(eq(blockedIps.id, id));
  }

  async getAllBlockedIps(): Promise<BlockedIp[]> {
    return await db.select().from(blockedIps).orderBy(desc(blockedIps.createdAt));
  }

  async isIpBlocked(ipAddress: string): Promise<boolean> {
    const [blocked] = await db.select().from(blockedIps).where(eq(blockedIps.ipAddress, ipAddress));
    return !!blocked;
  }

  // Maintenance symbol methods
  async addMaintenanceSymbol(symbol: InsertMaintenanceSymbol): Promise<MaintenanceSymbol> {
    const [created] = await db.insert(maintenanceSymbols)
      .values(symbol)
      .returning();
    return created;
  }

  async removeMaintenanceSymbol(id: number): Promise<void> {
    await db.delete(maintenanceSymbols).where(eq(maintenanceSymbols.id, id));
  }

  async getAllMaintenanceSymbols(): Promise<MaintenanceSymbol[]> {
    return await db.select().from(maintenanceSymbols).orderBy(desc(maintenanceSymbols.startedAt));
  }

  async isSymbolUnderMaintenance(symbol: string): Promise<boolean> {
    const [maintenance] = await db.select().from(maintenanceSymbols).where(eq(maintenanceSymbols.symbol, symbol));
    return !!maintenance;
  }

  // Affiliate settlement methods
  async createAffiliateSettlement(settlement: InsertAffiliateSettlement): Promise<AffiliateSettlement> {
    const [created] = await db.insert(affiliateSettlements)
      .values(settlement)
      .returning();
    return created;
  }

  async getAffiliateSettlements(affiliateId: string): Promise<AffiliateSettlement[]> {
    return await db.select().from(affiliateSettlements)
      .where(eq(affiliateSettlements.affiliateId, affiliateId))
      .orderBy(desc(affiliateSettlements.createdAt));
  }

  async getAllAffiliateSettlements(): Promise<(AffiliateSettlement & { affiliateName?: string })[]> {
    const settlements = await db.select().from(affiliateSettlements)
      .orderBy(desc(affiliateSettlements.createdAt));
    
    // Get affiliate names
    const result = await Promise.all(settlements.map(async (s) => {
      const affiliate = await this.getAffiliate(s.affiliateId);
      return {
        ...s,
        affiliateName: affiliate?.displayName || affiliate?.username || 'Unknown',
      };
    }));
    
    return result;
  }

  async getAffiliateTotalSettled(affiliateId: string): Promise<number> {
    const result = await db.select({ total: sql<string>`COALESCE(SUM(${affiliateSettlements.amount}), 0)` })
      .from(affiliateSettlements)
      .where(eq(affiliateSettlements.affiliateId, affiliateId));
    return parseInt(result[0]?.total || '0');
  }

  // Transaction request methods
  async createTransactionRequest(request: InsertTransactionRequest): Promise<TransactionRequest> {
    const [created] = await db.insert(transactionRequests)
      .values(request)
      .returning();
    return created;
  }

  async getTransactionRequest(id: number): Promise<TransactionRequest | undefined> {
    const [request] = await db.select().from(transactionRequests).where(eq(transactionRequests.id, id));
    return request || undefined;
  }

  async getTransactionRequestsForUser(userId: string): Promise<TransactionRequest[]> {
    return await db.select().from(transactionRequests)
      .where(eq(transactionRequests.userId, userId))
      .orderBy(desc(transactionRequests.createdAt));
  }

  async getPendingTransactionRequests(): Promise<TransactionRequest[]> {
    return await db.select().from(transactionRequests)
      .where(eq(transactionRequests.status, 'pending'))
      .orderBy(desc(transactionRequests.createdAt));
  }

  async getAllTransactionRequests(): Promise<TransactionRequest[]> {
    return await db.select().from(transactionRequests)
      .orderBy(desc(transactionRequests.createdAt));
  }

  async processTransactionRequest(id: number, status: 'approved' | 'rejected' | 'hold', processedBy: string, adminNote?: string): Promise<TransactionRequest> {
    const [updated] = await db.update(transactionRequests)
      .set({
        status,
        processedBy,
        adminNote: adminNote || null,
        processedAt: new Date(),
      })
      .where(eq(transactionRequests.id, id))
      .returning();
    return updated;
  }

  // Daily stats methods (날짜별 수익 - 한국시간 기준)
  async getDailyStats(days: number = 30): Promise<DailyStats[]> {
    const allBets = await db.select().from(bets)
      .where(eq(bets.outcome, 'win'))
      .orderBy(desc(bets.settledAt));
    
    const allSettledBets = await db.select().from(bets)
      .where(sql`${bets.outcome} IN ('win', 'lose')`)
      .orderBy(desc(bets.settledAt));

    const dailyMap = new Map<string, DailyStats>();
    
    for (const bet of allSettledBets) {
      if (!bet.settledAt) continue;
      
      const kstDate = new Date(bet.settledAt.getTime() + (9 * 60 * 60 * 1000));
      const dateKey = kstDate.toISOString().split('T')[0];
      
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          totalBetAmount: 0,
          totalPayoutAmount: 0,
          houseProfitLoss: 0,
          betCount: 0,
          winCount: 0,
          loseCount: 0,
        });
      }
      
      const stats = dailyMap.get(dateKey)!;
      const betAmount = parseFloat(bet.amount);
      const payoutAmount = bet.outcome === 'win' && bet.payout ? parseFloat(bet.payout) : 0;
      
      stats.totalBetAmount += betAmount;
      stats.betCount += 1;
      
      if (bet.outcome === 'win') {
        stats.winCount += 1;
        stats.totalPayoutAmount += payoutAmount;
        stats.houseProfitLoss -= (payoutAmount - betAmount);
      } else {
        stats.loseCount += 1;
        stats.houseProfitLoss += betAmount;
      }
    }
    
    const result = Array.from(dailyMap.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, days);
    
    return result;
  }

  // Inquiry methods (1:1 문의)
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [created] = await db.insert(inquiries).values(inquiry).returning();
    return created;
  }

  async getInquiry(id: number): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry || undefined;
  }

  async getInquiriesForUser(userId: string): Promise<Inquiry[]> {
    return await db.select().from(inquiries)
      .where(eq(inquiries.userId, userId))
      .orderBy(desc(inquiries.createdAt));
  }

  async getAllInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  }

  async getPendingInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries)
      .where(eq(inquiries.status, 'pending'))
      .orderBy(desc(inquiries.createdAt));
  }

  async replyToInquiry(id: number, reply: string, repliedBy: string): Promise<Inquiry> {
    const [updated] = await db.update(inquiries)
      .set({ 
        reply, 
        repliedBy, 
        status: 'answered', 
        repliedAt: new Date() 
      })
      .where(eq(inquiries.id, id))
      .returning();
    return updated;
  }

  async deleteAllInquiriesForUser(userId: string): Promise<number> {
    const userInquiries = await this.getInquiriesForUser(userId);
    const count = userInquiries.length;
    await db.delete(inquiries).where(eq(inquiries.userId, userId));
    return count;
  }

  // Round result methods (라운드 결과 - 차트 캔들용)
  async createRoundResult(result: InsertRoundResult): Promise<RoundResult> {
    const [created] = await db.insert(roundResults).values(result).returning();
    return created;
  }

  async getRoundResults(symbol: string, duration: number, limit: number = 50): Promise<RoundResult[]> {
    return await db.select().from(roundResults)
      .where(and(
        eq(roundResults.symbol, symbol),
        eq(roundResults.duration, duration)
      ))
      .orderBy(desc(roundResults.roundDate), desc(roundResults.roundNumber))
      .limit(limit);
  }

  async getRoundResult(symbol: string, duration: number, roundNumber: number, roundDate: string): Promise<RoundResult | undefined> {
    const [result] = await db.select().from(roundResults)
      .where(and(
        eq(roundResults.symbol, symbol),
        eq(roundResults.duration, duration),
        eq(roundResults.roundNumber, roundNumber),
        eq(roundResults.roundDate, roundDate)
      ));
    return result || undefined;
  }

  async upsertRoundResult(result: InsertRoundResult): Promise<RoundResult> {
    const existing = await this.getRoundResult(result.symbol, result.duration, result.roundNumber, result.roundDate);
    if (existing) {
      const [updated] = await db.update(roundResults)
        .set({
          openPrice: result.openPrice,
          closePrice: result.closePrice,
          highPrice: result.highPrice,
          lowPrice: result.lowPrice,
          direction: result.direction,
        })
        .where(eq(roundResults.id, existing.id))
        .returning();
      return updated;
    }
    return this.createRoundResult(result);
  }

  // Login history methods (로그인 기록)
  async addLoginHistory(entry: InsertLoginHistory): Promise<LoginHistory> {
    const [created] = await db.insert(loginHistory).values(entry).returning();
    return created;
  }

  async getLoginHistoryForUser(userId: string): Promise<LoginHistory[]> {
    return await db.select().from(loginHistory)
      .where(eq(loginHistory.userId, userId))
      .orderBy(desc(loginHistory.loginAt))
      .limit(100);
  }

  async getAllLoginHistory(limit: number = 500): Promise<LoginHistory[]> {
    return await db.select().from(loginHistory)
      .orderBy(desc(loginHistory.loginAt))
      .limit(limit);
  }

  // Inquiry template methods (1:1 문의 답변 템플릿)
  async createInquiryTemplate(template: InsertInquiryTemplate): Promise<InquiryTemplate> {
    const [created] = await db.insert(inquiryTemplates).values(template).returning();
    return created;
  }

  async getInquiryTemplate(id: number): Promise<InquiryTemplate | undefined> {
    const [template] = await db.select().from(inquiryTemplates).where(eq(inquiryTemplates.id, id));
    return template || undefined;
  }

  async getAllInquiryTemplates(): Promise<InquiryTemplate[]> {
    return await db.select().from(inquiryTemplates).orderBy(desc(inquiryTemplates.createdAt));
  }

  async updateInquiryTemplate(id: number, data: Partial<InquiryTemplate>): Promise<InquiryTemplate> {
    const [updated] = await db.update(inquiryTemplates)
      .set(data)
      .where(eq(inquiryTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteInquiryTemplate(id: number): Promise<void> {
    await db.delete(inquiryTemplates).where(eq(inquiryTemplates.id, id));
  }

  // Round forced direction methods (회차별 강제설정)
  async setRoundForcedDirection(symbol: string, duration: number, roundNumber: number, dateKey: string, forcedDirection: 'up' | 'down'): Promise<RoundForcedDirection> {
    // Delete existing if any
    await db.delete(roundForcedDirections)
      .where(and(
        eq(roundForcedDirections.symbol, symbol),
        eq(roundForcedDirections.duration, duration),
        eq(roundForcedDirections.roundNumber, roundNumber),
        eq(roundForcedDirections.dateKey, dateKey)
      ));
    
    // Insert new
    const [created] = await db.insert(roundForcedDirections)
      .values({ symbol, duration, roundNumber, dateKey, forcedDirection })
      .returning();
    return created;
  }

  async getRoundForcedDirection(symbol: string, duration: number, roundNumber: number, dateKey: string): Promise<RoundForcedDirection | undefined> {
    const [result] = await db.select().from(roundForcedDirections)
      .where(and(
        eq(roundForcedDirections.symbol, symbol),
        eq(roundForcedDirections.duration, duration),
        eq(roundForcedDirections.roundNumber, roundNumber),
        eq(roundForcedDirections.dateKey, dateKey)
      ));
    return result || undefined;
  }

  async getRoundForcedDirectionsForDate(dateKey: string): Promise<RoundForcedDirection[]> {
    return await db.select().from(roundForcedDirections)
      .where(eq(roundForcedDirections.dateKey, dateKey))
      .orderBy(roundForcedDirections.symbol, roundForcedDirections.duration, roundForcedDirections.roundNumber);
  }

  async deleteRoundForcedDirection(symbol: string, duration: number, roundNumber: number, dateKey: string): Promise<void> {
    await db.delete(roundForcedDirections)
      .where(and(
        eq(roundForcedDirections.symbol, symbol),
        eq(roundForcedDirections.duration, duration),
        eq(roundForcedDirections.roundNumber, roundNumber),
        eq(roundForcedDirections.dateKey, dateKey)
      ));
  }
}

export const storage = new DatabaseStorage();
