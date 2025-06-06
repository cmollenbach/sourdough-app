# Recipe Builder Step Card Reference

---

## 1. Functionality Overview

- Each step is a card: draggable, editable, and dynamically rendered from backend meta.
- Step template dropdown controls which fields/ingredient groups are shown.
- Fields and ingredient groups are filtered by template and global advanced toggle.
- Inline editing for all fields.
- Action buttons: Edit, Duplicate, Remove.
- Drag handle always visible for reordering.
- Responsive: label/input side-by-side, even on mobile.
- Accessible and validated.

---

## 2. Layout & Design

```plaintext
┌──────────────────────────────────────────────────────────────┐
│ [::] 1. [Step Template ▼]         [Edit] [Duplicate] [Del]   │
│ ──────────────────────────────────────────────────────────── │
│ Label 1        [Input]                                      │
│ Label 2        [Input]                                      │
│ ...                                                        │
│ Group: Flours                                               │
│   [Dropdown] [Pct][🗑️]   [Dropdown] [Pct][🗑️]   [+ Add]     │
│ Group: Liquids                                              │
│   ...                                                      │
│ Notes           [Textarea]                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Dynamic Field & Ingredient Logic

- Step template meta fetched from backend.
- Fields: id, label, type, group, advanced, required, min/max, help text.
- Ingredient groups: defined in template meta, multi-select, percentage/amount fields.
- Advanced fields: global toggle (Zustand).
- All logic backend-driven.

---

## 4. Frontend Stack Usage

| Layer            | Library/Tool         | Usage in Step Cards                                                                 |
|------------------|---------------------|-------------------------------------------------------------------------------------|
| UI Components    | Ionic React         | Cards, buttons, inputs, grid layout, responsive design                              |
| Forms            | react-hook-form     | Dynamic field registration, validation, inline editing                              |
| Drag & Drop      | dnd-kit             | Draggable step cards, drag handle, reordering                                       |
| State Mgmt       | Zustand             | Global advanced toggle, recipe/step state, UI state                                 |
| Utilities        | clsx                | Conditional class names for styling (active, error, responsive)                     |
|                  | date-fns            | Formatting durations/times in step summaries                                        |
|                  | react-icons         | Icons for actions (edit, duplicate, delete, drag handle, info/tooltips)             |

---

## 5. Key Interactions

- Reorder steps (drag handle, dnd-kit).
- Inline edit all fields.
- Change template (dropdown).
- Add/remove ingredients in groups.
- Duplicate/remove step (action buttons).
- Show advanced fields (global toggle).
- “Request new entity” in all dropdowns.

---

## 6. Accessibility & Responsiveness

- Keyboard navigation for all controls.
- Screen reader support.
- Responsive two-column layout for fields.
- Touch-friendly.

---

## 7. Backend Meta Endpoints (Reference)

- `/api/step-templates`
- `/api/step-templates/:id/meta`
- `/api/ingredients`
- `/api/fields`

---

## 8. Sample Data Structures

```json
{
  "id": 1,
  "name": "Mix",
  "fields": [
    { "id": 1, "label": "Duration", "type": "number", "advanced": false, "required": true },
    { "id": 2, "label": "Temperature", "type": "number", "advanced": true, "required": false }
  ],
  "ingredientGroups": [
    { "name": "Flours", "allowedTypes": ["flour"] },
    { "name": "Liquids", "allowedTypes": ["water", "milk"] }
  ]
}
```

---

## 9. Implementation Steps

1. Fetch step templates and meta from backend.
2. Render StepCard for each step.
3. Use react-hook-form for all inputs.
4. Use Zustand for global advanced toggle.
5. Use dnd-kit for drag-and-drop.
6. Use Ionic React for layout and controls.
7. Ensure accessibility and responsiveness.
8. Integrate “Request new entity” in all dropdowns.

---

## 10. State & Data Flow Architecture (2025-06-06)

### Single Source of Truth

- The entire recipe (target + steps) is stored in a single state object at the top level (page or Zustand store).
- All edits (target, steps, fields, ingredients) update this central state.

### Change Propagation

- **StepCard** manages only its own form state for UX.
- On any change (template, fields, ingredients, notes, etc.), StepCard calls a callback (e.g., `onChange`) to inform StepColumn.
- **StepColumn** receives the change and calls up to the parent (RecipeBuilderPage or Zustand store) to update the central recipe state.
- No local state in StepCard or StepColumn except for form handling.

### Calculator

- Calculator is a pure function of the current recipe state.
- Runs on every relevant change and updates the UI in real time.
- Provides per-step and total ingredient summaries.

### Save/Load

- Save button triggers a POST/PUT with the current recipe state.
- Load triggers a fetch and replaces the current state.
- No autosave or versioning unless explicitly added.

### Ingredient Defaults

- When a step is added, it auto-populates with default ingredients from the template if they exist.

### Benefits

- **Consistency:** All UI reflects the latest recipe state.
- **Predictability:** Unidirectional data flow makes debugging and reasoning about state easy.
- **Extensibility:** Easy to add features like undo/redo, autosave, or collaborative editing.
- **Testability:** Pure functions and stateless components are easy to test.
- **Performance:** With proper state management (e.g., Zustand selectors), only relevant components re-render.

### Component/Data Structure

```plaintext
RecipeBuilderPage (or Zustand store)
│
├── TargetEditor (edits recipe.target)
│
├── StepColumn (receives steps, emits onStepChange/onStepRemove/onStepDuplicate/onReorder)
│     ├── StepCard (receives step, template, emits onChange)
│     └── ...
│
├── CalculatorSummary (receives recipe, displays per-step and total summaries)
│
└── Save/Load Controls (trigger backend sync)
```

---
