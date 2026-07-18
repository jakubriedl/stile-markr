import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";

const variantClassName = {
  primary:
    "bg-[var(--markr-accent)] text-[var(--markr-accent-fg)] hover:brightness-105 pressed:brightness-95",
  secondary:
    "border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)] text-[var(--markr-fg)] hover:bg-[var(--markr-bg)]",
  danger: "bg-[var(--markr-danger)] text-white hover:brightness-105 pressed:brightness-95",
} as const;

export type ButtonProps = AriaButtonProps & {
  variant?: keyof typeof variantClassName;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <AriaButton
      {...props}
      className={(renderProps) =>
        [
          "inline-flex items-center justify-center gap-2 rounded-[var(--markr-radius)] px-4 py-2 font-[family-name:var(--markr-font-sans)] text-base font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--markr-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--markr-bg)] disabled:cursor-not-allowed disabled:opacity-50",
          variantClassName[variant],
          typeof className === "function" ? className(renderProps) : className,
        ]
          .filter(Boolean)
          .join(" ")
      }
    />
  );
}
