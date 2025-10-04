# Design System Quick Reference

## Overview

This quick reference summarizes the design system rules enforced through GitHub Copilot instructions and automated checks.

---

## 🎨 Color Usage Rules

### Rule #1: NEVER Use Hardcoded Colors

```tsx
// ❌ FORBIDDEN
<div style={{ backgroundColor: '#ce9c5c' }}>
<div className="bg-[#f8f0e5]">
<div style={{ color: 'rgb(206, 156, 92)' }}>

// ✅ REQUIRED
<div className="bg-primary-500">
<div className="bg-surface-elevated">
```

### Rule #2: Use Semantic Aliases for Layouts

For backgrounds, text, and borders that should adapt to theme:

```tsx
// Backgrounds
bg-surface              // Main page background
bg-surface-elevated     // Cards, modals, elevated sections
bg-surface-subtle       // Subtle backgrounds

// Text
text-text-primary       // Main text
text-text-secondary     // Supporting text
text-text-tertiary      // Placeholder text
text-text-inverse       // Text on colored backgrounds

// Borders
border-border           // Default borders
border-border-subtle    // Subtle dividers
border-border-strong    // Emphasized borders
```

**Example:**
```tsx
<div className="bg-surface-elevated text-text-primary border border-border">
  <h2 className="text-text-primary">Title</h2>
  <p className="text-text-secondary">Description</p>
</div>
```

### Rule #3: Use Specific Scales for Branded Elements

For buttons, status indicators, and intentional colors:

```tsx
// Buttons
bg-primary-500          // Primary brand color
bg-success-600          // Success actions
bg-danger-500           // Destructive actions
bg-warning-500          // Warning states

// Text colors for status
text-success-600        // Success text
text-warning-600        // Warning text
text-danger-600         // Error text

// Accents
bg-accent-500           // Accent highlights
```

**Example:**
```tsx
<button className="bg-primary-500 text-white hover:bg-primary-600">
  Create Recipe
</button>
<span className="text-success-600">Active</span>
```

---

## 🧩 Component Utility Classes

### Rule #4: Use Existing Utilities Before Creating Custom Styles

**Button Variants:**
```tsx
btn-primary             // Primary actions (bg-primary-500, auto dark mode)
btn-secondary           // Secondary actions (bg-secondary-200, auto dark mode)
btn-danger              // Destructive actions (bg-danger-100, auto dark mode)
btn-success             // Positive actions (bg-success-500, auto dark mode)
btn-skip                // Skip/neutral (bg-secondary-200, auto dark mode)
```

**Form Elements:**
```tsx
form-input              // Text inputs, textareas (auto theme, focus states)
form-label              // Input labels (text-text-secondary)
```

**Layout:**
```tsx
page-bg                 // Page background with min-height
recipe-card             // Card container with elevation and borders
```

**Mobile:**
```tsx
touch-target            // 44x44px minimum touch target
touch-target-large      // 48x48px for important actions
mobile-safe-bottom      // Safe area bottom padding
responsive-padding      // Auto-adjusting padding (p-4 sm:p-6 md:p-4)
responsive-gap          // Auto-adjusting gap (gap-3 sm:gap-4 md:gap-3)
```

---

## 📱 Responsive Design Rules

### Rule #5: Always Use Mobile-First Approach

Breakpoints scale from smallest to largest:

```tsx
// ✅ CORRECT: Mobile → Tablet → Desktop
<div className="text-2xl sm:text-3xl md:text-4xl">
<div className="p-4 sm:p-6 md:p-8">
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

// ❌ WRONG: Desktop → Tablet → Mobile
<div className="text-4xl md:text-3xl sm:text-2xl">
<div className="p-8 md:p-6 sm:p-4">
```

**Standard Breakpoints:**
- No prefix: Mobile (0-639px)
- `sm:` Tablet (640px+)
- `md:` Landscape tablet/laptop (768px+)
- `lg:` Desktop (1024px+)
- `xl:` Large desktop (1280px+)

---

## 👆 Touch Target Rules

### Rule #6: Minimum 44x44px for All Interactive Elements

