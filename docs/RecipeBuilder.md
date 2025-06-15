# Recipe Builder Guide

## 1. Overview

This document details the UI wireframes, data model, and implementation plan for the Recipe Builder application. The builder is designed around a dynamic, metadata-driven backend where all recipe fields, step fields, and ingredient data are defined in the database, not hardcoded. This enables flexible forms, easy updates, and a backend-driven UI.

## 2. Technology Choices

| Layer | Choice | Reasoning |
|---|---|---|
| UI Components | **Ionic React** | Native-feeling components for web & mobile, built for Capacitor, responsive out of the box. |
| Forms | **react-hook-form** | Lightweight, dynamic, works with any UI library, great for validation and dynamic fields. |
| Drag & Drop | **dnd-kit** | Modern, touch-friendly, works on web and mobile, easy to use for step reordering. |
| State Mgmt | **Zustand** | Minimal boilerplate, easy to use, works everywhere. |

## 3. Data Model & Schema

The recipe builder relies on a dynamic schema to manage all aspects of a recipe.

* **Recipe**: Represents a user-created recipe, storing only metadata. All dynamic recipe data is in `RecipeFieldValue`.
* **RecipeField**: Defines all possible recipe-level fields (e.g., name, totalWeight, hydrationPct) and their metadata, enabling dynamic forms.
* **RecipeFieldValue**: Stores the actual value for each recipe-level field for each specific recipe.
* **RecipeStep**: Represents a single process step in a recipe, based on a `StepTemplate`.
* **RecipeStepField**: Stores user-provided values for each step parameter.
* **RecipeStepIngredient**: Stores user-selected ingredients for each step, including baker's percentage.

## 4. UI Wireframes & Layout

The UI is a two-column responsive layout. On mobile, the columns stack vertically.

* **Column 1 (Wider)**: Contains recipe management fields (title, notes, targets) and a recipe calculator/summary.
* **Column 2 (Narrower)**: Contains the list of steps, which are draggable, editable, and can be added, removed, or duplicated.

### Core Components

* **Step Card**: Each step is a draggable card rendered dynamically from backend metadata. It includes a template dropdown, action buttons, and inline editing for all fields. The body of the card is collapsible to reduce visual clutter.
* **Step Editor**: A modal or slideover for editing step details, using `react-hook-form` for dynamic fields.
* **Navbar**: The main navbar provides navigation to Recipes, Bakes, and History, along with actions like "New Recipe" and access to the user's profile and settings.

## 5. Responsive Design and Mobile UI

* **Collapsible Step Cards**: Each `StepCard` is collapsible to reduce visual clutter, with only the header visible by default.
* **Responsive Action Bar**: A sticky footer on mobile and a sticky header on desktop ensures that primary actions like "Save" and "Start Bake" are always accessible.
* **Responsive Ingredient Input**: The ingredient table uses a column-based flex layout on mobile and a row-based layout on wider screens to ensure usability.

## 6. Key Systems & Flows

* **State & Data Flow**: The entire recipe is stored in a single state object (likely in a Zustand store). All edits update this central state, and a calculator function re-runs on every change to provide live updates.
* **Generalized Entity Request System**: Users can request new ingredients, step types, or fields directly from any dropdown menu. This opens a modal where they can submit their request for admin review.