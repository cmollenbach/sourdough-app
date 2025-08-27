import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import recipesRouter from "./routes/recipes";
import stepRoutes from "./routes/steps";
import metaRouter from "./routes/meta"; // <-- Add this line
import bakesRoutes from './routes/bakes'; // <-- Add this line
import userProfileRoutes from './routes/userProfile'; // <-- Add this line
import helmet from 'helmet'; // <-- Import helmet

dotenv.config();

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


// Health check route
app.get("/api/health", (_req, res) => {
  res.json({ status: "Backend is running!" });
});

app.use("/api/auth", authRoutes);
app.use("/api", recipesRouter);
app.use("/api/steps", stepRoutes);
app.use("/api/meta", metaRouter); // <-- Add this line
app.use('/api/bakes', bakesRoutes); // <-- Add this line
app.use('/api/userProfile', userProfileRoutes); // <-- Add this line

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});