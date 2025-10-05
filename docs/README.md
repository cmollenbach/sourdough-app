# 📚 Loafly Documentation

Welcome to the Loafly documentation! This directory contains all guides for developing, deploying, and understanding the Sourdough app.

---

## 🚀 Quick Start

New to the project? Start here:

1. **[Project README](../README.md)** - Project overview, live links, platform status
2. **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Complete developer setup guide
3. **[.copilot-context.md](../.copilot-context.md)** - Quick reference for AI assistants

---

## 📖 Documentation Index

### Core Guides

#### **[DEVELOPMENT.md](./DEVELOPMENT.md)**
Complete developer guide covering:
- Project structure (monorepo with backend, frontend, shared)
- Quick start (installation, setup, running locally)
- Available npm scripts for all workspaces
- Testing strategy (backend Jest, frontend Vitest)
- Database management (Prisma, PostgreSQL)
- **Mobile development with Capacitor**
- Troubleshooting common issues

**Use this for:** Day-to-day development, onboarding new developers

---

#### **[CAPACITOR_SETUP_GUIDE.md](./CAPACITOR_SETUP_GUIDE.md)**
Step-by-step mobile app setup:
- Why Capacitor for Loafly (85% code reuse)
- Phase 1-7 implementation timeline (2 weeks)
- Prerequisites (Android Studio, Java JDK 17)
- Notification service implementation
- Android permissions & configuration
- Building APK/AAB for Play Store
- Testing checklist & troubleshooting

**Use this for:** Setting up mobile development, building Android app

---

### Feature Guides

#### **[RecipeBuilder.md](./RecipeBuilder.md)**
Recipe creation system:
- Step-by-step recipe construction
- Template system (admin-curated + custom)
- Ingredient management
- Field configurations
- Bakers percentage calculations

---

#### **[BakeFeature.md](./BakeFeature.md)**
Bake tracking functionality:
- Starting a bake from a recipe
- Live tracking with timers
- Logging actuals vs. planned
- Completion & rating
- Bake history snapshots

---

#### **[Authentication.md](./Authentication.md)**
User authentication:
- Email/password registration & login
- Google OAuth integration
- JWT token management
- Session handling

---

### Technical Reference

#### **[API.md](./API.md)**
Backend API documentation:
- REST endpoints
- Request/response formats
- Authentication requirements
- Error handling

---

#### **[DataModel.md](./DataModel.md)**
Database schema & relationships:
- Prisma schema overview
- Entity relationships
- Key constraints
- Data integrity patterns

---

#### **[TESTING_GUIDE.md](./TESTING_GUIDE.md)**
Testing strategy & practices:
- Backend tests (Jest + Supertest)
- Frontend tests (Vitest + Testing Library)
- E2E tests (Playwright)
- Running tests, writing new tests
- Test coverage goals

---

### Design & UI

#### **[DesignSystem.md](./DesignSystem.md)**
Complete design system documentation:
- Color palette (light/dark modes)
- Typography scale
- Spacing system
- Component patterns
- Tailwind + Ionic integration

---

#### **[DesignSystemQuickReference.md](./DesignSystemQuickReference.md)**
Quick lookup for designers/developers:
- Common color classes
- Spacing shortcuts
- Typography examples
- Copy-paste component snippets

---

### Developer Tools

#### **[DeveloperQuickReference.md](./DeveloperQuickReference.md)**
Quick command reference:
- Common npm scripts
- Database commands
- Git workflows
- Debugging tips

---

#### **[SharedHooksReference.md](./SharedHooksReference.md)**
Shared React hooks documentation:
- `useRecipes` - Recipe data management
- `useBakes` - Bake session management
- `useAuth` - Authentication & user state
- `useMeta` - Metadata (ingredients, templates)
- Complete examples for web and mobile
- TypeScript types and testing patterns

**Use this for:** Using shared hooks in frontend or mobile app

---

## 🗂️ Directory Structure

