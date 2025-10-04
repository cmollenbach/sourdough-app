# Design System Documentation

## Overview

The Sourdough App uses a **custom design system** built on Tailwind CSS with a warm, organic color palette inspired by sourdough bread and grain. The system supports both light and dark modes and is optimized for web and mobile platforms.

---

## 🎨 Color Palette

### Philosophy

Our color system reflects the natural warmth of sourdough baking:

- **Primary Colors**: Warm bread crust tones (golden browns)
- **Secondary Colors**: Earthy grain tones (neutral grays with warmth)
- **Accent Colors**: Active fermentation (brighter golden/amber)
- **Semantic Colors**: Standard success/warning/danger states

### Color Scale (50-950)

All color families use a 10+ step scale providing flexibility for subtle variations:

```
50  → Lightest (backgrounds, highlights)
100 → Very light
200 → Light
300 → Light-medium
400 → Medium-light
500 → Base/Default
600 → Medium-dark
700 → Dark
800 → Very dark
900 → Darkest (text, accents)
950 → Ultra dark (only primary)
```

---

## 🌓 Light & Dark Mode

### Implementation Strategy

- **CSS Variables**: All colors defined as RGB space-separated values in `:root`
- **Dark Mode Toggle**: Uses `.dark` class on root element
- **Alias System**: Semantic aliases (`--color-surface`, `--color-text-primary`) change based on theme
- **Tailwind Integration**: All variables consumed via Tailwind config

### Color Aliases

These semantic aliases automatically adapt to light/dark mode:

| Alias | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `surface` | `primary-100` | `secondary-900` | Page backgrounds |
| `surface-elevated` | `primary-50` | `primary-950` | Cards, modals |
| `surface-subtle` | `primary-200` | `secondary-800` | Subtle backgrounds |
| `text-primary` | `secondary-900` | `secondary-100` | Main text |
| `text-secondary` | `secondary-700` | `secondary-300` | Supporting text |
| `text-tertiary` | `secondary-500` | `secondary-500` | Placeholder text |
| `text-inverse` | `primary-50` | `secondary-900` | Text on colored backgrounds |
| `border` | `secondary-300` | `secondary-700` | Default borders |
| `border-subtle` | `secondary-200` | `secondary-800` | Subtle dividers |
| `border-strong` | `secondary-400` | `secondary-600` | Emphasized borders |

### Usage in Components

```tsx
// ✅ CORRECT: Use semantic aliases for theme-aware colors
<div className="bg-surface-elevated text-text-primary border border-border">
  <p className="text-text-secondary">Supporting text</p>
</div>

// ❌ WRONG: Don't use specific color scales (breaks dark mode)
<div className="bg-primary-100 text-secondary-900 border-secondary-300">
  <p className="text-secondary-700">Supporting text</p>
</div>
```

---

## 🎯 Component Utility Classes

### Button Variants

All button variants automatically adapt to dark mode:

#### Primary Button
```tsx
<button className="btn-primary">Create Recipe</button>
```
**Styles:**
- Light: `bg-primary-500`, white text
- Dark: `bg-primary-400`, dark text (better contrast)
- Includes: Touch target sizing, transitions, shadows

#### Secondary Button
```tsx
<button className="btn-secondary">Cancel</button>
```
**Styles:**
- Light: `bg-secondary-200`, dark text
- Dark: `bg-secondary-700`, light text

#### Danger Button
```tsx
<button className="btn-danger">Delete</button>
```
**Styles:**
- Light: `bg-danger-100`, danger-700 text
- Dark: `bg-danger-700`, light text

#### Success Button
```tsx
<button className="btn-success">Complete Step</button>
```
**Styles:**
- Light: `bg-success-500`, white text
- Dark: `bg-success-600`, light text

#### Skip Button
```tsx
<button className="btn-skip">Skip</button>
```
**Styles:**
- Light: `bg-secondary-200`
- Dark: `bg-secondary-700`

### Form Elements

#### Input Fields
```tsx
<input type="text" className="form-input" placeholder="Recipe name" />
```
**Features:**
- Theme-aware backgrounds and borders
- Focus states with primary color ring
- Placeholder styling
- Auto-adjusting for dark mode

#### Labels
```tsx
<label className="form-label">Recipe Name</label>
```
**Styles:**
- `text-text-secondary` (theme-aware)
- Medium font weight

### Layout Utilities

