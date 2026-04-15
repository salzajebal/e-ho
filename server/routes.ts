import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBetSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { Pool } from "pg";
import { broadcastToAdmins, broadcastToUser, onlineUsers } from "./index";
import { parse as parseCookie } from "cookie";
import { unsign } from "cookie-signature";
import { calculateRoundNumber, getRoundEndTime, getRoundTimeRemaining } from "@shared/rounds";
import WebSocket from "ws";
import {
  sendTelegramNotification,
  notifyNewInquiry,
  notifyDepositRequest,
  notifyLargeBet,
} from "./telegramBot";

const PgSessionStore = pgSession(session);

// Create a separate pool for session store
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
    adminUserId?: string;
  }
}

// Export session secret and store for WebSocket auth
export const SESSION_SECRET = process.env.SESSION_SECRET || "myinfx-secret-key-2024";

// Create shared session store instance using PostgreSQL
const sessionStore = new PgSessionStore({
  pool: sessionPool,
  tableName: 'user_sessions',
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15,
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
        if (err || !session) {
          resolve(null);
          return;
        }
        
        const effectiveUserId = session.adminUserId || session.userId;
        if (!effectiveUserId) {
          resolve(null);
          return;
        }
        
        const user = await storage.getUser(effectiveUserId);
        if (!user) {
          resolve(null);
          return;
        }
        
        resolve({
          userId: effectiveUserId,
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
  
  // Trust proxy - always enabled for Replit (uses reverse proxy)
  app.set("trust proxy", 1);

  // Session middleware - 7 days session with rolling (extends on activity)
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      rolling: true, // Reset session expiry on each request
      cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: isProduction ? "none" : "lax", // "none" required for cross-site cookies with secure
      },
    })
  );

  // Touch session on every request to keep it alive
  app.use((req, res, next) => {
    if (req.session) {
      req.session.touch();
    }
    next();
  });

  // Auth middleware helper
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "로그인이 필요합니다" });
    }
    next();
  };

  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    // Use separate admin session
    if (!req.session.adminUserId) {
      return res.status(401).json({ error: "관리자 로그인이 필요합니다" });
    }
    const user = await storage.getUser(req.session.adminUserId);
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
  app.post("/api/auth/check-username", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username || username.length < 3) {
        return res.status(400).json({ available: false, error: "아이디는 3자 이상이어야 합니다" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.json({ available: false, error: "이미 사용 중인 아이디입니다" });
      }
      return res.json({ available: true, message: "사용 가능한 아이디입니다" });
    } catch (error) {
      res.status(500).json({ available: false, error: "중복확인에 실패했습니다" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, name, phone, birthDate, region, branchCode, bankName, accountHolder, accountNumber } = req.body;

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
        birthDate,
        region,
        branchCode,
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

      // Admin login restriction: fixed credentials (ignoring env vars due to swap issue)
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

      // Set user session
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
        bankName: user.bankName,
        accountHolder: user.accountHolder,
        accountNumber: user.accountNumber,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "로그인에 실패했습니다: " + (error instanceof Error ? error.message : String(error)) });
    }
  });

  // Logout - destroys entire session
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
        bankName: user.bankName,
        accountHolder: user.accountHolder,
        accountNumber: user.accountNumber,
      });
    } catch (error) {
      res.json(null);
    }
  });

  // ==================== ADMIN AUTH ROUTES (Separate Session) ====================
  
  // Admin Login - uses separate adminUserId session
  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "아이디와 비밀번호를 입력해주세요" });
      }

      // Admin login restriction: fixed credentials (ignoring env vars due to swap issue)
      const ADMIN_USERNAME = "admin";
      const ADMIN_PASSWORD = "admin123";
      
      const user = await storage.getUserByUsername(username);
      
      // Only allow admin role users
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ error: "관리자 계정이 아닙니다" });
      }

      // Check admin credentials
      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다" });
      }

      // Set admin session
      req.session.adminUserId = user.id;
      
      // Explicitly save session and wait for completion before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      console.log("Admin login successful, session saved:", req.session.adminUserId);
      
      res.json({
        id: user.id,
        username: user.username,
        balance: user.balance,
        role: user.role,
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "로그인에 실패했습니다" });
    }
  });

  // Admin Logout - destroys entire session
  app.post("/api/admin/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "로그아웃에 실패했습니다" });
      }
      res.json({ success: true });
    });
  });

  // Get current admin user
  app.get("/api/admin/auth/me", async (req, res) => {
    try {
      if (!req.session.adminUserId) {
        return res.json(null);
      }

      const user = await storage.getUser(req.session.adminUserId);
      if (!user || user.role !== 'admin') {
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

  // Change password (user self-service)
  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { newPassword, confirmPassword } = req.body;

      if (!newPassword || typeof newPassword !== 'string') {
        return res.status(400).json({ error: "새 비밀번호를 입력해주세요" });
      }
      if (newPassword.length < 4) {
        return res.status(400).json({ error: "비밀번호는 4자 이상이어야 합니다" });
      }
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "비밀번호가 일치하지 않습니다" });
      }

      await storage.updateUser(userId, { password: newPassword });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "비밀번호 변경에 실패했습니다" });
    }
  });

  // Update bank account (user self-service)
  app.patch("/api/user/bank", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { bankName, accountNumber, accountHolder } = req.body;

      if (!bankName || !accountNumber || !accountHolder) {
        return res.status(400).json({ error: "모든 계좌 정보를 입력해주세요" });
      }

      await storage.updateUser(userId, { bankName, accountNumber, accountHolder });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "계좌 정보 변경에 실패했습니다" });
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

      if (![300].includes(duration)) {
        return res.status(400).json({ error: "Duration must be 300 seconds" });
      }

      const VALID_SYMBOLS = ['SP500', 'DOW', 'DXY'];
      if (!VALID_SYMBOLS.includes(symbol)) {
        return res.status(400).json({ error: "Invalid symbol. Only SP500, DOW, DXY are available." });
      }

      // 종목 서버 점검 중 차단
      const underMaintenance = await storage.isSymbolUnderMaintenance(symbol);
      if (underMaintenance) {
        return res.status(503).json({ error: `${symbol} 종목은 현재 서버 점검 중입니다. 잠시 후 다시 시도해주세요.` });
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

      if (user.autoBetEnabled) {
        const autoBetMultiplier = user.autoBetMultiplier || 10;
        betAmount = betAmount * autoBetMultiplier;
        console.log(`[자동증폭] 원금: ${amount}원, 배수: x${autoBetMultiplier}, 최종: ${betAmount}원`);
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

      // Check if user already has a bet for this round (1 bet per round limit)
      const existingBet = await storage.getUserBetForRound(userId, symbol, duration, roundNumber);
      if (existingBet) {
        return res.status(400).json({ error: "회차당 1회만 거래 가능합니다. 다음 회차를 이용해주세요." });
      }

      // Check if user has pre-set forced display direction (up/down)
      // This determines how the result appears to the user (price went up or down)
      let forcedOutcome: 'win' | 'lose' | null = null;
      if (user.forcedBetDirection === 'up' || user.forcedBetDirection === 'down') {
        // up + long = win, up + short = lose
        // down + long = lose, down + short = win
        if (user.forcedBetDirection === 'up') {
          forcedOutcome = direction === 'long' ? 'win' : 'lose';
        } else {
          forcedOutcome = direction === 'long' ? 'lose' : 'win';
        }
        // Clear the forced direction after applying (one-time use)
        await storage.updateUser(userId, { forcedBetDirection: null });
        console.log(`Applied forced display direction: ${user.forcedBetDirection} -> outcome: ${forcedOutcome} for user ${user.username}`);
      }

      // 미실현 모드 유저: 자동으로 미적중(lose) 강제지정 → 실시간 거래관리에 자동 반영
      if (!forcedOutcome && user.alwaysPendingEnabled) {
        forcedOutcome = 'lose';
        console.log(`🔒 [미실현 모드] ${user.username}: 베팅 생성 시 자동 미적중 지정`);
      }

      let finalDirection = direction;
      const now = new Date();
      const kstOff = 9 * 60;
      const utcOff = now.getTimezoneOffset();
      const kstNow = new Date(now.getTime() + (utcOff + kstOff) * 60 * 1000);
      const betDateKey = `${kstNow.getFullYear()}-${String(kstNow.getMonth() + 1).padStart(2, '0')}-${String(kstNow.getDate()).padStart(2, '0')}`;
      const roundForcedList = await storage.getRoundForcedDirectionsForRound(symbol, duration, roundNumber, betDateKey);
      const dirForced = roundForcedList.find(r => r.forcedDirection === 'up' || r.forcedDirection === 'down');
      if (dirForced) {
        finalDirection = dirForced.forcedDirection === 'up' ? 'long' : 'short';
        console.log(`🔄 [Bet Create] ${symbol} R${roundNumber}: 방향 강제 적용 ${direction} → ${finalDirection}`);
      }

      const bet = await storage.createBet({
        userId,
        symbol,
        direction: finalDirection,
        amount: betAmount.toString(),
        duration,
        roundNumber,
        strikePrice: strikePrice.toString(),
        multiplier: (multiplier || 2.00).toString(),
        expiresAt,
        forcedOutcome,
      });

      const newBalance = (currentBalance - betAmount).toString();
      await storage.updateUserBalance(userId, newBalance);

      // Broadcast new bet to admin clients
      broadcastToAdmins('bet_placed', {
        bet,
        user: { id: user.id, username: user.username, name: user.name },
      });

      // 텔레그램: 특정회원 알림 ON이면 금액무관, 아니면 100만원 이상만 알림
      if (user.telegramNotifyEnabled || betAmount >= 1_000_000) {
        notifyLargeBet(storage, {
          username: user.username,
          symbol,
          duration,
          direction: finalDirection,
          amount: betAmount,
        }).catch(() => {});
      }

      res.json(bet);
    } catch (error: any) {
      if (error?.code === '23505' || error?.message?.includes('idx_bets_user_round')) {
        return res.status(400).json({ error: "회차당 1회만 거래 가능합니다. 다음 회차를 이용해주세요." });
      }
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

      const bettingUser = await storage.getUser(bet.userId);
      const strikePrice = parseFloat(bet.strikePrice);
      let closePriceNum = parseFloat(closePrice);
      const betAmount = parseFloat(bet.amount);
      const multiplier = parseFloat(bet.multiplier);

      let outcome: 'win' | 'lose';
      
      // Get the date key for round forced directions (KST)
      const betCreatedAt = new Date(bet.createdAt);
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstBetTime = new Date(betCreatedAt.getTime() + betCreatedAt.getTimezoneOffset() * 60 * 1000 + kstOffset);
      const betDateKey = `${kstBetTime.getFullYear()}-${String(kstBetTime.getMonth() + 1).padStart(2, '0')}-${String(kstBetTime.getDate()).padStart(2, '0')}`;
      
      // Priority: 1) outcomeForced  2) displayForced  3) directionForced  4) globalForced  5) individual forced  6) price-based
      const roundForcedList = await storage.getRoundForcedDirectionsForRound(bet.symbol, bet.duration, bet.roundNumber, betDateKey);
      const directionForced = roundForcedList.find(r => r.forcedDirection === 'up' || r.forcedDirection === 'down');
      const outcomeForced = roundForcedList.find(r => r.forcedDirection === 'all_win' || r.forcedDirection === 'all_lose');
      const displayForced = roundForcedList.find(r => r.forcedDirection === 'display_up' || r.forcedDirection === 'display_down');
      
      // Check global forced setting only if NO round-level settings exist at all
      let globalForcedOutcome: string | undefined;
      if (!outcomeForced && !displayForced && !directionForced) {
        const globalVal = await storage.getSetting(`global_forced:${bet.symbol}:${bet.duration}`);
        if (globalVal === 'all_win' || globalVal === 'all_lose') {
          globalForcedOutcome = globalVal;
        }
      }
      
      if (outcomeForced) {
        const variation = strikePrice * 0.001;
        outcome = outcomeForced.forcedDirection === 'all_win' ? 'win' : 'lose';
        if (outcome === 'win') {
          closePriceNum = bet.direction === 'long' ? strikePrice + variation : strikePrice - variation;
        } else {
          closePriceNum = bet.direction === 'long' ? strikePrice - variation : strikePrice + variation;
        }
      } else if (displayForced) {
        const forcedDir: 'long' | 'short' = displayForced.forcedDirection === 'display_up' ? 'long' : 'short';
        const variation = strikePrice * 0.001;
        outcome = bet.direction === forcedDir ? 'win' : 'lose';
        if (outcome === 'win') {
          closePriceNum = bet.direction === 'long' ? strikePrice + variation : strikePrice - variation;
        } else {
          closePriceNum = bet.direction === 'long' ? strikePrice - variation : strikePrice + variation;
        }
      } else if (directionForced) {
        const variation = strikePrice * 0.001;
        outcome = 'win';
        closePriceNum = bet.direction === 'long' ? strikePrice + variation : strikePrice - variation;
      } else if (globalForcedOutcome) {
        const variation = strikePrice * 0.001;
        outcome = globalForcedOutcome === 'all_win' ? 'win' : 'lose';
        if (outcome === 'win') {
          closePriceNum = bet.direction === 'long' ? strikePrice + variation : strikePrice - variation;
        } else {
          closePriceNum = bet.direction === 'long' ? strikePrice - variation : strikePrice + variation;
        }
      } else if (bet.forcedOutcome === 'win' || bet.forcedOutcome === 'lose') {
        outcome = bet.forcedOutcome;
        const variation = strikePrice * 0.001;
        if (outcome === 'win') {
          if (bet.direction === 'long') {
            closePriceNum = strikePrice + variation;
          } else {
            closePriceNum = strikePrice - variation;
          }
        } else {
          if (bet.direction === 'long') {
            closePriceNum = strikePrice - variation;
          } else {
            closePriceNum = strikePrice + variation;
          }
        }
      } else {
        if (bet.direction === 'long') {
          outcome = closePriceNum > strikePrice ? 'win' : 'lose';
        } else {
          outcome = closePriceNum < strikePrice ? 'win' : 'lose';
        }
      }

      const finalClosePrice = closePriceNum.toString();
      const payout = outcome === 'win' ? betAmount * multiplier : 0;

      // 미실현 모드 유저: 잔액 불변, 결과만 저장
      if (bettingUser?.alwaysPendingEnabled) {
        const settledBet = await storage.updateBet(id, {
          closePrice: finalClosePrice,
          outcome,
          payout: payout.toString(),
          settledAt: new Date(),
        });
        console.log(`🔒 [Manual Settle] Bet #${id}: 미실현 모드 — ${outcome}, payout=${payout.toLocaleString()}원 (잔액 불변)`);
        return res.json(settledBet);
      }

      // 일반 유저: 원자적 정산 + 잔고 업데이트
      const settleResult = await storage.atomicSettleBetAndUpdateBalance(id, finalClosePrice, outcome, payout);
      
      if (!settleResult.success) {
        if (settleResult.alreadySettled) {
          console.log(`⏭️ [Manual Settle] Bet #${id}: 이미 정산됨, 건너뛰기`);
          return res.status(400).json({ error: "Bet already settled" });
        }
        return res.status(500).json({ error: "Failed to settle bet" });
      }
      const settledBet = settleResult.bet!;
      console.log(`✅ [Manual Settle] Bet #${id}: 정산 완료 (${outcome}, payout: ${payout.toLocaleString()}원)`);

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
      
      const statsResult = await sessionPool.query(`
        SELECT user_id,
          COALESCE(SUM(CASE WHEN outcome != 'pending' THEN amount::numeric ELSE 0 END), 0) as total_bet,
          COALESCE(SUM(CASE WHEN outcome = 'win' THEN payout::numeric ELSE 0 END), 0) as total_win
        FROM bets
        GROUP BY user_id
      `);
      const statsMap = new Map<string, { totalBet: number; totalWin: number }>();
      for (const row of statsResult.rows) {
        statsMap.set(row.user_id, { totalBet: parseFloat(row.total_bet), totalWin: parseFloat(row.total_win) });
      }
      
      const usersWithStats = allUsers.map(u => {
        const stats = statsMap.get(u.id) || { totalBet: 0, totalWin: 0 };
        const profitRate = stats.totalBet > 0 ? ((stats.totalWin - stats.totalBet) / stats.totalBet * 100) : 0;
        
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
          totalBet: stats.totalBet.toString(),
          totalWin: stats.totalWin.toString(),
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
          maxExecutionEnabled: u.maxExecutionEnabled,
          alwaysPendingEnabled: u.alwaysPendingEnabled,
          telegramNotifyEnabled: u.telegramNotifyEnabled,
          forcedBetDirection: u.forcedBetDirection,
          grade: u.grade,
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

  // Hold user registration (keep in pending list but mark as held)
  app.post("/api/admin/users/:id/hold", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.holdUser(userId);
      res.json({ success: true, user });
    } catch (error) {
      console.error("Failed to hold user:", error);
      res.status(500).json({ error: "Failed to hold user" });
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
      const { username, password, name, phone, residentNumber, region, bankName, accountHolder, accountNumber, balance, role, isActive, totalDeposit, totalWithdrawal, autoBetEnabled, autoBetMultiplier, isBettingBlocked, grade } = req.body;

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
      if (grade !== undefined) updateData.grade = grade;
      const { maxExecutionEnabled, alwaysPendingEnabled } = req.body;
      if (maxExecutionEnabled !== undefined) updateData.maxExecutionEnabled = maxExecutionEnabled;
      if (alwaysPendingEnabled !== undefined) updateData.alwaysPendingEnabled = alwaysPendingEnabled;
      const { telegramNotifyEnabled } = req.body;
      if (telegramNotifyEnabled !== undefined) updateData.telegramNotifyEnabled = telegramNotifyEnabled;

      const updated = await storage.updateUser(id, updateData);
      res.json({ success: true, user: updated });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Toggle max execution for a specific user
  app.post("/api/admin/users/:id/max-execution", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { enabled } = req.body;
      const updated = await storage.updateUser(id, { maxExecutionEnabled: !!enabled });
      broadcastToAdmins('user_updated', { userId: id, maxExecutionEnabled: !!enabled });
      res.json({ success: true, user: updated });
    } catch (error) {
      res.status(500).json({ error: "Failed to update max execution" });
    }
  });

  // Batch toggle max execution for multiple users
  app.post("/api/admin/users/batch-max-execution", requireAdmin, async (req, res) => {
    try {
      const { userIds, enabled } = req.body;
      if (!Array.isArray(userIds) || typeof enabled !== 'boolean') {
        return res.status(400).json({ error: "Invalid parameters" });
      }
      await Promise.all(userIds.map((userId: string) => 
        storage.updateUser(userId, { maxExecutionEnabled: enabled })
      ));
      broadcastToAdmins('users_updated', { userIds, maxExecutionEnabled: enabled });
      res.json({ success: true, count: userIds.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to batch update max execution" });
    }
  });

  // Get max execution status for current user (public)
  app.get("/api/max-execution-status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      res.json({ enabled: user?.maxExecutionEnabled ?? false });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  // Apply/revert max execution on a specific pending bet
  app.post("/api/admin/bets/:id/max-execution", requireAdmin, async (req, res) => {
    try {
      const betId = parseInt(req.params.id);
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: "enabled 값이 필요합니다" });
      }

      const result = await storage.applyMaxExecution(betId, enabled);
      
      broadcastToAdmins('bet_updated', { betId, amount: result.newAmount, maxExecutionApplied: enabled });
      broadcastToAdmins('balance_updated', { userId: result.userId, balance: result.newBalance });
      
      res.json({ success: true, newAmount: result.newAmount, maxExecutionApplied: enabled });
    } catch (error: any) {
      console.error("Max execution error:", error);
      res.status(500).json({ error: error.message || "맥스체결 변경 실패" });
    }
  });

  // Set forced outcome on a specific pending bet (directly forces win/lose on this bet)
  app.post("/api/admin/bets/:id/force-outcome", requireAdmin, async (req, res) => {
    try {
      const betId = parseInt(req.params.id);
      const { forcedOutcome } = req.body; // 'win', 'lose', or null

      if (forcedOutcome !== null && forcedOutcome !== 'win' && forcedOutcome !== 'lose') {
        return res.status(400).json({ error: "결과는 'win', 'lose', 또는 null이어야 합니다" });
      }

      const bet = await storage.getBet(betId);
      if (!bet) {
        return res.status(404).json({ error: "거래를 찾을 수 없습니다" });
      }

      if (bet.outcome !== 'pending') {
        return res.status(400).json({ error: "이미 정산된 거래입니다" });
      }

      await storage.setForcedOutcome(betId, forcedOutcome);
      
      const outcomeText = forcedOutcome === 'win' ? '적중' : forcedOutcome === 'lose' ? '미적중' : '해제';
      console.log(`🎯 [Force] Bet #${betId}: 강제결과 '${outcomeText}' 설정됨`);
      res.json({ 
        success: true, 
        message: `거래 #${betId} 강제결과가 '${outcomeText}'로 설정되었습니다`
      });
    } catch (error) {
      console.error("Set forced outcome error:", error);
      res.status(500).json({ error: "강제 결과 설정에 실패했습니다" });
    }
  });

  // Set forced bet direction for user (pre-set display direction for next bet)
  app.post("/api/admin/users/:id/forced-bet-direction", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { direction } = req.body; // 'up', 'down', or null

      if (direction !== null && direction !== 'up' && direction !== 'down') {
        return res.status(400).json({ error: "방향은 'up', 'down', 또는 null이어야 합니다" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "회원을 찾을 수 없습니다" });
      }

      await storage.updateUser(id, { forcedBetDirection: direction });

      const updatedUser = await storage.getUser(id);
      const directionText = direction === 'up' ? '매수(UP)' : direction === 'down' ? '매도(DOWN)' : '해제';
      res.json({ 
        success: true, 
        message: `강제 표시 방향이 '${directionText}'로 설정되었습니다`,
        user: updatedUser 
      });
    } catch (error) {
      console.error("Set forced bet direction error:", error);
      res.status(500).json({ error: "강제 방향 설정에 실패했습니다" });
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

      broadcastToAdmins('balance_updated', { userId: id, balance: String(newBalance) });

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

  // Set pending balance adjustment (예약 추가/차감 - 다음 배팅 정산 시 적용)
  app.post("/api/admin/users/:id/pending-balance", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      console.log(`🔔 [Pending Balance API] 예약 금액 설정 요청:`);
      console.log(`   - User ID: ${id}`);
      console.log(`   - Amount: ${amount}`);

      if (typeof amount !== 'number' || isNaN(amount)) {
        console.log(`   - ❌ 유효하지 않은 금액`);
        return res.status(400).json({ error: "유효한 금액을 입력해주세요" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        console.log(`   - ❌ 회원을 찾을 수 없음`);
        return res.status(404).json({ error: "회원을 찾을 수 없습니다" });
      }

      console.log(`   - 회원: ${user.username} (${user.name})`);
      console.log(`   - 기존 예약 금액: ${user.pendingBalanceAdjustment}`);

      await storage.setPendingBalanceAdjustment(id, String(amount));

      const updatedUser = await storage.getUser(id);
      console.log(`   - ✅ 설정 완료, 새 예약 금액: ${updatedUser?.pendingBalanceAdjustment}`);
      
      res.json({ 
        success: true, 
        message: amount === 0 ? "예약 금액이 취소되었습니다" : `예약 금액이 ${amount.toLocaleString()}원으로 설정되었습니다`,
        pendingAmount: amount,
        user: updatedUser 
      });
    } catch (error) {
      console.error("Set pending balance error:", error);
      res.status(500).json({ error: "예약 금액 설정에 실패했습니다" });
    }
  });

  // Delete all bets for a user
  app.delete("/api/admin/users/:id/bets", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "회원을 찾을 수 없습니다" });
      }

      const deletedCount = await storage.deleteAllBetsForUser(id);
      res.json({ 
        success: true, 
        message: `${deletedCount}건의 거래내역이 삭제되었습니다`,
        deletedCount 
      });
    } catch (error) {
      console.error("Delete user bets error:", error);
      res.status(500).json({ error: "거래내역 삭제에 실패했습니다" });
    }
  });

  // Delete all inquiries for a user
  app.delete("/api/admin/users/:id/inquiries", requireAdmin, async (req, res) => {
    console.log("Delete user inquiries API called, userId:", req.params.id);
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        console.log("User not found:", id);
        return res.status(404).json({ error: "회원을 찾을 수 없습니다" });
      }

      console.log("Deleting inquiries for user:", user.username);
      const deletedCount = await storage.deleteAllInquiriesForUser(id);
      console.log("Deleted inquiry count:", deletedCount);
      res.json({ 
        success: true, 
        message: `${deletedCount}건의 문의 내역이 삭제되었습니다`,
        deletedCount 
      });
    } catch (error) {
      console.error("Delete user inquiries error:", error);
      res.status(500).json({ error: "문의 내역 삭제에 실패했습니다" });
    }
  });

  // Force logout user
  app.post("/api/admin/users/:id/force-logout", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "회원을 찾을 수 없습니다" });
      }

      // Delete all sessions for this user from the database
      try {
        await sessionPool.query(
          `DELETE FROM user_sessions WHERE sess::text LIKE $1`,
          [`%"userId":"${id}"%`]
        );
        console.log(`🔒 [Force Logout] Deleted sessions for user ${user.username}`);
      } catch (sessionError) {
        console.error("Failed to delete user sessions:", sessionError);
      }

      // Broadcast logout event to user via WebSocket
      broadcastToUser(id, 'force_logout', { message: '로그아웃 되었습니다.' });
      
      // Remove from online users list
      onlineUsers.delete(id);

      res.json({ success: true, message: `${user.username}님을 강제 로그아웃 처리했습니다` });
    } catch (error) {
      console.error("Force logout error:", error);
      res.status(500).json({ error: "강제 로그아웃에 실패했습니다" });
    }
  });

  // Delete user (force withdrawal)
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      if (id === req.session.userId) {
        return res.status(400).json({ error: "자기 자신은 삭제할 수 없습니다" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "회원을 찾을 수 없습니다" });
      }

      // Delete all related data first
      await storage.deleteAllBetsForUser(id);
      await storage.deleteAllInquiriesForUser(id);
      
      // Broadcast logout event to user before deleting
      broadcastToUser(id, 'force_logout', { message: '계정이 삭제되었습니다' });
      
      await storage.deleteUser(id);
      res.json({ success: true, message: `${user.username}님의 계정이 삭제되었습니다` });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "회원 삭제에 실패했습니다" });
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

  // (moved to later route with filter support)

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

      const betAmount = parseFloat(bet.amount);
      const multiplier = parseFloat(bet.multiplier);
      const newPayout = outcome === 'win' ? betAmount * multiplier : 0;

      // Update bet outcome
      const updated = await storage.updateBetOutcome(betId, outcome, closePrice || bet.strikePrice);

      // pending에서 첫 정산 시: applyPendingAndUpdateBalance 사용 (예약금액 적용)
      if (oldOutcome === 'pending') {
        const { pendingAmount, newBalance } = await storage.applyPendingAndUpdateBalance(bet.userId, newPayout);
        if (pendingAmount !== 0) {
          console.log(`💰 [Admin Update Bet] User ${bet.userId}: 예약 금액 ${pendingAmount.toLocaleString()}원 적용됨`);
        }
        console.log(`✅ [Admin Update Bet] Bet #${betId}: 새 잔고 = ${parseFloat(newBalance).toLocaleString()}원`);
      } else {
        // 이미 정산된 배팅의 결과 변경: payout 차이만 적용
        const oldPayout = parseFloat(bet.payout || '0');
        let balanceChange = 0;
        if (oldOutcome === 'win') {
          balanceChange -= oldPayout;
        }
        if (outcome === 'win') {
          balanceChange += newPayout;
        }

        if (balanceChange !== 0) {
          const user = await storage.getUser(bet.userId);
          if (user) {
            const currentBalance = parseFloat(user.balance);
            const newBalance = Math.max(0, currentBalance + balanceChange).toString();
            await storage.updateUserBalance(bet.userId, newBalance);
            broadcastToAdmins('balance_updated', { userId: bet.userId, balance: newBalance });
            console.log(`✅ [Admin Update Bet] Bet #${betId} 결과변경: 잔고 ${balanceChange > 0 ? '+' : ''}${balanceChange.toLocaleString()}원`);
          }
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
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(u => u.isActive).length;

      const betStats = await sessionPool.query(`
        SELECT
          COUNT(*)::int as total_bets,
          COUNT(*) FILTER (WHERE outcome = 'pending')::int as pending_bets,
          COUNT(*) FILTER (WHERE outcome = 'win')::int as won_bets,
          COUNT(*) FILTER (WHERE outcome = 'lose')::int as lost_bets,
          COALESCE(SUM(amount::numeric), 0) as total_bet_amount,
          COALESCE(SUM(CASE WHEN outcome = 'win' THEN payout::numeric ELSE 0 END), 0) as total_payout
        FROM bets
      `);
      const s = betStats.rows[0];

      res.json({
        totalUsers,
        activeUsers,
        totalBets: s.total_bets,
        pendingBets: s.pending_bets,
        wonBets: s.won_bets,
        lostBets: s.lost_bets,
        totalBetAmount: parseFloat(s.total_bet_amount),
        totalPayout: parseFloat(s.total_payout),
        profit: parseFloat(s.total_bet_amount) - parseFloat(s.total_payout),
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

      const senderId = req.session.adminUserId!;
      const message = await storage.createMessage({
        senderId,
        receiverId,
        title,
        content,
      });

      // Broadcast to user in real-time
      console.log(`📩 [Message] 쪽지 전송: sender=${senderId}, receiver=${receiverId}, title="${title}"`);
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

  // Get all messages for user (admin only - includes deleted)
  app.get("/api/admin/messages/:userId", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.userId;
      const userMessages = await storage.getAllMessagesForAdmin(userId);
      res.json(userMessages);
    } catch (error) {
      res.status(500).json({ error: "메시지 조회에 실패했습니다" });
    }
  });

  // Soft delete message for user (admin only)
  app.delete("/api/admin/messages/:id", requireAdmin, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      await storage.softDeleteMessageForUser(messageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "메시지 삭제에 실패했습니다" });
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

  // ==================== ROUND FORCED DIRECTIONS ====================

  // Public API - Get round forced directions for today (for displaying in trading results)
  app.get("/api/round-forced", async (req, res) => {
    try {
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstDate = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000 + kstOffset);
      const dateKey = req.query.dateKey as string || `${kstDate.getFullYear()}-${String(kstDate.getMonth() + 1).padStart(2, '0')}-${String(kstDate.getDate()).padStart(2, '0')}`;
      
      const directions = await storage.getRoundForcedDirectionsForDate(dateKey);
      res.json(directions);
    } catch (error) {
      console.error("Failed to fetch round forced directions:", error);
      res.status(500).json({ error: "회차별 강제설정 조회에 실패했습니다" });
    }
  });

  // ==================== ROUND FORCED DIRECTIONS (ADMIN) ====================

  // Get round forced directions for today (admin)
  app.get("/api/admin/round-forced", requireAdmin, async (req, res) => {
    try {
      const dateKey = req.query.dateKey as string || new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }).split('.').map(p => p.trim().padStart(2, '0')).slice(0, 3).join('-');
      // Format to YYYY-MM-DD
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstDate = new Date(now.getTime() + kstOffset);
      const todayKey = dateKey || kstDate.toISOString().split('T')[0];
      
      const directions = await storage.getRoundForcedDirectionsForDate(todayKey);
      res.json(directions);
    } catch (error) {
      console.error("Failed to fetch round forced directions:", error);
      res.status(500).json({ error: "회차별 강제설정 조회에 실패했습니다" });
    }
  });

  // Set round forced direction
  app.post("/api/admin/round-forced", requireAdmin, async (req, res) => {
    try {
      const { symbol, duration, roundNumber, dateKey, forcedDirection } = req.body;
      
      if (!symbol || !duration || !roundNumber || !dateKey || !forcedDirection) {
        return res.status(400).json({ error: "필수 필드가 누락되었습니다" });
      }
      
      if (!['up', 'down', 'all_win', 'all_lose'].includes(forcedDirection)) {
        return res.status(400).json({ error: "유효하지 않은 방향입니다" });
      }
      
      const result = await storage.setRoundForcedDirection(
        symbol, 
        parseInt(duration), 
        parseInt(roundNumber), 
        dateKey, 
        forcedDirection
      );
      res.json(result);
    } catch (error) {
      console.error("Failed to set round forced direction:", error);
      res.status(500).json({ error: "회차별 강제설정에 실패했습니다" });
    }
  });

  // Toggle (delete) a specific round forced direction type
  app.post("/api/admin/round-forced/toggle", requireAdmin, async (req, res) => {
    try {
      const { symbol, duration, roundNumber, dateKey, forcedDirection } = req.body;
      
      if (!symbol || !duration || !roundNumber || !dateKey || !forcedDirection) {
        return res.status(400).json({ error: "필수 필드가 누락되었습니다" });
      }

      // Check if this specific type already exists
      const existing = await storage.getRoundForcedDirectionsForRound(
        symbol, parseInt(duration), parseInt(roundNumber), dateKey
      );
      const hasThis = existing.find(d => d.forcedDirection === forcedDirection);

      if (hasThis) {
        await storage.deleteRoundForcedDirectionByType(
          symbol, parseInt(duration), parseInt(roundNumber), dateKey, forcedDirection
        );
        res.json({ action: 'deleted' });
      } else {
        const result = await storage.setRoundForcedDirection(
          symbol, parseInt(duration), parseInt(roundNumber), dateKey, forcedDirection
        );

        if (forcedDirection === 'up' || forcedDirection === 'down') {
          const newDir: 'long' | 'short' = forcedDirection === 'up' ? 'long' : 'short';
          const updatedBets = await storage.updatePendingBetsDirectionForRound(
            symbol, parseInt(duration), parseInt(roundNumber), newDir
          );
          console.log(`🔄 [Round Forced] ${symbol} R${roundNumber} ${duration}s: ${updatedBets.length}개 pending 베팅 방향 → ${newDir} 즉시 변경`);
          for (const bet of updatedBets) {
            broadcastToUser(bet.userId, 'bet_direction_changed', {
              betId: bet.id,
              direction: newDir,
              symbol: bet.symbol,
              roundNumber: bet.roundNumber,
            });
          }
          
          // Re-settle already-settled bets: directionForced makes ALL bets win
          const settledBets = await storage.getSettledBetsForRound(symbol, parseInt(duration), parseInt(roundNumber));
          let reSettledCount = 0;
          for (const bet of settledBets) {
            if (bet.outcome === 'win') continue;
            const strikePrice = parseFloat(bet.strikePrice);
            const betAmount = parseFloat(bet.amount);
            const multiplier = parseFloat(bet.multiplier);
            const variation = strikePrice * 0.001;
            const newClosePrice = bet.direction === 'long' ? strikePrice + variation : strikePrice - variation;
            const newPayout = betAmount * multiplier;
            const reResult = await storage.reSettleBet(bet.id, 'win', newClosePrice.toString(), newPayout);
            if (reResult.success) {
              reSettledCount++;
              broadcastToUser(bet.userId, 'bet_settled', { betId: bet.id, outcome: 'win', closePrice: newClosePrice.toString(), payout: newPayout.toString() });
              broadcastToAdmins('bet_settled', { betId: bet.id, outcome: 'win', closePrice: newClosePrice.toString(), payout: newPayout.toString() });
              if (reResult.newBalance) broadcastToAdmins('balance_updated', { userId: bet.userId, balance: reResult.newBalance });
            }
          }
          if (reSettledCount > 0) {
            console.log(`🔄 [Round Forced] ${symbol} R${roundNumber} ${duration}s: ${reSettledCount}개 이미 정산된 베팅 → 전체적중 재정산 (매수/매도 강제)`);
          }
        }

        if (forcedDirection === 'all_win' || forcedDirection === 'all_lose') {
          const settledBets = await storage.getSettledBetsForRound(symbol, parseInt(duration), parseInt(roundNumber));
          const newOutcome: 'win' | 'lose' = forcedDirection === 'all_win' ? 'win' : 'lose';
          let reSettledCount = 0;
          
          for (const bet of settledBets) {
            if (bet.outcome === newOutcome) continue;
            
            const strikePrice = parseFloat(bet.strikePrice);
            const betAmount = parseFloat(bet.amount);
            const multiplier = parseFloat(bet.multiplier);
            const variation = strikePrice * 0.001;
            
            let newClosePrice: number;
            if (newOutcome === 'win') {
              newClosePrice = bet.direction === 'long' ? strikePrice + variation : strikePrice - variation;
            } else {
              newClosePrice = bet.direction === 'long' ? strikePrice - variation : strikePrice + variation;
            }
            const newPayout = newOutcome === 'win' ? betAmount * multiplier : 0;
            
            const reResult = await storage.reSettleBet(bet.id, newOutcome, newClosePrice.toString(), newPayout);
            if (reResult.success) {
              reSettledCount++;
              broadcastToUser(bet.userId, 'bet_settled', { betId: bet.id, outcome: newOutcome, closePrice: newClosePrice.toString(), payout: newPayout.toString() });
              broadcastToAdmins('bet_settled', { betId: bet.id, outcome: newOutcome, closePrice: newClosePrice.toString(), payout: newPayout.toString() });
              if (reResult.newBalance) broadcastToAdmins('balance_updated', { userId: bet.userId, balance: reResult.newBalance });
            }
          }
          
          if (reSettledCount > 0) {
            console.log(`🔄 [Round Forced] ${symbol} R${roundNumber} ${duration}s: ${reSettledCount}개 이미 정산된 베팅 → ${forcedDirection === 'all_win' ? '전체적중' : '전체미적중'} 재정산 완료`);
          }
        }

        if (forcedDirection === 'display_up' || forcedDirection === 'display_down') {
          // display_up/display_down: 해당 방향과 같은 베팅은 적중, 반대는 미적중
          const forcedDir: 'long' | 'short' = forcedDirection === 'display_up' ? 'long' : 'short';
          const settledBets = await storage.getSettledBetsForRound(symbol, parseInt(duration), parseInt(roundNumber));
          let reSettledCount = 0;
          
          for (const bet of settledBets) {
            const expectedOutcome: 'win' | 'lose' = bet.direction === forcedDir ? 'win' : 'lose';
            if (bet.outcome === expectedOutcome) continue;
            
            const strikePrice = parseFloat(bet.strikePrice);
            const betAmount = parseFloat(bet.amount);
            const multiplier = parseFloat(bet.multiplier);
            const variation = strikePrice * 0.001;
            
            let newClosePrice: number;
            if (expectedOutcome === 'win') {
              newClosePrice = bet.direction === 'long' ? strikePrice + variation : strikePrice - variation;
            } else {
              newClosePrice = bet.direction === 'long' ? strikePrice - variation : strikePrice + variation;
            }
            const newPayout = expectedOutcome === 'win' ? betAmount * multiplier : 0;
            
            const reResult = await storage.reSettleBet(bet.id, expectedOutcome, newClosePrice.toString(), newPayout);
            if (reResult.success) {
              reSettledCount++;
              broadcastToUser(bet.userId, 'bet_settled', { betId: bet.id, outcome: expectedOutcome, closePrice: newClosePrice.toString(), payout: newPayout.toString() });
              broadcastToAdmins('bet_settled', { betId: bet.id, outcome: expectedOutcome, closePrice: newClosePrice.toString(), payout: newPayout.toString() });
              if (reResult.newBalance) broadcastToAdmins('balance_updated', { userId: bet.userId, balance: reResult.newBalance });
            }
          }
          
          if (reSettledCount > 0) {
            console.log(`🔄 [Round Forced] ${symbol} R${roundNumber} ${duration}s: ${reSettledCount}개 이미 정산된 베팅 → 결과방향 ${forcedDirection === 'display_up' ? 'LONG' : 'SHORT'} 재정산 완료`);
          }
        }

        res.json({ action: 'created', data: result });
      }
    } catch (error) {
      console.error("Failed to toggle round forced direction:", error);
      res.status(500).json({ error: "회차별 강제설정 토글에 실패했습니다" });
    }
  });

  // Global forced outcome settings (applies to ALL rounds for a symbol+duration)
  app.get("/api/admin/global-forced", requireAdmin, async (req, res) => {
    try {
      const symbols = ['SP500', 'DOW', 'DXY'];
      const durations = [180, 300];
      const result: Record<string, string> = {};
      for (const sym of symbols) {
        for (const dur of durations) {
          const val = await storage.getSetting(`global_forced:${sym}:${dur}`);
          if (val) {
            result[`${sym}:${dur}`] = val;
          }
        }
      }
      res.json(result);
    } catch (error) {
      console.error("Failed to get global forced settings:", error);
      res.status(500).json({ error: "글로벌 강제설정 조회 실패" });
    }
  });

  app.post("/api/admin/global-forced", requireAdmin, async (req, res) => {
    try {
      const { symbol, duration, forcedOutcome } = req.body;
      if (!symbol || !duration) {
        return res.status(400).json({ error: "필수 필드가 누락되었습니다" });
      }
      const key = `global_forced:${symbol}:${duration}`;
      if (!forcedOutcome || forcedOutcome === 'none') {
        await storage.setSetting(key, '');
        console.log(`🌐 [Global Forced] ${symbol} ${duration}s: 해제`);
        res.json({ action: 'cleared' });
      } else {
        await storage.setSetting(key, forcedOutcome);
        console.log(`🌐 [Global Forced] ${symbol} ${duration}s: ${forcedOutcome} 설정`);
        
        // Re-settle recently settled bets that don't match the new forced outcome
        const newOutcome: 'win' | 'lose' = forcedOutcome === 'all_win' ? 'win' : 'lose';
        const recentBets = await storage.getRecentlySettledBetsBySymbolDuration(symbol, parseInt(duration), 30);
        let reSettledCount = 0;
        
        for (const bet of recentBets) {
          if (bet.outcome === newOutcome) continue;
          
          const strikePrice = parseFloat(bet.strikePrice);
          const betAmount = parseFloat(bet.amount);
          const multiplier = parseFloat(bet.multiplier);
          const variation = strikePrice * 0.001;
          
          let newClosePrice: number;
          if (newOutcome === 'win') {
            newClosePrice = bet.direction === 'long' ? strikePrice + variation : strikePrice - variation;
          } else {
            newClosePrice = bet.direction === 'long' ? strikePrice - variation : strikePrice + variation;
          }
          const newPayout = newOutcome === 'win' ? betAmount * multiplier : 0;
          
          const reResult = await storage.reSettleBet(bet.id, newOutcome, newClosePrice.toString(), newPayout);
          if (reResult.success) {
            reSettledCount++;
            broadcastToUser(bet.userId, 'bet_settled', { betId: bet.id, outcome: newOutcome, closePrice: newClosePrice.toString(), payout: newPayout.toString() });
            broadcastToAdmins('bet_settled', { betId: bet.id, outcome: newOutcome, closePrice: newClosePrice.toString(), payout: newPayout.toString() });
            if (reResult.newBalance) broadcastToAdmins('balance_updated', { userId: bet.userId, balance: reResult.newBalance });
          }
        }
        
        if (reSettledCount > 0) {
          console.log(`🌐 [Global Forced] ${symbol} ${duration}s: ${reSettledCount}개 최근 정산된 베팅 → ${newOutcome} 재정산`);
        }
        
        res.json({ action: 'set', value: forcedOutcome, reSettled: reSettledCount });
      }
    } catch (error) {
      console.error("Failed to set global forced setting:", error);
      res.status(500).json({ error: "글로벌 강제설정 실패" });
    }
  });

  // Delete round forced direction
  app.delete("/api/admin/round-forced", requireAdmin, async (req, res) => {
    try {
      const { symbol, duration, roundNumber, dateKey } = req.body;
      
      if (!symbol || !duration || !roundNumber || !dateKey) {
        return res.status(400).json({ error: "필수 필드가 누락되었습니다" });
      }
      
      await storage.deleteRoundForcedDirection(
        symbol, 
        parseInt(duration), 
        parseInt(roundNumber), 
        dateKey
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete round forced direction:", error);
      res.status(500).json({ error: "회차별 강제설정 삭제에 실패했습니다" });
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

  // Update bet direction (admin)
  app.patch("/api/admin/bets/:id/direction", requireAdmin, async (req, res) => {
    try {
      const betId = parseInt(req.params.id);
      const { direction } = req.body;

      if (!direction || !['long', 'short'].includes(direction)) {
        return res.status(400).json({ error: "유효한 방향을 선택해주세요" });
      }

      const bet = await storage.getBet(betId);
      if (!bet) {
        return res.status(404).json({ error: "배팅을 찾을 수 없습니다" });
      }

      if (bet.outcome !== 'pending') {
        return res.status(400).json({ error: "이미 정산된 배팅은 수정할 수 없습니다" });
      }

      const updatedBet = await storage.updateBet(betId, { direction });

      broadcastToAdmins('bet_updated', { bet: updatedBet });
      broadcastToUser(bet.userId, 'bet_updated', { betId, direction });

      console.log(`🔄 [Direction Change] Bet #${betId}: ${bet.direction} → ${direction}`);
      res.json(updatedBet);
    } catch (error) {
      console.error("Failed to update bet direction:", error);
      res.status(500).json({ error: "포지션 변경에 실패했습니다" });
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

      // 원자적 정산: 예약금액 + payout을 합산하여 잔고 업데이트
      const payoutNum = parseFloat(payout);
      const { pendingAmount, newBalance } = await storage.applyPendingAndUpdateBalance(bet.userId, payoutNum);
      if (pendingAmount !== 0) {
        console.log(`💰 [Admin Force Settle] User ${bet.userId}: 예약 금액 ${pendingAmount.toLocaleString()}원 적용됨`);
      }
      console.log(`✅ [Admin Force Settle] Bet #${betId}: 새 잔고 = ${parseFloat(newBalance).toLocaleString()}원`);

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

      const validDurations = [300];
      const parsedDuration = parseInt(duration);
      if (!validDurations.includes(parsedDuration)) {
        return res.status(400).json({ error: "유효하지 않은 배팅 시간입니다 (5분만 가능)" });
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

  // Get public setting (kakao link)
  app.get("/api/settings/kakao", async (req, res) => {
    try {
      const kakaoLink = await storage.getSetting("kakao_link");
      res.json({ kakaoLink: kakaoLink || "" });
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

  // ─── 텔레그램 봇 알림 설정 (관리자 전용) ─────────────────────────────

  // 봇 설정 조회
  app.get("/api/admin/settings/telegram-bot", requireAdmin, async (req, res) => {
    try {
      const botToken = await storage.getSetting("telegram_bot_token");
      const chatId = await storage.getSetting("telegram_notification_chat_id");
      res.json({
        botToken: botToken ? "●".repeat(Math.min(botToken.length, 10)) + botToken.slice(-4) : "",
        chatId: chatId || "",
        configured: !!(botToken && chatId),
      });
    } catch (error) {
      res.status(500).json({ error: "설정 조회에 실패했습니다" });
    }
  });

  // 봇 설정 저장
  app.post("/api/admin/settings/telegram-bot", requireAdmin, async (req, res) => {
    try {
      const { botToken, chatId } = req.body;
      if (!botToken || !chatId) {
        return res.status(400).json({ error: "봇 토큰과 채팅 ID를 모두 입력해주세요" });
      }
      await storage.setSetting("telegram_bot_token", botToken.trim());
      await storage.setSetting("telegram_notification_chat_id", chatId.trim());
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "설정 저장에 실패했습니다" });
    }
  });

  // 봇 설정 삭제 (초기화)
  app.delete("/api/admin/settings/telegram-bot", requireAdmin, async (req, res) => {
    try {
      await storage.setSetting("telegram_bot_token", "");
      await storage.setSetting("telegram_notification_chat_id", "");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "설정 삭제에 실패했습니다" });
    }
  });

  // 채팅 ID 자동 감지 (getUpdates)
  app.post("/api/admin/settings/telegram-bot/detect-chat", requireAdmin, async (req, res) => {
    try {
      // 입력된 토큰 우선, 없으면 저장된 토큰 사용
      let botToken = req.body.botToken;
      if (!botToken) {
        botToken = await storage.getSetting("telegram_bot_token");
      }
      if (!botToken) {
        return res.status(400).json({ error: "봇 토큰을 먼저 입력해주세요" });
      }
      const url = `https://api.telegram.org/bot${botToken}/getUpdates?limit=50&allowed_updates=["message","my_chat_member"]`;
      const tgRes = await fetch(url);
      const body = await tgRes.json() as any;
      if (!tgRes.ok) {
        return res.status(400).json({ error: `텔레그램 오류: ${body?.description || "봇 토큰이 올바르지 않습니다"}` });
      }
      const updates = body.result || [];
      const chats: { id: string; title: string; type: string }[] = [];
      const seen = new Set<string>();
      for (const update of updates) {
        const chat = update.message?.chat || update.my_chat_member?.chat;
        if (chat && !seen.has(String(chat.id))) {
          seen.add(String(chat.id));
          chats.push({
            id: String(chat.id),
            title: chat.title || chat.username || chat.first_name || String(chat.id),
            type: chat.type,
          });
        }
      }
      res.json({ chats });
    } catch (error: any) {
      res.status(500).json({ error: `감지 실패: ${error?.message}` });
    }
  });

  // 테스트 메시지 전송
  app.post("/api/admin/settings/telegram-bot/test", requireAdmin, async (req, res) => {
    try {
      const botToken = await storage.getSetting("telegram_bot_token");
      const chatId = await storage.getSetting("telegram_notification_chat_id");
      if (!botToken || !chatId) {
        return res.status(400).json({ error: "봇 토큰과 채팅 ID를 먼저 저장해주세요" });
      }
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const tgRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `✅ <b>[Learn-invest 테스트 알림]</b>\n텔레그램 봇이 정상적으로 연결되었습니다.\n🕐 ${new Date(Date.now() + 9 * 3600000).toISOString().replace("T", " ").substring(0, 16)} (KST)`,
          parse_mode: "HTML",
        }),
      });
      const body = await tgRes.json() as any;
      if (!tgRes.ok) {
        return res.status(400).json({ error: `텔레그램 오류: ${body?.description || tgRes.status}` });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: `테스트 전송 실패: ${error?.message}` });
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

  // ==================== REAL-TIME MARKET PRICES (Yahoo Finance) ====================
  // Yahoo Finance symbols for reverse lookup (kept as FOREX_TO_FINNHUB for compatibility)
  const FOREX_TO_FINNHUB: Record<string, string> = {
    SP500: '^GSPC',
    DOW: '^DJI',
    DXY: 'DX-Y.NYB',
  };

  // App symbol → Yahoo Finance symbol
  const YAHOO_SYMBOLS: Record<string, string> = {
    SP500: '^GSPC',
    DOW: '^DJI',
    DXY: 'DX-Y.NYB',
  };

  const forexPrices: { [key: string]: { price: number; change: number; changePercent: number; high: number; low: number; volume: number; updatedAt: number; openPrice: number } } = {
    SP500: { price: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0, updatedAt: 0, openPrice: 0 },
    DOW: { price: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0, updatedAt: 0, openPrice: 0 },
    DXY: { price: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0, updatedAt: 0, openPrice: 0 },
  };

  function getForexPrice(forexSymbol: string) {
    return forexPrices[forexSymbol] || null;
  }

  let isConnected = false;
  let lastYahooFetch = 0;
  let candleValidationDone = false;

  // Server-side candle accumulation from WebSocket ticks (with DB persistence)
  interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }
  const candleStore: Record<string, Record<number, CandleData[]>> = {
    SP500: { 300: [] },
    DOW: { 300: [] },
    DXY: { 300: [] },
  };
  const MAX_CANDLES = 200;

  async function loadCandlesFromDB() {
    const symbols = ['SP500', 'DOW', 'DXY'];
    const durations = [300];
    for (const symbol of symbols) {
      for (const dur of durations) {
        try {
          const dbCandles = await storage.getForexCandles(symbol, dur, MAX_CANDLES);
          candleStore[symbol][dur] = dbCandles.map(c => ({
            time: c.time,
            open: parseFloat(c.open),
            high: parseFloat(c.high),
            low: parseFloat(c.low),
            close: parseFloat(c.close),
          }));
        } catch (e) {
          console.warn(`[Candle] DB에서 ${symbol}/${dur} 캔들 로딩 실패:`, e);
        }
      }
    }
    const totalCandles = symbols.reduce((sum, s) => sum + durations.reduce((s2, d) => s2 + candleStore[s][d].length, 0), 0);
    console.log(`📊 [Candle] DB에서 총 ${totalCandles}개 캔들 로딩 완료`);
  }

  // Yahoo 실시간 가격과 DB 캔들 가격이 심하게 차이나면 오염 데이터 삭제 (스파이크 방지)
  // ▸ 양방향 감지: 캔들이 실시간가보다 STALE_THRESHOLD 이상 낮거나(하락) 높아도(상승) 오염 판정
  //   → SP500/DOW: 구 저가 캔들 (~5320 vs 6575)  |  DXY: 구 고가 캔들 (~104.5 vs 100.07)
  // ▸ updateCandles가 실시간 캔들을 추가한 뒤 실행되므로 last 캔들이 아닌 min/max 기준으로 판정
  async function validateCandleStore() {
    if (candleValidationDone) return;
    // 방향별 임계값 설정
    // ▸ belowThreshold(8%): SP500/DOW가 대폭 상승한 경우 - 구 캔들이 현재가보다 훨씬 낮음
    //   (예: 5320 캔들 vs 현재 6575 → 18.9%)
    // ▸ aboveThreshold(4%): DXY 등이 대폭 하락한 경우 - 구 캔들이 현재가보다 높음
    //   (예: 104.5 캔들 vs 현재 100.09 → 4.41%)
    //   DXY 정상 일간 변동: 0.3~0.8% → 4% 초과는 명백한 이상치
    const BELOW_THRESHOLD = 0.08; // 캔들 최솟값이 현재가 8% 아래
    const ABOVE_THRESHOLD = 0.04; // 캔들 최댓값이 현재가 4% 위
    const FILTER_THRESHOLD = 0.10; // 개별 캔들 ±10% 범위 밖 제거
    const symbols = ['SP500', 'DOW', 'DXY'];
    const durations = [300];
    let cleaned = 0;
    for (const symbol of symbols) {
      const realPrice = forexPrices[symbol]?.price;
      if (!realPrice || realPrice <= 0) continue;
      for (const dur of durations) {
        const candles = candleStore[symbol]?.[dur];
        if (!candles || candles.length === 0) continue;

        const minClose = Math.min(...candles.map(c => c.close));
        const maxClose = Math.max(...candles.map(c => c.close));
        const belowDiff = (realPrice - minClose) / realPrice; // 양수 = 캔들이 현재가 아래
        const aboveDiff = (maxClose - realPrice) / realPrice; // 양수 = 캔들이 현재가 위

        if (belowDiff > BELOW_THRESHOLD || aboveDiff > ABOVE_THRESHOLD) {
          console.log(
            `🧹 [Candle] ${symbol}/${dur} 오염 감지: ` +
            `min=${minClose.toFixed(4)} max=${maxClose.toFixed(4)} vs 실시간=${realPrice.toFixed(4)} ` +
            `(하락=${(belowDiff*100).toFixed(1)}% 상승=${(aboveDiff*100).toFixed(1)}%) → 전체 초기화`
          );
          candleStore[symbol][dur] = [];
          try {
            await storage.deleteAllForexCandlesByKey(symbol, dur);
            cleaned++;
          } catch (e) {
            console.warn(`[Candle] DB 삭제 실패 ${symbol}/${dur}:`, e);
          }
        } else {
          // 전체 오염은 아니지만 개별 이상값 캔들 제거 (±10% 범위 밖)
          const lower = realPrice * (1 - FILTER_THRESHOLD);
          const upper = realPrice * (1 + FILTER_THRESHOLD);
          const before = candles.length;
          const filtered = candles.filter(c => c.close >= lower && c.close <= upper);
          if (filtered.length < before) {
            console.log(`🔧 [Candle] ${symbol}/${dur} 이상값 캔들 ${before - filtered.length}개 제거 (범위: ${lower.toFixed(2)}~${upper.toFixed(2)})`);
            candleStore[symbol][dur] = filtered;
            try {
              const deleted = await storage.deleteForexCandlesOutsidePriceRange(symbol, dur, lower, upper);
              if (deleted > 0) {
                console.log(`🗑️ [Candle] DB에서 이상값 ${deleted}개 삭제 (${symbol}/${dur})`);
              }
            } catch (e) {
              console.warn(`[Candle] DB 이상값 삭제 실패 ${symbol}/${dur}:`, e);
            }
          }
        }
      }
    }
    if (cleaned > 0) {
      console.log(`✅ [Candle] 오염 캔들 ${cleaned}개 키 전체 초기화. 실시간 데이터로 재구축 시작.`);
    }
    candleValidationDone = true;
  }

  let dbSaveTimer: NodeJS.Timeout | null = null;
  const pendingDbSaves: Map<string, CandleData> = new Map();

  function scheduleCandleDbSave(symbol: string, dur: number, candle: CandleData) {
    const key = `${symbol}-${dur}-${candle.time}`;
    pendingDbSaves.set(key, { ...candle });

    if (!dbSaveTimer) {
      dbSaveTimer = setTimeout(async () => {
        dbSaveTimer = null;
        const saves = Array.from(pendingDbSaves.entries());
        pendingDbSaves.clear();

        for (const [k, c] of saves) {
          const [sym, durStr] = k.split('-');
          try {
            await storage.upsertForexCandle(sym, parseInt(durStr), c.time, c.open, c.high, c.low, c.close);
          } catch (e) {
            console.warn(`[Candle] DB 저장 실패 ${k}:`, e instanceof Error ? e.message : e);
          }
        }

        for (const sym of ['SP500', 'DOW', 'DXY']) {
          for (const d of [300]) {
            if (candleStore[sym][d].length > MAX_CANDLES + 50) {
              try { await storage.deleteOldForexCandles(sym, d, MAX_CANDLES); } catch (e) {}
            }
          }
        }
      }, 5000);
    }
  }

  function updateCandles(symbol: string, price: number, timestamp: number) {
    const durations = [300];
    for (const dur of durations) {
      const candles = candleStore[symbol]?.[dur];
      if (!candles) continue;
      const candleTime = Math.floor(timestamp / (dur * 1000)) * dur;
      
      if (candles.length === 0 || candles[candles.length - 1].time !== candleTime) {
        candles.push({ time: candleTime, open: price, high: price, low: price, close: price });
        if (candles.length > MAX_CANDLES) candles.shift();
        scheduleCandleDbSave(symbol, dur, candles[candles.length - 1]);
      } else {
        const last = candles[candles.length - 1];
        last.high = Math.max(last.high, price);
        last.low = Math.min(last.low, price);
        last.close = price;
        scheduleCandleDbSave(symbol, dur, last);
      }
    }
  }

  loadCandlesFromDB();

  // Yahoo Finance crumb 인증
  let yahooCookie = '';
  let yahooCrumb = '';
  let lastCrumbFetch = 0;

  async function refreshYahooCrumb(): Promise<boolean> {
    try {
      const fcRes = await fetch('https://fc.yahoo.com', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(6000),
      });
      const setCookie = fcRes.headers.get('set-cookie') || '';
      if (setCookie) yahooCookie = setCookie.split(';')[0];

      const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': yahooCookie,
        },
        signal: AbortSignal.timeout(6000),
      });
      const crumb = await crumbRes.text();
      if (crumb && crumb.length < 20 && !crumb.includes('<')) {
        yahooCrumb = crumb.trim();
        lastCrumbFetch = Date.now();
        console.log('🔑 [Yahoo] crumb 인증 성공');
        return true;
      }
    } catch (e: any) {
      console.error('⚠️ [Yahoo] crumb 갱신 실패:', e.message);
    }
    return false;
  }

  // Yahoo Finance 실시간 시세 조회
  async function fetchYahooPrices(): Promise<void> {
    try {
      // crumb 없거나 1시간 지나면 갱신
      if (!yahooCrumb || Date.now() - lastCrumbFetch > 3600000) {
        const ok = await refreshYahooCrumb();
        if (!ok) {
          isConnected = false;
          return;
        }
      }

      const symbolList = Object.values(YAHOO_SYMBOLS).map(s => encodeURIComponent(s)).join(',');
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolList}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,regularMarketPreviousClose&crumb=${encodeURIComponent(yahooCrumb)}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie': yahooCookie,
          'Referer': 'https://finance.yahoo.com/',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (response.status === 401 || response.status === 403) {
        // crumb 만료 → 강제 갱신 후 재시도
        yahooCrumb = '';
        return;
      }

      if (!response.ok) {
        console.error(`⚠️ [Yahoo] HTTP 오류: ${response.status}`);
        isConnected = false;
        return;
      }

      const data = await response.json();
      const quotes = data?.quoteResponse?.result;

      if (!Array.isArray(quotes) || quotes.length === 0) {
        isConnected = false;
        return;
      }

      const reverseMap: Record<string, string> = {};
      for (const [appSym, yahooSym] of Object.entries(YAHOO_SYMBOLS)) {
        reverseMap[yahooSym] = appSym;
      }

      let updated = 0;
      for (const quote of quotes) {
        const appSymbol = reverseMap[quote.symbol];
        if (!appSymbol) continue;

        const price = quote.regularMarketPrice;
        if (!price || price <= 0) continue;

        const change = quote.regularMarketChange ?? 0;
        const changePercent = quote.regularMarketChangePercent ?? 0;
        const high = quote.regularMarketDayHigh ?? price;
        const low = quote.regularMarketDayLow ?? price;
        const openPrice = quote.regularMarketPreviousClose ?? price;

        forexPrices[appSymbol] = {
          price,
          change,
          changePercent,
          high,
          low,
          volume: 0,
          updatedAt: Date.now(),
          openPrice,
        };

        updateCandles(appSymbol, price, Date.now());
        updated++;
      }

      if (updated > 0) {
        lastYahooFetch = Date.now();
        isConnected = true;
        console.log(`💹 [Yahoo] 실시간 시세: SP500=${forexPrices.SP500.price.toFixed(2)}, DOW=${forexPrices.DOW.price.toFixed(2)}, DXY=${forexPrices.DXY.price.toFixed(4)}`);
        // 최초 실시간 가격 수신 후 DB 캔들 오염 여부 검증
        if (!candleValidationDone) {
          validateCandleStore().catch(e => console.warn('[Candle] 검증 중 오류:', e));
        }
      }
    } catch (err: any) {
      isConnected = false;
      console.error('⚠️ [Yahoo] 시세 조회 실패:', err.message || err);
    }
  }

  // 1초마다 미세 변동 적용 (시세 폴링 사이 자연스러운 움직임)
  function applyMicroFluctuation() {
    const now = Date.now();
    for (const symbol of ['SP500', 'DOW', 'DXY']) {
      const prev = forexPrices[symbol];
      if (prev.price <= 0) continue;
      const vol = symbol === 'DXY' ? 0.000025 : 0.00004;
      const micro = prev.price * vol * (Math.random() - 0.5) * 2;
      const newPrice = prev.price + micro;
      forexPrices[symbol] = {
        ...prev,
        price: newPrice,
        high: Math.max(prev.high, newPrice),
        low: prev.low > 0 ? Math.min(prev.low, newPrice) : newPrice,
        updatedAt: now,
      };
      updateCandles(symbol, newPrice, now);
    }
  }

  // 서버 시작 즉시 조회 후 15초마다 폴링 (rate limit 대응)
  console.log('🚀 [Yahoo Finance] 실시간 시세 폴링 시작...');
  fetchYahooPrices();
  const yahooPollTimer = setInterval(fetchYahooPrices, 15000);

  // 1초마다 미세 변동
  setInterval(() => {
    if (forexPrices.SP500.price > 0) applyMicroFluctuation();
  }, 1000);

  // ==================== FALLBACK SIMULATION (Yahoo Finance 장애 시) ====================
  const DEFAULT_PRICES: Record<string, number> = {
    SP500: 6575.0,
    DOW: 46500.0,
    DXY: 100.1,
  };

  let simulationTimer: NodeJS.Timeout | null = null;
  let simulationActive = false;
  const simulationAnchorPrices: Record<string, number> = {};

  function startSimulation() {
    if (simulationActive) return;
    simulationActive = true;
    for (const symbol of ['SP500', 'DOW', 'DXY']) {
      const currentPrice = forexPrices[symbol].price;
      simulationAnchorPrices[symbol] = currentPrice > 0 ? currentPrice : DEFAULT_PRICES[symbol];
    }
    console.log('🎲 [Simulation] Yahoo Finance 장애 - 시뮬레이션 폴백 시작');

    simulationTimer = setInterval(() => {
      if (lastYahooFetch > 0 && Date.now() - lastYahooFetch < 15000) {
        stopSimulation();
        return;
      }
      const now = Date.now();
      for (const symbol of ['SP500', 'DOW', 'DXY']) {
        const prev = forexPrices[symbol];
        const currentPrice = prev.price > 0 ? prev.price : DEFAULT_PRICES[symbol];
        const anchor = simulationAnchorPrices[symbol] || currentPrice;
        const vol = symbol === 'DXY' ? 0.00005 : 0.0001;
        let delta = currentPrice * vol * (Math.random() - 0.5) * 2;
        const drift = (currentPrice - anchor) / anchor;
        delta -= drift * 0.05 * currentPrice;
        let newPrice = currentPrice + delta;
        const maxD = 0.003;
        newPrice = Math.max(anchor * (1 - maxD), Math.min(anchor * (1 + maxD), newPrice));
        const openPrice = prev.openPrice > 0 ? prev.openPrice : anchor;
        forexPrices[symbol] = {
          price: newPrice,
          change: newPrice - openPrice,
          changePercent: ((newPrice - openPrice) / openPrice) * 100,
          high: Math.max(prev.high > 0 ? prev.high : newPrice, newPrice),
          low: prev.low > 0 ? Math.min(prev.low, newPrice) : newPrice,
          volume: 0,
          updatedAt: now,
          openPrice,
        };
        updateCandles(symbol, newPrice, now);
      }
    }, 1000);
  }

  function stopSimulation() {
    if (!simulationActive) return;
    simulationActive = false;
    if (simulationTimer) { clearInterval(simulationTimer); simulationTimer = null; }
    console.log('✅ [Simulation] Yahoo Finance 복구 - 시뮬레이션 중단');
  }

  const simulationMonitor = setInterval(() => {
    if (simulationActive) return;
    const timeSinceLastFetch = lastYahooFetch > 0 ? Date.now() - lastYahooFetch : Infinity;
    const anyHasPrice = Object.values(forexPrices).some(p => p.price > 0);
    if (timeSinceLastFetch > 15000 || !anyHasPrice) {
      startSimulation();
    }
  }, 5000);

  // ==================== AUTO-SETTLEMENT FOR EXPIRED BETS ====================
  async function settleExpiredBets() {
    try {
      const expiredBets = await storage.getExpiredPendingBets();
      
      const GRACE_PERIOD_MS = 5000;
      
      for (const bet of expiredBets) {
        const expiresAt = new Date(bet.expiresAt).getTime();
        const now = Date.now();
        if (now - expiresAt < GRACE_PERIOD_MS) {
          continue;
        }
        try {
          const symbol = bet.symbol.toUpperCase();
          let closePrice = getForexPrice(symbol)?.price;
          
          if (!closePrice || closePrice <= 0) {
            continue;
          }
          
          const strikePrice = parseFloat(bet.strikePrice);
          const betAmount = parseFloat(bet.amount);
          const multiplier = parseFloat(bet.multiplier);

          let outcome: 'win' | 'lose';
          
          // Get the date key for round forced directions (KST)
          const betCreatedAt = new Date(bet.createdAt);
          const kstOffset = 9 * 60 * 60 * 1000;
          const kstBetTime = new Date(betCreatedAt.getTime() + betCreatedAt.getTimezoneOffset() * 60 * 1000 + kstOffset);
          const betDateKey = `${kstBetTime.getFullYear()}-${String(kstBetTime.getMonth() + 1).padStart(2, '0')}-${String(kstBetTime.getDate()).padStart(2, '0')}`;
          
          // Priority: 1) outcomeForced  2) displayForced  3) directionForced  4) globalForced  5) individual forced  6) price-based
          const roundForcedList = await storage.getRoundForcedDirectionsForRound(bet.symbol, bet.duration, bet.roundNumber, betDateKey);
          const directionForced = roundForcedList.find(r => r.forcedDirection === 'up' || r.forcedDirection === 'down');
          const outcomeForced = roundForcedList.find(r => r.forcedDirection === 'all_win' || r.forcedDirection === 'all_lose');
          const displayForced = roundForcedList.find(r => r.forcedDirection === 'display_up' || r.forcedDirection === 'display_down');
          
          // Check global forced setting only if NO round-level settings exist at all
          let globalForcedOutcome: string | undefined;
          if (!outcomeForced && !displayForced && !directionForced) {
            const globalVal = await storage.getSetting(`global_forced:${bet.symbol}:${bet.duration}`);
            if (globalVal === 'all_win' || globalVal === 'all_lose') {
              globalForcedOutcome = globalVal;
            }
          }
          
          let forcedBy = '';
          if (outcomeForced) {
            const variation = strikePrice * 0.001;
            outcome = outcomeForced.forcedDirection === 'all_win' ? 'win' : 'lose';
            forcedBy = `round-${outcomeForced.forcedDirection}`;
            if (outcome === 'win') {
              closePrice = bet.direction === 'long' ? strikePrice + variation : strikePrice - variation;
            } else {
              closePrice = bet.direction === 'long' ? strikePrice - variation : strikePrice + variation;
            }
          } else if (displayForced) {
            const forcedDir: 'long' | 'short' = displayForced.forcedDirection === 'display_up' ? 'long' : 'short';
            const variation = strikePrice * 0.001;
            outcome = bet.direction === forcedDir ? 'win' : 'lose';
            forcedBy = `display-${displayForced.forcedDirection}`;
            if (outcome === 'win') {
              closePrice = bet.direction === 'long' ? strikePrice + variation : strikePrice - variation;
            } else {
              closePrice = bet.direction === 'long' ? strikePrice - variation : strikePrice + variation;
            }
          } else if (directionForced) {
            const variation = strikePrice * 0.001;
            outcome = 'win';
            forcedBy = `direction-${directionForced.forcedDirection}`;
            closePrice = bet.direction === 'long' ? strikePrice + variation : strikePrice - variation;
          } else if (globalForcedOutcome) {
            const variation = strikePrice * 0.001;
            outcome = globalForcedOutcome === 'all_win' ? 'win' : 'lose';
            forcedBy = `global-${globalForcedOutcome}`;
            if (outcome === 'win') {
              closePrice = bet.direction === 'long' ? strikePrice + variation : strikePrice - variation;
            } else {
              closePrice = bet.direction === 'long' ? strikePrice - variation : strikePrice + variation;
            }
          } else if (bet.forcedOutcome === 'win' || bet.forcedOutcome === 'lose') {
            outcome = bet.forcedOutcome;
            forcedBy = `individual-${bet.forcedOutcome}`;
            const variation = strikePrice * 0.001;
            if (outcome === 'win') {
              if (bet.direction === 'long') {
                closePrice = strikePrice + variation;
              } else {
                closePrice = strikePrice - variation;
              }
            } else {
              if (bet.direction === 'long') {
                closePrice = strikePrice - variation;
              } else {
                closePrice = strikePrice + variation;
              }
            }
          } else {
            if (bet.direction === 'long') {
              outcome = closePrice > strikePrice ? 'win' : 'lose';
            } else {
              outcome = closePrice < strikePrice ? 'win' : 'lose';
            }
            forcedBy = 'price';
          }
          
          const payout = outcome === 'win' ? betAmount * multiplier : 0;

          // 미실현 모드 유저 확인 (잔액 변동 없이 정산)
          const betUser = await storage.getUser(bet.userId);
          if (betUser?.alwaysPendingEnabled) {
            await storage.updateBet(bet.id, {
              closePrice: closePrice.toString(),
              outcome,
              payout: payout.toString(),
              settledAt: new Date(),
            });
            broadcastToUser(bet.userId, 'bet_settled', {
              betId: bet.id, outcome, closePrice: closePrice.toString(), payout: payout.toString(),
            });
            console.log(`🔒 [Auto-Settle] Bet #${bet.id}: 미실현 모드 — ${outcome}, 잔액 불변`);
          } else {
            // 일반 유저: 원자적 정산 + 잔고 업데이트
            const settleResult = await storage.atomicSettleBetAndUpdateBalance(bet.id, closePrice.toString(), outcome, payout);
            
            if (!settleResult.success) {
              if (settleResult.alreadySettled) {
                console.log(`⏭️ [Auto-Settle] Bet #${bet.id}: 이미 정산됨, 건너뛰기`);
              }
              continue;
            }
            
            console.log(`✅ [Auto-Settle] Bet #${bet.id}: ${bet.symbol} R${bet.roundNumber} ${bet.duration}s ${bet.direction} → ${outcome} (${forcedBy}) payout: ${payout.toLocaleString()}원`);
            console.log(`   새 잔고: ${settleResult.newBalance ? parseFloat(settleResult.newBalance).toLocaleString() : '알 수 없음'}원`);
            broadcastToAdmins('bet_settled', {
              betId: bet.id, outcome, closePrice: closePrice.toString(), payout: payout.toString(),
            });
            broadcastToAdmins('balance_updated', { userId: bet.userId, balance: settleResult.newBalance });
            broadcastToUser(bet.userId, 'bet_settled', {
              betId: bet.id, outcome, closePrice: closePrice.toString(), payout: payout.toString(),
            });
            console.log(`⚡ [Auto-Settle] Bet #${bet.id} settled: ${outcome} at $${closePrice.toFixed(2)}`);
          }
        } catch (settleError) {
          console.error(`❌ [Auto-Settle] Failed to settle bet #${bet.id}:`, settleError);
        }
      }
    } catch (error) {
      console.error('❌ [Auto-Settle] Error fetching expired bets:', error);
    }
  }
  
  // 구 방식(expiresAt=1년) 미실현 베팅 → outcome='unrealized' 일괄 마이그레이션
  (async () => {
    try {
      const count = await storage.migrateLegacyUnrealizedBets();
      if (count > 0) {
        console.log(`🔄 [Migration] 미실현 베팅 ${count}건 → outcome='unrealized' 변환 완료`);
      }
    } catch (e) {
      console.error('[Migration] 미실현 베팅 마이그레이션 실패:', e);
    }
  })();

  // Run auto-settlement every 2 seconds
  setInterval(settleExpiredBets, 2000);
  console.log('🔄 [Auto-Settle] 자동 정산 시작 (2초 간격)');

  // WebSocket 상태 확인 API (디버깅용)
  app.get("/api/market/status", (req, res) => {
    const now = Date.now();
    res.json({
      connected: isConnected,
      lastFetch: lastYahooFetch,
      source: 'yahoo_finance',
      prices: Object.entries(forexPrices).map(([symbol, data]) => ({
        symbol,
        ticker: FOREX_TO_FINNHUB[symbol],
        price: data.price,
        updatedAt: data.updatedAt,
        age: now - data.updatedAt,
      })),
      timestamp: now
    });
  });

  // 가격 조회 API
  app.get("/api/market/prices", (req, res) => {
    const now = Date.now();
    const prices = [];
    let hasFallback = false;

    for (const forexSymbol of ['SP500', 'DOW', 'DXY']) {
      const data = getForexPrice(forexSymbol);
      if (data && data.price > 0) {
        const isStale = (now - data.updatedAt) > 60000;
        if (isStale) hasFallback = true;
        prices.push({
          symbol: forexSymbol,
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          high: data.high,
          low: data.low,
          timestamp: data.updatedAt
        });
      } else {
        hasFallback = true;
        prices.push({
          symbol: forexSymbol,
          price: 0,
          change: 0,
          changePercent: 0,
          high: 0,
          low: 0,
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
    
    const VALID_FOREX = ['SP500', 'DOW', 'DXY'];
    if (!VALID_FOREX.includes(upperSymbol)) {
      return res.status(400).json({ error: "지원하지 않는 심볼입니다" });
    }

    const now = Date.now();
    const data = getForexPrice(upperSymbol);
    
    if (data && data.price > 0) {
      res.json({
        symbol: upperSymbol,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        high: data.high,
        low: data.low,
        timestamp: data.updatedAt
      });
    } else {
      res.json({
        symbol: upperSymbol,
        price: 0,
        change: 0,
        changePercent: 0,
        high: 0,
        low: 0,
        timestamp: now
      });
    }
  });

  // 캔들 데이터 조회 API (차트용) - WebSocket 틱 데이터에서 서버 자체 생성
  app.get("/api/market/candles/:symbol", (req, res) => {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();
    const duration = parseInt(req.query.duration as string) || 60;
    
    const VALID_FOREX = ['SP500', 'DOW', 'DXY'];
    if (!VALID_FOREX.includes(upperSymbol)) {
      return res.status(400).json({ error: "지원하지 않는 심볼입니다" });
    }

    const validDurations = [300];
    const dur = validDurations.includes(duration) ? duration : 300;

    const ticker = FOREX_TO_FINNHUB[upperSymbol];
    const candles = candleStore[upperSymbol]?.[dur] || [];
    
    res.json({ candles, ticker, symbol: upperSymbol });
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
      const { type, amount, bankName, accountHolder, accountNumber, senderName } = req.body;
      
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
        senderName: senderName || null,
      });

      // Send notification to admins via WebSocket
      const user = await storage.getUser(req.session.userId!);
      broadcastToAdmins('transaction_request', {
        ...request,
        username: user?.username,
        name: user?.name,
      });

      // 텔레그램: 입금신청 알림 (fire-and-forget, 입금만)
      if (type === 'deposit') {
        notifyDepositRequest(storage, {
          username: user?.username || String(req.session.userId),
          amount: amount.toString(),
          bankName: bankName || null,
          accountHolder: accountHolder || null,
          accountNumber: accountNumber || null,
        }).catch(() => {});
      }

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
        const updatedUser = await storage.getUser(user.id);
        broadcastToUser(user.id, 'transaction_processed', {
          ...updated,
          newBalance: updatedUser?.balance,
        });
        broadcastToAdmins('balance_updated', { userId: user.id, balance: updatedUser?.balance });
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

      // 미답변 문의가 있으면 새 문의 등록 불가
      const existingInquiries = await storage.getInquiriesForUser(req.session.userId!);
      const hasPending = existingInquiries.some(inq => inq.status === 'pending');
      if (hasPending) {
        return res.status(400).json({ error: "이전 문의에 답변이 완료된 후 새로운 문의를 작성할 수 있습니다." });
      }

      const inquiry = await storage.createInquiry({
        userId: req.session.userId!,
        title,
        content,
      });

      // 텔레그램: 새 1:1 문의 알림 (fire-and-forget)
      {
        const inquiryUser = await storage.getUser(req.session.userId!);
        notifyNewInquiry(storage, {
          username: inquiryUser?.username || String(req.session.userId),
          title,
          content,
        }).catch(() => {});
      }

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

  // Mark all answered inquiry replies as read for current user (일괄 읽음 처리)
  app.post("/api/inquiries/read-replies", requireAuth, async (req, res) => {
    try {
      await storage.markAllInquiryRepliesReadForUser(req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark inquiry replies read error:", error);
      res.status(500).json({ error: "읽음 처리에 실패했습니다" });
    }
  });

  // Mark a single inquiry reply as read
  app.post("/api/inquiries/:id/read-reply", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
      await storage.markInquiryReplyRead(id, req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark inquiry reply read error:", error);
      res.status(500).json({ error: "읽음 처리에 실패했습니다" });
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

  // Delete inquiry (관리자)
  app.delete("/api/admin/inquiries/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInquiry(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete inquiry error:", error);
      res.status(500).json({ error: "문의 삭제에 실패했습니다" });
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

  // ===== Branch management routes (지점코드 관리) =====
  app.get("/api/admin/branches", requireAdmin, async (req, res) => {
    try {
      const allBranches = await storage.getAllBranches();
      res.json(allBranches);
    } catch (error) {
      console.error("Get branches error:", error);
      res.status(500).json({ error: "지점코드 목록 조회에 실패했습니다" });
    }
  });

  app.post("/api/admin/branches", requireAdmin, async (req, res) => {
    try {
      const { code, name } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: "지점코드와 지점명을 입력해주세요" });
      }
      const existing = await storage.getBranchByCode(code);
      if (existing) {
        return res.status(400).json({ error: "이미 존재하는 지점코드입니다" });
      }
      const branch = await storage.createBranch({ code, name });
      res.json(branch);
    } catch (error) {
      console.error("Create branch error:", error);
      res.status(500).json({ error: "지점코드 생성에 실패했습니다" });
    }
  });

  app.patch("/api/admin/branches/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { code, name, isActive } = req.body;
      const branch = await storage.updateBranch(parseInt(id), { code, name, isActive });
      res.json(branch);
    } catch (error) {
      console.error("Update branch error:", error);
      res.status(500).json({ error: "지점코드 수정에 실패했습니다" });
    }
  });

  app.delete("/api/admin/branches/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBranch(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete branch error:", error);
      res.status(500).json({ error: "지점코드 삭제에 실패했습니다" });
    }
  });

  // Public endpoint to get active branches for registration
  app.get("/api/branches", async (req, res) => {
    try {
      const allBranches = await storage.getAllBranches();
      const activeBranches = allBranches.filter(b => b.isActive);
      res.json(activeBranches.map(b => ({ code: b.code, name: b.name })));
    } catch (error) {
      console.error("Get public branches error:", error);
      res.status(500).json({ error: "지점코드 목록 조회에 실패했습니다" });
    }
  });

  return httpServer;
}
