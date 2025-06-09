"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const prisma = new client_1.PrismaClient();
async function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        if (!user.email) {
            return res.status(401).json({ error: "User account is missing an email address." });
        }
        req.user = { userId: user.id, email: user.email, role: user.role };
        next();
    }
    catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
function requireAdmin(req, res, next) {
    if (req.user?.role !== client_1.UserRole.ADMIN) {
        return res.status(403).json({ error: "Forbidden: Admins only" });
    }
    next();
}
//# sourceMappingURL=authMiddleware.js.map