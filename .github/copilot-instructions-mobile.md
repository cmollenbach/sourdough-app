# Mobile & Code Sharing Guidelines - Sourdough App

## Code Sharing Strategy (Web + Mobile)

### Directory Structure for Shared Code

```
sourdough-app/
├── shared/                    # NEW - Shared between web + mobile
│   ├── types/                 # TypeScript interfaces
│   │   ├── recipe.types.ts
│   │   ├── bake.types.ts
│   │   ├── user.types.ts
│   │   └── api.types.ts
│   ├── utils/                 # Platform-agnostic utilities
│   │   ├── timingParser.ts    # Parse timing plans
│   │   ├── calculations.ts    # Baker's percentages, hydration
│   │   ├── validators.ts      # Input validation
│   │   └── formatters.ts      # Date, number formatting
│   ├── hooks/                 # React hooks (work on both platforms)
│   │   ├── useRecipes.ts
│   │   ├── useBakes.ts
│   │   └── useAuth.ts
│   ├── api/                   # API client
│   │   ├── client.ts          # Axios/fetch wrapper
│   │   ├── recipes.api.ts
│   │   ├── bakes.api.ts
│   │   └── auth.api.ts
│   ├── constants/
│   │   └── config.ts          # Shared constants
│   └── package.json
│
├── frontend/                  # Web-specific
│   ├── src/
│   │   ├── components/        # React components (web UI)
│   │   ├── pages/             # Web pages
│   │   └── styles/            # Web-specific styles
│   └── package.json
│
└── mobile/                    # Mobile-specific
    ├── screens/               # React Native screens
    ├── components/            # Mobile UI components
    ├── services/              # Mobile-specific (notifications, etc.)
    └── package.json
```

### Rules for Shared Code

#### ✅ Code That SHOULD Be Shared:
- **Types/Interfaces**: All data models (Recipe, Bake, User, etc.)
- **Business Logic**: Calculations, validations, transformations
- **API Client**: HTTP requests to backend
- **Utilities**: Date formatting, baker's percentage calculations
- **React Hooks**: Data fetching, state management logic
- **Constants**: API URLs, configuration values

#### ❌ Code That SHOULD NOT Be Shared:
- **UI Components**: Web uses Tailwind, Mobile uses React Native components
- **Routing**: Web uses React Router, Mobile uses React Navigation
- **Platform-Specific**: Notifications (web uses PWA, mobile uses native)
- **Styling**: Completely different (CSS vs StyleSheet)

### How to Write Shareable Code

#### ✅ DO - Platform-Agnostic:
```typescript
// shared/utils/timingParser.ts
// ✅ Pure TypeScript - no DOM, no React Native APIs
export function parseTimingPlan(text: string): TimingSchedule {
  // Logic that works anywhere
  return {
    events: [...],
    totalDuration: 120
  };
}

// shared/api/recipes.api.ts
// ✅ Use axios (works on both web and mobile)
import axios from 'axios';

export async function getRecipes(): Promise<Recipe[]> {
  const response = await axios.get<Recipe[]>('/recipes');
  return response.data;
}

// shared/hooks/useRecipes.ts
// ✅ React hook - works on both platforms
import { useQuery } from '@tanstack/react-query';
import { getRecipes } from '../api/recipes.api';

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: getRecipes
  });
}
```

#### ❌ DON'T - Platform-Specific:
```typescript
// ❌ WRONG - Uses DOM APIs
export function showNotification(message: string) {
  document.getElementById('toast').innerText = message; // DOM only!
}

// ❌ WRONG - Uses React Native APIs
import { Alert } from 'react-native';
export function showAlert(message: string) {
  Alert.alert(message); // React Native only!
}

// ✅ CORRECT - Abstract platform differences
// shared/types/platform.types.ts
export interface PlatformServices {
  showNotification(message: string): void;
  scheduleAlarm(date: Date, message: string): void;
}

// Then implement per platform:
// frontend/src/services/platform.web.ts
// mobile/services/platform.mobile.ts
```

### Linking Shared Code in package.json

```json
// frontend/package.json
{
  "dependencies": {
    "@sourdough/shared": "file:../shared"
  }
}

// mobile/package.json
{
  "dependencies": {
    "@sourdough/shared": "file:../shared"
  }
}
```

### Import Pattern

```typescript
// In frontend or mobile:
import { Recipe, Bake } from '@sourdough/shared/types';
import { parseTimingPlan } from '@sourdough/shared/utils/timingParser';
import { useRecipes } from '@sourdough/shared/hooks/useRecipes';
```

---

## Mobile-Specific Guidelines (React Native)

### When to Follow These (Only in `mobile/` directory)

