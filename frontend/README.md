# Loafly - Sourdough Baking App (Frontend)

React 19 + TypeScript + Vite frontend for the Loafly sourdough baking management application.

## Features

- 🍞 Recipe management and builder
- 🕐 Bake tracking with timers
- 📊 Baking history and analytics
- 👤 User profiles and preferences
- 🔔 Local notifications
- 📱 Mobile-ready (Capacitor)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run E2E tests
npm run test:e2e
```

> **Note on workspaces**  
> This repo uses npm workspaces, so React is hoisted to `../node_modules`. Vite is configured with aliases and `optimizeDeps.exclude` so you don't need to adjust anything—just run the commands above and the dev server will resolve React correctly.

## Documentation

- **[CHANGELOG.md](./CHANGELOG.md)** - Recent changes and fixes
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
- **[E2E_TESTING_GUIDE.md](./E2E_TESTING_GUIDE.md)** - E2E testing documentation
- **[e2e/README.md](./e2e/README.md)** - E2E test suite details

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
