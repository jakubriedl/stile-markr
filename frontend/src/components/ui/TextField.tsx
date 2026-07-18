import {
  FieldError,
  Input,
  Label,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";

export type TextFieldProps = AriaTextFieldProps & {
  label: string;
  description?: string;
};

export function TextField({ label, description, ...props }: TextFieldProps) {
  return (
    <AriaTextField
      {...props}
      className="flex flex-col gap-1 font-[family-name:var(--markr-font-sans)] text-[var(--markr-fg)]"
    >
      <Label className="text-sm font-semibold">{label}</Label>
      {description ? (
        <p className="m-0 text-sm text-[var(--markr-fg-muted)]">{description}</p>
      ) : null}
      <Input className="rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)] px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--markr-focus)]" />
      <FieldError className="text-sm text-[var(--markr-danger)]" />
    </AriaTextField>
  );
}
