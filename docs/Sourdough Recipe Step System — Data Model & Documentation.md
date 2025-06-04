# Sourdough Recipe Step System — Data Model & Documentation (Updated)

This document describes the system data model for the step-building portion of a sourdough recipe application, focusing on admin-defined templates, user flexibility, and professional bakery process requirements.  
This model is intended for implementation in a relational database (SQL, Prisma, etc.) and as a guide for UI and API development.

---

## Table of Contents

1.  [Overview](#overview)
2.  [Entity Relationship Diagram (Textual)](#entity-relationship-diagram)
3.  [System Table Documentation](#system-table-documentation)
    * [StepType](#steptype)
    * [Field](#field)
    * [IngredientCategory](#ingredientcategory)
    * [Ingredient](#ingredient)
    * [StepTemplate](#steptemplate)
    * [StepTemplateField](#steptemplatefield)
    * [StepTemplateIngredientRule](#steptemplateingredientrule)
4.  [Design Notes & Final Considerations](#design-notes--final-considerations)
5.  [Example Usage](#example-usage)

---

## Overview

The system supports the creation and management of reusable "step templates" to standardize and streamline bakery recipe workflows.  
It ensures clarity and maintainability by separating system-level configuration (admin) from user-level recipe building. Ingredients are organized into categories, and step templates define which categories of ingredients are permissible for a given step.

Key design features include:
- **Step Templates**: Predefined process steps with associated fields and allowed/required ingredient category permissions.
- **Fields**: Parameters/settings relevant to a step (e.g., duration, temperature).
- **Ingredient Categories**: System-defined categories for ingredients (e.g., "Flour," "Liquid," "Inclusion").
- **Ingredients**: Master list of ingredients, each assigned to a category. Includes support for Water and Salt as advanced ingredient options.
- **Visibility, Ordering, Defaults, and Help Info**: All key tables support documentation, ordering, default values, and hide/deprecate logic.
- **Referential Integrity**: System design and application logic must ensure that edits or deletions of templates, fields, or ingredients do not orphan user or bake records. Prefer soft deletion (archiving) over hard deletes.

---

## Entity Relationship Diagram (Textual)

```
IngredientCategory --1---*-- Ingredient
StepType --1---*-- StepTemplate --*---*-- Field (via StepTemplateField)
StepTemplate --1---1-- StepTemplateIngredientRule
StepTemplateIngredientRule: allows/optionally requires specific IngredientCategory IDs (arrays)
(Actual ingredient choices and percentages are user-level, not system-level)
```

---

## System Table Documentation

### StepType

- **Purpose:**  
  Categorizes steps in the recipe process for grouping, filtering, and UI presentation.

- **Fields:**
  - `id`: integer, primary key
  - `name`: string — Unique name ("Pre-Ferment", "Mixing", "Fermentation", "Baking", etc.)
  - `description`: string — Description or help text for this step type
  - `active`: boolean — If false, hidden from new recipes but preserved for history
  - `order`: integer — Sort index for UI ordering

---

### Field

- **Purpose:**  
  Defines possible attributes ("fields") that can be attached to a step, such as "Duration", "Temperature", or "Hydration %".

- **Fields:**
  - `id`: integer, primary key
  - `name`: string — Unique field name
  - `type`: string — Data type ("integer", "float", "text", "boolean", etc.)
  - `advanced`: boolean — Whether the field is advanced or basic (for UI filtering)
  - `description`: string — Guidance or help text for the field (e.g., units, expected input)
  - `active`: boolean — If false, deprecated/hidden (but preserved for old templates)
  - `default_value`: string — Default value for the field in templates (optional)
  - `order`: integer — Sort index for UI ordering

---

### IngredientCategory

- **Purpose:**  
  Defines categories for ingredients (e.g., "Flour," "Liquid," "Sweetener," "Inclusion - Nut") to allow for more granular control in recipes and step templates.

- **Fields:**
  - `id`: integer, primary key
  - `name`: string — Unique category name (e.g., "Flour", "Liquid", "Water", "Salt", "Inclusion - Fruit")
  - `description`: string — Optional description or help text for this category
  - `active`: boolean — If false, this category is hidden from new selections but preserved for history (defaults to true)
  - `order`: integer — Sort index for UI ordering of categories

---

### Ingredient

- **Purpose:**  
  Master list of allowed ingredients, each assigned to a category. Used for ingredient pickers when an ingredient's category is allowed by a step template. Water and Salt can be included as ingredients, typically marked as `advanced`.

- **Fields:**
  - `id`: integer, primary key
  - `name`: string — Unique ingredient name
  - `ingredient_category_id`: integer, foreign key to `IngredientCategory.id`
  - `advanced`: boolean — If true, ingredient is optional/advanced (for UI filtering). Useful for ingredients like "Salt" or "Water" when treated as step-specific additions.
  - `description`: string — Info about the ingredient (flavor, function, etc.)
  - `active`: boolean — If false, ingredient is hidden from pickers
  - `order`: integer — Sort index for ingredient selectors

---

### StepTemplate

- **Purpose:**  
  An admin-defined blueprint for a process step (e.g., "Build Levain", "Bulk Fermentation").  
  Specifies which fields and ingredient categories are available for use in user recipes.

- **Fields:**
  - `id`: integer, primary key
  - `name`: string — Unique template name
  - `step_type_id`: integer, foreign key to `StepType.id`
  - `advanced`: boolean — If true, step is advanced in UI
  - `description`: string — Guidance/help for this step template
  - `active`: boolean — If false, template is hidden from new recipes
  - `order`: integer — Sort index for template lists

---

### StepTemplateField

- **Purpose:**  
  Associates a `StepTemplate` with `Field`s, specifying which parameters are relevant for each template and how they are presented.

- **Fields:**
  - `id`: integer, primary key
  - `step_template_id`: integer, foreign key to `StepTemplate.id`
  - `field_id`: integer, foreign key to `Field.id`
  - `advanced`: boolean — If true, field is advanced for this template (can override `Field.advanced`)
  - `description`: string — Additional template-specific guidance for this field
  - `active`: boolean — Deprecated/hide field for this template
  - `default_value`: string — Default value for this field in this template
  - `order`: integer — Sort order within the template

---

### StepTemplateIngredientRule

- **Purpose:**  
  Specifies which categories of ingredients (e.g., "Flour," "Liquid," "Inclusion - Nut") the user is allowed and/or required to select from when using this step template.  
  Does not enumerate actual ingredient choices (handled at the user recipe instance level based on ingredients belonging to the allowed categories).

- **Fields:**
  - `id`: integer, primary key
  - `step_template_id`: integer, foreign key to `StepTemplate.id` (typically one-to-one)
  - `allowed_category_ids`: array of integer — List of `IngredientCategory.id`s that are permitted for this step template. For example `[1, 2, 5]` where 1 is 'Flour', 2 is 'Water', 5 is 'Inclusion - Nut'.
  - `required_category_ids`: array of integer — (Optional/future-proof) List of `IngredientCategory.id`s that must be represented by at least one ingredient in this step (e.g., `[1]` for "Flour" required).
  - `description`: string — Guidance/help for ingredient selection in this step (e.g., "Only flours and water allowed for autolyse.")
  - `active`: boolean — If false, this rule set is hidden/deprecated

---

## Design Notes & Final Considerations

- **Ingredient Selection:**  
  `StepTemplateIngredientRule` now specifies both allowed and required `IngredientCategory` IDs. Actual ingredient choices and blends (from the allowed categories) are managed per user recipe and not at the system/template level.
- **Water and Salt:**  
  Water and Salt can be defined as `Ingredient`s, assigned to appropriate categories (e.g., "Water," "Salt"), and typically marked as `advanced: true`. Their addition in specific steps can be controlled by including their categories in `StepTemplateIngredientRule.allowed_category_ids`. This complements global recipe hydration/salt percentages which might be overall targets or defaults.
- **Ordering & Visibility:**  
  All major tables include `order` and `active` fields to control display order and visibility in the UI.
- **Documentation:**  
  All major tables include a `description` field for tooltips, help popups, or inline guidance.
- **Default Values:**  
  Defaults can be set at both the `Field` and `StepTemplateField` levels for pre-filling and guidance.
- **No Versioning or Localization:**  
  The model does not currently support versioning or multi-language documentation.
- **Referential Integrity:**  
  Prefer **soft deletion** (archiving via `active: false`) for core system tables. The application layer must ensure that edits or deletions to templates, fields, or ingredients do not orphan user or bake records. When a system record is archived, it must remain available for recipes and bakes that reference it historically.
- **Extensibility:**  
  This structure is designed for future extension, e.g., adding new step types, fields, or ingredient categories.

---

## Example Usage

- **Admin** defines categories like "Flour", "Water", "Sweetener".
- **Admin** defines ingredients: "Bread Flour" (Category: "Flour"), "Whole Wheat Flour" (Category: "Flour"), "Tap Water" (Category: "Water", advanced:true), "Honey" (Category: "Sweetener").
- **Admin** defines a "Build Levain" `StepTemplate`:
  - `StepType`: "Pre-Ferment"
  - `StepTemplateField`s: Hydration %, % of dough, Duration, (advanced) Temperature.
  - `StepTemplateIngredientRule`: `allowed_category_ids` includes IDs for "Flour" and "Water"; `required_category_ids` could require "Flour". Description: "Specify flours and water for the levain build."

- **User** creates a recipe step from this template:
  - The UI shows ingredients from "Flour" and "Water" categories for selection.
  - User selects 70% Bread Flour, 30% Whole Wheat (both from "Flour" category).
  - User sets Hydration: 100% (implicitly using an ingredient from "Water" category if modeled as such, or this field drives water calculation), % of Dough: 15%, Duration: 12h, Temperature: 24°C.
  - If "Sweetener" category was not in `allowed_category_ids` for this template, the user would not be able to select "Honey" for this step.

---

**This model provides a robust foundation for professional bakery process management, balancing admin structure and user flexibility with granular ingredient control, and is ready for extensible, referentially consistent implementation.**