#### ✅ DO:
```typescript
// ✅ Use React Native components
import { View, Text, TouchableOpacity, FlatList } from 'react-native';

// ✅ Use StyleSheet for styling
import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' }
});

// ✅ Use platform-specific code when needed
import { Platform } from 'react-native';
const isAndroid = Platform.OS === 'android';

// ✅ Use React Navigation
import { useNavigation } from '@react-navigation/native';
const navigation = useNavigation();
navigation.navigate('RecipeDetail', { recipeId: 123 });

// ✅ Use React Native notifications
import PushNotification from 'react-native-push-notification';
PushNotification.localNotificationSchedule({
  date: new Date(Date.now() + 60 * 1000),
  message: 'Time for stretch & fold!'
});
```

#### ❌ DON'T:
```typescript
// ❌ NEVER use DOM elements in React Native
<div className="container"> // WRONG! Use <View>

// ❌ NEVER use CSS in React Native
style={{ margin: '10px' }} // WRONG! Use numbers: { margin: 10 }

// ❌ NEVER use web-specific libraries in mobile
import { useNavigate } from 'react-router-dom'; // WRONG! Use React Navigation
```

---

## Migration Checklist: Moving Code to Shared

When migrating existing code from `frontend/` to `shared/`:

### 1. Identify Shareable Code
- [ ] Does it have zero UI components?
- [ ] Does it avoid DOM/window/document?
- [ ] Does it avoid React Native-specific APIs?
- [ ] Is it pure logic, types, or API calls?

### 2. Move the File
```bash
# Example: Move timingParser.ts
mv frontend/src/utils/timingParser.ts shared/utils/timingParser.ts
```

### 3. Update Imports in Shared Code
```typescript
// Before (frontend-specific):
import { Recipe } from '../types/recipe';

// After (shared):
import { Recipe } from '../types/recipe.types';
```

### 4. Update Imports in Frontend
```typescript
// Before:
import { parseTimingPlan } from '../utils/timingParser';

// After:
import { parseTimingPlan } from '@sourdough/shared/utils/timingParser';
```

### 5. Test Both Platforms
- [ ] Web app still works
- [ ] Mobile app can import and use the shared code
- [ ] No build errors
- [ ] Unit tests still pass

---

## Key Principles for Maintainability

### 1. **Don't Repeat Yourself (DRY) - But Smart**
- ✅ Share business logic, types, API calls
- ❌ Don't try to share UI components (different paradigms)

### 2. **Write Once, Test Twice**
- ✅ Write tests for shared code that run on both platforms
- ✅ Test platform-specific implementations separately

### 3. **Keep Platform Code Thin**
- ✅ Most logic in `shared/`
- ✅ Platform code (`frontend/`, `mobile/`) should be mostly UI + platform services

### 4. **Type Safety Across the Stack**
```typescript
// Backend defines types via Prisma schema
// → Prisma generates types
// → Copy/sync to shared/types/ (manual or automated)
// → Both web and mobile import from shared/types/
```

### 5. **Single Source of Truth**
- ✅ API contracts: Backend Prisma schema
- ✅ Business logic: `shared/utils/`
- ✅ Data fetching: `shared/hooks/`
- ✅ UI implementation: Platform-specific

---

## Common Patterns

### Pattern 1: API Call with Hook

```typescript
// shared/api/recipes.api.ts
export async function getRecipe(id: number): Promise<Recipe> {
  const response = await axios.get(`/recipes/${id}`);
  return response.data;
}

// shared/hooks/useRecipe.ts
import { useQuery } from '@tanstack/react-query';
import { getRecipe } from '../api/recipes.api';

export function useRecipe(id: number) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(id)
  });
}

// frontend/src/pages/RecipeDetail.tsx (WEB)
import { useRecipe } from '@sourdough/shared/hooks/useRecipe';
function RecipeDetail({ recipeId }) {
  const { data: recipe, isLoading } = useRecipe(recipeId);
  return <div>{/* Web UI */}</div>;
}

// mobile/screens/RecipeDetailScreen.tsx (MOBILE)
import { useRecipe } from '@sourdough/shared/hooks/useRecipe';
function RecipeDetailScreen({ route }) {
  const { data: recipe, isLoading } = useRecipe(route.params.recipeId);
  return <View>{/* Mobile UI */}</View>;
}
```

### Pattern 2: Platform Abstraction

```typescript
// shared/types/platform.types.ts
export interface NotificationService {
  schedule(date: Date, title: string, message: string): void;
  cancel(id: string): void;
}

// frontend/src/services/notification.web.ts
export const notificationService: NotificationService = {
  schedule: (date, title, message) => {
    // Web implementation (Service Worker)
  },
  cancel: (id) => {
    // Web cancel
  }
};

// mobile/services/notification.mobile.ts
import PushNotification from 'react-native-push-notification';
export const notificationService: NotificationService = {
  schedule: (date, title, message) => {
    PushNotification.localNotificationSchedule({
      date, message, title
    });
  },
  cancel: (id) => {
    PushNotification.cancelLocalNotification(id);
  }
};
```

