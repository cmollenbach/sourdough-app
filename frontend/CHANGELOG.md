# Changelog

## [Latest] - App Weaknesses Fixes

### Added
- **API Timeout**: 10-second timeout on all API requests to prevent hanging
- **OfflineBanner Component**: Monitors backend health and displays warning when unavailable
- **FormSkeleton Component**: Loading skeleton for forms to prevent race conditions
- **Enhanced Error Messages**: Specific, actionable error messages for different scenarios
- **E2E Test Improvements**: Backend auto-start, test hang fix, cross-platform compatibility

### Changed
- **Navigation**: Always visible, disabled when user not logged in
- **Auth Flow**: Added loading states to prevent content flash on protected routes
- **Forms**: Added ready state with skeleton loaders during initialization
- **404 Page**: Improved with conditional navigation based on auth state
- **Error Handling**: Comprehensive error message extraction with status code handling

### Fixed
- Requests hanging indefinitely (now timeout after 10s)
- No feedback when backend is down (offline banner)
- Generic error messages (now specific and actionable)
- Navigation disappearing when logged out (now always visible)
- Content flash on protected routes (loading states)
- Form input race conditions (skeleton loaders)
- E2E tests hanging (skip health checks during tests)

### Technical Details
- Modified: `src/utils/api.ts` - Added timeout and enhanced error messages
- Modified: `src/App.tsx` - Integrated OfflineBanner
- Modified: `src/components/Navbar/Navbar.tsx` - Navigation improvements
- Modified: `src/components/Auth/RequireAuth.tsx` - Loading states
- Modified: `src/pages/login.tsx` & `register.tsx` - Form ready states
- Modified: `src/pages/NotFound.tsx` - Improved 404 page
- Modified: `playwright.config.ts` - Backend auto-start configuration
- New: `src/components/Shared/OfflineBanner.tsx`
- New: `src/components/Shared/FormSkeleton.tsx`
- New: `e2e/global-setup.ts`

