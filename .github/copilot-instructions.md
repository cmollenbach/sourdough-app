# GitHub Copilot Instructions for Sourdough App

## Project Context

This is a **sourdough baking management application** for web and mobile (React/Capacitor). It helps bakers create recipes, track live baking sessions, and learn from their history. The app uses:

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Zustand (state management)
- **Backend**: Node.js + Express + TypeScript + Prisma ORM + PostgreSQL
- **Mobile**: Capacitor (planned)
- **Single Developer**: I am the only developer working on this project

---

## Core Architecture Principles

### 1. **Security First**
- **NEVER** use hardcoded secrets or fallback secrets
- **ALWAYS** validate environment variables at startup
- **ALWAYS** validate and sanitize user inputs
- **ALWAYS** use parameterized queries (Prisma handles this)
- **NEVER** store sensitive data in localStorage (use httpOnly cookies for tokens)
- **ALWAYS** use rate limiting on API endpoints
- **ALWAYS** implement proper CORS configuration

### 2. **Type Safety**
- **ALWAYS** use TypeScript with strict mode enabled
- **NEVER** use `any` type (use `unknown` or proper types)
- **ALWAYS** define interfaces for data structures
- **ALWAYS** keep frontend and backend types in sync
- **ALWAYS** use Prisma-generated types for database entities

### 3. **Resource Management**
- **ALWAYS** use a singleton PrismaClient instance (import from `backend/src/lib/prisma.ts`)
- **NEVER** create new PrismaClient instances in route files
- **ALWAYS** implement graceful shutdown handlers
- **ALWAYS** close database connections on app termination
- **ALWAYS** set request timeouts

### 4. **Error Handling**
- **ALWAYS** use try-catch blocks in async functions
- **ALWAYS** use standardized error responses (use AppError class)
- **ALWAYS** log errors with context (user ID, request ID, etc.)
- **NEVER** expose internal error details to clients
- **ALWAYS** handle Prisma errors specifically

### 5. **Code Organization**
- **ALWAYS** follow separation of concerns: Routes → Business Logic → Data Access
- **ALWAYS** create reusable utility functions
- **ALWAYS** use custom hooks for complex logic in React components
- **ALWAYS** keep components focused and small (< 300 lines)
- **ALWAYS** extract business logic from React components

