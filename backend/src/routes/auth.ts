import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";
import prisma from "../lib/prisma";
import logger from "../lib/logger";
import { AppError } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validation";
import { registerSchema, loginSchema, googleOAuthSchema } from "../validation/authSchemas";

const router = express.Router();
// JWT_SECRET is validated at startup in index.ts, so we can safely use it here
const JWT_SECRET = process.env.JWT_SECRET!;

// Register
router.post("/register", validateBody(registerSchema), async (req: Request, res: Response, next) => {
  try {
    const { email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, "Email already registered");
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash: hash, emailVerified: false, isActive: true }
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    
    logger.info('User registered successfully', { userId: user.id, email: user.email });
    
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// Login
router.post("/login", validateBody(loginSchema), async (req: Request, res: Response, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      // Don't reveal whether email exists - generic message
      throw new AppError(401, "Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "Invalid credentials");
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    
    logger.info('User logged in successfully', { userId: user.id, email: user.email });
    
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// Add this type above your router.post('/oauth/google', ...)
type GoogleTokenInfo = {
  sub: string;
  email: string;
  email_verified?: string | boolean; // Google can send this as string "true"/"false" or boolean
  name?: string;
  picture?: string;
};

// Google OAuth
router.post('/oauth/google', validateBody(googleOAuthSchema), async (req, res, next) => {
  const { idToken } = req.body;

  try {
    // Step 1: Verify the ID token with Google
    const googleTokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    logger.debug('Verifying Google ID token', { url: googleTokenInfoUrl });

    const googleRes = await axios.get<GoogleTokenInfo>(googleTokenInfoUrl);
    const { sub: googleId, email, name, picture, email_verified } = googleRes.data;

    logger.debug('Google token verified', { email, googleId, email_verified });

    // Consider also checking 'aud' (audience) and 'iss' (issuer) claims for stricter validation
    // if not implicitly handled by the tokeninfo endpoint for your client ID.

    // Step 2: Find or create the user in your database
    let user = await prisma.user.findUnique({
      where: { email: email },
      include: { accounts: true, userProfile: true } // Include userProfile
    });

    let account = user?.accounts.find(acc => acc.provider === 'google' && acc.providerAccountId === googleId);

    if (user && !account) {
      // User exists with this email but not linked to this Google account yet. Link it.
      logger.info('Linking existing user to Google account', { email, userId: user.id });
      account = await prisma.account.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerAccountId: googleId,
          accessToken: idToken, // Storing idToken. For API access, an access_token is different.
        }
      });
      // Optionally update user's emailVerified status and profile if Google says so
      const isEmailVerifiedByGoogle = String(email_verified).toLowerCase() === 'true';
      const userProfileUpdates: any = {};
      if (isEmailVerifiedByGoogle && !user.emailVerified) {
        userProfileUpdates.emailVerified = true;
      }
      if (picture && (!user.userProfile || !user.userProfile.avatarUrl)) {
         // If userProfile doesn't exist, create it. Otherwise, update avatar if not set.
        if (!user.userProfile) {
            // Inside this block, user.userProfile is known to be null or undefined.
            // So, user.userProfile?.displayName would resolve to undefined.
            // The expression user.userProfile?.displayName || name || email.split('@')[0]
            // simplifies to name || email.split('@')[0].
            await prisma.userProfile.create({
              data: {
                userId: user.id, avatarUrl: picture, displayName: name || email.split('@')[0]
              }});
        } else {
            userProfileUpdates.userProfile = { update: { avatarUrl: picture } };
        }
      }
      if (Object.keys(userProfileUpdates).length > 0 || (isEmailVerifiedByGoogle && !user.emailVerified)) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...( (isEmailVerifiedByGoogle && !user.emailVerified) && { emailVerified: true }),
            ...( (picture && (!user.userProfile || !user.userProfile.avatarUrl)) && { userProfile: { upsert : {
                create: { displayName: name || email.split('@')[0], avatarUrl: picture },
                update: { avatarUrl: picture }
            }}})
          },
          include: { accounts: true, userProfile: true }
        });
      }
    } else if (!user) {
      // New user: create user, account, and profile
      logger.info('Creating new user via Google OAuth', { email });
      user = await prisma.user.create({
        data: {
          email,
          emailVerified: String(email_verified).toLowerCase() === 'true',
          isActive: true,
          accounts: {
            create: {
              provider: 'google',
              providerAccountId: googleId,
              accessToken: idToken,
            }
          },
          userProfile: {
            create: {
              displayName: name || email.split('@')[0],
              avatarUrl: picture,
            }
          }
        },
        include: { accounts: true, userProfile: true }
      });
      account = user.accounts.find(acc => acc.provider === 'google');
    } else {
      logger.debug('User already linked to Google account', { email, userId: user.id });
    }

    if (!user || !account) {
      logger.error('Critical error: User or account null after Google OAuth processing', { email });
      throw new AppError(500, "User processing failed after Google auth.");
    }

    // Step 3: Create a session token (JWT) for your application
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    logger.info('User authenticated via Google OAuth', { userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.userProfile?.displayName || name || email.split('@')[0],
        avatarUrl: user.userProfile?.avatarUrl || picture,
      }
    });

  } catch (err: any) {
    // Handle axios errors from Google API
    if (err.response) {
      logger.error('Google API error during OAuth', { 
        status: err.response.status, 
        data: err.response.data 
      });
      throw new AppError(
        err.response.status || 401,
        "Invalid Google credentials or failed to verify with Google.",
        { details: err.response.data }
      );
    } else if (err.request) {
      logger.error('No response from Google verification service', { request: err.request });
      throw new AppError(500, "No response from Google verification service.");
    } else {
      // Pass other errors to error handler (Prisma, JWT, etc.)
      next(err);
    }
  }
});

export default router;