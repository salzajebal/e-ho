import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User accounts table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: decimal("balance", { precision: 20, scale: 0 }).notNull().default("10000000"),
  role: text("role").notNull().default("user"), // 'user' or 'admin'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const loginSchema = z.object({
  username: z.string().min(3, "아이디는 3자 이상이어야 합니다"),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 합니다"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "아이디는 3자 이상이어야 합니다"),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 합니다"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
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
