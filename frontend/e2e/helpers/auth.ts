/**
 * Authentication helpers for E2E tests
 * 
 * Provides utilities for logging in, registering, and managing test users
 */

import { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
}

/**
 * Generate a unique test user email
 */
export function generateTestUser(): TestUser {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return {
    email: `e2e-test-${timestamp}-${random}@example.com`,
    password: 'TestPassword123!',
  };
}

/**
 * Register a new user via the UI
 */
export async function registerUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/#/register');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Fill registration form - use placeholder or type selector
  const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"]'));
  const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
  const submitButton = page.getByRole('button', { name: /register/i });

  // Wait for inputs to be visible
  await emailInput.first().waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.first().waitFor({ state: 'visible', timeout: 5000 });

  await emailInput.first().fill(user.email);
  await passwordInput.first().fill(user.password);
  
  // Wait a moment before clicking submit
  await page.waitForTimeout(500);
  await submitButton.click();

  // Wait for redirect to recipes page (successful registration)
  // Or wait for error message if registration fails
  try {
    await page.waitForURL(/\/(recipes|#\/recipes)/, { timeout: 15000 });
  } catch (error) {
    // If redirect doesn't happen, check for error message
    const errorMessage = page.getByText(/error|failed|already exists/i);
    const hasError = await errorMessage.count() > 0;
    if (hasError) {
      throw new Error('Registration failed - user might already exist or API error');
    }
    throw error;
  }
}

/**
 * Login via the UI
 */
export async function loginUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/#/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Fill login form - use id, placeholder, or type selector
  const emailInput = page.locator('#email').or(page.getByPlaceholder(/email/i)).or(page.locator('input[type="email"]'));
  const passwordInput = page.locator('#password').or(page.getByPlaceholder(/password/i)).or(page.locator('input[type="password"]'));
  const submitButton = page.getByRole('button', { name: /login/i });

  // Wait for inputs to be visible
  await emailInput.first().waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.first().waitFor({ state: 'visible', timeout: 5000 });

  await emailInput.first().fill(user.email);
  await passwordInput.first().fill(user.password);
  
  await page.waitForTimeout(500);
  await submitButton.click();

  // Wait for redirect to recipes page (successful login)
  try {
    await page.waitForURL(/\/(recipes|#\/recipes)/, { timeout: 15000 });
  } catch (error) {
    // If redirect doesn't happen, check for error message
    const errorMessage = page.getByText(/error|failed|invalid/i);
    const hasError = await errorMessage.count() > 0;
    if (hasError) {
      throw new Error('Login failed - invalid credentials or API error');
    }
    throw error;
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check if we're on a protected page (recipes, bakes, etc.)
  const url = page.url();
  const isOnProtectedPage = url.includes('/recipes') || url.includes('/bakes') || url.includes('/history');
  
  // Check for logout button or user menu
  const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
  const hasLogout = await logoutButton.count() > 0;

  return isOnProtectedPage || hasLogout;
}

/**
 * Logout via the UI
 */
export async function logoutUser(page: Page): Promise<void> {
  const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
  if (await logoutButton.count() > 0) {
    await logoutButton.click();
    await page.waitForURL(/\/(login|#\/)/, { timeout: 5000 });
  }
}

