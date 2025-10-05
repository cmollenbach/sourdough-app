# 📚 Developer Quick Reference - Sourdough App

## 🎯 What You Asked For

> "I would like to ensure that the web and mobile versions can be maintained and developed with as little overhead as possible going forward."

## ✅ What's Been Set Up

### 1. **Documentation Created**
- ✅ `README.md` - Project overview, tech stack, getting started
- ✅ `.copilot-context.md` - Deployment info, environment variables, current status
- ✅ `.github/copilot-instructions.md` - Updated with monorepo structure
- ✅ `.github/copilot-instructions-mobile.md` - **NEW** - Complete code sharing strategy
- ✅ `docs/MobileDeployment.md` - 3-week React Native deployment plan

### 2. **Copilot Instructions Enhanced**
- ✅ Monorepo structure defined
- ✅ Code sharing rules (70% shared, 30% platform-specific)
- ✅ Clear guidelines on what to share vs. what to keep separate
- ✅ Migration checklist for moving code to `shared/`
- ✅ Common patterns and anti-patterns
- ✅ Platform abstraction examples

### 3. **Architecture Decisions Documented**
- ✅ Shared directory structure planned
- ✅ Import patterns defined (`@sourdough/shared`)
- ✅ Platform service interfaces designed
- ✅ Maintenance workflows documented

## 📋 Before You Start Mobile Development

### Immediate Prerequisites (Do These BEFORE Creating Mobile App)

#### 1. Create Shared Directory Structure

```bash
cd sourdough-app
mkdir -p shared/{types,utils,hooks,api,constants}
cd shared
npm init -y
```

#### 2. Configure shared/package.json

```json
{
  "name": "@sourdough/shared",
  "version": "1.0.0",
  "main": "index.ts",
  "types": "index.ts",
  "dependencies": {
    "axios": "^1.6.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0"
  }
}
```

#### 3. Create shared/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Files to Migrate First (Priority Order)

#### High Priority - Do These First ✅

1. **Types** (Easiest)
```bash
# Copy all type files
cp -r frontend/src/types/* shared/types/

# Update extension to .types.ts
mv shared/types/recipe.ts shared/types/recipe.types.ts
mv shared/types/bake.ts shared/types/bake.types.ts
mv shared/types/user.ts shared/types/user.types.ts
```

2. **Timing Parser** (Critical for mobile notifications)
```bash
cp frontend/src/utils/timingParser.ts shared/utils/
```

3. **API Client** (Required for data fetching)
```bash
cp frontend/src/utils/api.ts shared/api/client.ts
# Edit to remove Vite-specific imports (import.meta.env)
```

4. **Calculation Utilities**
```bash
# Copy baker's percentage calculations, hydration, etc.
cp frontend/src/utils/calculations.ts shared/utils/ # (if exists)
```

5. **React Hooks** (After API client is set up)
```bash
cp frontend/src/hooks/useRecipes.ts shared/hooks/
cp frontend/src/hooks/useBakes.ts shared/hooks/
```

#### Medium Priority - Do These Next 📝

6. Constants and configuration
7. Validation utilities
8. Formatting utilities
9. Date/time helpers

## 🔄 Migration Workflow (Step-by-Step)

### Example: Migrating timingParser.ts

```bash
# 1. Copy file to shared
cp frontend/src/utils/timingParser.ts shared/utils/

# 2. Update imports in shared file (if needed)
# Open shared/utils/timingParser.ts
# Change: import { Recipe } from '../types/recipe';
# To:     import { Recipe } from '../types/recipe.types';

# 3. Link shared package to frontend
cd frontend
npm install file:../shared

# 4. Update frontend imports
# Find all uses of timingParser in frontend:
# Change: import { parseTimingPlan } from '../utils/timingParser';
# To:     import { parseTimingPlan } from '@sourdough/shared/utils/timingParser';

# 5. Test that web app still works
npm run dev

# 6. Delete old file (after verifying)
rm src/utils/timingParser.ts

# 7. Commit the change
git add .
git commit -m "refactor: Migrate timingParser to shared package"
```

## 🎯 When to Do What

### ✅ Do THIS Before Mobile Development

**Week 1 (Setup):**
1. Create `shared/` directory ✅
2. Configure package.json and tsconfig ✅
3. Migrate types (recipe.types.ts, bake.types.ts, user.types.ts) ✅
4. Migrate timingParser.ts ✅
5. Test web app still works ✅

**Week 2 (Core Logic):**
6. Migrate API client ✅
7. Migrate React hooks (useRecipes, useBakes) ✅
8. Migrate calculation utilities ✅
9. Test everything still works ✅

**Week 3 (Ready for Mobile):**
10. Create React Native project ✅
11. Link shared package to mobile ✅
12. Test importing shared code in mobile ✅

### ❌ DON'T Do This (Common Mistakes)

