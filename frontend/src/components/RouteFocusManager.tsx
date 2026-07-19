import { useRouterState, type RegisteredRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { PAGE_HEADING_ELEMENT_ID } from "./page-heading-id.ts";

export { PAGE_HEADING_ELEMENT_ID };

const MAX_FOCUS_ATTEMPTS = 12;

type AppRouterState = RegisteredRouter["state"];

function focusPageHeading(): boolean {
  const heading = document.getElementById(PAGE_HEADING_ELEMENT_ID);
  if (!(heading instanceof HTMLElement)) {
    return false;
  }
  heading.focus({ preventScroll: true });
  return document.activeElement === heading;
}

/**
 * After client-side navigations, move focus to the page heading so VoiceOver
 * announces the new page. Skips the initial mount (browser/VO already start at top).
 * Retries across frames so focus is not lost while the new route commits.
 */
export function RouteFocusManager() {
  const pathname = useRouterState({
    select: (state: AppRouterState) => state.location.pathname,
  });
  const status = useRouterState({
    select: (state: AppRouterState) => state.status,
  });
  const isFirstIdle = useRef(true);

  useEffect(() => {
    if (status !== "idle") {
      return;
    }

    if (isFirstIdle.current) {
      isFirstIdle.current = false;
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let frameId = 0;

    const tryFocus = () => {
      if (cancelled) {
        return;
      }
      if (focusPageHeading()) {
        return;
      }
      attempts += 1;
      if (attempts < MAX_FOCUS_ATTEMPTS) {
        frameId = requestAnimationFrame(tryFocus);
      }
    };

    // Double rAF: wait until the new route's heading is painted.
    frameId = requestAnimationFrame(() => {
      frameId = requestAnimationFrame(tryFocus);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [pathname, status]);

  return null;
}
