import { useEffect, useState } from "react";
import { Button as AriaButton } from "react-aria-components";

export const PAGE_CONTENT_ELEMENT_ID = "markr-page-content";

function getFullscreenElement(): Element | null {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

async function requestFullscreen(element: HTMLElement): Promise<void> {
  const el = element as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  if (typeof element.requestFullscreen === "function") {
    await element.requestFullscreen();
    return;
  }
  if (typeof el.webkitRequestFullscreen === "function") {
    await el.webkitRequestFullscreen();
  }
}

async function exitFullscreen(): Promise<void> {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    webkitFullscreenElement?: Element | null;
  };
  if (typeof document.exitFullscreen === "function" && document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  if (typeof doc.webkitExitFullscreen === "function" && doc.webkitFullscreenElement) {
    await doc.webkitExitFullscreen();
  }
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
      <path
        d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8M3 16.2V21m0 0h4.8M3 21l6-6M21 7.8V3m0 0h-4.8M21 3l-6 6M3 7.8V3m0 0h4.8M3 3l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CompressIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
      <g
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Four corner arrows pointing in (tips toward center) */}
        <path d="M21 21 15 15" />
        <path d="M15 19.8V15h4.8" />
        <path d="M3 21 9 15" />
        <path d="M9 19.8V15H4.2" />
        <path d="M21 3 15 9" />
        <path d="M15 4.2V9h4.8" />
        <path d="M3 3 9 9" />
        <path d="M9 4.2V9H4.2" />
      </g>
    </svg>
  );
}

export type FullscreenButtonProps = {
  /** Forces enter/exit visual state for Storybook; omit in production. */
  forcedActive?: boolean;
};

export function FullscreenButton({ forcedActive }: FullscreenButtonProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (forcedActive !== undefined) {
      return;
    }
    const sync = () => {
      setActive(getFullscreenElement()?.id === PAGE_CONTENT_ELEMENT_ID);
    };
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, [forcedActive]);

  const isActive = forcedActive ?? active;

  return (
    <AriaButton
      aria-label={isActive ? "Exit full screen" : "Enter full screen"}
      aria-pressed={isActive}
      onPress={() => {
        if (forcedActive !== undefined) {
          return;
        }
        const target = document.getElementById(PAGE_CONTENT_ELEMENT_ID);
        if (!target) return;
        void (isActive ? exitFullscreen() : requestFullscreen(target));
      }}
      className="inline-flex size-9 items-center justify-center rounded-[var(--markr-radius)] text-[var(--markr-fg-muted)] outline-none transition-colors hover:text-[var(--markr-fg)] focus-visible:ring-2 focus-visible:ring-[var(--markr-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--markr-bg)]"
    >
      {isActive ? <CompressIcon /> : <ExpandIcon />}
    </AriaButton>
  );
}
