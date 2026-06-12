import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bcrypt from "bcryptjs";

import { prisma } from "./prisma.js";
import { config } from "./config.js";
import { requireAdmin, requireAuth, signToken } from "./auth.js";
import {
  registerSchema,
  loginSchema,
  generateDietSchema,
  updateMeSchema,
  adminSetPasswordSchema,
} from "./validation.js";
import {
  activityFactor,
  buildShoppingListFromDiet,
  calcBmrMifflinStJeor,
  calcMacroTargets,
  calcTdee,
  calcTargetCalories,
  generateDietGenetic,
  isFoodAllowedForUser,
} from "./diet/engine.js";
import { suggestRecipesForMeal } from "./diet/recipes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Copyright M.Henrique

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    if (!data.consentLgpd) {
      return res.status(400).json({ error: "Consentimento LGPD é obrigatório." });
    }

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: "E-mail já cadastrado." });

    const username = String(data.email).split("@")[0].toLowerCase();
    const usernameExists = await prisma.user.findUnique({ where: { username } });
    if (usernameExists) {
      return res.status(409).json({ error: "Usuário já existe. Tente outro e-mail." });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        username,
        passwordHash,
        consentLgpd: data.consentLgpd,
        role: "USER",
        sex: data.sex ?? "other",
        age: data.age,
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        goal: data.goal,
        activityLevel: data.activityLevel ?? "moderate",
        targetWeightKg: data.targetWeightKg ?? null,
        weeklyWeightKg: data.weeklyWeightKg ?? null,
        goalNotes: data.goalNotes ?? "",
        restrictions: data.restrictions ?? "",
        preferences: data.preferences ?? "",
        budgetPerWeek: data.budgetPerWeek,
        prepTimeMinutes: data.prepTimeMinutes,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const token = signToken(user);
    return res.status(201).json({ user, token });
  } catch (e) {
    return res.status(400).json({ error: "Dados inválidos.", details: String(e?.message || e) });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const login = String(data.login).trim();
    const user = login.includes("@")
      ? await prisma.user.findUnique({ where: { email: login } })
      : await prisma.user.findUnique({ where: { username: login.toLowerCase() } });
    if (!user) return res.status(401).json({ error: "Credenciais inválidas." });

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenciais inválidas." });

    const token = signToken(user);
    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, username: user.username },
      token,
    });
  } catch (e) {
    return res.status(400).json({ error: "Dados inválidos.", details: String(e?.message || e) });
  }
});

app.post("/api/generate-diet", requireAuth, async (req, res) => {
  try {
    const data = generateDietSchema.parse(req.body || {});
    const userId = req.auth.sub;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const foods = await prisma.food.findMany();
    if (foods.length < 10) {
      return res.status(400).json({ error: "Base de alimentos insuficiente. Rode o seed." });
    }

    const bmr = calcBmrMifflinStJeor(user);
    const targetCalories = calcTargetCalories({
      bmr,
      goal: user.goal,
      activityLevel: user.activityLevel,
      weeklyWeightKg: user.weeklyWeightKg,
    });
    const macros = calcMacroTargets({ targetCalories });
    const targets = { targetCalories, ...macros };

    const weekStart = data.weekStart ? new Date(data.weekStart) : new Date();
    weekStart.setHours(0, 0, 0, 0);

    const { best, score } = generateDietGenetic({ foods, user, targets });
    const shopping = buildShoppingListFromDiet(best.days);

    // Orçamento mínimo: não cria plano acima do orçamento do usuário
    if (user.budgetPerWeek > 0 && shopping.estCost > user.budgetPerWeek * 1.01) {
      return res.status(400).json({
        error: "Orçamento insuficiente para gerar um plano semanal.",
        details: `Orçamento R$ ${Number(user.budgetPerWeek).toFixed(2)} vs estimativa R$ ${Number(shopping.estCost).toFixed(2)}. Aumente o orçamento ou adicione mais alimentos baratos.`,
      });
    }

    // Cria plano + refeições + shopping list
    const plan = await prisma.dietPlan.create({
      data: {
        userId: user.id,
        weekStart,
        targetCalories,
        targetProteinG: macros.targetProteinG,
        targetCarbsG: macros.targetCarbsG,
        targetFatG: macros.targetFatG,
        estWeeklyCost: shopping.estCost,
      },
    });

    // Persist: Meal + DietMeal
    for (const d of best.days) {
      for (const m of d.meals) {
        const meal = await prisma.meal.create({
          data: {
            name: m.name,
            dayIndex: d.dayIndex,
            mealType: m.mealType,
            caloriesKcal: m.totals.caloriesKcal,
            proteinG: m.totals.proteinG,
            carbsG: m.totals.carbsG,
            fatG: m.totals.fatG,
            explanation: m.explanation,
          },
        });
        await prisma.dietMeal.create({
          data: {
            dietPlanId: plan.id,
            mealId: meal.id,
            itemsJson: JSON.stringify(m.items),
          },
        });
      }
    }

    await prisma.shoppingList.create({
      data: {
        dietPlanId: plan.id,
        itemsJson: JSON.stringify(shopping.items),
        estCost: shopping.estCost,
      },
    });

    return res.status(201).json({
      planId: plan.id,
      fitnessScore: score,
      targets: {
        caloriesKcal: Math.round(targetCalories),
        proteinG: Math.round(macros.targetProteinG),
        carbsG: Math.round(macros.targetCarbsG),
        fatG: Math.round(macros.targetFatG),
      },
      estWeeklyCost: shopping.estCost,
    });
  } catch (e) {
    return res.status(400).json({ error: "Falha ao gerar dieta.", details: String(e?.message || e) });
  }
});

