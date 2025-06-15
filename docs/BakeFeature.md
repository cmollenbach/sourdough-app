# Bake Feature Implementation Plan

## 1. Overview & Guiding Principles

This document outlines the plan to implement the "Bake" functionality, which allows users to track a recipe in real-time. The implementation will reuse existing patterns for state management and API calls, follow a "backend-first" approach, and build the UI incrementally.

## 2. Data Model & Schema

The bake feature relies on "snapshotting" recipe data to preserve historical accuracy.

* **Bake**: Represents a single baking event, linked to a recipe and a user. It tracks the overall status and timing of the bake.
* **BakeStep**: Tracks the user's execution of each step during a bake, including its status (e.g., PENDING, COMPLETED) and actual start/finish times.
* **BakeStepField**: Stores a snapshot of the planned value for each step field at the moment a bake was started, and also allows for recording the `actual_value` entered during the bake.
* **BakeStepIngredient**: Stores a snapshot of the planned ingredients for each step.

## 3. Backend Implementation

### Database Schema Modifications
The `schema.prisma` file is updated with new `BakeStatus` and `BakeStepStatus` enums and expanded `Bake` and `BakeStep` models to include fields for status, timestamps, and notes.

### API Routes
A new set of protected API endpoints under `/api/bakes` will manage all bake-related actions.

* **`GET /api/bakes/active`**: Fetches all bakes for the current user with a status of `IN_PROGRESS`.
* **`POST /api/bakes`**: Creates a new bake by snapshotting the chosen recipe's steps, parameters, and ingredients into new `BakeStep`, `BakeStepField`, and `BakeStepIngredient` records.
* **`PUT /api/bakes/:bakeId/...`**: A series of endpoints to update the status of a bake or its steps (e.g., cancel, start, complete, skip) and to update notes or adjusted values.

## 4. Frontend Implementation

### Frontend Types
New TypeScript types are created in `frontend/src/types/bake.ts` to match the new Prisma models for `Bake`, `BakeStep`, and their related statuses.

### State Management (Zustand Store)
A new Zustand store is created in `frontend/src/store/useBakeStore.ts` to manage the state of active bakes. This store will handle fetching active bakes and all actions like starting, canceling, or completing a bake.

### UI Implementation
The UI will be built incrementally, starting with the list of active bakes, then the active bake screen itself, and finally the bake summary page.