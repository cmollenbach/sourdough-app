// middleware/errorHandler.ts - Standardized error handling
// Provides consistent error responses and logging

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../lib/logger';

/**
 * Custom AppError class for application-specific errors
 * Use this to throw errors with specific HTTP status codes
 * 
 * @example
 * throw new AppError(404, 'Recipe not found');
 * throw new AppError(400, 'Invalid input', validationErrors);
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle Prisma-specific errors and convert them to AppError
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const target = error.meta?.target as string[] || [];
      return new AppError(
        409,
        `A record with this ${target.join(', ')} already exists`,
        { code: error.code, target }
      );
    
    case 'P2025':
      // Record not found
      return new AppError(404, 'Record not found', { code: error.code });
    
    case 'P2003':
      // Foreign key constraint failed
      return new AppError(400, 'Related record not found', { code: error.code });
    
    case 'P2014':
      // Invalid ID
      return new AppError(400, 'Invalid ID provided', { code: error.code });
    
    default:
      // Unknown Prisma error
      logger.error('Unhandled Prisma error', { code: error.code, meta: error.meta });
      return new AppError(500, 'Database error occurred', { code: error.code });
  }
}

/**
 * Error handler middleware
 * Must be placed AFTER all routes
 * 
 * Usage in index.ts:
 * app.use(errorHandler);
 */
export function errorHandler(
  err: Error | AppError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Default to 500 server error
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle AppError (our custom errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  }
  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(err);
    statusCode = appError.statusCode;
    message = appError.message;
    details = appError.details;
  }
  // Handle Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Unknown errors
  else {
    message = process.env.NODE_ENV === 'development' ? err.message : 'Internal server error';
  }

  // Log the error
  if (statusCode >= 500) {
    // Server errors are logged as errors
    logger.error('Server error', {
      statusCode,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.userId,
    });
  } else if (statusCode >= 400) {
    // Client errors are logged as warnings
    logger.warn('Client error', {
      statusCode,
      message,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.userId,
    });
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: {
      message,
      statusCode,
    },
  };

  // Include details in development or for operational errors
  if (process.env.NODE_ENV === 'development' || (err instanceof AppError && err.isOperational)) {
    errorResponse.error.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for undefined routes
 * Place this BEFORE the error handler middleware
 * 
 * Usage in index.ts:
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new AppError(404, `Route ${req.method} ${req.path} not found`);
  next(error);
}
