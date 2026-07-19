export type PercentDonutProps = {
  value: number;
  /** ViewBox coordinate size; display size comes from `className` (defaults to 56px). */
  size?: number;
  strokeWidth?: number;
  className?: string;
};

/** Decorative 0–100% ring. Keep the numeric value in accessible text beside/over it. */
export function PercentDonut({
  value,
  size = 56,
  strokeWidth = 6,
  className = "size-14",
}: PercentDonutProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
      data-percent={String(clamped)}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--markr-border)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        className="text-[var(--markr-accent)] motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500"
      />
    </svg>
  );
}
