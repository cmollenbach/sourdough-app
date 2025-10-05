// tests/routes/recipes-integration.test.ts
import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import express from 'express';

/**
 * REAL INTEGRATION TESTS FOR RECIPE API
 * 
 * This demonstrates actual HTTP testing with supertest, converting
 * the patterns from our comprehensive test examples into real API tests.
 */

// Mock the Express app (you'll replace this with your actual app)
const createMockApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock recipes route - replace with your actual routes
  app.post('/api/recipes', (req, res) => {
    const { name, totalWeight, hydrationPct, saltPct, notes } = req.body;
    
    // Basic validation
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Mock successful response
    const mockRecipe = {
      id: 1,
      name,
      totalWeight: totalWeight || null,
      hydrationPct: hydrationPct || null,
      saltPct: saltPct || null,
      notes: notes || null,
      ownerId: 1,
      isPredefined: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    res.status(201).json(mockRecipe);
  });
  
  app.get('/api/recipes', (req, res) => {
    // Mock recipe list response
    const mockRecipes = [
      {
        id: 1,
        name: 'Sourdough Bread',
        totalWeight: 1000,
        ownerId: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Whole Wheat Sourdough',
        totalWeight: 800,
        ownerId: 1,
        createdAt: new Date().toISOString(),
      },
    ];
    
    res.status(200).json(mockRecipes);
  });
  
  app.get('/api/recipes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid recipe ID' });
    }
    
    if (id === 999) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    const mockRecipe = {
      id,
      name: 'Sourdough Bread',
      totalWeight: 1000,
      hydrationPct: 75,
      saltPct: 2,
      notes: 'My favorite recipe',
      ownerId: 1,
      isPredefined: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    res.status(200).json(mockRecipe);
  });
  
  return app;
};

describe('Recipe API - Real Integration Tests', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = createMockApp();
  });
  
  // === CONVERT PATTERN TESTS TO REAL HTTP TESTS ===
  describe('Recipe Creation - Real HTTP Tests', () => {
    it('should successfully create a recipe with complete data', async () => {
      const recipeData = {
        name: 'Sourdough Bread',
        totalWeight: 1000,
        hydrationPct: 75,
        saltPct: 2,
        notes: 'My favorite recipe',
      };
      
      const response = await request(app)
        .post('/api/recipes')
        .send(recipeData)
        .expect(201);
      
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: 'Sourdough Bread',
        totalWeight: 1000,
        hydrationPct: 75,
        saltPct: 2,
        notes: 'My favorite recipe',
        ownerId: expect.any(Number),
        isPredefined: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
    
    it('should create recipe with minimal data', async () => {
      const minimalData = {
        name: 'Minimal Recipe',
      };
      
      const response = await request(app)
        .post('/api/recipes')
        .send(minimalData)
        .expect(201);
      
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: 'Minimal Recipe',
        totalWeight: null,
        hydrationPct: null,
        saltPct: null,
        notes: null,
      });
    });
    
    it('should handle special characters in recipe name', async () => {
      const specialCharsData = {
        name: 'Recipe w/ Special-Characters & Símböls! 🍞',
        notes: 'Notes with émojis 🍞 and special chars: @#$%^&*()',
      };
      
      const response = await request(app)
        .post('/api/recipes')
        .send(specialCharsData)
        .expect(201);
      
      expect(response.body.name).toBe('Recipe w/ Special-Characters & Símböls! 🍞');
      expect(response.body.notes).toContain('🍞');
      expect(response.body.notes).toMatch(/[@#$%^&*()]/);
    });
  });
  
  describe('Recipe Retrieval - Real HTTP Tests', () => {
    it('should get all recipes', async () => {
      const response = await request(app)
        .get('/api/recipes')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        ownerId: expect.any(Number),
      });
    });
    
    it('should get a specific recipe by ID', async () => {
      const response = await request(app)
        .get('/api/recipes/1')
        .expect(200);
      
      expect(response.body).toMatchObject({
        id: 1,
        name: 'Sourdough Bread',
        totalWeight: 1000,
        hydrationPct: 75,
        saltPct: 2,
      });
    });
    
    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .get('/api/recipes/999')
        .expect(404);
      
      expect(response.body).toEqual({
        error: 'Recipe not found',
      });
    });
    
    it('should return 400 for invalid recipe ID', async () => {
      const response = await request(app)
        .get('/api/recipes/invalid-id')
        .expect(400);
      
      expect(response.body).toEqual({
        error: 'Invalid recipe ID',
      });
    });
  });
  
  describe('Validation - Real HTTP Error Tests', () => {
    it('should return 400 when name is missing', async () => {
      const invalidData = {
        totalWeight: 1000,
        // name is missing
      };
      
      const response = await request(app)
        .post('/api/recipes')
        .send(invalidData)
        .expect(400);
      
      expect(response.body).toEqual({
        error: 'Name is required',
      });
    });
    
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send('{ invalid json }')
        .set('Content-Type', 'application/json')
        .expect(400);
      
      // Express handles malformed JSON automatically
      expect(response.body).toBeDefined();
    });
    
    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({})
        .expect(400);
      
      expect(response.body).toEqual({
        error: 'Name is required',
      });
    });
  });
  
  describe('Content-Type and Headers', () => {
    it('should handle JSON content type correctly', async () => {
      const recipeData = {
        name: 'JSON Test Recipe',
      };
      
      const response = await request(app)
        .post('/api/recipes')
        .set('Content-Type', 'application/json')
        .send(recipeData)
        .expect(201);
      
      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body.name).toBe('JSON Test Recipe');
    });
    
    it('should handle large payloads', async () => {
      const largeRecipeData = {
        name: 'Large Recipe',
        notes: 'A'.repeat(10000), // 10KB of text
      };
      
      const response = await request(app)
        .post('/api/recipes')
        .send(largeRecipeData)
        .expect(201);
      
      expect(response.body.notes).toHaveLength(10000);
    });
  });
});
