import type { HTMLAttributes, ReactNode } from "react";

export type PageHeadingProps = {
  children: ReactNode;
  id?: string;
  className?: string;
};

export function PageHeading({ children, id, className }: PageHeadingProps) {
  return (
    <h1
      id={id}
      className={[
        "m-0 font-[family-name:var(--markr-font-display)] text-3xl font-semibold tracking-tight text-[var(--markr-fg)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </h1>
  );
}

export type SectionHeadingProps = {
  children: ReactNode;
  id?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLHeadingElement>, "children" | "id" | "className">;

export function SectionHeading({ children, id, className, ...props }: SectionHeadingProps) {
  return (
    <h2
      id={id}
      className={[
        "m-0 font-[family-name:var(--markr-font-sans)] text-xl font-semibold tracking-tight text-[var(--markr-fg)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </h2>
  );
}
