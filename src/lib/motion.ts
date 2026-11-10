import type { CSSProperties } from "react";

/** Inline `--i` for the `.enter` stagger utility (40ms per step). The index is capped so long lists never lag. */
export function stagger(i: number, cap = 8): CSSProperties {
  return { "--i": Math.min(Math.max(i, 0), cap) } as CSSProperties;
}
