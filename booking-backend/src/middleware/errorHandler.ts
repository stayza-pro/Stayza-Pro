import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { config } from "@/config";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err } as AppError;
  error.message = err.message;

  // Log error
  console.error("Error:", err);

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        error = new AppError("Duplicate field value entered", 400);
        break;
      case "P2014":
        error = new AppError("Invalid ID provided", 400);
        break;
      case "P2003":
        error = new AppError("Invalid input data", 400);
        break;
      case "P2025":
        error = new AppError("Record not found", 404);
        break;
      default:
        error = new AppError("Database error", 500);
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    error = new AppError("Invalid data provided", 400);
  }

  // JSON Web Token errors
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Token expired", 401);
  }

  // Validation errors
  if (err.name === "ValidationError") {
    const message = Object.values((err as any).errors)
      .map((val: any) => val.message)
      .join(", ");
    error = new AppError(message, 400);
  }

  // Cast error for invalid ObjectId
  if (err.name === "CastError") {
    error = new AppError("Resource not found", 404);
  }

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : "Something went wrong!";

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.NODE_ENV === "development" && {
      error: err,
      stack: err.stack,
    }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
