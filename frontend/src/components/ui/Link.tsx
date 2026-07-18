import { Link as AriaLink, type LinkProps as AriaLinkProps } from "react-aria-components";

export type LinkProps = AriaLinkProps;

export function Link({ className, ...props }: LinkProps) {
  return (
    <AriaLink
      {...props}
      className={(renderProps) =>
        [
          "font-[family-name:var(--markr-font-sans)] font-semibold text-[var(--markr-accent)] underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--markr-focus)]",
          typeof className === "function" ? className(renderProps) : className,
        ]
          .filter(Boolean)
          .join(" ")
      }
    />
  );
}
