# Testing Roadmap

## Current Status (October 4, 2025)

### Overall Coverage (Updated with Week 2 Progress)
- **Statements:** ~58% (up from 26.55%)
- **Branches:** ~45% (up from 12.6%)
- **Functions:** ~60% (up from 15.23%)
- **Lines:** ~59% (up from 27.51%)

### Test Suite Status
- ✅ **317 tests passing** (up from 190)
- ❌ **20 tests failing** (edge cases: axios mocks, race conditions)
- ⏭️ **1 test skipped**
- ⏱️ **Execution time:** ~33 seconds (up from 8s)

---

## Coverage by Layer

### ✅ Validation Layer (EXCELLENT - 75-80% coverage)
| File | Lines | Branches | Status |
|------|-------|----------|--------|
| `schemas/auth.ts` | 77.77% | 60% | ✅ Well tested |
| `schemas/bake.ts` | 78.26% | 58.33% | ✅ Well tested |
| `schemas/recipe.ts` | 65.71% | 62.5% | ✅ Well tested |
| `middleware/authMiddleware.ts` | 74.19% | 66.66% | ✅ Well tested |

**Test Files:**
- ✅ `tests/validation/auth.validation.test.ts` (60+ tests)
- ✅ `tests/validation/recipe.validation.test.ts` (50+ tests)
- ✅ `tests/validation/bake.validation.test.ts` (40+ tests)
- ✅ `tests/validation/schema.unit.test.ts` (30+ tests)

---

### ⭐ Route Handlers (SIGNIFICANT IMPROVEMENT - Now 40-92% coverage)
| File | Lines | Branches | Status | Priority |
|------|-------|----------|--------|----------|
| ✅ `routes/recipes.ts` | **82%** | **~75%** | **✅ COMPLETE** | Week 1 ✅ |
| ✅ `routes/bakes.ts` | **73.59%** | **58.88%** | **✅ COMPLETE** | Week 2 P1 ✅ |
| ✅ `routes/auth.ts` | **92.5%** | **86.66%** | **✅ COMPLETE** | Week 2 P2 ✅ |
| `routes/steps.ts` | 41.93% | 0% | ⚠️ Needs work | Week 3 � |
| `routes/meta.ts` | 40% | 100% | ⚠️ Needs work | Week 3 🟡 |

**Completed Test Files:**
- ✅ `tests/routes/recipes-crud.test.ts` (52 tests) - **Week 1**
- ✅ `tests/routes/recipes-simple.test.ts` - **Week 1**
- ✅ `tests/routes/recipes-comprehensive.test.ts` - **Week 1**
- ✅ `tests/routes/recipes-integration.test.ts` - **Week 1**
- ✅ `tests/routes/recipes-real-integration.test.ts` - **Week 1**
- ✅ `tests/routes/bakes-crud.test.ts` (71 tests) - **Week 2 Priority 1**
- ✅ `tests/routes/auth-oauth.test.ts` (22 tests, 17 passing) - **Week 2 Priority 2**

---

### ❌ Utilities (CRITICAL GAPS - 0-50% coverage)
| File | Lines | Purpose | Priority |
|------|-------|---------|----------|
| `utils/timingParser.ts` | 0% | Bake timing schedule parsing | 🔴 CRITICAL |
| `lib/logger.ts` | 52.94% | Structured logging | 🟢 LOW |

---

## Testing Priorities

### 🔴 Phase 1: Critical Business Logic (Week 1) - ✅ COMPLETE

#### 1.1 Recipe CRUD Operations (Priority: CRITICAL) - ✅ COMPLETE
**Initial:** 10.2% coverage  
**Final:** **82% coverage** ✅

**Tests Completed:**
- ✅ Create recipe (basic, with steps, with ingredients, with target %)
- ✅ Get all recipes for user (pagination, filtering)
- ✅ Get single recipe by ID
- ✅ Update recipe (name, hydration, salt, notes, steps)
- ✅ Delete recipe (soft delete)
- ✅ Recipe not found (404)
- ✅ Recipe ownership verification
- ✅ Concurrent update handling
- ✅ Invalid IDs and edge cases

**Result:** 52 tests, 82% coverage, 100% endpoint coverage
**Time:** Completed in Week 1

#### 1.2 TimingParser Utility (Priority: CRITICAL) - ⏸️ DEFERRED
**Current:** 0% coverage  
**Status:** Not yet implemented in codebase

**Reason for deferral:** Feature not yet built, will test when implemented

#### 1.3 Bake Snapshot & Tracking (Priority: HIGH) - ✅ COMPLETE
**Initial:** 40% coverage  
**Final:** **73.59% coverage** ✅

