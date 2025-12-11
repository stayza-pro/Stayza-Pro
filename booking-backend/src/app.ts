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
import { swaggerSpec, swaggerUiOptions } from "@/config/swagger";

// Import routes
import authRoutes from "@/routes/authRoutes";
import realtorRoutes from "@/routes/realtorRoutes";
import adminRoutes from "@/routes/adminRoutes";
import propertyRoutes from "@/routes/propertyRoutes";
import bookingRoutes from "@/routes/bookingRoutes";
import paymentRoutes from "@/routes/paymentRoutes";
import reviewRoutes from "@/routes/reviewRoutes";
import webhookRoutes from "@/routes/webhookRoutes";
import emailRoutes from "@/routes/emailRoutes";
import notificationRoutes from "@/routes/notificationRoutes";
import refundRoutes from "@/routes/refundRoutes";
import settingsRoutes from "@/routes/settingsRoutes";
import brandingRoutes from "@/routes/brandingRoutes";
import disputeRoutes from "@/routes/dispute.routes";
import systemRoutes from "@/routes/systemRoutes";

const app = express();

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// Webhook routes (BEFORE express.json for raw body parsing)
app.use("/api/webhooks", webhookRoutes);

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression

// Configure CORS for multi-tenant subdomain architecture
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Define allowed origins for development
    const allowedOrigins = [
      config.FRONTEND_URL, // http://localhost:3000
      "http://localhost:3000",
      "https://localhost:3000",
    ];

    // Development patterns (localhost)
    const adminPatternDev = /^https?:\/\/admin\.localhost(:\d+)?$/;
    const subdomainPatternDev = /^https?:\/\/[a-zA-Z0-9-]+\.localhost(:\d+)?$/;

    // Production patterns (replace 'stayza.com' with your actual domain)
    const productionDomain = process.env.PRODUCTION_DOMAIN || "stayza.com";
    const adminPatternProd = new RegExp(
      `^https?:\/\/admin\\.${productionDomain.replace(".", "\\.")}$`
    );
    const subdomainPatternProd = new RegExp(
      `^https?:\/\/[a-zA-Z0-9-]+\\.${productionDomain.replace(".", "\\.")}$`
    );
    const mainDomainProd = new RegExp(
      `^https?:\/\/(www\\.)?${productionDomain.replace(".", "\\.")}$`
    );

    // Check if origin is allowed
    const isAllowed =
      allowedOrigins.includes(origin) ||
      adminPatternDev.test(origin) ||
      subdomainPatternDev.test(origin) ||
      adminPatternProd.test(origin) ||
      subdomainPatternProd.test(origin) ||
      mainDomainProd.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
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

// Rate limiting
app.use("/api/", apiLimiter);

// Health check endpoints
import {
  healthCheck,
  detailedHealthCheck,
  readinessProbe,
  livenessProbe,
} from "@/controllers/healthController";

app.get("/health", healthCheck);
app.get("/health/detailed", detailedHealthCheck);
app.get("/ready", readinessProbe);
app.get("/live", livenessProbe);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUiOptions)
);

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
app.use("/api/admin/system", systemRoutes);

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

  // Start escrow job scheduler
  const { initializeScheduledJobs } = require("@/jobs/scheduler");
  initializeScheduledJobs();
  console.log(`⚖️  Escrow jobs initialized`);
}

export default app;
