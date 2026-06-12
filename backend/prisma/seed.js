import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { foodsCatalog } from "./foods.catalog.js";

const prisma = new PrismaClient();

const foods = [
  // Proteínas
  {
    name: "Peito de frango grelhado",
    category: "protein",
    caloriesKcal: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    costPer100g: 3.2,
    unit: "g",
    defaultQty: 120,
    tags: "animal,meat,gluten_free,lactose_free",
  },
  {
    name: "Ovo cozido",
    category: "protein",
    caloriesKcal: 155,
    proteinG: 13,
    carbsG: 1.1,
    fatG: 11,
    costPer100g: 2.4,
    unit: "g",
    defaultQty: 100,
    tags: "animal,egg,vegetarian,gluten_free",
  },
  {
    name: "Tofu",
    category: "protein",
    caloriesKcal: 144,
    proteinG: 15.7,
    carbsG: 3.9,
    fatG: 8.7,
    costPer100g: 4.0,
    unit: "g",
    defaultQty: 120,
    tags: "vegetarian,vegan,gluten_free,lactose_free",
  },
  {
    name: "Atum em água",
    category: "protein",
    caloriesKcal: 116,
    proteinG: 26,
    carbsG: 0,
    fatG: 0.8,
    costPer100g: 6.0,
    unit: "g",
    defaultQty: 120,
    tags: "animal,fish,gluten_free,lactose_free",
  },

  // Carboidratos
  {
    name: "Arroz integral cozido",
    category: "carb",
    caloriesKcal: 124,
    proteinG: 2.6,
    carbsG: 25.8,
    fatG: 1.0,
    costPer100g: 0.6,
    unit: "g",
    defaultQty: 150,
    tags: "vegetarian,vegan,gluten_free,lactose_free",
  },
  {
    name: "Batata doce cozida",
    category: "carb",
    caloriesKcal: 86,
    proteinG: 1.6,
    carbsG: 20.1,
    fatG: 0.1,
    costPer100g: 0.9,
    unit: "g",
    defaultQty: 180,
    tags: "vegetarian,vegan,gluten_free,lactose_free",
  },
  {
    name: "Aveia",
    category: "carb",
    caloriesKcal: 389,
    proteinG: 16.9,
    carbsG: 66.3,
    fatG: 6.9,
    costPer100g: 1.1,
    unit: "g",
    defaultQty: 50,
    tags: "vegetarian,vegan,lactose_free",
  },
  {
    name: "Pão integral",
    category: "carb",
    caloriesKcal: 247,
    proteinG: 13,
    carbsG: 41,
    fatG: 4.2,
    costPer100g: 1.6,
    unit: "g",
    defaultQty: 60,
    tags: "contains_gluten,vegetarian,vegan,lactose_free",
  },

  // Gorduras
  {
    name: "Azeite de oliva",
    category: "fat",
    caloriesKcal: 884,
    proteinG: 0,
    carbsG: 0,
    fatG: 100,
    costPer100g: 5.5,
    unit: "g",
    defaultQty: 10,
    tags: "vegetarian,vegan,gluten_free,lactose_free",
  },
  {
    name: "Pasta de amendoim",
    category: "fat",
    caloriesKcal: 588,
    proteinG: 25,
    carbsG: 20,
    fatG: 50,
    costPer100g: 3.9,
    unit: "g",
    defaultQty: 20,
    tags: "vegetarian,vegan,gluten_free,lactose_free",
  },
  {
    name: "Abacate",
    category: "fat",
    caloriesKcal: 160,
    proteinG: 2,
    carbsG: 8.5,
    fatG: 14.7,
    costPer100g: 2.2,
    unit: "g",
    defaultQty: 80,
    tags: "vegetarian,vegan,gluten_free,lactose_free",
  },

  // Vegetais
  {
    name: "Brócolis",
    category: "veg",
    caloriesKcal: 34,
    proteinG: 2.8,
    carbsG: 6.6,
    fatG: 0.4,
    costPer100g: 1.3,
    unit: "g",
    defaultQty: 120,
    tags: "vegetarian,vegan,gluten_free,lactose_free",
  },
  {
    name: "Salada (alface e tomate)",
    category: "veg",
    caloriesKcal: 18,
    proteinG: 1.2,
    carbsG: 3.8,
    fatG: 0.2,
    costPer100g: 1.0,
    unit: "g",
    defaultQty: 150,
    tags: "vegetarian,vegan,gluten_free,lactose_free",
  },

  // Frutas
  {
    name: "Banana",
    category: "fruit",
    caloriesKcal: 89,
    proteinG: 1.1,
    carbsG: 22.8,
    fatG: 0.3,
    costPer100g: 0.9,
    unit: "g",
    defaultQty: 120,
    tags: "vegetarian,vegan,gluten_free,lactose_free",
  },
  {
    name: "Maçã",
    category: "fruit",
    caloriesKcal: 52,
    proteinG: 0.3,
    carbsG: 13.8,
    fatG: 0.2,
    costPer100g: 1.2,
    unit: "g",
    defaultQty: 150,
    tags: "vegetarian,vegan,gluten_free,lactose_free",
  },

  // Laticínios
  {
    name: "Iogurte natural",
    category: "dairy",
    caloriesKcal: 61,
    proteinG: 3.5,
    carbsG: 4.7,
    fatG: 3.3,
    costPer100g: 1.7,
    unit: "g",
    defaultQty: 170,
    tags: "animal,dairy,vegetarian,contains_lactose,gluten_free",
  },
  {
    name: "Queijo branco",
    category: "dairy",
    caloriesKcal: 264,
    proteinG: 18,
    carbsG: 3,
    fatG: 21,
    costPer100g: 4.8,
    unit: "g",
    defaultQty: 60,
    tags: "animal,dairy,vegetarian,contains_lactose,gluten_free",
  }
];

