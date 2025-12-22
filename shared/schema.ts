import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Affiliates (총판) table
export const affiliates = pgTable("affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  phone: text("phone"),
  referralCode: text("referral_code").notNull().unique(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("5.00"), // 5% commission
  totalCommission: decimal("total_commission", { precision: 20, scale: 0 }).notNull().default("0"),
  pendingCommission: decimal("pending_commission", { precision: 20, scale: 0 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAffiliateSchema = createInsertSchema(affiliates).pick({
  username: true,
  password: true,
  displayName: true,
  phone: true,
  referralCode: true,
  commissionRate: true,
});

export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type Affiliate = typeof affiliates.$inferSelect;

// User accounts table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  phone: text("phone"),
  bankName: text("bank_name"),
  accountHolder: text("account_holder"),
  accountNumber: text("account_number"),
  balance: decimal("balance", { precision: 20, scale: 0 }).notNull().default("0"),
  totalDeposit: decimal("total_deposit", { precision: 20, scale: 0 }).notNull().default("0"),
  totalWithdrawal: decimal("total_withdrawal", { precision: 20, scale: 0 }).notNull().default("0"),
  totalBet: decimal("total_bet", { precision: 20, scale: 0 }).notNull().default("0"),
  totalWin: decimal("total_win", { precision: 20, scale: 0 }).notNull().default("0"),
  role: text("role").notNull().default("user"), // 'user', 'admin', or 'affiliate'
  affiliateId: varchar("affiliate_id"), // Reference to affiliate who referred this user
  isActive: boolean("is_active").notNull().default(true),
  approvalStatus: text("approval_status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip"),
  autoBetEnabled: boolean("auto_bet_enabled").notNull().default(false),
  autoBetMultiplier: integer("auto_bet_multiplier").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  phone: true,
  bankName: true,
  accountHolder: true,
  accountNumber: true,
});

export const loginSchema = z.object({
  username: z.string().min(3, "아이디는 3자 이상이어야 합니다"),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 합니다"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "아이디는 3자 이상이어야 합니다"),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 합니다"),
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: z.string().min(10, "올바른 휴대폰 번호를 입력해주세요"),
  bankName: z.string().min(1, "은행을 선택해주세요"),
  accountHolder: z.string().min(1, "예금주를 입력해주세요"),
  accountNumber: z.string().min(1, "계좌번호를 입력해주세요"),
  referralCode: z.string().optional(), // 총판 가입코드 (선택)
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Binary options bets table
export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  direction: text("direction").notNull(), // 'long' or 'short'
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(), // bet amount
  duration: integer("duration").notNull(), // duration in seconds (60, 120, 180, 300)
  roundNumber: integer("round_number").notNull().default(1), // round number for the day (KST based): 1min=1440/day, 3min=480/day, 5min=288/day
  strikePrice: decimal("strike_price", { precision: 20, scale: 8 }).notNull(), // price at bet time
  closePrice: decimal("close_price", { precision: 20, scale: 8 }), // price at expiry
  payout: decimal("payout", { precision: 20, scale: 8 }), // payout amount if won
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).notNull().default("2.00"), // win multiplier (2.00 = 100% profit)
  outcome: text("outcome").notNull().default("pending"), // 'pending', 'win', 'lose'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  settledAt: timestamp("settled_at"),
});

export const insertBetSchema = createInsertSchema(bets).omit({
  id: true,
  closePrice: true,
  payout: true,
  outcome: true,
  createdAt: true,
  settledAt: true,
});

export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof bets.$inferSelect;

// Bet history for display
export interface BetDisplay extends Bet {
  timeRemaining?: number;
  currentPrice?: number;
}

// Site settings table
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;

// Messages table (admin to user messages)
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Announcements table (공지사항)
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

// Affiliate commissions table
export const affiliateCommissions = pgTable("affiliate_commissions", {
  id: serial("id").primaryKey(),
  affiliateId: varchar("affiliate_id").notNull(),
  userId: varchar("user_id").notNull(),
  betId: integer("bet_id").notNull(),
  betAmount: decimal("bet_amount", { precision: 20, scale: 0 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 20, scale: 0 }).notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'settled'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  settledAt: timestamp("settled_at"),
});

