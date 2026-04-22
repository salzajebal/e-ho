import { type User, type InsertUser, type Bet, type InsertBet, type Setting, type Message, type InsertMessage, type Affiliate, type InsertAffiliate, type AffiliateCommission, type AffiliateSettlement, type InsertAffiliateSettlement, type Announcement, type InsertAnnouncement, type BlockedIp, type InsertBlockedIp, type MaintenanceSymbol, type InsertMaintenanceSymbol, type TransactionRequest, type InsertTransactionRequest, type Inquiry, type InsertInquiry, type RoundResult, type InsertRoundResult, type LoginHistory, type InsertLoginHistory, type InquiryTemplate, type InsertInquiryTemplate, type RoundForcedDirection, type InsertRoundForcedDirection, type ForexCandle, type InsertForexCandle, type Branch, type InsertBranch, users, bets, settings, messages, affiliates, affiliateCommissions, affiliateSettlements, announcements, blockedIps, maintenanceSymbols, transactionRequests, inquiries, roundResults, loginHistory, inquiryTemplates, roundForcedDirections, forexCandles, branches } from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, lt, gt, sql, gte, inArray, ilike, or } from "drizzle-orm";

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
  applyPendingAndUpdateBalance(userId: string, payout: number): Promise<{ pendingAmount: number; newBalance: string }>;

  // Bet methods
  getBets(userId: string, outcome?: string): Promise<Bet[]>;
  getActiveBets(userId: string): Promise<Bet[]>;
  getBet(id: number): Promise<Bet | undefined>;
  getUserBetForRound(userId: string, symbol: string, duration: number, roundNumber: number): Promise<Bet | undefined>;
  createBet(bet: InsertBet): Promise<Bet>;
  settleBet(id: number, closePrice: string, outcome: 'win' | 'lose', payout: string): Promise<Bet>;
  getPaginatedBets(page: number, pageSize: number, search?: string): Promise<{ bets: (Bet & { username: string; name: string })[]; total: number; totalPages: number }>;
  setForcedOutcome(betId: number, forcedOutcome: 'win' | 'lose' | null): Promise<Bet>;
  getExpiredPendingBets(): Promise<Bet[]>;
  getSettledBetsForRound(symbol: string, duration: number, roundNumber: number): Promise<Bet[]>;
  getRecentlySettledBetsBySymbolDuration(symbol: string, duration: number, withinMinutes?: number): Promise<Bet[]>;
  reSettleBet(betId: number, newOutcome: 'win' | 'lose', newClosePrice: string, newPayout: number): Promise<{ success: boolean; bet?: Bet; newBalance?: string }>;
  getAllBets(): Promise<Bet[]>;
  updateBet(betId: number, data: Partial<Bet>): Promise<Bet>;
  applyMaxExecution(betId: number, enabled: boolean): Promise<{ newAmount: string; newBalance: string; userId: string }>;
  getUserBetStats(userId: string): Promise<{ totalBet: number; totalWin: number; betCount: number; winCount: number }>;
  deleteAllBetsForUser(userId: string): Promise<number>;
  updatePendingBetsDirectionForRound(symbol: string, duration: number, roundNumber: number, newDirection: 'long' | 'short'): Promise<Bet[]>;
  migrateLegacyUnrealizedBets(): Promise<number>;

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
  markInquiryReplyRead(id: number, userId: string): Promise<void>;
  markAllInquiryRepliesReadForUser(userId: string): Promise<void>;
  deleteAllInquiriesForUser(userId: string): Promise<number>;
  deleteInquiry(id: number): Promise<void>;

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
  setRoundForcedDirection(symbol: string, duration: number, roundNumber: number, dateKey: string, forcedDirection: string): Promise<RoundForcedDirection>;
  getRoundForcedDirection(symbol: string, duration: number, roundNumber: number, dateKey: string): Promise<RoundForcedDirection | undefined>;
  getRoundForcedDirectionsForRound(symbol: string, duration: number, roundNumber: number, dateKey: string): Promise<RoundForcedDirection[]>;
  deleteRoundForcedDirectionByType(symbol: string, duration: number, roundNumber: number, dateKey: string, forcedDirection: string): Promise<void>;
  getRoundForcedDirectionsForDate(dateKey: string): Promise<RoundForcedDirection[]>;
  deleteRoundForcedDirection(symbol: string, duration: number, roundNumber: number, dateKey: string): Promise<void>;

  // Forex candle methods (캔들 데이터 영구 저장)
  getForexCandles(symbol: string, duration: number, limit?: number): Promise<ForexCandle[]>;
  upsertForexCandle(symbol: string, duration: number, time: number, open: number, high: number, low: number, close: number): Promise<void>;
  deleteOldForexCandles(symbol: string, duration: number, keepCount: number): Promise<void>;
  deleteAllForexCandlesByKey(symbol: string, duration: number): Promise<void>;
  deleteForexCandlesOutsidePriceRange(symbol: string, duration: number, lower: number, upper: number): Promise<number>;

  // Branch methods (지점코드 관리)
  createBranch(branch: InsertBranch): Promise<Branch>;
  getBranch(id: number): Promise<Branch | undefined>;
  getBranchByCode(code: string): Promise<Branch | undefined>;
  getAllBranches(): Promise<Branch[]>;
  updateBranch(id: number, data: Partial<Branch>): Promise<Branch>;
  deleteBranch(id: number): Promise<void>;
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
    console.log(`🔍 [Pending Apply] User ${userId}: 예약 금액 적용 시작`);
    
    // 원자적 연산: SELECT ... FOR UPDATE + UPDATE를 트랜잭션으로 처리
    const result = await db.transaction(async (tx) => {
      // 현재 예약 금액 조회 (FOR UPDATE로 행 잠금)
      const [user] = await tx
        .select({ pendingBalanceAdjustment: users.pendingBalanceAdjustment })
        .from(users)
        .where(eq(users.id, userId))
        .for("update");
      
      console.log(`🔍 [Pending Apply] User ${userId}: DB 조회 결과 = ${JSON.stringify(user)}`);
      
      if (!user) {
        console.log(`🔍 [Pending Apply] User ${userId}: 사용자를 찾을 수 없음, 0 반환`);
        return "0";
      }
      
      const pendingAmount = parseFloat(user.pendingBalanceAdjustment || '0');
      console.log(`🔍 [Pending Apply] User ${userId}: pendingBalanceAdjustment = "${user.pendingBalanceAdjustment}", parsed = ${pendingAmount}`);
      
      if (pendingAmount === 0) {
        console.log(`🔍 [Pending Apply] User ${userId}: 예약 금액이 0, 0 반환`);
        return "0";
      }
      
      // 예약 금액을 0으로 초기화
      await tx.update(users)
        .set({ pendingBalanceAdjustment: "0" })
        .where(eq(users.id, userId));
      
      console.log(`🔄 [Pending TX] User ${userId}: 예약 금액 ${pendingAmount.toLocaleString()}원 가져와서 0으로 초기화 완료`);
      
      return pendingAmount.toString();
    });
    
    console.log(`🔍 [Pending Apply] User ${userId}: 최종 반환값 = ${result}`);
    return result;
  }

  async applyPendingAndUpdateBalance(userId: string, payout: number): Promise<{ pendingAmount: number; newBalance: string }> {
    console.log(`🔄 [Atomic Settlement] User ${userId}: 원자적 정산 시작 (payout: ${payout})`);
    
    const result = await db.transaction(async (tx) => {
      const [user] = await tx
        .select({ 
          balance: users.balance, 
          pendingBalanceAdjustment: users.pendingBalanceAdjustment 
        })
        .from(users)
        .where(eq(users.id, userId))
        .for("update");
      
      if (!user) {
        console.log(`🔄 [Atomic Settlement] User ${userId}: 사용자를 찾을 수 없음`);
        return { pendingAmount: 0, newBalance: "0" };
      }
      
      const currentBalance = parseFloat(user.balance || '0');
      const pendingAmount = parseFloat(user.pendingBalanceAdjustment || '0');
      const totalAdjustment = payout + pendingAmount;
      const newBalance = Math.max(0, currentBalance + totalAdjustment).toString();
      
      console.log(`🔄 [Atomic Settlement] User ${userId}:`);
      console.log(`   - 현재 잔고: ${currentBalance.toLocaleString()}원`);
      console.log(`   - 예약 금액: ${pendingAmount.toLocaleString()}원`);
      console.log(`   - Payout: ${payout.toLocaleString()}원`);
      console.log(`   - 총 조정: ${totalAdjustment.toLocaleString()}원`);
      console.log(`   - 새 잔고: ${parseFloat(newBalance).toLocaleString()}원`);
      
      await tx.update(users)
        .set({ 
          balance: newBalance,
          pendingBalanceAdjustment: "0"
        })
        .where(eq(users.id, userId));
      
      console.log(`✅ [Atomic Settlement] User ${userId}: 잔고 업데이트 완료`);
      
      return { pendingAmount, newBalance };
    });
    
    return result;
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

  async getUserBetForRound(userId: string, symbol: string, duration: number, roundNumber: number): Promise<Bet | undefined> {
    const now = new Date();
    const kstOffset = 9 * 60;
    const utcOffset = now.getTimezoneOffset();
    const kstNow = new Date(now.getTime() + (utcOffset + kstOffset) * 60 * 1000);
    const todayStart = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
    const todayStartUTC = new Date(todayStart.getTime() - (kstOffset * 60 * 1000));
    const tomorrowStartUTC = new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000);

    const [bet] = await db.select().from(bets)
      .where(and(
        eq(bets.userId, userId),
        eq(bets.symbol, symbol),
        eq(bets.duration, duration),
        eq(bets.roundNumber, roundNumber),
        gte(bets.createdAt, todayStartUTC),
        sql`${bets.createdAt} < ${tomorrowStartUTC}`
      ));
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

  // 원자적 정산: 베팅 정산과 잔고 업데이트를 하나의 트랜잭션에서 처리 (중복 정산 방지)
  async atomicSettleBetAndUpdateBalance(
    betId: number, 
    closePrice: string, 
    outcome: 'win' | 'lose', 
    payout: number,
    newDirection?: 'long' | 'short'
  ): Promise<{ success: boolean; bet?: Bet; newBalance?: string; alreadySettled?: boolean }> {
    console.log(`🔒 [Atomic Settle] Bet #${betId}: 원자적 정산 시작`);
    
    const result = await db.transaction(async (tx) => {
      // 1. 베팅을 FOR UPDATE로 잠금
      const [bet] = await tx
        .select()
        .from(bets)
        .where(eq(bets.id, betId))
        .for("update");
      
      if (!bet) {
        console.log(`🔒 [Atomic Settle] Bet #${betId}: 베팅을 찾을 수 없음`);
        return { success: false };
      }
      
      // 2. 이미 정산된 베팅인지 확인 (중복 정산 방지)
      if (bet.outcome !== 'pending') {
        console.log(`🔒 [Atomic Settle] Bet #${betId}: 이미 정산됨 (${bet.outcome}), 건너뛰기`);
        return { success: false, alreadySettled: true };
      }
      
      // 3. 베팅 정산
      const updateData: any = { 
        closePrice,
        outcome,
        payout: payout.toString(),
        settledAt: new Date(),
      };
      if (newDirection) {
        updateData.direction = newDirection;
      }
      const [settledBet] = await tx
        .update(bets)
        .set(updateData)
        .where(eq(bets.id, betId))
        .returning();
      
      console.log(`🔒 [Atomic Settle] Bet #${betId}: 베팅 정산 완료 (${outcome}, payout: ${payout})`);
      
      // 4. 사용자 잔고 업데이트 (FOR UPDATE로 잠금)
      const [user] = await tx
        .select({ 
          balance: users.balance, 
          pendingBalanceAdjustment: users.pendingBalanceAdjustment 
        })
        .from(users)
        .where(eq(users.id, bet.userId))
        .for("update");
      
      if (!user) {
        console.log(`🔒 [Atomic Settle] Bet #${betId}: 사용자를 찾을 수 없음`);
        return { success: false };
      }
      
      const currentBalance = parseFloat(user.balance || '0');
      const pendingAmount = parseFloat(user.pendingBalanceAdjustment || '0');
      const totalAdjustment = payout + pendingAmount;
      const newBalance = Math.max(0, currentBalance + totalAdjustment).toString();
      
      console.log(`🔒 [Atomic Settle] Bet #${betId}: 잔고 업데이트`);
      console.log(`   - 현재 잔고: ${currentBalance.toLocaleString()}원`);
      console.log(`   - 예약 금액: ${pendingAmount.toLocaleString()}원`);
      console.log(`   - Payout: ${payout.toLocaleString()}원`);
      console.log(`   - 새 잔고: ${parseFloat(newBalance).toLocaleString()}원`);
      
      await tx.update(users)
        .set({ 
          balance: newBalance,
          pendingBalanceAdjustment: "0"
        })
        .where(eq(users.id, bet.userId));

      // 정산 후 잔고 기록
      await tx.update(bets)
        .set({ balanceAfter: newBalance })
        .where(eq(bets.id, betId));
      
      console.log(`✅ [Atomic Settle] Bet #${betId}: 완료`);
      
      return { success: true, bet: settledBet, newBalance };
    });
    
    return result;
  }

  async getExpiredPendingBets(): Promise<Bet[]> {
    return await db.select().from(bets)
      .where(and(
        eq(bets.outcome, 'pending'),
        lt(bets.expiresAt, new Date())
      ));
  }

  async getSettledBetsForRound(symbol: string, duration: number, roundNumber: number): Promise<Bet[]> {
    const now = new Date();
    const kstOffset = 9 * 60;
    const utcOffset = now.getTimezoneOffset();
    const kstTime = new Date(now.getTime() + (kstOffset + utcOffset) * 60 * 1000);
    const todayStart = new Date(kstTime);
    todayStart.setHours(0, 0, 0, 0);
    const todayStartUTC = new Date(todayStart.getTime() - (kstOffset + utcOffset) * 60 * 1000);

    return await db.select().from(bets)
      .where(and(
        eq(bets.symbol, symbol),
        eq(bets.duration, duration),
        eq(bets.roundNumber, roundNumber),
        sql`${bets.outcome} IN ('win', 'lose')`,
        sql`${bets.createdAt} >= ${todayStartUTC}`
      ));
  }

  async getRecentlySettledBetsBySymbolDuration(symbol: string, duration: number, withinMinutes: number = 30): Promise<Bet[]> {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);

    const now = new Date();
    const kstOffset = 9 * 60;
    const utcOffset = now.getTimezoneOffset();
    const kstTime = new Date(now.getTime() + (kstOffset + utcOffset) * 60 * 1000);
    const todayStart = new Date(kstTime);
    todayStart.setHours(0, 0, 0, 0);
    const todayStartUTC = new Date(todayStart.getTime() - (kstOffset + utcOffset) * 60 * 1000);

    return await db.select().from(bets)
      .where(and(
        eq(bets.symbol, symbol),
        eq(bets.duration, duration),
        sql`${bets.outcome} IN ('win', 'lose')`,
        sql`${bets.createdAt} >= ${todayStartUTC}`,
        sql`(${bets.settledAt} IS NOT NULL AND ${bets.settledAt} >= ${cutoff}) OR ${bets.expiresAt} >= ${cutoff}`
      ));
  }

  async reSettleBet(betId: number, newOutcome: 'win' | 'lose', newClosePrice: string, newPayout: number): Promise<{ success: boolean; bet?: Bet; newBalance?: string }> {
    const result = await db.transaction(async (tx) => {
      const [bet] = await tx.select().from(bets).where(eq(bets.id, betId)).for("update");
      if (!bet) return { success: false };
      
      if (bet.outcome === newOutcome) {
        return { success: false };
      }

      const now = new Date();
      const kstOffset = 9 * 60;
      const utcOffset = now.getTimezoneOffset();
      const kstTime = new Date(now.getTime() + (kstOffset + utcOffset) * 60 * 1000);
      const todayStart = new Date(kstTime);
      todayStart.setHours(0, 0, 0, 0);
      const todayStartUTC = new Date(todayStart.getTime() - (kstOffset + utcOffset) * 60 * 1000);
      
      if (new Date(bet.createdAt) < todayStartUTC) {
        console.log(`🚫 [Re-Settle] Bet #${betId}: 오늘 생성된 베팅이 아니므로 재정산 차단 (생성일: ${bet.createdAt})`);
        return { success: false };
      }
      
      const oldPayout = parseFloat(bet.payout || '0');
      
      const [updatedBet] = await tx.update(bets)
        .set({ closePrice: newClosePrice, outcome: newOutcome, payout: newPayout.toString(), settledAt: new Date() })
        .where(eq(bets.id, betId))
        .returning();
      
      const [user] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, bet.userId)).for("update");
      if (!user) return { success: false };
      
      const currentBalance = parseFloat(user.balance || '0');
      const balanceAdjustment = newPayout - oldPayout;
      const newBalance = Math.max(0, currentBalance + balanceAdjustment).toString();
      
      console.log(`🔄 [Re-Settle] Bet #${betId}: ${bet.outcome} → ${newOutcome}, 잔고 조정: ${balanceAdjustment >= 0 ? '+' : ''}${balanceAdjustment.toLocaleString()}원 (${currentBalance.toLocaleString()} → ${parseFloat(newBalance).toLocaleString()})`);
      
      await tx.update(users).set({ balance: newBalance }).where(eq(users.id, bet.userId));
      
      return { success: true, bet: updatedBet, newBalance };
    });
    return result;
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

  async updatePendingBetsDirectionForRound(symbol: string, duration: number, roundNumber: number, newDirection: 'long' | 'short'): Promise<Bet[]> {
    const now = new Date();
    const kstOffset = 9 * 60;
    const utcOffset = now.getTimezoneOffset();
    const kstNow = new Date(now.getTime() + (utcOffset + kstOffset) * 60 * 1000);
    const todayStart = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
    const todayStartUTC = new Date(todayStart.getTime() - (kstOffset * 60 * 1000));
    const tomorrowStartUTC = new Date(todayStartUTC.getTime() + 24 * 60 * 60 * 1000);

    const updatedBets = await db.update(bets)
      .set({ direction: newDirection })
      .where(and(
        eq(bets.symbol, symbol),
        eq(bets.duration, duration),
        eq(bets.roundNumber, roundNumber),
        eq(bets.outcome, 'pending'),
        gte(bets.createdAt, todayStartUTC),
        lt(bets.createdAt, tomorrowStartUTC)
      ))
      .returning();
    return updatedBets;
  }

  async migrateLegacyUnrealizedBets(): Promise<number> {
    const farFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const legacy = await db.select().from(bets)
      .where(and(eq(bets.outcome, 'pending'), gt(bets.expiresAt, farFuture)));
    if (legacy.length === 0) return 0;
    for (const b of legacy) {
      await db.update(bets)
        .set({ outcome: 'unrealized', settledAt: new Date() })
        .where(eq(bets.id, b.id));
    }
    return legacy.length;
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

    if (conditions.length === 0) {
      const now = new Date();
      const kstOffset = 9 * 60;
      const utcOffset = now.getTimezoneOffset();
      const kstNow = new Date(now.getTime() + (utcOffset + kstOffset) * 60 * 1000);
      const todayStart = new Date(kstNow.getFullYear(), kstNow.getMonth(), kstNow.getDate());
      const todayStartUTC = new Date(todayStart.getTime() - (kstOffset * 60 * 1000));
      conditions.push(gte(bets.createdAt, todayStartUTC));
    }
    
    const allBets = await db.select().from(bets)
      .where(and(...conditions))
      .orderBy(desc(bets.createdAt));
    
    const allUsers = await this.getAllUsers();
    const userMap = new Map(allUsers.map(u => [u.id, { username: u.username, name: u.name, forcedBetDirection: u.forcedBetDirection }]));

    return allBets.map(bet => ({
      ...bet,
      username: userMap.get(bet.userId)?.username || 'Unknown',
      name: userMap.get(bet.userId)?.name || 'Unknown',
      userForcedDirection: userMap.get(bet.userId)?.forcedBetDirection || null,
    }));
  }

  async getPaginatedBets(page: number, pageSize: number, search?: string): Promise<{ bets: (Bet & { username: string; name: string })[]; total: number; totalPages: number }> {
    const offset = (page - 1) * pageSize;

    // Get matching userIds if search is specified
    let userIdFilter: string[] | null = null;
    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      const matchedUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.username}) LIKE ${term} OR lower(${users.name}) LIKE ${term}`);
      userIdFilter = matchedUsers.map(u => u.id);
      if (userIdFilter.length === 0) {
        return { bets: [], total: 0, totalPages: 0 };
      }
    }

    const whereClause = userIdFilter ? inArray(bets.userId, userIdFilter) : undefined;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(bets)
      .where(whereClause);

    const rows = await db
      .select()
      .from(bets)
      .where(whereClause)
      .orderBy(desc(bets.id))
      .limit(pageSize)
      .offset(offset);

    const allUsers = await this.getAllUsers();
    const userMap = new Map(allUsers.map(u => [u.id, { username: u.username, name: u.name }]));

    const result = rows.map(bet => ({
      ...bet,
      username: userMap.get(bet.userId)?.username || 'Unknown',
      name: userMap.get(bet.userId)?.name || '',
    }));

    return { bets: result, total, totalPages: Math.ceil(total / pageSize) };
  }

  async updateBetAmount(betId: number, newAmount: string): Promise<Bet> {
    const [updated] = await db.update(bets)
      .set({ amount: newAmount })
      .where(eq(bets.id, betId))
      .returning();
    return updated;
  }

  async updateBet(betId: number, data: Partial<Bet>): Promise<Bet> {
    const [updated] = await db.update(bets)
      .set(data)
      .where(eq(bets.id, betId))
      .returning();
    return updated;
  }

  async applyMaxExecution(betId: number, enabled: boolean): Promise<{ newAmount: string; newBalance: string; userId: string }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const betResult = await client.query('SELECT * FROM bets WHERE id = $1 FOR UPDATE', [betId]);
      const bet = betResult.rows[0];
      if (!bet) throw new Error("거래를 찾을 수 없습니다");
      if (bet.outcome !== 'pending') throw new Error("진행 중인 거래만 변경 가능합니다");
      if (enabled && bet.max_execution_applied) throw new Error("이미 맥스체결이 적용된 거래입니다");
      if (!enabled && !bet.max_execution_applied) throw new Error("맥스체결이 적용되지 않은 거래입니다");

      const userResult = await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [bet.user_id]);
      const user = userResult.rows[0];
      if (!user) throw new Error("회원을 찾을 수 없습니다");

      const currentBalance = parseFloat(user.balance);
      const currentBetAmount = parseFloat(bet.amount);

      let newAmount: string;
      let newBalance: string;

      if (enabled) {
        const newBetAmount = currentBetAmount * 10;
        const additionalNeeded = newBetAmount - currentBetAmount;
        if (additionalNeeded > currentBalance) throw new Error("잔고가 부족합니다 (10배 체결에 필요한 잔액이 없습니다)");

        const remainingBalance = Math.floor(currentBalance - additionalNeeded);

        await client.query(
          'UPDATE bets SET amount = $1, original_amount = $2, max_execution_applied = true WHERE id = $3',
          [newBetAmount.toString(), currentBetAmount.toString(), betId]
        );
        await client.query('UPDATE users SET balance = $1 WHERE id = $2', [remainingBalance.toString(), bet.user_id]);

        newAmount = newBetAmount.toString();
        newBalance = remainingBalance.toString();
      } else {
        const originalAmount = parseFloat(bet.original_amount || "0");
        const refundAmount = currentBetAmount - originalAmount;
        const computedBalance = Math.floor(currentBalance + refundAmount);

        await client.query(
          'UPDATE bets SET amount = $1, original_amount = NULL, max_execution_applied = false WHERE id = $2',
          [originalAmount.toString(), betId]
        );
        await client.query('UPDATE users SET balance = $1 WHERE id = $2', [computedBalance.toString(), bet.user_id]);

        newAmount = originalAmount.toString();
        newBalance = computedBalance.toString();
      }

      await client.query('COMMIT');
      return { newAmount, newBalance, userId: bet.user_id };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
        repliedAt: new Date(),
        isReplyRead: false, // 새 답변 등록 시 읽음 상태 초기화
      })
      .where(eq(inquiries.id, id))
      .returning();
    return updated;
  }

  async deleteInquiry(id: number): Promise<void> {
    await db.delete(inquiries).where(eq(inquiries.id, id));
  }

  async markInquiryReplyRead(id: number, userId: string): Promise<void> {
    await db.update(inquiries)
      .set({ isReplyRead: true })
      .where(and(eq(inquiries.id, id), eq(inquiries.userId, userId), eq(inquiries.status, 'answered')));
  }

  async markAllInquiryRepliesReadForUser(userId: string): Promise<void> {
    await db.update(inquiries)
      .set({ isReplyRead: true })
      .where(and(eq(inquiries.userId, userId), eq(inquiries.status, 'answered')));
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
  async setRoundForcedDirection(symbol: string, duration: number, roundNumber: number, dateKey: string, forcedDirection: string): Promise<RoundForcedDirection> {
    const isDirectionType = ['up', 'down'].includes(forcedDirection);
    const isOutcomeType = ['all_win', 'all_lose'].includes(forcedDirection);
    const isDisplayType = ['display_up', 'display_down'].includes(forcedDirection);
    
    if (isDirectionType) {
      await db.delete(roundForcedDirections)
        .where(and(
          eq(roundForcedDirections.symbol, symbol),
          eq(roundForcedDirections.duration, duration),
          eq(roundForcedDirections.roundNumber, roundNumber),
          eq(roundForcedDirections.dateKey, dateKey),
          sql`${roundForcedDirections.forcedDirection} IN ('up', 'down')`
        ));
    } else if (isOutcomeType) {
      await db.delete(roundForcedDirections)
        .where(and(
          eq(roundForcedDirections.symbol, symbol),
          eq(roundForcedDirections.duration, duration),
          eq(roundForcedDirections.roundNumber, roundNumber),
          eq(roundForcedDirections.dateKey, dateKey),
          sql`${roundForcedDirections.forcedDirection} IN ('all_win', 'all_lose')`
        ));
    } else if (isDisplayType) {
      await db.delete(roundForcedDirections)
        .where(and(
          eq(roundForcedDirections.symbol, symbol),
          eq(roundForcedDirections.duration, duration),
          eq(roundForcedDirections.roundNumber, roundNumber),
          eq(roundForcedDirections.dateKey, dateKey),
          sql`${roundForcedDirections.forcedDirection} IN ('display_up', 'display_down')`
        ));
    }
    
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

  async getRoundForcedDirectionsForRound(symbol: string, duration: number, roundNumber: number, dateKey: string): Promise<RoundForcedDirection[]> {
    return await db.select().from(roundForcedDirections)
      .where(and(
        eq(roundForcedDirections.symbol, symbol),
        eq(roundForcedDirections.duration, duration),
        eq(roundForcedDirections.roundNumber, roundNumber),
        eq(roundForcedDirections.dateKey, dateKey)
      ));
  }

  async deleteRoundForcedDirectionByType(symbol: string, duration: number, roundNumber: number, dateKey: string, forcedDirection: string): Promise<void> {
    await db.delete(roundForcedDirections)
      .where(and(
        eq(roundForcedDirections.symbol, symbol),
        eq(roundForcedDirections.duration, duration),
        eq(roundForcedDirections.roundNumber, roundNumber),
        eq(roundForcedDirections.dateKey, dateKey),
        eq(roundForcedDirections.forcedDirection, forcedDirection)
      ));
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

  async getForexCandles(symbol: string, duration: number, limit: number = 200): Promise<ForexCandle[]> {
    // 최신 N개를 가져온 후 시간순(오름차순)으로 반환
    const rows = await db.execute<ForexCandle>(sql`
      SELECT * FROM (
        SELECT * FROM forex_candles
        WHERE symbol = ${symbol} AND duration = ${duration}
        ORDER BY time DESC
        LIMIT ${limit}
      ) sub
      ORDER BY time ASC
    `);
    return rows.rows as ForexCandle[];
  }

  async upsertForexCandle(symbol: string, duration: number, time: number, open: number, high: number, low: number, close: number): Promise<void> {
    const openStr = open.toString();
    const highStr = high.toString();
    const lowStr = low.toString();
    const closeStr = close.toString();

    await db.execute(sql`
      INSERT INTO forex_candles (symbol, duration, time, open, high, low, close)
      VALUES (${symbol}, ${duration}, ${time}, ${openStr}, ${highStr}, ${lowStr}, ${closeStr})
      ON CONFLICT (symbol, duration, time) DO UPDATE SET
        high = GREATEST(forex_candles.high::numeric, ${highStr}::numeric),
        low = LEAST(forex_candles.low::numeric, ${lowStr}::numeric),
        close = ${closeStr}
    `);
  }

  async deleteOldForexCandles(symbol: string, duration: number, keepCount: number): Promise<void> {
    await db.execute(sql`
      DELETE FROM forex_candles
      WHERE symbol = ${symbol} AND duration = ${duration}
      AND id NOT IN (
        SELECT id FROM forex_candles
        WHERE symbol = ${symbol} AND duration = ${duration}
        ORDER BY time DESC LIMIT ${keepCount}
      )
    `);
  }

  async deleteAllForexCandlesByKey(symbol: string, duration: number): Promise<void> {
    await db.execute(sql`
      DELETE FROM forex_candles
      WHERE symbol = ${symbol} AND duration = ${duration}
    `);
  }

  async deleteForexCandlesOutsidePriceRange(symbol: string, duration: number, lower: number, upper: number): Promise<number> {
    const result = await db.execute(sql`
      DELETE FROM forex_candles
      WHERE symbol = ${symbol} AND duration = ${duration}
        AND (close::numeric < ${lower} OR close::numeric > ${upper})
    `);
    return (result as any).rowCount ?? 0;
  }

  // Branch methods
  async createBranch(branch: InsertBranch): Promise<Branch> {
    const [created] = await db.insert(branches).values(branch).returning();
    return created;
  }

  async getBranch(id: number): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(eq(branches.id, id));
    return branch;
  }

  async getBranchByCode(code: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(sql`LOWER(${branches.code}) = LOWER(${code})`);
    return branch;
  }

  async getAllBranches(): Promise<Branch[]> {
    return db.select().from(branches).orderBy(desc(branches.createdAt));
  }

  async updateBranch(id: number, data: Partial<Branch>): Promise<Branch> {
    const [updated] = await db.update(branches).set(data).where(eq(branches.id, id)).returning();
    return updated;
  }

  async deleteBranch(id: number): Promise<void> {
    await db.delete(branches).where(eq(branches.id, id));
  }
}

export const storage = new DatabaseStorage();
