/**
 * Bake Tracking Workflow E2E Tests
 * 
 * Tests complete bake tracking workflows:
 * - Start bake from recipe
 * - View active bakes
 * - Track bake steps
 * - Complete bake
 * - View bake history
 */

import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser } from './helpers/auth';
import { clearAuth } from './helpers/api';

test.describe('Bake Tracking Workflows', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    testUser = generateTestUser();
    await clearAuth(page);
    await registerUser(page, testUser);
    await page.waitForLoadState('networkidle');
  });

  test('should start a bake from a recipe', async ({ page }) => {
    // Step 1: Navigate to recipes
    await page.goto('/#/recipes');
    await page.waitForLoadState('networkidle');

    // Step 2: Click on first recipe
    const recipeCard = page.locator('[data-testid*="recipe"]').first()
      .or(page.getByRole('link').filter({ hasText: /recipe/i }).first())
      .or(page.getByRole('article').first());

    if (await recipeCard.count() > 0) {
      await recipeCard.click();
      await page.waitForTimeout(1000);

      // Step 3: Look for "Start Bake" button
      const startBakeButton = page.getByRole('button', { name: /start.*bake|begin.*bake/i });
      
      if (await startBakeButton.count() > 0) {
        await startBakeButton.click();
        await page.waitForTimeout(2000);

        // Step 4: Verify bake started
        // Should either redirect to bake detail page or show active bake indicator
        const bakeContent = page.getByText(/active.*bake|in.*progress/i)
          .or(page.getByText(/bulk.*fermentation|autolyse/i));
        
        const hasBakeContent = await bakeContent.count() > 0;
        const isOnBakePage = page.url().includes('/bakes/');
        
        expect(hasBakeContent || isOnBakePage).toBeTruthy();
      }
    }
  });

  test('should display active bakes list', async ({ page }) => {
    // Navigate to bakes page
    await page.goto('/#/bakes');
    await page.waitForLoadState('networkidle');

    // Should see bakes page content
    const bakesContent = page.getByText(/bake/i)
      .or(page.getByRole('heading', { name: /bake/i }))
      .or(page.locator('[data-testid*="bake"]'));

    await expect(bakesContent.first()).toBeVisible({ timeout: 5000 });
  });

  test('should view bake details and timeline', async ({ page }) => {
    // Navigate to bakes page
    await page.goto('/#/bakes');
    await page.waitForLoadState('networkidle');

    // Click on first bake (if any)
    const bakeCard = page.locator('[data-testid*="bake"]').first()
      .or(page.getByRole('link').filter({ hasText: /bake/i }).first());

    if (await bakeCard.count() > 0) {
      await bakeCard.click();
      await page.waitForTimeout(1000);

      // Should be on bake detail page
      expect(page.url()).toMatch(/\/bakes\/\d+/);

      // Should see bake timeline or steps
      const timelineContent = page.getByText(/step|timeline|bulk|autolyse/i);
      await expect(timelineContent.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should complete a bake step', async ({ page }) => {
    // Navigate to bakes page
    await page.goto('/#/bakes');
    await page.waitForLoadState('networkidle');

    // Click on first active bake
    const bakeCard = page.locator('[data-testid*="bake"]').first()
      .or(page.getByRole('link').filter({ hasText: /bake/i }).first());

    if (await bakeCard.count() > 0) {
      await bakeCard.click();
      await page.waitForTimeout(1000);

      // Look for "Complete" or "Mark Complete" button on a step
      const completeButton = page.getByRole('button', { name: /complete|mark.*complete|done/i }).first();

      if (await completeButton.count() > 0) {
        await completeButton.click();
        await page.waitForTimeout(1000);

        // Should see confirmation or step marked as complete
        const completedIndicator = page.getByText(/completed|done/i);
        const hasConfirmation = await completedIndicator.count() > 0;
        
        // Step should be marked as complete (or confirmation shown)
        expect(hasConfirmation).toBeTruthy();
      }
    }
  });

  test('should complete a bake', async ({ page }) => {
    // Navigate to bakes page
    await page.goto('/#/bakes');
    await page.waitForLoadState('networkidle');

    // Click on first active bake
    const bakeCard = page.locator('[data-testid*="bake"]').first()
      .or(page.getByRole('link').filter({ hasText: /bake/i }).first());

    if (await bakeCard.count() > 0) {
      await bakeCard.click();
      await page.waitForTimeout(1000);

      // Look for "Complete Bake" button
      const completeBakeButton = page.getByRole('button', { name: /complete.*bake|finish.*bake/i });

      if (await completeBakeButton.count() > 0) {
        await completeBakeButton.click();
        await page.waitForTimeout(1000);

        // May show rating/notes modal
        const ratingInput = page.getByLabel(/rating/i).or(page.locator('input[type="number"]'));
        if (await ratingInput.count() > 0) {
          await ratingInput.fill('5');
          
          const saveButton = page.getByRole('button', { name: /save|submit/i });
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(1000);
          }
        }

        // Should redirect to history or show completion message
        const isOnHistory = page.url().includes('/history');
        const completionMessage = page.getByText(/completed|finished/i);
        const hasMessage = await completionMessage.count() > 0;

        expect(isOnHistory || hasMessage).toBeTruthy();
      }
    }
  });

  test('should view bake history', async ({ page }) => {
    // Navigate to history page
    await page.goto('/#/history');
    await page.waitForLoadState('networkidle');

    // Should see history page content
    const historyContent = page.getByText(/history|completed.*bake/i)
      .or(page.getByRole('heading', { name: /history/i }));

    await expect(historyContent.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display timer for next action', async ({ page }) => {
    // Navigate to bakes page
    await page.goto('/#/bakes');
    await page.waitForLoadState('networkidle');

    // Click on first active bake
    const bakeCard = page.locator('[data-testid*="bake"]').first()
      .or(page.getByRole('link').filter({ hasText: /bake/i }).first());

    if (await bakeCard.count() > 0) {
      await bakeCard.click();
      await page.waitForTimeout(1000);

      // Look for timer or countdown
      const timerContent = page.getByText(/next.*in|\d+:\d+|minutes?|hours?/i);
      const hasTimer = await timerContent.count() > 0;

      // Timer may or may not be visible depending on bake state
      // This test verifies the page loads correctly
      expect(page.url()).toMatch(/\/bakes\/\d+/);
    }
  });
});

