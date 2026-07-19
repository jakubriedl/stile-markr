import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { defineConfig } from "vitest/config";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const chromiumExecutablePath = resolveChromiumExecutable();

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "src/routeTree.gen.ts",
        "src/**/*.stories.tsx",
        "src/**/*.d.ts",
        "src/lib/api/types.ts",
        "src/components/ui/index.ts",
        "src/styles/**",
        "src/storybook/**",
        "src/features/foundation/**",
        // Thin file-route shells; feature pages and API client carry the behavior under test.
        "src/routes/**",
        // Presentational UI is covered by Storybook play/axe (NOTE-ARCH-007); unit coverage
        // tracks non-UI logic plus a few behavioral components with dedicated unit tests.
        "src/components/ui/**",
        "src/components/AppShell.tsx",
        "src/features/tests/**/*.tsx",
        "src/features/upload/**/*.tsx",
      ],
      include: ["src/**/*.{ts,tsx}", "server/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },

    projects: [
      {
        extends: true,
        plugins: [react()],
        test: {
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.ts"],
          name: "unit",
          setupFiles: ["./tests/setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          env: {
            MARKR_CHROMIUM_EXECUTABLE_PATH: chromiumExecutablePath,
          },
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          name: "integration",
        },
      },
      {
        extends: true,
        optimizeDeps: {
          include: ["@tanstack/react-router", "@tanstack/react-query"],
        },
        plugins: [
          storybookTest({
            configDir: join(currentDirectory, ".storybook"),
            storybookScript: "pnpm --filter @markr/frontend storybook --no-open",
          }),
        ],
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright({
              launchOptions: {
                executablePath: chromiumExecutablePath,
              },
            }),
          },
          name: "storybook",
        },
      },
    ],
    restoreMocks: true,
  },
});

function resolveChromiumExecutable(): string {
  const detectedPath = chromium.executablePath();
  const candidates = [
    detectedPath,
    detectedPath.replace("mac-x64", "mac-arm64"),
    detectedPath.replace("mac-arm64", "mac-x64"),
  ];
  const executablePath = candidates.find((candidate) => existsSync(candidate));
  if (!executablePath) {
    throw new Error(
      "Chromium is not installed; run `pnpm --filter @markr/frontend exec playwright install chromium`",
    );
  }
  return executablePath;
}
