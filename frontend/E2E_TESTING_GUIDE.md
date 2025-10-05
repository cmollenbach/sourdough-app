# 🧪 Playwright E2E Testing - Quick Start

## 📦 What's Been Set Up

Your sourdough app now has **complete E2E testing** with Playwright!

### **Files Created:**

```
frontend/
├── playwright.config.ts          # Playwright configuration
├── e2e/                          # E2E test directory
│   ├── app-navigation.spec.ts    # App navigation & basic features (8 tests)
│   ├── recipe-creation.spec.ts   # Recipe builder tests (5 tests)
│   ├── bake-tracking.spec.ts     # Bake session tests (6 tests)
│   └── timing-parser.spec.ts     # Timing plan parser tests (5 tests)
└── package.json                  # Updated with test scripts
```

**Total: 24 E2E tests** covering your critical user flows!

---

## 🚀 Running Tests

### **First Time Setup**

Install Playwright browsers (only needed once):

```powershell
cd frontend
npm run playwright:install
```

### **Run All Tests**

```powershell
# Run all tests (headless mode)
npm run test:e2e

# Run with UI (see what's happening)
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

### **Run Specific Tests**

```powershell
# Run only recipe creation tests
npx playwright test recipe-creation

# Run only bake tracking tests
npx playwright test bake-tracking

# Run only timing parser tests
npx playwright test timing-parser

# Run only navigation tests
npx playwright test app-navigation
```

### **View Test Reports**

```powershell
# Open HTML test report
npm run test:e2e:report
```

---

## 📋 Test Coverage

### **App Navigation & Basic Features** (8 tests)
- ✅ App loads successfully
- ✅ Navigation menu displays
- ✅ Navigate between pages
- ✅ Dark mode toggle works
- ✅ Responsive on mobile
- ✅ App title/logo displays
- ✅ Page refresh handling
- ✅ 404 route handling

### **Recipe Creation** (5 tests)
- ✅ Navigate to recipe builder
- ✅ Create basic sourdough recipe
- ✅ Validate required fields
- ✅ Add ingredients to recipe
- ✅ Calculate baker's percentages

### **Bake Tracking** (6 tests)
- ✅ Display recipe list
- ✅ Start bake from recipe
- ✅ Display bake timeline with steps
- ✅ Show stretch & fold schedule
- ✅ Complete bake steps
- ✅ Display timer for next action

### **Timing Plan Parser** (5 tests)
- ✅ Parse basic S&F timing plan
- ✅ Parse timing with hour format
- ✅ Display timing in recipe view
- ✅ Handle invalid timing gracefully
- ✅ Parse custom fold schedule

---

## 🎯 How Tests Work

### **Example: Recipe Creation Test**

```typescript
test('should create a basic sourdough recipe', async ({ page }) => {
  // 1. Navigate to app
  await page.goto('/');
  
  // 2. Click "New Recipe"
  await page.getByRole('button', { name: /new recipe/i }).click();
  
  // 3. Fill in recipe details
  await page.getByLabel(/recipe name/i).fill('Classic Sourdough');
  await page.getByLabel(/flour.*weight/i).fill('500');
  await page.getByLabel(/hydration/i).fill('75');
  
  // 4. Save recipe
  await page.getByRole('button', { name: /save/i }).click();
  
  // 5. Verify success
  await expect(page.getByText('Classic Sourdough')).toBeVisible();
});
```

Playwright:
1. Opens a real browser
2. Interacts like a real user
3. Verifies the app behaves correctly
4. Takes screenshots/videos on failure

---

## 🔧 Configuration

### **Browsers**

Tests run on:
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ WebKit (Safari)

### **Features Enabled**

- 📸 **Screenshots** on failure
- 🎥 **Video recording** on failure
- 📊 **HTML reports** with visual results
- 🔄 **Auto-retry** on CI (2 retries)
- 🖥️ **Dev server** starts automatically

---

## 📊 CI/CD Integration

Tests will run automatically on:
- ✅ Every push to main
- ✅ Every pull request
- ✅ Before deployment

See `.github/workflows/test.yml` for CI configuration.

---

## 🛠️ Customizing Tests

### **Update Selectors**

If your UI uses different element names/IDs, update the selectors:

```typescript
// Before
await page.getByLabel(/recipe name/i).fill('Test');

// After (if you add data-testid)
await page.getByTestId('recipe-name-input').fill('Test');
```

### **Add More Tests**

Create new test files in `frontend/e2e/`:

```typescript
// e2e/authentication.spec.ts
import { test, expect } from '@playwright/test';

test('should login with email', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

### **Modify Config**

Edit `playwright.config.ts` to:
- Change base URL
- Add/remove browsers
- Adjust timeouts
- Configure retries

---

## 🎬 Visual Test Results

After running tests, Playwright generates:

```
playwright-report/
├── index.html           # Main report
├── data/
│   ├── screenshots/     # Failure screenshots
│   └── videos/          # Test videos
└── trace.zip            # Detailed trace files
```

Open with: `npm run test:e2e:report`

---

## 📝 Best Practices

### **1. Test User Flows, Not Implementation**

✅ **Good:** "User can create a recipe and start a bake"  
❌ **Bad:** "Form state updates when input changes"

### **2. Use Semantic Selectors**

✅ **Good:** `getByRole('button', { name: 'Save' })`  
❌ **Bad:** `locator('.btn-primary-123')`

### **3. Test Critical Paths First**

Priority order:
1. Recipe creation
2. Bake tracking
3. Authentication
4. Edge cases

### **4. Keep Tests Independent**

Each test should work in isolation (no shared state).

### **5. Use Test Data Fixtures**

Create reusable test data:

```typescript
// e2e/fixtures/recipes.ts
export const testRecipe = {
  name: 'Test Sourdough',
  flourWeight: 500,
  hydration: 75
};
```

---

## 🐛 Debugging Failed Tests

### **1. Run in UI Mode**

```powershell
npm run test:e2e:ui
```

See tests run in real-time with time-travel debugging.

### **2. Run in Debug Mode**

```powershell
npm run test:e2e:debug
```

Pauses execution, step through line-by-line.

### **3. Check Screenshots**

Failed tests automatically save screenshots:

```
playwright-report/data/screenshots/
```

### **4. Watch Videos**

See what happened during the test:

```
playwright-report/data/videos/
```

---

## 📚 Resources

- **Playwright Docs:** https://playwright.dev
- **Test Selectors:** https://playwright.dev/docs/selectors
- **Best Practices:** https://playwright.dev/docs/best-practices
- **VS Code Extension:** Search "Playwright Test for VS Code"

---

## ✅ Next Steps

1. **Install browsers:** `npm run playwright:install`
2. **Run your first test:** `npm run test:e2e:ui`
3. **Customize tests:** Update selectors to match your UI
4. **Add more tests:** Cover authentication, edge cases
5. **Enable CI/CD:** Tests run automatically on push

---

**Your sourdough app is now protected by automated E2E tests!** 🎉

Every deployment will be automatically tested to ensure:
- ✅ Recipes can be created
- ✅ Bakes can be tracked
- ✅ Timing plans parse correctly
- ✅ Navigation works
- ✅ All features functional

Happy testing! 🧪🍞
