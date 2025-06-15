# Sourdough App: Project Overview

## 1. Project Purpose

This project aims to create a dynamic and user-friendly application for sourdough enthusiasts. Key goals include:

* **Create and Customize**: Enable users to create, customize, and track sourdough recipes and baking sessions.
* **Backend-Driven System**: All templates, steps, ingredients, and options are driven by the backend, allowing for a flexible and extensible system.
* **Support for All Levels**: Cater to both beginners with admin-curated templates and advanced users who want full customization.
* **Preserve Baking History**: Every bake log is a snapshot, ensuring that historical data is not affected by future changes to recipes or templates.

## 2. Tech Stack

The project utilizes a modern tech stack, optimized for a solo or small team development workflow.

### **Frontend**
* **Framework**: Vite + React + TypeScript
* **Styling**: Tailwind CSS
* **State Management**: React state/hooks

### **Backend**
* **Platform**: Node.js with Express
* **Language**: TypeScript
* **ORM**: Prisma
* **Database**: PostgreSQL
* **Authentication**: Email/password and OAuth (Google, Apple)

## 3. Core Features

The following is a list of the core features planned for the application:

* **User Authentication**: Secure registration and login using email/password and social providers (Google, Apple).
* **Recipe Management**: Full CRUD (Create, Read, Update, Delete) functionality for recipes.
* **Step-by-Step Recipe Builder**: A flexible system for building recipes using predefined templates and categories.
* **Bake Tracking**: Functionality to start, track, and complete a baking session, logging actuals against the planned recipe.
* **Bake History**: A log of all past bakes, preserved as snapshots.
* **Unified Dashboard**: A central place for users to browse, search, and manage their recipes and bakes.
* **GenAI Integration**: Fermentation advice provided by the Gemini API, clearly labeled as AI-generated.
* **Soft Deletion/Archiving**: All deletions are handled as "soft deletes" to preserve data integrity.

## 4. Development Roadmap

The following is a high-level checklist of the remaining tasks:

* **Core Functionality**
    * [ ] Implement recipe creation, editing, and deletion.
    * [ ] Enable step-by-step custom recipe building.
    * [ ] Implement bake tracking.
    * [ ] Integrate user authentication.
    * [ ] Add GenAI (Gemini) fermentation advice.
* **Testing**
    * [ ] Write unit and integration tests for the backend and frontend.
    * [ ] Set up a test database and seed scripts.
* **Deployment & CI/CD**
    * [ ] Set up environment variables and secrets management.
    * [ ] Automate deployment with CI/CD (GitHub Actions or similar).
* **Documentation**
    * [ ] Document API endpoints and the data model.