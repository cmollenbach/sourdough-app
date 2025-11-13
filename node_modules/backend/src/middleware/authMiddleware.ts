import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export interface AuthRequest extends Request {
  user?: { userId: number; email: string; role: UserRole };
}

export async function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.email) {
      return res.status(401).json({ error: "User account is missing an email address." });
    }

    req.user = { userId: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
}