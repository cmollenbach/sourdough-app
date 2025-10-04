# Sourdough App - Data Model Documentation

## Overview

The Sourdough App uses PostgreSQL as the database with Prisma ORM for type-safe data access. The data model is designed around three core concepts:

1. **Recipes** - Templates for baking (what you plan to do)
2. **Bakes** - Execution instances (what you actually did)
3. **Metadata** - Dynamic configuration (step types, ingredients, parameters)

---

## Core Design Principles

### 1. **Snapshot Pattern**
When a bake is created from a recipe, all data is snapshotted. This ensures:
- Historical accuracy (past bakes show what you actually did)
- Recipe modifications don't affect existing bakes
- Learning from previous attempts is possible

### 2. **Metadata-Driven System**
Step types, ingredients, and parameters are stored in the database, not hardcoded:
- Admins can add new options without code changes
- Forms are generated dynamically
- System is easily extensible

### 3. **Soft Deletes**
All entities use an `active` flag instead of hard deletes:
- Data is never truly lost
- Historical integrity maintained
- Potential for "undo" functionality

---

## Entity Relationship Diagram

```
User
├── UserProfile (1:1)
├── Account[] (1:N) - OAuth/password authentication
├── Session[] (1:N) - JWT sessions
├── Recipe[] (1:N) - Created recipes
├── Bake[] (1:N) - Baking sessions
├── EntityRequest[] (1:N) - Feature requests
└── UserAction[] (1:N) - Activity tracking

Recipe
├── RecipeStep[] (1:N)
│   ├── RecipeStepIngredient[] (1:N)
│   └── RecipeStepParameterValue[] (1:N)
└── Bake[] (1:N) - Bakes created from this recipe

Bake (Snapshot of Recipe)
├── BakeStep[] (1:N)
│   ├── BakeStepIngredient[] (1:N) - Planned ingredients (snapshot)
│   └── BakeStepParameterValue[] (1:N) - Planned + Actual values
└── Recipe (N:1) - Link to original recipe

StepTemplate (Metadata)
├── RecipeStep[] (1:N)
├── StepType (N:1)
├── StepTemplateParameter[] (1:N)
└── StepTemplateIngredientRule[] (1:N)

Ingredient (Metadata)
├── IngredientCategory (N:1)
├── RecipeStepIngredient[] (1:N)
└── BakeStepIngredient[] (1:N)

StepParameter (Metadata)
├── StepTemplateParameter[] (1:N)
├── RecipeStepParameterValue[] (1:N)
└── BakeStepParameterValue[] (1:N)
```

---

## Core Models

### User

**Purpose:** Core user account and authentication

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `email` | String? | User email (unique, nullable for OAuth-only) |
| `emailVerified` | Boolean | Email verification status |
| `passwordHash` | String? | Hashed password (null for OAuth users) |
| `role` | UserRole | USER or ADMIN |
| `isActive` | Boolean | Account active status |
| `lastLoginAt` | DateTime? | Last login timestamp |
| `createdAt` | DateTime | Account creation |
| `updatedAt` | DateTime | Last update |

**Relations:**
- One UserProfile
- Many Accounts (for OAuth providers)
- Many Sessions (JWT tokens)
- Many Recipes (owned recipes)
- Many Bakes (baking sessions)

**Indexes:**
- `@unique` on `email`

**Notes:**
- Soft delete via `isActive` flag
- Email can be null for OAuth-only accounts
- Password hash uses bcrypt with salt rounds 10

---

### UserProfile

**Purpose:** User preferences, experience tracking, and display information

**Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | Int | - | Primary key |
| `userId` | Int | - | Foreign key to User (unique) |
| `displayName` | String | - | Display name for UI |
| `avatarUrl` | String? | null | Profile picture URL |
| `bio` | String? | null | User bio |
| `experienceLevel` | String | "beginner" | beginner/intermediate/advanced |
| `recipesCreated` | Int | 0 | Count of recipes created |
| `bakesCompleted` | Int | 0 | Count of completed bakes |
| `totalBakeTimeMinutes` | Int | 0 | Total time spent baking |
| `advancedFeaturesUsed` | String[] | [] | List of advanced features used |
| `preferredDifficulty` | String? | null | simple/moderate/complex |
| `averageSessionMinutes` | Int | 0 | Average session duration |
| `lastActiveAt` | DateTime | now() | Last activity timestamp |
| `showAdvancedFields` | Boolean | false | UI preference |
| `autoSaveEnabled` | Boolean | true | Auto-save preference |
| `defaultHydration` | Float | 75.0 | Default hydration % |
| `preferredSaltPct` | Float | 2.0 | Default salt % |
| `expandStepsOnLoad` | Boolean | false | UI preference |
| `showIngredientHelp` | Boolean | true | UI preference |

**Relations:**
- One User (required)
- Many UserActions
- Many UserPreferences

**Notes:**
- Experience level auto-advances based on usage
- Advanced features tracking enables progressive disclosure
- All preferences with sensible defaults

---

### Account

**Purpose:** Multiple authentication methods per user (email/password, Google, Apple)

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `userId` | Int | Foreign key to User |
| `provider` | String | 'email', 'google', 'apple' |
| `providerAccountId` | String | ID from OAuth provider |
| `accessToken` | String? | OAuth access token |
| `refreshToken` | String? | OAuth refresh token |
| `tokenExpiresAt` | DateTime? | Token expiration |

**Relations:**
- One User (required)

**Notes:**
- User can have multiple accounts (e.g., email + Google)
- Provider + providerAccountId should be unique together
- Tokens stored for API access (future feature)

---

### Recipe

**Purpose:** Template for baking process

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `ownerId` | Int | Foreign key to User |
| `name` | String | Recipe name (unique) |
| `notes` | String? | Recipe notes/description |
| `totalWeight` | Float? | Target total dough weight (g) |
| `hydrationPct` | Float? | Overall hydration percentage |
| `saltPct` | Float? | Salt as % of flour |
| `isPredefined` | Boolean | Admin-created template |
| `active` | Boolean | Soft delete flag |
| `parentRecipeId` | Int? | For versioning (future) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last modification |

**Relations:**
- One User (owner)
- Many RecipeSteps (ordered)
- Many Bakes (created from this recipe)
- Optional parent Recipe (versioning)

**Indexes:**
```prisma
@@index([ownerId, active]) // User's active recipes
@@index([isPredefined, active]) // Template recipes
```

**Business Rules:**
- Name must be unique across all recipes
- totalWeight, hydrationPct, saltPct are optional (calculated or manual)
- isPredefined recipes are visible to all users
- Soft delete via `active` flag

---

### RecipeStep

**Purpose:** Individual process step within a recipe

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `recipeId` | Int | Foreign key to Recipe |
| `stepTemplateId` | Int | Foreign key to StepTemplate |
| `order` | Int | Step sequence (1-based) |
| `description` | String? | Custom description |
| `notes` | String? | Step-specific notes |

**Relations:**
- One Recipe (required)
- One StepTemplate (defines step type)
- Many RecipeStepIngredients
- Many RecipeStepParameterValues
- Many BakeSteps (when baked)

**Indexes:**
```prisma
@@index([recipeId, order]) // Ordered steps for a recipe
```

**Notes:**
- Order determines execution sequence
- StepTemplate provides default configuration
- Description can override template description

---

### RecipeStepIngredient

**Purpose:** Ingredients used in a specific recipe step

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `recipeStepId` | Int | Foreign key to RecipeStep |
| `ingredientId` | Int | Foreign key to Ingredient |
| `amount` | Float | Quantity (% or grams) |
| `calculationMode` | Enum | PERCENTAGE or FIXED_WEIGHT |
| `preparation` | String? | "sifted", "room temp", etc. |
| `notes` | String? | Ingredient notes |

**Relations:**
- One RecipeStep (required)
- One Ingredient (required)

**Calculation Modes:**
- `PERCENTAGE`: Baker's percentage (% of total flour)
- `FIXED_WEIGHT`: Absolute weight in grams

