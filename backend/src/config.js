export function getEnv(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return v;
}

export const config = {
  port: Number(getEnv("PORT", "3105")),
  jwtSecret: getEnv("JWT_SECRET", "dev-secret-change-me"),
};

