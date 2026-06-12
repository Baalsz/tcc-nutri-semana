function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function calcBmrMifflinStJeor({ sex, age, weightKg, heightCm }) {
  // Mifflin-St Jeor:
  // male: 10w + 6.25h - 5a + 5
  // female: 10w + 6.25h - 5a - 161
  // other: média dos dois (aproximação didática)
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return base - 78; // média aproximada
}

/** Fatores de atividade física (aprox. Harris-Benedict / uso clínico didático). */
export function activityFactor(activityLevel) {
  const key = String(activityLevel || "moderate").toLowerCase();
  const map = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return map[key] ?? map.moderate;
}

export function calcTdee({ bmr, activityLevel }) {
  return bmr * activityFactor(activityLevel);
}

/**
 * Meta calórica diária: TDEE + ajuste por objetivo.
 * Se weeklyWeightKg > 0, usa regra ~7700 kcal/kg de tecido (aproximação acadêmica).
 */
export function calcTargetCalories({ bmr, goal, activityLevel, weeklyWeightKg }) {
  const tdee = calcTdee({ bmr, activityLevel });
  let delta = 0;
  const wk = weeklyWeightKg == null || Number.isNaN(Number(weeklyWeightKg)) ? null : Number(weeklyWeightKg);

  if (goal === "maintain") {
    delta = 0;
  } else if (wk != null && wk > 0) {
    const kcalPerDay = (wk * 7700) / 7;
    delta = goal === "lose" ? -kcalPerDay : goal === "gain" ? kcalPerDay : 0;
  } else {
    delta = goal === "lose" ? -400 : goal === "gain" ? 350 : 0;
  }

  return clamp(tdee + delta, 1200, 4200);
}

export function calcMacroTargets({ targetCalories }) {
  // Distribuição simples: 25% proteína, 50% carbo, 25% gordura
  const proteinKcal = targetCalories * 0.25;
  const carbsKcal = targetCalories * 0.5;
  const fatKcal = targetCalories * 0.25;
  return {
    targetProteinG: proteinKcal / 4,
    targetCarbsG: carbsKcal / 4,
    targetFatG: fatKcal / 9,
  };
}

