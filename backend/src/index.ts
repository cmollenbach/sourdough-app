import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import recipesRouter from "./routes/recipes";
import stepRoutes from "./routes/steps";
import metaRouter from "./routes/meta"; // <-- Add this line
import bakesRoutes from './routes/bakes'; // <-- Add this line

dotenv.config();

const app = express();
app.use(cors());
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