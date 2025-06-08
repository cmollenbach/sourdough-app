// ============================================
// SOURDOUGH APP - COMPLETE COLOR SYSTEM
// ============================================

// 1. TAILWIND CONFIG (tailwind.config.js)
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors - Warm bread tones
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950) / <alpha-value>)',
        },
        
        // Secondary Colors - Earthy grain tones
        secondary: {
          50: 'rgb(var(--color-secondary-50) / <alpha-value>)',
          100: 'rgb(var(--color-secondary-100) / <alpha-value>)',
          200: 'rgb(var(--color-secondary-200) / <alpha-value>)',
          300: 'rgb(var(--color-secondary-300) / <alpha-value>)',
          400: 'rgb(var(--color-secondary-400) / <alpha-value>)',
          500: 'rgb(var(--color-secondary-500) / <alpha-value>)',
          600: 'rgb(var(--color-secondary-600) / <alpha-value>)',
          700: 'rgb(var(--color-secondary-700) / <alpha-value>)',
          800: 'rgb(var(--color-secondary-800) / <alpha-value>)',
          900: 'rgb(var(--color-secondary-900) / <alpha-value>)',
        },

        // Accent Colors - Fermentation activity
        accent: {
          50: 'rgb(var(--color-accent-50) / <alpha-value>)',
          100: 'rgb(var(--color-accent-100) / <alpha-value>)',
          200: 'rgb(var(--color-accent-200) / <alpha-value>)',
          300: 'rgb(var(--color-accent-300) / <alpha-value>)',
          400: 'rgb(var(--color-accent-400) / <alpha-value>)',
          500: 'rgb(var(--color-accent-500) / <alpha-value>)',
          600: 'rgb(var(--color-accent-600) / <alpha-value>)',
          700: 'rgb(var(--color-accent-700) / <alpha-value>)',
          800: 'rgb(var(--color-accent-800) / <alpha-value>)',
          900: 'rgb(var(--color-accent-900) / <alpha-value>)',
        },

        // Semantic Colors
        success: {
          50: 'rgb(var(--color-success-50) / <alpha-value>)',
          100: 'rgb(var(--color-success-100) / <alpha-value>)',
          500: 'rgb(var(--color-success-500) / <alpha-value>)',
          600: 'rgb(var(--color-success-600) / <alpha-value>)',
          700: 'rgb(var(--color-success-700) / <alpha-value>)',
        },
        warning: {
          50: 'rgb(var(--color-warning-50) / <alpha-value>)',
          100: 'rgb(var(--color-warning-100) / <alpha-value>)',
          500: 'rgb(var(--color-warning-500) / <alpha-value>)',
          600: 'rgb(var(--color-warning-600) / <alpha-value>)',
          700: 'rgb(var(--color-warning-700) / <alpha-value>)',
        },
        danger: {
          50: 'rgb(var(--color-danger-50) / <alpha-value>)',
          100: 'rgb(var(--color-danger-100) / <alpha-value>)',
          500: 'rgb(var(--color-danger-500) / <alpha-value>)',
          600: 'rgb(var(--color-danger-600) / <alpha-value>)',
          700: 'rgb(var(--color-danger-700) / <alpha-value>)',
        },

        // Surface Colors
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
          subtle: 'rgb(var(--color-surface-subtle) / <alpha-value>)',
        },

        // Text Colors
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
          inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
        },

        // Border Colors
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          subtle: 'rgb(var(--color-border-subtle) / <alpha-value>)',
          strong: 'rgb(var(--color-border-strong) / <alpha-value>)',
        },
      },
      
      // Background patterns for organic feel
      backgroundImage: {
        'grain-texture': 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
      },
      
      // Extended spacing for recipe cards
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      
      // Custom shadows for depth
      boxShadow: {
        'soft': '0 2px 8px rgba(139, 115, 85, 0.08)',
        'card': '0 4px 16px rgba(139, 115, 85, 0.12)',
        'elevated': '0 8px 32px rgba(139, 115, 85, 0.16)',
      },
    },
  },
  plugins: [],
}

// ============================================
// 2. CSS VARIABLES (src/index.css or globals.css)
// ============================================

