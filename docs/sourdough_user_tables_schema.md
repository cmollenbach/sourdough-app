# Sourdough Recipe User Tables — Data Model & Documentation (Updated)

This document describes the user-facing data model for managing, building, and tracking sourdough recipes and bakes.  
It is intended for backend and frontend developers designing a dynamic, user-centric sourdough application, and aligns with the Sourdough Recipe Step System (system tables) previously documented.

---

## Table of Contents

1.  [Overview](#overview)
2.  [Entity Relationship Diagram (Textual)](#entity-relationship-diagram)
3.  [User Table Documentation](#user-table-documentation)
    * [Recipe](#recipe)
    * [Recipe_Step](#recipe_step)
    * [Recipe_Step_Field](#recipe_step_field)
    * [Recipe_Step_Ingredient](#recipe_step_ingredient)
    * [Bake](#bake)
    * [Bake_Step](#bake_step)
    * [Bake_Step_Field](#bake_step_field)
    * [Bake_Step_Ingredient](#bake_step_ingredient)
4.  [Design Notes & Considerations](#design-notes--considerations)
5.  [Example User Stories](#example-user-stories)
6.  [Recommendation: Predefined System Recipes](#recommendation-predefined-system-recipes)

---

## Overview

This model supports:
- Flexible, user-driven recipe creation built from system-defined step templates.
- Step-by-step customization: users set parameters and ingredients per step.
- Full baking journal: users can track and record their actual bake events, including step timing and deviations from a snapshotted plan.
- True historical bake logs: details for each bake are snapshotted at the start of the bake, ensuring past logs are unaffected by later recipe changes.
- **Field Actuals:** Support for recording the actual value for each step field during a bake (e.g., actual temperature used), in addition to the planned value.

---

## Entity Relationship Diagram (Textual)

```
User (owner) --1----- Recipe --1----- Recipe_Step --1----- Recipe_Step_Field
                         |                         +-- Recipe_Step_Ingredient
                         |
                         +---- Bake --1----- Bake_Step
                                   +-- Bake_Step_Field (planned+actuals)
                                   +-- Bake_Step_Ingredient (planned)
```

---

## User Table Documentation

### Recipe

- **Purpose:**  
  Represents a user-created sourdough recipe, including overall parameters and user notes.

- **Fields:**
  - `id`: integer, primary key
  - `owner_id`: integer, foreign key to User (multi-user support)
  - `name`: string — Recipe name
  - `total_weight`: float — Target total dough weight (grams)
  - `hydration_pct`: float — Overall target hydration percent (water/flour, excluding starter)
  - `salt_pct`: float — Overall target salt percent (salt/flour)
  - `active`: boolean — If false, recipe is hidden/archived
  - `parent_recipe_id`: integer, nullable foreign key to `Recipe` (for cloning/versioning)
  - `created_at`: timestamp
  - `updated_at`: timestamp
  - `notes`: text — General recipe notes

---

### Recipe_Step

- **Purpose:**  
  Represents a single process step in a recipe, based on a `StepTemplate`, and maintains user sequence and notes. This defines the "plan" for a step.

- **Fields:**
  - `id`: integer, primary key
  - `recipe_id`: integer, foreign key to `Recipe.id`
  - `step_template_id`: integer, foreign key to `StepTemplate.id` (system table)
  - `order`: integer — Defines step order in the recipe
  - `notes`: text — User notes for this step in the recipe plan

---

### Recipe_Step_Field

- **Purpose:**  
  Stores user-provided values for each step parameter/field (as defined by the system `Field` table) within a `Recipe_Step`. This is part of the recipe "plan".

- **Fields:**
  - `id`: integer, primary key
  - `recipe_step_id`: integer, foreign key to `Recipe_Step.id`
  - `field_id`: integer, foreign key to `Field.id` (system table)
  - `value`: jsonb — User’s input for this field (e.g., `60` for duration, `"room temp"` for a note, `true` for a boolean). The structure and type within the JSONB should align with the `Field.type` definition.
  - `notes`: text, optional — For per-field notes or clarifications within the recipe plan

---

### Recipe_Step_Ingredient

- **Purpose:**  
  Stores user-selected ingredient blends for each `Recipe_Step`, including percentage and any preparation instructions. This is part of the recipe "plan".

- **Fields:**
  - `id`: integer, primary key
  - `recipe_step_id`: integer, foreign key to `Recipe_Step.id`
  - `ingredient_id`: integer, foreign key to `Ingredient.id` (system table)
  - `percentage`: float — Bakers’ percent (relative to total flour in the recipe, or relevant flour for that step if applicable)
  - `preparation`: string — Preparation notes (e.g., “toasted”, “soaked”), optional
  - `notes`: text, optional — User notes for this ingredient in this step of the recipe plan

---

### Bake

- **Purpose:**  
  Represents a baking event (an attempt at a recipe), allowing journaling and tracking of actual results.

- **Fields:**
  - `id`: integer, primary key
  - `recipe_id`: integer, foreign key to `Recipe.id` (the recipe this bake was based on)
  - `owner_id`: integer, foreign key to User
  - `start_timestamp`: timestamp — Bake start time
  - `finish_timestamp`: timestamp — Bake finish time
  - `active`: boolean — Whether this bake is ongoing/visible
  - `parent_bake_id`: integer, nullable foreign key to `Bake` (for cloning/repeat attempts)
  - `notes`: text — Bake-wide observations or results

---

### Bake_Step

- **Purpose:**  
  Tracks the user’s execution of each step during a bake, including timing, status, and deviations from the snapshotted plan.

- **Fields:**
  - `id`: integer, primary key
  - `bake_id`: integer, foreign key to `Bake.id`
  - `recipe_step_id`: integer, foreign key to `Recipe_Step.id` (links to the original planned step for reference)
  - `order`: integer — Step order within the bake (should mirror `Recipe_Step.order`)
  - `status`: string — Status (`pending`, `active`, `completed`, `skipped`, `paused`, etc.)
  - `start_timestamp`: timestamp — Actual step start time
  - `finish_timestamp`: timestamp — Actual step finish time
  - `deviations`: jsonb/text — Record of general observations or deviations not captured in specific `Bake_Step_Field` or `Bake_Step_Ingredient` actuals (e.g., "Dough felt sluggish").
  - `notes`: text — Per-step bake notes

---

### Bake_Step_Field

- **Purpose:**  
  Stores a snapshot of the planned value for each field of a `Recipe_Step` at the moment a `Bake` was started, and optionally the actual value entered during the bake. This ensures historical accuracy of what was *planned* for that specific bake, and supports recording *actuals* for process tracking.

- **Fields:**
  - `id`: integer, primary key
  - `bake_step_id`: integer, foreign key to `Bake_Step.id`
  - `field_id`: integer, foreign key to `Field.id` (system table, identifies the field)
  - `planned_value`: jsonb — The snapshotted value for this field as it was in `Recipe_Step_Field.value` when the bake began.
  - `actual_value`: jsonb, optional — The actual value used or observed during the bake (e.g., actual temperature, time, etc.)
  - `notes`: text, optional — User notes specifically about this field's execution during this bake (e.g., "Target temp was 24C, actual was 22C").

---

### Bake_Step_Ingredient

- **Purpose:**  
  Stores a snapshot of the planned ingredients (and their percentages/preparation) for each `Recipe_Step` at the moment a `Bake` was started. This ensures historical accuracy.

- **Fields:**
  - `id`: integer, primary key
  - `bake_step_id`: integer, foreign key to `Bake_Step.id`
  - `ingredient_id`: integer, foreign key to `Ingredient.id` (system table, identifies the ingredient)
  - `planned_percentage`: float — The snapshotted baker's percentage for this ingredient as it was in `Recipe_Step_Ingredient.percentage` when the bake began.
  - `planned_preparation`: string — The snapshotted preparation notes.
  - `notes`: text, optional — User notes specifically about this ingredient's use during this bake (e.g., "Used slightly less rye than planned").

---

## Design Notes & Considerations

- **Bake Snapshots:**  
  When a `Bake` is initiated, data from the associated `Recipe_Step_Field`s and `Recipe_Step_Ingredient`s are copied into `Bake_Step_Field` (`planned_value`) and `Bake_Step_Ingredient` (`planned_percentage`, `planned_preparation`) respectively. This creates a "snapshot" of the plan for that specific bake, ensuring that future edits to the parent `Recipe` do not alter the historical record of the bake.
- **Field Actuals:**  
  `Bake_Step_Field.actual_value` supports explicit recording of what was actually used or observed during the bake for each step field (e.g., actual temperature, time, hydration, etc.). This enables rich process tracking and post-bake analysis.
- **Versioning and Visibility:**  
  Recipes and bakes support parent references for cloning/versioning, and an `active` flag for archiving without deletion.
- **Type Consistency for Field Values:**  
  `Recipe_Step_Field.value`, `Bake_Step_Field.planned_value`, and `Bake_Step_Field.actual_value` are stored as `JSONB`. The backend should ensure values are stored as their native JSON types (number, string, boolean) according to the `Field.type` definition, simplifying frontend handling.
- **Ingredient Percentages:**  
  Always record as bakers’ percent for professional consistency, but UI may also show gram equivalents calculated from the `Recipe.total_weight` and total flour.
- **Referential Integrity:**  
  When recipes, steps, fields, or ingredients are edited or archived, any related bake records must remain referentially intact and accessible for historical review. Soft deletion (archiving) is strongly preferred over hard deletes. Bake and recipe records must preserve historical data even if their system or user-record dependencies are later archived.
- **Step Status:**  
  `Bake_Step.status` tracks the workflow and journaling of actual bake execution. The `status` field has been removed from `Recipe_Step`.
- **Deviations Tracking:**  
  The `Bake_Step.deviations` field can be used for general notes on deviations. Specific deviations from planned values (e.g., actual temperature vs. planned temperature) can be directly compared between `planned_value` and `actual_value` in `Bake_Step_Field`.
- **User Ownership:**  
  Each recipe and bake is linked to a user, supporting privacy, sharing, and collaboration features in the future.

---

## Example User Stories

- **Creating a Recipe:**  
  User creates a new recipe, gives it a name, sets target `total_weight`/`hydration_pct`/`salt_pct`, and adds steps from the library (based on `StepTemplate`s).  
  For each `Recipe_Step`, user customizes `Recipe_Step_Field`s (e.g., `value` for duration, temperature) and adds `Recipe_Step_Ingredient`s (e.g., 80% Bread Flour, 20% Rye, with specific `ingredient_id`s and `percentage`s).  
  User can add notes at the recipe, step, field, or ingredient level.

- **Baking and Journaling:**  
  User starts a new `Bake` from a recipe.  
  At this point, the system snapshots relevant data from `Recipe_Step_Field` and `Recipe_Step_Ingredient` into `Bake_Step_Field` and `Bake_Step_Ingredient`.  
  The app tracks `start_timestamp`/`finish_timestamp` for the whole bake and each `Bake_Step`.  
  User can mark `Bake_Step.status` (e.g., completed, skipped).  
  User can add notes to `Bake.notes`, `Bake_Step.notes`, `Bake_Step_Field.notes`, or `Bake_Step_Ingredient.notes`.  
  Deviations from the snapshotted plan (e.g., "bulk fermentation actually took 30 min longer than the `planned_value` for duration") can be recorded or directly logged as an `actual_value` in `Bake_Step_Field`.

- **Cloning and Iteration:**  
  User can clone a recipe (creating a new one with `parent_recipe_id` set), tweak its `Recipe_Step`s, `Recipe_Step_Field`s, and `Recipe_Step_Ingredient`s, and save as a new version.

---

## Recommendation: Predefined System Recipes

It is highly recommended to add a feature for “predefined system recipes” (admin- or system-curated recipes available to all users as templates or starting points). This supports onboarding, education, and best practice sharing.  
**Implementation suggestion:** Add a boolean field such as `is_predefined` to the `Recipe` table, or use a `type` field (e.g., enum: `user`, `system`, `shared`). Predefined recipes can only be edited by admins, are visible to all users, and can be cloned to a user’s own account for further customization.  
This approach is simple, powerful, and widely used in professional recipe and instructional apps.

---

**This model provides maximum flexibility for creative, process-driven bakers while preserving a clear link to standardized system templates and ensuring the integrity of historical bake logs. The inclusion of field actuals, required ingredient categories, and soft-deletion/archiving logic ensures robust, audit-proof, and extensible process tracking.**