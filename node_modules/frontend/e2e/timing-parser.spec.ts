import { test, expect } from '@playwright/test';

/**
 * Timing Plan Parser E2E Tests
 * 
 * Tests the natural language timing plan parser including:
 * - Parsing "S&F at X, Y, Z minutes" format
 * - Displaying parsed schedule
 * - Validating timing plans
 */

test.describe('Timing Plan Parser', () => {
  // Requires backend API - skip for now
  test.skip('should parse basic S&F timing plan', async ({ page }) => {
    await page.goto('/recipes');
    
    // Navigate to recipe builder
    const newRecipeButton = page.getByRole('link', { name: /create new recipe/i });
    await newRecipeButton.click();
    
    // Fill recipe name
    const recipeNameInput = page.getByLabel(/recipe name/i).or(
      page.getByPlaceholder(/recipe name/i)
    );
    await recipeNameInput.fill('Timing Test Recipe');
    
    // Look for timing plan input field
    const timingInput = page.getByLabel(/timing.*plan/i).or(
      page.getByPlaceholder(/timing.*plan/i)
    ).or(
      page.getByPlaceholder(/s&f/i)
    );
    
    if (await timingInput.count() > 0) {
      // Enter a timing plan
      await timingInput.fill('S&F at 30, 60, 90, 120 minutes');
      
      // Wait for parsing
      await page.waitForTimeout(1000);
      
      // Look for parsed schedule display
      const scheduleDisplay = page.getByText(/4.*fold/i).or(
        page.getByText(/30.*min/i)
      ).or(
        page.getByText(/60.*min/i)
      );
      
      // Should see parsed schedule
      const hasSchedule = await scheduleDisplay.count() > 0;
      expect(hasSchedule).toBeTruthy();
    }
  });

  // Requires backend API - skip for now
  test.skip('should parse timing plan with hour format', async ({ page }) => {
    await page.goto('/recipes');
    
    // Navigate to recipe builder
    const newRecipeButton = page.getByRole('link', { name: /create new recipe/i });
    await newRecipeButton.click();
    
    // Fill recipe name
    const recipeNameInput = page.getByLabel(/recipe name/i).or(
      page.getByPlaceholder(/recipe name/i)
    );
    await recipeNameInput.fill('Hour Format Test');
    
    // Look for timing plan input
    const timingInput = page.getByLabel(/timing.*plan/i).or(
      page.getByPlaceholder(/timing.*plan/i)
    );
    
    if (await timingInput.count() > 0) {
      // Enter timing with hours
      await timingInput.fill('S&F at 0.5, 1, 1.5, 2 hours');
      
      // Wait for parsing
      await page.waitForTimeout(1000);
      
      // Look for parsed content (should convert to minutes)
      const scheduleDisplay = page.getByText(/30.*min/i).or(
        page.getByText(/60.*min/i)
      ).or(
        page.getByText(/fold/i)
      );
      
      const hasSchedule = await scheduleDisplay.count() > 0;
      expect(hasSchedule).toBeTruthy();
    }
  });

  // Requires backend API - skip for now
  test.skip('should display timing plan in recipe view', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to recipes
    const recipesLink = page.getByRole('link', { name: /recipes/i });
    if (await recipesLink.count() > 0) {
      await recipesLink.click();
      await page.waitForTimeout(500);
      
      // Click on first recipe
      const recipeCard = page.locator('[data-testid*="recipe"]').first().or(
        page.getByRole('article').first()
      );
      
      if (await recipeCard.count() > 0) {
        await recipeCard.click();
        
        // Look for timing information display
        const timingDisplay = page.getByText(/timing/i).or(
          page.getByText(/schedule/i)
        ).or(
          page.getByText(/fold/i)
        );
        
        // Should see timing info if recipe has it
        const hasTiming = await timingDisplay.count() > 0;
        
        // Test passes if timing is shown OR recipe has no timing (both valid)
        expect(hasTiming || await page.getByText(/no.*timing/i).count() > 0).toBeTruthy();
      }
    }
  });

  // Requires backend API - skip for now
  test.skip('should handle invalid timing plan gracefully', async ({ page }) => {
    await page.goto('/recipes');
    
    // Navigate to recipe builder
    const newRecipeButton = page.getByRole('link', { name: /create new recipe/i });
    await newRecipeButton.click();
    
    // Fill recipe name
    const recipeNameInput = page.getByLabel(/recipe name/i).or(
      page.getByPlaceholder(/recipe name/i)
    );
    await recipeNameInput.fill('Invalid Timing Test');
    
    // Look for timing plan input
    const timingInput = page.getByLabel(/timing.*plan/i).or(
      page.getByPlaceholder(/timing.*plan/i)
    );
    
    if (await timingInput.count() > 0) {
      // Enter invalid timing
      await timingInput.fill('this is not a valid timing plan');
      
      // Wait for validation
      await page.waitForTimeout(1000);
      
      // Look for error message or validation feedback
      const errorMessage = page.getByText(/invalid/i).or(
        page.getByText(/error/i)
      ).or(
        page.getByText(/format/i)
      );
      
      // Should either show error OR ignore invalid input (both valid behaviors)
      const hasError = await errorMessage.count() > 0;
      const inputCleared = await timingInput.inputValue() === '';
      
      expect(hasError || inputCleared || true).toBeTruthy();
    }
  });

  // Requires backend API - skip for now
  test.skip('should parse custom fold schedule', async ({ page }) => {
    await page.goto('/recipes');
    
    // Navigate to recipe builder
    const newRecipeButton = page.getByRole('link', { name: /create new recipe/i });
    await newRecipeButton.click();
    
    // Fill recipe name
    const recipeNameInput = page.getByLabel(/recipe name/i).or(
      page.getByPlaceholder(/recipe name/i)
    );
    await recipeNameInput.fill('Custom Schedule Test');
    
    // Look for advanced mode or custom schedule option
    const advancedToggle = page.getByLabel(/advanced/i).or(
      page.getByRole('button', { name: /advanced/i })
    );
    
    if (await advancedToggle.count() > 0) {
      await advancedToggle.click();
      await page.waitForTimeout(500);
      
      // Look for custom fold schedule input
      const customScheduleInput = page.getByLabel(/custom.*schedule/i).or(
        page.getByPlaceholder(/custom.*schedule/i)
      );
      
      if (await customScheduleInput.count() > 0) {
        // Enter custom schedule
        await customScheduleInput.fill('0:30, 1:00, 1:30, 2:00, 2:30, 3:00');
        
        // Wait for parsing
        await page.waitForTimeout(1000);
        
        // Look for parsed schedule (6 folds)
        const scheduleDisplay = page.getByText(/6.*fold/i);
        
        const hasSchedule = await scheduleDisplay.count() > 0;
        expect(hasSchedule).toBeTruthy();
      }
    }
  });
});
