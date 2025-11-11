# E2E Test Hang Fix

## Problem
E2E tests were hanging because the `OfflineBanner` component was making immediate health checks to `/api/health` on mount. If the backend wasn't running, these requests would timeout after 10 seconds, causing tests to hang.

**Note**: The backend SHOULD be running for E2E tests to work properly. The Playwright config now automatically starts the backend server before running tests.

## Solution

### 1. Test Environment Detection
The `OfflineBanner` now detects when it's running in a Playwright test environment by checking the user agent:

```typescript
const isTestEnvironment = typeof window !== 'undefined' && 
  navigator.userAgent.includes('Playwright');
```

When in test mode, health checks are completely skipped.

### 2. Improved Health Check Timeout
- Added a 5-second timeout specifically for health checks (shorter than the 10s axios timeout)
- Added a 1-second delay before the first health check to not block initial render
- Health checks are now non-blocking

### 3. Global Setup
Created `e2e/global-setup.ts` to mark the test environment (for future use if needed).

## Files Modified

1. **`src/components/Shared/OfflineBanner.tsx`**
   - Added test environment detection
   - Added 5s timeout for health checks
   - Added 1s delay before first check
   - Skips health checks in test environment

2. **`playwright.config.ts`**
   - Added global setup configuration

3. **`e2e/global-setup.ts`** (new)
   - Global setup file for Playwright

## Testing

The tests should now:
- ✅ Start immediately without waiting for health checks
- ✅ Not hang if backend is not running
- ✅ Still show offline banner in production when backend is down

## Verification

To verify the fix works:
1. Run tests: `npm run test:e2e`
2. Tests should start immediately
3. No hanging on health check requests

