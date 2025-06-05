# Sourdough App: Next Steps Checklist

## Database Setup
- [x] Define all tables as per your documented data model (system and user tables)
- [x] Write schema migration scripts (using Prisma, SQL, or your ORM of choice)
- [x] Create relationships, constraints, and indexes (e.g., foreign keys, unique constraints)
- [x] Seed the database with system-level data (admin step templates, ingredient categories, sample ingredients)
- [x] Test schema creation in a local/dev environment and verify with sample queries

## Core Features & Functionality
- [ ] Implement recipe creation, editing, and deletion
- [ ] Enable step-by-step custom recipe building (using templates/categories)
- [ ] Implement bake tracking: start bake, journal steps, log actuals vs. planned, complete bake
- [ ] Integrate user authentication (email/password, Google, Apple)
- [ ] Add GenAI (Gemini) fermentation advice (clearly labeled as AI-generated)
- [ ] Create dashboard for browsing/searching/editing recipes and bakes
- [ ] Add user profile management and settings
- [ ] Ensure soft deletion/archiving works as intended throughout

## Testing
- [ ] Write unit tests for backend (API, data integrity, auth)
- [ ] Write unit tests for frontend (UI components, user flows)
- [ ] Add integration tests for critical paths (e.g., recipe to bake flow)
- [ ] Set up test database and seed scripts
- [ ] Set up CI workflow for linting, type checks, and tests

## Validation & Error Handling
- [ ] Add input validation on all user-facing forms
- [ ] Implement user-friendly error and success messages
- [ ] Add fallback states for empty/error/loading screens

## Deployment & CI/CD
- [ ] Set up environment variables and secrets management
- [ ] Review deployment scripts (Netlify for frontend, Render for backend)
- [ ] Automate deployment with CI/CD (GitHub Actions or similar)

## Documentation
- [ ] Add a comprehensive README with project overview, setup, and usage
- [ ] Document API endpoints (OpenAPI/Swagger or markdown)
- [ ] Document data model and relationships (ER diagrams)
- [ ] Add CONTRIBUTING.md and CODE_OF_CONDUCT.md for contributors

## Feedback & Iteration
- [ ] Create GitHub issue/PR templates for bugs, features, and feedback
- [ ] Add demo/test data for reviewers and testers
- [ ] Gather user feedback early and iterate on UI/UX

## Optional Enhancements (Post-MVP)
- [ ] Accessibility review and improvements
- [ ] Internationalization/unit conversion support
- [ ] Advanced analytics and reporting
- [ ] Real-time collaboration features
- [ ] Mobile app build (Capacitor or similar)

---
**Tip:** Start with the database schema—once your tables and relationships are in place, core features and testing will be much smoother!