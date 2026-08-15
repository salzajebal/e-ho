import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, validateWebSocketSession } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { testConnection, initializeDatabase } from "./db";
import { startBackupScheduler } from "./backupScheduler";
import { WebSocketServer, WebSocket } from "ws";

// WebSocket clients storage
export const wsClients = new Set<WebSocket>();
export const adminWsClients = new Set<WebSocket>();
export const userWsClients = new Map<string, Set<WebSocket>>();

// Online user tracking with metadata
export interface OnlineUserInfo {
  odUserId: string;
  odConnectedAt: Date;
  odIp: string;
}
export const onlineUsers = new Map<string, OnlineUserInfo>();

// Get list of online user IDs
export function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}

// Broadcast to all admin clients
export function broadcastToAdmins(event: string, data: any) {
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  adminWsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Broadcast to a specific user
export function broadcastToUser(userId: string | number, event: string, data: any) {
  const userIdKey = String(userId);
  const clients = userWsClients.get(userIdKey);
  if (!clients) return;
  
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

console.log("Starting server initialization...");
console.log("NODE_ENV:", process.env.NODE_ENV);

const app = express();
const httpServer = createServer(app);

// Trust proxy (needed for correct IP detection behind load balancer)
app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("Testing database connection...");
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("Failed to connect to database. Server will start but may have issues.");
    }

    console.log("Initializing database...");
    try {
      await initializeDatabase();
    } catch (dbError) {
      console.error("Database initialization failed, continuing anyway:", dbError instanceof Error ? dbError.message : dbError);
    }

    console.log("Registering routes...");
    await registerRoutes(httpServer, app);
    console.log("Routes registered successfully");

    // 매일 새벽 3시 KST 자동 DB 백업
    startBackupScheduler();

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      console.log("Setting up static file serving for production...");
      serveStatic(app);
      console.log("Static file serving configured");
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "5000", 10);
    console.log(`Starting HTTP server on port ${port}...`);
    
    // Setup WebSocket servers using noServer mode to avoid interfering with Vite HMR
    const wss = new WebSocketServer({ noServer: true });
    const userWss = new WebSocketServer({ noServer: true });
    
    httpServer.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
      
      if (pathname === '/ws/admin') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else if (pathname === '/ws/user') {
        userWss.handleUpgrade(request, socket, head, (ws) => {
          userWss.emit('connection', ws, request);
        });
      }
      // Let other upgrade requests (like Vite HMR) pass through
    });
    
    wss.on('connection', async (ws, req) => {
      // Authenticate WebSocket connection by validating session cookie
      try {
        const sessionData = await validateWebSocketSession(req.headers.cookie);
        
        if (!sessionData) {
          console.log('WebSocket rejected: No valid session');
          ws.close(4001, 'Unauthorized: Invalid or expired session');
          return;
        }
        
        if (!sessionData.isAdmin) {
          console.log('WebSocket rejected: User is not admin');
          ws.close(4003, 'Forbidden: Admin access required');
          return;
        }
        
        // Session is valid and user is admin - add to clients
        adminWsClients.add(ws);
        console.log(`Admin WebSocket connected: userId=${sessionData.userId}`);
        ws.send(JSON.stringify({ event: 'connected', data: { message: 'Admin WebSocket connected' } }));
        
        ws.on('close', () => {
          console.log('Admin WebSocket client disconnected');
          adminWsClients.delete(ws);
        });
        
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          adminWsClients.delete(ws);
        });
        
      } catch (error) {
        console.error('WebSocket auth error:', error);
        ws.close(4001, 'Unauthorized');
      }
    });

    userWss.on('connection', async (ws, req) => {
      console.log('User WebSocket connection attempt received');
      try {
        const sessionData = await validateWebSocketSession(req.headers.cookie);
        console.log('User WebSocket session validation result:', sessionData ? `userId=${sessionData.userId}` : 'null');
        
        if (!sessionData) {
          console.log('User WebSocket rejected: No valid session');
          ws.close(4001, 'Unauthorized: Invalid or expired session');
          return;
        }
        
        const userId = sessionData.userId;
        
        // Get client IP address
        const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || 
                         req.headers['x-real-ip']?.toString() || 
                         req.socket.remoteAddress || 
                         'unknown';
        
        // Add to user clients map
        if (!userWsClients.has(userId)) {
          userWsClients.set(userId, new Set());
        }
        userWsClients.get(userId)!.add(ws);
        
        // Track online user with metadata
        onlineUsers.set(userId, {
          odUserId: userId,
          odConnectedAt: new Date(),
          odIp: clientIp,
        });
        
        console.log(`User WebSocket connected: userId=${userId}, IP=${clientIp}`);
        ws.send(JSON.stringify({ event: 'connected', data: { message: 'User WebSocket connected' } }));
        
        // Notify admins of user connection
        broadcastToAdmins('user_connected', { userId, ip: clientIp });
        
        ws.on('close', () => {
          console.log(`User WebSocket disconnected: userId=${userId}`);
          const clients = userWsClients.get(userId);
          if (clients) {
            clients.delete(ws);
            if (clients.size === 0) {
              userWsClients.delete(userId);
              // Remove from online users when all connections closed
              onlineUsers.delete(userId);
              // Notify admins of user disconnection
              broadcastToAdmins('user_disconnected', { userId });
            }
          }
        });
        
        ws.on('error', (error) => {
          console.error('User WebSocket error:', error);
          const clients = userWsClients.get(userId);
          if (clients) {
            clients.delete(ws);
            if (clients.size === 0) {
              userWsClients.delete(userId);
              onlineUsers.delete(userId);
            }
          }
        });
        
      } catch (error) {
        console.error('User WebSocket auth error:', error);
        ws.close(4001, 'Unauthorized');
      }
    });
    
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);
        console.log(`Server ready and listening on port ${port}`);
        console.log(`WebSocket server ready at /ws/admin`);
      },
    );
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
