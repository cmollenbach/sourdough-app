# 🍞 Loafly - Sourdough Baking Management App

**Never miss a stretch & fold again!** Loafly helps sourdough bakers create recipes, track live baking sessions with reliable notifications, and learn from their history.

## 🚀 Quick Links

- **Live Web App**: https://loafly.app
- **Backend API**: https://sourdough-backend-onrender-com.onrender.com
- **Documentation**: [docs/](./docs/) - Start with [DEVELOPMENT.md](./docs/DEVELOPMENT.md)
- **Mobile Setup**: [CAPACITOR_SETUP_GUIDE.md](./docs/CAPACITOR_SETUP_GUIDE.md)

## 📱 Platform Support

| Platform | Status | Technology | Deployment |
|----------|--------|------------|------------|
| **Web** | ✅ **LIVE** | React + Vite + Tailwind | Netlify |
| **Backend** | ✅ **LIVE** | Express + Prisma + PostgreSQL | Render |
| **Android** | � **IN PROGRESS** | Ionic + Capacitor | Google Play Store |
| **iOS** | 📋 **PLANNED** | Ionic + Capacitor | App Store |

**Mobile Strategy:** Using Capacitor to wrap existing React web app for 85% code reuse

## 🏗️ Project Structure

```
sourdough-app/
├── backend/              # Express API (shared by all clients)
│   ├── src/              # TypeScript source code
│   ├── tests/            # Jest tests (393/399 passing, 98.7%)
│   └── prisma/           # Database schema & migrations
│
├── frontend/             # React web + mobile app
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable UI components (Ionic)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Utilities (timingParser, etc.)
│   │   ├── services/     # Notification service, etc.
│   │   └── types/        # TypeScript interfaces
│   ├── android/          # Capacitor Android project
│   ├── ios/              # Capacitor iOS project (future)
│   └── capacitor.config.ts
│
├── shared/               # Code shared between web + mobile
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Platform-agnostic utilities
│   ├── api/              # API client
│   └── hooks/            # React hooks (planned)
│
└── docs/                 # Documentation
    ├── CAPACITOR_SETUP_GUIDE.md
    ├── DEVELOPMENT.md
    ├── Authentication.md
    └── BakeFeature.md
```

## 🎯 Key Features

### Current (Web)
- ✅ Recipe creation & management
- ✅ Baker's percentage calculations
- ✅ Hydration tracking
- ✅ Bake logging with notes & ratings
- ✅ Google OAuth authentication
- ✅ Responsive design (mobile-friendly)
- ✅ Dark mode support

### Planned (Mobile - Capacitor)
- � **Reliable stretch & fold timers** (in progress)
- � **Overnight fermentation alarms** (in progress)
- � **Push notifications** (survive device reboot)
- 📋 **Offline support**
- 📋 **Photo uploads from camera**
- 📋 **Background sync**

**Mobile Implementation:** Same React codebase as web (85% code reuse)

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Auth**: JWT + Google OAuth
- **Deployment**: Render (containerized)

### Frontend (Web + Mobile)
- **Framework**: React 19 + Ionic React
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Ionic components
- **State**: Zustand
- **HTTP Client**: Axios (via @sourdough/shared)
- **Deployment**: 
  - Web: Netlify
  - Mobile: Capacitor (Android/iOS)

### Mobile (Capacitor - In Progress)
- **Framework**: Same React codebase as web
- **Bridge**: Capacitor
- **Notifications**: @capacitor/local-notifications
- **Background**: @capacitor/background-runner
- **Deployment**: Google Play Store, App Store

### Code Sharing
- **Shared**: 70% (types, logic, API client, hooks)
- **Platform-specific**: 30% (UI components, navigation, styling)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (20 recommended)
- PostgreSQL 15+
- npm or yarn

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database URL and JWT secret

# 4. Run migrations
npx prisma migrate deploy

# 5. Generate Prisma client
npx prisma generate

# 6. (Optional) Seed database
npx prisma db seed

# 7. Start server
npm run dev
# Server runs on http://localhost:3001
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with API URL: VITE_API_BASE_URL=http://localhost:3001/api

# 4. Start development server
npm run dev
# App runs on http://localhost:5173
```

### Mobile Setup (Capacitor)

See **[CAPACITOR_SETUP_GUIDE.md](./docs/CAPACITOR_SETUP_GUIDE.md)** for complete mobile setup.

**Quick Start:**
```bash
# 1. Install Capacitor in frontend
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize Capacitor
npx cap init "Loafly" "com.loafly.sourdough" --web-dir=dist

