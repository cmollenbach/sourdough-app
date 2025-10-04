/**
 * Metadata Routes Tests
 * 
 * Tests all GET endpoints in routes/meta.ts:
 * - GET /api/meta/step-templates (with fields and ingredient rules)
 * - GET /api/meta/ingredients
 * - GET /api/meta/ingredient-categories
 * - GET /api/meta/fields (StepParameters)
 * 
 * These routes provide metadata for frontend dropdowns and forms.
 * All routes are read-only GET requests.
 */

import request from 'supertest';
import express from 'express';
import metaRouter from '../../src/routes/meta';
import prisma from '../../src/lib/prisma';
import { errorHandler } from '../../src/middleware/errorHandler';

// Create test Express app
const app = express();
app.use(express.json());
app.use('/api/meta', metaRouter);
app.use(errorHandler);

describe('Metadata Routes', () => {
  describe('GET /api/meta/step-templates', () => {
    describe('Basic Functionality', () => {
      it('should return all step templates with transformed fields', async () => {
        const response = await request(app)
          .get('/api/meta/step-templates');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('templates');
        expect(Array.isArray(response.body.templates)).toBe(true);
      });

      it('should return templates with correct structure', async () => {
        const response = await request(app)
          .get('/api/meta/step-templates');

        expect(response.status).toBe(200);
        
        if (response.body.templates.length > 0) {
          const template = response.body.templates[0];
          
          // Basic template fields
          expect(template).toHaveProperty('id');
          expect(template).toHaveProperty('name');
          expect(template).toHaveProperty('description');
          expect(template).toHaveProperty('role');
          expect(template).toHaveProperty('order');
          expect(template).toHaveProperty('advanced');
          
          // Transformed fields array
          expect(template).toHaveProperty('fields');
          expect(Array.isArray(template.fields)).toBe(true);
          
          // Ingredient rules array
          expect(template).toHaveProperty('ingredientRules');
          expect(Array.isArray(template.ingredientRules)).toBe(true);
        }
      });

      it('should transform parameters to fields with correct structure', async () => {
        const response = await request(app)
          .get('/api/meta/step-templates');

        expect(response.status).toBe(200);
        
        // Find a template with fields
        const templateWithFields = response.body.templates.find(
          (t: any) => t.fields && t.fields.length > 0
        );

        if (templateWithFields) {
          const field = templateWithFields.fields[0];
          
          // Check field structure
          expect(field).toHaveProperty('id');
          expect(field).toHaveProperty('fieldId');
          expect(field).toHaveProperty('stepTemplateId');
          expect(field).toHaveProperty('order');
          expect(field).toHaveProperty('advanced');
          expect(field).toHaveProperty('visible');
          expect(field).toHaveProperty('field'); // Nested parameter object
          
          // Check nested field (parameter) object
          expect(field.field).toHaveProperty('id');
          expect(field.field).toHaveProperty('name');
          expect(field.field).toHaveProperty('type');
        }
      });

      it('should include ingredient rules with category information', async () => {
        const response = await request(app)
          .get('/api/meta/step-templates');

        expect(response.status).toBe(200);
        
        // Find a template with ingredient rules
        const templateWithRules = response.body.templates.find(
          (t: any) => t.ingredientRules && t.ingredientRules.length > 0
        );

        if (templateWithRules) {
          const rule = templateWithRules.ingredientRules[0];
          
          expect(rule).toHaveProperty('id');
          expect(rule).toHaveProperty('stepTemplateId');
          expect(rule).toHaveProperty('ingredientCategoryId');
          expect(rule).toHaveProperty('required');
          expect(rule).toHaveProperty('ingredientCategory');
          
          // Check nested category object
          expect(rule.ingredientCategory).toHaveProperty('id');
          expect(rule.ingredientCategory).toHaveProperty('name');
        }
      });

      it('should order templates by order field ascending', async () => {
        const response = await request(app)
          .get('/api/meta/step-templates');

        expect(response.status).toBe(200);
        
        const templates = response.body.templates;
        if (templates.length > 1) {
          // Check that templates are ordered (handle null values)
          for (let i = 0; i < templates.length - 1; i++) {
            const currentOrder = templates[i].order ?? Number.MAX_SAFE_INTEGER;
            const nextOrder = templates[i + 1].order ?? Number.MAX_SAFE_INTEGER;
            expect(currentOrder).toBeLessThanOrEqual(nextOrder);
          }
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle database with templates', async () => {
        const response = await request(app)
          .get('/api/meta/step-templates');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.templates)).toBe(true);
        
        // Verify it returns data (database should have templates from seed)
        expect(response.body.templates.length).toBeGreaterThan(0);
      });

      it('should handle templates without fields gracefully', async () => {
        const response = await request(app)
          .get('/api/meta/step-templates');

        expect(response.status).toBe(200);
        
        // Check that all templates have fields array (even if empty)
        response.body.templates.forEach((template: any) => {
          expect(Array.isArray(template.fields)).toBe(true);
        });
      });

      it('should handle templates without ingredient rules gracefully', async () => {
        const response = await request(app)
          .get('/api/meta/step-templates');

        expect(response.status).toBe(200);
        
        // Check that all templates have ingredientRules array (even if empty)
        response.body.templates.forEach((template: any) => {
          expect(Array.isArray(template.ingredientRules)).toBe(true);
        });
      });
    });

    describe('Data Integrity', () => {
      it('should include stepTypeId for all templates', async () => {
        const response = await request(app)
          .get('/api/meta/step-templates');

        expect(response.status).toBe(200);
        
        response.body.templates.forEach((template: any) => {
          expect(template).toHaveProperty('stepTypeId');
          expect(typeof template.stepTypeId).toBe('number');
        });
      });

      it('should have valid role values', async () => {
        const response = await request(app)
          .get('/api/meta/step-templates');

        expect(response.status).toBe(200);
        
        // Check that all templates have a role field (non-empty string)
        response.body.templates.forEach((template: any) => {
          expect(template).toHaveProperty('role');
          expect(typeof template.role).toBe('string');
          expect(template.role.length).toBeGreaterThan(0);
        });
      });

      it('should have boolean advanced field', async () => {
        const response = await request(app)
          .get('/api/meta/step-templates');

        expect(response.status).toBe(200);
        
        response.body.templates.forEach((template: any) => {
          expect(typeof template.advanced).toBe('boolean');
        });
      });
    });
  });

  describe('GET /api/meta/ingredients', () => {
    describe('Basic Functionality', () => {
      it('should return all ingredients', async () => {
        const response = await request(app)
          .get('/api/meta/ingredients');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('ingredients');
        expect(Array.isArray(response.body.ingredients)).toBe(true);
      });

      it('should return ingredients with correct structure', async () => {
        const response = await request(app)
          .get('/api/meta/ingredients');

        expect(response.status).toBe(200);
        
        if (response.body.ingredients.length > 0) {
          const ingredient = response.body.ingredients[0];
          
          expect(ingredient).toHaveProperty('id');
          expect(ingredient).toHaveProperty('name');
          expect(ingredient).toHaveProperty('ingredientCategoryId');
          expect(typeof ingredient.name).toBe('string');
          expect(typeof ingredient.ingredientCategoryId).toBe('number');
        }
      });

      it('should order ingredients by name ascending', async () => {
        const response = await request(app)
          .get('/api/meta/ingredients');

        expect(response.status).toBe(200);
        
        const ingredients = response.body.ingredients;
        if (ingredients.length > 1) {
          // Check alphabetical ordering using localeCompare
          for (let i = 0; i < ingredients.length - 1; i++) {
            const comparison = ingredients[i].name.toLowerCase()
              .localeCompare(ingredients[i + 1].name.toLowerCase());
            expect(comparison).toBeLessThanOrEqual(0);
          }
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle database with ingredients', async () => {
        const response = await request(app)
          .get('/api/meta/ingredients');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.ingredients)).toBe(true);
        
        // Verify it returns data (database should have ingredients from seed)
        expect(response.body.ingredients.length).toBeGreaterThan(0);
      });

      it('should handle ingredients with special characters in names', async () => {
        const response = await request(app)
          .get('/api/meta/ingredients');

        expect(response.status).toBe(200);
        
        // Just verify response is valid - actual data depends on seed
        expect(Array.isArray(response.body.ingredients)).toBe(true);
      });
    });

    describe('Data Integrity', () => {
      it('should have valid categoryId for all ingredients', async () => {
        const response = await request(app)
          .get('/api/meta/ingredients');

        expect(response.status).toBe(200);
        
        response.body.ingredients.forEach((ingredient: any) => {
          expect(ingredient).toHaveProperty('ingredientCategoryId');
          expect(typeof ingredient.ingredientCategoryId).toBe('number');
          expect(ingredient.ingredientCategoryId).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('GET /api/meta/ingredient-categories', () => {
    describe('Basic Functionality', () => {
      it('should return all ingredient categories', async () => {
        const response = await request(app)
          .get('/api/meta/ingredient-categories');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('categories');
        expect(Array.isArray(response.body.categories)).toBe(true);
      });

      it('should return categories with correct structure', async () => {
        const response = await request(app)
          .get('/api/meta/ingredient-categories');

        expect(response.status).toBe(200);
        
        if (response.body.categories.length > 0) {
          const category = response.body.categories[0];
          
          expect(category).toHaveProperty('id');
          expect(category).toHaveProperty('name');
          expect(typeof category.name).toBe('string');
        }
      });

      it('should order categories by name ascending', async () => {
        const response = await request(app)
          .get('/api/meta/ingredient-categories');

        expect(response.status).toBe(200);
        
        const categories = response.body.categories;
        if (categories.length > 1) {
          // Check alphabetical ordering using localeCompare
          for (let i = 0; i < categories.length - 1; i++) {
            const comparison = categories[i].name.toLowerCase()
              .localeCompare(categories[i + 1].name.toLowerCase());
            expect(comparison).toBeLessThanOrEqual(0);
          }
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle database with categories', async () => {
        const response = await request(app)
          .get('/api/meta/ingredient-categories');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.categories)).toBe(true);
        
        // Verify it returns data (database should have categories from seed)
        expect(response.body.categories.length).toBeGreaterThan(0);
      });
    });

    describe('Data Integrity', () => {
      it('should have non-empty names for all categories', async () => {
        const response = await request(app)
          .get('/api/meta/ingredient-categories');

        expect(response.status).toBe(200);
        
        response.body.categories.forEach((category: any) => {
          expect(category.name).toBeTruthy();
          expect(category.name.trim().length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('GET /api/meta/fields', () => {
    describe('Basic Functionality', () => {
      it('should return all step parameters (fields)', async () => {
        const response = await request(app)
          .get('/api/meta/fields');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('fields');
        expect(Array.isArray(response.body.fields)).toBe(true);
      });

      it('should return fields with correct structure', async () => {
        const response = await request(app)
          .get('/api/meta/fields');

        expect(response.status).toBe(200);
        
        if (response.body.fields.length > 0) {
          const field = response.body.fields[0];
          
          expect(field).toHaveProperty('id');
          expect(field).toHaveProperty('name');
          expect(field).toHaveProperty('type');
          
          expect(typeof field.name).toBe('string');
          expect(typeof field.type).toBe('string');
        }
      });

      it('should order fields by name ascending', async () => {
        const response = await request(app)
          .get('/api/meta/fields');

        expect(response.status).toBe(200);
        
        const fields = response.body.fields;
        if (fields.length > 1) {
          // Check alphabetical ordering using localeCompare
          for (let i = 0; i < fields.length - 1; i++) {
            const comparison = fields[i].name.toLowerCase()
              .localeCompare(fields[i + 1].name.toLowerCase());
            expect(comparison).toBeLessThanOrEqual(0);
          }
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle database with fields', async () => {
        const response = await request(app)
          .get('/api/meta/fields');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.fields)).toBe(true);
        
        // Verify it returns data (database should have fields from seed)
        expect(response.body.fields.length).toBeGreaterThan(0);
      });
    });

    describe('Data Integrity', () => {
      it('should have valid field types', async () => {
        const response = await request(app)
          .get('/api/meta/fields');

        expect(response.status).toBe(200);
        
        const validTypes = ['NUMBER', 'TEXT', 'TIME', 'TEMPERATURE', 'PERCENTAGE', 
                           'BOOLEAN', 'SELECT', 'MULTISELECT', 'STRING'];
        
        response.body.fields.forEach((field: any) => {
          if (field.type) {
            expect(validTypes).toContain(field.type);
          }
        });
      });

      it('should have non-empty names for all fields', async () => {
        const response = await request(app)
          .get('/api/meta/fields');

        expect(response.status).toBe(200);
        
        response.body.fields.forEach((field: any) => {
          expect(field.name).toBeTruthy();
          expect(field.name.trim().length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Cross-Endpoint Consistency', () => {
    it('should have consistent category IDs between ingredients and categories', async () => {
      const [ingredientsRes, categoriesRes] = await Promise.all([
        request(app).get('/api/meta/ingredients'),
        request(app).get('/api/meta/ingredient-categories'),
      ]);

      const categoryIds = categoriesRes.body.categories.map((c: any) => c.id);
      
      ingredientsRes.body.ingredients.forEach((ingredient: any) => {
        expect(categoryIds).toContain(ingredient.ingredientCategoryId);
      });
    });

    it('should have consistent field IDs between templates and fields', async () => {
      const [templatesRes, fieldsRes] = await Promise.all([
        request(app).get('/api/meta/step-templates'),
        request(app).get('/api/meta/fields'),
      ]);

      const fieldIds = fieldsRes.body.fields.map((f: any) => f.id);
      
      templatesRes.body.templates.forEach((template: any) => {
        template.fields.forEach((field: any) => {
          expect(fieldIds).toContain(field.fieldId);
        });
      });
    });
  });

  describe('Performance', () => {
    it('should return all metadata endpoints within reasonable time', async () => {
      const startTime = Date.now();
      
      await Promise.all([
        request(app).get('/api/meta/step-templates'),
        request(app).get('/api/meta/ingredients'),
        request(app).get('/api/meta/ingredient-categories'),
        request(app).get('/api/meta/fields'),
      ]);
      
      const duration = Date.now() - startTime;
      
      // All 4 endpoints should complete within 2 seconds (in parallel)
      expect(duration).toBeLessThan(2000);
    });
  });
});
