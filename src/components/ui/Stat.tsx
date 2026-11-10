import type { CSSProperties, ReactNode } from "react";
import { cn } from "./cn";

/** Label, big value and a note, e.g. one KPI cell. Usage: <Stat label="Money in" value="$1,000" note="+3%" dot="var(--chart-line)" /> */
export function Stat({
  label, value, note, dot, valueColor, testId, className, style,
}: { label: ReactNode; value: ReactNode; note: ReactNode; dot?: string; valueColor?: string; testId?: string; className?: string; style?: CSSProperties }) {
  return (
    <div data-testid={testId} style={style} className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="flex items-center gap-1.5 text-xs text-text-3">
        {dot && <i className="inline-block size-2 flex-none rounded-[2px]" style={{ background: dot }} />}
        {label}
      </span>
      <span
        className="num whitespace-nowrap text-[22px] font-semibold tracking-[-0.035em]"
        style={valueColor ? { color: valueColor } : undefined}
        data-testid={testId ? `${testId}-value` : undefined}
      >
        {value}
      </span>
      <span className="text-xs text-text-3">{note}</span>
    </div>
  );
}
