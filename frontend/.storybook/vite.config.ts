import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    include: ["@tanstack/react-router", "@tanstack/react-query"],
  },
  plugins: [tailwindcss()],
});
