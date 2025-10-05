import { test, expect } from '@playwright/test';

/**
 * Basic App Navigation E2E Tests
 * 
 * Tests core app functionality including:
 * - App loads successfully
 * - Navigation works
 * - Dark mode toggle
 * - Responsive design
 */

test.describe('App Navigation and Basic Features', () => {
  test('should load the app successfully', async ({ page }) => {
    await page.goto('/');
    
    // App should load and display main content
    // Wait for the page to be loaded
    await page.waitForLoadState('networkidle');
    
    // Check that we're not seeing an error page
    const hasError = await page.getByText(/error/i).count() > 0;
    const has404 = await page.getByText(/404/i).count() > 0;
    
    expect(hasError).toBeFalsy();
    expect(has404).toBeFalsy();
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Look for navigation elements
    const nav = page.locator('nav').or(
      page.getByRole('navigation')
    );
    
    await expect(nav.first()).toBeVisible();
    
    // Common navigation items
    const recipesLink = page.getByRole('link', { name: /recipes/i });
    const bakesLink = page.getByRole('link', { name: /bakes/i });
    
    // At least one navigation link should be visible
    const hasNav = await recipesLink.count() > 0 || await bakesLink.count() > 0;
    expect(hasNav).toBeTruthy();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to Recipes page
    const recipesLink = page.getByRole('link', { name: /recipes/i });
    if (await recipesLink.count() > 0) {
      await recipesLink.click();
      await page.waitForTimeout(500);
      
      // URL should change or content should update
      const url = page.url();
      const hasRecipesContent = await page.getByText(/recipe/i).count() > 0;
      
      expect(url.includes('recipe') || hasRecipesContent).toBeTruthy();
    }
    
    // Navigate to Bakes page
    const bakesLink = page.getByRole('link', { name: /bakes/i });
    if (await bakesLink.count() > 0) {
      await bakesLink.click();
      await page.waitForTimeout(500);
      
      const url = page.url();
      const hasBakesContent = await page.getByText(/bake/i).count() > 0;
      
      expect(url.includes('bake') || hasBakesContent).toBeTruthy();
    }
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Look for dark mode toggle
    const darkModeToggle = page.getByRole('button', { name: /dark.*mode/i }).or(
      page.getByRole('button', { name: /theme/i })
    ).or(
      page.locator('[aria-label*="dark"]')
    ).or(
      page.locator('[aria-label*="theme"]')
    );
    
    if (await darkModeToggle.count() > 0) {
      // Get current theme class (if any)
      const bodyClass = await page.locator('body').getAttribute('class');
      const htmlClass = await page.locator('html').getAttribute('class');
      
      // Click dark mode toggle
      await darkModeToggle.first().click();
      await page.waitForTimeout(500);
      
      // Check if theme changed
      const newBodyClass = await page.locator('body').getAttribute('class');
      const newHtmlClass = await page.locator('html').getAttribute('class');
      
      // Theme should have changed
      const themeChanged = bodyClass !== newBodyClass || htmlClass !== newHtmlClass;
      expect(themeChanged).toBeTruthy();
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // App should still load on mobile
    await page.waitForLoadState('networkidle');
    
    // Look for mobile menu or navigation
    const mobileMenu = page.getByRole('button', { name: /menu/i }).or(
      page.locator('[aria-label*="menu"]')
    ).or(
      page.getByRole('navigation')
    );
    
    // Should have some navigation element
    const hasNavigation = await mobileMenu.count() > 0;
    expect(hasNavigation).toBeTruthy();
  });

  test('should display app title or logo', async ({ page }) => {
    await page.goto('/');
    
    // Look for app title/logo
    const appTitle = page.getByText(/loafly/i).or(
      page.getByText(/sourdough/i)
    ).or(
      page.getByRole('heading', { level: 1 })
    ).or(
      page.locator('img[alt*="logo"]')
    );
    
    // Should have app branding visible
    await expect(appTitle.first()).toBeVisible();
  });

  test('should handle page refresh', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to a different page
    const recipesLink = page.getByRole('link', { name: /recipes/i });
    if (await recipesLink.count() > 0) {
      await recipesLink.click();
      await page.waitForTimeout(500);
      
      // Refresh the page
      await page.reload();
      
      // Page should still load correctly
      await page.waitForLoadState('networkidle');
      
      // Should not see error
      const hasError = await page.getByText(/error/i).count() > 0;
      expect(hasError).toBeFalsy();
    }
  });

  test('should handle 404 routes gracefully', async ({ page }) => {
    // Navigate to non-existent route
    await page.goto('/this-page-does-not-exist-12345');
    
    // Should either:
    // 1. Show 404 page, OR
    // 2. Redirect to home (SPA behavior)
    await page.waitForLoadState('networkidle');
    
    const has404 = await page.getByText(/404/i).count() > 0;
    const hasNotFound = await page.getByText(/not found/i).count() > 0;
    const redirectedHome = page.url().endsWith('/') || !page.url().includes('this-page-does-not-exist');
    
    // Valid responses: show 404, show not found, or redirect
    expect(has404 || hasNotFound || redirectedHome).toBeTruthy();
  });
});
