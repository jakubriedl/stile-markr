import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const dockerDev = process.env.MARKR_DOCKER_DEV === "1";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [nitro({ serverDir: "./server" }), tailwindcss(), tanstackStart(), viteReact()],
  ...(dockerDev
    ? {
        server: {
          host: true,
          watch: { usePolling: true },
          hmr: { clientPort: 3000 },
        },
      }
    : {}),
});

export default config;
