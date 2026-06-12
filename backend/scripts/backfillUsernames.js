import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^\.+/, "")
    .slice(0, 24);
}

async function uniqueUsername(base) {
  let u = base || "user";
  let i = 0;
  // tenta "base", "base2", "base3"...
  while (true) {
    const candidate = i === 0 ? u : `${u}${i + 1}`;
    const exists = await prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
    i++;
  }
}

async function main() {
  const users = await prisma.user.findMany({
    where: { username: null },
    select: { id: true, email: true, name: true },
  });

  let updated = 0;
  for (const u of users) {
    const local = String(u.email || "").split("@")[0];
    const base = slugify(local) || slugify(u.name) || "user";
    const username = await uniqueUsername(base);
    await prisma.user.update({ where: { id: u.id }, data: { username } });
    updated++;
  }

  console.log(`Backfill: usernames preenchidos em ${updated} usuário(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

