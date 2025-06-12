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
  name?: string;
  picture?: string;
};

// Google OAuth
router.post('/oauth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: "Missing idToken" });

  try {
    const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const { sub: googleId, email, name, picture } = googleRes.data as GoogleTokenInfo;

    let account = await prisma.account.findFirst({
      where: { provider: 'google', providerAccountId: googleId },
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

export default router;