```
docs/
├── README.md (this file)
├── DEVELOPMENT.md ⭐ (start here for development)
├── CAPACITOR_SETUP_GUIDE.md ⭐ (mobile setup)
│
├── RecipeBuilder.md
├── BakeFeature.md
├── Authentication.md
│
├── API.md
├── DataModel.md
├── TESTING_GUIDE.md
│
├── DesignSystem.md
├── DesignSystemQuickReference.md
├── DeveloperQuickReference.md
├── SharedHooksReference.md 🆕
│
└── UI/
    └── ColorSystem.md
```

---

## 🎯 Common Tasks

### "I want to start developing"
→ Read **[DEVELOPMENT.md](./DEVELOPMENT.md)**

### "I want to build the Android app"
→ Follow **[CAPACITOR_SETUP_GUIDE.md](./CAPACITOR_SETUP_GUIDE.md)**

### "I want to understand the recipe system"
→ Read **[RecipeBuilder.md](./RecipeBuilder.md)**

### "I want to add a new API endpoint"
→ Check **[API.md](./API.md)** and **[DataModel.md](./DataModel.md)**

### "I want to use shared hooks in my component"
→ Read **[SharedHooksReference.md](./SharedHooksReference.md)**

### "I want to write tests"
→ Follow **[TESTING_GUIDE.md](./TESTING_GUIDE.md)**

### "I want to style a component"
→ Use **[DesignSystem.md](./DesignSystem.md)** or **[DesignSystemQuickReference.md](./DesignSystemQuickReference.md)**

---

## 🔗 Related Files

- **[../.copilot-context.md](../.copilot-context.md)** - Quick reference for AI assistants
- **[../.github/copilot-instructions.md](../.github/copilot-instructions.md)** - Coding standards
- **[../README.md](../README.md)** - Project overview

---

## 📝 Documentation Philosophy

**Principles:**
1. **No redundancy** - Each doc has a single, clear purpose
2. **Up-to-date** - Legacy completion docs removed, only current info
3. **Actionable** - Focus on HOW to do things, not just WHAT exists
4. **Cross-linked** - Easy navigation between related topics
5. **Consolidated** - Mobile strategy is Capacitor (not React Native)

**Removed Legacy Docs:**
- ✅ Deleted temporary completion summaries (SESSION_SUMMARY, CAPACITOR_STRATEGY_UPDATE)
- ✅ Deleted setup completion docs (MONOREPO_SETUP_COMPLETE, SHARED_PACKAGE_COMPLETION)
- ✅ Deleted React Native plan (Capacitor is the only mobile strategy)
- ✅ Deleted one-time setup guides (PLAYWRIGHT_SETUP_COMPLETE, NETLIFY_DASHBOARD_FIX)
- ✅ Deleted redundant proposals (MOBILE_DEVELOPMENT_PROPOSAL merged into CAPACITOR_SETUP_GUIDE)

---

## ✨ What's New (October 5, 2025)

- 🎉 **Mobile strategy finalized**: Capacitor for 85% code reuse
- 📱 **CAPACITOR_SETUP_GUIDE.md**: Complete 7-phase implementation guide
- � **Shared React hooks**: Created useRecipes, useBakes, useAuth, useMeta (65% code reuse!)
- 📖 **SharedHooksReference.md**: Complete hooks documentation with examples
- �🧹 **Documentation cleanup**: Removed 12 redundant/legacy files
- ✅ **Shared package**: API client + hooks ready for web and mobile
- 📚 **Consolidated docs**: All info in appropriate permanent homes

---

**Last Updated:** October 5, 2025  
**Total Docs:** 13 core documents (down from 24)  
**Mobile Status:** Ready to begin Capacitor implementation
* **Testing**
    * [ ] Write unit and integration tests for the backend and frontend.
    * [ ] Set up a test database and seed scripts.
* **Deployment & CI/CD**
    * [ ] Set up environment variables and secrets management.
    * [ ] Automate deployment with CI/CD (GitHub Actions or similar).
* **Documentation**
    * [ ] Document API endpoints and the data model.