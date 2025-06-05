# Sourdough Recipe User Tables — Data Model & Documentation (2025, Dynamic Schema)

This document describes the user-facing data model for managing, building, and tracking sourdough recipes and bakes.  
It is intended for backend and frontend developers designing a dynamic, user-centric sourdough application, and aligns with the Sourdough Recipe Step System (system tables).

---

## Table of Contents

1.  [Overview](#overview)
2.  [Entity Relationship Diagram (Textual)](#entity-relationship-diagram)
3.  [User Table Documentation](#user-table-documentation)
    * [Recipe](#recipe)
    * [RecipeField](#recipefield)
    * [RecipeFieldValue](#recipefieldvalue)
    * [RecipeStep](#recipestep)
    * [RecipeStepField](#recipestepfield)
    * [RecipeStepIngredient](#recipestepeingredient)
    * [Bake](#bake)
    * [BakeStep](#bakestep)
    * [BakeStepField](#bakestepfield)
    * [BakeStepIngredient](#bakestepingredient)
4.  [Design Notes & Considerations](#design-notes--considerations)
5.  [Seed Script & Example Data](#seed-script--example-data)
6.  [Example User Stories](#example-user-stories)
7.  [Recommendation: Predefined System Recipes](#recommendation-predefined-system-recipes)

---

## Overview

This model supports:
- **Fully dynamic recipe fields:** All recipe-level fields (name, weight, hydration, etc.) are defined in the database, not hardcoded.
- **Flexible, user-driven recipe creation** built from system-defined step templates.
- **Step-by-step customization:** Users set parameters and ingredients per step.
- **Full baking journal:** Users can track and record their actual bake events, including step timing and deviations from a snapshotted plan.
- **True historical bake logs:** Details for each bake are snapshotted at the start of the bake, ensuring past logs are unaffected by later recipe changes.
- **Field Actuals:** Support for recording the actual value for each step field during a bake (e.g., actual temperature used), in addition to the planned value.

---

## Entity Relationship Diagram (Textual)

```
User (owner) --1----- Recipe --1----- RecipeStep --1----- RecipeStepField
        |                |                        +-- RecipeStepIngredient
        |                +-- RecipeFieldValue (dynamic recipe fields)
        +---- Bake --1----- BakeStep
                      +-- BakeStepField (planned+actuals)
                      +-- BakeStepIngredient (planned)
```

---

## User Table Documentation

### Recipe

- **Purpose:**  
  Represents a user-created sourdough recipe, including overall parameters and user notes.  
  **Now stores only metadata and relations; all recipe data is in `RecipeFieldValue`.**

- **Fields:**
  - `id`: integer, primary key
  - `owner_id`: integer, foreign key to User (multi-user support)
  - `active`: boolean — If false, recipe is hidden/archived
  - `parent_recipe_id`: integer, nullable foreign key to `Recipe` (for cloning/versioning)
  - `created_at`: timestamp
  - `updated_at`: timestamp
  - `is_predefined`: boolean — If true, this is a system or admin recipe
  - `fieldValues`: relation to `RecipeFieldValue[]` (see below)

---

### RecipeField

- **Purpose:**  
  Defines all possible recipe-level fields (e.g., name, totalWeight, hydrationPct) and their metadata.  
  **This enables dynamic forms and backend-driven UI.**

- **Fields:**
  - `id`: integer, primary key
  - `name`: string — Unique field name (e.g., "name", "totalWeight")
  - `label`: string — Human-friendly label for UI
  - `type`: string — Field type ("string", "number", "text", etc.)
  - `order`: integer — Display order
  - `visible`: boolean — Should this field be shown in the UI?
  - `advanced`: boolean — Only show in advanced mode?
  - `required`: boolean — Is this field required?
  - `helpText`: string — UI help text
  - `defaultValue`: string — Default value for new recipes

---

### RecipeFieldValue

- **Purpose:**  
  Stores the actual value for each recipe-level field for each recipe.  
  **This is the dynamic, key-value store for recipe data.**

- **Fields:**
  - `id`: integer, primary key
  - `recipe_id`: integer, foreign key to `Recipe.id`
  - `field_id`: integer, foreign key to `RecipeField.id`
  - `value`: string — The value for this field (type as per `RecipeField.type`)

---

### RecipeStep

- **Purpose:**  
  Represents a single process step in a recipe, based on a `StepTemplate`, and maintains user sequence and notes.

- **Fields:**
  - `id`: integer, primary key
  - `recipe_id`: integer, foreign key to `Recipe.id`
  - `step_template_id`: integer, foreign key to `StepTemplate.id` (system table)
  - `order`: integer — Defines step order in the recipe
  - `notes`: text — User notes for this step in the recipe plan

---

### RecipeStepField

- **Purpose:**  
  Stores user-provided values for each step parameter/field (as defined by the system `Field` table) within a `RecipeStep`.

- **Fields:**
  - `id`: integer, primary key
  - `recipe_step_id`: integer, foreign key to `RecipeStep.id`
  - `field_id`: integer, foreign key to `Field.id` (system table)
  - `value`: json — User’s input for this field (type as per `Field.type`)
  - `notes`: text, optional

---

### RecipeStepIngredient

- **Purpose:**  
  Stores user-selected ingredient blends for each `RecipeStep`, including percentage and any preparation instructions.

- **Fields:**
  - `id`: integer, primary key
  - `recipe_step_id`: integer, foreign key to `RecipeStep.id`
  - `ingredient_id`: integer, foreign key to `Ingredient.id` (system table)
  - `percentage`: float — Bakers’ percent
  - `preparation`: string — Preparation notes, optional
  - `notes`: text, optional

---

### Bake

- **Purpose:**  
  Represents a baking event (an attempt at a recipe), allowing journaling and tracking of actual results.

- **Fields:**
  - `id`: integer, primary key
  - `recipe_id`: integer, foreign key to `Recipe.id`
  - `owner_id`: integer, foreign key to User
  - `start_timestamp`: timestamp
  - `finish_timestamp`: timestamp
  - `active`: boolean
  - `parent_bake_id`: integer, nullable foreign key to `Bake`
  - `notes`: text

---

### BakeStep

- **Purpose:**  
  Tracks the user’s execution of each step during a bake, including timing, status, and deviations from the snapshotted plan.

- **Fields:**
  - `id`: integer, primary key
  - `bake_id`: integer, foreign key to `Bake.id`
  - `recipe_step_id`: integer, foreign key to `RecipeStep.id`
  - `order`: integer
  - `status`: string
  - `start_timestamp`: timestamp
  - `finish_timestamp`: timestamp
  - `deviations`: json/text
  - `notes`: text

---

### BakeStepField

- **Purpose:**  
  Stores a snapshot of the planned value for each field of a `RecipeStep` at the moment a `Bake` was started, and optionally the actual value entered during the bake.

- **Fields:**
  - `id`: integer, primary key
  - `bake_step_id`: integer, foreign key to `BakeStep.id`
  - `field_id`: integer, foreign key to `Field.id`
  - `planned_value`: json
  - `actual_value`: json, optional
  - `notes`: text, optional

---

### BakeStepIngredient

- **Purpose:**  
  Stores a snapshot of the planned ingredients for each `RecipeStep` at the moment a `Bake` was started.

- **Fields:**
  - `id`: integer, primary key
  - `bake_step_id`: integer, foreign key to `BakeStep.id`
  - `ingredient_id`: integer, foreign key to `Ingredient.id`
  - `planned_percentage`: float
  - `planned_preparation`: string
  - `notes`: text, optional

---

## Design Notes & Considerations

- **Dynamic Recipe Fields:**  
  All recipe-level fields are defined in `RecipeField` and stored in `RecipeFieldValue`, enabling backend-driven UI and easy field management.
- **Bake Snapshots:**  
  When a `Bake` is initiated, data from the associated `RecipeStepField` and `RecipeStepIngredient` are copied into `BakeStepField` and `BakeStepIngredient` respectively, creating a historical snapshot.
- **Field Actuals:**  
  `BakeStepField.actual_value` supports explicit recording of what was actually used or observed during the bake.
- **Versioning and Visibility:**  
  Recipes and bakes support parent references for cloning/versioning, and an `active` flag for archiving.
- **Type Consistency:**  
  Field values are stored as their native types in JSON or string, as defined by their metadata.
- **Referential Integrity:**  
  Soft deletion (archiving) is preferred over hard deletes to preserve historical data.
- **User Ownership:**  
  Each recipe and bake is linked to a user, supporting privacy, sharing, and collaboration.

---

## Seed Script & Example Data

- The seed script populates:
  - System user and demo user
  - Ingredient categories and ingredients
  - Step types and templates
  - All recipe fields in `RecipeField` (with metadata: label, type, helpText, etc.)
  - A sample recipe using `RecipeFieldValue` for all recipe-level data
- **How to run:**  
  1. Ensure your `package.json` has:
     ```json
     "prisma": {
       "seed": "ts-node --transpile-only prisma/seed.ts"
     }
     ```
  2. Run:
     ```sh
     npx prisma db seed
     ```
  3. You should see logs for each major step and "Seeding finished."

- **Plain language:**  
  The seed script sets up all the basic data your app needs to work, including a sample recipe and all the fields the UI will show. You can add or change fields in the database without changing the code.

---

## Example User Stories

- **Creating a Recipe:**  
  User creates a new recipe, gives it a name, sets target weight/hydration/salt, and adds steps from the library.  
  For each step, user customizes fields and ingredients.  
  User can add notes at any level.

- **Baking and Journaling:**  
  User starts a new bake from a recipe.  
  The system snapshots all relevant data.  
  User tracks timing, marks steps as completed, and records actuals and notes.

- **Cloning and Iteration:**  
  User can clone a recipe, tweak it, and save as a new version.

---

## Recommendation: Predefined System Recipes

It is highly recommended to add a feature for “predefined system recipes” (admin- or system-curated recipes available to all users as templates or starting points).  
**Implementation:** Use the `is_predefined` boolean on `Recipe`. Predefined recipes can only be edited by admins, are visible to all users, and can be cloned for customization.

---

**This model provides maximum flexibility for creative, process-driven bakers while preserving a clear link to standardized system templates and ensuring the integrity of historical bake logs. The inclusion of dynamic recipe fields, field actuals, required ingredient categories, and soft-deletion/archiving logic ensures robust, audit-proof, and extensible process tracking.**