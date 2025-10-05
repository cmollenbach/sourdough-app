# 🍞 Loafly - Sourdough Baking Management App

**Never miss a stretch & fold again!** Loafly helps sourdough bakers create recipes, track live baking sessions with reliable notifications, and learn from their history.

## 🚀 Quick Links

- **Live Web App**: https://loafly.app
- **Backend API**: https://sourdough-backend-onrender-com.onrender.com
- **Documentation**: [docs/](./docs/)
- **Mobile Deployment Plan**: [docs/MobileDeployment.md](./docs/MobileDeployment.md)

## 📱 Platform Support

| Platform | Status | Technology | Deployment |
|----------|--------|------------|------------|
| **Web** | ✅ **LIVE** | React + Vite + Tailwind | Netlify |
| **Backend** | ✅ **LIVE** | Express + Prisma + PostgreSQL | Render |
| **Android** | 📋 **PLANNED** | React Native + Expo | Google Play Store |
| **iOS** | 📋 **PLANNED** | React Native + Expo | App Store |

## 🏗️ Project Structure

```
sourdough-app/
├── backend/              # Express API (shared by all clients)
│   ├── src/              # TypeScript source code
│   ├── tests/            # Jest tests (394/399 passing)
│   └── prisma/           # Database schema & migrations
│
├── frontend/             # React web app
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Utilities (timingParser, etc.)
│   │   └── types/        # TypeScript interfaces
│   └── public/
│
├── mobile/               # React Native app (PLANNED)
│   ├── screens/          # Mobile screens
│   ├── components/       # Mobile UI components
│   └── services/         # Notification service, etc.
│
├── shared/               # Code shared between web + mobile (PLANNED)
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Platform-agnostic utilities
│   ├── hooks/            # React hooks
│   └── api/              # API client
│
└── docs/                 # Documentation
    ├── MobileDeployment.md
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

### Planned (Mobile)
- 📋 **Reliable stretch & fold timers**
- 📋 **Overnight fermentation alarms**
- 📋 **Push notifications** (survive device reboot)
- 📋 **Offline support**
- 📋 **Photo uploads**
- 📋 **Background sync**

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Auth**: JWT + Google OAuth
- **Deployment**: Render (containerized)

### Frontend (Web)
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **HTTP Client**: Axios
- **Deployment**: Netlify

### Mobile (Planned)
- **Framework**: React Native
- **Platform**: Expo
- **Navigation**: React Navigation
- **Notifications**: react-native-push-notification
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

### Mobile Setup (Future)

```bash
# 1. Navigate to mobile
cd mobile

# 2. Install dependencies
npm install

# 3. Install shared dependencies
cd ../shared && npm install && cd ../mobile

# 4. Start Expo
npx expo start

# 5. Run on Android
# Press 'a' or scan QR code with Expo Go app
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

- 2 non-critical test failures in meta routes
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
