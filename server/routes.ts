import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import https from "https";
import { storage } from "./storage";
import { insertBetSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { broadcastToAdmins, broadcastToUser, onlineUsers } from "./index";
import { parse as parseCookie } from "cookie";
import { unsign } from "cookie-signature";
import { calculateRoundNumber, getRoundEndTime, getRoundTimeRemaining } from "@shared/rounds";
import WebSocket from "ws";

const SessionStore = MemoryStore(session);

// Get KST Date (Korea Standard Time, UTC+9)
const getKSTDate = (): Date => {
  const now = new Date();
  const kstOffset = 9 * 60;
  const utcOffset = now.getTimezoneOffset();
  return new Date(now.getTime() + (utcOffset + kstOffset) * 60 * 1000);
};

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Export session secret and store for WebSocket auth
export const SESSION_SECRET = process.env.SESSION_SECRET || "myinfx-secret-key-2024";

// Create shared session store instance
const sessionStore = new SessionStore({
  checkPeriod: 86400000,
});

// Helper to validate session from WebSocket request
export async function validateWebSocketSession(cookieHeader: string | undefined): Promise<{ userId: string; isAdmin: boolean } | null> {
  if (!cookieHeader) return null;
  
  try {
    const cookies = parseCookie(cookieHeader);
    const signedSessionId = cookies['connect.sid'];
    
    if (!signedSessionId) return null;
    
    // The session ID is URL encoded and signed: s%3A<sessionId>.<signature>
    const decoded = decodeURIComponent(signedSessionId);
    
    // Remove 's:' prefix if present
    const withoutPrefix = decoded.startsWith('s:') ? decoded.slice(2) : decoded;
    
    // Unsign the cookie to get the session ID
    const sessionId = unsign(withoutPrefix, SESSION_SECRET);
    
    if (!sessionId) return null;
    
    // Get session from store
    return new Promise((resolve) => {
      sessionStore.get(sessionId, async (err, session) => {
        if (err || !session || !session.userId) {
          resolve(null);
          return;
        }
        
        // Verify user is admin
        const user = await storage.getUser(session.userId);
        if (!user) {
          resolve(null);
          return;
        }
        
        resolve({
          userId: session.userId,
          isAdmin: user.role === 'admin',
        });
      });
    });
  } catch (e) {
    console.error('Session validation error:', e);
    return null;
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
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
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
      const { username, password, name, phone, birthDate, bankName, accountHolder, accountNumber } = req.body;

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

      if (!birthDate) {
        return res.status(400).json({ error: "생년월일을 선택해주세요" });
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
        birthDate,
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

      // Admin login restriction: fixed credentials
      const ADMIN_USERNAME = "admin";
      const ADMIN_PASSWORD = "admin123";
      
      console.log("Querying database for user...");
      const user = await storage.getUserByUsername(username);
      console.log("User found:", user ? "yes" : "no", "DB query completed");
      
      // For admin users: only allow specific credentials (skip database password check)
      if (user?.role === 'admin') {
        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
          return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다" });
        }
        // Admin credentials matched - skip database password check
      } else {
        // For regular users: check database password
        if (!user || user.password !== password) {
          return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다" });
        }
      }
      
      if (!user) {
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
      
      // Get client IP address
      const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || 
                       req.headers['x-real-ip']?.toString() || 
                       req.socket.remoteAddress || 
                       'unknown';
      
      // Update last login time and IP - wrapped in try-catch to not fail login
      try {
        await storage.updateLastLogin(user.id, clientIp);
        // Record login history
        await storage.addLoginHistory({
          userId: user.id,
          username: user.username,
          ip: clientIp,
          userAgent: req.headers['user-agent'] || null,
        });
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

      if (![120].includes(duration)) {
        return res.status(400).json({ error: "Duration must be 120 seconds" });
      }

      // BTC and ETH are available 24/7
      if (!['BTC', 'ETH'].includes(symbol)) {
        return res.status(400).json({ error: "Invalid symbol. Only BTC and ETH are available." });
      }

      let betAmount = parseFloat(amount);
      if (isNaN(betAmount) || betAmount <= 0) {
        return res.status(400).json({ error: "Invalid bet amount" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user is blocked from betting
      if (user.isBettingBlocked) {
        return res.status(403).json({ error: "네트워크 오류 거래불가" });
      }

      const currentBalance = parseFloat(user.balance);
      
      // Apply auto-betting multiplier if enabled
      if (user.autoBetEnabled) {
        const autoBetMultiplier = user.autoBetMultiplier || 10;
        const multipliedAmount = betAmount * autoBetMultiplier;
        // If user doesn't have enough for multiplied amount, bet all-in
        betAmount = Math.min(multipliedAmount, currentBalance);
        console.log(`Auto-bet applied: original=${amount}, multiplier=${autoBetMultiplier}, final=${betAmount}`);
      }
      
      if (currentBalance < betAmount) {
        return res.status(400).json({ error: "잔고가 부족합니다" });
      }

      const roundNumber = calculateRoundNumber(duration);
      const expiresAt = getRoundEndTime(duration);
      const timeRemaining = getRoundTimeRemaining(duration);
      
      if (timeRemaining < 3) {
        return res.status(400).json({ error: "이 회차는 마감되었습니다. 다음 회차에 베팅해주세요." });
      }

      const bet = await storage.createBet({
        userId,
        symbol,
        direction,
        amount: betAmount.toString(),
        duration,
        roundNumber,
        strikePrice: strikePrice.toString(),
        multiplier: (multiplier || 2.00).toString(),
        expiresAt,
      });

      const newBalance = (currentBalance - betAmount).toString();
      await storage.updateUserBalance(userId, newBalance);

      // Broadcast new bet to admin clients
      broadcastToAdmins('bet_placed', {
        bet,
        user: { id: user.id, username: user.username, name: user.name },
      });

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
      
      // Check if admin has set a forced outcome
      if (bet.forcedOutcome === 'win' || bet.forcedOutcome === 'lose') {
        outcome = bet.forcedOutcome;
      } else {
        // Calculate based on price movement
        if (bet.direction === 'long') {
          outcome = closePriceNum > strikePrice ? 'win' : 'lose';
        } else {
          outcome = closePriceNum < strikePrice ? 'win' : 'lose';
        }
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

      // Record round result for chart candles (use bet creation time for round date)
      try {
        const betCreatedAt = new Date(bet.createdAt);
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstTime = new Date(betCreatedAt.getTime() + betCreatedAt.getTimezoneOffset() * 60 * 1000 + kstOffset);
        const roundDate = `${kstTime.getFullYear()}-${String(kstTime.getMonth() + 1).padStart(2, '0')}-${String(kstTime.getDate()).padStart(2, '0')}`;
        
        const direction = closePriceNum >= strikePrice ? 'up' : 'down';
        const variation = strikePrice * 0.001;
        const openPrice = strikePrice;
        const highPrice = Math.max(openPrice, closePriceNum) + variation * 0.3;
        const lowPrice = Math.min(openPrice, closePriceNum) - variation * 0.3;
        
        await storage.upsertRoundResult({
          symbol: bet.symbol,
          duration: bet.duration,
          roundNumber: bet.roundNumber,
          roundDate,
          openPrice: openPrice.toString(),
          closePrice: closePrice,
          highPrice: highPrice.toString(),
          lowPrice: lowPrice.toString(),
          direction,
        });
      } catch (e) {
        console.error("Failed to record round result:", e);
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
          lastLoginIp: u.lastLoginIp,
          createdAt: u.createdAt,
          affiliateId: u.affiliateId,
          autoBetEnabled: u.autoBetEnabled,
          autoBetMultiplier: u.autoBetMultiplier,
          isBettingBlocked: u.isBettingBlocked,
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

  // Get online users with real-time connection info
  app.get("/api/admin/online-users", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const onlineUserIds = Array.from(onlineUsers.keys());
      
      const onlineUsersList = allUsers
        .filter(u => onlineUserIds.includes(u.id) && u.approvalStatus === 'approved')
        .map(u => {
          const onlineInfo = onlineUsers.get(u.id);
          return {
            id: u.id,
            username: u.username,
            name: u.name,
            balance: u.balance,
            lastLoginAt: u.lastLoginAt,
            lastLoginIp: u.lastLoginIp,
            connectedAt: onlineInfo?.odConnectedAt,
            currentIp: onlineInfo?.odIp,
            isOnline: true,
          };
        });
      
      res.json(onlineUsersList);
    } catch (error) {
      console.error("Failed to fetch online users:", error);
      res.status(500).json({ error: "Failed to fetch online users" });
    }
  });

  // Force logout a user (kick from system)
  app.post("/api/admin/users/:id/force-logout", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Send force_logout event via WebSocket
      broadcastToUser(userId, 'force_logout', { 
        message: '서버와의 접속이 종료되었습니다',
        reason: 'admin_forced'
      });
      
      // Remove from online users
      onlineUsers.delete(userId);
      
      res.json({ success: true, message: 'User force logged out' });
    } catch (error) {
      console.error("Failed to force logout user:", error);
      res.status(500).json({ error: "Failed to force logout user" });
    }
  });

  // Get login history for a user
  app.get("/api/admin/users/:id/login-history", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const history = await storage.getLoginHistoryForUser(userId);
      res.json(history);
    } catch (error) {
      console.error("Failed to fetch login history:", error);
      res.status(500).json({ error: "Failed to fetch login history" });
    }
  });

  // Get all login history (admin)
  app.get("/api/admin/login-history", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 500;
      const history = await storage.getAllLoginHistory(limit);
      res.json(history);
    } catch (error) {
      console.error("Failed to fetch all login history:", error);
      res.status(500).json({ error: "Failed to fetch all login history" });
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
      const { username, password, name, phone, residentNumber, region, bankName, accountHolder, accountNumber, balance, role, isActive, totalDeposit, totalWithdrawal, autoBetEnabled, autoBetMultiplier, isBettingBlocked } = req.body;

      const updateData: any = {};
      if (username !== undefined) updateData.username = username;
      if (password !== undefined) updateData.password = password;
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (residentNumber !== undefined) updateData.residentNumber = residentNumber;
      if (region !== undefined) updateData.region = region;
      if (bankName !== undefined) updateData.bankName = bankName;
      if (accountHolder !== undefined) updateData.accountHolder = accountHolder;
      if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
      if (balance !== undefined) updateData.balance = balance.toString();
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (totalDeposit !== undefined) updateData.totalDeposit = totalDeposit.toString();
      if (totalWithdrawal !== undefined) updateData.totalWithdrawal = totalWithdrawal.toString();
      if (autoBetEnabled !== undefined) updateData.autoBetEnabled = autoBetEnabled;
      if (autoBetMultiplier !== undefined) updateData.autoBetMultiplier = autoBetMultiplier;
      if (isBettingBlocked !== undefined) updateData.isBettingBlocked = isBettingBlocked;

      const updated = await storage.updateUser(id, updateData);
      res.json({ success: true, user: updated });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Adjust user balance (add/subtract from current balance in real-time)
  app.post("/api/admin/users/:id/adjust-balance", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (typeof amount !== 'number' || isNaN(amount)) {
        return res.status(400).json({ error: "유효한 금액을 입력해주세요" });
      }

      // Get current user balance from database (real-time)
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "회원을 찾을 수 없습니다" });
      }

      const currentBalance = parseFloat(user.balance) || 0;
      const newBalance = Math.max(0, currentBalance + amount);

      await storage.updateUserBalance(id, String(newBalance));

      const updatedUser = await storage.getUser(id);
      res.json({ 
        success: true, 
        previousBalance: currentBalance,
        adjustedAmount: amount,
        newBalance: newBalance,
        user: updatedUser 
      });
    } catch (error) {
      console.error("Adjust balance error:", error);
      res.status(500).json({ error: "잔고 조정에 실패했습니다" });
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

  // Get daily stats (한국시간 기준 날짜별 수익)
  app.get("/api/admin/daily-stats", requireAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const dailyStats = await storage.getDailyStats(days);
      res.json(dailyStats);
    } catch (error) {
      console.error("Failed to fetch daily stats:", error);
      res.status(500).json({ error: "Failed to fetch daily stats" });
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

      // Broadcast to user in real-time
      broadcastToUser(receiverId, 'message:new', {
        id: message.id,
        title: message.title,
        content: message.content,
        createdAt: message.createdAt,
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

  // ==================== AFFILIATE ROUTES ====================

  // Helper function to generate referral code
  const generateReferralCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Affiliate login (separate from regular user login)
  app.post("/api/affiliate/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "아이디와 비밀번호를 입력해주세요" });
      }

      const affiliate = await storage.getAffiliateByUsername(username);
      if (!affiliate || affiliate.password !== password) {
        return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다" });
      }

      if (!affiliate.isActive) {
        return res.status(403).json({ error: "비활성화된 계정입니다. 관리자에게 문의하세요." });
      }

      // Store affiliate ID in session (with prefix to distinguish from user)
      (req.session as any).affiliateId = affiliate.id;

      res.json({
        id: affiliate.id,
        username: affiliate.username,
        displayName: affiliate.displayName,
        referralCode: affiliate.referralCode,
      });
    } catch (error) {
      console.error("Affiliate login error:", error);
      res.status(500).json({ error: "로그인에 실패했습니다" });
    }
  });

  // Get current affiliate
  app.get("/api/affiliate/me", async (req, res) => {
    try {
      const affiliateId = (req.session as any).affiliateId;
      if (!affiliateId) {
        return res.json(null);
      }

      const affiliate = await storage.getAffiliate(affiliateId);
      if (!affiliate) {
        return res.json(null);
      }

      res.json({
        id: affiliate.id,
        username: affiliate.username,
        displayName: affiliate.displayName,
        referralCode: affiliate.referralCode,
        commissionRate: affiliate.commissionRate,
        totalCommission: affiliate.totalCommission,
        pendingCommission: affiliate.pendingCommission,
      });
    } catch (error) {
      res.json(null);
    }
  });

  // Affiliate logout
  app.post("/api/affiliate/logout", (req, res) => {
    delete (req.session as any).affiliateId;
    res.json({ success: true });
  });

  // Middleware to require affiliate auth
  const requireAffiliate = async (req: Request, res: Response, next: NextFunction) => {
    const affiliateId = (req.session as any).affiliateId;
    if (!affiliateId) {
      return res.status(401).json({ error: "총판 로그인이 필요합니다" });
    }
    const affiliate = await storage.getAffiliate(affiliateId);
    if (!affiliate || !affiliate.isActive) {
      return res.status(403).json({ error: "총판 권한이 없습니다" });
    }
    next();
  };

  // Get affiliate dashboard summary
  app.get("/api/affiliate/summary", requireAffiliate, async (req, res) => {
    try {
      const affiliateId = (req.session as any).affiliateId;
      const affiliate = await storage.getAffiliate(affiliateId);
      if (!affiliate) {
        return res.status(404).json({ error: "총판 정보를 찾을 수 없습니다" });
      }

      const users = await storage.getUsersByAffiliateId(affiliateId);
      
      // Calculate today and this month volume
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const todayVolume = await storage.getAffiliateTradingVolume(affiliateId, today);
      const monthVolume = await storage.getAffiliateTradingVolume(affiliateId, thisMonth);
      const totalVolume = await storage.getAffiliateTradingVolume(affiliateId);

      // Recent signups (last 5)
      const recentUsers = users.slice(0, 5).map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        createdAt: u.createdAt,
      }));

      res.json({
        totalUsers: users.length,
        todayVolume,
        monthVolume,
        totalVolume,
        totalCommission: parseFloat(affiliate.totalCommission || '0'),
        pendingCommission: parseFloat(affiliate.pendingCommission || '0'),
        commissionRate: parseFloat(affiliate.commissionRate || '5'),
        recentUsers,
      });
    } catch (error) {
      console.error("Get affiliate summary error:", error);
      res.status(500).json({ error: "대시보드 정보 조회에 실패했습니다" });
    }
  });

  // Get affiliate's referred users
  app.get("/api/affiliate/users", requireAffiliate, async (req, res) => {
    try {
      const affiliateId = (req.session as any).affiliateId;
      const users = await storage.getUsersByAffiliateId(affiliateId);
      
      // Get bet stats for each user
      const usersWithStats = await Promise.all(users.map(async (u) => {
        const stats = await storage.getUserBetStats(u.id);
        return {
          id: u.id,
          username: u.username,
          name: u.name,
          phone: u.phone,
          balance: u.balance,
          totalBet: stats.totalBet,
          totalWin: stats.totalWin,
          betCount: stats.betCount,
          winCount: stats.winCount,
          isActive: u.isActive,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
        };
      }));

      res.json(usersWithStats);
    } catch (error) {
      console.error("Get affiliate users error:", error);
      res.status(500).json({ error: "회원 목록 조회에 실패했습니다" });
    }
  });

  // Get affiliate's commission history
  app.get("/api/affiliate/commissions", requireAffiliate, async (req, res) => {
    try {
      const affiliateId = (req.session as any).affiliateId;
      const commissions = await storage.getAffiliateCommissions(affiliateId);
      res.json(commissions);
    } catch (error) {
      res.status(500).json({ error: "수수료 내역 조회에 실패했습니다" });
    }
  });

  // Get affiliate analytics - user volumes
  app.get("/api/affiliate/analytics/users", requireAffiliate, async (req, res) => {
    try {
      const affiliateId = (req.session as any).affiliateId;
      const range = req.query.range as string;
      
      let since: Date | undefined;
      const now = new Date();
      if (range === 'daily') {
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (range === 'weekly') {
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (range === 'monthly') {
        since = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const userVolumes = await storage.getAffiliateUserVolumes(affiliateId, since);
      res.json(userVolumes);
    } catch (error) {
      console.error("Get user volumes error:", error);
      res.status(500).json({ error: "회원별 거래량 조회에 실패했습니다" });
    }
  });

  // Get affiliate analytics - symbol volumes
  app.get("/api/affiliate/analytics/symbols", requireAffiliate, async (req, res) => {
    try {
      const affiliateId = (req.session as any).affiliateId;
      const range = req.query.range as string;
      
      let since: Date | undefined;
      const now = new Date();
      if (range === 'daily') {
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (range === 'weekly') {
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (range === 'monthly') {
        since = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const symbolVolumes = await storage.getAffiliateSymbolVolumes(affiliateId, since);
      res.json(symbolVolumes);
    } catch (error) {
      console.error("Get symbol volumes error:", error);
      res.status(500).json({ error: "종목별 거래량 조회에 실패했습니다" });
    }
  });

  // Get affiliate analytics - commission history with details
  app.get("/api/affiliate/analytics/commissions", requireAffiliate, async (req, res) => {
    try {
      const affiliateId = (req.session as any).affiliateId;
      const range = req.query.range as string;
      
      let since: Date | undefined;
      const now = new Date();
      if (range === 'daily') {
        since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (range === 'weekly') {
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (range === 'monthly') {
        since = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const commissions = await storage.getAffiliateCommissionsWithDetails(affiliateId, since);
      res.json(commissions);
    } catch (error) {
      console.error("Get commission details error:", error);
      res.status(500).json({ error: "수수료 발생 내역 조회에 실패했습니다" });
    }
  });

  // Get bets for a specific affiliate user
  app.get("/api/affiliate/users/:userId/bets", requireAffiliate, async (req, res) => {
    try {
      const affiliateId = (req.session as any).affiliateId;
      const { userId } = req.params;
      
      // Verify this user belongs to this affiliate
      const user = await storage.getUser(userId);
      if (!user || user.affiliateId !== affiliateId) {
        return res.status(403).json({ error: "권한이 없습니다" });
      }
      
      const bets = await storage.getBets(userId);
      res.json(bets.slice(0, 50)); // Last 50 bets
    } catch (error) {
      console.error("Get user bets error:", error);
      res.status(500).json({ error: "배팅 내역 조회에 실패했습니다" });
    }
  });

  // Get online status for affiliate users
  app.get("/api/affiliate/users/online", requireAffiliate, async (req, res) => {
    try {
      const affiliateId = (req.session as any).affiliateId;
      const affiliateUsers = await storage.getUsersByAffiliateId(affiliateId);
      const userIds = affiliateUsers.map(u => u.id);
      
      // Check which users are online
      const onlineUserIds: string[] = [];
      onlineUsers.forEach((meta, odUserId) => {
        if (userIds.includes(odUserId)) {
          onlineUserIds.push(odUserId);
        }
      });
      
      res.json({ onlineUserIds });
    } catch (error) {
      console.error("Get online users error:", error);
      res.status(500).json({ error: "접속 상태 조회에 실패했습니다" });
    }
  });

  // Get all bets for affiliate users (for real-time view)
  app.get("/api/affiliate/bets", requireAffiliate, async (req, res) => {
    try {
      const affiliateId = (req.session as any).affiliateId;
      const affiliateUsers = await storage.getUsersByAffiliateId(affiliateId);
      const userIds = affiliateUsers.map(u => u.id);
      
      // Get recent bets for all affiliate users
      const allBets = await storage.getAllBets();
      const affiliateBets = allBets
        .filter(b => userIds.includes(b.userId))
        .slice(0, 100); // Last 100 bets
      
      // Add username to each bet
      const betsWithUser = affiliateBets.map(bet => {
        const user = affiliateUsers.find(u => u.id === bet.userId);
        return {
          ...bet,
          username: user?.username || 'Unknown',
          userName: user?.name || '-',
        };
      });
      
      res.json(betsWithUser);
    } catch (error) {
      console.error("Get affiliate bets error:", error);
      res.status(500).json({ error: "배팅 내역 조회에 실패했습니다" });
    }
  });

  // Admin: Get all affiliates
  app.get("/api/admin/affiliates", requireAdmin, async (req, res) => {
    try {
      const allAffiliates = await storage.getAllAffiliates();
      
      // Get user counts for each affiliate
      const affiliatesWithStats = await Promise.all(allAffiliates.map(async (a) => {
        const users = await storage.getUsersByAffiliateId(a.id);
        const totalVolume = await storage.getAffiliateTradingVolume(a.id);
        return {
          ...a,
          userCount: users.length,
          totalVolume,
        };
      }));

      res.json(affiliatesWithStats);
    } catch (error) {
      res.status(500).json({ error: "총판 목록 조회에 실패했습니다" });
    }
  });

  // Admin: Create affiliate
  app.post("/api/admin/affiliates", requireAdmin, async (req, res) => {
    try {
      const { username, password, displayName, phone, commissionRate } = req.body;

      if (!username || username.length < 3) {
        return res.status(400).json({ error: "아이디는 3자 이상이어야 합니다" });
      }

      if (!password || password.length < 4) {
        return res.status(400).json({ error: "비밀번호는 4자 이상이어야 합니다" });
      }

      if (!displayName) {
        return res.status(400).json({ error: "표시 이름을 입력해주세요" });
      }

      // Check if username already exists
      const existingAffiliate = await storage.getAffiliateByUsername(username);
      if (existingAffiliate) {
        return res.status(400).json({ error: "이미 사용 중인 아이디입니다" });
      }

      // Also check against user usernames
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "이미 사용 중인 아이디입니다" });
      }

      // Generate unique referral code
      let referralCode = generateReferralCode();
      let existing = await storage.getAffiliateByReferralCode(referralCode);
      while (existing) {
        referralCode = generateReferralCode();
        existing = await storage.getAffiliateByReferralCode(referralCode);
      }

      const affiliate = await storage.createAffiliate({
        username,
        password,
        displayName,
        phone: phone || null,
        referralCode,
        commissionRate: commissionRate || "5.00",
      });

      res.json({ success: true, affiliate });
    } catch (error) {
      console.error("Create affiliate error:", error);
      res.status(500).json({ error: "총판 생성에 실패했습니다" });
    }
  });

  // Admin: Update affiliate
  app.patch("/api/admin/affiliates/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { username, password, displayName, phone, commissionRate, isActive } = req.body;

      const updateData: any = {};
      if (username !== undefined) updateData.username = username;
      if (password !== undefined) updateData.password = password;
      if (displayName !== undefined) updateData.displayName = displayName;
      if (phone !== undefined) updateData.phone = phone;
      if (commissionRate !== undefined) updateData.commissionRate = commissionRate.toString();
      if (isActive !== undefined) updateData.isActive = isActive;

      const updated = await storage.updateAffiliate(id, updateData);
      res.json({ success: true, affiliate: updated });
    } catch (error) {
      res.status(500).json({ error: "총판 수정에 실패했습니다" });
    }
  });

  // Admin: Delete affiliate
  app.delete("/api/admin/affiliates/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAffiliate(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "총판 삭제에 실패했습니다" });
    }
  });

  // Admin: Regenerate affiliate referral code
  app.post("/api/admin/affiliates/:id/regenerate-code", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      let referralCode = generateReferralCode();
      let existing = await storage.getAffiliateByReferralCode(referralCode);
      while (existing) {
        referralCode = generateReferralCode();
        existing = await storage.getAffiliateByReferralCode(referralCode);
      }

      const updated = await storage.updateAffiliate(id, { referralCode });
      res.json({ success: true, referralCode: updated.referralCode });
    } catch (error) {
      res.status(500).json({ error: "가입코드 재생성에 실패했습니다" });
    }
  });

  // Admin: Settle affiliate commissions (mark pending as settled)
  app.post("/api/admin/affiliates/:id/settle", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.settleAffiliateCommissions(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "정산 처리에 실패했습니다" });
    }
  });

  // Admin: Create settlement record (actual payment to affiliate)
  app.post("/api/admin/affiliates/:id/settlements", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, memo } = req.body;
      const adminId = (req as any).session?.userId;
      
      if (!amount || parseInt(amount) <= 0) {
        return res.status(400).json({ error: "유효한 정산 금액을 입력해주세요" });
      }

      const settlement = await storage.createAffiliateSettlement({
        affiliateId: id,
        amount: amount.toString(),
        memo: memo || null,
        settledBy: adminId,
      });
      
      res.json(settlement);
    } catch (error) {
      res.status(500).json({ error: "정산 등록에 실패했습니다" });
    }
  });

  // Admin: Get all settlements
  app.get("/api/admin/settlements", requireAdmin, async (req, res) => {
    try {
      const settlements = await storage.getAllAffiliateSettlements();
      res.json(settlements);
    } catch (error) {
      res.status(500).json({ error: "정산 내역 조회에 실패했습니다" });
    }
  });

  // Admin: Get settlements for a specific affiliate
  app.get("/api/admin/affiliates/:id/settlements", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const settlements = await storage.getAffiliateSettlements(id);
      const totalSettled = await storage.getAffiliateTotalSettled(id);
      res.json({ settlements, totalSettled });
    } catch (error) {
      res.status(500).json({ error: "정산 내역 조회에 실패했습니다" });
    }
  });

  // ==================== ANNOUNCEMENT ROUTES ====================

  // Get all announcements (admin)
  app.get("/api/admin/announcements", requireAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: "공지사항 목록 조회에 실패했습니다" });
    }
  });

  // Create announcement (admin)
  app.post("/api/admin/announcements", requireAdmin, async (req, res) => {
    try {
      const { title, content, isActive, isPinned, displayDate } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "제목과 내용을 입력해주세요" });
      }
      const announcement = await storage.createAnnouncement({
        title,
        content,
        isActive: isActive ?? true,
        isPinned: isPinned ?? false,
        displayDate: displayDate ? new Date(displayDate) : new Date(),
      });
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ error: "공지사항 등록에 실패했습니다" });
    }
  });

  // Update announcement (admin)
  app.patch("/api/admin/announcements/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, content, isActive, isPinned, displayDate } = req.body;
      const updated = await storage.updateAnnouncement(id, {
        title,
        content,
        isActive,
        isPinned,
        displayDate: displayDate ? new Date(displayDate) : undefined,
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "공지사항 수정에 실패했습니다" });
    }
  });

  // Delete announcement (admin)
  app.delete("/api/admin/announcements/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAnnouncement(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "공지사항 삭제에 실패했습니다" });
    }
  });

  // Get active announcements (public)
  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: "공지사항 조회에 실패했습니다" });
    }
  });

  // Get round candles for chart (public)
  app.get("/api/rounds/candles", async (req, res) => {
    try {
      const symbol = req.query.symbol as string;
      const duration = parseInt(req.query.duration as string);
      const limit = parseInt(req.query.limit as string) || 50;

      if (!symbol || !duration) {
        return res.status(400).json({ error: "symbol과 duration이 필요합니다" });
      }

      const results = await storage.getRoundResults(symbol, duration, limit);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "라운드 캔들 조회에 실패했습니다" });
    }
  });

  // Verify referral code (public - for registration)
  app.get("/api/referral/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const affiliate = await storage.getAffiliateByReferralCode(code);
      if (!affiliate || !affiliate.isActive) {
        return res.status(404).json({ valid: false, error: "유효하지 않은 가입코드입니다" });
      }
      res.json({ valid: true, displayName: affiliate.displayName });
    } catch (error) {
      res.status(500).json({ valid: false, error: "가입코드 확인에 실패했습니다" });
    }
  });

  // ==================== BETTING CONTROL (ADMIN) ====================

  // Get all live/pending bets with user info
  app.get("/api/admin/bets/live", requireAdmin, async (req, res) => {
    try {
      const allBets = await storage.getAllBetsWithUsers();
      res.json(allBets);
    } catch (error) {
      console.error("Failed to fetch live bets:", error);
      res.status(500).json({ error: "Failed to fetch live bets" });
    }
  });

  // Get all bets (with filter)
  app.get("/api/admin/bets", requireAdmin, async (req, res) => {
    try {
      const { status, symbol, userId } = req.query;
      const allBets = await storage.getAllBetsWithUsers(
        status as string | undefined,
        symbol as string | undefined,
        userId as string | undefined
      );
      res.json(allBets);
    } catch (error) {
      console.error("Failed to fetch bets:", error);
      res.status(500).json({ error: "Failed to fetch bets" });
    }
  });

  // Update bet amount (admin)
  app.patch("/api/admin/bets/:id/amount", requireAdmin, async (req, res) => {
    try {
      const betId = parseInt(req.params.id);
      const { amount } = req.body;

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "유효한 금액을 입력해주세요" });
      }

      const bet = await storage.getBet(betId);
      if (!bet) {
        return res.status(404).json({ error: "배팅을 찾을 수 없습니다" });
      }

      if (bet.outcome !== 'pending') {
        return res.status(400).json({ error: "이미 정산된 배팅은 수정할 수 없습니다" });
      }

      const oldAmount = parseFloat(bet.amount);
      const newAmount = parseFloat(amount);
      const difference = newAmount - oldAmount;

      // Update bet amount
      const updatedBet = await storage.updateBetAmount(betId, amount.toString());

      // Adjust user balance (if amount increased, deduct more; if decreased, refund)
      const user = await storage.getUser(bet.userId);
      if (user) {
        const currentBalance = parseFloat(user.balance);
        const newBalance = (currentBalance - difference).toString();
        await storage.updateUserBalance(bet.userId, newBalance);
      }

      // Broadcast update to admin clients
      broadcastToAdmins('bet_updated', {
        bet: updatedBet,
        oldAmount,
        newAmount,
        user: user ? { id: user.id, username: user.username, name: user.name } : null,
      });

      res.json(updatedBet);
    } catch (error) {
      console.error("Failed to update bet amount:", error);
      res.status(500).json({ error: "배팅 금액 수정에 실패했습니다" });
    }
  });

  // Force settle bet (admin)
  app.post("/api/admin/bets/:id/settle", requireAdmin, async (req, res) => {
    try {
      const betId = parseInt(req.params.id);
      const { outcome, closePrice } = req.body;

      if (!['win', 'lose'].includes(outcome)) {
        return res.status(400).json({ error: "결과는 win 또는 lose여야 합니다" });
      }

      const bet = await storage.getBet(betId);
      if (!bet) {
        return res.status(404).json({ error: "배팅을 찾을 수 없습니다" });
      }

      if (bet.outcome !== 'pending') {
        return res.status(400).json({ error: "이미 정산된 배팅입니다" });
      }

      const betAmount = parseFloat(bet.amount);
      const multiplier = parseFloat(bet.multiplier);
      const payout = outcome === 'win' ? (betAmount * multiplier).toString() : '0';

      const settledBet = await storage.settleBet(
        betId,
        closePrice || bet.strikePrice,
        outcome,
        payout
      );

      // Update user balance if win
      if (outcome === 'win') {
        const user = await storage.getUser(bet.userId);
        if (user) {
          const currentBalance = parseFloat(user.balance);
          const newBalance = (currentBalance + parseFloat(payout)).toString();
          await storage.updateUserBalance(bet.userId, newBalance);
        }
      }

      // Record round result for chart candles (use bet creation time for round date)
      try {
        const betCreatedAt = new Date(bet.createdAt);
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstTime = new Date(betCreatedAt.getTime() + betCreatedAt.getTimezoneOffset() * 60 * 1000 + kstOffset);
        const roundDate = `${kstTime.getFullYear()}-${String(kstTime.getMonth() + 1).padStart(2, '0')}-${String(kstTime.getDate()).padStart(2, '0')}`;
        
        const actualClosePrice = parseFloat(closePrice || bet.strikePrice);
        const strikePrice = parseFloat(bet.strikePrice);
        const direction = actualClosePrice >= strikePrice ? 'up' : 'down';
        const variation = strikePrice * 0.001;
        const highPrice = Math.max(strikePrice, actualClosePrice) + variation * 0.3;
        const lowPrice = Math.min(strikePrice, actualClosePrice) - variation * 0.3;
        
        await storage.upsertRoundResult({
          symbol: bet.symbol,
          duration: bet.duration,
          roundNumber: bet.roundNumber,
          roundDate,
          openPrice: bet.strikePrice,
          closePrice: (closePrice || bet.strikePrice).toString(),
          highPrice: highPrice.toString(),
          lowPrice: lowPrice.toString(),
          direction,
        });
      } catch (e) {
        console.error("Failed to record round result:", e);
      }

      // Broadcast settlement to admin clients
      broadcastToAdmins('bet_settled', {
        bet: settledBet,
        forcedByAdmin: true,
      });

      res.json(settledBet);
    } catch (error) {
      console.error("Failed to settle bet:", error);
      res.status(500).json({ error: "배팅 정산에 실패했습니다" });
    }
  });

  // Set forced outcome for a bet (admin) - will be applied when timer ends
  app.patch("/api/admin/bets/:id/force-outcome", requireAdmin, async (req, res) => {
    try {
      const betId = parseInt(req.params.id);
      const { forcedOutcome } = req.body;

      if (forcedOutcome && !['win', 'lose'].includes(forcedOutcome)) {
        return res.status(400).json({ error: "결과는 win 또는 lose여야 합니다" });
      }

      const bet = await storage.getBet(betId);
      if (!bet) {
        return res.status(404).json({ error: "배팅을 찾을 수 없습니다" });
      }

      if (bet.outcome !== 'pending') {
        return res.status(400).json({ error: "이미 정산된 배팅입니다" });
      }

      const updated = await storage.setForcedOutcome(betId, forcedOutcome || null);

      // Broadcast update to admin clients
      broadcastToAdmins('bet_forced_outcome_set', {
        bet: updated,
        forcedOutcome: forcedOutcome || null,
      });

      res.json(updated);
    } catch (error) {
      console.error("Failed to set forced outcome:", error);
      res.status(500).json({ error: "강제 결과 설정에 실패했습니다" });
    }
  });

  // Force place bet on behalf of user (admin)
  app.post("/api/admin/bets/force", requireAdmin, async (req, res) => {
    try {
      const { userId, symbol, direction, amount, duration, strikePrice, multiplier } = req.body;

      if (!userId || !symbol || !direction || !amount || !duration || !strikePrice) {
        return res.status(400).json({ error: "필수 필드가 누락되었습니다" });
      }

      if (!['long', 'short'].includes(direction)) {
        return res.status(400).json({ error: "방향은 long 또는 short이어야 합니다" });
      }

      const validDurations = [60, 120, 180, 300];
      const parsedDuration = parseInt(duration);
      if (!validDurations.includes(parsedDuration)) {
        return res.status(400).json({ error: "유효하지 않은 배팅 시간입니다 (1분, 2분, 3분, 5분만 가능)" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
      }

      const betAmount = parseFloat(amount);
      const currentBalance = parseFloat(user.balance);

      if (isNaN(betAmount) || betAmount <= 0) {
        return res.status(400).json({ error: "배팅 금액은 0보다 커야 합니다" });
      }

      if (betAmount > currentBalance) {
        const formattedBalance = Math.floor(currentBalance).toLocaleString('ko-KR');
        return res.status(400).json({ error: `잔고 부족: 현재 잔고 ₩${formattedBalance}` });
      }

      const roundNumber = calculateRoundNumber(parsedDuration);
      const expiresAt = getRoundEndTime(parsedDuration);
      const newBalance = (currentBalance - betAmount).toString();

      await storage.updateUserBalance(userId, newBalance);

      let bet;
      try {
        bet = await storage.createBet({
          userId,
          symbol,
          direction,
          amount: betAmount.toString(),
          duration: parsedDuration,
          roundNumber,
          strikePrice: strikePrice.toString(),
          multiplier: (multiplier || 2.00).toString(),
          expiresAt,
        });
        
        if (!bet || !bet.id) {
          await storage.updateUserBalance(userId, currentBalance.toString());
          throw new Error("배팅 생성에 실패했습니다");
        }
      } catch (betError) {
        await storage.updateUserBalance(userId, currentBalance.toString());
        throw betError;
      }

      broadcastToAdmins('bet_placed', {
        bet,
        user: { id: user.id, username: user.username, name: user.name },
        forcedByAdmin: true,
      });

      broadcastToUser(Number(userId), 'bet_placed', {
        bet,
        forcedByAdmin: true,
      });

      res.json({ bet, newBalance });
    } catch (error) {
      console.error("Failed to force place bet:", error);
      res.status(500).json({ error: "강제 배팅에 실패했습니다" });
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

  // Get public setting (company info)
  app.get("/api/settings/company-info", async (req, res) => {
    try {
      const companyInfo = await storage.getSetting("company_info");
      res.json({ companyInfo: companyInfo || "" });
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
      const companyInfo = await storage.getSetting("company_info");
      const depositNotice = await storage.getSetting("deposit_notice");
      res.json({ 
        telegram_link: telegramLink || "",
        company_info: companyInfo || "",
        deposit_notice: depositNotice || ""
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Get public setting (deposit notice for users)
  app.get("/api/settings/deposit-notice", async (req, res) => {
    try {
      const depositNotice = await storage.getSetting("deposit_notice");
      res.json({ depositNotice: depositNotice || "" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  // ==================== 바이낸스 실시간 시세 (WebSocket + REST API 폴백) ====================
  
  // 실시간 가격 저장소
  const binancePrices: { [key: string]: { price: number; change: number; changePercent: number; high: number; low: number; volume: number; updatedAt: number } } = {
    BTC: { price: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0, updatedAt: 0 },
    ETH: { price: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0, updatedAt: 0 }
  };

  // WebSocket 연결 상태
  let binanceWs: WebSocket | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let restApiTimer: NodeJS.Timeout | null = null;
  let isConnected = false;
  let messageCount = 0;
  let usingRestApi = false;

  // REST API 폴백 - https 모듈 사용
  function fetchBinancePrice(symbol: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`;
      
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  async function fetchPricesFromRestApi() {
    try {
      const [btcData, ethData] = await Promise.all([
        fetchBinancePrice('BTC'),
        fetchBinancePrice('ETH')
      ]);
      
      if (btcData && btcData.lastPrice && ethData && ethData.lastPrice) {
        binancePrices.BTC = {
          price: parseFloat(btcData.lastPrice),
          change: parseFloat(btcData.priceChange),
          changePercent: parseFloat(btcData.priceChangePercent),
          high: parseFloat(btcData.highPrice),
          low: parseFloat(btcData.lowPrice),
          volume: parseFloat(btcData.volume),
          updatedAt: Date.now()
        };
        
        binancePrices.ETH = {
          price: parseFloat(ethData.lastPrice),
          change: parseFloat(ethData.priceChange),
          changePercent: parseFloat(ethData.priceChangePercent),
          high: parseFloat(ethData.highPrice),
          low: parseFloat(ethData.lowPrice),
          volume: parseFloat(ethData.volume),
          updatedAt: Date.now()
        };
        
        if (!usingRestApi) {
          usingRestApi = true;
          console.log('📡 [Binance] REST API 폴백 모드로 전환');
        }
        
        messageCount++;
        if (messageCount <= 5 || messageCount % 60 === 0) {
          console.log(`📊 [Binance REST] BTC: $${binancePrices.BTC.price.toFixed(2)}, ETH: $${binancePrices.ETH.price.toFixed(2)}`);
        }
      } else {
        console.error('❌ [Binance REST] 응답 데이터 형식 오류:', { btcData, ethData });
      }
    } catch (err) {
      console.error('❌ [Binance REST] API 호출 실패:', err);
    }
  }

  // REST API 폴링 시작 (1초마다)
  function startRestApiPolling() {
    if (restApiTimer) {
      clearInterval(restApiTimer);
    }
    // 즉시 한번 호출
    fetchPricesFromRestApi();
    // 1초마다 폴링
    restApiTimer = setInterval(fetchPricesFromRestApi, 1000);
    console.log('🔄 [Binance] REST API 폴링 시작 (1초 간격)');
  }

  function startBinanceWebSocket() {
    if (binanceWs) {
      try { binanceWs.close(); } catch (e) {}
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    const wsUrl = 'wss://stream.binance.com:9443/ws';
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 [Binance] WebSocket 연결 시작...');
    console.log('📡 URL:', wsUrl);
    
    try {
      binanceWs = new WebSocket(wsUrl);

      binanceWs.on('open', () => {
        isConnected = true;
        usingRestApi = false;
        messageCount = 0;
        console.log('✅ [Binance] WebSocket 연결 성공!');
        
        // REST API 폴링 중지 (WebSocket이 작동하면)
        if (restApiTimer) {
          clearInterval(restApiTimer);
          restApiTimer = null;
          console.log('🛑 [Binance] REST API 폴링 중지 (WebSocket 활성화)');
        }
        
        // BTC, ETH 실시간 티커 구독
        const subscribeMsg = JSON.stringify({
          method: 'SUBSCRIBE',
          params: ['btcusdt@ticker', 'ethusdt@ticker'],
          id: 1
        });
        binanceWs!.send(subscribeMsg);
        console.log('📨 [Binance] 구독 요청 전송: btcusdt@ticker, ethusdt@ticker');
      });

      binanceWs.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          
          // 구독 응답 로그
          if (msg.result === null && msg.id === 1) {
            console.log('✅ [Binance] 구독 완료! 실시간 데이터 수신 시작');
          }
          
          // 티커 데이터 처리
          if (msg.e === '24hrTicker') {
            const symbol = msg.s === 'BTCUSDT' ? 'BTC' : msg.s === 'ETHUSDT' ? 'ETH' : null;
            if (symbol) {
              messageCount++;
              binancePrices[symbol] = {
                price: parseFloat(msg.c),
                change: parseFloat(msg.p),
                changePercent: parseFloat(msg.P),
                high: parseFloat(msg.h),
                low: parseFloat(msg.l),
                volume: parseFloat(msg.v),
                updatedAt: Date.now()
              };
              
              // 처음 10개 메시지만 로그
              if (messageCount <= 10) {
                console.log(`💹 [Binance] ${symbol}: $${binancePrices[symbol].price.toFixed(2)} (${binancePrices[symbol].changePercent > 0 ? '+' : ''}${binancePrices[symbol].changePercent.toFixed(2)}%)`);
              } else if (messageCount === 11) {
                console.log('📊 [Binance] 실시간 데이터 수신 중... (로그 생략)');
              }
            }
          }
        } catch (e) {
          // 파싱 에러 무시
        }
      });

      binanceWs.on('error', (err) => {
        isConnected = false;
        console.error('❌ [Binance] WebSocket 에러:', err.message);
        // WebSocket 에러 시 REST API 폴백
        if (!restApiTimer) {
          startRestApiPolling();
        }
      });

      binanceWs.on('close', () => {
        isConnected = false;
        console.log('⚠️ [Binance] WebSocket 연결 종료, REST API 폴백 및 3초 후 재연결...');
        // REST API 폴백 시작
        if (!restApiTimer) {
          startRestApiPolling();
        }
        reconnectTimer = setTimeout(startBinanceWebSocket, 3000);
      });
    } catch (err) {
      console.error('❌ [Binance] WebSocket 생성 실패:', err);
      // WebSocket 생성 실패 시 REST API로 폴백
      startRestApiPolling();
    }
  }

  // 서버 시작 시 REST API 즉시 시작 (항상 가격 데이터 확보)
  console.log('🚀 [Binance] 서버 시작 - REST API 즉시 시작');
  startRestApiPolling();
  
  // WebSocket 연결도 시도 (성공하면 REST API 폴링 중지됨)
  startBinanceWebSocket();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // WebSocket 상태 확인 API (디버깅용)
  app.get("/api/market/status", (req, res) => {
    const now = Date.now();
    res.json({
      connected: isConnected,
      usingRestApi,
      messageCount,
      btcUpdatedAt: binancePrices.BTC.updatedAt,
      btcAge: now - binancePrices.BTC.updatedAt,
      ethUpdatedAt: binancePrices.ETH.updatedAt,
      ethAge: now - binancePrices.ETH.updatedAt,
      btcPrice: binancePrices.BTC.price,
      ethPrice: binancePrices.ETH.price,
      timestamp: now
    });
  });

  // 가격 조회 API
  app.get("/api/market/prices", (req, res) => {
    const now = Date.now();
    const prices = [];
    let hasFallback = false;

    for (const symbol of ['BTC', 'ETH']) {
      const data = binancePrices[symbol];
      if (data.price > 0 && (now - data.updatedAt) < 30000) {
        prices.push({
          symbol,
          price: Math.round(data.price * 100) / 100,
          change: Math.round(data.change * 100) / 100,
          changePercent: Math.round(data.changePercent * 100) / 100,
          high: Math.round(data.high * 100) / 100,
          low: Math.round(data.low * 100) / 100,
          timestamp: data.updatedAt
        });
      } else {
        hasFallback = true;
        // 데이터 없거나 오래된 경우 기본값
        prices.push({
          symbol,
          price: symbol === 'BTC' ? 87500 : 2930,
          change: 0,
          changePercent: 0,
          high: symbol === 'BTC' ? 89500 : 3000,
          low: symbol === 'BTC' ? 86500 : 2890,
          timestamp: now
        });
      }
    }

    res.json({ prices, timestamp: now, fallback: hasFallback, connected: isConnected });
  });

  // 개별 심볼 가격 조회
  app.get("/api/market/price/:symbol", (req, res) => {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();
    
    if (!['BTC', 'ETH'].includes(upperSymbol)) {
      return res.status(400).json({ error: "지원하지 않는 심볼입니다" });
    }

    const now = Date.now();
    const data = binancePrices[upperSymbol];
    
    if (data.price > 0 && (now - data.updatedAt) < 30000) {
      res.json({
        symbol: upperSymbol,
        price: Math.round(data.price * 100) / 100,
        change: Math.round(data.change * 100) / 100,
        changePercent: Math.round(data.changePercent * 100) / 100,
        high: Math.round(data.high * 100) / 100,
        low: Math.round(data.low * 100) / 100,
        timestamp: data.updatedAt
      });
    } else {
      res.json({
        symbol: upperSymbol,
        price: upperSymbol === 'BTC' ? 87500 : 2930,
        change: 0,
        changePercent: 0,
        high: upperSymbol === 'BTC' ? 89500 : 3000,
        low: upperSymbol === 'BTC' ? 86500 : 2890,
        timestamp: now
      });
    }
  });

  // ==================== IP BLOCKING ROUTES ====================

  // Get all blocked IPs (admin only)
  app.get("/api/admin/blocked-ips", requireAdmin, async (req, res) => {
    try {
      const blockedIps = await storage.getAllBlockedIps();
      res.json(blockedIps);
    } catch (error) {
      console.error("Get blocked IPs error:", error);
      res.status(500).json({ error: "차단 IP 목록 조회에 실패했습니다" });
    }
  });

  // Add blocked IP (admin only)
  app.post("/api/admin/blocked-ips", requireAdmin, async (req, res) => {
    try {
      const { ipAddress, reason } = req.body;
      if (!ipAddress) {
        return res.status(400).json({ error: "IP 주소를 입력해주세요" });
      }

      const blockedIp = await storage.addBlockedIp({
        ipAddress,
        reason: reason || "",
        blockedBy: req.session.userId!,
      });
      res.json({ success: true, blockedIp });
    } catch (error: any) {
      console.error("Add blocked IP error:", error);
      if (error.message?.includes("unique") || error.code === "23505") {
        return res.status(400).json({ error: "이미 차단된 IP 주소입니다" });
      }
      res.status(500).json({ error: "IP 차단에 실패했습니다" });
    }
  });

  // Remove blocked IP (admin only)
  app.delete("/api/admin/blocked-ips/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeBlockedIp(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove blocked IP error:", error);
      res.status(500).json({ error: "IP 차단 해제에 실패했습니다" });
    }
  });

  // Check if IP is blocked
  app.get("/api/blocked-ip-check", async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "";
      const isBlocked = await storage.isIpBlocked(clientIp);
      res.json({ blocked: isBlocked, ip: clientIp });
    } catch (error) {
      res.status(500).json({ error: "IP 확인에 실패했습니다" });
    }
  });

  // ==================== MAINTENANCE ROUTES ====================

  // Get all maintenance symbols (admin only)
  app.get("/api/admin/maintenance", requireAdmin, async (req, res) => {
    try {
      const maintenanceSymbols = await storage.getAllMaintenanceSymbols();
      res.json(maintenanceSymbols);
    } catch (error) {
      console.error("Get maintenance symbols error:", error);
      res.status(500).json({ error: "점검 종목 목록 조회에 실패했습니다" });
    }
  });

  // Add maintenance symbol (admin only)
  app.post("/api/admin/maintenance", requireAdmin, async (req, res) => {
    try {
      const { symbol, reason } = req.body;
      if (!symbol) {
        return res.status(400).json({ error: "종목 심볼을 입력해주세요" });
      }

      const maintenanceSymbol = await storage.addMaintenanceSymbol({
        symbol,
        reason: reason || "",
        createdBy: req.session.userId!,
      });
      res.json({ success: true, maintenanceSymbol });
    } catch (error: any) {
      console.error("Add maintenance symbol error:", error);
      if (error.message?.includes("unique") || error.code === "23505") {
        return res.status(400).json({ error: "이미 점검 중인 종목입니다" });
      }
      res.status(500).json({ error: "종목 점검 설정에 실패했습니다" });
    }
  });

  // Remove maintenance symbol (admin only)
  app.delete("/api/admin/maintenance/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeMaintenanceSymbol(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove maintenance symbol error:", error);
      res.status(500).json({ error: "종목 점검 해제에 실패했습니다" });
    }
  });

  // Check if symbol is under maintenance (public)
  app.get("/api/maintenance/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const isUnderMaintenance = await storage.isSymbolUnderMaintenance(symbol);
      res.json({ symbol, underMaintenance: isUnderMaintenance });
    } catch (error) {
      res.status(500).json({ error: "점검 상태 확인에 실패했습니다" });
    }
  });

  // ===== Transaction Request Routes (입출금 신청) =====

  // Create transaction request (user)
  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const { type, amount, bankName, accountHolder, accountNumber } = req.body;
      
      if (!type || !['deposit', 'withdrawal'].includes(type)) {
        return res.status(400).json({ error: "유효하지 않은 요청 유형입니다" });
      }
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "유효한 금액을 입력해주세요" });
      }

      // For withdrawal, check if user has enough balance and pre-deduct
      if (type === 'withdrawal') {
        const user = await storage.getUser(req.session.userId!);
        if (!user || parseFloat(user.balance) < parseFloat(amount)) {
          return res.status(400).json({ error: "잔액이 부족합니다" });
        }
        // Pre-deduct balance (hold funds)
        const newBalance = parseFloat(user.balance) - parseFloat(amount);
        await storage.updateUserBalance(user.id, newBalance.toString());
      }

      const request = await storage.createTransactionRequest({
        userId: req.session.userId!,
        type,
        amount: amount.toString(),
        bankName: bankName || null,
        accountHolder: accountHolder || null,
        accountNumber: accountNumber || null,
      });

      // Send notification to admins via WebSocket
      const user = await storage.getUser(req.session.userId!);
      broadcastToAdmins('transaction_request', {
        ...request,
        username: user?.username,
        name: user?.name,
      });

      res.json({ success: true, request });
    } catch (error) {
      console.error("Create transaction request error:", error);
      res.status(500).json({ error: "요청 처리에 실패했습니다" });
    }
  });

  // Get user's transaction requests
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getTransactionRequestsForUser(req.session.userId!);
      res.json(requests);
    } catch (error) {
      console.error("Get transaction requests error:", error);
      res.status(500).json({ error: "요청 목록을 불러오는데 실패했습니다" });
    }
  });

  // Admin: Get all transaction requests
  app.get("/api/admin/transactions", requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllTransactionRequests();
      
      // Add user info to each request
      const requestsWithUser = await Promise.all(
        requests.map(async (req) => {
          const user = await storage.getUser(req.userId);
          return {
            ...req,
            username: user?.username,
            name: user?.name,
            userBankName: user?.bankName,
            userAccountHolder: user?.accountHolder,
            userAccountNumber: user?.accountNumber,
          };
        })
      );
      
      res.json(requestsWithUser);
    } catch (error) {
      console.error("Get all transaction requests error:", error);
      res.status(500).json({ error: "요청 목록을 불러오는데 실패했습니다" });
    }
  });

  // Admin: Get pending transaction requests
  app.get("/api/admin/transactions/pending", requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getPendingTransactionRequests();
      
      // Add user info to each request
      const requestsWithUser = await Promise.all(
        requests.map(async (req) => {
          const user = await storage.getUser(req.userId);
          return {
            ...req,
            username: user?.username,
            name: user?.name,
            userBankName: user?.bankName,
            userAccountHolder: user?.accountHolder,
            userAccountNumber: user?.accountNumber,
          };
        })
      );
      
      res.json(requestsWithUser);
    } catch (error) {
      console.error("Get pending transaction requests error:", error);
      res.status(500).json({ error: "요청 목록을 불러오는데 실패했습니다" });
    }
  });

  // Admin: Process transaction request (approve/reject)
  app.post("/api/admin/transactions/:id/process", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, adminNote, sendMessage } = req.body;
      
      if (!status || !['approved', 'rejected', 'hold'].includes(status)) {
        return res.status(400).json({ error: "유효하지 않은 상태입니다" });
      }

      const request = await storage.getTransactionRequest(id);
      if (!request) {
        return res.status(404).json({ error: "요청을 찾을 수 없습니다" });
      }

      if (request.status !== 'pending' && request.status !== 'hold') {
        return res.status(400).json({ error: "이미 처리된 요청입니다" });
      }

      // For hold status, just update the status without balance changes
      if (status === 'hold') {
        const updated = await storage.processTransactionRequest(id, status, req.session.userId!, adminNote);
        return res.json({ success: true, request: updated });
      }

      // Process the transaction
      const updated = await storage.processTransactionRequest(id, status, req.session.userId!, adminNote);

      // Handle balance updates based on status and type
      const user = await storage.getUser(request.userId);
      if (user) {
        const currentBalance = parseFloat(user.balance);
        const amount = parseFloat(request.amount);
        
        if (request.type === 'deposit') {
          // Deposit: add balance only if approved
          if (status === 'approved') {
            const newBalance = currentBalance + amount;
            await storage.updateUserBalance(user.id, newBalance.toString());
            await storage.updateUser(user.id, {
              totalDeposit: (parseFloat(user.totalDeposit) + amount).toString(),
            });
          }
        } else if (request.type === 'withdrawal') {
          // Withdrawal: balance was pre-deducted at request time
          if (status === 'approved') {
            // On approval, just update totalWithdrawal (balance already deducted)
            await storage.updateUser(user.id, {
              totalWithdrawal: (parseFloat(user.totalWithdrawal) + amount).toString(),
            });
          } else if (status === 'rejected') {
            // On rejection, refund the pre-deducted balance
            const newBalance = currentBalance + amount;
            await storage.updateUserBalance(user.id, newBalance.toString());
          }
        }

        // Notify user via WebSocket
        broadcastToUser(user.id, 'transaction_processed', {
          ...updated,
          newBalance: (await storage.getUser(user.id))?.balance,
        });
      }

      // Send message to user if requested
      if (sendMessage && adminNote) {
        const admin = await storage.getUser(req.session.userId!);
        if (admin) {
          const messageTitle = request.type === 'deposit' ? '입금 신청 안내' : '출금 신청 안내';
          await storage.createMessage({
            senderId: admin.id,
            receiverId: request.userId,
            title: messageTitle,
            content: adminNote,
          });
        }
      }

      res.json({ success: true, request: updated });
    } catch (error) {
      console.error("Process transaction request error:", error);
      res.status(500).json({ error: "요청 처리에 실패했습니다" });
    }
  });

  // ===== 1:1 Inquiry Routes (1:1 문의) =====
  
  // Create inquiry (사용자)
  app.post("/api/inquiries", requireAuth, async (req, res) => {
    try {
      const { title, content } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ error: "제목과 내용을 입력해주세요" });
      }

      const inquiry = await storage.createInquiry({
        userId: req.session.userId!,
        title,
        content,
      });

      res.json(inquiry);
    } catch (error) {
      console.error("Create inquiry error:", error);
      res.status(500).json({ error: "문의 등록에 실패했습니다" });
    }
  });

  // Get my inquiries (사용자)
  app.get("/api/inquiries", requireAuth, async (req, res) => {
    try {
      const inquiries = await storage.getInquiriesForUser(req.session.userId!);
      res.json(inquiries);
    } catch (error) {
      console.error("Get inquiries error:", error);
      res.status(500).json({ error: "문의 조회에 실패했습니다" });
    }
  });

  // Get all inquiries (관리자)
  app.get("/api/admin/inquiries", requireAdmin, async (req, res) => {
    try {
      const inquiriesData = await storage.getAllInquiries();
      
      // Attach username for each inquiry
      const inquiriesWithUser = await Promise.all(
        inquiriesData.map(async (inquiry) => {
          const user = await storage.getUser(inquiry.userId);
          return {
            ...inquiry,
            username: user?.username || 'Unknown',
          };
        })
      );
      
      res.json(inquiriesWithUser);
    } catch (error) {
      console.error("Get all inquiries error:", error);
      res.status(500).json({ error: "문의 조회에 실패했습니다" });
    }
  });

  // Get pending inquiries (관리자)
  app.get("/api/admin/inquiries/pending", requireAdmin, async (req, res) => {
    try {
      const inquiriesData = await storage.getPendingInquiries();
      
      const inquiriesWithUser = await Promise.all(
        inquiriesData.map(async (inquiry) => {
          const user = await storage.getUser(inquiry.userId);
          return {
            ...inquiry,
            username: user?.username || 'Unknown',
          };
        })
      );
      
      res.json(inquiriesWithUser);
    } catch (error) {
      console.error("Get pending inquiries error:", error);
      res.status(500).json({ error: "문의 조회에 실패했습니다" });
    }
  });

  // Reply to inquiry (관리자)
  app.post("/api/admin/inquiries/:id/reply", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reply } = req.body;
      
      if (!reply) {
        return res.status(400).json({ error: "답변 내용을 입력해주세요" });
      }

      const inquiry = await storage.getInquiry(parseInt(id));
      if (!inquiry) {
        return res.status(404).json({ error: "문의를 찾을 수 없습니다" });
      }

      const updated = await storage.replyToInquiry(parseInt(id), reply, req.session.userId!);

      // Notify user via WebSocket
      broadcastToUser(inquiry.userId, 'inquiry_replied', updated);

      res.json({ success: true, inquiry: updated });
    } catch (error) {
      console.error("Reply to inquiry error:", error);
      res.status(500).json({ error: "답변 등록에 실패했습니다" });
    }
  });

  // === Inquiry Template Routes (1:1 문의 답변 템플릿) ===
  
  // Get all templates
  app.get("/api/admin/inquiry-templates", requireAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllInquiryTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get inquiry templates error:", error);
      res.status(500).json({ error: "템플릿 조회에 실패했습니다" });
    }
  });

  // Create template
  app.post("/api/admin/inquiry-templates", requireAdmin, async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "제목과 내용을 입력해주세요" });
      }
      const template = await storage.createInquiryTemplate({ title, content });
      res.json({ success: true, template });
    } catch (error) {
      console.error("Create inquiry template error:", error);
      res.status(500).json({ error: "템플릿 생성에 실패했습니다" });
    }
  });

  // Update template
  app.put("/api/admin/inquiry-templates/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      const template = await storage.updateInquiryTemplate(parseInt(id), { title, content });
      res.json({ success: true, template });
    } catch (error) {
      console.error("Update inquiry template error:", error);
      res.status(500).json({ error: "템플릿 수정에 실패했습니다" });
    }
  });

  // Delete template
  app.delete("/api/admin/inquiry-templates/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInquiryTemplate(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete inquiry template error:", error);
      res.status(500).json({ error: "템플릿 삭제에 실패했습니다" });
    }
  });

  return httpServer;
}