### 6. **Performance & Scalability**
- **ALWAYS** use database indexes for frequently queried fields
- **ALWAYS** avoid N+1 queries (use Prisma's `include` properly)
- **ALWAYS** implement pagination for large datasets
- **ALWAYS** cache frequently accessed, rarely changing data
- **ALWAYS** optimize images and assets

### 7. **Testing & Quality**
- **ALWAYS** write tests for new features (unit + integration)
- **ALWAYS** test error paths, not just happy paths
- **ALWAYS** validate calculations (baker's percentages, hydration)
- **ALWAYS** test authentication and authorization flows
- **ALWAYS** use meaningful test names that describe behavior

---

## Specific Coding Standards

### Backend (Node.js + Express + Prisma)

#### ✅ DO:
```typescript
// ✅ Import singleton Prisma client
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { AppError } from '../middleware/errorHandler';

// ✅ Validate environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set');
}

// ✅ Use standardized error handling
router.get('/recipes/:id', async (req, res, next) => {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: Number(req.params.id) }
    });
    
    if (!recipe) {
      throw new AppError(404, 'Recipe not found');
    }
    
    res.json(recipe);
  } catch (error) {
    next(error); // Pass to error handler middleware
  }
});

// ✅ Use input validation
import Joi from 'joi';

const recipeSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  totalWeight: Joi.number().positive().optional(),
  hydrationPct: Joi.number().min(0).max(200).optional(),
});

// ✅ Use structured logging
logger.info('Recipe created', { 
  userId: req.user.userId, 
  recipeId: recipe.id 
});
```

#### ❌ DON'T:
```typescript
// ❌ NEVER create new PrismaClient instances
const prisma = new PrismaClient(); // WRONG!

// ❌ NEVER use fallback secrets
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret"; // WRONG!

// ❌ NEVER use inconsistent error formats
res.status(500).json({ error: "Something went wrong" }); // Use AppError!

// ❌ NEVER skip input validation
const { name } = req.body; // Validate first!

// ❌ NEVER use console.log in production code
console.log('User logged in:', userId); // Use logger!
```

### Frontend (React + TypeScript + Zustand)

#### ✅ DO:
```typescript
// ✅ Use proper TypeScript interfaces
interface Recipe {
  id: number;
  name: string;
  totalWeight?: number | null;
  hydrationPct?: number | null;
}

// ✅ Extract complex logic to custom hooks
function useRecipeCalculations(recipe: Recipe) {
  return useMemo(() => {
    // Complex calculation logic
    return calculatedValues;
  }, [recipe]);
}

// ✅ Handle loading and error states
function RecipeList() {
  const { recipes, isLoading, error } = useRecipeStore();
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorDisplay error={error} />;
  
  return <div>{/* Render recipes */}</div>;
}

// ✅ Use Zustand for global state
export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  fetchRecipes: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<Recipe[]>('/recipes');
      set({ recipes: data, isLoading: false });
    } catch (error) {
      set({ error: extractErrorMessage(error), isLoading: false });
    }
  },
}));

// ✅ Use Error Boundaries for critical sections
<ErrorBoundary fallback={<ErrorFallback />}>
  <RecipeBuilder />
</ErrorBoundary>

// ✅ Use design system tokens (never hardcoded colors)
<div className="bg-surface-elevated text-text-primary border border-border">
  <button className="btn-primary">Submit</button>
  <p className="text-text-secondary">Supporting text</p>
</div>

// ✅ Mobile-first responsive design
<div className="text-2xl sm:text-3xl md:text-4xl p-4 sm:p-6">

// ✅ Ensure touch targets (minimum 44x44px)
<button className="px-4 py-2 touch-target">Click Me</button>

// ✅ Support dark mode with semantic colors
<div className="bg-surface text-text-primary">  {/* Auto-adapts */}
```

#### ❌ DON'T:
```typescript
// ❌ NEVER use 'any' type
function handleData(data: any) { } // Use proper types!

// ❌ NEVER put business logic in components
function RecipeCard({ recipe }: Props) {
  // ❌ Complex calculations here
  const flourWeight = recipe.totalWeight / (1 + hydration + salt);
  // Extract to hook or utility!
}

// ❌ NEVER ignore error states
function RecipeList() {
  const { recipes } = useRecipeStore();
  return recipes.map(...); // What if recipes is null/error?
}

// ❌ NEVER store sensitive data in localStorage
localStorage.setItem('password', password); // NEVER!
localStorage.setItem('token', jwt); // Use httpOnly cookies!

// ❌ NEVER use hardcoded colors or inline styles
<div style={{ backgroundColor: '#ce9c5c' }}>  {/* Use design tokens! */}
<div className="bg-[#f8f0e5]">  {/* Use bg-primary-100 */}

// ❌ NEVER use desktop-first responsive (use mobile-first)
<div className="text-4xl md:text-3xl sm:text-2xl">  {/* Wrong order! */}

// ❌ NEVER create touch targets smaller than 44x44px
<button className="p-1">X</button>  {/* Too small! */}

// ❌ NEVER use specific color scales for layouts (breaks dark mode)
<div className="bg-primary-100 text-secondary-900">  {/* Use semantic aliases! */}
```

### Database (Prisma + PostgreSQL)

#### ✅ DO:
```prisma
// ✅ Add indexes for frequently queried fields
model Bake {
  id        Int      @id @default(autoincrement())
  ownerId   Int
  active    Boolean  @default(true)
  
  @@index([ownerId, active]) // For filtering user's active bakes
  @@index([startTimestamp])  // For sorting by date
}

// ✅ Use proper relations
model Recipe {
  id    Int     @id @default(autoincrement())
  steps RecipeStep[]
}

model RecipeStep {
  id       Int    @id @default(autoincrement())
  recipeId Int
  recipe   Recipe @relation(fields: [recipeId], references: [id])
}
```

#### ❌ DON'T:
```prisma
// ❌ NEVER forget cascade delete rules
model User {
  recipes Recipe[] // Missing onDelete behavior
}

// ❌ NEVER use String for numeric values
model Recipe {
  totalWeight String // Should be Float or Int!
}
```

---

## Documentation Requirements

### 1. **Always Update Documentation When:**
- Adding new features or endpoints
- Modifying data models or API contracts
- Changing authentication/authorization logic
- Adding environment variables
- Changing architectural patterns

### 2. **Required Documentation Files:**

#### **`docs/README.md`**
- High-level project overview
- Core features list
- Tech stack
- Development roadmap

#### **`docs/Architecture.md`** (CREATE THIS)
- System architecture diagram
- Data flow diagrams
- Technology choices and rationale
- Security architecture
- Deployment architecture

#### **`docs/API.md`** (CREATE THIS)
- All API endpoints documented
- Request/response schemas
- Authentication requirements
- Error codes and meanings
- Example requests with curl

#### **`docs/DataModel.md`** (CREATE THIS)
- Entity Relationship Diagram
- All database models explained
- Relationships and constraints
- Indexing strategy
- Migration history notes

#### **`docs/Development.md`** (CREATE THIS)
- Setup instructions
- Environment variables
- Running locally
- Testing procedures
- Debugging tips

#### **Backend Route Documentation:**
```typescript
// ✅ ALWAYS document routes with JSDoc
/**
 * @route GET /api/recipes/:id
 * @desc Get a single recipe by ID
 * @access Protected (requires JWT)
 * @param {number} id - Recipe ID
 * @returns {Recipe} Recipe object with steps and ingredients
 * @throws {404} Recipe not found
 * @throws {401} Unauthorized
 */
router.get('/recipes/:id', authenticateJWT, async (req, res) => {
  // Implementation
});
```

#### **Frontend Component Documentation:**
```typescript
// ✅ ALWAYS document complex components
/**
 * RecipeBuilder - Main component for creating and editing recipes
 * 
 * Features:
 * - Dynamic step management with drag & drop
 * - Real-time baker's percentage calculations
 * - Auto-save functionality
 * 
 * @param {number} recipeId - ID of recipe to edit (0 for new recipe)
 * @param {boolean} showAdvanced - Whether to show advanced fields
 */
export function RecipeBuilder({ recipeId, showAdvanced }: Props) {
  // Implementation
}
```

### 3. **Documentation Format Standards:**

```markdown
## Feature Name

### Purpose
Brief description of what this feature does and why it exists.

### User Flow
1. User navigates to X
2. User performs action Y
3. System responds with Z

### Technical Implementation
- **Frontend**: Components involved, state management
- **Backend**: API endpoints, business logic
- **Database**: Models and queries used

### Edge Cases & Error Handling
- What happens if user is offline?
- What happens if data is invalid?
- What happens if concurrent edits occur?

### Testing
- Unit tests: What functions are tested
- Integration tests: What flows are tested
- Manual testing steps

### Future Enhancements
- Known limitations
- Planned improvements
```

---

## Specific Patterns for This Project

### 1. **Snapshot Pattern for Bakes**
When creating a bake from a recipe, ALWAYS snapshot all data:
```typescript
// ✅ Create complete snapshot
const bake = await prisma.bake.create({
  data: {
    recipeId: recipe.id,
    // Snapshot recipe-level values
    recipeHydrationPctSnapshot: recipe.hydrationPct,
    recipeSaltPctSnapshot: recipe.saltPct,
    recipeTotalWeightSnapshot: recipe.totalWeight,
    steps: {
      create: recipe.steps.map(step => ({
        recipeStepId: step.id,
        order: step.order,
        // Snapshot all ingredients with current values
        ingredients: {
          create: step.ingredients.map(ing => ({
            ingredientId: ing.ingredientId,
            plannedPercentage: ing.amount,
            plannedPreparation: ing.preparation,
          }))
        },
        // Snapshot all parameters with current values
        parameterValues: {
          create: step.parameterValues.map(pv => ({
            parameterId: pv.parameterId,
            plannedValue: pv.value,
          }))
        }
      }))
    }
  }
});
```

### 2. **Baker's Percentage Calculations**
ALWAYS use the standard formula:
```typescript
// ✅ Standard baker's percentage calculation
function calculateIngredients(totalWeight: number, hydration: number, salt: number) {
  const totalPercentage = 1 + (hydration / 100) + (salt / 100);
  const flourWeight = totalWeight / totalPercentage;
  const waterWeight = flourWeight * (hydration / 100);
  const saltWeight = flourWeight * (salt / 100);
  
  return { flourWeight, waterWeight, saltWeight };
}
```

### 3. **Timing Schedule Parser**
When parsing timing instructions, use the TimingParser utility:
```typescript
// ✅ Use existing timing parser
import { TimingParser } from '../utils/timingParser';

const schedule = TimingParser.parseTimingPlan("S&F at 30, 60, 90, 120 minutes");
const alarms = TimingParser.generateAlarms(schedule, startTime);
```

### 4. **Metadata-Driven UI**
ALWAYS fetch metadata (templates, ingredients) from backend:
```typescript
// ✅ Load metadata on app start
useEffect(() => {
  fetchAllMetaData(); // Loads templates, ingredients, categories
}, []);

// ✅ Use metadata to build forms dynamically
{stepTemplates.map(template => (
  <option key={template.id} value={template.id}>
    {template.name}
  </option>
))}
```

### 5. **Progressive Disclosure**
Respect the user's experience level:
```typescript
// ✅ Hide advanced features for beginners
{showAdvanced && (
  <AdvancedOptions />
)}

// ✅ Auto-enable advanced mode when needed
useEffect(() => {
  const hasAdvancedSteps = recipe.steps.some(step => 
    stepTemplates.find(t => t.id === step.stepTemplateId)?.advanced
  );
  if (hasAdvancedSteps) setShowAdvanced(true);
}, [recipe.steps]);
```

---

## Design System & Styling (Tailwind CSS + Custom Tokens)

### Color System Rules

#### ✅ DO:
```tsx
// ✅ Use semantic color aliases for layouts and surfaces
<div className="bg-surface-elevated text-text-primary border border-border">
  <h2 className="text-text-primary">Title</h2>
  <p className="text-text-secondary">Description</p>
</div>

// ✅ Use specific color scales for branded elements
<button className="bg-primary-500 text-white hover:bg-primary-600">
  Create Recipe
</button>
<span className="text-success-600">Completed</span>

// ✅ Use component utility classes from design system
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Cancel</button>
<input className="form-input" />
<label className="form-label">Recipe Name</label>

// ✅ Support dark mode automatically with semantic aliases
<div className="bg-surface text-text-primary">  
  {/* Automatically adapts to light/dark mode */}
</div>
```

#### ❌ DON'T:
```tsx
// ❌ NEVER use hardcoded hex colors
<div style={{ backgroundColor: '#ce9c5c' }}>  {/* Use design tokens! */}
<div className="bg-[#f8f0e5]">  {/* Use bg-primary-100 instead */}

// ❌ NEVER use specific color scales for layouts (breaks dark mode)
<div className="bg-primary-100 text-secondary-900 border-secondary-300">
  {/* Use bg-surface-elevated text-text-primary border-border */}
</div>

// ❌ NEVER use white/black directly (use design system)
<div className="bg-white text-black">  {/* Not theme-aware! */}

// ❌ NEVER create custom buttons without using design system
<button className="bg-blue-500 px-2 py-1 text-sm">  
  {/* Use btn-primary or extend design system */}
</button>
```

### When to Use Semantic vs Specific Colors

**Semantic Aliases (`surface`, `text-*`, `border`):**
- Page backgrounds and containers
- Text and borders
- Components that should adapt to theme
- General UI chrome

**Specific Color Scales (`primary-500`, `accent-600`):**
- Branded elements (buttons, links, highlights)
- Semantic states (success, warning, danger)
- Accent highlights
- Intentional color regardless of theme

### Responsive Design Rules

#### ✅ DO:
```tsx
// ✅ Mobile-first approach (smallest to largest)
<div className="text-2xl sm:text-3xl md:text-4xl">
<div className="p-4 sm:p-6 md:p-8">
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

// ✅ Use responsive utilities
<div className="responsive-padding">  {/* Adapts automatically */}
<div className="responsive-gap flex">

// ✅ Mobile-specific visibility
<div className="hidden sm:block">Desktop Only</div>
<div className="sm:hidden">Mobile Only</div>
```

#### ❌ DON'T:
```tsx
// ❌ NEVER use desktop-first (largest to smallest)
<div className="text-4xl md:text-3xl sm:text-2xl">  {/* Wrong order! */}
<div className="p-8 md:p-6 sm:p-4">  {/* Wrong order! */}

// ❌ NEVER use fixed pixel widths
<div style={{ width: '320px' }}>  {/* Use Tailwind classes */}
<div className="w-[500px]">  {/* Use w-full or responsive utilities */}
```

### Touch Target & Accessibility Rules

#### ✅ DO:
```tsx
// ✅ Minimum 44x44px touch targets
<button className="px-4 py-2 touch-target">Standard Button</button>
<button className="px-6 py-3 touch-target-large">Important Action</button>

// ✅ Visible focus states
<button className="focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50">

// ✅ Semantic HTML
<button className="btn-primary">Submit</button>
<nav>...</nav>
<main>...</main>

// ✅ Sufficient color contrast (WCAG AA: 4.5:1 minimum)
<p className="text-text-primary">  {/* Designed for contrast */}
```

#### ❌ DON'T:
```tsx
// ❌ NEVER create tiny touch targets
<button className="p-1 text-xs">X</button>  {/* Too small! */}

// ❌ NEVER disable focus outlines without replacement
<button className="focus:outline-none">  {/* Inaccessible! */}

// ❌ NEVER use div for buttons
<div onClick={handleClick}>Click Me</div>  {/* Use <button>! */}

// ❌ NEVER use low-contrast text
<p className="text-gray-400">  {/* May not meet WCAG standards */}
```

### Component Utility Classes

**Always use existing component utilities before creating custom styles:**

```tsx
// Buttons
btn-primary      // Primary action
btn-secondary    // Secondary action
btn-danger       // Destructive action
btn-success      // Positive action
btn-skip         // Skip/neutral action

// Forms
form-input       // Text inputs, textareas
form-label       // Input labels

// Layout
page-bg          // Page background with min-height
recipe-card      // Card container with elevation

// Mobile
touch-target     // 44x44px minimum
touch-target-large // 48x48px minimum
mobile-safe-bottom // Bottom padding for safe area
responsive-padding // Adapts to screen size
responsive-gap   // Adapts gap to screen size
```

### Extending the Design System

When you need new component styles:

1. **Check if existing utilities can be combined first**
2. **If new utility needed, add to `src/index.css` under `@layer components`**
3. **Use `@apply` with existing Tailwind utilities**
4. **Include dark mode support with `.dark &` selector**
5. **Ensure touch targets for interactive elements**
6. **Document in `docs/DesignSystem.md`**

```css
/* ✅ CORRECT: New component utility in index.css */
.btn-outline {
  @apply bg-transparent border-2 border-primary-500 text-primary-600
         hover:bg-primary-50 
         px-4 py-2 rounded-lg transition touch-target;
  
  .dark & {
    @apply text-primary-400 border-primary-400 hover:bg-primary-950;
  }
}
```

## Mobile-Specific Considerations (React + Capacitor)

When writing mobile code:

### ✅ DO:
- Use responsive Tailwind classes with mobile-first approach
- Ensure all interactive elements have minimum 44x44px touch targets
- Test touch interactions (tap, swipe, long-press)
- Use native device features via Capacitor plugins
- Implement offline-first for critical features
- Optimize for slower networks (loading states, optimistic updates)
- Use mobile-appropriate input types (`type="tel"`, `type="number"`)
- Use design system touch target utilities (`touch-target`, `touch-target-large`)
- Add safe area padding (`mobile-safe-bottom`)

### ❌ DON'T:
- Assume mouse/hover interactions work on mobile
- Use fixed pixel widths (use rem/em or Tailwind utilities)
- Ignore platform differences (iOS vs Android)
- Load large images without optimization
- Use desktop-only patterns (right-click menus, hover tooltips)
- Create touch targets smaller than 44x44px
- Use desktop-first responsive design

---

## File Naming Conventions

```
Frontend:
  components/
    Recipe/RecipeBuilder.tsx          (PascalCase for components)
    Shared/Spinner.tsx
  hooks/
    useRecipeCalculations.ts          (camelCase, prefix 'use')
  utils/
    timingParser.ts                   (camelCase for utilities)
  types/
    recipe.ts                         (lowercase for type files)

Backend:
  routes/
    recipes.ts                        (lowercase, plural)
    auth.ts
  middleware/
    authMiddleware.ts                 (camelCase)
  lib/
    prisma.ts                         (lowercase)
    logger.ts
```

---

## Git Commit Message Format

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(recipe): add bulk fermentation timing schedule

- Parse natural language timing instructions
- Generate alarm notifications
- Display countdown in active bake UI

Closes #42

---

fix(auth): prevent JWT secret fallback to insecure default

- Throw error if JWT_SECRET env var not set
- Add startup validation for all required env vars
- Update documentation

BREAKING CHANGE: JWT_SECRET must now be set in environment

---

docs(architecture): add comprehensive API documentation

- Document all REST endpoints
- Add request/response examples
- Include error codes and handling
```

---

## When to Refactor

Refactor when you see:
- **Duplication**: Same code in 3+ places → extract to function/component
- **Complexity**: Function > 50 lines → break into smaller functions
- **Tight Coupling**: Component knows too much about others → use props/events
- **Long Parameter Lists**: > 3 parameters → use object destructuring
- **God Objects**: Class/component doing too much → split responsibilities
- **Magic Numbers**: Hardcoded values → extract to constants
- **Deep Nesting**: > 3 levels of indentation → extract or simplify

---

## Code Review Checklist (Self-Review Before Committing)

### Code Quality
- [ ] All TypeScript errors resolved?
- [ ] No `any` types used (use proper types or `unknown`)?
- [ ] All console.log statements removed or replaced with logger?
- [ ] All secrets/credentials removed from code?
- [ ] Error handling implemented for all async operations?
- [ ] Loading and error states handled in UI?
- [ ] Component props properly typed?
- [ ] Database queries optimized (no N+1)?
- [ ] Using singleton PrismaClient (import from lib/prisma)?

### Design System & Styling
- [ ] Using design system color tokens (no hardcoded colors)?
- [ ] Using semantic color aliases for layouts (`surface`, `text-*`, `border`)?
- [ ] Using specific color scales for branded elements (`primary-500`, etc.)?
- [ ] Using component utility classes (`btn-primary`, `form-input`, etc.)?
- [ ] Dark mode support (semantic aliases or explicit `.dark` styles)?
- [ ] Mobile-first responsive design (`text-2xl sm:text-3xl md:text-4xl`)?
- [ ] Touch targets minimum 44x44px (using `touch-target` utilities)?
- [ ] No hardcoded hex colors or inline styles for colors?

### Accessibility
- [ ] Semantic HTML used (button, nav, main, article)?
- [ ] Visible focus states on all interactive elements?
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)?
- [ ] ARIA labels where needed?
- [ ] Keyboard navigation works?

### Documentation
- [ ] New environment variables documented in README?
- [ ] Tests written for new functionality?
- [ ] API documentation updated (if API changed)?
- [ ] Data model docs updated (if schema changed)?
- [ ] Design system docs updated (if new utilities added)?
- [ ] JSDoc comments added to functions/routes?

### Mobile & Performance
- [ ] Mobile responsiveness tested?
- [ ] Works in both light and dark mode?
- [ ] Images optimized?
- [ ] No performance regressions?

---

## Common Pitfalls to Avoid

1. **Forgetting to await Prisma queries** → Data appears undefined
2. **Not handling loading states** → Users see flash of wrong content
3. **Using stale closures in useEffect** → Infinite loops or stale data
4. **Mutating state directly in React** → Use immer or spread operator
5. **Not cleaning up subscriptions** → Memory leaks
6. **Ignoring TypeScript errors** → Runtime bugs slip through
7. **Hardcoding values** → Changes require code deployment
8. **Not validating user input** → Security vulnerabilities
9. **Forgetting database indexes** → Slow queries as data grows
10. **Not handling offline scenarios** → App breaks without internet

---

## Emergency Debugging Commands

```bash
# Check Prisma schema and database sync
npx prisma db pull
npx prisma validate

# Check for Prisma migration issues
npx prisma migrate status

# Generate fresh Prisma client
npx prisma generate

# Check database connection
npx prisma db push --preview-feature

# View database contents
npx prisma studio

# Check TypeScript errors
npm run build

# Check for unused dependencies
npx depcheck

# Check bundle size
npm run build -- --analyze
```

---

## Performance Budgets

Stay within these limits:

- **Component render time**: < 16ms (60 FPS)
- **API response time**: < 200ms (p95)
- **Database query time**: < 100ms (p95)
- **Frontend bundle size**: < 500KB (gzipped)
- **Time to interactive**: < 3 seconds
- **Images**: < 200KB each

---

## Accessibility Requirements

- All images have `alt` text
- All interactive elements keyboard accessible
- Color contrast ratio ≥ 4.5:1
- Form labels properly associated
- Error messages announced to screen readers
- Focus indicators visible
- Skip navigation links provided

---

## Questions to Ask When Adding Code

1. **Is this secure?** Could an attacker exploit this?
2. **Is this performant?** Will this slow down with 1000 users?
3. **Is this maintainable?** Will I understand this in 6 months?
4. **Is this testable?** Can I write automated tests for this?
5. **Is this accessible?** Can disabled users use this?
6. **Is this mobile-friendly?** Does this work on small screens?
7. **Is this documented?** Will others understand how to use this?
8. **Is this necessary?** Can I achieve this with less code?

---

## Final Reminder

**When in doubt:**
- Prioritize security over convenience
- Prioritize correctness over speed
- Prioritize maintainability over cleverness
- Prioritize user experience over developer experience
- Ask for help rather than making assumptions

**Always remember:**
- This app handles user data → treat it with respect
- Users trust the app with their recipes → don't lose their data
- Clear, simple code is better than clever, complex code
- Today's quick hack is tomorrow's maintenance burden
- Documentation is a gift to your future self

---

## End of Instructions

These instructions should guide all code generation, suggestions, and reviews. When suggesting code, always follow these patterns and principles. When you see violations of these principles in existing code, suggest refactoring.
