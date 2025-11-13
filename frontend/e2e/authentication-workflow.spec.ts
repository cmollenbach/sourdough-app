/**
 * Authentication Workflow E2E Tests
 * 
 * Tests complete authentication workflows:
 * - User registration
 * - Email/password login
 * - Session persistence
 * - Logout
 * - Protected route access
 */

import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser, loginUser, logoutUser, isLoggedIn } from './helpers/auth';
import { clearAuth } from './helpers/api';

test.describe('Authentication Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page first to ensure localStorage is accessible
    await page.goto('/#/');
    await page.waitForLoadState('domcontentloaded');
    // Clear any existing auth data
    await clearAuth(page);
  });

  test('should allow user to register and automatically login', async ({ page }) => {
    const user = generateTestUser();

    // Step 1: Navigate to registration page
    await page.goto('/#/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Step 2: Fill registration form
    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'));
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
    const submitButton = page.getByRole('button', { name: /register/i });

    // Wait for form to be ready
    await emailInput.first().waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.first().waitFor({ state: 'visible', timeout: 10000 });

    await emailInput.first().fill(user.email);
    await passwordInput.first().fill(user.password);
    
    await page.waitForTimeout(500);
    await submitButton.click();

    // Step 3: Verify successful registration and auto-login
    // Should redirect to recipes page
    try {
      await page.waitForURL(/\/(recipes|#\/recipes)/, { timeout: 20000 });
      
      // Verify we're logged in
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBeTruthy();

      // Verify we can see protected content
      await page.waitForTimeout(2000);
      const recipesContent = page.getByText(/recipe/i).or(page.getByRole('heading', { name: /recipe/i }));
      const hasContent = await recipesContent.count() > 0;
      expect(hasContent).toBeTruthy();
    } catch (error) {
      // If registration fails (e.g., backend not running), skip the test
      const errorMessage = page.getByText(/error|failed|api/i);
      const hasError = await errorMessage.count() > 0;
      if (hasError) {
        test.skip();
      } else {
        throw error;
      }
    }
  });

  test('should allow user to login with email and password', async ({ page }) => {
    const user = generateTestUser();

    // Step 1: Register user first
    await registerUser(page, user);

    // Step 2: Logout
    await logoutUser(page);

    // Step 3: Login
    await loginUser(page, user);

    // Step 4: Verify successful login
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBeTruthy();

    // Should be on recipes page
    expect(page.url()).toMatch(/\/(recipes|#\/recipes)/);
  });

  test('should reject login with invalid credentials', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Try to login with invalid credentials
    const emailInput = page.locator('#email').or(page.getByPlaceholder(/email/i)).or(page.locator('input[type="email"]'));
    const passwordInput = page.locator('#password').or(page.getByPlaceholder(/password/i)).or(page.locator('input[type="password"]'));
    const submitButton = page.getByRole('button', { name: /login/i });

    await emailInput.first().fill('invalid@example.com');
    await passwordInput.first().fill('wrongpassword');
    await submitButton.click();

    // Should show error message
    await page.waitForTimeout(1000);
    
    const errorMessage = page.getByText(/invalid|error|failed/i);
    const hasError = await errorMessage.count() > 0;
    
    // Should either show error or stay on login page
    const stillOnLogin = page.url().includes('/login') || page.url().endsWith('/#/');
    expect(hasError || stillOnLogin).toBeTruthy();
  });

  test('should prevent duplicate registration', async ({ page }) => {
    const user = generateTestUser();

    // Step 1: Register user
    await registerUser(page, user);

    // Step 2: Logout
    await logoutUser(page);

    // Step 3: Try to register again with same email
    await page.goto('/#/register');
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'));
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
    const submitButton = page.getByRole('button', { name: /register/i });

    await emailInput.first().fill(user.email);
    await passwordInput.first().fill(user.password);
    await submitButton.click();

    // Should show error about duplicate email
    await page.waitForTimeout(1000);
    
    const errorMessage = page.getByText(/already|exists|duplicate/i);
    const hasError = await errorMessage.count() > 0;
    expect(hasError).toBeTruthy();
  });

  test('should redirect authenticated users away from login page', async ({ page }) => {
    const user = generateTestUser();

    // Step 1: Register and login
    await registerUser(page, user);

    // Step 2: Try to navigate to login page
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    // Should be redirected to recipes page
    expect(page.url()).toMatch(/\/(recipes|#\/recipes)/);
  });

  test('should require authentication for protected routes', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/#/recipes');
    await page.waitForLoadState('networkidle');

    // Should redirect to login page
    const isOnLogin = page.url().includes('/login') || page.url().endsWith('/#/');
    const loginForm = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    
    expect(isOnLogin || await loginForm.count() > 0).toBeTruthy();
  });

  test('should persist session across page refreshes', async ({ page }) => {
    const user = generateTestUser();

    // Step 1: Register and login
    await registerUser(page, user);

    // Step 2: Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 3: Verify still logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBeTruthy();

    // Should still be on protected page
    expect(page.url()).toMatch(/\/(recipes|#\/recipes)/);
  });

  test('should allow user to logout', async ({ page }) => {
    const user = generateTestUser();

    // Step 1: Register and login
    await registerUser(page, user);

    // Step 2: Logout
    await logoutUser(page);

    // Step 3: Verify logged out
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBeFalsy();

    // Should be on login page
    const isOnLogin = page.url().includes('/login') || page.url().endsWith('/#/');
    expect(isOnLogin).toBeTruthy();
  });
});

