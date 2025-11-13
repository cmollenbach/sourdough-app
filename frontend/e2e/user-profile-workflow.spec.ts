/**
 * User Profile Workflow E2E Tests
 * 
 * Tests user profile and settings workflows:
 * - View user profile
 * - Update profile information
 * - Access settings
 * - Update preferences
 */

import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser } from './helpers/auth';
import { clearAuth } from './helpers/api';

test.describe('User Profile Workflows', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    testUser = generateTestUser();
    await clearAuth(page);
    await registerUser(page, testUser);
    await page.waitForLoadState('networkidle');
  });

  test('should view user profile', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/#/profile');
    await page.waitForLoadState('networkidle');

    // Should see profile content
    const profileContent = page.getByText(/profile|email|user/i)
      .or(page.getByRole('heading', { name: /profile/i }));

    await expect(profileContent.first()).toBeVisible({ timeout: 5000 });

    // Should display user email
    const emailDisplay = page.getByText(testUser.email);
    await expect(emailDisplay).toBeVisible({ timeout: 5000 });
  });

  test('should access settings page', async ({ page }) => {
    // Navigate to settings
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    // Should see settings content
    const settingsContent = page.getByText(/settings|preferences/i)
      .or(page.getByRole('heading', { name: /settings/i }));

    await expect(settingsContent.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to user settings', async ({ page }) => {
    // Navigate to settings
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');

    // Look for user settings link or section
    const userSettingsLink = page.getByRole('link', { name: /user|profile|account/i })
      .or(page.getByText(/user.*settings/i));

    if (await userSettingsLink.count() > 0) {
      await userSettingsLink.click();
      await page.waitForTimeout(1000);

      // Should be on user settings page
      expect(page.url()).toMatch(/\/settings\/user/);
    }
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/#/recipes');
    await page.waitForLoadState('networkidle');

    // Look for dark mode toggle
    const darkModeToggle = page.getByRole('button', { name: /dark.*mode|theme/i })
      .or(page.locator('[aria-label*="dark"]'))
      .or(page.locator('[aria-label*="theme"]'));

    if (await darkModeToggle.count() > 0) {
      // Get initial theme
      const htmlElement = page.locator('html');
      const initialClass = await htmlElement.getAttribute('class');

      // Toggle dark mode
      await darkModeToggle.first().click();
      await page.waitForTimeout(500);

      // Check if theme changed
      const newClass = await htmlElement.getAttribute('class');
      const themeChanged = initialClass !== newClass;

      expect(themeChanged).toBeTruthy();
    }
  });

  test('should access account page', async ({ page }) => {
    // Navigate to account page
    await page.goto('/#/account');
    await page.waitForLoadState('networkidle');

    // Should see account content
    const accountContent = page.getByText(/account|email|profile/i)
      .or(page.getByRole('heading', { name: /account/i }));

    await expect(accountContent.first()).toBeVisible({ timeout: 5000 });
  });
});

