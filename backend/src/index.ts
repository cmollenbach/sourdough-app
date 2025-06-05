import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth"; // <-- Import your auth routes
import recipesRouter from "./routes/recipes";
import stepRoutes from "./routes/steps";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check route
app.get("/api/health", (_req, res) => {
  res.json({ status: "Backend is running!" });
});

// Mount authentication routes
app.use("/api/auth", authRoutes); // <-- Correct usage
app.use("/api", recipesRouter);
app.use("/api/steps", stepRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});