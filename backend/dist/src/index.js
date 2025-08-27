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
const userProfile_1 = __importDefault(require("./routes/userProfile")); // <-- Add this line
const helmet_1 = __importDefault(require("helmet")); // <-- Import helmet
dotenv_1.default.config();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
const app = (0, express_1.default)();
// CORS Configuration
// This needs to be configured before your routes and before express.json()
// if you want pre-flight requests for all routes to be handled correctly.
// Default allowed origins
let allowedOrigins = [
    'http://localhost:5173', // Vite default
    'http://localhost:5174', // Your current .env default
    'https://loafly.app', // Your primary Netlify frontend
    'https://sdprocess.netlify.app' // Another allowed Netlify frontend
];
// Override with CORS_ORIGINS environment variable if set
if (process.env.CORS_ORIGINS) {
    allowedOrigins = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
}
app.use((0, helmet_1.default)()); // <-- Use helmet for security headers
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Log the received origin and the list of allowed origins for every CORS check
        console.log('[CORS Check] Received Origin:', origin);
        console.log('[CORS Check] Allowed Origins:', allowedOrigins);
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
            console.log('[CORS Check] Origin allowed.');
            callback(null, true);
        }
        else {
            console.error('[CORS Check] Origin NOT allowed:', origin); // This will show the problematic origin
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
app.use('/api/userProfile', userProfile_1.default); // <-- Add this line
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map