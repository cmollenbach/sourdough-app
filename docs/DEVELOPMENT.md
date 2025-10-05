# 🛠️ Development Guide - Loafly Sourdough App

This guide will help you set up and work with the Loafly codebase. The project is structured as a **monorepo** with three main packages.

---

## 📦 Project Structure

```
sourdough-app/                    # Monorepo root
├── package.json                   # Root workspace configuration
├── backend/                       # Express API server
│   ├── src/                       # TypeScript source code
│   ├── tests/                     # Jest test suites (394/399 passing)
│   ├── prisma/                    # Database schema & migrations
│   └── package.json
├── frontend/                      # React web application
│   ├── src/                       # React components, hooks, stores
│   ├── public/                    # Static assets
│   └── package.json
└── shared/                        # Shared code (types, utils)
    ├── types/                     # TypeScript interfaces
    ├── utils/                     # Platform-agnostic utilities
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **PostgreSQL**: 14+ (for local development)
- **Git**: Latest version

### Initial Setup

```powershell
# 1. Clone the repository
git clone https://github.com/cmollenbach/sourdough-app.git
cd sourdough-app

# 2. Install all dependencies (installs for all workspaces)
npm install

# 3. Set up environment variables
# Create .env files in backend/ directory
cp backend/.env.example backend/.env

# 4. Configure PostgreSQL connection in backend/.env
# DATABASE_URL="postgresql://user:password@localhost:5432/sourdough"
# JWT_SECRET="your-secret-key"

# 5. Run database migrations
npm run prisma:migrate

# 6. Build all packages
npm run build

# 7. Start development servers
npm run dev:backend    # Backend API on http://localhost:3001
npm run dev:frontend   # Frontend on http://localhost:5173
```

---

## 📜 Available Scripts

All scripts can be run from the **root directory** and will execute across workspaces.

### Build Commands

```powershell
npm run build              # Build all packages (shared → backend → frontend)
npm run build:shared       # Build only the shared package
npm run build:backend      # Build only the backend
npm run build:frontend     # Build only the frontend
npm run clean              # Remove all build artifacts
```

### Development Commands

```powershell
npm run dev                # Start frontend dev server
npm run dev:backend        # Start backend dev server (with hot reload)
npm run dev:frontend       # Start frontend dev server (with HMR)
```

### Testing Commands

```powershell
npm test                   # Run tests for all packages
npm run test:backend       # Run backend Jest tests
npm run test:frontend      # Run frontend Vitest tests
npm run test:shared        # Run shared package tests (when added)
```

### Code Quality

```powershell
npm run lint               # Lint all packages
npm run lint:fix           # Auto-fix linting issues
npm run typecheck          # TypeScript type checking across all packages
```

### Database Commands

```powershell
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run database migrations
npm run prisma:studio      # Open Prisma Studio (DB GUI)
```

---

## 🏗️ Workspace Details

### 1. Backend (`backend/`)

**Tech Stack:**
- Express.js + TypeScript
- Prisma ORM + PostgreSQL
- JWT authentication
- Jest for testing

**Local Development:**
```powershell
cd backend
npm run dev           # Starts on http://localhost:3001
npm test              # Run 399 tests
npm run test:watch    # Watch mode
```

**Environment Variables:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sourdough
JWT_SECRET=your-jwt-secret
NODE_ENV=development
PORT=3001
```

**API Documentation:**
- Base URL: `http://localhost:3001/api`
- Routes:
  - `/auth` - Authentication (register, login, OAuth)
  - `/recipes` - Recipe CRUD operations
  - `/bakes` - Bake session management
  - `/meta` - Metadata (ingredients, categories, templates)

---

### 2. Frontend (`frontend/`)

**Tech Stack:**
- React 19 + TypeScript
- Vite build tool
- Tailwind CSS
- Zustand for state management
- React Hook Form
- Vitest for testing

**Local Development:**
```powershell
cd frontend
npm run dev           # Starts on http://localhost:5173
npm test              # Run tests
npm run test:ui       # Open Vitest UI
```

**Environment Variables:**
```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

**Key Features:**
- Recipe builder with drag-and-drop steps
- Live bake tracking with notifications
- Timing plan parser ("S&F at 30, 60, 90 minutes")
- Dark mode support
- Responsive design (mobile-first)

---

### 3. Shared (`shared/`)

**Purpose:** Platform-agnostic code shared between web and future mobile app.

**What's Included:**
- `types/` - TypeScript interfaces (Recipe, Bake, StepTemplate, etc.)
- `utils/` - Utilities like `timingParser.ts`
- Future: hooks, API client, constants

**Usage in Projects:**
```typescript
// Import from shared package
import { Recipe, StepTemplate, IngredientCalculationMode } from '@sourdough/shared';
import { parseTimingPlan } from '@sourdough/shared';
```

**Building:**
```powershell
cd shared
npm run build         # Compiles TypeScript to JavaScript
npm run typecheck     # Type checking only
```

---

## 🔄 Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```powershell
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the appropriate workspace

3. **Run tests:**
   ```powershell
   npm test                 # All tests
   npm run test:backend     # Backend only
   npm run test:frontend    # Frontend only
   ```

4. **Type check:**
   ```powershell
   npm run typecheck
   ```

5. **Commit and push:**
   ```powershell
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

### Adding a New Dependency

**For a specific package:**
```powershell
# Add to backend
npm install <package> --workspace=backend

# Add to frontend
npm install <package> --workspace=frontend

