# Shared Hooks Reference

Platform-agnostic React hooks for Loafly Sourdough app. Works with both web and Capacitor mobile apps.

## 📦 Installation

The hooks are already available in the `@sourdough/shared` package:

```typescript
import { useRecipes, useBakes, useAuth, useMeta } from '@sourdough/shared';
```

---

## 🪝 Available Hooks

### 1. `useRecipes` - Recipe Management

Manages recipe data fetching and mutations.

**Import:**
```typescript
import { useRecipes, type UseRecipesOptions, type UseRecipesReturn } from '@sourdough/shared';
```

**Usage:**
```typescript
const {
  recipes,           // FullRecipe[] - Array of recipes
  loading,           // boolean - Loading state
  error,             // string | null - Error message
  fetchRecipes,      // () => Promise<void> - Fetch all recipes
  getRecipeById,     // (id: number) => Promise<FullRecipe> - Get single recipe
  createRecipe,      // (data) => Promise<FullRecipe> - Create new recipe
  updateRecipe,      // (id, data) => Promise<FullRecipe> - Update recipe
  deleteRecipe,      // (id) => Promise<void> - Delete recipe
} = useRecipes({
  autoFetch: true,                              // Auto-fetch on mount (default: false)
  apiBaseUrl: 'https://api.loafly.app/api',     // API base URL
  getAuthToken: () => localStorage.getItem('token')  // Auth token getter
});
```

**Example:**
```typescript
function RecipeList() {
  const { recipes, loading, error, createRecipe } = useRecipes({
    autoFetch: true,
    apiBaseUrl: process.env.VITE_API_BASE_URL,
    getAuthToken: () => localStorage.getItem('token')
  });

  const handleCreate = async () => {
    try {
      const newRecipe = await createRecipe({
        name: 'Sourdough Boule',
        notes: 'Classic recipe',
        totalWeight: 1000,
        hydrationPct: 75,
        saltPct: 2,
        steps: [],
        fieldValues: []
      });
      console.log('Created:', newRecipe);
    } catch (err) {
      console.error('Failed to create recipe:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleCreate}>New Recipe</button>
      {recipes.map(recipe => (
        <div key={recipe.id}>{recipe.name}</div>
      ))}
    </div>
  );
}
```

---

### 2. `useBakes` - Bake Session Management

Manages bake session data and completion.

**Import:**
```typescript
import { useBakes, type UseBakesOptions, type UseBakesReturn } from '@sourdough/shared';
```

**Usage:**
```typescript
const {
  bakes,            // Bake[] - Array of bake sessions
  loading,          // boolean - Loading state
  error,            // string | null - Error message
  fetchBakes,       // () => Promise<void> - Fetch all bakes
  getBakeById,      // (id: number) => Promise<Bake> - Get single bake
  createBake,       // (data) => Promise<Bake> - Create new bake
  updateBake,       // (id, data) => Promise<Bake> - Update bake
  deleteBake,       // (id) => Promise<void> - Delete bake
  completeBake,     // (id, { rating?, notes? }) => Promise<Bake> - Mark bake complete
} = useBakes({
  autoFetch: true,
  apiBaseUrl: 'https://api.loafly.app/api',
  getAuthToken: () => localStorage.getItem('token')
});
```

