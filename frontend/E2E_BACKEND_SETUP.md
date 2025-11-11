# E2E Tests - Backend Setup

## Overview

E2E tests **require the backend to be running** to test full user workflows. The Playwright configuration automatically starts the backend server before running tests.

## Automatic Backend Startup

The `playwright.config.ts` includes a `webServer` configuration that:
1. Starts the backend server on `http://localhost:3001`
2. Waits for `/api/health` to respond
3. Then starts the frontend server on `http://localhost:5173`
4. Finally runs the tests

## Prerequisites

Before running E2E tests, ensure:

### 1. PostgreSQL is Running
```bash
# Check if PostgreSQL is running
pg_ctl status
# Or on Windows:
Get-Service postgresql*
```

### 2. Backend Database is Set Up
```bash
cd ../backend

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npx prisma db seed
```

### 3. Backend Environment Variables
Ensure `backend/.env` exists with:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/sourdough"
JWT_SECRET="your-secret-key"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

### 4. Frontend Environment Variables
Ensure `frontend/.env` exists with:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## Running Tests

### Automatic (Recommended)
```bash
cd frontend
npm run test:e2e
```

Playwright will:
1. Start backend server
2. Wait for backend to be ready
3. Start frontend server
4. Run tests
5. Clean up servers

### Manual (If Auto-Start Fails)
```bash
# Terminal 1: Start backend
cd ../backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Run tests (will reuse existing servers)
npm run test:e2e
```

## Troubleshooting

### Backend Won't Start
- Check PostgreSQL is running
- Verify database connection in `backend/.env`
- Check backend logs for errors
- Ensure migrations are applied

### Tests Hang on Health Check
- The `OfflineBanner` component skips health checks during tests
- If tests still hang, check backend logs
- Verify backend is accessible at `http://localhost:3001/api/health`

### Port Already in Use
- Stop any existing backend/frontend servers
- Or use `reuseExistingServer: true` in Playwright config (already enabled)

## Configuration

The backend startup is configured in `playwright.config.ts`:

```typescript
webServer: [
  {
    command: 'cd ../backend && npm run dev',
    url: 'http://localhost:3001/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  // ... frontend config
]
```

## Notes

- Backend must be running for workflow tests (auth, recipes, bakes, etc.)
- Navigation tests may work without backend, but will show offline banner
- Health check endpoint is used to verify backend is ready
- Backend logs are piped to stdout/stderr for debugging

