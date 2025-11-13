/**
 * Error Handling E2E Tests
 * 
 * Tests error scenarios and edge cases:
 * - 404 page handling
 * - Network errors
 * - Invalid form inputs
 * - Unauthorized access
 */

import { test, expect } from '@playwright/test';
import { clearAuth } from './helpers/api';

test.describe('Error Handling', () => {
  test('should handle 404 routes gracefully', async ({ page }) => {
    // Navigate to non-existent route
    await page.goto('/#/this-page-does-not-exist-12345');
    await page.waitForLoadState('networkidle');

    // Should either:
    // 1. Show 404 page
    // 2. Redirect to home/login
    // 3. Show "Not Found" message
    const has404 = await page.getByText(/404|not found/i).count() > 0;
    const redirectedHome = page.url().endsWith('/#/') || page.url().includes('/login');
    const hasNotFound = await page.getByText(/page.*not.*found/i).count() > 0;

    expect(has404 || redirectedHome || hasNotFound).toBeTruthy();
  });

  test('should require authentication for protected routes', async ({ page }) => {
    await clearAuth(page);

    // Try to access protected route
    await page.goto('/#/recipes');
    await page.waitForLoadState('networkidle');

    // Should redirect to login
    const isOnLogin = page.url().endsWith('/#/') || page.url().includes('/login');
    const loginForm = page.locator('#email').or(page.getByPlaceholder(/email/i)).or(page.locator('input[type="email"]'));

    expect(isOnLogin || await loginForm.count() > 0).toBeTruthy();
  });

  test('should validate email format in registration', async ({ page }) => {
    await page.goto('/#/register');
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'));
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
    const submitButton = page.getByRole('button', { name: /register/i });

    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      // Enter invalid email
      await emailInput.first().fill('invalid-email');
      await passwordInput.first().fill('TestPassword123!');
      
      // Try to submit
      if (await submitButton.isEnabled()) {
        await submitButton.click();
        await page.waitForTimeout(500);

        // Should show validation error
        const errorMessage = page.getByText(/invalid.*email|email.*format/i);
        const hasError = await errorMessage.count() > 0;
        
        // Browser may also prevent submission with HTML5 validation
        const isStillOnPage = page.url().includes('/register');
        expect(hasError || isStillOnPage).toBeTruthy();
      }
    }
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/#/register');
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'));
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
    const submitButton = page.getByRole('button', { name: /register/i });

    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      // Enter weak password
      await emailInput.first().fill('test@example.com');
      await passwordInput.first().fill('123'); // Too short
      
      // Try to submit
      if (await submitButton.isEnabled()) {
        await submitButton.click();
        await page.waitForTimeout(500);

        // Should show validation error or prevent submission
        const errorMessage = page.getByText(/password.*too.*short|password.*required/i);
        const hasError = await errorMessage.count() > 0;
        const isStillOnPage = page.url().includes('/register');
        
        expect(hasError || isStillOnPage).toBeTruthy();
      }
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    await page.goto('/#/recipes');
    await page.waitForLoadState('networkidle');

    // Should show error message or handle gracefully
    const errorMessage = page.getByText(/offline|network.*error|connection/i);
    const hasError = await errorMessage.count() > 0;
    
    // Or should show cached content or loading state
    const loadingState = page.getByText(/loading|please.*wait/i);
    const hasLoading = await loadingState.count() > 0;

    expect(hasError || hasLoading).toBeTruthy();

    // Re-enable network
    await page.context().setOffline(false);
  });

  test('should handle empty recipe list gracefully', async ({ page }) => {
    // This test verifies the app handles empty states
    // Note: May need a fresh user account with no recipes
    
    await page.goto('/#/recipes');
    await page.waitForLoadState('networkidle');

    // Should either show:
    // 1. Empty state message
    // 2. "Create Recipe" button
    // 3. Recipe list (if recipes exist)
    const emptyState = page.getByText(/no.*recipe|create.*recipe|get.*started/i);
    const createButton = page.getByRole('button', { name: /create|new.*recipe/i });
    const recipeList = page.locator('[data-testid*="recipe"]');

    const hasEmptyState = await emptyState.count() > 0;
    const hasCreateButton = await createButton.count() > 0;
    const hasRecipes = await recipeList.count() > 0;

    // At least one should be true
    expect(hasEmptyState || hasCreateButton || hasRecipes).toBeTruthy();
  });
});

