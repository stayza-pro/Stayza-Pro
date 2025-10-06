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

const app = express();

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// Webhook routes (BEFORE express.json for raw body parsing)
app.use("/api/webhooks", webhookRoutes);

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);
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
}

export default app;
