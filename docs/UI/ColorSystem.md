# Sourdough App Color System

This document outlines the color system for the Sourdough App, providing a unified palette for both light and dark modes. It includes Tailwind CSS configuration, CSS variables, and usage examples.

## Tailwind CSS Configuration (`tailwind.config.js`)

The `theme.extend.colors` object in `tailwind.config.js` should be populated with the CSS variables defined below. This allows you to use familiar Tailwind utility classes like `bg-primary`, `text-secondary`, etc.

```javascript
// tailwind.config.js
module.exports = {
  // ...
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--color-primary) / <alpha-value>)',
        secondary: 'hsl(var(--color-secondary) / <alpha-value>)',
        accent: 'hsl(var(--color-accent) / <alpha-value>)',
        neutral: 'hsl(var(--color-neutral) / <alpha-value>)',
        
        'base-100': 'hsl(var(--color-base-100) / <alpha-value>)',
        'base-200': 'hsl(var(--color-base-200) / <alpha-value>)',
        'base-300': 'hsl(var(--color-base-300) / <alpha-value>)',
        'base-content': 'hsl(var(--color-base-content) / <alpha-value>)',
        
        info: 'hsl(var(--color-info) / <alpha-value>)',
        success: 'hsl(var(--color-success) / <alpha-value>)',
        warning: 'hsl(var(--color-warning) / <alpha-value>)',
        error: 'hsl(var(--color-error) / <alpha-value>)',
      },
    },
  },
  // ...
};