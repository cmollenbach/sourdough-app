import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright configuration for Loafly Sourdough App E2E tests
 * 
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: process.env.CI 
    ? [['html'], ['list'], ['github']]
    : [['html'], ['list']],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Timeout for each action (click, fill, etc.) */
    actionTimeout: 10000,
  },

  /* Global setup to mark test environment */
  globalSetup: './e2e/global-setup.ts',

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev servers before starting the tests */
  webServer: [
    {
      // Use npm run dev which will use the locally installed ts-node-dev
      // npm scripts automatically add node_modules/.bin to PATH
      command: 'npm run dev',
      cwd: path.resolve(__dirname, '../backend'),
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:test_password@localhost:5432/sourdough_test',
        JWT_SECRET: process.env.JWT_SECRET || 'test_jwt_secret_for_ci_do_not_use_in_production',
        PORT: process.env.PORT || '3001',
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
        NODE_ENV: 'test',
        // Ensure Node.js can find the backend's node_modules
        NODE_PATH: path.resolve(__dirname, '../backend/node_modules'),
      },
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
