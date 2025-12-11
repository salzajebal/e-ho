import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User accounts table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: decimal("balance", { precision: 20, scale: 8 }).notNull().default("100000"), // USDT balance
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Positions table
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // 'long' or 'short'
  size: decimal("size", { precision: 20, scale: 8 }).notNull(),
  leverage: integer("leverage").notNull(),
  entryPrice: decimal("entry_price", { precision: 20, scale: 8 }).notNull(),
  markPrice: decimal("mark_price", { precision: 20, scale: 8 }).notNull(),
  liquidationPrice: decimal("liquidation_price", { precision: 20, scale: 8 }).notNull(),
  margin: decimal("margin", { precision: 20, scale: 8 }).notNull(),
  pnl: decimal("pnl", { precision: 20, scale: 8 }).notNull().default("0"),
  pnlPercent: decimal("pnl_percent", { precision: 10, scale: 4 }).notNull().default("0"),
  isOpen: boolean("is_open").notNull().default(true),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  openedAt: true,
  closedAt: true,
});
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;

// Trade history table
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  positionId: integer("position_id").references(() => positions.id),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // 'long' or 'short'
  type: text("type").notNull(), // 'open' or 'close'
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  size: decimal("size", { precision: 20, scale: 8 }).notNull(),
  leverage: integer("leverage").notNull(),
  pnl: decimal("pnl", { precision: 20, scale: 8 }),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  executedAt: true,
});
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