app.get("/api/diet", requireAuth, async (req, res) => {
  const userId = req.auth.sub;
  const plan = await prisma.dietPlan.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      dietMeals: {
        include: { meal: true },
      },
      shoppingList: true,
    },
  });
  if (!plan) return res.status(404).json({ error: "Nenhum plano encontrado." });

  const completionRows = await prisma.mealCompletion.findMany({
    where: { userId, dietMealId: { in: plan.dietMeals.map((dm) => dm.id) } },
    select: { dietMealId: true },
  });
  const completedSet = new Set(completionRows.map((r) => r.dietMealId));

  // Reconstrói estrutura por dia/tipo
  const dayMap = new Map();
  for (const dm of plan.dietMeals) {
    const dayIndex = dm.meal.dayIndex;
    if (!dayMap.has(dayIndex)) dayMap.set(dayIndex, []);
    const items = JSON.parse(dm.itemsJson || "[]");
    dayMap.get(dayIndex).push({
      id: dm.meal.id,
      dietMealId: dm.id,
      mealType: dm.meal.mealType,
      name: dm.meal.name,
      caloriesKcal: dm.meal.caloriesKcal,
      proteinG: dm.meal.proteinG,
      carbsG: dm.meal.carbsG,
      fatG: dm.meal.fatG,
      explanation: dm.meal.explanation,
      items,
      recipeIdeas: suggestRecipesForMeal({ mealType: dm.meal.mealType, items }),
      completed: completedSet.has(dm.id),
    });
  }

  const days = Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    meals: (dayMap.get(i) || []).sort((a, b) => a.mealType.localeCompare(b.mealType)),
  }));

  return res.json({
    plan: {
      id: plan.id,
      weekStart: plan.weekStart,
      targets: {
        caloriesKcal: Math.round(plan.targetCalories),
        proteinG: Math.round(plan.targetProteinG),
        carbsG: Math.round(plan.targetCarbsG),
        fatG: Math.round(plan.targetFatG),
      },
      estWeeklyCost: plan.estWeeklyCost,
      days,
    },
  });
});

// Marcar/desmarcar refeição como concluída
app.post("/api/diet-meals/:id/toggle-complete", requireAuth, async (req, res) => {
  const userId = req.auth.sub;
  const dietMealId = String(req.params.id);

  const dm = await prisma.dietMeal.findUnique({
    where: { id: dietMealId },
    include: { dietPlan: true, meal: true },
  });
  if (!dm) return res.status(404).json({ error: "Refeição não encontrada." });
  if (dm.dietPlan.userId !== userId) return res.status(403).json({ error: "Permissão insuficiente." });

  const existing = await prisma.mealCompletion.findUnique({ where: { dietMealId } });
  if (existing) {
    await prisma.mealCompletion.delete({ where: { dietMealId } });
    return res.json({ dietMealId, completed: false });
  }

  await prisma.mealCompletion.create({ data: { userId, dietMealId } });
  return res.json({ dietMealId, completed: true });
});