**Notes:**
- Amount interpretation depends on calculationMode
- Preparation is free-text for flexibility
- Frontend calculates actual weights from percentages

---

### RecipeStepParameterValue

**Purpose:** Parameter values for a recipe step (temperature, duration, etc.)

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `recipeStepId` | Int | Foreign key to RecipeStep |
| `parameterId` | Int | Foreign key to StepParameter |
| `value` | Json | Actual value (type varies) |
| `notes` | String? | Parameter notes |

**Relations:**
- One RecipeStep (required)
- One StepParameter (required)

**Notes:**
- Value is Json to support different data types
- StepParameter.type defines how to interpret value
- Frontend validates based on parameter type

---

## Bake Models (Snapshot System)

### Bake

**Purpose:** An execution instance of a recipe with snapshots of target values

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `recipeId` | Int | Link to original recipe |
| `ownerId` | Int | Foreign key to User |
| `startTimestamp` | DateTime | When bake started |
| `finishTimestamp` | DateTime? | When bake completed |
| `active` | Boolean | Currently in progress |
| `notes` | String? | Bake notes/name |
| `rating` | Int? | 1-5 star rating |
| `recipeTotalWeightSnapshot` | Float? | Snapshot of target weight |
| `recipeHydrationPctSnapshot` | Float? | Snapshot of hydration |
| `recipeSaltPctSnapshot` | Float? | Snapshot of salt % |
| `parentBakeId` | Int? | For cloning (future) |
| `updatedAt` | DateTime? | Last modification |

**Relations:**
- One User (owner)
- One Recipe (original template)
- Many BakeSteps (execution steps)

**Indexes:**
```prisma
@@index([ownerId, active]) // Active bakes for user
@@index([startTimestamp]) // Chronological history
```

**Notes:**
- Snapshot fields preserve recipe targets at bake creation
- active=true means in progress
- rating added after completion
- Soft delete via `active` flag

---

### BakeStep

**Purpose:** Execution state of a recipe step

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `bakeId` | Int | Foreign key to Bake |
| `recipeStepId` | Int | Link to original RecipeStep |
| `order` | Int | Step sequence |
| `status` | Enum | PENDING/IN_PROGRESS/COMPLETED/SKIPPED/FAILED |
| `startTimestamp` | DateTime? | When step started |
| `finishTimestamp` | DateTime? | When step completed |
| `notes` | String? | Step execution notes |
| `deviations` | Json? | Structured deviation data |
| `updatedAt` | DateTime? | Last modification |

**Relations:**
- One Bake (required)
- One RecipeStep (original template)
- Many BakeStepIngredients (planned values)
- Many BakeStepParameterValues (planned + actual)

**Indexes:**
```prisma
@@index([bakeId, order]) // Ordered steps for a bake
@@index([status]) // Filter by status
```

**Status Flow:**
```
PENDING → IN_PROGRESS → COMPLETED
          ↓
       SKIPPED
          ↓
       FAILED
```

---

### BakeStepIngredient

**Purpose:** Snapshot of planned ingredient amounts for a bake step

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `bakeStepId` | Int | Foreign key to BakeStep |
| `ingredientId` | Int | Foreign key to Ingredient |
| `plannedPercentage` | Float | Planned amount (%) |
| `plannedPreparation` | String? | Planned preparation method |
| `notes` | String? | Ingredient notes |

**Relations:**
- One BakeStep (required)
- One Ingredient (metadata)

**Notes:**
- Snapshot of RecipeStepIngredient at bake creation
- No actual values tracked at ingredient level
- Deviations recorded in BakeStep.deviations

---

### BakeStepParameterValue

**Purpose:** Snapshot of planned values + recording of actual values

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `bakeStepId` | Int | Foreign key to BakeStep |
| `parameterId` | Int | Foreign key to StepParameter |
| `plannedValue` | Json | Snapshot from recipe |
| `actualValue` | Json? | What actually happened |
| `notes` | String? | Parameter notes |

**Relations:**
- One BakeStep (required)
- One StepParameter (metadata)