/* Add this to your main CSS file */
:root {
  /* Primary Colors - Warm Sourdough Crust */
  --color-primary-50: 252 249 245;    /* #fcf9f5 - Lightest flour */
  --color-primary-100: 248 240 229;   /* #f8f0e5 - Fresh flour */
  --color-primary-200: 241 225 203;   /* #f1e1cb - Pale dough */
  --color-primary-300: 230 202 166;   /* #e6caa6 - Rising dough */
  --color-primary-400: 218 179 129;   /* #dab381 - Golden crust forming */
  --color-primary-500: 206 156 92;    /* #ce9c5c - Perfect crust */
  --color-primary-600: 185 140 83;    /* #b98c53 - Deep golden */
  --color-primary-700: 154 116 69;    /* #9a7445 - Rich crust */
  --color-primary-800: 127 96 57;     /* #7f6039 - Dark crust */
  --color-primary-900: 104 79 47;     /* #684f2f - Deep brown */
  --color-primary-950: 64 49 29;      /* #40311d - Burnt edges */

  /* Secondary Colors - Earthy Grains */
  --color-secondary-50: 249 248 246;  /* #f9f8f6 - Pure white flour */
  --color-secondary-100: 242 239 234; /* #f2efea - Unbleached flour */
  --color-secondary-200: 228 221 210; /* #e4ddd2 - Whole grain */
  --color-secondary-300: 205 194 177; /* #cdc2b1 - Mixed grains */
  --color-secondary-400: 182 167 145; /* #b6a791 - Rye blend */
  --color-secondary-500: 159 140 113; /* #9f8c71 - Earthy grain */
  --color-secondary-600: 143 125 101; /* #8f7d65 - Dark rye */
  --color-secondary-700: 119 104 84;  /* #776854 - Whole wheat */
  --color-secondary-800: 98 86 70;    /* #625646 - Dark grain */
  --color-secondary-900: 81 71 58;    /* #51473a - Rich soil */

  /* Accent Colors - Active Fermentation */
  --color-accent-50: 254 252 248;     /* #fefcf8 - Starter activity */
  --color-accent-100: 253 247 237;    /* #fdf7ed - Gentle bubbling */
  --color-accent-200: 251 235 213;    /* #fbebd5 - Active starter */
  --color-accent-300: 247 211 165;    /* #f7d3a5 - Peak activity */
  --color-accent-400: 242 187 117;    /* #f2bb75 - Vigorous fermentation */
  --color-accent-500: 237 163 69;     /* #eda345 - Perfect timing */
  --color-accent-600: 213 146 62;     /* #d5923e - Ready to bake */
  --color-accent-700: 178 122 52;     /* #b27a34 - Mature starter */
  --color-accent-800: 147 101 43;     /* #93652b - Established culture */
  --color-accent-900: 120 83 35;      /* #785323 - Ancient grains */

  /* Semantic Colors */
  --color-success-50: 247 254 249;    /* #f7fef9 - Perfect proof */
  --color-success-100: 230 252 235;   /* #e6fceb - Timer complete */
  --color-success-500: 34 197 94;     /* #22c55e - Success state */
  --color-success-600: 22 163 74;     /* #16a34a - Confirm action */
  --color-success-700: 21 128 61;     /* #15803d - Deep success */

  --color-warning-50: 255 251 235;    /* #fffbeb - Attention needed */
  --color-warning-100: 254 243 199;   /* #fef3c7 - Timer warning */
  --color-warning-500: 245 158 11;    /* #f59e0b - Warning state */
  --color-warning-600: 217 119 6;     /* #d97706 - Active warning */
  --color-warning-700: 180 83 9;      /* #b45309 - Strong warning */

  --color-danger-50: 254 242 242;     /* #fef2f2 - Error state */
  --color-danger-100: 254 226 226;    /* #fee2e2 - Deletion warning */
  --color-danger-500: 239 68 68;      /* #ef4444 - Error/delete */
  --color-danger-600: 220 38 38;      /* #dc2626 - Confirm delete */
  --color-danger-700: 185 28 28;      /* #b91c1c - Strong error */

  /* Surface Colors - Light Mode */
  --color-surface: 255 255 255;           /* #ffffff - Card backgrounds */
  --color-surface-elevated: 255 255 255;  /* #ffffff - Elevated cards */
  --color-surface-subtle: 249 250 251;    /* #f9fafb - Page background */

  /* Text Colors - Light Mode */
  --color-text-primary: 17 24 39;         /* #111827 - Main text */
  --color-text-secondary: 75 85 99;       /* #4b5563 - Secondary text */
  --color-text-tertiary: 156 163 175;     /* #9ca3af - Subtle text */
  --color-text-inverse: 255 255 255;      /* #ffffff - Text on dark */

  /* Border Colors - Light Mode */
  --color-border: 229 231 235;            /* #e5e7eb - Default borders */
  --color-border-subtle: 243 244 246;     /* #f3f4f6 - Subtle borders */
  --color-border-strong: 156 163 175;     /* #9ca3af - Strong borders */
}