app.get("/api/shopping-list", requireAuth, async (req, res) => {
  const userId = req.auth.sub;
  const plan = await prisma.dietPlan.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { shoppingList: true },
  });
  if (!plan?.shoppingList) return res.status(404).json({ error: "Nenhuma lista encontrada." });

  return res.json({
    shoppingList: {
      dietPlanId: plan.id,
      estCost: plan.shoppingList.estCost,
      items: JSON.parse(plan.shoppingList.itemsJson || "[]"),
    },
  });
});

app.get("/api/foods", requireAuth, async (req, res) => {
  const foods = await prisma.food.findMany({ orderBy: { name: "asc" } });
  res.json({ foods });
});

// Dados do usuário logado (perfil)
app.get("/api/me", requireAuth, async (req, res) => {
  const userId = req.auth.sub;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      consentLgpd: true,
      sex: true,
      age: true,
      weightKg: true,
      heightCm: true,
      goal: true,
      restrictions: true,
      preferences: true,
      budgetPerWeek: true,
      prepTimeMinutes: true,
      activityLevel: true,
      targetWeightKg: true,
      weeklyWeightKg: true,
      goalNotes: true,
    },
  });

  if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

  const bmr = calcBmrMifflinStJeor(user);
  const tdee = calcTdee({ bmr, activityLevel: user.activityLevel });
  const estCalories = calcTargetCalories({
    bmr,
    goal: user.goal,
    activityLevel: user.activityLevel,
    weeklyWeightKg: user.weeklyWeightKg,
  });
  const estMacros = calcMacroTargets({ targetCalories: estCalories });
  const af = activityFactor(user.activityLevel);

  return res.json({
    user,
    nutritionPreview: {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      activityFactor: Math.round(af * 1000) / 1000,
      estimatedDailyCalories: Math.round(estCalories),
      estimatedProteinG: Math.round(estMacros.targetProteinG),
      estimatedCarbsG: Math.round(estMacros.targetCarbsG),
      estimatedFatG: Math.round(estMacros.targetFatG),
    },
  });
});

app.patch("/api/me", requireAuth, async (req, res) => {
  try {
    const data = updateMeSchema.parse(req.body || {});
    const userId = req.auth.sub;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.sex !== undefined ? { sex: data.sex } : {}),
        ...(data.age !== undefined ? { age: data.age } : {}),
        ...(data.weightKg !== undefined ? { weightKg: data.weightKg } : {}),
        ...(data.heightCm !== undefined ? { heightCm: data.heightCm } : {}),
        ...(data.goal !== undefined ? { goal: data.goal } : {}),
        ...(data.activityLevel !== undefined ? { activityLevel: data.activityLevel } : {}),
        ...(data.targetWeightKg !== undefined ? { targetWeightKg: data.targetWeightKg } : {}),
        ...(data.weeklyWeightKg !== undefined ? { weeklyWeightKg: data.weeklyWeightKg } : {}),
        ...(data.goalNotes !== undefined ? { goalNotes: data.goalNotes } : {}),
        ...(data.restrictions !== undefined ? { restrictions: data.restrictions } : {}),
        ...(data.preferences !== undefined ? { preferences: data.preferences } : {}),
        ...(data.budgetPerWeek !== undefined ? { budgetPerWeek: data.budgetPerWeek } : {}),
        ...(data.prepTimeMinutes !== undefined ? { prepTimeMinutes: data.prepTimeMinutes } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        consentLgpd: true,
        sex: true,
        age: true,
        weightKg: true,
        heightCm: true,
        goal: true,
        restrictions: true,
        preferences: true,
        budgetPerWeek: true,
        prepTimeMinutes: true,
        activityLevel: true,
        targetWeightKg: true,
        weeklyWeightKg: true,
        goalNotes: true,
      },
    });

    const bmr = calcBmrMifflinStJeor(updated);
    const tdee = calcTdee({ bmr, activityLevel: updated.activityLevel });
    const estCalories = calcTargetCalories({
      bmr,
      goal: updated.goal,
      activityLevel: updated.activityLevel,
      weeklyWeightKg: updated.weeklyWeightKg,
    });
    const estMacros = calcMacroTargets({ targetCalories: estCalories });
    const af = activityFactor(updated.activityLevel);

    return res.json({
      user: updated,
      nutritionPreview: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        activityFactor: Math.round(af * 1000) / 1000,
        estimatedDailyCalories: Math.round(estCalories),
        estimatedProteinG: Math.round(estMacros.targetProteinG),
        estimatedCarbsG: Math.round(estMacros.targetCarbsG),
        estimatedFatG: Math.round(estMacros.targetFatG),
      },
    });
  } catch (e) {
    return res.status(400).json({ error: "Dados inválidos.", details: String(e?.message || e) });
  }
});

