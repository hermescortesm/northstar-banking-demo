import { TODAY } from "@/lib/data";
import { parseAmountInput, type Cents } from "@/lib/money";
import type { AccountId, CategoryName, Transaction } from "@/lib/types";

export type DateRange = "all" | "7D" | "30D" | "90D" | "12M";
export type SortKey = "date" | "merchant" | "amount";
export type SortDir = "asc" | "desc";

export interface Filters {
  q: string;
  range: DateRange;
  direction: "all" | "in" | "out";
  category: "all" | CategoryName;
  status: "all" | Transaction["status"];
  account: "all" | AccountId;
  /** Raw text of the min/max dollar inputs. */
  min: string;
  max: string;
}

export const EMPTY_FILTERS: Filters = {
  q: "", range: "all", direction: "all", category: "all", status: "all", account: "all", min: "", max: "",
};

export const PAGE_SIZE = 12;
const RANGE_DAYS: Record<Exclude<DateRange, "all">, number> = { "7D": 7, "30D": 30, "90D": 90, "12M": 365 };

const ERR_FORMAT = "Enter amounts as numbers, like 1500 or 1,500.00. The amount filter isn’t applied.";
const ERR_ORDER = "The minimum amount is higher than the maximum. The amount filter isn’t applied.";

/** Lenient amount parse for filters: blank -> null, "0" -> 0, invalid -> "invalid". */
function parseBound(text: string): Cents | null | "invalid" {
  if (!text.trim()) return null;
  const r = parseAmountInput(text);
  if (r.ok) return r.cents;
  return r.reason === "zero" ? 0 : "invalid";
}

export interface AmountBounds { min: Cents | null; max: Cents | null; error: string }

export function amountBounds(f: Pick<Filters, "min" | "max">): AmountBounds {
  const min = parseBound(f.min);
  const max = parseBound(f.max);
  if (min === "invalid" || max === "invalid") return { min: null, max: null, error: ERR_FORMAT };
  if (min !== null && max !== null && min > max) return { min: null, max: null, error: ERR_ORDER };
  return { min, max, error: "" };
}

export function matchesQuery(t: Transaction, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return `${t.merchant} ${t.description} ${t.reference}`.toLowerCase().includes(needle);
}

export function filterTransactions(txns: readonly Transaction[], f: Filters, today: number = TODAY): Transaction[] {
  const { min, max } = amountBounds(f);
  const days = f.range === "all" ? 0 : RANGE_DAYS[f.range];
  return txns.filter((t) => {
    if (!matchesQuery(t, f.q)) return false;
    if (days && t.day <= today - days) return false;
    if (f.direction !== "all" && t.direction !== f.direction) return false;
    if (f.category !== "all" && t.category !== f.category) return false;
    if (f.status !== "all" && t.status !== f.status) return false;
    if (f.account !== "all" && t.accountId !== f.account) return false;
    const abs = Math.abs(t.amountCents);
    if (min !== null && abs < min) return false;
    if (max !== null && abs > max) return false;
    return true;
  });
}

/** Input must be newest-first (ledger order); ties keep that order. Returns a new array. */
export function sortTransactions(txns: readonly Transaction[], key: SortKey, dir: SortDir): Transaction[] {
  const d = dir === "asc" ? 1 : -1;
  const out = [...txns];
  if (key === "merchant") return out.sort((a, b) => d * a.merchant.localeCompare(b.merchant));
  if (key === "amount") return out.sort((a, b) => d * (a.amountCents - b.amountCents));
  return dir === "asc" ? out.reverse() : out;
}

export function nextSort(cur: { key: SortKey; dir: SortDir }, key: SortKey): { key: SortKey; dir: SortDir } {
  if (cur.key === key) return { key, dir: cur.dir === "asc" ? "desc" : "asc" };
  return { key, dir: key === "merchant" ? "asc" : "desc" };
}

export function activeFilterCount(f: Filters): number {
  return (
    (f.q.trim() ? 1 : 0) + (f.range !== "all" ? 1 : 0) + (f.direction !== "all" ? 1 : 0) +
    (f.category !== "all" ? 1 : 0) + (f.status !== "all" ? 1 : 0) + (f.account !== "all" ? 1 : 0) +
    (f.min.trim() || f.max.trim() ? 1 : 0)
  );
}

export interface FilteredTotals { inCents: Cents; outCents: Cents; netCents: Cents }

/** Posted and pending count; failed is excluded. */
export function totalsOf(txns: readonly Transaction[]): FilteredTotals {
  let inCents = 0;
  let outCents = 0;
  for (const t of txns) {
    if (t.status === "failed") continue;
    if (t.amountCents > 0) inCents += t.amountCents;
    else outCents -= t.amountCents;
  }
  return { inCents, outCents, netCents: inCents - outCents };
}

export type PageItem = { gap: true; key: string } | { gap: false; page: number };

/** First, last and current +/- 1, with gaps. */
export function pageItems(pages: number, current: number): PageItem[] {
  const items: PageItem[] = [];
  let last = 0;
  for (let p = 1; p <= pages; p++) {
    if (p !== 1 && p !== pages && Math.abs(p - current) > 1) continue;
    if (p - last > 1) items.push({ gap: true, key: `gap-${p}` });
    items.push({ gap: false, page: p });
    last = p;
  }
  return items;
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

type Params = { get(name: string): string | null };

/** Builds initial filters from URL params: q, account, category, type (alias direction), status, range, min, max. */
export function filtersFromParams(
  p: Params,
  valid: { accounts: readonly string[]; categories: readonly string[] },
): Filters {
  const pick = <T extends string>(name: string, allowed: readonly string[], fallback: T): T => {
    const v = p.get(name);
    return v && allowed.includes(v) ? (v as T) : fallback;
  };
  return {
    q: p.get("q")?.trim() ?? "",
    range: pick<DateRange>("range", ["7D", "30D", "90D", "12M"], "all"),
    direction: pick("type", ["in", "out"], pick("direction", ["in", "out"], "all")),
    category: pick("category", valid.categories, "all"),
    status: pick("status", ["completed", "pending", "failed"], "all"),
    account: pick("account", valid.accounts, "all"),
    min: p.get("min") ?? "",
    max: p.get("max") ?? "",
  };
}
