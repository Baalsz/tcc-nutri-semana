import { z } from "zod";

const activityLevelEnum = z.enum(["sedentary", "light", "moderate", "active", "very_active"]);

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  consentLgpd: z.boolean(),

  sex: z.enum(["male", "female", "other"]).optional(),
  age: z.number().int().min(10).max(120),
  weightKg: z.number().min(20).max(400),
  heightCm: z.number().min(80).max(250),

  goal: z.enum(["lose", "maintain", "gain"]),
  activityLevel: activityLevelEnum.default("moderate"),
  targetWeightKg: z.number().min(35).max(250).optional().nullable(),
  weeklyWeightKg: z.number().min(0.05).max(1.5).optional().nullable(),
  goalNotes: z.string().max(400).optional().default(""),

  restrictions: z.string().default(""),
  preferences: z.string().default(""),
  budgetPerWeek: z.number().min(0),
  prepTimeMinutes: z.number().int().min(5).max(240),
});

export const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export const generateDietSchema = z.object({
  weekStart: z.string().optional(), // ISO
});

/** Admin redefine senha de qualquer usuário (mín. 6 caracteres, igual ao cadastro). */
export const adminSetPasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export const updateMeSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  sex: z.enum(["male", "female", "other"]).optional(),
  age: z.coerce.number().int().min(10).max(120).optional(),
  weightKg: z.coerce.number().min(20).max(400).optional(),
  heightCm: z.coerce.number().min(80).max(250).optional(),
  goal: z.enum(["lose", "maintain", "gain"]).optional(),
  activityLevel: activityLevelEnum.optional(),
  targetWeightKg: z.union([z.coerce.number().min(35).max(250), z.null()]).optional(),
  weeklyWeightKg: z.union([z.coerce.number().min(0.05).max(1.5), z.null()]).optional(),
  goalNotes: z.string().max(400).optional(),
  restrictions: z.string().max(500).optional(),
  preferences: z.string().max(500).optional(),
  budgetPerWeek: z.coerce.number().min(0).optional(),
  prepTimeMinutes: z.coerce.number().int().min(5).max(240).optional(),
});

