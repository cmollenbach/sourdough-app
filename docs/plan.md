# Sourdough App: Project Plan (Updated)

---

## 1. Project Purpose

- Enable users to create, customize, and track sourdough recipes and baking sessions.
- Provide a dynamic system: all templates, steps, ingredients, and options are backend-driven.
- Support both beginners (with admin-curated templates) and advanced users (full customization).
- Preserve baking history: every bake log is a snapshot, unaffected by future changes to templates or recipes.
- Leverage modern cloud deployment (Netlify for frontend, Render for backend).
- Optimized for solo/small team development, using a monorepo structure for unified code, documentation, and project management.

---

## 2. Tech Stack (as of June 2025)

### Frontend
- **Framework:** Vite + React + TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React state/hooks (expand as needed)
- **GenAI Integration:** Gemini API (via backend)
- **Authentication:** via backend-provided API

### Backend
- **Platform:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** Email/password, Google, Apple (OAuth via Passport.js or similar)
- **GenAI Integration:** Gemini API
- **Hosting:** Render

### Monorepo Structure
```
/frontend         # Vite + React + TS app (Netlify)
/backend          # Express + TypeScript + Prisma + PostgreSQL (Render)
/docs/plan.md     # Living project plan & documentation
```

---

## 3. MVP Phase Approach

### Phase 1: MVP

**Core Features**
- Responsive web app (Tailwind CSS)
- Authentication: Email/password, Google, Apple
- Recipe management (admin-curated templates, user-created recipes)
- Unified dashboard for browsing, searching, and editing recipes
- Bake session tracking with backend-timestamped state and timers
- Bake log/history (read-only, snapshot per bake)
- GenAI (Gemini) fermentation advice (clearly labeled as AI-generated)
- User-friendly error handling and fallback states
- Basic user settings (profile, preferences)
- `/docs/plan.md` as source of truth

**MVP Excludes**
- Push notifications
- Mobile app build (Capacitor)
- Social account linking/unlinking
- Export/import recipes or logs
- Advanced GenAI features
- Analytics, real-time collaboration
- Internationalization/unit conversion (English, metric only for MVP)
- Accessibility audits (use accessible libraries/components, audit post-MVP)
- Advanced profile customization

---

### Phase 2+: Enhancements

- Push notifications (web/mobile)
- Mobile app (Capacitor)
- Social account linking
- Data export/import
- Advanced GenAI features
- Analytics, collaboration
- Internationalization/unit conversion
- Accessibility audit
- Enhanced user profiles

---

## 4. Development & Deployment

### Setup Steps (Completed)
- Repo initialized with `/frontend`, `/backend`, `/docs`
- Frontend: Vite + React + TypeScript, Tailwind CSS set up
- Backend: Node.js + Express + TypeScript, Prisma ORM, PostgreSQL configured
- Monorepo managed via git and GitHub
- Documentation in `/docs/plan.md`

### Next Steps
- Implement authentication API (backend)
- Scaffold initial UI (frontend)
- Set up CI/CD for Netlify (frontend) and Render (backend)
- Write API routes for recipes, sessions, logs
- Connect frontend to backend API
- Track requirements/issues via GitHub Issues and update this plan as project evolves

---

## 5. Documentation & Collaboration

- `/docs/plan.md` is the up-to-date source for requirements, stack, processes, and decisions.
- All contributors should review and update as the project progresses.

---

_Last updated: 2025-06-03_