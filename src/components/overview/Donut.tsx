import type { CSSProperties } from "react";
import type { CategorySlice } from "@/lib/ledger";

const SIZE = 168;
const STROKE = 22;
const R = (SIZE - STROKE) / 2;
const GAP = 0.6; // percent of the ring left empty between slices

/**
 * Spending donut as SVG arcs (pathLength=100, so a slice is just its percent). Each arc draws in after the previous
 * one (`.donut-arc` in globals.css). Decorative: the parent carries the role="img" label.
 */
export function Donut({ rows }: { rows: readonly CategorySlice[] }) {
  const starts = rows.map((_, i) => rows.slice(0, i).reduce((sum, r) => sum + r.percent, 0));
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} aria-hidden="true" className="-rotate-90">
      <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--hover)" strokeWidth={STROKE} />
      {rows.map((c, i) => {
        const len = Math.max(c.percent - GAP, 0);
        return (
          <circle
            key={c.name}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={c.color}
            strokeWidth={STROKE}
            pathLength={100}
            strokeDashoffset={-starts[i]}
            className="donut-arc"
            style={{ "--len": len, "--i": i } as CSSProperties}
          />
        );
      })}
    </svg>
  );
}