#### Page Background
```tsx
<div className="page-bg">
  {/* Page content */}
</div>
```
**Applies:** `bg-surface-subtle` with `min-h-screen`

#### Recipe Card
```tsx
<div className="recipe-card">
  {/* Recipe content */}
</div>
```
**Features:**
- Elevated surface background
- Border with theme-aware color
- Rounded corners (2xl)
- Shadow (lg)

### Mobile-Specific Utilities

#### Touch Targets
```tsx
// Standard (44x44px minimum)
<button className="touch-target">Tap</button>

// Large (48x48px minimum)
<button className="touch-target-large">Important Action</button>
```

#### Safe Area Spacing
```tsx
<div className="mobile-safe-bottom">
  {/* Content with safe bottom padding */}
</div>
```

#### Responsive Padding
```tsx
<div className="responsive-padding">
  {/* Adapts: p-4 (mobile) → p-6 (tablet) → p-4 (desktop) */}
</div>
```

#### Responsive Gap
```tsx
<div className="responsive-gap flex">
  {/* Adapts: gap-3 (mobile) → gap-4 (tablet) → gap-3 (desktop) */}
</div>
```

---

## 📐 Spacing System

### Tailwind Default Scale (Extended)

Standard Tailwind spacing plus custom additions:

```
spacing: {
  // Standard: 0, 0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64
  
  // Custom additions:
  18: '4.5rem',   // 72px - Card spacing
  88: '22rem',    // 352px - Large containers
}
```

### Mobile-First Responsive Spacing

Always design for mobile first, then scale up:

```tsx
// ✅ CORRECT: Mobile first, then larger screens
<div className="p-4 sm:p-6 md:p-8">

// ❌ WRONG: Desktop first
<div className="p-8 md:p-6 sm:p-4">
```

---

## 🌈 Using Colors in Components

### Tailwind Utility Classes

```tsx
// Background colors
<div className="bg-primary-500">        {/* Specific scale */}
<div className="bg-surface-elevated">   {/* Semantic alias */}

// Text colors
<p className="text-primary-600">        {/* Specific scale */}
<p className="text-text-primary">       {/* Semantic alias */}

// Border colors
<div className="border-secondary-300">  {/* Specific scale */}
<div className="border-border">         {/* Semantic alias */}

// With opacity
<div className="bg-primary-500/50">     {/* 50% opacity */}
<div className="text-danger-600/75">    {/* 75% opacity */}
```

### Direct CSS Variable Access

When you need custom styling:

```css
.custom-component {
  background-color: rgb(var(--color-primary-500));
  color: rgb(var(--color-text-primary));
  border: 1px solid rgb(var(--color-border));
}

/* With opacity */
.semi-transparent {
  background-color: rgb(var(--color-primary-500) / 0.5);
}
```

### When to Use Specific vs Semantic Colors

**Use Semantic Aliases (`surface`, `text-*`, `border`) When:**
- Building layouts and containers
- Styling text and borders
- Creating components that should adapt to theme
- General UI chrome

**Use Specific Color Scales (`primary-500`, `accent-600`) When:**
- Creating branded elements (buttons, links)
- Semantic states (success, warning, danger)
- Accent highlights
- Intentional color regardless of theme

```tsx
// ✅ GOOD: Mix semantic and specific appropriately
<div className="bg-surface-elevated border border-border">
  <h2 className="text-text-primary">Recipe Name</h2>
  <button className="bg-primary-500 text-white">View</button>
  <span className="text-success-600">Active</span>
</div>

// ❌ BAD: All specific colors (doesn't adapt to dark mode)
<div className="bg-primary-50 border-secondary-300">
  <h2 className="text-secondary-900">Recipe Name</h2>
  <button className="bg-primary-500 text-white">View</button>
</div>
```

---

## 🎭 Shadows & Depth

Custom shadow scales for organic feel:

```tsx
// Soft shadow (subtle depth)
<div className="shadow-soft">

// Card shadow (standard cards)
<div className="shadow-card">

// Elevated shadow (modals, important elements)
<div className="shadow-elevated">

// Combine with hover states
<div className="shadow-card hover:shadow-elevated transition-shadow">
```

**Shadow Values:**
```javascript
boxShadow: {
  'soft': '0 2px 8px rgba(139, 115, 85, 0.08)',
  'card': '0 4px 16px rgba(139, 115, 85, 0.12)',
  'elevated': '0 8px 32px rgba(139, 115, 85, 0.16)',
}
```

