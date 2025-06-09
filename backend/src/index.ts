import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import recipesRouter from "./routes/recipes";
import stepRoutes from "./routes/steps";
import metaRouter from "./routes/meta"; // <-- Add this line
import bakesRoutes from './routes/bakes'; // <-- Add this line
import helmet from 'helmet'; // <-- Import helmet

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const app = express();

app.use(helmet()); // <-- Use helmet for security headers
// CORS Configuration
// This needs to be configured before your routes and before express.json()
// if you want pre-flight requests for all routes to be handled correctly.
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests) or from the whitelisted frontend URL
    if (!origin || origin === frontendUrl) {
      callback(null, true);
    } else {
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});