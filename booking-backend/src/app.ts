import express from "express";
import { hash } from "bcrypt";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import cron from "node-cron";
import { UserRole } from "@prisma/client";
import { config } from "@/config";
import { prisma } from "@/config/database";
import {
  errorHandler,
  notFound,
  setupGlobalErrorHandlers,
} from "@/middleware/errorHandler";
import { apiLimiter } from "@/middleware/rateLimiter";
import { swaggerSpec } from "@/config/swagger";
import { logger } from "@/utils/logger";
import { NotificationService } from "@/services/notificationService";
import { startUnpaidBookingCron } from "@/jobs/unpaidBookingCron";
import { initializeScheduledJobs } from "@/jobs/scheduler";
import { SystemMessageService } from "@/services/systemMessage";
import {
  getFinanceConfigHealth,
  loadFinanceConfig,
} from "@/services/financeConfig";

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
import adminWithdrawalRoutes from "@/routes/admin.withdrawal.routes";
import systemRoutes from "@/routes/system.routes";
import messageRoutes from "@/routes/message.routes";
import favoritesRoutes from "@/routes/favorites.routes";
import escrowRoutes from "@/routes/escrow.routes";
import walletRoutes from "@/routes/wallet.routes";
import waitlistRoutes from "@/routes/waitlist.routes";
import testRoutes from "@/routes/test.routes";

const app = express();

const bootstrapAdminIfConfigured = async () => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    logger.warn(
      "Admin bootstrap skipped: ADMIN_EMAIL or ADMIN_PASSWORD missing",
    );
    return;
  }

  if (adminPassword.length < 8) {
    logger.warn("Admin bootstrap skipped: ADMIN_PASSWORD is too short");
    return;
  }

  const adminFirstName = process.env.ADMIN_FIRST_NAME?.trim() || "System";
  const adminLastName = process.env.ADMIN_LAST_NAME?.trim() || "Administrator";
  const fullName = `${adminFirstName} ${adminLastName}`.trim();
  const hashedPassword = await hash(adminPassword, 10);

  const existingUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: adminEmail,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      role: true,
      email: true,
    },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        fullName,
        role: UserRole.ADMIN,
        isEmailVerified: true,
      },
    });

    logger.info("Admin account created from environment", {
      email: adminEmail,
    });
    return;
  }

  await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      password: hashedPassword,
      role: UserRole.ADMIN,
      firstName: adminFirstName,
      lastName: adminLastName,
      fullName,
      isEmailVerified: true,
    },
  });

  logger.info("Admin account updated from environment", { email: adminEmail });
};

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// Webhook routes (BEFORE express.json to preserve raw payload for signature verification)
app.use(
  "/api/webhooks/paystack",
  express.raw({ type: "application/json", limit: "2mb" }),
);
app.use("/api/webhooks", express.json({ limit: "2mb" }), webhookRoutes);

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression

// Serve static files from public directory
app.use("/public", express.static("public"));

// Simplified CORS configuration
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
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
        origin.endsWith(`.${productionDomain}`),
    );

    if (isAllowed) {
      callback(null, true);
    } else {
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
  if (req.path.includes("/payments/") || req.path.includes("/bookings")) {
    logger.debug("Incoming booking/payment request", {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
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

  try {
    await loadFinanceConfig();
    health.services.financeConfig = getFinanceConfigHealth();
    if (health.services.financeConfig.status === "unhealthy") {
      health.status = "unhealthy";
    } else if (health.services.financeConfig.status === "degraded") {
      health.status = health.status === "unhealthy" ? "unhealthy" : "degraded";
    }
  } catch (error) {
    health.services.financeConfig = {
      status: "unhealthy",
      error:
        error instanceof Error ? error.message : "Finance config load failed",
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

  try {
    await loadFinanceConfig();
    const financeConfigHealth = getFinanceConfigHealth();
    checks.push({
      service: "finance-config",
      status: financeConfigHealth.status,
      message:
        financeConfigHealth.status === "healthy"
          ? "Finance config is valid"
          : "Finance config has validation issues",
      details: financeConfigHealth,
    });

    if (financeConfigHealth.status === "unhealthy") {
      overallStatus = "unhealthy";
    } else if (
      financeConfigHealth.status === "degraded" &&
      overallStatus === "healthy"
    ) {
      overallStatus = "degraded";
    }
  } catch (error) {
    checks.push({
      service: "finance-config",
      status: "unhealthy",
      error:
        error instanceof Error ? error.message : "Finance config load failed",
    });
    overallStatus = "unhealthy";
  }

  const requiredEnvVars = [
    "DATABASE_URL",
    "JWT_SECRET",
    "PAYSTACK_SECRET_KEY",
    "PAYSTACK_PUBLIC_KEY",
    "PAYSTACK_WEBHOOK_SECRET",
  ];
  const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );
  const hasResendConfig = Boolean(process.env.RESEND_API_KEY);
  const hasSmtpConfig = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );

  const environmentErrors: string[] = [];
  if (missingEnvVars.length > 0) {
    environmentErrors.push(
      `Missing environment variables: ${missingEnvVars.join(", ")}`,
    );
  }
  if (!hasResendConfig && !hasSmtpConfig) {
    environmentErrors.push(
      "Configure email provider: set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS",
    );
  }

  if (environmentErrors.length > 0) {
    checks.push({
      service: "environment",
      status: "unhealthy",
      error: environmentErrors.join(" | "),
    });
    overallStatus = "unhealthy";
  } else {
    checks.push({
      service: "environment",
      status: "healthy",
      message: "All required environment variables are present",
    });
  }

  res.status(overallStatus === "unhealthy" ? 503 : 200).json({
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
app.use("/api/admin/withdrawals", adminWithdrawalRoutes);
app.use("/api/admin/system", systemRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/waitlist", waitlistRoutes);

// Development-only test routes
if (config.NODE_ENV === "development") {
  app.use("/api/test", testRoutes);
}

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.PORT;

if (require.main === module) {
  // Setup global error handlers
  setupGlobalErrorHandlers();
  const bootstrap = async () => {
    await bootstrapAdminIfConfigured();
    await loadFinanceConfig();

    const server = app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`);
    });

    // Initialize NotificationService with Socket.io
    NotificationService.initialize(server);

    // Start unpaid booking auto-cancellation cron
    startUnpaidBookingCron();

    // Start escrow job scheduler
    initializeScheduledJobs();

    // Rehydrate scheduled booking message automation after restart
    SystemMessageService.rehydrateScheduledMessages().catch((error) => {
      logger.error("System message rehydration failed", { error });
    });

    // Rehydrate periodically to cover runtime restarts/timeouts
    cron.schedule("*/30 * * * *", async () => {
      try {
        await SystemMessageService.rehydrateScheduledMessages();
      } catch (error) {
        logger.error("System message periodic rehydration failed", { error });
      }
    });

  };

  bootstrap().catch((error) => {
    logger.error("Server bootstrap failed", {
      error: error instanceof Error ? error.message : error,
    });
    process.exit(1);
  });
}

export default app;