// Admin: painel (estatísticas)
app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
  const [users, foods, plans] = await Promise.all([
    prisma.user.count(),
    prisma.food.count(),
    prisma.dietPlan.count(),
  ]);
  return res.json({ stats: { users, foods, dietPlans: plans } });
});

// Admin: inspeção somente leitura do SQLite (TCC) — sem SQL arbitrário, sem passwordHash
app.get("/api/admin/database-inspect", requireAuth, requireAdmin, async (req, res) => {
  function parseJsonField(json) {
    const str = String(json || "");
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }

  const dbUrl = process.env.DATABASE_URL || "";
  let sqliteFile = null;
  if (dbUrl.toLowerCase().startsWith("file:")) {
    const raw = dbUrl.replace(/^file:/i, "").replace(/^\/+/, "");
    sqliteFile = raw.split(/[/\\]/).pop() || raw;
  }

  const [
    userCount,
    foodCount,
    mealCount,
    dietPlanCount,
    dietMealCount,
    mealCompletionCount,
    shoppingListCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.food.count(),
    prisma.meal.count(),
    prisma.dietPlan.count(),
    prisma.dietMeal.count(),
    prisma.mealCompletion.count(),
    prisma.shoppingList.count(),
  ]);

  const [users, foods, meals, dietPlans, dietMeals, mealCompletions, shoppingLists] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        name: true,
        email: true,
        username: true,
        consentLgpd: true,
        role: true,
        sex: true,
        age: true,
        weightKg: true,
        heightCm: true,
        goal: true,
        activityLevel: true,
        targetWeightKg: true,
        weeklyWeightKg: true,
        goalNotes: true,
        restrictions: true,
        preferences: true,
        budgetPerWeek: true,
        prepTimeMinutes: true,
      },
    }),
    prisma.food.findMany({ orderBy: { name: "asc" } }),
    prisma.meal.findMany({ orderBy: [{ dayIndex: "asc" }, { mealType: "asc" }] }),
    prisma.dietPlan.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.dietMeal.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, createdAt: true, dietPlanId: true, mealId: true, itemsJson: true },
    }),
    prisma.mealCompletion.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.shoppingList.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, createdAt: true, dietPlanId: true, estCost: true, itemsJson: true },
    }),
  ]);

  return res.json({
    meta: {
      engine: "sqlite",
      sqliteFile,
      note:
        "Somente leitura. passwordHash não é enviado. Esta resposta contém todos os registros de cada tabela (pode ser grande).",
    },
    counts: {
      User: userCount,
      Food: foodCount,
      Meal: mealCount,
      DietPlan: dietPlanCount,
      DietMeal: dietMealCount,
      MealCompletion: mealCompletionCount,
      ShoppingList: shoppingListCount,
    },
    tables: {
      users,
      foods,
      meals,
      dietPlans,
      dietMeals: dietMeals.map((dm) => ({
        id: dm.id,
        createdAt: dm.createdAt,
        dietPlanId: dm.dietPlanId,
        mealId: dm.mealId,
        items: parseJsonField(dm.itemsJson),
      })),
      mealCompletions,
      shoppingLists: shoppingLists.map((sl) => ({
        id: sl.id,
        createdAt: sl.createdAt,
        dietPlanId: sl.dietPlanId,
        estCost: sl.estCost,
        items: parseJsonField(sl.itemsJson),
      })),
    },
  });
});

// Admin: gestão de usuários
app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      name: true,
      email: true,
      username: true,
      role: true,
      consentLgpd: true,
      goal: true,
    },
  });
  return res.json({ users });
});

app.patch("/api/admin/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const { role } = req.body || {};
  if (role !== "ADMIN" && role !== "USER") {
    return res.status(400).json({ error: "Role inválida. Use ADMIN ou USER." });
  }
  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, username: true, role: true },
  });
  return res.json({ user });
});

