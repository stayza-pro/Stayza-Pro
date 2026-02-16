import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { config } from "@/config";
import { auditLogger } from "@/services/auditLogger";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: any,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Please sign in to continue") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND_ERROR");
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, "CONFLICT_ERROR", details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429, "RATE_LIMIT_ERROR");
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 402, "PAYMENT_ERROR", details);
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, "BUSINESS_LOGIC_ERROR", details);
  }
}

// Error logging utility
const logError = async (
  err: Error,
  req: Request,
  errorId: string,
  statusCode: number,
) => {
  const logLevel = statusCode >= 500 ? "ERROR" : "WARN";

  // Audit log critical errors
  if (statusCode >= 500) {
    try {
      await auditLogger.log("SYSTEM_ERROR", "ADMIN", {
        entityId: errorId,
        userId: (req as any).user?.id,
        details: {
          message: err.message,
          statusCode,
          url: req.originalUrl,
          method: req.method,
          userAgent: req.get("User-Agent"),
        },
        req,
      });
    } catch (auditError) {
      void auditError;
    }
  }
};

// Enhanced Prisma error handling
const handlePrismaError = (
  err: Prisma.PrismaClientKnownRequestError,
): AppError => {
  const errorMap: Record<
    string,
    { message: string; status: number; code: string }
  > = {
    P2002: {
      message: `Duplicate value for field: ${
        err.meta?.target || "unknown field"
      }`,
      status: 409,
      code: "DUPLICATE_FIELD",
    },
    P2014: {
      message: "Invalid ID provided for the operation",
      status: 400,
      code: "INVALID_ID",
    },
    P2003: {
      message: "Foreign key constraint failed",
      status: 400,
      code: "FOREIGN_KEY_ERROR",
    },
    P2025: {
      message: "Record not found or has been deleted",
      status: 404,
      code: "RECORD_NOT_FOUND",
    },
    P2016: {
      message: "Query interpretation error",
      status: 400,
      code: "QUERY_ERROR",
    },
    P2021: {
      message: "Table does not exist in the current database",
      status: 500,
      code: "TABLE_NOT_EXISTS",
    },
    P2022: {
      message: "Column does not exist in the current database",
      status: 500,
      code: "COLUMN_NOT_EXISTS",
    },
  };

  const errorInfo = errorMap[err.code] || {
    message: "Database operation failed",
    status: 500,
    code: "DATABASE_ERROR",
  };

  return new AppError(errorInfo.message, errorInfo.status, errorInfo.code, {
    prismaCode: err.code,
    meta: err.meta,
  });
};

