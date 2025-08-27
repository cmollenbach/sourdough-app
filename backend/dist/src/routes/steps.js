"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// --- NEW ---
// Update a Step Template (Admin only)
router.put("/templates/:id", authMiddleware_1.authenticateJWT, authMiddleware_1.requireAdmin, async (req, res) => {
    try {
        const templateId = Number(req.params.id);
        const { name, description } = req.body;
        if (typeof name !== 'string' || typeof description !== 'string') {
            return res.status(400).json({ error: "Invalid data: name and description are required." });
        }
        const updatedTemplate = await prisma.stepTemplate.update({
            where: { id: templateId },
            data: { name, description },
        });
        res.json(updatedTemplate);
    }
    catch (err) {
        console.error("Failed to update step template:", err);
        res.status(500).json({ error: "Failed to update step template" });
    }
});
// Delete a Step Template (Admin only)
router.delete("/templates/:id", authMiddleware_1.authenticateJWT, authMiddleware_1.requireAdmin, async (req, res) => {
    try {
        const templateId = Number(req.params.id);
        const templateInUse = await prisma.recipeStep.findFirst({
            where: { stepTemplateId: templateId },
        });
        if (templateInUse) {
            return res.status(400).json({
                error: "Cannot delete template because it is currently used by at least one recipe."
            });
        }
        await prisma.stepTemplate.delete({
            where: { id: templateId },
        });
        res.status(204).send();
    }
    catch (err) {
        console.error("Failed to delete step template:", err);
        res.status(500).json({ error: "Failed to delete step template" });
    }
});
// --- EXISTING ROUTES for RecipeSteps ---
// Create a step for a recipe
router.post("/", authMiddleware_1.authenticateJWT, async (req, res) => {
    // ... existing code ...
});
// Get all steps for a recipe
router.get("/:recipeId", authMiddleware_1.authenticateJWT, async (req, res) => {
    // ... existing code ...
});
// Update a step
router.put("/:id", authMiddleware_1.authenticateJWT, async (req, res) => {
    // ... existing code ...
});
// Delete a step
router.delete("/:id", authMiddleware_1.authenticateJWT, async (req, res) => {
    // ... existing code ...
});
exports.default = router;
//# sourceMappingURL=steps.js.map