/* Dark Mode Variables */
.dark {
  /* Surface Colors - Dark Mode */
  --color-surface: 28 25 23;              /* #1c1917 - Card backgrounds */
  --color-surface-elevated: 41 37 36;     /* #292524 - Elevated cards */
  --color-surface-subtle: 12 10 9;        /* #0c0a09 - Page background */

  /* Text Colors - Dark Mode */
  --color-text-primary: 250 250 249;      /* #fafaf9 - Main text */
  --color-text-secondary: 214 211 209;    /* #d6d3d1 - Secondary text */
  --color-text-tertiary: 168 162 158;     /* #a8a29e - Subtle text */
  --color-text-inverse: 28 25 23;         /* #1c1917 - Text on light */

  /* Border Colors - Dark Mode */
  --color-border: 68 64 60;               /* #44403c - Default borders */
  --color-border-subtle: 41 37 36;        /* #292524 - Subtle borders */
  --color-border-strong: 120 113 108;     /* #78716c - Strong borders */

  /* Adjust primary colors for dark mode warmth */
  --color-primary-50: 41 37 36;           /* Darker base for dark mode */
  --color-primary-100: 57 50 47;          /* Warm dark tones */
  --color-primary-200: 68 64 60;
  --color-primary-900: 252 249 245;       /* Lighter accent for dark mode */
}

/* ============================================
 * 3. COMPONENT UPDATES - Replace your existing classes
 * ============================================ */

/* Update your existing components with these classes: */

/* Cards (like StepCard) */
.recipe-card {
  @apply bg-surface-elevated border border-border rounded-2xl shadow-card;
}

/* Primary buttons (like Add Step) */
.btn-primary {
  @apply bg-primary-100 text-primary-700 hover:bg-primary-200 border border-primary-200;
}

/* Secondary buttons (like Duplicate) */
.btn-secondary {
  @apply bg-secondary-100 text-secondary-700 hover:bg-secondary-200 border border-secondary-200;
}

/* Danger buttons (like Delete) */
.btn-danger {
  @apply bg-danger-100 text-danger-700 hover:bg-danger-200 border border-danger-200;
}

/* Form inputs */
.form-input {
  @apply bg-surface border border-border text-text-primary placeholder:text-text-tertiary 
         focus:border-primary-300 focus:ring-2 focus:ring-primary-100;
}

/* Labels */
.form-label {
  @apply text-text-secondary font-medium;
}

/* Page background */
.page-bg {
  @apply bg-surface-subtle min-h-screen;
}

/* ============================================
 * 4. DARK MODE TOGGLE COMPONENT
 * ============================================ */

/* Create this component: src/components/DarkModeToggle.tsx */
import { useState, useEffect } from 'react';

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference or localStorage
    const stored = localStorage.getItem('darkMode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored ? JSON.parse(stored) : systemPrefersDark;
    
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg bg-secondary-100 text-secondary-700 hover:bg-secondary-200 
                 dark:bg-secondary-800 dark:text-secondary-200 dark:hover:bg-secondary-700
                 transition-colors duration-200"
      aria-label="Toggle dark mode"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

/* ============================================
 * 5. UPDATED COMPONENT EXAMPLES
 * ============================================ */

/* Example: Updated StepCard classes */
className="bg-surface-elevated rounded-2xl shadow-card p-4 mb-6 flex flex-col gap-4 border border-border max-w-3xl mx-auto"

/* Example: Updated button classes */
className="px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 border border-primary-200 transition-colors"

/* Example: Updated input classes */
className="border border-border rounded px-3 py-2 w-full bg-surface text-text-primary 
          placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-100 
          focus:border-primary-300 transition-colors"

/* Example: Updated text classes */
className="text-text-primary font-bold text-xl"  // Instead of text-gray-900
className="text-text-secondary font-medium"      // Instead of text-gray-700

/* ============================================
 * 6. IONIC INTEGRATION (Optional)
 * ============================================ */

/* If you want to sync with Ionic's theming, add to your main CSS: */
ion-app.dark {
  --ion-background-color: rgb(var(--color-surface-subtle));
  --ion-text-color: rgb(var(--color-text-primary));
  --ion-toolbar-background: rgb(var(--color-surface-elevated));
  --ion-item-background: rgb(var(--color-surface));
}

/* ============================================
 * 7. CAPACITOR MOBILE CONSIDERATIONS
 * ============================================ */

/* Add these for better mobile experience */
@media (max-width: 768px) {
  .recipe-card {
    @apply mx-2 rounded-xl; /* Smaller margins and radius on mobile */
  }
  
  .btn-primary, .btn-secondary, .btn-danger {
    @apply min-h-[44px]; /* iOS touch target minimum */
  }
}

/* Status bar styling for mobile */
@supports (padding-top: env(safe-area-inset-top)) {
  .page-bg {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
}