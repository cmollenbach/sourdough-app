# Loafly Social Login & Onboarding Enhancement Plan

## Overview

This document outlines the implementation plan for integrating Google and Apple login (with extensibility for other providers) into the Loafly sourdough baking app. It also describes improvements to the welcoming, registration, and onboarding experience.  
This plan is designed to be actionable and compatible with Copilot in VS Code, so you can use this as a working reference as you build and iterate.

---

## Table of Contents

1. [Goals and Principles](#goals-and-principles)  
2. [User Experience (UX) and Messaging](#user-experience-ux-and-messaging)  
3. [Backend Implementation](#backend-implementation)  
    - [OAuth Endpoint Design](#oauth-endpoint-design)
    - [Google OAuth Endpoint Example](#google-oauth-endpoint-example)
    - [Apple OAuth Endpoint Example (Outline)](#apple-oauth-endpoint-example-outline)
    - [Security and Testing](#security-and-testing)
4. [Frontend Implementation](#frontend-implementation)  
    - [UI Components and Layout](#ui-components-and-layout)
    - [Social Login Button Example](#social-login-button-example)
    - [Integration in Login/Register](#integration-in-loginregister)
    - [Onboarding Modal/Welcome](#onboarding-modalwelcome)
    - [Mobile Considerations (Capacitor)](#mobile-considerations-capacitor)
5. [Database/Prisma Considerations](#databaseprisma-considerations)  
6. [Auth Context Refactor](#auth-context-refactor)  
7. [Copilot and VS Code Usage](#copilot-and-vs-code-usage)  
8. [Folder/File Structure](#folderfile-structure)  
9. [Appendix: Messaging Examples](#appendix-messaging-examples)

---

## Goals and Principles

- Add Google and Apple (and optionally other) social login to Loafly, in addition to email/password.
- Enhance the welcoming and onboarding flow, reflecting Loafly’s friendly, encouraging brand.
- Prepare for future mobile (Capacitor) support.
- Keep code modular and maintainable, supporting both web and mobile.
- Ensure all UX copy is positive, clear, and confidence-building.

---

## User Experience (UX) and Messaging

### Welcome Screen

- **Logo/Icon:** Centered, with tagline:  
  _"Loafly: Bake with Confidence and Joy."_
- **Buttons:**  
  - "Continue with Google"
  - "Continue with Apple"
  - "Sign up with Email"
  - "Log in"
- **Optional:** "Discover Features" – links to app highlights

### Registration

- Minimal form fields; social login options displayed prominently.
- Friendly, non-intimidating copy.
- If social login, pre-fill user profile fields where possible.

### Login

- Social login options at the top.
- Clear, positive feedback on error or success.

### Onboarding

- After successful login/registration, show a modal or welcome page:
    - "Hi, [First Name]! Loafly is your companion for every bake. Want a quick tour?"
    - Buttons: "Start Baking", "Show Me Around", "Browse Recipes"

---

## Backend Implementation

### OAuth Endpoint Design

- Add `/auth/oauth/<provider>` endpoints to accept OAuth tokens, validate with provider, and create/find user.
- Issue JWT and user info in response.
- Use the existing `Account` model (see `schema.prisma`) for provider linkage.

#### Dependencies

```bash
npm install axios
# For Apple: npm install apple-signin-auth (or similar)
```

### Google OAuth Endpoint Example

```typescript name=backend/src/routes/auth.ts
import axios from 'axios';

router.post('/oauth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: "Missing idToken" });

  try {
    // Verify token with Google
    const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const { sub: googleId, email, name, picture } = googleRes.data;

    let account = await prisma.account.findUnique({
      where: { provider_providerAccountId: { provider: 'google', providerAccountId: googleId } },
      include: { user: true }
    });
    let user = account?.user;
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          emailVerified: true,
          isActive: true,
          accounts: {
            create: {
              provider: 'google',
              providerAccountId: googleId,
              accessToken: idToken
            }
          },
          userProfile: { create: { displayName: name || email, avatarUrl: picture } }
        }
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.status(401).json({ error: "Invalid Google credentials" });
  }
});
```

### Apple OAuth Endpoint Example (Outline)

- Use the `apple-signin-auth` npm package or raw JWT validation.
- The logic mirrors the Google endpoint: verify, find or create user, link provider, respond with JWT.

### Security and Testing

- Always verify provider token server-side.
- Ensure JWT is only issued after successful OAuth validation.
- Test all edge cases: new user, existing user, invalid token, repeat login.

---

## Frontend Implementation

### UI Components and Layout

- Add new or update existing components in `frontend/src/components/Auth/`:
    - `SocialLoginButtons.tsx`
    - Integrate with `Login.tsx`, `Register.tsx`, and `Welcome.tsx`

### Social Login Button Example

```typescript name=frontend/src/components/Auth/SocialLoginButtons.tsx
import React from 'react';
import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';

type Props = { onLoginSuccess: (token: string, provider: string) => void };

export const SocialLoginButtons: React.FC<Props> = ({ onLoginSuccess }) => {
  const handleGoogleSuccess = (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    if ('tokenId' in response) {
      onLoginSuccess(response.tokenId, 'google');
    }
  };

  const handleGoogleFailure = () => {
    alert('Google login failed. Please try again.');
  };

  return (
    <div>
      <GoogleLogin
        clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID!}
        buttonText="Continue with Google"
        onSuccess={handleGoogleSuccess}
        onFailure={handleGoogleFailure}
        cookiePolicy="single_host_origin"
      />
      {/* Apple Sign-In Button (web) */}
      {/* Placeholder: Implement with Sign in with Apple JS or capacitor-apple-sign-in for mobile */}
      <button disabled style={{marginTop: 8}}>Continue with Apple (Coming soon)</button>
    </div>
  );
};
```

### Integration in Login/Register

```typescript name=frontend/src/components/Auth/Login.tsx
import { SocialLoginButtons } from './SocialLoginButtons';
import { useAuth } from '../../context/authContextDefinition';

export const Login = () => {
  const { login } = useAuth();

  const handleSocialLogin = async (token: string, provider: string) => {
    let endpoint = '';
    if (provider === 'google') endpoint = '/auth/oauth/google';
    // if (provider === 'apple') endpoint = '/auth/oauth/apple';

    const res = await fetch(process.env.REACT_APP_API_URL + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    if (res.ok) {
      const { token: jwt, user } = await res.json();
      login(user.email); // Adjust as needed for your context
      localStorage.setItem('token', jwt);
    } else {
      alert('Social login failed.');
    }
  };

  return (
    <div>
      {/* Existing login fields */}
      <SocialLoginButtons onLoginSuccess={handleSocialLogin} />
    </div>
  );
};
```

### Onboarding Modal/Welcome

- After login, show a modal/page:
    - "Hi, [Name]! Welcome to Loafly. Want a quick tour or start baking right away?"
    - Buttons: "Start Baking", "Show Me Around", "Browse Recipes"
- Add this as `OnboardingModal.tsx` and display after successful authentication.

### Mobile Considerations (Capacitor)

- Use `@capacitor/google-auth` and `@capacitor-community/apple-sign-in` for native Google/Apple login.
- Abstract platform logic in a custom hook (`useSocialLogin()`).
- Ensure backend endpoints accept token formats from both web and mobile SDKs.

---

## Database/Prisma Considerations

- The current `Account` model in `schema.prisma` is compatible with social login.
- No schema changes needed.
- Each social login creates/links an `Account` entry to a `User`.

---

## Auth Context Refactor

- In `frontend/src/context/AuthContext.tsx`, refactor the `login` function to support both (email, password) and (provider, token) signatures.
- Ensure correct local storage of JWT and user object for all login methods.

---

## Copilot and VS Code Usage

- Open this document in VS Code alongside relevant component files.
- Use Copilot to:
    - Scaffold new backend routes and frontend components as shown in examples.
    - Add error handling, UI state, and onboarding logic.
    - Refactor existing logic for cross-platform (web/mobile) compatibility.
- Reference this doc for consistent messaging and structure.

---

## Folder/File Structure

```
frontend/src/components/Auth/
  - Login.tsx
  - Register.tsx
  - SocialLoginButtons.tsx
  - OnboardingModal.tsx
  - Welcome.tsx
frontend/src/context/
  - AuthContext.tsx
backend/src/routes/
  - auth.ts
docs/
  - social-login-onboarding.md
```

---

## Appendix: Messaging Examples

- **Welcome:**  
  _"Welcome to Loafly! Sign up in seconds with Google or Apple—or use your email to get started."_
- **Login:**  
  _"Welcome back! Continue with your favorite account, or sign in with your email."_
- **Social error:**  
  _"Could not log in with Google/Apple. Please try again or use another method."_
- **Onboarding:**  
  _"Hi, [First Name]! Loafly is your companion for every bake. Want a quick tour?"_

---

## Next Steps

1. **Implement backend `/auth/oauth/google` (and `/auth/oauth/apple`).**
2. **Create or update `SocialLoginButtons.tsx` and integrate with Login/Register.**
3. **Refactor `AuthContext.tsx` for multi-provider support.**
4. **Enhance onboarding and welcome flows with friendly messaging.**
5. **Test thoroughly, especially edge cases.**
6. **Prepare for mobile by abstracting social login logic.**

---

_This document is your working plan! Open it in VS Code as you develop for Copilot-powered assistance and code generation._