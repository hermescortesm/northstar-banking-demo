import { useState } from "react";

/**
 * Counts changes to `value` after the first render. 0 on mount (no flash), then 1, 2, ...
 * Use as `key={n}` plus `className={n ? "flash" : ""}` so the CSS highlight replays on every change.
 */
export function useFlash(value: number | string): number {
  const [state, setState] = useState({ value, n: 0 });
  if (state.value !== value) setState({ value, n: state.n + 1 });
  return state.n;
}