---

## 📱 Mobile Considerations

### Touch Target Sizing

**Minimum Sizes:**
- Standard interactive elements: 44x44px (Apple HIG)
- Important actions: 48x48px (Material Design)

```tsx
// All buttons should use touch-target
<button className="px-4 py-2 touch-target">Click Me</button>

// Critical actions use touch-target-large
<button className="px-6 py-3 touch-target-large">Start Bake</button>
```

### Responsive Breakpoints

Standard Tailwind breakpoints:

```javascript
sm: '640px',   // Small tablets
md: '768px',   // Tablets
lg: '1024px',  // Small laptops
xl: '1280px',  // Desktops
2xl: '1536px', // Large desktops
```

**Usage Pattern:**
```tsx
// Mobile-first approach
<div className="
  flex flex-col     // Mobile: stack vertically
  sm:flex-row       // Tablet+: side by side
  gap-4             // Mobile: 16px gap
  sm:gap-6          // Tablet+: 24px gap
">
```

### Mobile-Specific Patterns

```tsx
// Hide on mobile, show on tablet+
<div className="hidden sm:block">

// Show on mobile, hide on tablet+
<div className="sm:hidden">

// Responsive text sizing
<h1 className="text-2xl sm:text-3xl md:text-4xl">

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
```

---

## ♿ Accessibility

### Color Contrast Requirements

All text colors meet **WCAG 2.1 Level AA** standards:

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text (18pt+)**: Minimum 3:1 contrast ratio

### Testing Contrast

Use browser dev tools or online checkers to verify:
- `text-text-primary` on `bg-surface-elevated`
- `text-text-secondary` on `bg-surface`
- All button text on button backgrounds

### Focus Indicators

All interactive elements MUST have visible focus states:

```tsx
// ✅ CORRECT: Visible focus ring
<button className="focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50">

// ❌ WRONG: Disabled focus styles
<button className="focus:outline-none">  {/* Don't do this! */}
```

### Semantic HTML

Always use semantic elements over generic divs:

```tsx
// ✅ CORRECT
<button className="btn-primary">Submit</button>
<nav className="...">
<main className="...">
<article className="recipe-card">

// ❌ WRONG
<div onClick={handleClick} className="btn-primary">Submit</div>
<div className="...">  {/* Navigation */}
<div className="...">  {/* Main content */}
```

---

## 🎨 Design Tokens Reference

### Primary Colors (Warm Bread Crust)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `primary-50` | `#fcf9f5` | `252 249 245` | Lightest highlights |
| `primary-100` | `#f8f0e5` | `248 240 229` | Light backgrounds |
| `primary-200` | `#f1e1cb` | `241 225 203` | Subtle backgrounds |
| `primary-300` | `#e6caa6` | `230 202 166` | Light accents |
| `primary-400` | `#dab381` | `218 179 129` | Medium accents |
| `primary-500` | `#ce9c5c` | `206 156 92` | **Base brand color** |
| `primary-600` | `#b98c53` | `185 140 83` | Hover states |
| `primary-700` | `#9a7445` | `154 116 69` | Active states |
| `primary-800` | `#7f6039` | `127 96 57` | Dark accents |
| `primary-900` | `#684f2f` | `104 79 47` | Darkest accents |
| `primary-950` | `#40311d` | `64 49 29` | Ultra dark (dark mode surfaces) |

### Secondary Colors (Earthy Grains)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `secondary-50` | `#f9f8f6` | `249 248 246` | Lightest neutrals |
| `secondary-100` | `#f2efea` | `242 239 234` | Light text on dark |
| `secondary-200` | `#e4ddd2` | `228 221 210` | Subtle borders/dividers |
| `secondary-300` | `#cdc2b1` | `205 194 177` | Default borders |
| `secondary-400` | `#b6a791` | `182 167 145` | Strong borders |
| `secondary-500` | `#9f8c71` | `159 140 113` | Placeholder text |
| `secondary-600` | `#8f7d65` | `143 125 101` | Supporting elements |
| `secondary-700` | `#776854` | `119 104 84` | Secondary text |
| `secondary-800` | `#625646` | `98 86 70` | Dark surfaces (dark mode) |
| `secondary-900` | `#51473a` | `81 71 58` | Primary text / Dark surfaces |