**Notes:**
- plannedValue is snapshot at bake creation
- actualValue recorded during/after execution
- Comparison enables learning

---

## Metadata Models

### StepTemplate

**Purpose:** Defines types of steps available (Autolyse, Mix, Bulk, etc.)

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `name` | String | Template name (unique) |
| `stepTypeId` | Int | Foreign key to StepType |
| `description` | String? | Template description |
| `role` | Enum | PREFERMENT/AUTOLYSE/MIX/BULK/SHAPE/PROOF/BAKE/etc. |
| `advanced` | Boolean | Show to advanced users only |
| `active` | Boolean | Available for use |
| `order` | Int? | Suggested order |

**Relations:**
- One StepType
- Many RecipeSteps
- Many StepTemplateParameters
- Many StepTemplateIngredientRules

**Indexes:**
```prisma
@@index([active]) // Active templates
@@index([stepTypeId, active]) // Templates by type
```

**Notes:**
- role helps with specialized logic (e.g., bulk fermentation timing)
- advanced=true hides from beginners
- order suggests default sequence

---

### StepParameter

**Purpose:** Defines available parameters (Temperature, Duration, etc.)

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `name` | String | Parameter name (unique) |
| `type` | Enum | STRING/NUMBER/BOOLEAN/JSON/DATE |
| `description` | String? | Parameter description |
| `defaultValue` | String? | Default value |
| `helpText` | String? | Help text for users |
| `advanced` | Boolean | Show to advanced users only |

**Relations:**
- Many StepTemplateParameters
- Many RecipeStepParameterValues
- Many BakeStepParameterValues

**Parameter Types:**
- `NUMBER`: Temperature, duration, count
- `STRING`: Free text
- `BOOLEAN`: Yes/no flags
- `DATE`: Timestamps
- `JSON`: Complex structured data

---

### Ingredient

**Purpose:** Catalog of available ingredients

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `name` | String | Ingredient name (unique) |
| `ingredientCategoryId` | Int | Foreign key to category |
| `description` | String? | Ingredient description |
| `defaultPreparation` | String? | Default preparation |
| `helpText` | String? | Usage tips |
| `advanced` | Boolean | Show to advanced users only |
| `active` | Boolean | Available for use |

**Relations:**
- One IngredientCategory
- Many RecipeStepIngredients
- Many BakeStepIngredients

**Indexes:**
```prisma
@@index([ingredientCategoryId, active]) // Ingredients by category
```

**Notes:**
- Categories group related ingredients (Flours, Liquids, etc.)
- defaultPreparation suggests common usage
- advanced=true hides exotic ingredients from beginners

---

### IngredientCategory

**Purpose:** Groups ingredients (Flour, Liquid, Salt, etc.)

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `name` | String | Category name (unique) |
| `description` | String? | Category description |
| `advanced` | Boolean | Advanced category |
| `active` | Boolean | Available for use |

**Relations:**
- Many Ingredients
- Many StepTemplateIngredientRules

**Standard Categories:**
- Flour
- Liquid (Water, Milk, etc.)
- Salt
- Preferment
- Enrichments (Sugar, Butter, Eggs)
- Inclusions (Seeds, Nuts, etc.)

---

## Enums

### UserRole
```prisma
enum UserRole {
  USER
  ADMIN
}
```

### ParameterDataType
```prisma
enum ParameterDataType {
  STRING
  NUMBER
  BOOLEAN
  JSON
  DATE
}
```

### IngredientCalculationMode
```prisma
enum IngredientCalculationMode {
  PERCENTAGE      // Baker's percentage (% of flour)
  FIXED_WEIGHT    // Absolute grams
}
```

### StepExecutionStatus
```prisma
enum StepExecutionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SKIPPED
  FAILED
}
```

### StepRole
```prisma
enum StepRole {
  PREFERMENT
  AUTOLYSE
  MIX
  ENRICH
  INCLUSION
  BULK
  SHAPE
  PROOF
  BAKE
  REST
  OTHER
}
```

