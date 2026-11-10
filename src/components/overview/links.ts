export interface TransactionsFilter {
  q?: string;
  account?: string;
  category?: string;
  /** "in" | "out" */
  type?: string;
  /** 7D | 30D | 90D | 12M */
  range?: string;
}

/** Link into /transactions with filters expressed as query parameters. */
export function transactionsHref(filter: TransactionsFilter = {}): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `/transactions?${s}` : "/transactions";
}
