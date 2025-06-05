1. User Authentication (Backend First)
Implement API endpoints for:
Register (email/password)
Login (email/password)
OAuth (Google, Apple) — use Passport.js or similar
JWT/session management
Test endpoints with Postman or similar.
2. Recipe CRUD API
Create REST (or GraphQL) endpoints for:
Create recipe (POST /api/recipes)
Read/list recipes (GET /api/recipes, /api/recipes/:id)
Update recipe (PUT/PATCH /api/recipes/:id)
Delete/soft-delete recipe (DELETE /api/recipes/:id, set active: false or archived: true)
Use Prisma to interact with your DB.
3. Step-by-Step Recipe Building
Endpoints to:
Add/edit/remove steps to a recipe (using your templates/categories)
Add/edit/remove ingredients and fields per step
Ensure you use your system templates and categories for validation.
4. Bake Tracking
Endpoints to:
Start a bake (POST /api/bakes)
Update bake steps, log actuals vs. planned
Complete a bake (set finish timestamp)
Retrieve bake logs/history
5. Frontend: Scaffold UI
Login/register screens
Recipe dashboard (list, search, create, edit, delete)
Recipe builder (step-by-step, using templates/categories)
Bake tracker (start, update, complete bake)
User profile/settings page
6. GenAI (Gemini) Integration
Add a backend endpoint that calls Gemini API for fermentation advice.
Clearly label AI-generated advice in the UI.
7. Soft Deletion/Archiving
Ensure all delete actions set a flag (e.g., active: false or archived: true) instead of hard-deleting.
Update queries to filter out archived/inactive items by default.
Tip:
Start with authentication and recipe CRUD, then build out step/bake logic, then frontend flows.
Test each API endpoint as you go.

Let me know which feature you want to start with, and I can scaffold the backend API or frontend UI for you!