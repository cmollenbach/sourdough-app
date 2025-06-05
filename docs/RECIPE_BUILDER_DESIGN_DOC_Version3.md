# Recipe Builder App — Combined Design Wireframe, Navbar, and Entity Request Spec

---

## Overview

This document details the UI wireframes and navigation specification for the Recipe Builder application, including support for a generalized "Entity Request" system for user-submitted feature and data requests.  
It covers layout, workflow, navbar, responsive behavior, and the process for requesting new entities (ingredients, steps, fields, etc.).

---

## 1. Layout Wireframe (Two-Column Responsive)

### Desktop/Tablet

- **Column 1 (Wider):**
  - Recipe management (title, notes, tags, author, targets)
  - Recipe calculator/summary (with per-step and total columns)
  - Global controls (e.g., “Show Advanced Fields”)
- **Column 2 (Narrower):**
  - Steps list (draggable, editable, minimal info)
  - Actions: add, remove, duplicate steps

- **Responsive:**  
  On mobile/tablet, columns stack vertically (Column 1 above Column 2).

#### Column 1: Recipe Management & Calculator

```plaintext
┌─────────────────────────────┐
│ [Recipe Title]              │
│ [Author]        [Tags]      │
│ [Notes]                     │
├─────────────────────────────┤
│ 🎯 [Recipe Target]          │
│   - Total dough weight      │
│   - Desired hydration       │
│   - Servings/batch size     │
├─────────────────────────────┤
│ [Calculator & Summary]      │
│ - Ingredient breakdown      │
│   (per step & total)        │
│ - Table or chart            │
├─────────────────────────────┤
│ [Show Advanced Fields] ◯    │
└─────────────────────────────┘
```

##### Calculator Section Example

```plaintext
┌─────────────────────────────────────────────┐
│ Calculator                                 │
│ ──────────────────────────────────────────  │
│ Ingredient   Step 1   Step 2   TOTAL        │
│ Flour 1      600g     —        600g         │
│ Flour 2      400g     —        400g         │
│ Water        650g     50g      700g         │
│ Levain       —        200g     200g         │
│ Salt         —        20g      20g          │
│ TOTALS      1000g    270g      1270g        │
└─────────────────────────────────────────────┘
```

---

#### Column 2: Steps List

```plaintext
┌─────────────────────────────┐
│ Steps                       │
│ ┌─────────────────────────┐ │
│ │ 1. [Step Title]         │ │
│ │   [Summary: duration,   │ │
│ │    main ingredients, etc│ │
│ │   [Edit] [Duplicate]    │ │
│ │   [Drag Handle]         │ │
│ └─────────────────────────┘ │
│ ...                         │
│ [+ Add Step]                │
└─────────────────────────────┘
```

- Each Step:
  - Title (auto from template, editable)
  - Summary (duration, timing, main ingredient(s))
  - Action buttons: Edit, Duplicate (if enabled), Remove, Drag handle for reordering

---

#### Step Editor (Modal or Slideover)

```plaintext
┌────────────────────────────────────────────┐
│ [Step Template Dropdown]                   │
│ [Step Title]                               │
│ [Timing Fields]                            │
│ [Notes]                                    │
├────────────────────────────────────────────┤
│ Ingredients                                │
│ ┌────────────────────────────────────────┐ │
│ │ Group: Flours                         │ │
│ │ - [Dropdown: Ingredient] [Pct][🗑️]    │ │
│ │ - [Dropdown: Ingredient] [Pct][🗑️]    │ │
│ │   (Last: auto-calc, can be read-only) │ │
│ │ [+ Add Ingredient]                    │ │
│ └────────────────────────────────────────┘ │
│ (Repeat for other groups: Liquids, Add-ins, etc.) │
│                                            │
│ Special case: “Add all from previous step” │
│  - [Dropdown: Source] [Pct: 100%][Read-only]│
│  - Contextual help text                    │
├────────────────────────────────────────────┤
│ [Boolean Toggles]                          │
│ [Show advanced fields] (only if global is on) │
│                                            │
│ [Save] [Cancel]                            │
└────────────────────────────────────────────┘
```

- **Request new entity:**  
  - In all dropdowns (Ingredients, Step Types, Fields, etc.), a “Request new [entity]” option is available.
  - Selecting this opens the generalized entity request modal.

- “Request new ingredient” link/button if not in dropdown (opens form/modal)
- Tooltip icons (ℹ️) for help, sourced from DB

---

#### “Request New Entity” Flow (Generalized)

- Inline in any entity selector:  
  “Can’t find what you need? [Request new ingredient/step/field/template]”
