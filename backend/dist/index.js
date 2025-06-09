"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const recipes_1 = __importDefault(require("./routes/recipes"));
const steps_1 = __importDefault(require("./routes/steps"));
const meta_1 = __importDefault(require("./routes/meta")); // <-- Add this line
const bakes_1 = __importDefault(require("./routes/bakes")); // <-- Add this line
const helmet_1 = __importDefault(require("helmet")); // <-- Import helmet
dotenv_1.default.config();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const app = (0, express_1.default)();
app.use((0, helmet_1.default)()); // <-- Use helmet for security headers
// CORS Configuration
// This needs to be configured before your routes and before express.json()
// if you want pre-flight requests for all routes to be handled correctly.
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests) or from the whitelisted frontend URL
        if (!origin || origin === frontendUrl) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // This is crucial for allowing cookies/auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
}));
app.use(express_1.default.json());
// Health check route
app.get("/api/health", (_req, res) => {
    res.json({ status: "Backend is running!" });
});
app.use("/api/auth", auth_1.default);
app.use("/api", recipes_1.default);
app.use("/api/steps", steps_1.default);
app.use("/api/meta", meta_1.default); // <-- Add this line
app.use('/api/bakes', bakes_1.default); // <-- Add this line
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map