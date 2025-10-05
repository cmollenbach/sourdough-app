# 🧪 Automated User Testing Guide

**For:** Loafly Sourdough Baking App  
**Date:** October 5, 2025  
**Testing Stack:** Vitest + Playwright + GitHub Actions

---

## 🎯 Testing Strategy

### Test Pyramid

```
        /\
       /  \    E2E Tests (Playwright)
      /____\   - Critical user flows
     /      \  Integration Tests (Vitest)
    /        \ - Component interactions
   /__________\ Unit Tests (Vitest + RTL)
                - Individual components
```

**Current Status:**
- ✅ Unit Tests: 13 tests (Vitest + React Testing Library)
- ⏳ Integration Tests: Needed
- ⏳ E2E Tests: Not set up yet

---

## 🚀 Quick Start: Add E2E Testing

### Option 1: Playwright (Recommended)

**Why Playwright?**
- ✅ Fast and reliable
- ✅ Cross-browser testing (Chrome, Firefox, Safari)
- ✅ Great React support
- ✅ Built-in video recording
- ✅ Parallel execution

**Installation:**

```powershell
# From frontend directory
cd frontend
npm install -D @playwright/test
npx playwright install
```

**Configuration:**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### Option 2: Cypress (Alternative)

**Why Cypress?**
- ✅ Great developer experience
- ✅ Time-travel debugging
- ✅ Real-time reloads
- ✅ Visual test runner

**Installation:**

```powershell
cd frontend
npm install -D cypress
npx cypress open
```

---

## 📝 Example Tests for Your Sourdough App

### 1. Recipe Creation Flow (Playwright)

```typescript
// e2e/recipe-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Recipe Creation', () => {
  test('should create a new sourdough recipe', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Login (or skip if testing locally)
    await page.getByRole('button', { name: 'New Recipe' }).click();
    
    // Fill recipe details
    await page.getByLabel('Recipe Name').fill('Classic Sourdough');
    await page.getByLabel('Flour Weight (g)').fill('500');
    await page.getByLabel('Hydration (%)').fill('75');
    
    // Add steps
    await page.getByRole('button', { name: 'Add Step' }).click();
    await page.getByLabel('Step Type').selectOption('Autolyse');
    
    // Save recipe
    await page.getByRole('button', { name: 'Save Recipe' }).click();
    
    // Verify success
    await expect(page.getByText('Recipe saved successfully')).toBeVisible();
    await expect(page.getByText('Classic Sourdough')).toBeVisible();
  });
  
  test('should validate required fields', async ({ page }) => {
    await page.goto('/recipes/new');
    
    // Try to save without required fields
    await page.getByRole('button', { name: 'Save Recipe' }).click();
    
    // Check for validation errors
    await expect(page.getByText('Recipe name is required')).toBeVisible();
  });
});
```

---

### 2. Bake Tracking Flow

```typescript
// e2e/bake-tracking.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Bake Tracking', () => {
  test('should start and track a bake', async ({ page }) => {
    await page.goto('/recipes');
    
    // Select a recipe
    await page.getByText('Classic Sourdough').click();
    
    // Start bake
    await page.getByRole('button', { name: 'Start Bake' }).click();
    await expect(page.getByText('Bake started')).toBeVisible();
    
    // Check timeline is displayed
    await expect(page.getByText('Bulk Fermentation')).toBeVisible();
    await expect(page.getByText('Next: S&F in')).toBeVisible();
    
    // Complete a step
    await page.getByRole('button', { name: 'Mark Complete' }).first().click();
    await expect(page.getByText('Step completed')).toBeVisible();
  });
  
  test('should show notifications for stretch & fold', async ({ page, context }) => {
    // Grant notification permissions
    await context.grantPermissions(['notifications']);
    
    await page.goto('/bakes/active');
    
    // Wait for S&F notification (or mock the timer)
    // In real tests, you'd mock the timer or use a test recipe with short intervals
    await expect(page.getByText('Time to stretch & fold!')).toBeVisible();
  });
});
```

---

### 3. Timing Plan Parser

```typescript
// e2e/timing-parser.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Timing Plan Parser', () => {
  test('should parse natural language timing', async ({ page }) => {
    await page.goto('/recipes/new');
    
    // Add bulk fermentation step
    await page.getByRole('button', { name: 'Add Step' }).click();
    await page.getByLabel('Step Type').selectOption('Bulk Fermentation');
    
    // Enter timing plan
    await page.getByLabel('Timing Plan').fill('S&F at 30, 60, 90, 120 minutes');
    
    // Verify parsed schedule is displayed
    await expect(page.getByText('4 folds scheduled')).toBeVisible();
    await expect(page.getByText('30 min')).toBeVisible();
    await expect(page.getByText('60 min')).toBeVisible();
  });
});
```

