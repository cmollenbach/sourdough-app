"use strict";
/**
 * Validation Middleware
 *
 * Provides middleware to validate request bodies, params, and query strings
 * using Joi schemas before they reach route handlers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateParams = exports.validateBody = void 0;
const errorHandler_1 = require("./errorHandler");
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
const validateBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Return all errors, not just the first
            stripUnknown: true, // Remove unknown properties
        });
        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            throw new errorHandler_1.AppError(400, 'Validation error', { details });
        }
        // Replace req.body with validated/sanitized value
        req.body = value;
        next();
    };
};
exports.validateBody = validateBody;
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
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
        });
        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            throw new errorHandler_1.AppError(400, 'Invalid URL parameters', { details });
        }
        req.params = value;
        next();
    };
};
exports.validateParams = validateParams;
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
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            throw new errorHandler_1.AppError(400, 'Invalid query parameters', { details });
        }
        req.query = value;
        next();
    };
};
exports.validateQuery = validateQuery;
//# sourceMappingURL=validation.js.map