/**
 * Playwright Global Setup
 * 
 * Runs once before all tests to set up test environment.
 * This helps components like OfflineBanner detect they're in a test environment.
 */
async function globalSetup() {
  // Mark that we're in a Playwright test environment
  // This can be used by components to skip certain behaviors
  process.env.PLAYWRIGHT_TEST = 'true';
  
  console.log('🧪 Playwright global setup complete');
}

export default globalSetup;

