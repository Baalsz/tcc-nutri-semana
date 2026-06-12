import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getBackendPort() {
  try {
    const envPath = resolve(__dirname, "../backend/.env");
    const env = readFileSync(envPath, "utf8");
    const match = env.match(/^PORT=(\d+)/m);
    if (match) return Number(match[1]);
  } catch {
    // usa padrão do backend
  }
  return 3100;
}

const backendPort = getBackendPort();

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["pdfmake/build/pdfmake", "pdfmake/build/vfs_fonts"],
  },
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
});