function parseCsvLower(s) {
  return String(s || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function foodTagSet(foodTags) {
  return new Set(parseCsvLower(foodTags));
}

function matchesPreference(foodName, prefs) {
  const p = parseCsvLower(prefs);
  if (p.length === 0) return 0;
  const n = foodName.toLowerCase();
  return p.some((x) => n.includes(x)) ? 1 : 0;
}

function normalizeRestrictions(raw) {
  const r = new Set(parseCsvLower(raw));

  // “atalhos” comuns que o usuário digita
  // lactose/gluten significam evitar alimentos que CONTÊM lactose/glúten
  if (r.has("lactose")) r.add("contains_lactose");
  if (r.has("gluten")) r.add("contains_gluten");

  // Opcional: se o usuário digitar "sem lactose"/"sem gluten"
  if (r.has("sem lactose")) r.add("contains_lactose");
  if (r.has("sem gluten")) r.add("contains_gluten");

  return Array.from(r);
}

export function isFoodAllowedForUser(user, food) {
  const restrictions = normalizeRestrictions(user?.restrictions);
  const tags = foodTagSet(food?.tags);

  // Regras inclusivas:
  // vegan => só pode itens taggeados como vegan
  // vegetarian => pode vegetarian ou vegan
  const isVegan = restrictions.includes("vegan") || restrictions.includes("vegano");
  const isVegetarian =
    restrictions.includes("vegetarian") ||
    restrictions.includes("vegetariano") ||
    restrictions.includes("vegetariana");

  if (isVegan) {
    if (!tags.has("vegan")) return false;
  } else if (isVegetarian) {
    if (!(tags.has("vegetarian") || tags.has("vegan"))) return false;
  }

  // Regras exclusivas por tags “proibidas”
  // (aqui entram "contains_gluten", "contains_lactose", etc.)
  const forbidden = new Set([
    "contains_gluten",
    "contains_lactose",
    "nuts",
    "shellfish",
  ]);

  for (const r of restrictions) {
    if (forbidden.has(r) && tags.has(r)) return false;
  }

  return true;
}

function estItemMacros(food, qtyMultiplier) {
  // base: food macros por "defaultQty"
  return {
    caloriesKcal: food.caloriesKcal * qtyMultiplier,
    proteinG: food.proteinG * qtyMultiplier,
    carbsG: food.carbsG * qtyMultiplier,
    fatG: food.fatG * qtyMultiplier,
    cost: food.costPer100g * (food.defaultQty / 100) * qtyMultiplier,
    qty: food.defaultQty * qtyMultiplier,
    unit: food.unit,
  };
}

function sumMacros(items) {
  return items.reduce(
    (acc, it) => {
      acc.caloriesKcal += it.caloriesKcal;
      acc.proteinG += it.proteinG;
      acc.carbsG += it.carbsG;
      acc.fatG += it.fatG;
      acc.cost += it.cost;
      return acc;
    },
    { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, cost: 0 },
  );
}

function mealTemplate(mealType) {
  if (mealType === "breakfast") return { targetShare: 0.22, label: "Café da manhã" };
  if (mealType === "lunch") return { targetShare: 0.32, label: "Almoço" };
  if (mealType === "dinner") return { targetShare: 0.28, label: "Jantar" };
  return { targetShare: 0.18, label: "Lanche" };
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uniqueCount(arr) {
  return new Set(arr).size;
}

function makeCandidatePlan({ foods, user, targets, rng = Math.random }) {
  const allowedFoods = foods.filter((f) => isFoodAllowedForUser(user, f));
  const byCat = new Map();
  for (const f of allowedFoods) {
    if (!byCat.has(f.category)) byCat.set(f.category, []);
    byCat.get(f.category).push(f);
  }

  function pickFrom(cat) {
    const list = byCat.get(cat) || [];
    if (list.length === 0) return null;
    return list[Math.floor(rng() * list.length)];
  }

  const days = [];
  const usedFoodIds = [];

  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const meals = [];
    for (const mealType of mealTypes) {
      const tpl = mealTemplate(mealType);
      const mealTargetKcal = targets.targetCalories * tpl.targetShare;

      // Montagem simples por categorias (didática):
      const protein = pickFrom("protein") || pickFrom("dairy");
      const carb = pickFrom("carb") || pickFrom("fruit");
      const veg = pickFrom("veg") || pickFrom("fruit");
      const fat = pickFrom("fat") || pickFrom("dairy");

      const picked = [protein, carb, veg, fat].filter(Boolean);
      const items = [];

      // Ajuste de quantidade: aproxima o alvo calórico da refeição
      const baseItems = picked.slice(0, 3 + (mealType === "snack" ? 0 : 1));
      for (const f of baseItems) {
        const prefBoost = matchesPreference(f.name, user.preferences);
        const multBase = mealType === "snack" ? 0.75 : 1;
        const mult = clamp(multBase + prefBoost * 0.15, 0.6, 1.35);
        const it = estItemMacros(f, mult);
        items.push({
          foodId: f.id,
          name: f.name,
          qty: Number(it.qty.toFixed(0)),
          unit: it.unit,
          caloriesKcal: Number(it.caloriesKcal.toFixed(0)),
          proteinG: Number(it.proteinG.toFixed(1)),
          carbsG: Number(it.carbsG.toFixed(1)),
          fatG: Number(it.fatG.toFixed(1)),
          estCost: Number(it.cost.toFixed(2)),
        });
        usedFoodIds.push(f.id);
      }

      const totals = sumMacros(
        items.map((i) => ({
          caloriesKcal: i.caloriesKcal,
          proteinG: i.proteinG,
          carbsG: i.carbsG,
          fatG: i.fatG,
          cost: i.estCost,
        })),
      );

      const explanation = [
        `Meta diária ≈ ${Math.round(targets.targetCalories)} kcal; esta refeição mira ~${Math.round(mealTargetKcal)} kcal.`,
        `Restrições respeitadas: ${user.restrictions?.trim() ? user.restrictions : "nenhuma informada"}.`,
        user.preferences?.trim()
          ? `Preferências consideradas: ${user.preferences}.`
          : "Preferências não informadas (seleção focada em equilíbrio).",
        `Critérios: equilíbrio de macros, custo estimado e variedade na semana.`,
      ].join(" ");

      meals.push({
        mealType,
        name: tpl.label,
        items,
        totals: {
          caloriesKcal: Math.round(totals.caloriesKcal),
          proteinG: Number(totals.proteinG.toFixed(1)),
          carbsG: Number(totals.carbsG.toFixed(1)),
          fatG: Number(totals.fatG.toFixed(1)),
          estCost: Number(totals.cost.toFixed(2)),
        },
        explanation,
      });
    }
    days.push({ dayIndex, meals });
  }

  const weeklyCost = days
    .flatMap((d) => d.meals)
    .reduce((acc, m) => acc + m.totals.estCost, 0);

  const avgDailyCalories =
    days.reduce((acc, d) => acc + d.meals.reduce((a, m) => a + m.totals.caloriesKcal, 0), 0) / 7;

  const variety = uniqueCount(usedFoodIds);

  return {
    days,
    metrics: {
      weeklyCost,
      avgDailyCalories,
      variety,
    },
  };
}

function fitnessScore({ candidate, targets, user }) {
  // Fitness menor é melhor (erro/penalidade)
  const calErr = Math.abs(candidate.metrics.avgDailyCalories - targets.targetCalories);
  const budget = Number(user.budgetPerWeek || 0);
  const over = Math.max(0, candidate.metrics.weeklyCost - budget);
  // Se estourou o orçamento, aplica penalidade MUITO alta (restrição dura)
  const hardBudgetPenalty = budget > 0 && over > budget * 0.01 ? 1_000_000 + over * 1000 : 0;
  const costPenalty = over * 1.25;
  const varietyPenalty = Math.max(0, 35 - candidate.metrics.variety) * 12; // quer variedade mínima
  return calErr * 1.0 + costPenalty + varietyPenalty + hardBudgetPenalty;
}

function crossover(a, b) {
  // Mistura dias: metade de A + metade de B
  const cut = 3 + Math.floor(Math.random() * 2);
  const days = [...a.days.slice(0, cut), ...b.days.slice(cut)];
  const weeklyCost = days
    .flatMap((d) => d.meals)
    .reduce((acc, m) => acc + m.totals.estCost, 0);
  const avgDailyCalories =
    days.reduce((acc, d) => acc + d.meals.reduce((x, m) => x + m.totals.caloriesKcal, 0), 0) / 7;
  const used = days.flatMap((d) => d.meals.flatMap((m) => m.items.map((i) => i.foodId)));
  return {
    days,
    metrics: {
      weeklyCost,
      avgDailyCalories,
      variety: uniqueCount(used),
    },
  };
}

export function generateDietGenetic({ foods, user, targets }) {
  // Parâmetros pequenos para rodar rápido (TCC)
  const POP = 18;
  const GENS = 22;
  const ELITE = 5;
  const MUT_RATE = 0.18;

  let population = Array.from({ length: POP }, () =>
    makeCandidatePlan({ foods, user, targets }),
  );

  for (let g = 0; g < GENS; g++) {
    const scored = population
      .map((c) => ({ c, score: fitnessScore({ candidate: c, targets, user }) }))
      .sort((x, y) => x.score - y.score);

    const elites = scored.slice(0, ELITE).map((x) => x.c);

    const next = [...elites];
    while (next.length < POP) {
      const parentA = pickRandom(elites);
      const parentB = pickRandom(elites);
      let child = crossover(parentA, parentB);

      // Mutação: substitui 1 dia aleatório por um novo dia (variação)
      if (Math.random() < MUT_RATE) {
        const mutated = makeCandidatePlan({ foods, user, targets });
        const dayIdx = Math.floor(Math.random() * 7);
        child.days[dayIdx] = mutated.days[dayIdx];
      }

      // Recalcula métricas
      const weeklyCost = child.days
        .flatMap((d) => d.meals)
        .reduce((acc, m) => acc + m.totals.estCost, 0);
      const avgDailyCalories =
        child.days.reduce(
          (acc, d) => acc + d.meals.reduce((x, m) => x + m.totals.caloriesKcal, 0),
          0,
        ) / 7;
      const used = child.days.flatMap((d) => d.meals.flatMap((m) => m.items.map((i) => i.foodId)));
      child.metrics = { weeklyCost, avgDailyCalories, variety: uniqueCount(used) };

      next.push(child);
    }

    population = next;
  }

  const best = population
    .map((c) => ({ c, score: fitnessScore({ candidate: c, targets, user }) }))
    .sort((x, y) => x.score - y.score)[0];

  return { best: best.c, score: best.score };
}

export function buildShoppingListFromDiet(days) {
  const map = new Map(); // key: foodId -> aggregated
  for (const d of days) {
    for (const m of d.meals) {
      for (const it of m.items) {
        const key = it.foodId;
        const prev = map.get(key);
        if (!prev) {
          map.set(key, { ...it, qty: it.qty, estCost: it.estCost });
        } else {
          map.set(key, {
            ...prev,
            qty: prev.qty + it.qty,
            estCost: Number((prev.estCost + it.estCost).toFixed(2)),
          });
        }
      }
    }
  }

  const items = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  const estCost = Number(items.reduce((acc, it) => acc + it.estCost, 0).toFixed(2));
  return { items, estCost };
}