---

## Remember

**Goal**: Write business logic ONCE, implement UI TWICE (web + mobile)

**Ratio**: Aim for 70% shared code, 30% platform-specific UI

**Focus**: Keep `shared/` pure and platform-agnostic

**Test**: If code imports `react-native` or uses `document`, it shouldn't be in `shared/`

---

## Files to Migrate to Shared (Priority Order)

### High Priority (Do First)
1. `frontend/src/utils/timingParser.ts` → `shared/utils/timingParser.ts`
2. `frontend/src/types/` → `shared/types/`
3. `frontend/src/utils/api.ts` → `shared/api/client.ts`
4. `frontend/src/hooks/useRecipes.ts` → `shared/hooks/useRecipes.ts`
5. `frontend/src/hooks/useBakes.ts` → `shared/hooks/useBakes.ts`

### Medium Priority (Do Next)
6. Baker's percentage calculations
7. Hydration calculations
8. Date formatting utilities
9. Validation functions
10. Constants (API URLs, config)

### Low Priority (Nice to Have)
11. Error handling utilities
12. Logging wrappers
13. Test utilities

---

## Questions to Ask Before Adding Code

### Is This Shareable?
- ✅ Does it use only TypeScript standard library?
- ✅ Does it avoid DOM APIs?
- ✅ Does it avoid React Native APIs?
- ✅ Is it pure logic or data transformation?

If YES to all → Put in `shared/`

### Is This Platform-Specific?
- ❌ Does it render UI?
- ❌ Does it use platform-specific APIs (notifications, camera, etc.)?
- ❌ Does it handle navigation/routing?
- ❌ Does it use platform-specific styling?

If YES to any → Put in `frontend/` or `mobile/`

---

## Maintenance Workflows

### When Adding a New Feature

1. **Design**: Identify shared vs. platform-specific logic
2. **Shared First**: Write business logic in `shared/`
3. **Test Shared**: Write unit tests for shared code
4. **Implement Web**: Build web UI using shared logic
5. **Implement Mobile**: Build mobile UI using shared logic
6. **Integration Test**: Test on both platforms

### When Fixing a Bug

1. **Locate**: Is the bug in shared code or platform code?
2. **Fix Once**: If in `shared/`, fix benefits both platforms
3. **Test Both**: Verify fix on web and mobile
4. **Regression**: Add test to prevent recurrence

### When Refactoring

1. **Extract Shared**: Move duplicated logic to `shared/`
2. **Update Imports**: Fix imports in both platforms
3. **Verify**: Ensure both platforms still work
4. **Clean Up**: Remove old duplicate code

---

## Success Criteria

✅ **No duplicated business logic** between web and mobile  
✅ **Types are consistent** across platforms  
✅ **API calls happen once** in shared code  
✅ **70%+ code reuse** between platforms  
✅ **Easy to add new platforms** (e.g., desktop) in future  
✅ **Tests run once** for shared logic  
✅ **Changes to business logic** only need to happen once  

---

## Anti-Patterns to Avoid

### ❌ Duplicating Logic
```typescript
// ❌ WRONG - Same logic in both places
// frontend/src/utils/calculations.ts
export function calculateHydration(flour: number, water: number) {
  return (water / flour) * 100;
}

// mobile/utils/calculations.ts
export function calculateHydration(flour: number, water: number) {
  return (water / flour) * 100; // Duplicate!
}

// ✅ CORRECT - Logic in shared
// shared/utils/calculations.ts
export function calculateHydration(flour: number, water: number) {
  return (water / flour) * 100;
}
```

### ❌ Platform-Specific Code in Shared
```typescript
// ❌ WRONG - DOM API in shared code
// shared/utils/notification.ts
export function showNotification(message: string) {
  document.getElementById('toast').innerText = message; // DOM!
}

// ✅ CORRECT - Abstract platform differences
// shared/types/platform.types.ts
export interface NotificationService {
  show(message: string): void;
}
```

### ❌ Tight Coupling to Platforms
```typescript
// ❌ WRONG - Shared code knows about platforms
// shared/utils/helper.ts
import { Platform } from 'react-native'; // Platform-specific!

export function doSomething() {
  if (Platform.OS === 'web') { /* ... */ }
}

// ✅ CORRECT - Dependency injection
// shared/utils/helper.ts
export function doSomething(config: PlatformConfig) {
  if (config.isWeb) { /* ... */ }
}
```

---

This document should be referenced whenever:
- Creating new shared code
- Migrating code from web to shared
- Building mobile features
- Reviewing pull requests
- Onboarding new developers
