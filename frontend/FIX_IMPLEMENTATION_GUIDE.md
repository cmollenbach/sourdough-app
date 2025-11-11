# Fix Implementation Guide

Step-by-step guide for implementing each fix in the prioritized plan.

## 🔴 P0: Critical Fixes

### Fix 1: API Timeout (15 minutes)

**File**: `src/utils/api.ts`

**Change**:
```typescript
// BEFORE
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
});

// AFTER
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000, // 10 second timeout
  withCredentials: true,
});
```

**Test**:
```bash
# Stop backend, try to make API call
# Should timeout after 10 seconds with clear error
```

---

### Fix 2: Offline/Backend Unavailable Handling (2-3 hours)

**Step 1**: Create Offline Banner Component

**File**: `src/components/Shared/OfflineBanner.tsx` (new file)

```typescript
import { useState, useEffect } from 'react';
import { apiGet } from '../../utils/api';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      setIsChecking(true);
      try {
        // Use a simple GET request to health endpoint
        await apiGet<{ status: string }>('/health');
        setIsOffline(false);
      } catch (error) {
        setIsOffline(true);
      } finally {
        setIsChecking(false);
      }
    };

    // Check immediately
    checkHealth();

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-red-500 text-white p-2 text-center text-sm">
      ⚠️ Service temporarily unavailable. Some features may not work. 
      <button 
        onClick={() => window.location.reload()} 
        className="ml-2 underline"
      >
        Retry
      </button>
    </div>
  );
}
```

**Step 2**: Add Response Interceptor

**File**: `src/utils/api.ts`

```typescript
// Add after request interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log network errors for debugging
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    return Promise.reject(error);
  }
);
```

**Step 3**: Integrate into App

**File**: `src/App.tsx`

```typescript
import { OfflineBanner } from './components/Shared/OfflineBanner';

function AppRoutes() {
  // ... existing code ...
  return (
    <div className="page-bg min-h-screen flex flex-col">
      <OfflineBanner />
      <Navbar />
      {/* ... rest of app */}
    </div>
  );
}
```

**Test**:
1. Stop backend server
2. Refresh app
3. Verify banner appears
4. Start backend
5. Verify banner disappears

---

## 🟡 P1: High Priority Fixes

### Fix 3: Form Input Race Conditions (2-3 hours)

**Step 1**: Create Form Skeleton Component

**File**: `src/components/Shared/FormSkeleton.tsx` (new file)

```typescript
export function FormSkeleton() {
  return (
    <div className="flex flex-col gap-3 w-72 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}
```

**Step 2**: Update Login Page

**File**: `src/pages/login.tsx`

```typescript
import { FormSkeleton } from '../components/Shared/FormSkeleton';

export default function LoginPage() {
  const [formReady, setFormReady] = useState(false);
  // ... existing state ...

  useEffect(() => {
    // Ensure form is ready before showing
    const timer = setTimeout(() => setFormReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!formReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FormSkeleton />
      </div>
    );
  }

  // ... rest of component
}
```

**Step 3**: Update Register Page (same pattern)

**Test**:
1. Test on slow 3G connection
2. Verify form appears when ready
3. Verify no submission before ready

---

### Fix 4: Network Error Feedback (1 hour)

**File**: `src/utils/api.ts`

**Update `extractErrorMessage` function**:

```typescript
function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Network errors (no response received)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'Request timed out. Please check your connection and try again.';
      }
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        return 'Unable to reach server. Please check your internet connection.';
      }
      return 'Network error. Please check your connection and try again.';
    }

    // HTTP errors (response received with error status)
    const status = error.response.status;
    
    if (error.response?.data) {
      const { data } = error.response;
      if (typeof data.message === 'string' && data.message.trim() !== '') {
        return data.message;
      }
      if (typeof data.error === 'string' && data.error.trim() !== '') {
        return data.error;
      }
      if (typeof data === 'string' && data.trim() !== '') {
        return data;
      }
    }

    // Status code based messages
    if (status === 401) {
      return 'Authentication required. Please log in again.';
    }
    if (status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (status === 404) {
      return 'Resource not found.';
    }
    if (status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (status >= 500) {
      return 'Server error. Please try again later.';
    }

    return error.message || 'An API request failed. Please try again.';
  }
  return error instanceof Error ? error.message : 'An unknown error occurred.';
}
```

**Test**:
1. Disable network → Should show network error
2. Stop backend → Should show server error
3. Invalid credentials → Should show auth error
4. 404 request → Should show not found error

---

### Fix 5: Navigation Consistency (1-2 hours)

**File**: `src/components/Navbar/Navbar.tsx`

