# Testing Quick Reference

Quick reference guide for working with the test suite.

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/validation/auth.validation.test.ts

# Run tests matching pattern
npm test -- recipes

# Run with coverage report
npm run test:coverage

# Watch mode (auto-rerun on changes)
npm test -- --watch

# Run single test suite
npm test -- --testNamePattern="should create recipe"
```

---

## Test Structure

```
tests/
├── setup.ts                          # Global test configuration
├── utils/
│   ├── validationTestHelpers.ts      # Validation test utilities
│   └── seedTestData.ts               # Database seeding helpers
├── validation/
│   ├── auth.validation.test.ts       # Auth endpoint validation (60+ tests)
│   ├── recipe.validation.test.ts     # Recipe validation (50+ tests)
│   ├── bake.validation.test.ts       # Bake validation (40+ tests)
│   └── schema.unit.test.ts           # Direct Joi schema tests (30+ tests)
└── routes/
    └── recipes-real-integration.test.ts  # Full integration tests (13 tests)
```

---

## Common Test Patterns

### Validation Test
```typescript
import { createTestApp, assertions } from '../utils/validationTestHelpers';
import { registerSchema } from '../../src/schemas/auth';

it('should reject invalid email', async () => {
  const app = createTestApp(registerSchema, 'body');
  
  const response = await request(app)
    .post('/test')
    .send({ email: 'invalid-email', password: 'Test1234!' })
    .expect(400);
  
  assertions.isValidationError(response);
  assertions.hasFieldError(response, 'email');
});
```

### Integration Test
```typescript
import { seedTestMetadata } from '../utils/seedTestData';

beforeAll(async () => {
  await seedTestMetadata(); // Seed templates & ingredients
});

it('should create recipe', async () => {
  // Register & login
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'test@example.com', password: 'Test1234!' });
  
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'test@example.com', password: 'Test1234!' });
  
  const token = loginRes.body.token;
  
  // Test endpoint
  const response = await request(app)
    .post('/api/recipes')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test Recipe', totalWeight: 1000 })
    .expect(201);
  
  expect(response.body).toMatchObject({
    name: 'Test Recipe',
    totalWeight: 1000
  });
});
```

---

## Test Utilities Reference

### Validation Helpers
```typescript
import { 
  createTestApp,
  testSchema,
  extractValidationErrors,
  assertions 
} from '../utils/validationTestHelpers';

// Create isolated test Express app
const app = createTestApp(registerSchema, 'body');

// Test Joi schema directly (no HTTP)
const result = testSchema(registerSchema, { email: 'test@test.com' });

// Extract validation errors from response
const errors = extractValidationErrors(response);

// Common assertions
assertions.isValidationError(response);
assertions.hasMultipleErrors(response, 3);
assertions.hasFieldError(response, 'email');
```

### Database Seeding
```typescript
import {
  seedTestMetadata,
  createTestUser,
  createTestRecipe,
  cleanupTestData,
  generateTestEmail
} from '../utils/seedTestData';

// Seed all metadata (beforeAll)
await seedTestMetadata(); // Templates (122-127), Ingredients (1-5)

// Create test user
const user = await createTestUser({ 
  email: 'test@example.com' 
});

// Create test recipe
const recipe = await createTestRecipe(user.id, {
  name: 'Test Recipe',
  steps: [{
    stepTemplateId: 122,
    order: 1,
    ingredients: [{ ingredientId: 1, amount: 500 }]
  }]
});

// Generate unique email
const email = generateTestEmail('user'); // user-123456-abc@example.com

