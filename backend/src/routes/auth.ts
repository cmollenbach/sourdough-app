import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret"; // Use env var in production

// Register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash: hash, emailVerified: false, isActive: true }
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
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
router.post('/oauth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: "Missing idToken" });
  }

  try {
    // Step 1: Verify the ID token with Google
    const googleTokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    console.log(`[Google OAuth] Verifying token with URL: ${googleTokenInfoUrl}`);

    const googleRes = await axios.get<GoogleTokenInfo>(googleTokenInfoUrl);
    const { sub: googleId, email, name, picture, email_verified } = googleRes.data;

    console.log('[Google OAuth] Token info received:', googleRes.data);

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
      console.log(`[Google OAuth] User ${email} exists, linking Google account.`);
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
      console.log(`[Google OAuth] New user ${email}, creating account.`);
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
      console.log(`[Google OAuth] User ${email} and Google account already linked.`);
    }

    if (!user || !account) {
      console.error("[Google OAuth] Critical error: User or account is null after processing.");
      return res.status(500).json({ error: "User processing failed after Google auth." });
    }

    // Step 3: Create a session token (JWT) for your application
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

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
    console.error("[Google OAuth] Main error caught:", err.message);
    if (err.response) {
      // Error from axios (e.g., Google API returned an error)
      console.error("[Google OAuth] Google API Error Data:", err.response.data);
      console.error("[Google OAuth] Google API Error Status:", err.response.status);
      return res.status(err.response.status || 401).json({
        error: "Invalid Google credentials or failed to verify with Google.",
        details: err.response.data
      });
    } else if (err.request) {
      // Request was made but no response received
      console.error("[Google OAuth] Google API No Response:", err.request);
      return res.status(500).json({ error: "No response from Google verification service." });
    } else {
      // Other errors (e.g., Prisma, JWT signing)
      console.error("[Google OAuth] Internal OAuth Error:", err);
      return res.status(500).json({ error: "Social login failed due to an internal server error." });
    }
  }
});

export default router;