/**
 * Recipe Validation Schemas
 * 
 * Joi schemas for validating recipe-related requests
 */

import Joi from 'joi';

/**
 * Create recipe validation schema
 */
export const createRecipeSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .trim()
    .required()
    .messages({
      'string.empty': 'Recipe name is required',
      'string.max': 'Recipe name must not exceed 255 characters',
      'any.required': 'Recipe name is required',
    }),
  
  totalWeight: Joi.number()
    .positive()
    .max(100000) // 100kg max
    .allow(null)
    .optional()
    .messages({
      'number.positive': 'Total weight must be a positive number',
      'number.max': 'Total weight must not exceed 100,000 grams',
    }),
  
  hydrationPct: Joi.number()
    .min(0)
    .max(500) // Some recipes can be very hydrated
    .allow(null)
    .optional()
    .messages({
      'number.min': 'Hydration percentage cannot be negative',
      'number.max': 'Hydration percentage must not exceed 500%',
    }),
  
  saltPct: Joi.number()
    .min(0)
    .max(10) // Typically 1-3%, max 10% for safety
    .allow(null)
    .optional()
    .messages({
      'number.min': 'Salt percentage cannot be negative',
      'number.max': 'Salt percentage must not exceed 10%',
    }),
  
  notes: Joi.string()
    .max(5000)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Notes must not exceed 5,000 characters',
    }),
  
  steps: Joi.array()
    .items(Joi.object({
      stepTemplateId: Joi.number().integer().positive().required(),
      order: Joi.number().integer().min(0).required(),
      duration: Joi.number().min(0).allow(null).optional(),
      timing: Joi.string().max(500).allow('', null).optional(),
      ingredients: Joi.array().optional(),
      parameterValues: Joi.array().optional(),
    }))
    .optional(),
});

/**
 * Update recipe validation schema
 * (Similar to create but all fields optional except name)
 */
export const updateRecipeSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .trim()
    .optional()
    .messages({
      'string.empty': 'Recipe name cannot be empty',
      'string.max': 'Recipe name must not exceed 255 characters',
    }),
  
  totalWeight: Joi.number()
    .positive()
    .max(100000)
    .allow(null)
    .optional(),
  
  hydrationPct: Joi.number()
    .min(0)
    .max(500)
    .allow(null)
    .optional(),
  
  saltPct: Joi.number()
    .min(0)
    .max(10)
    .allow(null)
    .optional(),
  
  notes: Joi.string()
    .max(5000)
    .allow('', null)
    .optional(),
  
  steps: Joi.array().optional(),
});

/**
 * Recipe ID parameter validation
 */
export const recipeIdParamSchema = Joi.object({
  id: Joi.number()
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
export const bakeIdParamSchema = Joi.object({
  bakeId: Joi.number()
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
export const updateBakeNotesSchema = Joi.object({
  notes: Joi.string()
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
export const updateBakeRatingSchema = Joi.object({
  rating: Joi.number()
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