export const errorHandler = async (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let error: AppError;
  const errorId = `ERR_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // Handle specific error types
  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = new ValidationError("Invalid data provided", {
      prismaError: err.message,
    });
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    error = new AppError(
      "Database connection failed",
      500,
      "DATABASE_CONNECTION_ERROR",
    );
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    error = new AppError("Database engine error", 500, "DATABASE_ENGINE_ERROR");
  } else if (err.name === "JsonWebTokenError") {
    error = new AuthenticationError("Invalid authentication token");
  } else if (err.name === "TokenExpiredError") {
    error = new AuthenticationError("Authentication token has expired");
  } else if (err.name === "NotBeforeError") {
    error = new AuthenticationError("Token not active yet");
  } else if (err.name === "ValidationError" || err.name === "ZodError") {
    const message = (err as any).errors
      ? Object.values((err as any).errors)
          .map((val: any) => val.message || val)
          .join(", ")
      : err.message;
    error = new ValidationError(message, { originalError: err.name });
  } else if (err.name === "CastError") {
    error = new ValidationError("Invalid data format provided");
  } else if (err.name === "MulterError") {
    const multerError = err as any;
    switch (multerError.code) {
      case "LIMIT_FILE_SIZE":
        error = new ValidationError("File too large");
        break;
      case "LIMIT_FILE_COUNT":
        error = new ValidationError("Too many files");
        break;
      case "LIMIT_UNEXPECTED_FILE":
        error = new ValidationError("Unexpected file field");
        break;
      default:
        error = new ValidationError("File upload error");
    }
  } else if (
    err.message.includes("ENOTFOUND") ||
    err.message.includes("ECONNREFUSED")
  ) {
    error = new AppError(
      "External service unavailable",
      503,
      "SERVICE_UNAVAILABLE",
    );
  } else if (err.message.includes("timeout")) {
    error = new AppError(
      "Request timeout - please try again",
      408,
      "REQUEST_TIMEOUT",
    );
  } else {
    // Unknown error - log and return generic message
    error = new AppError(
      config.NODE_ENV === "production" ? "Internal server error" : err.message,
      500,
      "INTERNAL_ERROR",
      config.NODE_ENV === "development"
        ? { originalError: err.message, stack: err.stack }
        : undefined,
    );
  }

  // Log the error
  await logError(err, req, errorId, error.statusCode);

  // Prepare response
  const response: any = {
    success: false,
    message: error.message,
    error: {
      message: error.message,
      code: error.code || "UNKNOWN_ERROR",
      statusCode: error.statusCode,
      errorId,
      timestamp: new Date().toISOString(),
    },
  };

  // Add additional details in development
  if (config.NODE_ENV === "development") {
    response.error.details = error.details;
    response.error.stack = err.stack;
    response.error.originalError = err.name;
  }

  // Add helpful hints for common errors
  if (error.statusCode === 401) {
    response.error.hint =
      "Please check your authentication credentials and try again";
  } else if (error.statusCode === 403) {
    response.error.hint = "You don't have permission to perform this action";
  } else if (error.statusCode === 404) {
    response.error.hint = "The requested resource could not be found";
  } else if (error.statusCode === 409) {
    response.error.hint = "This operation conflicts with existing data";
  } else if (error.statusCode === 429) {
    response.error.hint = "Too many requests. Please wait before trying again";
  } else if (error.statusCode >= 500) {
    response.error.hint =
      "This is a server error. Please try again later or contact support";
  }

  res.status(error.statusCode).json(response);
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown> | unknown;

export const asyncHandler = (fn: AsyncRouteHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handlers for uncaught exceptions
export const setupGlobalErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on("uncaughtException", (err: Error) => {
    // Log to audit system if possible
    auditLogger
      .log("SYSTEM_ERROR", "ADMIN", {
        entityId: "uncaught-exception",
        details: {
          type: "uncaughtException",
          message: err.message,
          stack: err.stack,
        },
      })
      .catch(() => {});

    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    // Log to audit system if possible
    auditLogger
      .log("SYSTEM_ERROR", "ADMIN", {
        entityId: "unhandled-rejection",
        details: {
          type: "unhandledRejection",
          reason: reason?.message || reason,
          stack: reason?.stack,
        },
      })
      .catch(() => {});

    process.exit(1);
  });

  // Handle SIGTERM gracefully
  process.on("SIGTERM", () => {
    process.exit(0);
  });

  // Handle SIGINT gracefully (Ctrl+C)
  process.on("SIGINT", () => {
    process.exit(0);
  });
};

// Health check error types
export class HealthCheckError extends AppError {
  constructor(service: string, details?: any) {
    super(
      `Health check failed for ${service}`,
      503,
      "HEALTH_CHECK_ERROR",
      details,
    );
  }
}

// Database connection error handler
export const handleDatabaseError = (err: any): AppError => {
  if (err.code === "ECONNREFUSED") {
    return new AppError(
      "Database connection refused",
      503,
      "DATABASE_CONNECTION_REFUSED",
      { host: err.address, port: err.port },
    );
  }

  if (err.code === "ENOTFOUND") {
    return new AppError(
      "Database host not found",
      503,
      "DATABASE_HOST_NOT_FOUND",
      { hostname: err.hostname },
    );
  }

  if (err.code === "ETIMEDOUT") {
    return new AppError(
      "Database connection timeout",
      503,
      "DATABASE_CONNECTION_TIMEOUT",
    );
  }

  return new AppError(
    "Database connection error",
    503,
    "DATABASE_CONNECTION_ERROR",
    { originalError: err.message },
  );
};

// Request validation middleware
export const validateRequest = (
  requiredFields: string[],
  optionalFields: string[] = [],
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const allFields = [...requiredFields, ...optionalFields];
    const providedFields = Object.keys(req.body);

    // Check for required fields
    const missingFields = requiredFields.filter(
      (field) =>
        !providedFields.includes(field) ||
        req.body[field] === undefined ||
        req.body[field] === null,
    );

    if (missingFields.length > 0) {
      return next(
        new ValidationError(
          `Missing required fields: ${missingFields.join(", ")}`,
          { missingFields, providedFields },
        ),
      );
    }

    // Check for unexpected fields
    const unexpectedFields = providedFields.filter(
      (field) => !allFields.includes(field),
    );

    if (unexpectedFields.length > 0) {
      return next(
        new ValidationError(
          `Unexpected fields provided: ${unexpectedFields.join(", ")}`,
          { unexpectedFields, allowedFields: allFields },
        ),
      );
    }

    next();
  };
};

// Sanitize sensitive data from logs
export const sanitizeError = (error: any): any => {
  const sensitiveFields = [
    "password",
    "token",
    "authorization",
    "cookie",
    "secret",
    "key",
    "auth",
    "credential",
  ];

  const sanitized = { ...error };

  // Recursively remove sensitive fields
  const removeSensitiveData = (obj: any): any => {
    if (typeof obj !== "object" || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map(removeSensitiveData);
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        cleaned[key] = "[REDACTED]";
      } else {
        cleaned[key] = removeSensitiveData(value);
      }
    }
    return cleaned;
  };

  return removeSensitiveData(sanitized);
};
