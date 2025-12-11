import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBetSchema } from "@shared/schema";
import { z } from "zod";

// Store for current market prices (updated by client)
const marketPrices: Record<string, number> = {};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Demo user (for simplicity, no auth required)
  app.use(async (req, res, next) => {
    try {
      let user = await storage.getUserByUsername("demo");
      if (!user) {
        user = await storage.createUser({
          username: "demo",
          password: "demo123",
        });
      }
      (req as any).userId = user.id;
      next();
    } catch (error) {
      next(error);
    }
  });

  // Get user balance
  app.get("/api/user/balance", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ balance: user.balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });

  // Update market price (called by frontend)
  app.post("/api/market/price", async (req, res) => {
    try {
      const { symbol, price } = req.body;
      if (symbol && typeof price === 'number') {
        marketPrices[symbol] = price;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update price" });
    }
  });

  // Get active bets
  app.get("/api/bets", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const activeBets = await storage.getActiveBets(userId);
      res.json(activeBets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bets" });
    }
  });

  // Get bet history
  app.get("/api/bets/history", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const allBets = await storage.getBets(userId);
      res.json(allBets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bet history" });
    }
  });

  // Place a new bet
  app.post("/api/bets", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { symbol, direction, amount, duration, strikePrice, multiplier } = req.body;

      // Validate input
      if (!symbol || !direction || !amount || !duration || !strikePrice) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!['long', 'short'].includes(direction)) {
        return res.status(400).json({ error: "Direction must be 'long' or 'short'" });
      }

      if (![60, 120, 180, 300].includes(duration)) {
        return res.status(400).json({ error: "Duration must be 60, 120, 180, or 300 seconds" });
      }

      const betAmount = parseFloat(amount);
      if (isNaN(betAmount) || betAmount <= 0) {
        return res.status(400).json({ error: "Invalid bet amount" });
      }

      // Check user balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentBalance = parseFloat(user.balance);
      if (currentBalance < betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Calculate expiry time
      const expiresAt = new Date(Date.now() + duration * 1000);

      // Create bet
      const bet = await storage.createBet({
        userId,
        symbol,
        direction,
        amount: amount.toString(),
        duration,
        strikePrice: strikePrice.toString(),
        multiplier: (multiplier || 1.90).toString(),
        expiresAt,
      });

      // Deduct bet amount from balance
      const newBalance = (currentBalance - betAmount).toString();
      await storage.updateUserBalance(userId, newBalance);

      res.json(bet);
    } catch (error) {
      console.error("Failed to place bet:", error);
      res.status(500).json({ error: "Failed to place bet" });
    }
  });

  // Settle a bet (called when timer expires)
  app.post("/api/bets/:id/settle", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const { closePrice } = req.body;

      const bet = await storage.getBet(id);
      if (!bet) {
        return res.status(404).json({ error: "Bet not found" });
      }

      if (bet.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (bet.outcome !== 'pending') {
        return res.status(400).json({ error: "Bet already settled" });
      }

      const strikePrice = parseFloat(bet.strikePrice);
      const closePriceNum = parseFloat(closePrice);
      const betAmount = parseFloat(bet.amount);
      const multiplier = parseFloat(bet.multiplier);

      // Determine outcome
      let outcome: 'win' | 'lose';
      if (bet.direction === 'long') {
        outcome = closePriceNum > strikePrice ? 'win' : 'lose';
      } else {
        outcome = closePriceNum < strikePrice ? 'win' : 'lose';
      }

      // Calculate payout
      const payout = outcome === 'win' ? betAmount * multiplier : 0;

      // Settle the bet
      const settledBet = await storage.settleBet(id, closePrice, outcome, payout.toString());

      // Credit payout to user if won
      if (outcome === 'win') {
        const user = await storage.getUser(userId);
        if (user) {
          const currentBalance = parseFloat(user.balance);
          const newBalance = (currentBalance + payout).toString();
          await storage.updateUserBalance(userId, newBalance);
        }
      }

      res.json(settledBet);
    } catch (error) {
      console.error("Failed to settle bet:", error);
      res.status(500).json({ error: "Failed to settle bet" });
    }
  });

  return httpServer;
}
