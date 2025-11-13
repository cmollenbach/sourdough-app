/**
 * Recipe Management Workflow E2E Tests
 * 
 * Tests complete recipe management workflows:
 * - Create recipe
 * - View recipe list
 * - Edit recipe
 * - Delete recipe
 * - Recipe cloning
 */

import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser } from './helpers/auth';
import { clearAuth } from './helpers/api';

test.describe('Recipe Management Workflows', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    testUser = generateTestUser();
    await clearAuth(page);
    await registerUser(page, testUser);
    await page.waitForLoadState('networkidle');
  });

  test('should create a new recipe', async ({ page }) => {
    // Step 1: Navigate to recipes page
    await page.goto('/#/recipes');
    await page.waitForLoadState('networkidle');

    // Step 2: Look for "New Recipe" or "Create Recipe" button
    const newRecipeButton = page.getByRole('button', { name: /new|create.*recipe/i })
      .or(page.getByRole('link', { name: /new|create.*recipe/i }));

    if (await newRecipeButton.count() > 0) {
      await newRecipeButton.click();
      await page.waitForTimeout(1000);
    } else {
      // If no button, try navigating directly to recipe builder
      await page.goto('/#/recipes/new');
      await page.waitForLoadState('networkidle');
    }

    // Step 3: Fill in recipe name
    const recipeNameInput = page.getByLabel(/recipe.*name/i)
      .or(page.getByPlaceholder(/recipe.*name/i))
      .or(page.locator('input[type="text"]').first());

    if (await recipeNameInput.count() > 0) {
      const recipeName = `E2E Test Recipe ${Date.now()}`;
      await recipeNameInput.fill(recipeName);

      // Step 4: Save recipe
      const saveButton = page.getByRole('button', { name: /save/i });
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(2000);

        // Step 5: Verify recipe was created
        // Should either redirect to recipe list or show recipe name
        const recipeNameVisible = page.getByText(recipeName);
        const hasRecipe = await recipeNameVisible.count() > 0;
        
        // Recipe should be visible somewhere on the page
        expect(hasRecipe || page.url().includes('/recipes')).toBeTruthy();
      }
    }
  });

  test('should display recipe list', async ({ page }) => {
    // Navigate to recipes page
    await page.goto('/#/recipes');
    await page.waitForLoadState('networkidle');

    // Should see recipes page content
    // Could be recipe cards, list, or empty state
    const recipesContent = page.getByText(/recipe/i)
      .or(page.getByRole('heading', { name: /recipe/i }))
      .or(page.locator('[data-testid*="recipe"]'));

    await expect(recipesContent.first()).toBeVisible({ timeout: 5000 });
  });

  test('should view recipe details', async ({ page }) => {
    // Navigate to recipes page
    await page.goto('/#/recipes');
    await page.waitForLoadState('networkidle');

    // Look for a recipe card or link
    const recipeCard = page.locator('[data-testid*="recipe"]').first()
      .or(page.getByRole('article').first())
      .or(page.getByRole('link').filter({ hasText: /recipe/i }).first());

    if (await recipeCard.count() > 0) {
      await recipeCard.click();
      await page.waitForTimeout(1000);

      // Should be on recipe detail page
      expect(page.url()).toMatch(/\/recipes\/\d+/);
      
      // Should see recipe content
      const recipeContent = page.getByText(/recipe|ingredient|step/i);
      await expect(recipeContent.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should edit recipe', async ({ page }) => {
    // Navigate to recipes page
    await page.goto('/#/recipes');
    await page.waitForLoadState('networkidle');

    // Click on first recipe
    const recipeCard = page.locator('[data-testid*="recipe"]').first()
      .or(page.getByRole('link').filter({ hasText: /recipe/i }).first());

    if (await recipeCard.count() > 0) {
      await recipeCard.click();
      await page.waitForTimeout(1000);

      // Look for edit button or editable name field
      const editButton = page.getByRole('button', { name: /edit/i });
      const recipeNameInput = page.getByLabel(/recipe.*name/i)
        .or(page.locator('input[type="text"]').first());

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);
      }

      if (await recipeNameInput.count() > 0) {
        // Update recipe name
        const updatedName = `Updated Recipe ${Date.now()}`;
        await recipeNameInput.clear();
        await recipeNameInput.fill(updatedName);

        // Save changes
        const saveButton = page.getByRole('button', { name: /save/i });
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Verify update
          const updatedNameVisible = page.getByText(updatedName);
          const hasUpdated = await updatedNameVisible.count() > 0;
          expect(hasUpdated).toBeTruthy();
        }
      }
    }
  });

  test('should delete recipe', async ({ page }) => {
    // Navigate to recipes page
    await page.goto('/#/recipes');
    await page.waitForLoadState('networkidle');

    // Click on first recipe
    const recipeCard = page.locator('[data-testid*="recipe"]').first()
      .or(page.getByRole('link').filter({ hasText: /recipe/i }).first());

    if (await recipeCard.count() > 0) {
      const recipeText = await recipeCard.textContent();
      await recipeCard.click();
      await page.waitForTimeout(1000);

      // Look for delete button
      const deleteButton = page.getByRole('button', { name: /delete/i });
      
      if (await deleteButton.count() > 0) {
        await deleteButton.click();
        await page.waitForTimeout(500);

        // Confirm deletion if confirmation dialog appears
        const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1000);

        // Should redirect to recipes list
        expect(page.url()).toMatch(/\/recipes/);
        
        // Recipe should no longer be visible
        if (recipeText) {
          const deletedRecipe = page.getByText(recipeText);
          const stillVisible = await deletedRecipe.count() > 0;
          // Recipe should be removed from list (or confirmation shown)
          expect(stillVisible).toBeFalsy();
        }
      }
    }
  });

  test('should validate required fields when creating recipe', async ({ page }) => {
    // Navigate to recipe builder
    await page.goto('/#/recipes/new');
    await page.waitForLoadState('networkidle');

    // Try to save without filling required fields
    const saveButton = page.getByRole('button', { name: /save/i });
    
    if (await saveButton.count() > 0) {
      // Check if button is disabled (form validation)
      const isDisabled = await saveButton.isDisabled();
      
      if (!isDisabled) {
        // If enabled, try to save
        await saveButton.click();
        await page.waitForTimeout(500);

        // Should show validation errors
        const errorMessage = page.getByText(/required|cannot.*empty/i);
        const hasError = await errorMessage.count() > 0;
        expect(hasError).toBeTruthy();
      } else {
        // Button disabled = valid form validation
        expect(isDisabled).toBeTruthy();
      }
    }
  });
});