# 3. Add Android platform
npx cap add android

# 4. Build frontend
npm run build

# 5. Sync to Android
npx cap sync android

# 6. Open in Android Studio
npx cap open android
```

## 📊 Test Suite

```bash
# Backend tests
cd backend
npm test

# Current status: 394/399 passing (98.7%)
# - 394 passing
# - 3 skipped (flaky timeout tests)
# - 2 failing (non-critical meta tests)
```

## 🔒 Environment Variables

### Backend (Required)
```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="<128-char-random-hex-string>"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
CORS_ORIGINS="http://localhost:5173,https://loafly.app"

# Optional (for Google OAuth)
GOOGLE_CLIENT_ID="<your-google-client-id>"
GOOGLE_CLIENT_SECRET="<your-google-client-secret>"
```

### Frontend (Required)
```bash
VITE_API_BASE_URL="http://localhost:3001/api"
```

## 📖 Documentation

- **[Mobile Deployment Plan](./docs/MobileDeployment.md)** - React Native setup & Google Play Store submission
- **[Authentication Guide](./docs/Authentication.md)** - OAuth implementation
- **[Bake Feature](./docs/BakeFeature.md)** - Live bake tracking with timers
- **[Recipe Builder](./docs/RecipeBuilder.md)** - Creating & managing recipes
- **[Copilot Instructions](../.github/copilot-instructions.md)** - Coding standards
- **[Mobile Code Sharing](../.github/copilot-instructions-mobile.md)** - Web + mobile strategy

## 🔐 Security

- ✅ JWT authentication with httpOnly cookies
- ✅ Rate limiting on all endpoints
- ✅ CORS configured for specific origins
- ✅ Input validation on all routes
- ✅ Parameterized queries (via Prisma)
- ✅ Environment variable validation at startup
- ✅ Helmet.js security headers
- ⚠️ Note: Never commit `.env` files or secrets

## 🚢 Deployment

### Current Production
- **Web**: Auto-deployed from `main` branch to Netlify
- **Backend**: Auto-deployed from `main` branch to Render
- **Database**: Managed PostgreSQL on Render

### CI/CD Pipeline
- **GitHub Actions**: Runs tests on every push
- **Netlify**: Preview deployments for PRs
- **Render**: Auto-deploy on main branch merge

## 📝 Development Workflow

1. **Create feature branch** from `main`
2. **Develop locally** (backend + frontend together)
3. **Write tests** for new features
4. **Run test suite** (`npm test`)
5. **Push to GitHub** (triggers CI tests)
6. **Create PR** (gets preview deployment)
7. **Review & merge** (auto-deploys to production)

## 🤝 Contributing

This is currently a single-developer project, but contributions are welcome!

### Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Use conventional commit messages
- Update documentation
- Follow Copilot instructions (`.github/copilot-instructions.md`)

## 🐛 Known Issues

- 3 skipped timeout tests (error-handling edge cases)
- 1 npm high severity vulnerability (dependency)

See [GitHub Issues](https://github.com/cmollenbach/sourdough-app/issues) for full list

## 📈 Roadmap

### Phase 1: Mobile Foundation (Current)
- [x] Web app deployed and working
- [x] Backend API stable
- [x] CI/CD pipeline established
- [ ] Create `shared/` directory
- [ ] Migrate reusable code to `shared/`
- [ ] Set up React Native project

### Phase 2: Mobile MVP (Next 3 weeks)
- [ ] Basic recipe viewing on mobile
- [ ] Authentication (Google OAuth)
- [ ] Bake timer with notifications
- [ ] Test on physical Android device
- [ ] Submit to Google Play Store

### Phase 3: Mobile Feature Parity (After MVP)
- [ ] Recipe creation on mobile
- [ ] Photo uploads
- [ ] Offline support
- [ ] Background sync
- [ ] iOS version

### Phase 4: Advanced Features
- [ ] Community recipe sharing
- [ ] Bake history analytics
- [ ] Temperature/humidity tracking
- [ ] AI-powered bake recommendations

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

## 💬 Contact

- **Developer**: Chris Mollenbach
- **Email**: [Your email]
- **GitHub**: [@cmollenbach](https://github.com/cmollenbach)

## 🙏 Acknowledgments

Built with love for the sourdough baking community! 🍞

---

**Happy Baking!** 🥖✨
