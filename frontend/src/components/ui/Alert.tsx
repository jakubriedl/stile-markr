import type { ReactNode } from "react";

export type AlertProps = {
  children: ReactNode;
  /** Assertive alerts grab attention; polite status is for success updates. */
  tone?: "assertive" | "polite";
  variant?: "danger" | "success" | "neutral";
};

export function Alert({ children, tone = "assertive", variant = "danger" }: AlertProps) {
  const background =
    variant === "danger"
      ? "var(--markr-danger-bg)"
      : variant === "success"
        ? "var(--markr-success-bg)"
        : "var(--markr-bg-elevated)";
  const foreground =
    variant === "danger"
      ? "var(--markr-danger)"
      : variant === "success"
        ? "var(--markr-success)"
        : "var(--markr-fg)";
  const border =
    variant === "danger"
      ? "var(--markr-danger)"
      : variant === "success"
        ? "var(--markr-success)"
        : "var(--markr-border)";

  return (
    <div
      role={tone === "assertive" ? "alert" : "status"}
      aria-live={tone}
      className="rounded-[var(--markr-radius)] border px-3 py-2 font-[family-name:var(--markr-font-sans)] text-sm"
      style={{ background, color: foreground, borderColor: border }}
    >
      {children}
    </div>
  );
}
