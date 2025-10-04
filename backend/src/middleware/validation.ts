/**
 * Validation Middleware
 * 
 * Provides middleware to validate request bodies, params, and query strings
 * using Joi schemas before they reach route handlers.
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

/**
 * Validates request body against a Joi schema
 * 
 * @param schema - Joi schema to validate against
 * @returns Express middleware function
 * 
 * @example
 * router.post('/recipes', 
 *   validateBody(createRecipeSchema),
 *   async (req, res) => { ... }
 * );
 */
export const validateBody = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first
      stripUnknown: true, // Remove unknown properties
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      throw new AppError(400, 'Validation error', { details });
    }

    // Replace req.body with validated/sanitized value
    req.body = value;
    next();
  };
};

/**
 * Validates request params against a Joi schema
 * 
 * @param schema - Joi schema to validate against
 * @returns Express middleware function
 * 
 * @example
 * router.get('/recipes/:id', 
 *   validateParams(Joi.object({ id: Joi.number().required() })),
 *   async (req, res) => { ... }
 * );
 */
export const validateParams = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      throw new AppError(400, 'Invalid URL parameters', { details });
    }

    req.params = value;
    next();
  };
};

/**
 * Validates request query string against a Joi schema
 * 
 * @param schema - Joi schema to validate against
 * @returns Express middleware function
 * 
 * @example
 * router.get('/recipes', 
 *   validateQuery(Joi.object({ 
 *     page: Joi.number().min(1).default(1),
 *     limit: Joi.number().min(1).max(100).default(20)
 *   })),
 *   async (req, res) => { ... }
 * );
 */
export const validateQuery = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      throw new AppError(400, 'Invalid query parameters', { details });
    }

    req.query = value;
    next();
  };
};
