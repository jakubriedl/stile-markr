export interface FoundationShellProps {
  readonly description: string;
  readonly heading: string;
}

export function FoundationShell({ description, heading }: FoundationShellProps) {
  return (
    <main>
      <h1>{heading}</h1>
      <p>{description}</p>
    </main>
  );
}