```tsx
// ✅ CORRECT: Sufficient touch target
<button className="px-4 py-2 touch-target">Click Me</button>
<button className="px-6 py-3 touch-target-large">Important</button>

// ❌ WRONG: Too small
<button className="p-1 text-xs">X</button>
<button className="px-2 py-1">Submit</button>
```

**Why?** 
- Apple HIG: 44x44px minimum
- Material Design: 48x48px recommended for primary actions
- Accessibility: Essential for users with motor impairments

---

## 🌓 Dark Mode Rules

### Rule #7: Support Dark Mode Automatically

**Prefer semantic aliases (auto-adapts):**
```tsx
// ✅ CORRECT: Automatically adapts to dark mode
<div className="bg-surface-elevated text-text-primary border-border">
```

**When using specific colors, add dark mode support:**
```css
/* In index.css */
.custom-button {
  @apply bg-primary-500 text-white;
  
  .dark & {
    @apply bg-primary-400 text-primary-950;
  }
}
```

---

## ♿ Accessibility Rules

### Rule #8: Visible Focus States Required

```tsx
// ✅ CORRECT: Clear focus indicator
<button className="focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50">

// ❌ WRONG: Removes focus indicator
<button className="focus:outline-none">  // Never do this!
```

### Rule #9: Semantic HTML Required

```tsx
// ✅ CORRECT: Semantic elements
<button onClick={handleClick}>Submit</button>
<nav className="...">Navigation</nav>
<main className="...">Main content</main>
<article className="recipe-card">Recipe</article>

// ❌ WRONG: Generic divs for interactive elements
<div onClick={handleClick}>Submit</div>
<div>Navigation</div>
<div>Main content</div>
```

### Rule #10: Color Contrast Must Meet WCAG AA

**Minimum ratios:**
- Normal text: 4.5:1
- Large text (18pt+): 3.0:1

**Pre-verified combinations:**
- `text-text-primary` on `bg-surface-elevated` ✅
- `text-text-secondary` on `bg-surface` ✅
- All button text on button backgrounds ✅

---

## 🔧 Extending the Design System

### Rule #11: Process for Adding New Utility Classes

When existing utilities don't cover your needs:

1. **Check if you can combine existing utilities first**
   ```tsx
   // Can you use: btn-primary + rounded-full + shadow-lg?
   ```

2. **If truly needed, add to `src/index.css`:**
   ```css
   @layer components {
     .btn-outline {
       @apply bg-transparent border-2 border-primary-500 text-primary-600
              hover:bg-primary-50 px-4 py-2 rounded-lg transition touch-target;
       
       .dark & {
         @apply text-primary-400 border-primary-400 hover:bg-primary-950;
       }
     }
   }
   ```

3. **Document in `docs/DesignSystem.md`:**
   ```markdown
   ### Button Outline
   `btn-outline` - Transparent button with border
   - Light mode: border-primary-500, text-primary-600
   - Dark mode: border-primary-400, text-primary-400
   - Usage: `<button className="btn-outline">Cancel</button>`
   ```

4. **Update `.github/copilot-instructions.md` if it's a new pattern**

---

## ✅ Design System Checklist

Before committing component code:

```
□ No hardcoded colors (hex, rgb, or arbitrary values)
□ Using semantic aliases for layouts (surface, text-*, border)
□ Using specific colors for branded elements (primary-500, success-600)
□ Using component utility classes (btn-primary, form-input, etc.)
□ Mobile-first responsive (sm: → md: → lg:)
□ Touch targets minimum 44x44px
□ Dark mode support (semantic aliases or .dark styles)
□ Visible focus states on interactive elements
□ Semantic HTML (button, nav, main, not div)
□ Color contrast meets WCAG AA (4.5:1)
□ Tested in both light and dark mode
□ If new utility added, documented in docs/DesignSystem.md
```

---

## 🚨 Most Common Mistakes

### Mistake #1: Hardcoded Colors
```tsx
// ❌ This will be flagged in code review
<div className="bg-[#ce9c5c] text-[#51473a]">
<div style={{ backgroundColor: '#f8f0e5' }}>

// ✅ Use design tokens
<div className="bg-primary-500 text-secondary-900">
<div className="bg-surface-elevated text-text-primary">
```