async function main() {
  // 1) Admin padrão (para testes acadêmicos)
  // Login: admin (ou admin@fepi.edu.br) | Senha: Admin123!
  const adminEmail = "admin@fepi.edu.br";
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  // Se alguém já pegou o username "admin", libera para o admin oficial
  const adminUsernameOwner = await prisma.user.findUnique({ where: { username: "admin" } });
  if (adminUsernameOwner && adminUsernameOwner.email !== adminEmail) {
    const base = String(adminUsernameOwner.email || "user").split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
    let candidate = base || "user";
    let i = 1;
    while (true) {
      const exists = await prisma.user.findUnique({ where: { username: candidate } });
      if (!exists) break;
      i += 1;
      candidate = `${base || "user"}${i}`;
    }
    await prisma.user.update({
      where: { email: adminUsernameOwner.email },
      data: { username: candidate },
    });
    console.log(`Seed: username 'admin' estava em ${adminUsernameOwner.email}, renomeado para '${candidate}'.`);
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: "Administrador",
      email: adminEmail,
      username: "admin",
      passwordHash,
      consentLgpd: true,
      role: "ADMIN",
      sex: "other",
      age: 25,
      weightKg: 75,
      heightCm: 175,
      goal: "maintain",
      restrictions: "",
      preferences: "",
      budgetPerWeek: 250,
      prepTimeMinutes: 30,
    },
    update: {
      username: "admin",
      passwordHash,
      role: "ADMIN",
      consentLgpd: true,
    },
  });
  console.log("Seed: admin garantido (admin / admin@fepi.edu.br • Admin123!).");

  // 2) Alimentos base
  let created = 0;
  let updated = 0;
  for (const f of foodsCatalog) {
    const existing = await prisma.food.findFirst({ where: { name: f.name } });
    if (!existing) {
      await prisma.food.create({ data: f });
      created++;
    } else {
      await prisma.food.update({
        where: { id: existing.id },
        data: {
          category: f.category,
          caloriesKcal: f.caloriesKcal,
          proteinG: f.proteinG,
          carbsG: f.carbsG,
          fatG: f.fatG,
          costPer100g: f.costPer100g,
          unit: f.unit,
          defaultQty: f.defaultQty,
          tags: f.tags,
        },
      });
      updated++;
    }
  }
  console.log(`Seed: alimentos criados=${created}, atualizados=${updated}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

