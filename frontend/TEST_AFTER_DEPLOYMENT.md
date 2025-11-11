# Testing After Deployment

## 🧪 E2E Test Commands

### Run All Tests
```bash
cd frontend
npm run test:e2e
```

### Run Specific Test Suite
```bash
# Authentication tests only
npx playwright test authentication-workflow

# Navigation tests only
npx playwright test app-navigation

# Recipe workflow tests
npx playwright test recipe-workflow
```

### Run with UI (Recommended)
```bash
npm run test:e2e:ui
```

### Run in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

## 🔍 Manual Testing Guide

### 1. Test Offline Banner

**Steps**:
1. Open deployed app in browser
2. Open browser DevTools (F12)
3. Go to Network tab
4. Check "Offline" checkbox
5. Refresh page
6. **Expected**: Red banner appears saying "Service temporarily unavailable"

**Or**:
1. Stop backend server
2. Refresh frontend
3. **Expected**: Red banner appears

### 2. Test Error Messages

**Invalid Login**:
1. Go to login page
2. Enter invalid credentials
3. Click login
4. **Expected**: Specific error message (not generic)

**Network Error**:
1. Disable network in DevTools
2. Try to login
3. **Expected**: "Unable to reach server. Please check your internet connection."

**Timeout**:
1. Throttle network to "Slow 3G" in DevTools
2. Make API request
3. Wait 10+ seconds
4. **Expected**: "Request timed out. Please check your connection..."

### 3. Test Navigation

**Logged Out**:
1. Log out (if logged in)
2. **Expected**: Navigation links visible but disabled (grayed out)

**Logged In**:
1. Log in
2. **Expected**: Navigation links enabled and clickable

### 4. Test Forms

**Slow Network**:
1. Throttle network to "Slow 3G"
2. Navigate to login/register
3. **Expected**: Skeleton loader appears briefly
4. **Expected**: Form becomes interactive when ready

### 5. Test 404 Page

**Invalid Route**:
1. Navigate to `/invalid-route-12345`
2. **Expected**: 404 page with navigation options
3. **Expected**: Links to Recipes, Bakes, or Home

## 📊 Verification Checklist

After deployment, verify:
- [ ] Offline banner appears when backend is down
- [ ] Error messages are clear and specific
- [ ] Navigation is always visible
- [ ] No content flash on protected routes
- [ ] Forms show skeleton loader on slow networks
- [ ] 404 page has navigation options
- [ ] No console errors
- [ ] All features work as expected

## 🐛 Troubleshooting

### Tests Fail
- Check if backend is running
- Verify database is accessible
- Check environment variables
- Review test logs

### Offline Banner Not Showing
- Check browser console for errors
- Verify health check endpoint is accessible
- Check network tab for failed requests

### Navigation Not Visible
- Check if user is logged in
- Verify Navbar component is rendering
- Check browser console for errors

