import express from "express";
import prisma from "../lib/prisma";
const router = express.Router();

// Step templates (with fields/groups)
router.get("/step-templates", async (_req, res) => {
  const templates = await prisma.stepTemplate.findMany({
    include: {
      // CHANGED: The relation is now 'parameters' which includes 'parameter' (the StepParameter)
      parameters: { include: { parameter: true } },
      ingredientRules: { include: { ingredientCategory: true } }
    },
    orderBy: { order: "asc" },
  });

  // Transform 'parameters' to 'fields'
  const transformed = templates.map(t => ({
    ...t,
    fields: t.parameters.map(tp => ({
      id: tp.id,
      fieldId: tp.parameterId,
      stepTemplateId: tp.stepTemplateId,
      order: tp.order,
      advanced: tp.advanced,
      visible: tp.visible,
      description: tp.description,
      helpText: tp.helpText,
      defaultValue: tp.defaultValue,
      field: tp.parameter,
    })),
    ingredientRules: t.ingredientRules.map(ir => ({
      ...ir,
      ingredientCategory: ir.ingredientCategory,
    })),
  }));

  res.json({ templates: transformed });
});

// Ingredients meta
router.get("/ingredients", async (_req, res) => {
  // This query remains the same
  const ingredients = await prisma.ingredient.findMany({ orderBy: { name: "asc" } });
  res.json({ ingredients });
});

// Ingredient categories/groups
router.get("/ingredient-categories", async (_req, res) => {
  // This query remains the same
  const categories = await prisma.ingredientCategory.findMany({ orderBy: { name: "asc" } });
  res.json({ categories });
});

// Get all StepParameters (formerly Fields)
router.get("/fields", async (_req, res) => {
  // CHANGED: Use the new 'stepParameter' model name
  const stepParameters = await prisma.stepParameter.findMany({ orderBy: { name: "asc" } });
  // The frontend might expect the key 'fields', so we can keep the response shape
  res.json({ fields: stepParameters });
});

export default router;