// Cleanup (afterEach or afterAll)
await cleanupTestData(); // Preserves metadata
await cleanupTestData(false); // Removes everything
```

---

## Seeded Test Data

### Step Templates (IDs 122-127)
- **122**: Test Autolyse (role: AUTOLYSE)
- **123**: Test Mix (role: MIX)
- **124**: Test Bulk Fermentation (role: BULK)
- **125**: Test Stretch & Fold (role: MIX)
- **126**: Test Shape (role: SHAPE)
- **127**: Test Proof (role: PROOF)

### Ingredients (IDs 1-5)
- **1**: Test Bread Flour (category: Flour)
- **2**: Test Water (category: Liquid)
- **3**: Test Salt (category: Seasoning)
- **4**: Test Sourdough Starter (category: Leavening)
- **5**: Test Whole Wheat Flour (category: Flour)

---

## Error Response Format

All validation errors follow this structure:

```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "statusCode": 400,
    "details": {
      "details": [
        {
          "message": "\"email\" must be a valid email",
          "path": ["email"],
          "type": "string.email"
        }
      ]
    }
  }
}
```

Access validation details:
```typescript
const errors = response.body.error?.details?.details || [];
const firstError = errors[0].message; // "\"email\" must be a valid email"
```

---

## Common Test Scenarios

### Test Missing Required Field
```typescript
it('should require field', async () => {
  const response = await request(app)
    .post('/test')
    .send({ /* field missing */ })
    .expect(400);
  
  assertions.hasFieldError(response, 'fieldName');
});
```

### Test Invalid Format
```typescript
it('should validate format', async () => {
  const response = await request(app)
    .post('/test')
    .send({ email: 'invalid' })
    .expect(400);
  
  assertions.hasFieldError(response, 'email');
});
```

### Test Boundary Values
```typescript
it('should enforce length limits', async () => {
  const tooLong = 'x'.repeat(256);
  
  const response = await request(app)
    .post('/test')
    .send({ name: tooLong })
    .expect(400);
  
  assertions.hasFieldError(response, 'name');
});
```

### Test Authentication
```typescript
it('should require authentication', async () => {
  const response = await request(app)
    .post('/api/recipes')
    .send({ name: 'Recipe' })
    .expect(401);
  
  expect(response.body.error.message).toContain('No token provided');
});
```

### Test Authorization
```typescript
it('should enforce ownership', async () => {
  const user1 = await createTestUser({ email: 'user1@test.com' });
  const user2 = await createTestUser({ email: 'user2@test.com' });
  const recipe = await createTestRecipe(user1.id);
  
  // User 2 tries to access User 1's recipe
  const response = await request(app)
    .get(`/api/recipes/${recipe.id}`)
    .set('Authorization', `Bearer ${user2Token}`)
    .expect(403);
});
```

---

## Debugging Tests

### Test Fails with "No token provided"
**Solution:** JWT_SECRET is set in `tests/setup.ts` before imports

### Test Fails with "Foreign key constraint"
**Solution:** Call `await seedTestMetadata()` in `beforeAll()`

### Test Returns Empty Error Object `{}`
**Solution:** Add `app.use(errorHandler)` as last middleware

### Tests Interfere with Each Other
**Solution:** Clean database in `beforeEach()`:
```typescript
beforeEach(async () => {
  await cleanupTestData();
});
```

### Error Format Doesn't Match
**Solution:** Use nested structure:
```typescript
response.body.error.details.details // Array of validation errors
response.body.error.message         // "Validation error"
```

---

## Best Practices

### ✅ DO:
- Use descriptive test names: `should create recipe with valid data`
- Test both happy path AND error paths
- Use factories/helpers for test data
- Clean up database after each test
- Use `expect.any(Number)` for generated IDs
- Test edge cases (empty strings, special characters, unicode)
- Keep tests isolated (no shared state)

### ❌ DON'T:
- Hardcode IDs (use seeding utilities)
- Skip cleanup (causes test pollution)
- Test multiple things in one test
- Use production credentials
- Leave `console.log` statements
- Ignore flaky tests
- Make tests dependent on execution order

---

## Coverage Thresholds

Current coverage goals:
- **Overall:** 75% (currently 27.51%)
- **Validation:** 75-80% ✅ (achieved)
- **Routes:** 70% (currently 10-40%)
- **Utilities:** 80% (currently 0-50%)

Check coverage:
```bash
npm run test:coverage
```

---

## Continuous Integration

Tests run automatically on:
- Every `git push`
- Pull requests to `main`
- Scheduled daily runs

CI Configuration:
```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test
  
- name: Check coverage
  run: npm run test:coverage
```

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests fail locally but pass in CI | Check Node version, clear node_modules |
| Slow test execution | Use `--maxWorkers=50%` flag |
| Random test failures | Check for shared state, add cleanup |
| Can't find test data | Verify seeding ran in beforeAll() |
| Wrong error format | Use nested: `response.body.error.details.details` |
| JWT errors | Ensure JWT_SECRET set in tests/setup.ts |

---

## Resources

- **Detailed Guide:** `docs/ValidationTesting.md`
- **Testing Strategy:** `docs/TestingRoadmap.md`
- **Summary Report:** `docs/TestingSummary.md`
- **Jest Docs:** https://jestjs.io/docs/getting-started
- **Supertest Docs:** https://github.com/ladjs/supertest

---

**Last Updated:** October 4, 2025