- Opens modal with:
  - Name (required)
  - Type (pre-filled: ingredient, stepType, field, etc.)
  - Description (optional, for context)
  - Additional details (optional; e.g. category, icon, defaults, as extra JSON)
  - On submit, request is saved and pending admin review.

---

### Mobile/Responsive

- On screens below a threshold (e.g., 800px):
    - Column 1 stacks above Column 2
    - Step editor and entity request modals are full-screen overlays
    - Buttons and inputs scale for touch

---

### Key Interactions

- Add/Edit/Remove/Duplicate/Reorder Steps: All managed in Column 2.
- Edit Recipe Targets/Notes: All managed in Column 1.
- Calculator updates live as steps/ingredients change.
- Advanced mode: Toggle in Column 1 or top-right workspace, reveals more fields everywhere.

---

### Accessibility & UX Notes

- All buttons/inputs are keyboard accessible.
- Tooltips and contextual help for every field (from DB).
- Clear labels for all actions (no icon-only buttons for critical actions).
- “Request new entity” is accessible from every relevant dropdown.

---

## 2. Navbar Specification

### Desktop Layout

```plaintext
┌───────────────────────────────────────────────────────────────────────────────┐
│ [Logo/Brand] [Recipes] [Bakes] [History]                                     │
│   [Active Bake 🔴 00:40:13]                                                   │
│                                                   [New Recipe] [Open] [Save]  │
│                                                            [Profile/Avatar]   │
└───────────────────────────────────────────────────────────────────────────────┘
```

#### Elements & Placement

1. **[Logo/Brand]**
   - Far left; clicking returns to main dashboard/home.

2. **Navigation Links**
   - [Recipes]: List/create/edit recipes.
   - [Bakes]: Start/manage active bake sessions.
   - [History]: Log of past bakes/recipes.
   - Active link is visually highlighted.

3. **Active Bake Indicator**
   - If a bake is running:  
     - Show a colored dot/timer, e.g. `[Active Bake 🔴 00:40:13]`
     - Clicking jumps to the active bake page/session.

4. **Recipe Actions**
   - [New Recipe]: Opens blank recipe builder.
   - [Open]: Modal/menu to select/load saved recipes.
   - [Save]: Saves current recipe (autosave optional).
   - Grouped right of navigation links, left of profile.

5. **Profile/Avatar**
   - Far right; dropdown with Account, Settings, Log out.
   - **[Settings]** (in dropdown):  
     - Access to admin/management features, e.g. [Ingredients] (visible only to users with permission).

#### Mobile/Responsive Layout

- Navbar collapses to:
  - Hamburger menu for nav links.
  - Key actions ([Active Bake], [Save]) remain visible or move to bottom nav.
  - Profile/settings in menu or as floating button.

#### Wireframe Example

```plaintext
[Logo] [Recipes] [Bakes] [History]     [Active Bake 🔴 00:40:13]     [New Recipe] [Open] [Save]   [Profile ▼]
                                                                               └────────[Settings, inc. Ingredients]
```

---

### Notes

- [Ingredients] is only in [Settings]/admin dropdown, not main navbar.
- [History] is always visible for end-users.
- [Active Bake] is always visible when active, even if user is not on the bake page.
- Workspace-wide actions ([Show Advanced Fields]) remain in the main workspace, not the navbar.
- All buttons and links are keyboard and screen-reader accessible.
- Current page is visually highlighted.
- “Request new entity” appears in all relevant dropdowns in the UI.

---

## 3. Generalized Entity Request System

### Purpose

Allow users to request the addition of new entities (ingredients, step types, fields, templates, etc.) within the app via a unified, admin-reviewable system.

### How It Appears in UI

- In any dropdown/select for ingredients, step types, fields, or templates, add a final entry:  
  `[+] Request new ingredient/step/field/template`
- Clicking this opens a modal with:
  - **Type** (auto-filled)
  - **Name** (required)
  - **Description** (optional)
  - **Extra details** (optional, e.g. category for ingredient, icon for step, etc.)
- Confirmation message on submit; request is now pending admin review.

### Admin Review

- Admins have access (via [Settings] menu) to a list of all pending entity requests.
- Each request shows:
  - Submitted by, date/time
  - Type, name, description, extra details
  - Approve/Reject actions and (optionally) reviewer notes

---

### Example Entity Request Modal

```plaintext
┌────────────────────────────────────┐
│ Request New [Entity]               │
├────────────────────────────────────┤
│ Type:        [ingredient]          │
│ Name:        [______________]      │
│ Description: [______________]      │
│ Extra:       { "category": "Flour" }│
├────────────────────────────────────┤
│ [Submit Request]   [Cancel]        │
└────────────────────────────────────┘
```

---

