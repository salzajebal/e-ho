import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { testConnection, initializeDatabase } from "./db";
import { WebSocketServer, WebSocket } from "ws";

// WebSocket clients storage
export const wsClients = new Set<WebSocket>();
export const adminWsClients = new Set<WebSocket>();

// Broadcast to all admin clients
export function broadcastToAdmins(event: string, data: any) {
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  adminWsClients.forEach(client => {
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
    
    // Setup WebSocket server for real-time admin betting control
    const wss = new WebSocketServer({ server: httpServer, path: '/ws/admin' });
    
    wss.on('connection', (ws, req) => {
      console.log('Admin WebSocket client connected');
      adminWsClients.add(ws);
      
      // Send initial connection success message
      ws.send(JSON.stringify({ event: 'connected', data: { message: 'Admin WebSocket connected' } }));
      
      ws.on('close', () => {
        console.log('Admin WebSocket client disconnected');
        adminWsClients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        adminWsClients.delete(ws);
      });
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
