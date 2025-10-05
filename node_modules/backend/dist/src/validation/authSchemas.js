"use strict";
/**
 * Authentication Validation Schemas
 *
 * Joi schemas for validating authentication-related requests
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleOAuthSchema = exports.loginSchema = exports.registerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
/**
 * Register/Signup validation schema
 */
exports.registerSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .lowercase()
        .trim()
        .max(255)
        .required()
        .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required',
    }),
    password: joi_1.default.string()
        .min(8)
        .max(128)
        .required()
        .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.empty': 'Password is required',
        'any.required': 'Password is required',
    }),
});
/**
 * Login validation schema
 */
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required',
    }),
    password: joi_1.default.string()
        .required()
        .messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required',
    }),
});
/**
 * Google OAuth validation schema
 */
exports.googleOAuthSchema = joi_1.default.object({
    idToken: joi_1.default.string()
        .required()
        .messages({
        'string.empty': 'ID token is required',
        'any.required': 'ID token is required',
    }),
});
//# sourceMappingURL=authSchemas.js.map