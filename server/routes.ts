import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPositionSchema, insertTradeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Demo user (for simplicity, no auth required in this mock exchange)
  const DEMO_USER_ID = "demo-user";

  // Initialize demo user if doesn't exist
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

  // Get open positions
  app.get("/api/positions", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const openPositions = await storage.getPositions(userId, true);
      res.json(openPositions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  // Create new position (open trade)
  app.post("/api/positions", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const body = insertPositionSchema.parse({
        ...req.body,
        userId,
      });

      // Check user balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const requiredMargin = parseFloat(body.margin);
      const currentBalance = parseFloat(user.balance);

      if (currentBalance < requiredMargin) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Create position
      const position = await storage.createPosition(body);

      // Deduct margin from balance
      const newBalance = (currentBalance - requiredMargin).toString();
      await storage.updateUserBalance(userId, newBalance);

      // Record trade
      await storage.createTrade({
        userId,
        positionId: position.id,
        symbol: body.symbol,
        side: body.side,
        type: "open",
        price: body.entryPrice,
        size: body.size,
        leverage: body.leverage,
        pnl: null,
      });

      res.json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create position" });
    }
  });

  // Update position (for PnL tracking)
  app.patch("/api/positions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const position = await storage.updatePosition(id, updates);
      res.json(position);
    } catch (error) {
      res.status(500).json({ error: "Failed to update position" });
    }
  });

  // Close position
  app.post("/api/positions/:id/close", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const { closePrice, pnl } = req.body;

      const position = await storage.getPosition(id);
      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }

      if (position.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Close position
      const closedPosition = await storage.closePosition(id, closePrice, pnl);

      // Return margin + pnl to balance
      const user = await storage.getUser(userId);
      if (user) {
        const margin = parseFloat(position.margin);
        const profit = parseFloat(pnl);
        const currentBalance = parseFloat(user.balance);
        const newBalance = (currentBalance + margin + profit).toString();
        await storage.updateUserBalance(userId, newBalance);
      }

      // Record trade
      await storage.createTrade({
        userId,
        positionId: position.id,
        symbol: position.symbol,
        side: position.side,
        type: "close",
        price: closePrice,
        size: position.size,
        leverage: position.leverage,
        pnl,
      });

      res.json(closedPosition);
    } catch (error) {
      res.status(500).json({ error: "Failed to close position" });
    }
  });

  // Get trade history
  app.get("/api/trades", async (req, res) => {
    try {
      const userId = (req as any).userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const trades = await storage.getTrades(userId, limit);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  return httpServer;
}
