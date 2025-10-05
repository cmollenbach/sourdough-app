"use strict";
/**
 * Recipe Validation Schemas
 *
 * Joi schemas for validating recipe-related requests
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBakeRatingSchema = exports.updateBakeNotesSchema = exports.bakeIdParamSchema = exports.recipeIdParamSchema = exports.updateRecipeSchema = exports.createRecipeSchema = void 0;
const joi_1 = __importDefault(require("joi"));
/**
 * Create recipe validation schema
 */
exports.createRecipeSchema = joi_1.default.object({
    name: joi_1.default.string()
        .min(1)
        .max(255)
        .trim()
        .required()
        .messages({
        'string.empty': 'Recipe name is required',
        'string.max': 'Recipe name must not exceed 255 characters',
        'any.required': 'Recipe name is required',
    }),
    totalWeight: joi_1.default.number()
        .positive()
        .max(100000) // 100kg max
        .allow(null)
        .optional()
        .messages({
        'number.positive': 'Total weight must be a positive number',
        'number.max': 'Total weight must not exceed 100,000 grams',
    }),
    hydrationPct: joi_1.default.number()
        .min(0)
        .max(500) // Some recipes can be very hydrated
        .allow(null)
        .optional()
        .messages({
        'number.min': 'Hydration percentage cannot be negative',
        'number.max': 'Hydration percentage must not exceed 500%',
    }),
    saltPct: joi_1.default.number()
        .min(0)
        .max(10) // Typically 1-3%, max 10% for safety
        .allow(null)
        .optional()
        .messages({
        'number.min': 'Salt percentage cannot be negative',
        'number.max': 'Salt percentage must not exceed 10%',
    }),
    notes: joi_1.default.string()
        .max(5000)
        .allow('', null)
        .optional()
        .messages({
        'string.max': 'Notes must not exceed 5,000 characters',
    }),
    steps: joi_1.default.array()
        .items(joi_1.default.object({
        stepTemplateId: joi_1.default.number().integer().positive().required(),
        order: joi_1.default.number().integer().min(0).required(),
        duration: joi_1.default.number().min(0).allow(null).optional(),
        timing: joi_1.default.string().max(500).allow('', null).optional(),
        ingredients: joi_1.default.array().optional(),
        parameterValues: joi_1.default.array().optional(),
    }))
        .optional(),
});
/**
 * Update recipe validation schema
 * (Similar to create but all fields optional except name)
 */
exports.updateRecipeSchema = joi_1.default.object({
    name: joi_1.default.string()
        .min(1)
        .max(255)
        .trim()
        .optional()
        .messages({
        'string.empty': 'Recipe name cannot be empty',
        'string.max': 'Recipe name must not exceed 255 characters',
    }),
    totalWeight: joi_1.default.number()
        .positive()
        .max(100000)
        .allow(null)
        .optional(),
    hydrationPct: joi_1.default.number()
        .min(0)
        .max(500)
        .allow(null)
        .optional(),
    saltPct: joi_1.default.number()
        .min(0)
        .max(10)
        .allow(null)
        .optional(),
    notes: joi_1.default.string()
        .max(5000)
        .allow('', null)
        .optional(),
    steps: joi_1.default.array().optional(),
});
/**
 * Recipe ID parameter validation
 */
exports.recipeIdParamSchema = joi_1.default.object({
    id: joi_1.default.number()
        .integer()
        .positive()
        .required()
        .messages({
        'number.base': 'Recipe ID must be a number',
        'number.integer': 'Recipe ID must be an integer',
        'number.positive': 'Recipe ID must be positive',
        'any.required': 'Recipe ID is required',
    }),
});
/**
 * Bake ID parameter validation
 */
exports.bakeIdParamSchema = joi_1.default.object({
    bakeId: joi_1.default.number()
        .integer()
        .positive()
        .required()
        .messages({
        'number.base': 'Bake ID must be a number',
        'number.integer': 'Bake ID must be an integer',
        'number.positive': 'Bake ID must be positive',
        'any.required': 'Bake ID is required',
    }),
});
/**
 * Update bake notes validation
 */
exports.updateBakeNotesSchema = joi_1.default.object({
    notes: joi_1.default.string()
        .max(10000)
        .allow('', null)
        .required()
        .messages({
        'string.max': 'Notes must not exceed 10,000 characters',
    }),
});
/**
 * Update bake rating validation
 */
exports.updateBakeRatingSchema = joi_1.default.object({
    rating: joi_1.default.number()
        .integer()
        .min(1)
        .max(5)
        .required()
        .messages({
        'number.min': 'Rating must be between 1 and 5',
        'number.max': 'Rating must be between 1 and 5',
        'any.required': 'Rating is required',
    }),
});
//# sourceMappingURL=recipeSchemas.js.map