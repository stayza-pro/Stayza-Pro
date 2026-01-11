import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { config } from "@/config";
import {
  errorHandler,
  notFound,
  setupGlobalErrorHandlers,
} from "@/middleware/errorHandler";
import { apiLimiter } from "@/middleware/rateLimiter";
import { swaggerSpec } from "@/config/swagger";

// Import routes
import authRoutes from "@/routes/auth.routes";
import realtorRoutes from "@/routes/realtorRoutes";
import adminRoutes from "@/routes/admin.routes";
import propertyRoutes from "@/routes/property.routes";
import bookingRoutes from "@/routes/booking.routes";
import paymentRoutes from "@/routes/payment.routes";
import reviewRoutes from "@/routes/review.routes";
import webhookRoutes from "@/routes/webhook.routes";
import emailRoutes from "@/routes/email.routes";
import notificationRoutes from "@/routes/notification.routes";
import refundRoutes from "@/routes/refund.routes";
import settingsRoutes from "@/routes/settings.routes";
import brandingRoutes from "@/routes/branding.routes";
import disputeRoutes from "@/routes/dispute.routes";
import adminDisputeRoutes from "@/routes/admin.dispute.routes";
import systemRoutes from "@/routes/system.routes";
import messageRoutes from "@/routes/message.routes";
import favoritesRoutes from "@/routes/favorites.routes";
import escrowRoutes from "@/routes/escrow.routes";
import walletRoutes from "@/routes/wallet.routes";

const app = express();

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// Webhook routes (BEFORE express.json for raw body parsing)
app.use("/api/webhooks", webhookRoutes);

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression

// Simplified CORS configuration
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Development: Allow everything
    if (config.NODE_ENV === "development") {
      return callback(null, true);
    }

    // Production: Allow specific domains and their subdomains
    if (!origin) return callback(null, true);

    const productionDomain = process.env.PRODUCTION_DOMAIN || "stayza.pro";
    const allowedDomains = [
      productionDomain,
      `www.${productionDomain}`,
      config.FRONTEND_URL,
    ];

    // Check if origin ends with allowed domain (supports all subdomains)
    const isAllowed = allowedDomains.some(
      (domain) =>
        origin === `https://${domain}` ||
        origin === `http://${domain}` ||
        origin.endsWith(`.${productionDomain}`)
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked: ${origin}`);
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.path.includes("/payments/") || req.path.includes("/bookings")) {
    console.log("   Headers:", {
      auth: req.headers.authorization ? "Present" : "Missing",
      contentType: req.headers["content-type"],
    });
    console.log("   Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// Rate limiting
app.use("/api/", apiLimiter);

// Health check endpoints
app.get("/health", async (req, res) => {
  const startTime = Date.now();
  const health: any = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "unknown",
    services: { database: { status: "healthy" } },
    system: {
      memory: { used: 0, total: 0, percentage: 0 },
      cpu: { usage: 0 },
    },
  };

  try {
    const dbStartTime = Date.now();
    const { prisma } = await import("@/config/database");
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = {
      status: "healthy",
      responseTime: Date.now() - dbStartTime,
    };
  } catch (error) {
    health.services.database = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown database error",
    };
    health.status = "unhealthy";
  }

  const memUsage = process.memoryUsage();
  health.system.memory = {
    used: Math.round(memUsage.rss / 1024 / 1024),
    total: Math.round(memUsage.heapTotal / 1024 / 1024),
    percentage: Math.round((memUsage.rss / memUsage.heapTotal) * 100),
  };

  const cpuUsage = process.cpuUsage();
  health.system.cpu = {
    usage: Math.round((cpuUsage.user + cpuUsage.system) / 1000),
  };

  if (health.services.database.status === "unhealthy")
    health.status = "unhealthy";
  else if (health.system.memory.percentage > 90) health.status = "degraded";

  const httpStatus =
    health.status === "healthy"
      ? 200
      : health.status === "degraded"
      ? 200
      : 503;
  res.status(httpStatus).json({
    success: health.status !== "unhealthy",
    data: health,
    responseTime: Date.now() - startTime,
  });
});

app.get("/health/detailed", async (req, res) => {
  const checks = [];
  let overallStatus = "healthy";

  try {
    const dbStart = Date.now();
    const { prisma } = await import("@/config/database");
    await prisma.user.count();
    checks.push({
      service: "database",
      status: "healthy",
      responseTime: Date.now() - dbStart,
      message: "Database connection successful",
    });
  } catch (error) {
    checks.push({
      service: "database",
      status: "unhealthy",
      error:
        error instanceof Error ? error.message : "Database connection failed",
    });
    overallStatus = "unhealthy";
  }

  const requiredEnvVars = [
    "DATABASE_URL",
    "JWT_SECRET",
    "PAYSTACK_SECRET_KEY",
    "SMTP_HOST",
  ];
  const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingEnvVars.length > 0) {
    checks.push({
      service: "environment",
      status: "unhealthy",
      error: `Missing environment variables: ${missingEnvVars.join(", ")}`,
    });
    overallStatus = "unhealthy";
  } else {
    checks.push({
      service: "environment",
      status: "healthy",
      message: "All required environment variables are present",
    });
  }

  res.status(overallStatus === "healthy" ? 200 : 503).json({
    success: overallStatus !== "unhealthy",
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    summary: {
      total: checks.length,
      healthy: checks.filter((c) => c.status === "healthy").length,
      unhealthy: checks.filter((c) => c.status === "unhealthy").length,
    },
  });
});

app.get("/ready", async (req, res) => {
  try {
    const { prisma } = await import("@/config/database");
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      ready: false,
      error: error instanceof Error ? error.message : "Database not ready",
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/live", (req, res) => {
  res.status(200).json({
    success: true,
    alive: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Swagger JSON endpoint
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/realtors", realtorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/branding", brandingRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/admin/disputes", adminDisputeRoutes);
app.use("/api/admin/system", systemRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/wallets", walletRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.PORT;

if (require.main === module) {
  // Setup global error handlers
  setupGlobalErrorHandlers();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${config.NODE_ENV} mode on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  });

  // Initialize NotificationService with Socket.io
  const { NotificationService } = require("@/services/notificationService");
  NotificationService.initialize(server);
  console.log(`🔔 Real-time notifications initialized`);

  // Start CRON jobs
  const { startPayoutCron } = require("@/jobs/payoutCron");
  startPayoutCron();
  console.log(`⏰ CRON jobs started`);

  // Start unpaid booking auto-cancellation cron
  const { startUnpaidBookingCron } = require("@/jobs/unpaidBookingCron");
  startUnpaidBookingCron();

  // Start escrow job scheduler
  const { initializeScheduledJobs } = require("@/jobs/scheduler");
  initializeScheduledJobs();
  console.log(`⚖️  Escrow jobs initialized`);

  // Start new commission flow timer jobs
  const cron = require("node-cron");
  const roomFeeReleaseJob = require("@/jobs/roomFeeReleaseJob");
  const depositRefundJob = require("@/jobs/depositRefundJob");
  const checkinFallbackJob = require("@/jobs/checkinFallbackJob");

  // Room Fee Release Job (every 5 minutes)
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log(
        `⏰ Running room fee release job at ${new Date().toISOString()}`
      );
      await roomFeeReleaseJob.default.processRoomFeeRelease();
    } catch (error) {
      console.error("Room fee release job failed:", error);
    }
  });

  // Deposit Refund Job (every 5 minutes)
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log(
        `⏰ Running deposit refund job at ${new Date().toISOString()}`
      );
      await depositRefundJob.default.processDepositRefunds();
    } catch (error) {
      console.error("Deposit refund job failed:", error);
    }
  });

  // Check-in Fallback Job (every 5 minutes)
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log(
        `⏰ Running check-in fallback job at ${new Date().toISOString()}`
      );
      await checkinFallbackJob.default.processCheckinFallbacks();
    } catch (error) {
      console.error("Check-in fallback job failed:", error);
    }
  });

  console.log(
    `💰 New commission flow timer jobs started (running every 5 minutes)`
  );
}

export default app;
