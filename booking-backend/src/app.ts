import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { config } from "@/config";
import { errorHandler, notFound } from "@/middleware/errorHandler";
import { apiLimiter } from "@/middleware/rateLimiter";

// Import routes
import authRoutes from "@/routes/authRoutes";
import realtorRoutes from "@/routes/realtorRoutes";
import adminRoutes from "@/routes/adminRoutes";
import propertyRoutes from "@/routes/propertyRoutes";
import bookingRoutes from "@/routes/bookingRoutes";
import paymentRoutes from "@/routes/paymentRoutes";
import reviewRoutes from "@/routes/reviewRoutes";
import webhookRoutes from "@/routes/webhookRoutes";

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

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Booking System API",
      version: "1.0.0",
      description:
        "A comprehensive booking system API with authentication, property management, booking system, payments (Stripe & Paystack), and reviews",
      contact: {
        name: "API Support",
        email: "support@bookingsystem.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url:
          config.NODE_ENV === "production"
            ? "https://api.yoursite.com"
            : `http://localhost:${config.PORT}`,
        description:
          config.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization endpoints",
      },
      {
        name: "Properties",
        description: "Property management endpoints",
      },
      {
        name: "Bookings",
        description: "Booking management and availability endpoints",
      },
      {
        name: "Payments",
        description: "Payment processing with Stripe and Paystack",
      },
      {
        name: "Reviews",
        description: "Review and rating system endpoints",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        ApiError: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              description: "Error message",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    description: "Field that caused the error",
                  },
                  message: {
                    type: "string",
                    description: "Specific error message for the field",
                  },
                },
              },
              description: "Detailed validation errors (if applicable)",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              description: "Success message",
            },
            data: {
              type: "object",
              description: "Response data",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API documentation with custom UI options
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "none",
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
  customSiteTitle: "Booking System API Documentation",
  customCss: `
    .swagger-ui .topbar { 
      background-color: #1f2937; 
    }
    .swagger-ui .topbar .download-url-wrapper .download-url-button {
      background-color: #3b82f6;
      border-color: #3b82f6;
    }
  `,
};

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

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.PORT;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${config.NODE_ENV} mode on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  });
}

export default app;
