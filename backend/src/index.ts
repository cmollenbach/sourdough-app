import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from 'helmet';
import logger from './lib/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import authRoutes from "./routes/auth";
import recipesRouter from "./routes/recipes";
import stepRoutes from "./routes/steps";
import metaRouter from "./routes/meta";
import bakesRoutes from './routes/bakes';
import userProfileRoutes from './routes/userProfile';

// Load environment variables
dotenv.config();

// ============================================
// Environment Variable Validation
// ============================================
// Validate required environment variables at startup
// This prevents the app from running with invalid configuration
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PORT',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ FATAL ERROR: Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease set these variables in your .env file.');
  process.exit(1);
}

// Validate JWT_SECRET is not a default/insecure value
if (process.env.JWT_SECRET === 'dev_secret' || process.env.JWT_SECRET === 'your_jwt_secret_here') {
  console.error('❌ FATAL ERROR: JWT_SECRET is set to an insecure default value.');
  console.error('   Please set a strong, unique JWT_SECRET in your .env file.');
  process.exit(1);
}

logger.info('✅ Environment variables validated successfully');

// ============================================
// Express App Setup
// ============================================
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

const app = express();

// CORS Configuration
// This needs to be configured before your routes and before express.json()
// if you want pre-flight requests for all routes to be handled correctly.

// Default allowed origins
let allowedOrigins = [
  'http://localhost:5173', // Vite default
  'http://localhost:5174', // Your current .env default
  'https://loafly.app',          // Your primary Netlify frontend
  'https://sdprocess.netlify.app' // Another allowed Netlify frontend
];

// Override with CORS_ORIGINS environment variable if set
if (process.env.CORS_ORIGINS) {
  allowedOrigins = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
}

app.use(helmet()); // <-- Use helmet for security headers
app.use(cors({
  origin: function (origin, callback) {
    // Log the received origin and the list of allowed origins for every CORS check
    console.log('[CORS Check] Received Origin:', origin);
    console.log('[CORS Check] Allowed Origins:', allowedOrigins);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      console.log('[CORS Check] Origin allowed.');
      callback(null, true);
    } else {
      console.error('[CORS Check] Origin NOT allowed:', origin); // This will show the problematic origin
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // This is crucial for allowing cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
}));

app.use(express.json());

// ============================================
// Rate Limiting
// ============================================
// Apply rate limiting before routes
// Auth endpoints have stricter limits (5 req/15min) than general API (100 req/15min)
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// ============================================
// Routes
// ============================================
// Health check route
app.get("/api/health", (_req, res) => {
  res.json({ status: "Backend is running!" });
});

app.use("/api/auth", authRoutes);
app.use("/api", recipesRouter);
app.use("/api/steps", stepRoutes);
app.use("/api/meta", metaRouter);
app.use('/api/bakes', bakesRoutes);
app.use('/api/userProfile', userProfileRoutes);

// ============================================
// Error Handling
// ============================================
// Handle 404 for undefined routes (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 CORS allowed origins: ${allowedOrigins.join(', ')}`);
});