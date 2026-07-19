import type { Decorator, Preview } from "@storybook/react-vite";
import { initialize, mswLoader } from "msw-storybook-addon";
import { useLayoutEffect, type ReactNode } from "react";

import "../src/styles.css";

initialize({ onUnhandledRequest: "error" });

function PreferencesRoot({
  theme,
  reducedMotion,
  children,
}: {
  theme: string;
  reducedMotion: string;
  children: ReactNode;
}) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === "light" || theme === "dark") {
      root.dataset.theme = theme;
    } else {
      delete root.dataset.theme;
    }
    if (reducedMotion === "reduce") {
      root.dataset.reducedMotion = "reduce";
    } else {
      delete root.dataset.reducedMotion;
    }
  }, [theme, reducedMotion]);

  return children;
}

const withPreferences: Decorator = (Story, context) => {
  const theme = String(context.globals.theme ?? "system");
  const reducedMotion = String(context.globals.reducedMotion ?? "no-preference");
  return (
    <PreferencesRoot theme={theme} reducedMotion={reducedMotion}>
      <Story />
    </PreferencesRoot>
  );
};

const preview: Preview = {
  decorators: [withPreferences],
  globalTypes: {
    theme: {
      description: "Color theme preference",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "system", title: "System" },
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
    reducedMotion: {
      description: "Reduced motion preference",
      toolbar: {
        title: "Motion",
        icon: "photo",
        items: [
          { value: "no-preference", title: "Motion OK" },
          { value: "reduce", title: "Reduce motion" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "system",
    reducedMotion: "no-preference",
  },
  loaders: [mswLoader],
  parameters: {
    a11y: {
      test: "error",
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