**Example:**
```typescript
function BakeTracker() {
  const { bakes, loading, createBake, completeBake } = useBakes({
    autoFetch: true,
    apiBaseUrl: process.env.VITE_API_BASE_URL,
    getAuthToken: () => localStorage.getItem('token')
  });

  const handleStartBake = async (recipeId: number) => {
    try {
      const newBake = await createBake({
        recipeId,
        status: 'active',
        startTime: new Date().toISOString()
      });
      console.log('Bake started:', newBake);
    } catch (err) {
      console.error('Failed to start bake:', err);
    }
  };

  const handleCompleteBake = async (bakeId: number) => {
    try {
      const completedBake = await completeBake(bakeId, {
        rating: 5,
        notes: 'Great crust and crumb!'
      });
      console.log('Bake completed:', completedBake);
    } catch (err) {
      console.error('Failed to complete bake:', err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {bakes.map(bake => (
        <div key={bake.id}>
          Bake #{bake.id} - {bake.status}
          {bake.status === 'active' && (
            <button onClick={() => handleCompleteBake(bake.id)}>Complete</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

### 3. `useAuth` - Authentication

Manages user authentication state and operations.

**Import:**
```typescript
import { useAuth, type UseAuthOptions, type UseAuthReturn } from '@sourdough/shared';
```

**Usage:**
```typescript
const {
  user,              // any | null - Current user object
  token,             // string | null - Auth token
  loading,           // boolean - Loading state
  error,             // string | null - Error message
  isAuthenticated,   // boolean - Authentication status
  login,             // (credentials) => Promise<void> - Email/password login
  register,          // (data) => Promise<void> - User registration
  googleAuth,        // (tokenId) => Promise<void> - Google OAuth
  logout,            // () => void - Clear auth state
  setToken,          // (token) => void - Manually set token
  setUser,           // (user) => void - Manually set user
} = useAuth({
  apiBaseUrl: 'https://api.loafly.app/api',
  onLoginSuccess: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  onLogout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
});
```

**Example:**
```typescript
function LoginForm() {
  const { login, register, isAuthenticated, user, error, loading } = useAuth({
    apiBaseUrl: process.env.VITE_API_BASE_URL,
    onLoginSuccess: (token, user) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('Login successful:', user);
    },
    onLogout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  });

  const handleLogin = async (email: string, password: string) => {
    try {
      await login({ email, password });
      // User is now authenticated
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    try {
      await register({ email, password, name });
      // User is now registered and authenticated
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  if (isAuthenticated) {
    return <div>Welcome, {user?.name}!</div>;
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        handleLogin(
          formData.get('email') as string,
          formData.get('password') as string
        );
      }}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

---

### 4. `useMeta` - Metadata (Ingredients, Categories, Templates)

Manages metadata for recipes (ingredients, categories, step templates).

**Import:**
```typescript
import { useMeta, type UseMetaOptions, type UseMetaReturn } from '@sourdough/shared';
```

**Usage:**
```typescript
const {
  ingredients,       // any[] - Array of ingredient metadata
  categories,        // any[] - Array of category metadata
  templates,         // any[] - Array of step templates
  loading,           // boolean - Loading state
  error,             // string | null - Error message
  fetchIngredients,  // () => Promise<void> - Fetch ingredients
  fetchCategories,   // () => Promise<void> - Fetch categories
  fetchTemplates,    // () => Promise<void> - Fetch templates
  fetchAll,          // () => Promise<void> - Fetch all meta data at once
} = useMeta({
  autoFetch: true,
  apiBaseUrl: 'https://api.loafly.app/api',
  getAuthToken: () => localStorage.getItem('token')
});
```

**Example:**
```typescript
function RecipeBuilder() {
  const { ingredients, templates, loading, fetchAll } = useMeta({
    autoFetch: true,
    apiBaseUrl: process.env.VITE_API_BASE_URL,
    getAuthToken: () => localStorage.getItem('token')
  });

  useEffect(() => {
    // Manually fetch if needed
    fetchAll();
  }, []);

  if (loading) return <div>Loading metadata...</div>;

  return (
    <div>
      <h2>Available Ingredients</h2>
      <ul>
        {ingredients.map(ing => (
          <li key={ing.id}>{ing.name}</li>
        ))}
      </ul>

      <h2>Step Templates</h2>
      <ul>
        {templates.map(tmpl => (
          <li key={tmpl.id}>{tmpl.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🔄 Mobile Usage (Capacitor)

The hooks work identically on mobile, but you'll use Capacitor's Preferences API for token storage:

```typescript
import { Preferences } from '@capacitor/preferences';
import { useAuth, useRecipes } from '@sourdough/shared';

function MobileApp() {
  const { login, isAuthenticated } = useAuth({
    apiBaseUrl: 'https://api.loafly.app/api',
    onLoginSuccess: async (token, user) => {
      await Preferences.set({ key: 'token', value: token });
      await Preferences.set({ key: 'user', value: JSON.stringify(user) });
    },
    onLogout: async () => {
      await Preferences.remove({ key: 'token' });
      await Preferences.remove({ key: 'user' });
    }
  });

  const { recipes, loading } = useRecipes({
    autoFetch: isAuthenticated,
    apiBaseUrl: 'https://api.loafly.app/api',
    getAuthToken: async () => {
      const { value } = await Preferences.get({ key: 'token' });
      return value;
    }
  });

  // Same component logic as web!
}
```

---

## 🧪 Testing

All hooks are built with testability in mind:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useRecipes } from '@sourdough/shared';

test('useRecipes fetches recipes', async () => {
  const { result } = renderHook(() => useRecipes({
    autoFetch: false,
    apiBaseUrl: 'http://localhost:3001/api',
    getAuthToken: () => 'test-token'
  }));

  expect(result.current.loading).toBe(false);
  expect(result.current.recipes).toEqual([]);

  await result.current.fetchRecipes();

  await waitFor(() => {
    expect(result.current.recipes.length).toBeGreaterThan(0);
  });
});
```

---

## 📝 Notes

- All hooks use React's `useState`, `useEffect`, and `useCallback` for optimal performance
- Loading states are managed automatically
- Errors are caught and exposed via the `error` property
- All hooks are typed with TypeScript for excellent IntelliSense
- Platform-agnostic: works with web (localStorage) and mobile (Capacitor Preferences)

---

## 🔗 Related Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Main development guide
- [CAPACITOR_SETUP_GUIDE.md](./CAPACITOR_SETUP_GUIDE.md) - Mobile setup
- [API.md](./API.md) - API endpoint reference
