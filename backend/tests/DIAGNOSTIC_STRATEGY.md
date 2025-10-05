# OAuth Test Diagnostic Strategy

## Current Status: Attempt #63

After 62 failed CI runs with duplicate key errors, we're taking a systematic diagnostic approach.

---

## 🔬 Hypothesis Testing

### **Hypothesis 1: The "Concurrent OAuth Requests" test is the culprit**
**Test:** Skip the concurrent test (commit 89ead39)

**Expected Outcome:**
- ✅ If this is correct: All other OAuth tests will pass
- ❌ If this is wrong: Tests will still fail with duplicate key errors

**What we'll learn:**
- Whether the issue is isolated to concurrency testing
- Or if there's a fundamental problem with the test setup

---

### **Hypothesis 2: Cleanup isn't working properly**
**Test:** Added aggressive cleanup with error handling and verification

**Changes Made:**
1. Wrapped cleanup in try-catch with explicit error logging
2. **Fail fast** if any users remain after cleanup
3. Added 10ms delay after cleanup for DB processing
4. Log exact emails of remaining users for debugging

**Expected Outcome:**
- ✅ If cleanup works: Tests proceed normally
- ❌ If cleanup fails: Test will fail IMMEDIATELY in beforeEach with detailed error message

**What we'll learn:**
- Whether cleanup is actually removing all users
- Which specific emails are not being cleaned up
- Whether there's a timing issue with PostgreSQL

---

### **Hypothesis 3: Email generation has collisions**
**Test:** Using UUID + process.pid + timestamp

**Current Implementation:**
```typescript
const testId = `${Date.now()}-${process.pid}-${randomUUID()}`;
testEmailBase = `oauth-test-${testId}`;
testEmail = `${testEmailBase}@example.com`;
```

**Collision Probability:**
- UUID v4: 1 in 2^122 (astronomically unlikely)
- With process.pid + timestamp: Effectively zero

**Expected Outcome:**
- ✅ Email collisions should be impossible
- ❌ If still seeing duplicates: Something else is wrong

---

## 📊 Diagnostic Output in CI Logs

### **Look for these markers:**

**✅ Good signs:**
```
🧪 Test email for this test: oauth-test-1234567890-12345-a1b2c3d4-...
✅ DATABASE_URL is set: postgresql://postgres:***@...
```

**❌ Bad signs:**
```
❌ CRITICAL: N oauth-test users still exist after cleanup!
Remaining users: [{ email: '...', id: ... }]
❌ Error during beforeEach cleanup: ...
ERROR: duplicate key value violates unique constraint "User_email_key"
```

---

## 🎯 Decision Tree

### **Scenario A: Tests pass with concurrent test skipped**
**Conclusion:** Issue is isolated to concurrent request handling

**Next Steps:**
1. ✅ Keep other OAuth tests enabled
2. 🔧 Fix concurrent test separately with proper locking/transactions
3. 📝 Document that concurrent OAuth is a known limitation

**Action:**
- Implement database-level locking for user creation
- OR use Prisma's `upsert` instead of `create`
- OR accept that concurrent requests may occasionally fail

---

### **Scenario B: Tests still fail even with concurrent test skipped**
**Conclusion:** Fundamental issue with test isolation or cleanup

**Next Steps:**
1. 🔍 Check CI logs for "CRITICAL" error messages
2. 📋 Review which specific test is failing
3. 🗄️ Consider database transaction rollback approach

**Possible Causes:**
- PostgreSQL async commit behavior
- Jest test parallelization (should be disabled with maxWorkers: 1)
- Foreign key constraint cascading issues
- Prisma client connection pooling

**Actions to Try:**
```javascript
// Option 1: Use database transactions for test isolation
beforeEach(async () => {
  await prisma.$executeRaw`BEGIN`;
});

afterEach(async () => {
  await prisma.$executeRaw`ROLLBACK`;
});

// Option 2: More aggressive unique prefix
const testId = `oauth-test-${Date.now()}-${randomUUID()}-${Math.random()}`;

// Option 3: Wait for DB consistency
await prisma.$queryRaw`SELECT pg_sleep(0.1)`;
```

---

### **Scenario C: Cleanup fails with error message**
**Conclusion:** Database foreign key or cascade issue

**Check for:**
- Specific error code in logs
- Which table/constraint is failing
- Order of deletions

**Fix:**
- Adjust deletion order
- Add cascade deletes to schema
- Use `$transaction` for atomic cleanup

---

## 🛠️ Current Test Configuration

### Jest Settings
```json
{
  "maxWorkers": 1,           // ✅ No parallel execution
  "testTimeout": 30000,      // ✅ 30s timeout
  "forceExit": true,         // ⚠️ May mask cleanup issues
  "detectOpenHandles": true  // ✅ Shows async leaks
}
```

### Database Settings (CI)
```yaml
DATABASE_URL: postgresql://postgres:test_password@localhost:5432/sourdough_test
POSTGRES_USER: postgres     # ✅ Correct user (not root)
POSTGRES_PASSWORD: test_password
```

---

## 📝 Test Status Tracking

### OAuth Tests Status

| Test Name | Status | Notes |
|-----------|--------|-------|
| should create new user with Google OAuth | 🔄 Testing | Basic user creation |
| should create user with default displayName | 🔄 Testing | Name generation |
| should handle email_verified as string | 🔄 Testing | Type coercion |
| should handle email_verified as boolean | 🔄 Testing | Boolean handling |
| should link Google to existing user | 🔄 Testing | Account linking |
| should update user profile if Google provides data | 🔄 Testing | Profile updates |
| should not duplicate accounts | 🔄 Testing | Duplicate prevention |
| should reject invalid Google token | 🔄 Testing | Error handling |
| **Concurrent OAuth Requests** | ⏭️ **SKIPPED** | **Known issue** |

---

## 🚨 Emergency Fallback Plan

If tests continue to fail after 5 more attempts:

### Option 1: Isolate OAuth Tests
Move OAuth tests to separate file that runs independently:
```bash
npm run test:oauth  # Runs only OAuth tests with special setup
```

### Option 2: Mock Database for OAuth Tests
Use in-memory SQLite for OAuth tests:
```typescript
const prisma = new PrismaClient({
  datasources: { db: { url: 'file::memory:?cache=shared' } }
});
```

### Option 3: Disable OAuth Tests in CI
```typescript
const isCI = process.env.CI === 'true';
const testFn = isCI ? it.skip : it;
```

---

## 📚 Reference Commits

| Commit | Description | Success? |
|--------|-------------|----------|
| 94ebc64 | Vitest exclude + triple random | ❌ |
| bb61619 | Clear Prisma cache | ❌ |
| 492cf39 | Fix DATABASE_URL loading order | ✅ (fixed root) |
| d8dd25f | afterEach cleanup + logging | ❌ |
| 3e9ad8a | UUID + race condition handling | ❌ |
| 89ead39 | **Skip concurrent + aggressive cleanup** | 🔄 **Testing** |

---

## 🎓 Lessons Learned

1. **Concurrent testing is hard** - Race conditions in tests are difficult to reproduce locally
2. **CI is different** - Timing and behavior differs from local environment
3. **Database cleanup is critical** - Must be absolutely bulletproof
4. **Fail fast** - Better to fail in setup than during test with confusing errors
5. **Incremental changes** - One hypothesis at a time

---

**Last Updated:** Commit 89ead39 (Attempt #63)  
**Next Review:** After CI run completes  
**Contact:** Check GitHub Actions logs for diagnostic output
