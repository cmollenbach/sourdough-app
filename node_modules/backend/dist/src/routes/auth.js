"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const logger_1 = __importDefault(require("../lib/logger"));
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../middleware/validation");
const authSchemas_1 = require("../validation/authSchemas");
const router = express_1.default.Router();
// JWT_SECRET is validated at startup in index.ts, so we can safely use it here
const JWT_SECRET = process.env.JWT_SECRET;
// Register
router.post("/register", (0, validation_1.validateBody)(authSchemas_1.registerSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing) {
            throw new errorHandler_1.AppError(409, "Email already registered");
        }
        const hash = await bcrypt_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: { email, passwordHash: hash, emailVerified: false, isActive: true }
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        logger_1.default.info('User registered successfully', { userId: user.id, email: user.email });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    }
    catch (err) {
        next(err);
    }
});
// Login
router.post("/login", (0, validation_1.validateBody)(authSchemas_1.loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            // Don't reveal whether email exists - generic message
            throw new errorHandler_1.AppError(401, "Invalid credentials");
        }
        const valid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!valid) {
            throw new errorHandler_1.AppError(401, "Invalid credentials");
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        logger_1.default.info('User logged in successfully', { userId: user.id, email: user.email });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    }
    catch (err) {
        next(err);
    }
});
// Google OAuth
router.post('/oauth/google', (0, validation_1.validateBody)(authSchemas_1.googleOAuthSchema), async (req, res, next) => {
    const { idToken } = req.body;
    try {
        // Step 1: Verify the ID token with Google
        const googleTokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
        logger_1.default.debug('Verifying Google ID token', { url: googleTokenInfoUrl });
        const googleRes = await axios_1.default.get(googleTokenInfoUrl);
        const { sub: googleId, email, name, picture, email_verified } = googleRes.data;
        logger_1.default.debug('Google token verified', { email, googleId, email_verified });
        // Consider also checking 'aud' (audience) and 'iss' (issuer) claims for stricter validation
        // if not implicitly handled by the tokeninfo endpoint for your client ID.
        // Step 2: Find or create the user in your database
        let user = await prisma_1.default.user.findUnique({
            where: { email: email },
            include: { accounts: true, userProfile: true } // Include userProfile
        });
        let account = user?.accounts.find(acc => acc.provider === 'google' && acc.providerAccountId === googleId);
        if (user && !account) {
            // User exists with this email but not linked to this Google account yet. Link it.
            logger_1.default.info('Linking existing user to Google account', { email, userId: user.id });
            account = await prisma_1.default.account.create({
                data: {
                    userId: user.id,
                    provider: 'google',
                    providerAccountId: googleId,
                    accessToken: idToken, // Storing idToken. For API access, an access_token is different.
                }
            });
            // Optionally update user's emailVerified status and profile if Google says so
            const isEmailVerifiedByGoogle = String(email_verified).toLowerCase() === 'true';
            const userProfileUpdates = {};
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
                    await prisma_1.default.userProfile.create({
                        data: {
                            userId: user.id, avatarUrl: picture, displayName: name || email.split('@')[0]
                        }
                    });
                }
                else {
                    userProfileUpdates.userProfile = { update: { avatarUrl: picture } };
                }
            }
            if (Object.keys(userProfileUpdates).length > 0 || (isEmailVerifiedByGoogle && !user.emailVerified)) {
                user = await prisma_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        ...((isEmailVerifiedByGoogle && !user.emailVerified) && { emailVerified: true }),
                        ...((picture && (!user.userProfile || !user.userProfile.avatarUrl)) && { userProfile: { upsert: {
                                    create: { displayName: name || email.split('@')[0], avatarUrl: picture },
                                    update: { avatarUrl: picture }
                                } } })
                    },
                    include: { accounts: true, userProfile: true }
                });
            }
        }
        else if (!user) {
            // New user: create user, account, and profile
            logger_1.default.info('Creating new user via Google OAuth', { email });
            try {
                user = await prisma_1.default.user.create({
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
            }
            catch (createError) {
                // Handle race condition: another concurrent request may have created the user
                if (createError.code === 'P2002') {
                    // Unique constraint violation - user was created by concurrent request
                    logger_1.default.warn('Race condition detected during user creation, fetching existing user', { email });
                    user = await prisma_1.default.user.findUnique({
                        where: { email },
                        include: { accounts: true, userProfile: true }
                    });
                    account = user?.accounts.find(acc => acc.provider === 'google');
                    if (!account && user) {
                        // User exists but no Google account - create the account link
                        account = await prisma_1.default.account.create({
                            data: {
                                userId: user.id,
                                provider: 'google',
                                providerAccountId: googleId,
                                accessToken: idToken,
                            }
                        });
                    }
                }
                else {
                    // Re-throw other Prisma errors
                    throw createError;
                }
            }
        }
        else {
            logger_1.default.debug('User already linked to Google account', { email, userId: user.id });
        }
        if (!user || !account) {
            logger_1.default.error('Critical error: User or account null after Google OAuth processing', { email });
            throw new errorHandler_1.AppError(500, "User processing failed after Google auth.");
        }
        // Step 3: Create a session token (JWT) for your application
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
        logger_1.default.info('User authenticated via Google OAuth', { userId: user.id, email: user.email });
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
    }
    catch (err) {
        // Handle axios errors from Google API
        if (err.response) {
            logger_1.default.error('Google API error during OAuth', {
                status: err.response.status,
                data: err.response.data
            });
            throw new errorHandler_1.AppError(err.response.status || 401, "Invalid Google credentials or failed to verify with Google.", { details: err.response.data });
        }
        else if (err.request) {
            logger_1.default.error('No response from Google verification service', { request: err.request });
            throw new errorHandler_1.AppError(500, "No response from Google verification service.");
        }
        else {
            // Pass other errors to error handler (Prisma, JWT, etc.)
            next(err);
        }
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map