# Add to shared
npm install <package> --workspace=shared
```

**For all packages (devDependency at root):**
```powershell
npm install -D <package> -w
```

### Updating Shared Package

When you modify `shared/`, other packages automatically get the changes:

```powershell
cd shared
npm run build        # Rebuild shared package

cd ../frontend
npm run dev          # Frontend will use updated shared package
```

---

## 🧪 Testing Strategy

### Backend Tests
- **Framework:** Jest + Supertest
- **Coverage:** 394/399 tests passing (98.7%)
- **Types:**
  - Integration tests (API endpoints)
  - Unit tests (validation, business logic)
  - Database tests (Prisma operations)

**Run specific test file:**
```powershell
cd backend
npm test -- tests/routes/recipes-crud.test.ts
```

### Frontend Tests
- **Framework:** Vitest + Testing Library
- **Coverage:** 13 tests (needs expansion ⚠️)
- **Priority:** Add tests for:
  - Critical components (StepCard, RecipeBuilder, BakeView)
  - Hooks (useRecipeCalculations ✅, useTimer, useBakeSchedule)
  - Stores (recipeBuilderStore, bakeStore)

**Run with UI:**
```powershell
cd frontend
npm run test:ui
```

---

## 📊 Database Management

### Local Database Setup

1. **Install PostgreSQL** (if not installed)

2. **Create database:**
   ```sql
   CREATE DATABASE sourdough;
   CREATE USER sourdough_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE sourdough TO sourdough_user;
   ```

3. **Update backend/.env:**
   ```env
   DATABASE_URL="postgresql://sourdough_user:your_password@localhost:5432/sourdough"
   ```

4. **Run migrations:**
   ```powershell
   npm run prisma:migrate
   ```

### Common Database Tasks

```powershell
# Generate Prisma Client after schema changes
npm run prisma:generate

# Create a new migration
cd backend
npx prisma migrate dev --name your_migration_name

# Reset database (⚠️ deletes all data)
cd backend
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

### Schema Location
- `backend/prisma/schema.prisma` - Database schema
- `backend/prisma/migrations/` - Migration history

---

## 🚢 Deployment

### Production Build

```powershell
# Build all packages for production
npm run build

# Verify builds
ls backend/dist       # Should contain compiled JS
ls frontend/dist      # Should contain static assets
ls shared/*.js        # Should contain compiled shared code
```

### Current Deployments

- **Frontend:** Netlify → https://loafly.app
- **Backend:** Render → https://sourdough-backend-onrender-com.onrender.com
- **Database:** Render PostgreSQL

### Environment Variables (Production)

**Backend (Render):**
```env
DATABASE_URL=<render-postgres-url>
JWT_SECRET=<production-secret>
NODE_ENV=production
PORT=10000
GOOGLE_CLIENT_ID=<oauth-client-id>
```

**Frontend (Netlify):**
```env
VITE_API_URL=https://sourdough-backend-onrender-com.onrender.com/api
VITE_GOOGLE_CLIENT_ID=<oauth-client-id>
```

---

## 🎯 Next Development Steps

### High Priority

1. **Add Frontend Tests** 📝
   - Target 60%+ coverage for business logic
   - Test critical user flows

2. **Migrate Business Logic to Shared** 🔄
   - Move hooks to `shared/hooks/`
   - Move API client to `shared/api/`
   - Move constants to `shared/constants/`

3. **Performance Optimization** ⚡
   - Code splitting (reduce 651kB main bundle)
   - Lazy load routes
   - Optimize images

### Medium Priority

4. **Type Safety Improvements** 🔒
   - Consider Zod schemas for runtime validation
   - Generate types from Prisma schema

5. **Documentation** 📚
   - API documentation (OpenAPI/Swagger)
   - Component documentation (Storybook?)
   - Architecture diagrams

### Future

6. **Mobile Development** 📱
   - Initialize React Native + Expo project
   - Reuse 70% of code from shared package
   - Native notifications

---

## 🐛 Troubleshooting

### "Module not found" errors

```powershell
# Reinstall dependencies
npm install

# Rebuild shared package
npm run build:shared
```

### TypeScript errors after pulling changes

```powershell
# Regenerate Prisma Client
npm run prisma:generate

# Rebuild all packages
npm run build
```

### Database connection errors

```powershell
# Check PostgreSQL is running
# Verify DATABASE_URL in backend/.env
# Try resetting the database
cd backend
npx prisma migrate reset
```

### Frontend not connecting to backend

- Verify `VITE_API_URL` in frontend/.env
- Check backend is running on correct port
- Check for CORS issues (should allow localhost:5173)

### Tests failing

```powershell
# Backend: Ensure test database is set up
cd backend
npm run prisma:migrate

# Frontend: Clear vite cache
cd frontend
rm -rf node_modules/.vite
npm run dev
```

---

## 📚 Additional Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **React 19 Docs:** https://react.dev
- **Vite Guide:** https://vitejs.dev/guide/
- **Vitest Docs:** https://vitest.dev
- **Tailwind CSS:** https://tailwindcss.com/docs

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass (`npm test`)
6. Ensure type checking passes (`npm run typecheck`)
7. Submit a pull request

---

## 📝 License

MIT

---

## 💬 Support

For questions or issues:
- Open a GitHub issue
- Check existing documentation in `docs/`
- Review code comments in source files

---

**Last Updated:** October 5, 2025  
**Maintainer:** @cmollenbach