- ❌ Start mobile app BEFORE setting up shared directory
- ❌ Duplicate code in mobile that already exists in frontend
- ❌ Put UI components in shared (they won't work on both platforms)
- ❌ Use DOM APIs in shared code
- ❌ Use React Native APIs in shared code

## 📝 Quick Commands Reference

### Check What Can Be Shared
```bash
# Find all TypeScript files in frontend
find frontend/src -name "*.ts" -o -name "*.tsx" | grep -v ".test.ts"

# Find utilities (good candidates for sharing)
ls frontend/src/utils/

# Find hooks (good candidates for sharing)
ls frontend/src/hooks/

# Find types (MUST be shared)
ls frontend/src/types/
```

### Set Up Shared Package
```bash
mkdir -p shared/{types,utils,hooks,api,constants}
cd shared
npm init -y
npm install axios date-fns
npm install -D typescript @types/node
npx tsc --init
```

### Link Shared to Frontend
```bash
cd frontend
npm install file:../shared

# Verify it's linked
ls node_modules/@sourdough/
# Should show: shared/
```

### Link Shared to Mobile (Future)
```bash
cd mobile
npm install file:../shared

# Verify it's linked
ls node_modules/@sourdough/
# Should show: shared/
```

## 🧪 Testing Strategy

### Shared Code Tests
```bash
# Create shared/tests/
mkdir -p shared/tests

# Example test for timing parser
# shared/tests/timingParser.test.ts
import { parseTimingPlan } from '../utils/timingParser';

test('parses stretch & fold timing', () => {
  const result = parseTimingPlan('S&F at 30, 60, 90 minutes');
  expect(result.events).toHaveLength(3);
  expect(result.events[0].timeMinutes).toBe(30);
});

# Run tests
cd shared
npm test
```

### Platform Tests
```bash
# Frontend tests (web-specific)
cd frontend
npm test

# Mobile tests (mobile-specific, future)
cd mobile
npm test
```

## 🚨 Warning Signs (Things to Watch For)

### 🔴 RED FLAGS - Stop and Refactor

1. **Duplicated Logic**
   - Same function in both `frontend/` and `mobile/`
   - → Move to `shared/`

2. **Import from Wrong Location**
   - `mobile/` importing from `frontend/`
   - → Should import from `shared/`

3. **Platform-Specific Code in Shared**
   - `document`, `window`, `Alert`, `Platform` in `shared/`
   - → Use platform abstraction

### 🟡 YELLOW FLAGS - Think Twice

1. **Complex UI Logic in Components**
   - Hard to reuse between platforms
   - → Extract to custom hook in `shared/hooks/`

2. **Hardcoded Values**
   - API URLs, timeouts, limits
   - → Move to `shared/constants/`

## ✅ Success Checklist

Before starting mobile development, ensure:

- [ ] `shared/` directory exists with proper structure
- [ ] `shared/package.json` configured
- [ ] `shared/tsconfig.json` configured
- [ ] Types migrated to `shared/types/`
- [ ] `timingParser.ts` migrated to `shared/utils/`
- [ ] API client migrated to `shared/api/`
- [ ] React hooks migrated to `shared/hooks/`
- [ ] Frontend linked to `shared/` package
- [ ] Frontend still works after migration
- [ ] All tests still pass
- [ ] Documentation updated (.copilot-context.md)
- [ ] README.md reflects new structure

## 📚 Documentation Files to Reference

### Before Writing ANY Code
1. **`.github/copilot-instructions.md`** - General coding standards
2. **`.github/copilot-instructions-mobile.md`** - Code sharing rules

### When Migrating Code
3. **Migration Checklist** (in copilot-instructions-mobile.md)
4. **Common Patterns** (in copilot-instructions-mobile.md)

### When Building Mobile Features
5. **`docs/MobileDeployment.md`** - React Native setup
6. **Mobile-Specific Guidelines** (in copilot-instructions-mobile.md)

## 🎓 Learning Resources

### Code Sharing Best Practices
- **Read**: `.github/copilot-instructions-mobile.md` (sections: Code Sharing Strategy, Common Patterns)
- **Example**: Pattern 1 (API Call with Hook) - shows perfect shared code structure

### React Native
- **Read**: `docs/MobileDeployment.md` (Phase 3: Core Features Implementation)
- **Docs**: https://reactnative.dev/
- **Expo**: https://docs.expo.dev/

### Notifications (Critical for Mobile)
- **Read**: `docs/MobileDeployment.md` (Phase 4: Alarm & Notification System)
- **Library**: https://github.com/zo0r/react-native-push-notification

## 🚀 Next Steps (Recommended Order)

1. **Read** `.github/copilot-instructions-mobile.md` completely (15 min)
2. **Create** `shared/` directory structure (5 min)
3. **Migrate** types first (10 min)
4. **Migrate** timingParser (15 min)
5. **Test** web app still works (5 min)
6. **Commit** changes (2 min)
7. **Repeat** for other utilities

**Total time to set up:** ~1-2 hours

**Time saved in mobile development:** ~20-40 hours (not duplicating code)

---

## 💡 Pro Tips

1. **Migrate incrementally** - Don't try to move everything at once
2. **Test after each migration** - Catch issues early
3. **Use TypeScript strict mode** - Catches errors during migration
4. **Write tests for shared code** - Runs on both platforms
5. **Keep commits small** - Easy to revert if something breaks
6. **Update imports gradually** - Use find/replace carefully

---

**You're now ready to build a maintainable multi-platform app!** 🎉

Questions? Refer to:
- `.github/copilot-instructions-mobile.md` - Code sharing strategy
- `docs/MobileDeployment.md` - Mobile setup guide
- `.copilot-context.md` - Current project status
