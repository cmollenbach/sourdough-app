# Use Case Test Suite

This directory contains end-to-end workflow tests that verify complete user journeys through the application, rather than testing individual API endpoints in isolation.

## Test Files

### `auth-workflows.test.ts`
Tests complete authentication workflows:
- Email/password registration and login
- Google OAuth authentication (new and existing users)
- Account linking
- Session management
- Error handling

**Coverage**: 10 tests covering registration, login, OAuth, session persistence, and error scenarios.

### `recipe-workflows.test.ts`
Tests complete recipe management workflows:
- Create, view, edit, delete recipe lifecycle
- Recipe creation with steps and ingredients
- Recipe cloning
- Recipe ownership and authorization
- Recipe listing and filtering

**Coverage**: Tests the full recipe CRUD lifecycle with ownership verification.

### `bake-workflows.test.ts`
Tests complete bake tracking workflows:
- Start bake from recipe (snapshot verification)
- Track bake steps (start, complete, skip)
- Record actual parameter values
- Update step notes
- Complete and cancel bakes
- Bake history and filtering
- Bake ownership

**Coverage**: Tests the snapshot pattern and step-by-step tracking functionality.

### `profile-workflows.test.ts`
Tests complete user profile management workflows:
- Profile creation and retrieval (auto-creation)
- Profile updates
- User action tracking (recipe creation, bake completion, advanced features)
- Experience level progression (beginner → intermediate → advanced)
- Preferences management (structured and complex)
- Action history

**Coverage**: 14 tests covering profile lifecycle, stats tracking, and preferences.

### `edge-cases.test.ts`
Tests error handling and boundary conditions:
- Invalid authentication tokens
- Resource not found scenarios
- Unauthorized access attempts
- Concurrent operations
- Large/complex data handling
- Invalid input validation
- Boundary values
- State transition edge cases
- Data integrity

**Coverage**: 31 tests covering error scenarios and edge cases.

## Running the Tests

Run all use case tests:
```bash
npm test -- tests/use-cases
```

Run a specific test file:
```bash
npm test -- tests/use-cases/auth-workflows.test.ts
```

## Test Structure

Each test file follows this pattern:
1. **Setup**: Creates Express app, seeds test data, sets up test users
2. **Workflow Tests**: Tests complete user journeys
3. **Cleanup**: Removes test data after each test

## Adding New Workflow Tests

When adding new workflow tests:
1. Follow the existing pattern of complete user journeys
2. Use descriptive test names that explain the workflow
3. Clean up test data in `beforeEach` hooks
4. Test both success and error scenarios
5. Verify data integrity (ownership, snapshots, etc.)

## Test Coverage Summary

- **Authentication Workflows**: 10 tests
- **Recipe Management Workflows**: 8 tests
- **Bake Tracking Workflows**: 6 tests
- **Profile Management Workflows**: 14 tests
- **Edge Cases & Error Handling**: 31 tests

**Total**: 69 use case workflow tests

## Future Enhancements

- `integration-workflows.test.ts` - Cross-feature integration workflows
- Performance tests for large datasets
- Load testing scenarios