### Mistake #2: Breaking Dark Mode
```tsx
// ❌ Only works in light mode
<div className="bg-white text-black border-gray-300">
<div className="bg-primary-100 text-secondary-900">

// ✅ Theme-aware
<div className="bg-surface-elevated text-text-primary border-border">
```

### Mistake #3: Desktop-First Responsive
```tsx
// ❌ Wrong order (desktop first)
<div className="text-4xl md:text-3xl sm:text-2xl">

// ✅ Correct order (mobile first)
<div className="text-2xl sm:text-3xl md:text-4xl">
```

### Mistake #4: Tiny Touch Targets
```tsx
// ❌ Too small for mobile
<button className="p-1 text-xs">Delete</button>
<button className="px-2 py-1">×</button>

// ✅ Sufficient size
<button className="btn-danger touch-target">Delete</button>
<button className="p-3 touch-target">×</button>
```

### Mistake #5: Creating Custom Buttons
```tsx
// ❌ Don't reinvent buttons
<button className="bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded text-white">
  Submit
</button>

// ✅ Use design system
<button className="btn-primary">Submit</button>
```

---

## 🎯 Real-World Examples

### Example 1: Recipe Card Component

```tsx
// ✅ CORRECT Implementation
export function RecipeCard({ recipe }: Props) {
  return (
    <article className="recipe-card">  {/* Uses utility: bg-surface-elevated + borders */}
      <h3 className="text-text-primary text-xl font-semibold">
        {recipe.name}
      </h3>
      <p className="text-text-secondary mt-2">
        {recipe.description}
      </p>
      <div className="flex gap-3 mt-4">
        <button className="btn-primary">Edit</button>
        <button className="btn-danger">Delete</button>
      </div>
    </article>
  );
}
```

### Example 2: Form with Responsive Layout

```tsx
// ✅ CORRECT: Mobile-first, semantic colors, touch targets
export function RecipeForm() {
  return (
    <form className="bg-surface-elevated p-4 sm:p-6 rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Recipe Name</label>
          <input 
            type="text" 
            className="form-input"  {/* Auto theme-aware */}
            placeholder="My Sourdough Recipe"
          />
        </div>
        <div>
          <label className="form-label">Total Weight (g)</label>
          <input 
            type="number" 
            className="form-input"
            placeholder="1000"
          />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button className="btn-primary touch-target">Save Recipe</button>
        <button className="btn-secondary touch-target">Cancel</button>
      </div>
    </form>
  );
}
```

### Example 3: Status Badge

```tsx
// ✅ CORRECT: Specific colors for semantic meaning
export function BakeStatusBadge({ status }: Props) {
  const statusColors = {
    active: 'bg-success-100 text-success-700 border-success-200',
    paused: 'bg-warning-100 text-warning-700 border-warning-200',
    completed: 'bg-secondary-100 text-secondary-700 border-secondary-200',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[status]}`}>
      {status}
    </span>
  );
}
```

---

## 📚 Documentation Reference

- **Full Design System**: `docs/DesignSystem.md`
- **Copilot Instructions**: `.github/copilot-instructions.md`
- **Color Palette**: `src/index.css` (CSS variables)
- **Tailwind Config**: `tailwind.config.js`
- **Component Utilities**: `src/index.css` (@layer components)

---

## 💡 Ask Copilot for Help

Leverage GitHub Copilot with these prompts:

```
"Review this component against the design system guidelines"

"Convert these hardcoded colors to design tokens"

"Add dark mode support to this component"

"Make this component mobile-first responsive"

"Ensure this component meets accessibility standards"

"Add proper touch targets to these buttons"
```

---

**Remember:** The design system exists to:
- ✅ Ensure visual consistency
- ✅ Maintain accessibility standards  
- ✅ Support light and dark modes automatically
- ✅ Optimize for mobile and desktop
- ✅ Make development faster (reuse utilities)
- ✅ Reduce maintenance burden

**When in doubt:** Check `docs/DesignSystem.md` or ask Copilot to review against the guidelines!

---

**Last Updated:** October 4, 2025  
**Version:** 1.0.0
