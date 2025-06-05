# Sourdough App User Authentication & Management — Data Model & Documentation

This document defines the data model for user authentication and account management, supporting both traditional (email/password) and OAuth (Google, Apple, etc.) login methods. It is aligned with project tech stack and designed for extensibility and privacy.

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram (Textual)](#entity-relationship-diagram)
3. [User Auth Table Documentation](#user-auth-table-documentation)
    * [User](#user)
    * [Account](#account)
    * [Session](#session)
    * [UserProfile](#userprofile)
4. [Design Notes & Considerations](#design-notes--considerations)
5. [Example Usage](#example-usage)

---

## Overview

This model supports:
- Secure authentication via email/password and OAuth providers (Google, Apple, etc.).
- Single user record regardless of sign-in method.
- Multiple authentication methods per user (e.g., user can link Google and email/password).
- Basic profile fields stored separately from auth data for privacy and extensibility.
- Session management for stateless APIs or persistent login.

---

## Entity Relationship Diagram (Textual)

```
User --1---*-- Account
User --1---*-- Session
User --1---1-- UserProfile
```

---

## User Auth Table Documentation

### User

- **Purpose:**  
  Canonical user record. All personal, non-auth-specific identifiers.

- **Fields:**
  - `id`: integer, primary key
  - `email`: string, unique (may be null if only using OAuth without email scope)
  - `email_verified`: boolean, default false
  - `created_at`: timestamp
  - `updated_at`: timestamp
  - `is_active`: boolean — soft deletion/archive
  - `last_login_at`: timestamp, nullable
  - `role`: string — e.g., 'user', 'admin'
  - `notes`: text, optional (internal notes, never exposed to user)

---

### Account

- **Purpose:**  
  Stores authentication method for a user. Each user can have multiple accounts (e.g., email, Google, Apple).

- **Fields:**
  - `id`: integer, primary key
  - `user_id`: integer, foreign key to `User.id`
  - `provider`: string — e.g., 'email', 'google', 'apple'
  - `provider_account_id`: string — unique ID from provider (e.g., Google sub, Apple id, or email for 'email')
  - `password_hash`: string, nullable (only for 'email' provider)
  - `access_token`: string, nullable — OAuth token (encrypted at rest; optional, best practice is not to persist unless needed)
  - `refresh_token`: string, nullable — OAuth refresh token
  - `token_expires_at`: timestamp, nullable
  - `created_at`: timestamp
  - `updated_at`: timestamp

---

### Session

- **Purpose:**  
  Tracks persistent user sessions (e.g., JWTs, session tokens).

- **Fields:**
  - `id`: integer, primary key
  - `user_id`: integer, foreign key to `User.id`
  - `session_token`: string, unique (hashed if possible)
  - `created_at`: timestamp
  - `expires_at`: timestamp
  - `ip_address`: string, optional
  - `user_agent`: string, optional

---

### UserProfile

- **Purpose:**  
  Stores user-facing profile info, separate from auth data.

- **Fields:**
  - `id`: integer, primary key
  - `user_id`: integer, unique foreign key to `User.id`
  - `display_name`: string
  - `avatar_url`: string, nullable
  - `bio`: text, nullable
  - `preferences`: jsonb, nullable (user settings, e.g., theme, notifications)

---

## Design Notes & Considerations

- **Multiple Accounts:**  
  Users can sign in with any linked provider (email, Google, Apple, etc.). Linking/unlinking handled at app level.
- **Email Uniqueness:**  
  Enforced at `User` level; may be null for OAuth-only users. `Account` ensures a provider+provider_account_id is unique.
- **Session Security:**  
  Session tokens should be hashed in the DB. Expiry and IP/user agent can be used for security.
- **Soft Deletion:**  
  Use `is_active` flag on `User` for GDPR/support.
- **Extensibility:**  
  Add fields/tables for password reset, email verification tokens, audit logs, MFA as needed.
- **Privacy:**  
  Store only the minimum required for login. Avoid persisting OAuth tokens unless absolutely necessary.

---

## Example Usage

- **User signs up with Google:**  
  - `User` row created with email, email_verified true.  
  - `Account` row with provider 'google' and provider_account_id from Google profile.
- **User later sets a password:**  
  - New `Account` row with provider 'email' and password_hash.
- **User logs in:**  
  - New `Session` created, linked to `User`.
- **User updates profile:**  
  - `UserProfile` updated with display name, avatar, etc.

---

_This model is designed for a modern SaaS application and can be expanded as needed for roles, audit trails, or social features._