### Accent Colors (Active Fermentation)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `accent-500` | `#eda345` | `237 163 69` | **Base accent** |
| `accent-600` | `#d5923e` | `213 146 62` | Accent hover |
| `accent-700` | `#b27a34` | `178 122 52` | Accent active |

### Semantic Colors

| Color | Base Token | Hex | Usage |
|-------|------------|-----|-------|
| Success | `success-500` | `#22c55e` | Completed, positive states |
| Warning | `warning-500` | `#f59e0b` | Caution, alerts |
| Danger | `danger-500` | `#ef4444` | Errors, destructive actions |

---

## 🔧 Extending the Design System

### Adding New Component Utilities

When creating reusable component styles:

1. **Define in `index.css`** under the `@layer components` section
2. **Use `@apply`** with existing Tailwind utilities
3. **Support dark mode** with `.dark &` selector
4. **Include touch targets** for interactive elements

```css
/* ✅ CORRECT: New component utility */
.btn-outline {
  @apply bg-transparent border-2 border-primary-500 text-primary-600
         hover:bg-primary-50 
         px-4 py-2 rounded-lg transition touch-target;
  
  .dark & {
    @apply text-primary-400 border-primary-400 hover:bg-primary-950;
  }
}
```

### Adding New Colors

1. **Add CSS variable** in `:root` (use RGB space-separated format)
2. **Add dark mode override** in `.dark` if needed
3. **Add to Tailwind config** in `theme.extend.colors`
4. **Document in this file** with usage guidelines

```css
/* 1. Add to :root in index.css */
:root {
  --color-info-500: 59 130 246;  /* #3b82f6 */
}

/* 2. If different in dark mode */
.dark {
  --color-info-500: 96 165 250;  /* Lighter for dark bg */
}
```

```javascript
// 3. Add to tailwind.config.js
theme: {
  extend: {
    colors: {
      info: {
        500: 'rgb(var(--color-info-500) / <alpha-value>)',
      }
    }
  }
}
```

---

## ✅ Design System Checklist

When creating a new component, verify:

- [ ] Uses semantic color aliases (`surface`, `text-*`, `border`) for layout
- [ ] Uses specific colors (`primary-500`, `success-600`) for branded elements
- [ ] Supports dark mode (either via aliases or explicit `.dark` styles)
- [ ] Interactive elements have minimum 44x44px touch targets
- [ ] Focus states are visible and styled
- [ ] Text contrast meets WCAG AA standards (4.5:1 minimum)
- [ ] Responsive design uses mobile-first approach
- [ ] Uses existing utility classes before creating custom styles
- [ ] Custom styles added to `index.css` with `@apply`
- [ ] Animations respect `prefers-reduced-motion`

---

## 🚫 Common Mistakes to Avoid

### ❌ Hardcoded Colors

```tsx
// WRONG: Hardcoded hex colors
<div className="bg-[#f8f0e5] text-[#51473a]">

// CORRECT: Use design tokens
<div className="bg-primary-100 text-secondary-900">
```

### ❌ Inline Styles for Colors

```tsx
// WRONG: Inline styles bypass theme system
<div style={{ backgroundColor: '#ce9c5c' }}>

// CORRECT: Use Tailwind classes
<div className="bg-primary-500">
```

### ❌ Desktop-First Responsive

```tsx
// WRONG: Desktop first
<div className="text-4xl md:text-3xl sm:text-2xl">

// CORRECT: Mobile first
<div className="text-2xl sm:text-3xl md:text-4xl">
```

### ❌ Missing Dark Mode Support

```tsx
// WRONG: Only works in light mode
<div className="bg-white text-black">

// CORRECT: Theme-aware
<div className="bg-surface-elevated text-text-primary">
```

### ❌ Too Small Touch Targets

```tsx
// WRONG: Too small for mobile
<button className="p-1">X</button>

// CORRECT: Minimum 44x44px
<button className="p-2 touch-target">X</button>
```

---

## 📚 Resources

### Documentation Files
- `tailwind.config.js` - Tailwind configuration with custom tokens
- `src/index.css` - CSS variables and component utilities
- `docs/UI/ColorSystem.md` - Original color system notes

### External References
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Apple Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Material Design - Touch Targets](https://m3.material.io/foundations/accessible-design/patterns#touch-targets)

---

**Last Updated:** October 4, 2025  
**Version:** 1.0.0