---

## 🔄 Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm install
      
      - name: Run backend tests
        run: npm run test:backend
      
      - name: Run frontend unit tests
        run: npm run test:frontend

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm install
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Build app
        run: npm run build:frontend
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## 📊 Test Coverage Goals

| Test Type | Current | Target | Priority |
|-----------|---------|--------|----------|
| Backend Unit | 98.7% | 95%+ | ✅ Met |
| Frontend Unit | ~30% | 60%+ | 🔴 High |
| E2E Critical Paths | 0% | 100% | 🔴 High |
| Integration | 0% | 50%+ | 🟡 Medium |

---

## 🎯 Critical User Flows to Test

### High Priority (Must Have)

1. **Authentication**
   - ✅ Register new user
   - ✅ Login with email/password
   - ✅ Login with Google OAuth
   - ✅ Logout

2. **Recipe Management**
   - ✅ Create new recipe
   - ✅ Edit recipe
   - ✅ Delete recipe
   - ✅ View recipe list

3. **Bake Tracking**
   - ✅ Start bake from recipe
   - ✅ View active bake timeline
   - ✅ Mark steps complete
   - ✅ Receive S&F notifications
   - ✅ Complete bake

4. **Recipe Builder**
   - ✅ Add/remove steps
   - ✅ Add/remove ingredients
   - ✅ Calculate baker's percentages
   - ✅ Parse timing plan

### Medium Priority (Should Have)

5. **Bake History**
   - View past bakes
   - Filter by recipe
   - Add bake notes
   - Rate bake

6. **Advanced Features**
   - Dark mode toggle
   - Advanced mode toggle
   - Entity requests
   - Ingredient management

---

## 🛠️ Recommended Testing Tools

### Unit Testing (Current ✅)
```json
{
  "vitest": "^3.2.4",
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.6.4"
}
```

### E2E Testing (Recommended)
```json
{
  "@playwright/test": "^1.40.0"
}
```

### Visual Testing (Optional)
```json
{
  "@percy/playwright": "^1.0.0"
}
```

### API Testing (Optional)
```json
{
  "supertest": "^7.1.4"  // ✅ Already have in backend
}
```

---

## 📝 Adding Tests to package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 🔍 Test Data Management

### Mock Data Strategy

```typescript
// frontend/src/test/fixtures/recipes.ts
export const mockRecipe = {
  id: 1,
  name: 'Test Sourdough',
  userId: 1,
  flourWeight: 500,
  steps: [
    {
      id: 1,
      stepTemplateId: 1,
      order: 1,
      fields: [],
      ingredients: [
        {
          id: 1,
          ingredientId: 1,
          amount: 100,
          calculationMode: 'PERCENTAGE'
        }
      ]
    }
  ]
};
```

### Database Seeding for E2E

```typescript
// e2e/helpers/seed.ts
export async function seedTestData() {
  // Create test user
  const user = await createTestUser({
    email: 'test@example.com',
    password: 'password123'
  });
  
  // Create test recipe
  const recipe = await createTestRecipe({
    userId: user.id,
    name: 'E2E Test Recipe'
  });
  
  return { user, recipe };
}

// Use in tests
test.beforeEach(async () => {
  await seedTestData();
});

test.afterEach(async () => {
  await cleanupTestData();
});
```

---

## 🚀 Quick Setup Commands

```powershell
# 1. Add Playwright to frontend
cd frontend
npm install -D @playwright/test
npx playwright install

# 2. Create test directory
mkdir e2e
mkdir e2e/fixtures

# 3. Initialize Playwright config
npx playwright install --help

# 4. Run first test
npx playwright test

# 5. View test report
npx playwright show-report
```

---

## 📚 Resources

- **Playwright Docs:** https://playwright.dev
- **Vitest Guide:** https://vitest.dev/guide/
- **React Testing Library:** https://testing-library.com/react
- **Testing Best Practices:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

---

## ✅ Next Steps

1. **Immediate:**
   - Fix Netlify deployment (update netlify.toml ✅)
   - Install Playwright
   - Write first E2E test (recipe creation)

2. **Short-term (This Week):**
   - Add 3-5 critical path E2E tests
   - Increase frontend unit test coverage to 40%
   - Set up GitHub Actions CI

3. **Medium-term (Next 2 Weeks):**
   - Visual regression testing with Percy
   - Performance testing
   - Accessibility testing

4. **Long-term:**
   - Automated smoke tests on production
   - Load testing for API
   - Cross-browser testing suite

---

**Last Updated:** October 5, 2025  
**Maintained by:** Development Team
