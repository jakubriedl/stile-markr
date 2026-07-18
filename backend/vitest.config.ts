import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/db/migrate.ts", "src/server.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
        "src/domain/**": {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
    restoreMocks: true,
  },
});
