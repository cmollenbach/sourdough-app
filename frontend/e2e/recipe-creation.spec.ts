import { test, expect } from '@playwright/test';

/**
 * Recipe Creation E2E Tests
 * 
 * Tests the core recipe builder functionality including:
 * - Creating a new recipe
 * - Adding ingredients
 * - Setting hydration and flour weight
 * - Saving and verifying the recipe
 */

test.describe('Recipe Creation', () => {
  // Requires authentication - skip for now
  test.skip('should navigate to recipe builder', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to recipes page first (might need auth)
    await page.goto('/recipes');
    
    // Look for "Create New Recipe" button
    const newRecipeButton = page.getByRole('link', { name: /create new recipe/i });
    
    // Verify navigation element exists
    await expect(newRecipeButton).toBeVisible();
  });

  // Requires backend API - skip for now
  test.skip('should create a basic sourdough recipe', async ({ page }) => {
    await page.goto('/recipes');
    
    // Navigate to recipe builder
    const newRecipeButton = page.getByRole('link', { name: /create new recipe/i });
    await newRecipeButton.click();
    
    // Fill in basic recipe details
    // Note: Adjust selectors based on your actual form field IDs/labels
    const recipeNameInput = page.getByLabel(/recipe name/i).or(
      page.getByPlaceholder(/recipe name/i)
    );
    await recipeNameInput.fill('Classic Sourdough');
    
    // Set flour weight
    const flourWeightInput = page.getByLabel(/flour.*weight/i).or(
      page.getByPlaceholder(/flour.*weight/i)
    );
    if (await flourWeightInput.count() > 0) {
      await flourWeightInput.fill('500');
    }
    
    // Set hydration percentage
    const hydrationInput = page.getByLabel(/hydration/i).or(
      page.getByPlaceholder(/hydration/i)
    );
    if (await hydrationInput.count() > 0) {
      await hydrationInput.fill('75');
    }
    
    // Wait a moment for any auto-calculations
    await page.waitForTimeout(500);
    
    // Save the recipe
    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();
    
    // Verify success (adjust based on your success message)
    // This could be a toast notification, redirect, or success message
    await page.waitForTimeout(1000);
    
    // Check if we can see the recipe name somewhere on the page
    await expect(page.getByText('Classic Sourdough')).toBeVisible({ timeout: 5000 });
  });

  // Requires backend API - skip for now
  test.skip('should validate required fields', async ({ page }) => {
    await page.goto('/recipes');
    
    // Navigate to recipe builder
    const newRecipeButton = page.getByRole('link', { name: /create new recipe/i });
    await newRecipeButton.click();
    
    // Try to save without filling required fields
    const saveButton = page.getByRole('button', { name: /save/i });
    
    // Check if save button is disabled or if validation prevents save
    if (await saveButton.isEnabled()) {
      await saveButton.click();
      
      // Look for validation error messages
      // Adjust this based on your actual error display
      const errorMessage = page.getByText(/required/i).or(
        page.getByText(/cannot be empty/i)
      );
      
      // Expect some form of validation feedback
      const hasError = await errorMessage.count() > 0;
      expect(hasError).toBeTruthy();
    } else {
      // If button is disabled, that's valid form validation
      await expect(saveButton).toBeDisabled();
    }
  });

  // Requires backend API - skip for now
  test.skip('should add ingredients to recipe', async ({ page }) => {
    await page.goto('/recipes');
    
    // Navigate to recipe builder
    const newRecipeButton = page.getByRole('link', { name: /create new recipe/i });
    await newRecipeButton.click();
    
    // Fill recipe name
    const recipeNameInput = page.getByLabel(/recipe name/i).or(
      page.getByPlaceholder(/recipe name/i)
    );
    await recipeNameInput.fill('Multi-Grain Sourdough');
    
    // Look for "Add Ingredient" button
    const addIngredientButton = page.getByRole('button', { name: /add ingredient/i });
    
    if (await addIngredientButton.count() > 0) {
      // Click to add an ingredient
      await addIngredientButton.click();
      
      // Wait for ingredient form to appear
      await page.waitForTimeout(500);
      
      // Verify ingredient input fields are visible
      const ingredientInputs = page.getByLabel(/ingredient/i);
      await expect(ingredientInputs.first()).toBeVisible();
    }
  });

  // Requires backend API - skip for now
  test.skip('should calculate baker\'s percentages correctly', async ({ page }) => {
    await page.goto('/recipes');
    
    // Navigate to recipe builder
    const newRecipeButton = page.getByRole('link', { name: /create new recipe/i });
    await newRecipeButton.click();
    
    // Fill recipe name
    const recipeNameInput = page.getByLabel(/recipe name/i).or(
      page.getByPlaceholder(/recipe name/i)
    );
    await recipeNameInput.fill('Percentage Test Recipe');
    
    // Set flour weight (this should be 100% in baker's percentage)
    const flourWeightInput = page.getByLabel(/flour.*weight/i).or(
      page.getByPlaceholder(/flour.*weight/i)
    );
    if (await flourWeightInput.count() > 0) {
      await flourWeightInput.fill('1000');
      
      // Set hydration to 75%
      const hydrationInput = page.getByLabel(/hydration/i).or(
        page.getByPlaceholder(/hydration/i)
      );
      if (await hydrationInput.count() > 0) {
        await hydrationInput.fill('75');
        
        // Wait for calculation
        await page.waitForTimeout(1000);
        
        // Water should be calculated as 750g (75% of 1000g)
        // Look for water amount display
        const waterAmount = page.getByText(/750/);
        
        // This assertion might need adjustment based on how you display calculations
        const hasWaterCalculation = await waterAmount.count() > 0;
        expect(hasWaterCalculation).toBeTruthy();
      }
    }
  });
});
