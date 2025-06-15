# Authentication and Onboarding Guide

## 1. Overview & Goals

This document defines the complete data model and implementation plan for user authentication, account management, and onboarding. The system supports traditional email/password logins as well as social logins (Google, Apple) and aims to provide a friendly, encouraging user experience.

## 2. User Experience (UX) and Messaging

* **Welcome Screen**: A clean screen with "Continue with Google," "Continue with Apple," and "Sign up with Email" options.
* **Onboarding**: After a successful login, a welcome modal appears with a friendly greeting and options like "Start Baking" or "Show Me Around".
* **Messaging**: All copy should be positive, clear, and confidence-building.

## 3. Data Model

The data model separates user identity from authentication methods for security and flexibility.

* **User**: The canonical record for a user, containing their email and role.
* **Account**: Stores the authentication method linked to a user. A single user can have multiple accounts (e.g., one for 'email', one for 'google').
* **Session**: Tracks persistent user sessions via tokens.
* **UserProfile**: Stores user-facing profile information like display name and avatar URL, separate from authentication data.

## 4. Backend Implementation

### OAuth Endpoint Design
The backend will have `/auth/oauth/<provider>` endpoints that accept an OAuth token from the frontend. The server will then:
1.  Verify the token with the provider (e.g., Google).
2.  Find an existing user or create a new one.
3.  Create an `Account` record to link the provider to the `User` record.
4.  Issue a JWT to the frontend for session management.

## 5. Frontend Implementation

* **UI Components**:
    * `SocialLoginButtons.tsx`: A component that renders the "Continue with Google" and "Continue with Apple" buttons.
    * `OnboardingModal.tsx`: A modal displayed after the first successful login to welcome the user.
* **Mobile (Capacitor) Considerations**: For native mobile apps, native SDKs like `@capacitor/google-auth` and `@capacitor-community/apple-sign-in` should be used, while still communicating with the same backend endpoints.
* **Auth Context**: The existing `AuthContext` will be refactored to handle login flows from both email/password and social providers.