app.patch("/api/admin/users/:id/password", requireAuth, requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const parsed = adminSetPasswordSchema.safeParse(req.body || {});
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.password?.[0] || "Senha inválida.";
    return res.status(400).json({ error: msg });
  }
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return res.status(404).json({ error: "Usuário não encontrado." });
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });
  return res.json({ ok: true, message: "Senha atualizada." });
});

app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  // evita apagar a si mesmo
  if (req.auth.sub === id) return res.status(400).json({ error: "Você não pode excluir seu próprio usuário." });
  await prisma.user.delete({ where: { id } });
  return res.status(204).end();
});

// Admin: CRUD de alimentos (gestão da base para o algoritmo)
app.get("/api/admin/foods", requireAuth, requireAdmin, async (req, res) => {
  const foods = await prisma.food.findMany({ orderBy: { name: "asc" } });
  res.json({ foods });
});

app.post("/api/admin/foods", requireAuth, requireAdmin, async (req, res) => {
  const body = req.body || {};
  const required = ["name", "category", "caloriesKcal", "proteinG", "carbsG", "fatG", "costPer100g", "unit", "defaultQty", "tags"];
  for (const k of required) {
    if (body[k] === undefined || body[k] === null || body[k] === "") {
      return res.status(400).json({ error: `Campo obrigatório: ${k}` });
    }
  }

  const food = await prisma.food.create({
    data: {
      name: String(body.name),
      category: String(body.category),
      caloriesKcal: Number(body.caloriesKcal),
      proteinG: Number(body.proteinG),
      carbsG: Number(body.carbsG),
      fatG: Number(body.fatG),
      costPer100g: Number(body.costPer100g),
      unit: String(body.unit),
      defaultQty: Number(body.defaultQty),
      tags: String(body.tags || ""),
    },
  });
  res.status(201).json({ food });
});

app.patch("/api/admin/foods/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  const body = req.body || {};
  const food = await prisma.food.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: String(body.name) } : {}),
      ...(body.category !== undefined ? { category: String(body.category) } : {}),
      ...(body.caloriesKcal !== undefined ? { caloriesKcal: Number(body.caloriesKcal) } : {}),
      ...(body.proteinG !== undefined ? { proteinG: Number(body.proteinG) } : {}),
      ...(body.carbsG !== undefined ? { carbsG: Number(body.carbsG) } : {}),
      ...(body.fatG !== undefined ? { fatG: Number(body.fatG) } : {}),
      ...(body.costPer100g !== undefined ? { costPer100g: Number(body.costPer100g) } : {}),
      ...(body.unit !== undefined ? { unit: String(body.unit) } : {}),
      ...(body.defaultQty !== undefined ? { defaultQty: Number(body.defaultQty) } : {}),
      ...(body.tags !== undefined ? { tags: String(body.tags) } : {}),
    },
  });
  res.json({ food });
});

app.delete("/api/admin/foods/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  await prisma.food.delete({ where: { id } });
  res.status(204).end();
});

app.post("/api/substitute", requireAuth, async (req, res) => {
  // Substituição simples: sugere equivalentes por categoria e macros aproximados
  const { foodId } = req.body || {};
  if (!foodId) return res.status(400).json({ error: "foodId é obrigatório." });
  const base = await prisma.food.findUnique({ where: { id: String(foodId) } });
  if (!base) return res.status(404).json({ error: "Alimento não encontrado." });

  const user = await prisma.user.findUnique({ where: { id: req.auth.sub } });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

  const candidates = await prisma.food.findMany({
    where: { category: base.category },
  });

  const scored = candidates
    .filter((c) => c.id !== base.id)
    .filter((c) => isFoodAllowedForUser(user, c))
    .map((c) => {
      const diff =
        Math.abs(c.caloriesKcal - base.caloriesKcal) +
        Math.abs(c.proteinG - base.proteinG) * 3 +
        Math.abs(c.carbsG - base.carbsG) * 2 +
        Math.abs(c.fatG - base.fatG) * 3;
      return { food: c, diff };
    })
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 5)
    .map((x) => x.food);

  return res.json({ base, substitutes: scored });
});

app.use((req, res) => res.status(404).json({ error: "Rota não encontrada." }));

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API rodando em http://localhost:${config.port}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    // eslint-disable-next-line no-console
    console.error(
      `Porta ${config.port} já está em uso. Altere PORT no backend/.env (ex.: 3100) ou encerre o outro processo.`,
    );
    process.exit(1);
  }
  throw err;
});

