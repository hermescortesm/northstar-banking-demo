import { formatCents, formatSignedCents } from "@/lib/money";
import { cn } from "./cn";

/**
 * Formats integer cents with tabular numerals. `signed` shows + or minus, `tone` colours incoming (positive) money green.
 * Usage: <Money cents={-1250} signed /> renders the signed dollar text.
 */
export function Money({
  cents, signed = false, tone = false, strike = false, className, ...rest
}: { cents: number; signed?: boolean; tone?: boolean; strike?: boolean; className?: string; "data-role"?: string; "data-testid"?: string }) {
  return (
    <span
      className={cn("num", tone && cents > 0 && "text-pos", strike && "line-through decoration-text-3/60", className)}
      {...rest}
    >
      {signed ? formatSignedCents(cents) : formatCents(cents)}
    </span>
  );
}
