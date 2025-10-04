/**
 * Authentication Validation Schemas
 * 
 * Joi schemas for validating authentication-related requests
 */

import Joi from 'joi';

/**
 * Register/Signup validation schema
 */
export const registerSchema = Joi.object({
  email: Joi.string()
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
  
  password: Joi.string()
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
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
    }),
});

/**
 * Google OAuth validation schema
 */
export const googleOAuthSchema = Joi.object({
  idToken: Joi.string()
    .required()
    .messages({
      'string.empty': 'ID token is required',
      'any.required': 'ID token is required',
    }),
});
