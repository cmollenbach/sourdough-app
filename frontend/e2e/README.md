# E2E Test Suite

## Overview
End-to-end tests for the Sourdough app using Playwright. Tests automatically start both backend and frontend servers.

This directory contains end-to-end tests for the Sourdough app using Playwright.

## Test Structure

### Test Files

1. **app-navigation.spec.ts** - Basic app navigation and UI features (8 tests)
2. **recipe-creation.spec.ts** - Recipe builder tests (5 tests - currently skipped)
3. **bake-tracking.spec.ts** - Bake session tests (6 tests - currently skipped)
4. **timing-parser.spec.ts** - Timing plan parser tests (5 tests)
5. **authentication-workflow.spec.ts** - Complete authentication workflows (8 tests)
6. **recipe-workflow.spec.ts** - Recipe management workflows (6 tests)
7. **bake-workflow.spec.ts** - Bake tracking workflows (7 tests)
8. **user-profile-workflow.spec.ts** - User profile and settings workflows (5 tests)
9. **error-handling.spec.ts** - Error scenarios and edge cases (6 tests)

### Helper Files

- **helpers/auth.ts** - Authentication utilities (register, login, logout)
- **helpers/api.ts** - API interaction utilities (token management, request waiting)

## Prerequisites

1. **PostgreSQL running** and accessible
2. **Backend database** set up with migrations applied
3. **Environment variables** configured (backend `.env` file)
4. **Frontend `.env`** with `VITE_API_BASE_URL` set

## Running Tests

**Note**: Playwright automatically starts both backend and frontend servers before running tests.

```bash
# Run all tests (automatically starts backend + frontend)
npm run test:e2e

# Run with UI (recommended for debugging)
npm run test:e2e:ui

# Run specific test file
npx playwright test authentication-workflow

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

### Manual Setup (if auto-start fails)

If the automatic server startup fails, you can manually start the servers:

```bash
# Terminal 1: Start backend
cd ../backend
npm run dev

# Terminal 2: Start frontend (optional, Playwright will start it)
cd frontend
npm run dev

# Terminal 3: Run tests
npm run test:e2e
```

## Test Coverage

### Authentication (8 tests)
- User registration and auto-login
- Email/password login
- Invalid credentials handling
- Duplicate registration prevention
- Authenticated user redirects
- Protected route access
- Session persistence
- User logout

### Recipe Management (6 tests)
- Create new recipe
- Display recipe list
- View recipe details
- Edit recipe
- Delete recipe
- Form validation

### Bake Tracking (7 tests)
- Start bake from recipe
- Display active bakes list
- View bake details and timeline
- Complete bake step
- Complete bake
- View bake history
- Display timer for next action

### User Profile (5 tests)
- View user profile
- Access settings page
- Navigate to user settings
- Toggle dark mode
- Access account page

### Error Handling (6 tests)
- 404 route handling
- Protected route authentication
- Email format validation
- Password requirements validation
- Network error handling
- Empty state handling

## Test Helpers

### Authentication Helpers

```typescript
import { generateTestUser, registerUser, loginUser, logoutUser } from './helpers/auth';

// Generate unique test user
const user = generateTestUser();

// Register user via UI
await registerUser(page, user);

// Login user via UI
await loginUser(page, user);

// Logout user
await logoutUser(page);
```

### API Helpers

```typescript
import { getAuthToken, setAuthToken, clearAuth, waitForApiRequest } from './helpers/api';

// Get auth token from localStorage
const token = await getAuthToken(page);

// Set auth token
await setAuthToken(page, token);

// Clear all auth data
await clearAuth(page);

// Wait for API request to complete
await waitForApiRequest(page, '/api/recipes', 'GET');
```

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { generateTestUser, registerUser } from './helpers/auth';

test.describe('Feature Name', () => {
  let testUser: ReturnType<typeof generateTestUser>;

  test.beforeEach(async ({ page }) => {
    testUser = generateTestUser();
    await registerUser(page, testUser);
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

### Best Practices

1. **Use semantic selectors** - Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for network idle** - Use `waitForLoadState('networkidle')` after navigation
3. **Use test helpers** - Leverage auth and API helpers for common operations
4. **Handle conditional elements** - Check if elements exist before interacting
5. **Use meaningful timeouts** - Set appropriate timeouts for async operations
6. **Clean up test data** - Clear auth data in `beforeEach` hooks

## CI/CD Integration

Tests run automatically on:
- Every push to main
- Every pull request
- Before deployment

See `.github/workflows/test.yml` for CI configuration.

## Debugging Failed Tests

1. **Run in UI mode** - `npm run test:e2e:ui` to see tests run in real-time
2. **Check screenshots** - Failed tests save screenshots in `playwright-report/`
3. **Watch videos** - Test videos are saved for failed tests
4. **Use debug mode** - `npm run test:e2e:debug` to step through tests
5. **Check traces** - Detailed traces are saved for failed tests

## Notes

- Some tests are skipped if they require backend API that isn't available
- Tests use real browser automation, so they may be slower than unit tests
- Tests should be independent and not rely on shared state
- Use unique test data (timestamps, random numbers) to avoid conflicts