**Update navigation links**:

```typescript
// Desktop navigation
<div className="hidden md:flex items-baseline space-x-4">
  <NavLink 
    to="/recipes" 
    className={`px-3 py-2 rounded-md text-sm font-medium ${
      user ? '' : 'opacity-50 cursor-not-allowed pointer-events-none'
    }`}
  >
    Recipes
  </NavLink>
  <NavLink 
    to="/bakes" 
    className={`px-3 py-2 rounded-md text-sm font-medium ${
      user ? '' : 'opacity-50 cursor-not-allowed pointer-events-none'
    }`}
  >
    Bakes
  </NavLink>
  <NavLink 
    to="/history" 
    className={`px-3 py-2 rounded-md text-sm font-medium ${
      user ? '' : 'opacity-50 cursor-not-allowed pointer-events-none'
    }`}
  >
    History
  </NavLink>
  {user?.role === 'ADMIN' && (
    <NavLink to="/admin/step-templates" className="px-3 py-2 rounded-md text-sm font-medium">
      Admin
    </NavLink>
  )}
</div>
```

**Add loading state**:

```typescript
const { user, isLoading } = useAuth();

// Show skeleton during loading
if (isLoading) {
  return (
    <nav className="bg-surface-elevated shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </nav>
  );
}
```

**Test**:
1. Verify nav always visible
2. Check disabled state when not logged in
3. Test navigation after login

---

## 🟢 P2: Medium Priority Fixes

### Fix 6: Auth State Race Conditions (2-3 hours)

**File**: `src/components/Auth/RequireAuth.tsx`

```typescript
import React from 'react';
import { useLocation, Redirect } from "react-router-dom";
import { useAuth } from "../../hooks/useAuthHook";

interface RequireAuthProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function RequireAuth({ children, adminOnly = false }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state during auth check
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to={{ pathname: "/", state: { from: location } }} />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Redirect to="/unauthorized" />;
  }

  return <>{children}</>;
}
```

**Test**:
1. Navigate to protected route while logged out
2. Verify loading state shows
3. Verify redirect happens
4. No content flash

---

### Fix 7: Mobile Navigation Issues (1 hour)

**File**: `src/components/Navbar/Navbar.tsx`

**Ensure mobile menu button is always visible**:

```typescript
<div className="md:hidden">
  <button 
    onClick={() => setMobileMenuOpen(o => !o)} 
    aria-label="Open main menu"
    className="p-2 rounded-md hover:bg-surface-subtle"
    type="button"
  >
    <span className="text-2xl">☰</span>
  </button>
</div>
```

**Test**:
1. Set viewport to mobile (375x667)
2. Verify hamburger menu visible
3. Click to open menu
4. Verify menu items appear

---

## 🟢 P3: Low Priority Fixes

### Fix 8: 404 Page Handling (30 minutes)

**File**: `src/App.tsx`

**Ensure NotFound is last route**:

```typescript
<Switch>
  {/* ... all other routes ... */}
  <Route component={NotFound} /> {/* Must be last */}
</Switch>
```

**File**: `src/pages/NotFound.tsx`

**Improve 404 page**:

```typescript
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuthHook";

export default function NotFound() {
  const { user } = useAuth();
  
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-4">Sorry, the page you are looking for does not exist.</p>
      <div className="flex gap-4 justify-center">
        {user ? (
          <>
            <Link to="/recipes" className="text-blue-600 hover:underline">
              Go to Recipes
            </Link>
            <Link to="/bakes" className="text-blue-600 hover:underline">
              Go to Bakes
            </Link>
          </>
        ) : (
          <Link to="/" className="text-blue-600 hover:underline">
            Go to Home
          </Link>
        )}
      </div>
    </div>
  );
}
```

---

### Fix 9: Dark Mode Toggle Visibility (30 minutes)

**File**: `src/components/Navbar/Navbar.tsx`

**Ensure dark mode toggle is always visible**:

```typescript
<button 
  onClick={toggleDarkMode} 
  className="p-2 rounded-full hover:bg-surface-subtle transition-colors"
  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
  type="button"
>
  <span className="text-xl">{darkMode ? '☀️' : '🌙'}</span>
</button>
```

---

## ✅ Testing Checklist

After implementing each fix:

- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Manual browser testing
- [ ] Test on slow network (Chrome DevTools → Network → Slow 3G)
- [ ] Test with backend stopped
- [ ] Test on mobile viewport
- [ ] Check error messages are user-friendly
- [ ] Verify no console errors

---

## 📝 Notes

- Test each fix independently
- Commit after each fix
- Update E2E tests as you go
- Document any breaking changes

