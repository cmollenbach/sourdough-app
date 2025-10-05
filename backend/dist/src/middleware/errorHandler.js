"use strict";
// middleware/errorHandler.ts - Standardized error handling
// Provides consistent error responses and logging
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("../lib/logger"));
/**
 * Custom AppError class for application-specific errors
 * Use this to throw errors with specific HTTP status codes
 *
 * @example
 * throw new AppError(404, 'Recipe not found');
 * throw new AppError(400, 'Invalid input', validationErrors);
 */
class AppError extends Error {
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Distinguishes operational errors from programming errors
        this.details = details;
        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Handle Prisma-specific errors and convert them to AppError
 */
function handlePrismaError(error) {
    switch (error.code) {
        case 'P2002':
            // Unique constraint violation
            const target = error.meta?.target || [];
            return new AppError(409, `A record with this ${target.join(', ')} already exists`, { code: error.code, target });
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
            logger_1.default.error('Unhandled Prisma error', { code: error.code, meta: error.meta });
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
function errorHandler(err, req, res, next) {
    // Default to 500 server error
    let statusCode = 500;
    let message = 'Internal server error';
    let details = undefined;
    // Handle AppError (our custom errors)
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        details = err.details;
    }
    // Handle Prisma errors
    else if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(err);
        statusCode = appError.statusCode;
        message = appError.message;
        details = appError.details;
    }
    // Handle Prisma validation errors
    else if (err instanceof client_1.Prisma.PrismaClientValidationError) {
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
        logger_1.default.error('Server error', {
            statusCode,
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            userId: req.user?.userId,
        });
    }
    else if (statusCode >= 400) {
        // Client errors are logged as warnings
        logger_1.default.warn('Client error', {
            statusCode,
            message,
            path: req.path,
            method: req.method,
            userId: req.user?.userId,
        });
    }
    // Send error response
    const errorResponse = {
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
function notFoundHandler(req, res, next) {
    const error = new AppError(404, `Route ${req.method} ${req.path} not found`);
    next(error);
}
//# sourceMappingURL=errorHandler.js.map