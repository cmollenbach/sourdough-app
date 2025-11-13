/**
 * API helpers for E2E tests
 * 
 * Provides utilities for interacting with the backend API during tests
 * Note: These can be used for setup/teardown or for verifying API responses
 */

import { Page } from '@playwright/test';

/**
 * Get auth token from localStorage
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  try {
    return await page.evaluate(() => {
      try {
        return localStorage.getItem('token') || localStorage.getItem('authToken');
      } catch (e) {
        return null;
      }
    });
  } catch (error) {
    return null;
  }
}

/**
 * Set auth token in localStorage (for authenticated requests)
 */
export async function setAuthToken(page: Page, token: string): Promise<void> {
  // Ensure we're on a page that supports localStorage
  const url = page.url();
  if (!url || url === 'about:blank') {
    await page.goto('/#/');
    await page.waitForLoadState('domcontentloaded');
  }
  
  try {
    await page.evaluate((token) => {
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
      } catch (e) {
        // Ignore errors
      }
    }, token);
  } catch (error) {
    // If it fails, wait and try again
    await page.waitForTimeout(500);
    await page.evaluate((token) => {
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
      } catch (e) {
        // Ignore errors
      }
    }, token);
  }
}

/**
 * Clear all auth data
 */
export async function clearAuth(page: Page): Promise<void> {
  // Navigate to a page first to ensure we have access to localStorage
  await page.goto('/#/');
  await page.waitForLoadState('domcontentloaded');
  
  try {
    await page.evaluate(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  } catch (error) {
    // If localStorage access fails, the page might not be ready
    // Wait a bit and try again
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        // Ignore errors - page might not support localStorage
      }
    });
  }
}

/**
 * Wait for API request to complete
 */
export async function waitForApiRequest(
  page: Page,
  urlPattern: string | RegExp,
  method: string = 'GET'
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      const matchesUrl = typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      return matchesUrl && response.request().method() === method;
    },
    { timeout: 10000 }
  );
}