export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;

// Affiliate settlements table (총판 정산 내역)
export const affiliateSettlements = pgTable("affiliate_settlements", {
  id: serial("id").primaryKey(),
  affiliateId: varchar("affiliate_id").notNull(),
  amount: decimal("amount", { precision: 20, scale: 0 }).notNull(),
  memo: text("memo"),
  settledBy: varchar("settled_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAffiliateSettlementSchema = createInsertSchema(affiliateSettlements).omit({
  id: true,
  createdAt: true,
});

export type InsertAffiliateSettlement = z.infer<typeof insertAffiliateSettlementSchema>;
export type AffiliateSettlement = typeof affiliateSettlements.$inferSelect;

// Blocked IPs table (IP 차단)
export const blockedIps = pgTable("blocked_ips", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull().unique(),
  reason: text("reason"),
  blockedBy: varchar("blocked_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBlockedIpSchema = createInsertSchema(blockedIps).omit({
  id: true,
  createdAt: true,
});

export type InsertBlockedIp = z.infer<typeof insertBlockedIpSchema>;
export type BlockedIp = typeof blockedIps.$inferSelect;

// Maintenance symbols table (서버 점검 - 거래 비활성화)
export const maintenanceSymbols = pgTable("maintenance_symbols", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  reason: text("reason"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  createdBy: varchar("created_by").notNull(),
});

export const insertMaintenanceSymbolSchema = createInsertSchema(maintenanceSymbols).omit({
  id: true,
  startedAt: true,
});

export type InsertMaintenanceSymbol = z.infer<typeof insertMaintenanceSymbolSchema>;
export type MaintenanceSymbol = typeof maintenanceSymbols.$inferSelect;

// Deposit/Withdrawal requests table (입출금 신청)
export const transactionRequests = pgTable("transaction_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'deposit' or 'withdrawal'
  amount: decimal("amount", { precision: 20, scale: 0 }).notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  bankName: text("bank_name"),
  accountHolder: text("account_holder"),
  accountNumber: text("account_number"),
  adminNote: text("admin_note"),
  processedBy: varchar("processed_by"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionRequestSchema = createInsertSchema(transactionRequests).omit({
  id: true,
  status: true,
  adminNote: true,
  processedBy: true,
  processedAt: true,
  createdAt: true,
});

export type InsertTransactionRequest = z.infer<typeof insertTransactionRequestSchema>;
export type TransactionRequest = typeof transactionRequests.$inferSelect;

// 1:1 Inquiries table (1:1 문의)
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  reply: text("reply"),
  status: text("status").notNull().default("pending"), // 'pending', 'answered'
  repliedBy: varchar("replied_by"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  reply: true,
  status: true,
  repliedBy: true,
  repliedAt: true,
  createdAt: true,
});

export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;

// Round results table (라운드 결과 - 차트 캔들용)
export const roundResults = pgTable("round_results", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  duration: integer("duration").notNull(), // 60, 180, 300 seconds
  roundNumber: integer("round_number").notNull(),
  roundDate: text("round_date").notNull(), // YYYY-MM-DD in KST
  openPrice: decimal("open_price", { precision: 20, scale: 8 }).notNull(),
  closePrice: decimal("close_price", { precision: 20, scale: 8 }).notNull(),
  highPrice: decimal("high_price", { precision: 20, scale: 8 }).notNull(),
  lowPrice: decimal("low_price", { precision: 20, scale: 8 }).notNull(),
  direction: text("direction").notNull(), // 'up' or 'down' - determines candle color
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRoundResultSchema = createInsertSchema(roundResults).omit({
  id: true,
  createdAt: true,
});

export type InsertRoundResult = z.infer<typeof insertRoundResultSchema>;
export type RoundResult = typeof roundResults.$inferSelect;

// Korean banks list
export const KOREAN_BANKS = [
  "KB국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "SC제일은행",
  "한국씨티은행",
  "케이뱅크",
  "카카오뱅크",
  "토스뱅크",
  "NH농협은행",
  "IBK기업은행",
  "KDB산업은행",
  "수협은행",
  "대구은행",
  "부산은행",
  "광주은행",
  "전북은행",
  "경남은행",
  "제주은행",
] as const;
