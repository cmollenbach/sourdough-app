"use strict";
/**
 * Rate Limiting Middleware
 *
 * Protects API endpoints from abuse by limiting the number of requests
 * from a single IP address within a time window.
 *
 * Two tiers of rate limiting:
 * 1. General API rate limiter - Applies to all /api routes
 * 2. Auth rate limiter - Stricter limits for authentication endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = __importDefault(require("../lib/logger"));
/**
 * General API Rate Limiter
 *
 * Limits each IP to 100 requests per 15-minute window
 * Applies to all /api/* routes
 *
 * @example
 * app.use('/api', apiLimiter);
 */
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Custom handler to log rate limit violations
    handler: (req, res) => {
        logger_1.default.warn('API rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method,
        });
        res.status(429).json({
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    },
});
/**
 * Authentication Rate Limiter
 *
 * Stricter rate limiting for authentication endpoints
 * Limits each IP to 5 requests per 15-minute window
 * Applies to /api/auth/* routes (login, register, OAuth)
 *
 * Prevents brute-force attacks on authentication
 *
 * @example
 * app.use('/api/auth', authLimiter);
 */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 authentication attempts per windowMs
    message: {
        error: 'Too many authentication attempts from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for successful authentications (optional)
    skipSuccessfulRequests: false,
    // Custom handler to log authentication rate limit violations
    handler: (req, res) => {
        logger_1.default.warn('Auth rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method,
            body: { email: req.body?.email }, // Log email attempt (not password!)
        });
        res.status(429).json({
            error: 'Too many authentication attempts from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    },
});
/**
 * Optional: Create/Update Bake Rate Limiter
 *
 * Moderate rate limiting for resource creation
 * Prevents spam but allows normal usage
 *
 * Limits each IP to 20 requests per 15-minute window
 *
 * @example
 * router.post('/bakes', createLimiter, async (req, res) => { ... });
 */
exports.createLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 create/update operations per windowMs
    message: {
        error: 'Too many create/update requests, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn('Create/update rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method,
        });
        res.status(429).json({
            error: 'Too many create/update requests, please try again later.',
            retryAfter: '15 minutes'
        });
    },
});
//# sourceMappingURL=rateLimiter.js.map