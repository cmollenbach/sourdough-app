# GitHub Actions CI/CD Fixes Summary

## Overview
This document tracks all fixes applied to resolve GitHub Actions test failures.

---

## ✅ Fixed Issues

### 1. **Frontend: Vitest Running Playwright Tests**
**Commit:** 94ebc64

**Problem:**
- `npm test` runs Vitest
- Vitest had no exclude patterns and picked up `e2e/*.spec.ts` files
- Playwright tests don't work when run by Vitest
- Error: `Playwright Test did not expect test.describe() to be called here`

**Solution:**
```javascript
// frontend/vitest.config.js
test: {
  exclude: [
    '**/e2e/**',  // ← Added this line
    // ... other exclusions
  ]
}
```

**Result:** ✅ Frontend tests now pass

---

### 2. **Backend: "role 'root' does not exist" Error**
**Commit:** 492cf39

**Problem:**
- Prisma client was imported BEFORE environment variables were loaded
- Without `DATABASE_URL`, Prisma fell back to system defaults
- On Linux (GitHub Actions), default PostgreSQL connection uses current OS user
- Error: `FATAL: role "root" does not exist`

**Solution:**
```typescript
// backend/tests/setup.ts

// BEFORE (WRONG):
import prisma from '../src/lib/prisma';  // ❌ Imported first
dotenv.config({ path: ... });            // ⚠️ Loaded env vars AFTER

// AFTER (CORRECT):
dotenv.config({ path: ... });            // ✅ Load env vars FIRST
import prisma from '../src/lib/prisma';  // ✅ Import AFTER env is ready
```

**Additional Changes:**
- Added validation to fail fast if `DATABASE_URL` not set
- Added logging to show DATABASE_URL (with password masked)
- Added `--detectOpenHandles` flag to diagnose async handle leaks

**Result:** ✅ "root" user error eliminated

---

### 3. **Backend: OAuth Duplicate Email Constraint Violations**
**Commits:** 94ebc64, d8dd25f

**Problem:**
- Tests creating OAuth users with emails that already exist
- Error: `duplicate key value violates unique constraint "User_email_key"`
- Even with triple randomness, timing issues in cleanup

**Solution Phase 1 (94ebc64):**
Enhanced email uniqueness:
```typescript
// backend/tests/routes/auth-oauth.test.ts
const timestamp = Date.now();
const random = Math.random().toString(36).substring(2, 15);
const testId = `${timestamp}-${random}-${Math.random().toString(36).substring(2, 9)}`;
testEmailBase = `oauth-test-${testId}`;
```

**Solution Phase 2 (d8dd25f):**
Added `afterEach` cleanup:
```typescript
beforeEach(async () => {
  // Cleanup BEFORE test
  await cleanupOAuthUsers();
  // Generate unique email
  // ...
});

afterEach(async () => {
  // Cleanup AFTER test too
  await cleanupOAuthUsers();
});
```

**Additional Improvements:**
- Added logging to show which email each test uses
- Added verification to check cleanup completion
- Moved cleanup to run BEFORE email generation (clearer flow)

**Result:** ✅ Duplicate email errors should be resolved

---

### 4. **Workflow: Prisma Client Caching**
**Commit:** bb61619

**Problem:**
- Cached Prisma client might have wrong connection settings

**Solution:**
```yaml
# .github/workflows/test.yml
- name: Generate Prisma Client
  run: |
    rm -rf ./generated/prisma  # ← Clear cache first
    npx prisma generate
```

**Result:** ✅ Fresh Prisma client generated every run

---

## 📊 Test Results Timeline

| Commit   | Frontend | Backend | E2E | Issue                                |
|----------|----------|---------|-----|--------------------------------------|
| Initial  | ❌       | ❌      | ✅  | Vitest/Playwright conflict + root    |
| 94ebc64  | ✅       | ❌      | ✅  | Frontend fixed, root error persists  |
| bb61619  | ✅       | ❌      | ✅  | Clear Prisma cache                   |
| 492cf39  | ✅       | ❌      | ✅  | Root error fixed, duplicate emails   |
| d8dd25f  | ✅       | 🔄      | ✅  | Enhanced cleanup (pending CI)        |

---

## 🔍 Debugging Tools Added

### 1. **DATABASE_URL Validation**
```typescript
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}
console.log('✅ DATABASE_URL is set:', maskedUrl);
```

### 2. **Cleanup Verification**
```typescript
const remainingUsers = await prisma.user.count({ 
  where: { email: { startsWith: 'oauth-test-' } } 
});
if (remainingUsers > 0) {
  console.warn(`⚠️ ${remainingUsers} users still exist after cleanup`);
}
```

### 3. **Test Email Logging**
```typescript
console.log(`🧪 Test email for this test: ${testEmail}`);
```

### 4. **Jest Open Handles Detection**
```json
{
  "scripts": {
    "test": "jest --forceExit --detectOpenHandles"
  }
}
```

---

## 🎯 Key Learnings

### 1. **Module Import Order Matters**
Environment variables MUST be loaded before importing modules that use them, especially database clients.

### 2. **Test Isolation is Critical**
Both `beforeEach` AND `afterEach` cleanup helps prevent test pollution, especially when tests create database records.

### 3. **Vitest != Playwright**
Test runner tools have specific expectations. Use proper exclude patterns to keep them separate.

### 4. **CI != Local Environment**
- `.env` files are gitignored
- CI uses workflow environment variables
- System defaults differ (Linux vs Windows)
- Always validate environment in CI

---

## 🚀 Next Steps

1. **Monitor Next CI Run** for remaining issues
2. **If duplicate emails persist**: Consider transaction-based test isolation
3. **If async handles warning continues**: Audit all `afterAll` hooks for proper cleanup
4. **Consider**: Adding MSW (Mock Service Worker) for E2E tests to eliminate backend dependency

---

## 📝 Related Files

- `.github/workflows/test.yml` - CI/CD workflow configuration
- `backend/tests/setup.ts` - Global test setup with DATABASE_URL validation
- `backend/tests/routes/auth-oauth.test.ts` - OAuth tests with enhanced cleanup
- `backend/package.json` - Test scripts with --detectOpenHandles
- `frontend/vitest.config.js` - Vitest configuration with Playwright exclusion

---

**Last Updated:** Commit d8dd25f  
**Status:** Awaiting CI confirmation on all fixes
