import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { asyncHandler, HealthCheckError } from "@/middleware/errorHandler";

interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: {
      status: "healthy" | "unhealthy";
      responseTime?: number;
      error?: string;
    };
    redis?: {
      status: "healthy" | "unhealthy";
      responseTime?: number;
      error?: string;
    };
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

/**
 * @desc    Health check endpoint
 * @route   GET /health
 * @access  Public
 */
export const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();

  // Initialize health status
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "unknown",
    services: {
      database: { status: "healthy" },
    },
    system: {
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
      },
      cpu: {
        usage: 0,
      },
    },
  };

  // Check database connection
  try {
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStartTime;

    health.services.database = {
      status: "healthy",
      responseTime: dbResponseTime,
    };
  } catch (error) {
    health.services.database = {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown database error",
    };
    health.status = "unhealthy";
  }

  // Get system information
  const memUsage = process.memoryUsage();
  health.system.memory = {
    used: Math.round(memUsage.rss / 1024 / 1024), // MB
    total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    percentage: Math.round((memUsage.rss / memUsage.heapTotal) * 100),
  };

  // Simple CPU usage approximation
  const cpuUsage = process.cpuUsage();
  health.system.cpu = {
    usage: Math.round((cpuUsage.user + cpuUsage.system) / 1000), // microseconds to milliseconds
  };

  // Determine overall status
  if (health.services.database.status === "unhealthy") {
    health.status = "unhealthy";
  } else if (health.system.memory.percentage > 90) {
    health.status = "degraded";
  }

  // Set appropriate HTTP status
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

/**
 * @desc    Detailed health check for monitoring systems
 * @route   GET /health/detailed
 * @access  Public
 */
export const detailedHealthCheck = asyncHandler(
  async (req: Request, res: Response) => {
    const checks = [];
    let overallStatus = "healthy";

    // Database connectivity check
    try {
      const dbStart = Date.now();
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

    // Database table checks
    const tables = ["users", "realtors", "properties", "bookings", "payments"];
    for (const table of tables) {
      try {
        const tableStart = Date.now();
        await (prisma as any)[table].findFirst();
        checks.push({
          service: `database_table_${table}`,
          status: "healthy",
          responseTime: Date.now() - tableStart,
        });
      } catch (error) {
        checks.push({
          service: `database_table_${table}`,
          status: "unhealthy",
          error:
            error instanceof Error
              ? error.message
              : `Table ${table} check failed`,
        });
        if (overallStatus === "healthy") overallStatus = "degraded";
      }
    }

    // Environment variables check
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

    const response = {
      success: overallStatus !== "unhealthy",
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      summary: {
        total: checks.length,
        healthy: checks.filter((c) => c.status === "healthy").length,
        unhealthy: checks.filter((c) => c.status === "unhealthy").length,
      },
    };

    const httpStatus = overallStatus === "healthy" ? 200 : 503;
    res.status(httpStatus).json(response);
  }
);

/**
 * @desc    Readiness probe for Kubernetes
 * @route   GET /ready
 * @access  Public
 */
export const readinessProbe = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Quick database check
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        success: true,
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      throw new HealthCheckError("database", {
        error: error instanceof Error ? error.message : "Database not ready",
      });
    }
  }
);

/**
 * @desc    Liveness probe for Kubernetes
 * @route   GET /live
 * @access  Public
 */
export const livenessProbe = asyncHandler(
  async (req: Request, res: Response) => {
    // Simple liveness check - if we can respond, we're alive
    res.status(200).json({
      success: true,
      alive: true,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }
);
