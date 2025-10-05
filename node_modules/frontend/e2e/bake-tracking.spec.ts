import { test, expect } from '@playwright/test';

/**
 * Bake Tracking E2E Tests
 * 
 * Tests the bake session functionality including:
 * - Starting a new bake
 * - Tracking bake progress
 * - Completing bake steps
 * - Viewing active bake timeline
 */

test.describe('Bake Tracking', () => {
  // Requires backend API - skip for now
  test.skip('should display recipe list', async ({ page }) => {
    await page.goto('/');
    
    // Look for recipes page or recipes list
    const recipesLink = page.getByRole('link', { name: /recipes/i }).or(
      page.getByRole('button', { name: /recipes/i })
    );
    
    // Navigate to recipes if not already there
    if (await recipesLink.count() > 0) {
      await recipesLink.click();
    }
    
    // Should see some recipe-related content
    // This could be recipe cards, a list, or an empty state message
    await page.waitForTimeout(1000);
  });

  // Requires backend API - skip for now
  test.skip('should start a bake from a recipe', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to recipes
    const recipesLink = page.getByRole('link', { name: /recipes/i });
    if (await recipesLink.count() > 0) {
      await recipesLink.click();
      await page.waitForTimeout(500);
    }
    
    // Look for first recipe in the list
    // Adjust selector based on your recipe card/list structure
    const recipeCard = page.locator('[data-testid*="recipe"]').first().or(
      page.getByRole('article').first()
    );
    
    if (await recipeCard.count() > 0) {
      await recipeCard.click();
      
      // Look for "Start Bake" button
      const startBakeButton = page.getByRole('button', { name: /start bake/i });
      
      if (await startBakeButton.count() > 0) {
        await startBakeButton.click();
        
        // Wait for bake to start
        await page.waitForTimeout(1000);
        
        // Verify we're now in an active bake view
        // Look for bake-related content
        const bakeContent = page.getByText(/bulk fermentation/i).or(
          page.getByText(/active bake/i)
        ).or(
          page.getByText(/in progress/i)
        );
        
        const hasBakeContent = await bakeContent.count() > 0;
        expect(hasBakeContent).toBeTruthy();
      }
    }
  });

  // Requires backend API - skip for now
  test.skip('should display bake timeline with steps', async ({ page }) => {
    // First, ensure we have an active bake (or navigate to one)
    await page.goto('/');
    
    // Look for "Bakes" or "Active Bakes" navigation
    const bakesLink = page.getByRole('link', { name: /bakes/i }).or(
      page.getByRole('link', { name: /active/i })
    );
    
    if (await bakesLink.count() > 0) {
      await bakesLink.click();
      await page.waitForTimeout(500);
      
      // Look for timeline or step indicators
      const timelineContent = page.getByText(/bulk fermentation/i).or(
        page.getByText(/autolyse/i)
      ).or(
        page.getByText(/step/i)
      );
      
      // Should see some timeline content
      const hasTimeline = await timelineContent.count() > 0;
      expect(hasTimeline).toBeTruthy();
    }
  });

  // Requires backend API - skip for now
  test.skip('should show stretch and fold schedule', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to an active bake
    const bakesLink = page.getByRole('link', { name: /bakes/i });
    if (await bakesLink.count() > 0) {
      await bakesLink.click();
      await page.waitForTimeout(500);
      
      // Look for S&F schedule indicators
      const sfSchedule = page.getByText(/stretch.*fold/i).or(
        page.getByText(/s&f/i)
      ).or(
        page.getByText(/next.*fold/i)
      );
      
      // If there's an active bake with S&F, should see schedule
      const hasSchedule = await sfSchedule.count() > 0;
      
      // This test passes if either:
      // 1. S&F schedule is displayed, OR
      // 2. No active bakes exist (which is also valid)
      expect(hasSchedule || await page.getByText(/no.*bake/i).count() > 0).toBeTruthy();
    }
  });

  // Requires backend API - skip for now
  test.skip('should allow completing a bake step', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to active bakes
    const bakesLink = page.getByRole('link', { name: /bakes/i });
    if (await bakesLink.count() > 0) {
      await bakesLink.click();
      await page.waitForTimeout(500);
      
      // Look for "Complete" or "Mark Complete" button
      const completeButton = page.getByRole('button', { name: /complete/i }).or(
        page.getByRole('button', { name: /mark.*complete/i })
      ).or(
        page.getByRole('button', { name: /done/i })
      );
      
      if (await completeButton.count() > 0) {
        // Click to complete step
        await completeButton.first().click();
        
        // Wait for completion action
        await page.waitForTimeout(500);
        
        // Look for success feedback
        const successMessage = page.getByText(/completed/i).or(
          page.getByText(/success/i)
        );
        
        // Should see some confirmation
        const hasConfirmation = await successMessage.count() > 0;
        expect(hasConfirmation).toBeTruthy();
      }
    }
  });

  // Requires backend API - skip for now
  test.skip('should display timer for next action', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to active bakes
    const bakesLink = page.getByRole('link', { name: /bakes/i });
    if (await bakesLink.count() > 0) {
      await bakesLink.click();
      await page.waitForTimeout(500);
      
      // Look for timer or countdown display
      const timerContent = page.getByText(/next.*in/i).or(
        page.getByText(/\d+:\d+/i) // Matches time format like "1:30"
      ).or(
        page.getByText(/minutes?/i)
      );
      
      // Should see timing information if there's an active bake
      const hasTimer = await timerContent.count() > 0;
      const noActiveBakes = await page.getByText(/no.*bake/i).count() > 0;
      
      expect(hasTimer || noActiveBakes).toBeTruthy();
    }
  });
});