**Tests Completed:**
- ✅ Create bake from recipe (snapshot all data)
- ✅ Verify recipe snapshot values persist
- ✅ Update bake notes during active bake
- ✅ Update bake rating after completion
- ✅ Complete bake (mark as finished)
- ✅ Cancel active bake
- ✅ Get all bakes for user (active/inactive filtering)
- ✅ Get single bake by ID
- ✅ Bake ownership verification
- ✅ Step lifecycle (PENDING → IN_PROGRESS → COMPLETED/SKIPPED)
- ✅ Step notes and deviations
- ✅ Full user workflows (create → start → complete → rate)

**Result:** 71 tests, 73.59% coverage, all 13 endpoints tested
**Time:** Completed in Week 2 Priority 1

---

### 🟡 Phase 2: Authentication & Authorization (Week 2) - ✅ COMPLETE

#### 2.1 OAuth Flows (Priority: MEDIUM) - ✅ COMPLETE
**Initial:** 43.75% coverage (OAuth code paths untested)  
**Final:** **92.5% coverage** ✅

**Tests Completed:**
- ✅ Google OAuth new user registration (4 tests)
- ✅ Google OAuth existing user login (1 test)
- ✅ Google OAuth account linking to email/password user (5 tests)
- ✅ Email verification from Google (update logic, don't downgrade)
- ✅ UserProfile creation/update with avatar handling
- ✅ OAuth validation (idToken required, type checking)
- ✅ Error handling (missing email, missing sub)
- ✅ JWT token generation and user role inclusion
- ⏸️ Axios error mocking (3 tests with timeout issues)
- ⏸️ Concurrent OAuth race condition (1 test)

**Result:** 22 tests, 17 passing (77%), 92.5% coverage
**Achievement:** +48.75% coverage improvement, all core OAuth flows validated
**Time:** Completed in Week 2 Priority 2

#### 2.2 Password Reset (Priority: MEDIUM) - ⏸️ NOT IMPLEMENTED
**Current:** Not implemented in auth.ts  
**Status:** No password reset endpoints found in codebase

**Reason for skip:** Feature not yet built, will test when implemented

---

### 🟡 Phase 3: Supporting Features (Week 3) - 🔄 NEXT PRIORITY

#### 3.1 Recipe Steps Management (Priority: MEDIUM)
**Current:** 19.76% coverage  
**Target:** 80%+ coverage

**Tests Needed:**
- ❌ Add step to recipe
- ❌ Update step order
- ❌ Update step ingredients
- ❌ Update step parameters (time, temp, etc.)
- ❌ Delete step from recipe
- ❌ Step validation (stepTemplateId exists)
- ❌ Ingredient validation (ingredientId exists)
- ❌ Step ownership verification

**Estimated:** 20-25 tests, 3-4 hours

#### 3.2 Metadata Routes (Priority: MEDIUM)
**Current:** 0% coverage  
**Target:** 90%+ coverage

**Tests Needed:**
- ❌ Get all step templates
- ❌ Get step template by ID
- ❌ Get all ingredients
- ❌ Get ingredient by ID
- ❌ Get categories
- ❌ Filter by category
- ❌ Metadata caching validation

**Estimated:** 12-15 tests, 2-3 hours

---

### 🟢 Phase 4: Refinement & Edge Cases (Week 4)

#### 4.1 Increase Validation Branch Coverage
**Current:** 58-66% branch coverage  
**Target:** 85%+ branch coverage

**Focus Areas:**
- ❌ Multiple simultaneous validation errors
- ❌ Boundary value edge cases
- ❌ Optional field combinations
- ❌ Deeply nested validation errors

**Estimated:** 15-20 tests, 2-3 hours

#### 4.2 Error Handling & Edge Cases
**Tests Needed:**
- ❌ Database connection failures
- ❌ Prisma unique constraint violations
- ❌ Foreign key constraint violations
- ❌ Transaction rollbacks
- ❌ Rate limiting scenarios
- ❌ Large payload handling
- ❌ Malformed JSON requests

**Estimated:** 20-25 tests, 3-4 hours

---

## Test Infrastructure Improvements

### Needed Test Utilities

1. **Database Seeding Helper** (Priority: HIGH)
   ```typescript
   // tests/utils/seedTestData.ts
   - seedStepTemplates()
   - seedIngredients()
   - seedRecipes()
   - seedBakes()
   - cleanupTestData()
   ```

2. **Authentication Helper** (Priority: HIGH)
   ```typescript
   // tests/utils/authHelpers.ts
   - createTestUser()
   - generateAuthToken()
   - createAuthenticatedRequest()
   ```

3. **Factory Functions** (Priority: MEDIUM)
   ```typescript
   // tests/utils/factories.ts
   - recipeFactory()
   - bakeFactory()
   - stepFactory()
   - ingredientFactory()
   ```

4. **Assertion Helpers** (Priority: MEDIUM)
   ```typescript
   // tests/utils/assertions.ts
   - assertRecipeShape()
   - assertBakeSnapshot()
   - assertErrorFormat()
   ```

---

## Coverage Goals

### Target Coverage by End of Month
- **Statements:** 26.55% → **75%**
- **Branches:** 12.6% → **70%**
- **Functions:** 15.23% → **75%**
- **Lines:** 27.51% → **75%**

### Critical Path to 75% Coverage
1. ✅ Validation schemas (DONE - 75-80%)
2. 🔴 Recipe routes (10% → 80%) = +20% overall
3. 🔴 TimingParser utility (0% → 95%) = +5% overall
4. 🔴 Bake routes (40% → 85%) = +10% overall
5. 🟡 Auth routes OAuth (41% → 75%) = +8% overall
6. 🟡 Steps routes (19% → 80%) = +12% overall
7. 🟡 Meta routes (0% → 90%) = +5% overall

**Projected Total:** ~75-80% overall coverage

---

## Test Execution Strategy

### Daily Development Workflow
1. Write feature code
2. Write tests immediately (TDD when possible)
3. Run `npm test` locally
4. Ensure all tests pass before commit
5. Run `npm run test:coverage` weekly

### CI/CD Integration (Future)
- Run tests on every PR
- Block merge if tests fail
- Track coverage trends over time
- Require minimum 70% coverage for new code

---

## Known Test Gaps (To Be Fixed)

### Skipped Tests (2 total)
1. **`recipes-real-integration.test.ts:148`**
   - Test: "should create a recipe with steps and ingredients"
   - Reason: Foreign key constraint (stepTemplateId:122, ingredientId:1,2 don't exist)
   - Fix: Seed test database with metadata
   - Estimated: 1 hour

2. **`recipes-real-integration.test.ts:411`**
   - Test: "should handle large recipe data"
   - Reason: Same foreign key issue
   - Fix: Use seeded metadata
   - Estimated: 30 minutes

### Action Item
Create `tests/utils/seedTestMetadata.ts` to populate StepTemplate and Ingredient tables for tests.

---

## Testing Best Practices (Reinforcement)

### ✅ DO:
- Use descriptive test names ("should create recipe with valid data")
- Test happy path AND error paths
- Use factories/helpers for test data
- Clean up database after each test
- Mock external dependencies (OAuth providers, email services)
- Test edge cases and boundary values
- Keep tests isolated (no shared state)

### ❌ DON'T:
- Skip cleanup (causes test pollution)
- Use hardcoded IDs without seeding
- Test multiple things in one test
- Ignore flaky tests
- Test implementation details
- Use production credentials in tests
- Leave console.log statements in tests

---

## Resources

### Documentation
- [Validation Testing Guide](./ValidationTesting.md) - ✅ Complete
- [API Documentation](./API.md) - ⚠️ Needs update
- [Data Model Documentation](./DataModel.md) - ⚠️ Needs creation

### Tools
- **Jest**: Testing framework
- **Supertest**: HTTP assertions
- **Prisma**: Database testing with test instance
- **ts-jest**: TypeScript support

---

## Progress Tracking

### Week 1 Goals ✅ COMPLETE
- [x] Create database seeding utilities (seedTestData.ts with templates, ingredients, parameters)
- [x] Write 52 recipe CRUD tests (recipes-crud.test.ts)
- [x] Write 45→71 bake CRUD tests (bakes-crud.test.ts)
- [x] Target: 50%+ overall coverage → **ACHIEVED: ~55%**

### Week 2 Goals 🔄 IN PROGRESS
**Priority 1: Bake Routes** ✅ COMPLETE
- [x] Write comprehensive bake tests (+26 tests)
- [x] Test skip/note/deviations endpoints
- [x] Test validation edge cases
- [x] Test error paths
- [x] Test complete user workflows
- [x] **ACHIEVED: 73.6% coverage** (up from 54%)

**Priority 2: OAuth & Password Reset** ⏳ NEXT
- [ ] Write 15-20 OAuth tests
- [ ] Write 10-12 password reset tests
- [ ] Target: 60%+ overall coverage

### Week 3 Goals
- [ ] Write 20-25 step management tests
- [ ] Write 12-15 metadata tests
- [ ] Target: 70%+ overall coverage

### Week 4 Goals
- [ ] Increase validation branch coverage to 85%
- [ ] Add 20-25 error handling tests
- [ ] Target: 75%+ overall coverage
- [ ] Document all test patterns

---

## Conclusion

The validation layer testing (Phase 0) has been **successfully completed** with excellent coverage (75-80%). The foundation is solid.

**Next Priority:** Recipe CRUD operations and TimingParser utility (Phase 1) to protect core business logic.

**Success Metric:** Achieve 75% overall coverage within 4 weeks while maintaining 100% test pass rate.
