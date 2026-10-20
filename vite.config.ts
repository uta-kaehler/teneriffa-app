import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Auf GitHub Pages liegt die App unter /teneriffa-app/, lokal unter /.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/teneriffa-app/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
    dedupe: ["react", "react-dom"],
  },
  build: { outDir: "dist", emptyOutDir: true },
});