### EntityRequestType
```prisma
enum EntityRequestType {
  INGREDIENT_SUGGESTION
  FEATURE_REQUEST
  BUG_REPORT
  RECIPE_SUBMISSION
  OTHER
}
```

### EntityRequestStatus
```prisma
enum EntityRequestStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  IMPLEMENTED
  CLOSED
}
```

---

## Indexing Strategy

### High-Priority Indexes (Already Implemented)

```prisma
// User lookups
@@unique([email]) on User

// Recipe queries
@@index([ownerId, active]) on Recipe
@@index([isPredefined, active]) on Recipe

// Bake history
@@index([ownerId, active]) on Bake
@@index([startTimestamp]) on Bake

// Step ordering
@@index([recipeId, order]) on RecipeStep
@@index([bakeId, order]) on BakeStep

// Metadata filtering
@@index([ingredientCategoryId, active]) on Ingredient
```

### Recommended Additional Indexes

```prisma
// For faster auth lookups
@@index([provider, providerAccountId]) on Account

// For user profile queries
@@index([userId]) on UserProfile

// For recipe step queries
@@index([stepTemplateId]) on RecipeStep

// For bake step status filtering
@@index([bakeId, status]) on BakeStep
```

---

## Migration Strategy

### Current Migrations
- `20250606192437_init` - Initial schema
- `20250607173534_applied_full_schema_reset` - Major refactor
- `20250607190246_simplify_recipe_fields` - Recipe fields simplified
- `20250609182639_add_bake_rating` - Added rating to Bake
- `20250609183541_make_updated_at_optional_again` - Optional updatedAt
- `20250609185757_add_bake_target_snapshots` - Added snapshot fields
- `20250610200555_add_step_role` - Added StepRole enum

### Best Practices
1. **Always create named migrations:** `npx prisma migrate dev --name descriptive_name`
2. **Test migrations on dev database first**
3. **Include rollback plan for production migrations**
4. **Document breaking changes in migration comments**
5. **Never modify schema.prisma without migrating**

---

## Data Integrity Rules

### Cascade Deletes
```prisma
// UserProfile deleted when User deleted
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

// Prevent accidental cascade deletes on Recipe versioning
parentRecipe Recipe? @relation(..., onDelete: NoAction, onUpdate: NoAction)
```

### Soft Deletes
All major entities use `active` flag:
- Recipe: `active = false` to hide
- Bake: `active = false` when completed/cancelled
- Ingredient: `active = false` to deprecate
- StepTemplate: `active = false` to retire

### Unique Constraints
- User.email (unique, nullable)
- Recipe.name (unique globally)
- Ingredient.name (unique globally)
- StepTemplate.name (unique globally)

---

## Query Patterns

### Efficient Queries (Avoid N+1)

```typescript
// ✅ GOOD - Single query with includes
const bake = await prisma.bake.findUnique({
  where: { id },
  include: {
    steps: {
      include: {
        parameterValues: { include: { parameter: true } },
        ingredients: { include: { ingredient: true } },
        recipeStep: { include: { stepTemplate: true } }
      }
    },
    recipe: true
  }
});

// ❌ BAD - N+1 queries
const bake = await prisma.bake.findUnique({ where: { id } });
for (const step of bake.steps) {
  step.ingredients = await prisma.bakeStepIngredient.findMany({ 
    where: { bakeStepId: step.id } 
  });
}
```

### Pagination

```typescript
// For large datasets
const recipes = await prisma.recipe.findMany({
  where: { ownerId: userId, active: true },
  take: 20, // Page size
  skip: (page - 1) * 20, // Offset
  orderBy: { createdAt: 'desc' }
});
```

---

## Schema Evolution Guidelines

When changing the schema:

1. **Adding fields:** Safe, use nullable or default values
2. **Removing fields:** Create migration, remove from code first
3. **Renaming fields:** Use `@map` to preserve column names
4. **Changing types:** May require data migration
5. **Adding relations:** Safe with proper foreign keys
6. **Removing relations:** Check for orphaned records first

---

**Last Updated:** October 4, 2025

**Schema Version:** 1.6.0 (as of migration 20250610200555)
