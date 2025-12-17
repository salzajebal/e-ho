import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBetSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Trust proxy for production (Replit uses reverse proxy)
  if (isProduction) {
    app.set("trust proxy", 1);
  }

  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "myinfx-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        checkPeriod: 86400000,
      }),
      cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
    })
  );

  // Auth middleware helper
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "로그인이 필요합니다" });
    }
    next();
  };

  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "로그인이 필요합니다" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "관리자 권한이 필요합니다" });
    }
    next();
  };

  // Health check endpoint for faster deployment
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // ==================== AUTH ROUTES ====================

  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, name, phone, bankName, accountHolder, accountNumber } = req.body;

      if (!username || username.length < 3) {
        return res.status(400).json({ error: "아이디는 3자 이상이어야 합니다" });
      }

      if (!password || password.length < 4) {
        return res.status(400).json({ error: "비밀번호는 4자 이상이어야 합니다" });
      }

      if (!name) {
        return res.status(400).json({ error: "이름을 입력해주세요" });
      }

      if (!phone || phone.length < 10) {
        return res.status(400).json({ error: "올바른 휴대폰 번호를 입력해주세요" });
      }

      if (!bankName) {
        return res.status(400).json({ error: "은행을 선택해주세요" });
      }

      if (!accountHolder) {
        return res.status(400).json({ error: "예금주를 입력해주세요" });
      }

      if (!accountNumber) {
        return res.status(400).json({ error: "계좌번호를 입력해주세요" });
      }

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "이미 사용 중인 아이디입니다" });
      }

      const user = await storage.createUser({ 
        username, 
        password, 
        name, 
        phone, 
        bankName, 
        accountHolder, 
        accountNumber 
      });

      // Don't auto-login - user needs admin approval first
      res.json({
        success: true,
        message: "회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.",
        pendingApproval: true,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "회원가입에 실패했습니다" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt:", req.body?.username, "ENV:", process.env.NODE_ENV);
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "아이디와 비밀번호를 입력해주세요" });
      }

      console.log("Querying database for user...");
      const user = await storage.getUserByUsername(username);
      console.log("User found:", user ? "yes" : "no", "DB query completed");
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다" });
      }

      // Check approval status first
      if (user.approvalStatus === 'pending') {
        return res.status(403).json({ error: "가입 승인 대기중입니다. 관리자 승인 후 로그인이 가능합니다." });
      }

      if (user.approvalStatus === 'rejected') {
        return res.status(403).json({ error: "가입이 거절되었습니다. 고객센터에 문의해주세요." });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: "동결된 계정입니다. 관리자에게 문의하세요." });
      }

      req.session.userId = user.id;
      
      // Update last login time - wrapped in try-catch to not fail login
      try {
        await storage.updateLastLogin(user.id);
      } catch (updateError) {
        console.error("Failed to update last login time:", updateError);
      }

      console.log("Login successful:", username);
      res.json({
        id: user.id,
        username: user.username,
        balance: user.balance,
        role: user.role,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "로그인에 실패했습니다: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "로그아웃에 실패했습니다" });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.json(null);
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.json(null);
      }

      res.json({
        id: user.id,
        username: user.username,
        balance: user.balance,
        role: user.role,
      });
    } catch (error) {
      res.json(null);
    }
  });

  // ==================== USER ROUTES ====================

  // Get user balance
  app.get("/api/user/balance", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ balance: user.balance });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  });

  // ==================== BETTING ROUTES ====================

  // Get active bets
  app.get("/api/bets", requireAuth, async (req, res) => {
    try {
      const activeBets = await storage.getActiveBets(req.session.userId!);
      res.json(activeBets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bets" });
    }
  });

  // Get bet history
  app.get("/api/bets/history", requireAuth, async (req, res) => {
    try {
      const allBets = await storage.getBets(req.session.userId!);
      res.json(allBets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bet history" });
    }
  });

  // Place a new bet
  app.post("/api/bets", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { symbol, direction, amount, duration, strikePrice, multiplier } = req.body;

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

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentBalance = parseFloat(user.balance);
      if (currentBalance < betAmount) {
        return res.status(400).json({ error: "잔고가 부족합니다" });
      }

      const expiresAt = new Date(Date.now() + duration * 1000);

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

      const newBalance = (currentBalance - betAmount).toString();
      await storage.updateUserBalance(userId, newBalance);

      res.json(bet);
    } catch (error) {
      console.error("Failed to place bet:", error);
      res.status(500).json({ error: "Failed to place bet" });
    }
  });

  // Settle a bet
  app.post("/api/bets/:id/settle", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
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

      let outcome: 'win' | 'lose';
      if (bet.direction === 'long') {
        outcome = closePriceNum > strikePrice ? 'win' : 'lose';
      } else {
        outcome = closePriceNum < strikePrice ? 'win' : 'lose';
      }

      const payout = outcome === 'win' ? betAmount * multiplier : 0;
      const settledBet = await storage.settleBet(id, closePrice, outcome, payout.toString());

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

  // ==================== ADMIN ROUTES ====================

  // Get all users with full details
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allBets = await storage.getAllBets();
      
      const usersWithStats = allUsers.map(u => {
        const userBets = allBets.filter(b => b.userId === u.id && b.outcome !== 'pending');
        const totalBetAmount = userBets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
        const totalWinAmount = userBets.filter(b => b.outcome === 'win').reduce((sum, b) => sum + parseFloat(b.payout || '0'), 0);
        const profitRate = totalBetAmount > 0 ? ((totalWinAmount - totalBetAmount) / totalBetAmount * 100) : 0;
        
        return {
          id: u.id,
          username: u.username,
          password: u.password,
          name: u.name,
          phone: u.phone,
          bankName: u.bankName,
          accountHolder: u.accountHolder,
          accountNumber: u.accountNumber,
          balance: u.balance,
          totalDeposit: u.totalDeposit,
          totalWithdrawal: u.totalWithdrawal,
          totalBet: totalBetAmount.toString(),
          totalWin: totalWinAmount.toString(),
          profitRate: profitRate.toFixed(2),
          role: u.role,
          isActive: u.isActive,
          approvalStatus: u.approvalStatus,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
        };
      });
      
      res.json(usersWithStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get pending users for approval
  app.get("/api/admin/pending-users", requireAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending users" });
    }
  });

  // Approve user registration
  app.post("/api/admin/users/:id/approve", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.approveUser(userId);
      res.json({ success: true, user });
    } catch (error) {
      console.error("Failed to approve user:", error);
      res.status(500).json({ error: "Failed to approve user" });
    }
  });

  // Reject user registration
  app.post("/api/admin/users/:id/reject", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.rejectUser(userId);
      res.json({ success: true, user });
    } catch (error) {
      console.error("Failed to reject user:", error);
      res.status(500).json({ error: "Failed to reject user" });
    }
  });

  // Create user by admin
  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { username, password, name, phone, bankName, accountHolder, accountNumber, balance, role } = req.body;

      if (!username || username.length < 3) {
        return res.status(400).json({ error: "아이디는 3자 이상이어야 합니다" });
      }

      if (!password || password.length < 4) {
        return res.status(400).json({ error: "비밀번호는 4자 이상이어야 합니다" });
      }

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "이미 사용 중인 아이디입니다" });
      }

      const user = await storage.createUser({ 
        username, 
        password, 
        name: name || null, 
        phone: phone || null, 
        bankName: bankName || null, 
        accountHolder: accountHolder || null, 
        accountNumber: accountNumber || null 
      });

      // Update balance, role, and auto-approve admin-created users
      const updateData: any = { approvalStatus: 'approved' };
      if (balance) updateData.balance = balance.toString();
      if (role) updateData.role = role;
      await storage.updateUser(user.id, updateData);

      res.json({ success: true, id: user.id });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "회원 생성에 실패했습니다" });
    }
  });

  // Update user (full update)
  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { username, password, name, phone, bankName, accountHolder, accountNumber, balance, role, isActive, totalDeposit, totalWithdrawal } = req.body;

      const updateData: any = {};
      if (username !== undefined) updateData.username = username;
      if (password !== undefined) updateData.password = password;
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (bankName !== undefined) updateData.bankName = bankName;
      if (accountHolder !== undefined) updateData.accountHolder = accountHolder;
      if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
      if (balance !== undefined) updateData.balance = balance.toString();
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (totalDeposit !== undefined) updateData.totalDeposit = totalDeposit.toString();
      if (totalWithdrawal !== undefined) updateData.totalWithdrawal = totalWithdrawal.toString();

      const updated = await storage.updateUser(id, updateData);
      res.json({ success: true, user: updated });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      if (id === req.session.userId) {
        return res.status(400).json({ error: "자기 자신은 삭제할 수 없습니다" });
      }

      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Get user bets (admin)
  app.get("/api/admin/users/:id/bets", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userBets = await storage.getBets(id);
      res.json(userBets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user bets" });
    }
  });

  // Get all bets with usernames (admin)
  app.get("/api/admin/bets", requireAdmin, async (req, res) => {
    try {
      const allBets = await storage.getAllBetsWithUsers();
      res.json(allBets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bets" });
    }
  });

  // Update bet outcome (admin)
  app.patch("/api/admin/bets/:id", requireAdmin, async (req, res) => {
    try {
      const betId = parseInt(req.params.id);
      const { outcome, closePrice } = req.body;

      if (!['win', 'lose'].includes(outcome)) {
        return res.status(400).json({ error: "Invalid outcome" });
      }

      const bet = await storage.getBet(betId);
      if (!bet) {
        return res.status(404).json({ error: "Bet not found" });
      }

      const oldOutcome = bet.outcome;
      
      // Skip if outcome is already the same (prevent double-click issues)
      if (oldOutcome === outcome) {
        return res.json({ success: true, bet, message: "No change" });
      }

      const oldPayout = parseFloat(bet.payout || '0');
      const betAmount = parseFloat(bet.amount);
      const multiplier = parseFloat(bet.multiplier);
      const newPayout = outcome === 'win' ? betAmount * multiplier : 0;

      // Calculate balance change based on outcome transition
      let balanceChange = 0;
      if (oldOutcome === 'win') {
        // Was win, remove old payout
        balanceChange -= oldPayout;
      }
      if (outcome === 'win') {
        // Now win, add new payout
        balanceChange += newPayout;
      }

      // Update bet outcome
      const updated = await storage.updateBetOutcome(betId, outcome, closePrice || bet.strikePrice);

      // Adjust user balance
      if (balanceChange !== 0) {
        const user = await storage.getUser(bet.userId);
        if (user) {
          const currentBalance = parseFloat(user.balance);
          const newBalance = Math.max(0, currentBalance + balanceChange).toString();
          await storage.updateUserBalance(bet.userId, newBalance);
        }
      }

      res.json({ success: true, bet: updated });
    } catch (error) {
      console.error("Failed to update bet:", error);
      res.status(500).json({ error: "Failed to update bet" });
    }
  });

  // Get dashboard stats
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allBets = await storage.getAllBets();
      
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(u => u.isActive).length;
      const totalBets = allBets.length;
      const pendingBets = allBets.filter(b => b.outcome === 'pending').length;
      const wonBets = allBets.filter(b => b.outcome === 'win').length;
      const lostBets = allBets.filter(b => b.outcome === 'lose').length;
      
      const totalBetAmount = allBets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
      const totalPayout = allBets.filter(b => b.outcome === 'win').reduce((sum, b) => sum + parseFloat(b.payout || '0'), 0);
      const profit = totalBetAmount - totalPayout;

      res.json({
        totalUsers,
        activeUsers,
        totalBets,
        pendingBets,
        wonBets,
        lostBets,
        totalBetAmount,
        totalPayout,
        profit,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ==================== MESSAGE ROUTES ====================

  // Send message to user (admin only)
  app.post("/api/admin/messages", requireAdmin, async (req, res) => {
    try {
      const { receiverId, title, content } = req.body;
      if (!receiverId || !title || !content) {
        return res.status(400).json({ error: "수신자, 제목, 내용을 모두 입력해주세요" });
      }

      const senderId = req.session.userId!;
      const message = await storage.createMessage({
        senderId,
        receiverId,
        title,
        content,
      });

      res.json({ success: true, message });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "메시지 전송에 실패했습니다" });
    }
  });

  // Get user messages (for logged-in user)
  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const userMessages = await storage.getMessagesForUser(userId);
      res.json(userMessages);
    } catch (error) {
      res.status(500).json({ error: "메시지 조회에 실패했습니다" });
    }
  });

  // Get unread messages (for logged-in user) - for popup notifications
  app.get("/api/messages/unread", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const unreadMessages = await storage.getUnreadMessagesForUser(userId);
      res.json(unreadMessages);
    } catch (error) {
      res.status(500).json({ error: "메시지 조회에 실패했습니다" });
    }
  });

  // Mark message as read
  app.post("/api/messages/:id/read", requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "메시지 읽음 처리에 실패했습니다" });
    }
  });

  // Mark all messages as read
  app.post("/api/messages/read-all", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      await storage.markAllMessagesAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "메시지 읽음 처리에 실패했습니다" });
    }
  });

  // ==================== SETTINGS ROUTES ====================

  // Get public setting (telegram link)
  app.get("/api/settings/telegram", async (req, res) => {
    try {
      const telegramLink = await storage.getSetting("telegram_link");
      res.json({ telegramLink: telegramLink || "" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  // Update setting (admin only)
  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key || typeof value !== 'string') {
        return res.status(400).json({ error: "Key and value are required" });
      }
      await storage.setSetting(key, value);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Get all settings (admin only)
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const telegramLink = await storage.getSetting("telegram_link");
      res.json({ telegram_link: telegramLink || "" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  return httpServer;
}
