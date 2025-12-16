import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  balance: decimal("balance", { precision: 20, scale: 0 }).notNull().default("10000000"),
  totalDeposit: decimal("total_deposit", { precision: 20, scale: 0 }).notNull().default("0"),
  totalWithdrawal: decimal("total_withdrawal", { precision: 20, scale: 0 }).notNull().default("0"),
  totalBet: decimal("total_bet", { precision: 20, scale: 0 }).notNull().default("0"),
  totalWin: decimal("total_win", { precision: 20, scale: 0 }).notNull().default("0"),
  role: text("role").notNull().default("user"), // 'user' or 'admin'
  isActive: boolean("is_active").notNull().default(true),
  approvalStatus: text("approval_status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  lastLoginAt: timestamp("last_login_at"),
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
  strikePrice: decimal("strike_price", { precision: 20, scale: 8 }).notNull(), // price at bet time
  closePrice: decimal("close_price", { precision: 20, scale: 8 }), // price at expiry
  payout: decimal("payout", { precision: 20, scale: 8 }), // payout amount if won
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).notNull().default("1.90"), // win multiplier (1.90 = 90% profit)
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
