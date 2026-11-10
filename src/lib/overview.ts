/**
 * Pure view-model for the Overview screen. Every figure is derived from the ledger
 * functions in ./ledger so the Overview always agrees with the transactions.
 */
import { CATEGORIES } from "./data";
import { formatDayShort, formatDayWithYear } from "./dates";
import {
  RANGE_DAYS, categoryBreakdown, cashFlowSeries, monthBuckets, rangeStats,
  type CashFlowPoint, type CategorySlice, type PeriodSummary, type RangeKey,
} from "./ledger";
import { formatCents, formatSignedCents, formatWholeDollars, type Cents } from "./money";
import type { Account, AccountBalances, LedgerState, Transaction } from "./types";

export const RANGE_KEYS: readonly RangeKey[] = ["7D", "30D", "90D", "12M"];
export const RANGE_LABEL: Record<RangeKey, string> = {
  "7D": "Last 7 days", "30D": "Last 30 days", "90D": "Last 90 days", "12M": "Last 12 months",
};
export const PRIOR_LABEL: Record<RangeKey, string> = {
  "7D": "prior 7 days", "30D": "prior 30 days", "90D": "prior 90 days", "12M": "prior 12 months",
};
export { RANGE_DAYS };

/** Whole-dollar signed display: "+$1,234" / "−$1,234" / "$0". */
export function formatSignedWhole(cents: Cents): string {
  if (cents === 0) return formatWholeDollars(0);
  return (cents > 0 ? "+" : "−") + formatWholeDollars(Math.abs(cents));
}

/** "$2,619,905.09" -> { dollars: "$2,619,905", cents: ".09" } for the hero balance. */
export function splitCents(cents: Cents): { dollars: string; cents: string } {
  const s = formatCents(cents);
  const i = s.lastIndexOf(".");
  return { dollars: s.slice(0, i), cents: s.slice(i) };
}

/** "▲ 5.7% vs. prior 30 days"; "No prior activity" when the prior period is zero. */
export function pctChangeText(current: Cents, prior: Cents, label: string): string {
  if (!prior) return "No prior activity";
  const permille = ((current - prior) * 1000) / Math.abs(prior);
  return `${permille >= 0 ? "▲" : "▼"} ${(Math.round(Math.abs(permille)) / 10).toFixed(1)}% vs. ${label}`;
}

/** Delta label next to the hero balance: "+$14,213 (+5.7%)". */
export function deltaLabel(startCents: Cents, endCents: Cents): string {
  const chg = endCents - startCents;
  const permille = startCents ? Math.round((chg * 1000) / startCents) : 0;
  return `${formatSignedWhole(chg)} (${chg >= 0 ? "+" : "−"}${(Math.abs(permille) / 10).toFixed(1)}%)`;
}

export function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

export interface YScale { lo: number; hi: number; ticks: number[] }

/** Design rule: min - 0.45*spread .. max + 0.25*spread, snapped to a "nice" step of about 4 intervals. */
export function balanceScale(values: readonly number[]): YScale {
  if (!values.length) return { lo: 0, hi: 1, ticks: [0, 1] };
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const spread = mx - mn || mx * 0.05 || 1;
  let lo = mn - spread * 0.45;
  let hi = mx + spread * 0.25;
  const step = niceStep((hi - lo) / 4);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let i = 0; lo + i * step <= hi + step / 1e6; i++) ticks.push(Math.round(lo + i * step));
  return { lo, hi, ticks };
}

/** Bucket labels shown on the x axis: every label up to 7 points, otherwise about 6. */
export function xTickLabels(points: readonly { short: string }[]): string[] {
  const every = points.length <= 7 ? 1 : Math.ceil(points.length / 6);
  return points.filter((_, i) => i % every === 0).map((p) => p.short);
}

/** conic-gradient stops with a 0.6% gap between slices. */
export function donutGradient(rows: readonly { color: string; cents: Cents }[]): string {
  const total = rows.reduce((s, r) => s + r.cents, 0);
  if (!total) return "var(--hover) 0% 100%";
  let acc = 0;
  const stops: string[] = [];
  for (const r of rows) {
    const a0 = (acc / total) * 100;
    acc += r.cents;
    const a1 = (acc / total) * 100;
    const g0 = Math.max(a0, a1 - 0.6);
    stops.push(`${r.color} ${a0.toFixed(2)}% ${g0.toFixed(2)}%`, `transparent ${g0.toFixed(2)}% ${a1.toFixed(2)}%`);
  }
  return stops.join(", ");
}

/**
 * Whole-dollar amounts for a list of cent values whose sum equals the whole-dollar rounding of the cent total
 * (largest-remainder method: floor each, hand the missing dollars to the biggest fractions). Display only; the cents are untouched.
 */
export function reconcileWholeDollars(cents: readonly Cents[]): number[] {
  const out = cents.map((c) => Math.floor(c / 100));
  let missing = Math.floor((cents.reduce((s, c) => s + c, 0) + 50) / 100) - out.reduce((s, d) => s + d, 0);
  const order = cents.map((c, i) => ({ i, frac: c % 100 })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; missing > 0 && order.length; k++, missing--) out[order[k % order.length].i]++;
  return out;
}

export interface Insight { icon: "trend" | "cloud" | "clock"; title: string; body: string }

export function buildInsights(state: Pick<LedgerState, "accounts" | "transactions">): Insight[] {
  const months = cashFlowSeries(state, monthBuckets(4).slice(0, 3)); // three full months before the current one
  const positive = months.filter((m) => m.netCents > 0).length;
  const s30 = rangeStats(state, "30D");
  const cloud = s30.categories["Cloud & Infra"] ?? 0;
  const prior = s30.priorCategories["Cloud & Infra"] ?? 0;
  const pct = prior ? Math.round((Math.abs(cloud - prior) * 100) / prior) : 0;
  const pendingIn = state.transactions.reduce((s, t) => (t.status === "pending" && t.amountCents > 0 ? s + t.amountCents : s), 0);
  return [
    {
      icon: "trend",
      title: positive === 3 ? "Cash-flow positive three months running" : `${positive} of the last 3 months were cash-flow positive`,
      body: months.map((m) => `${m.short} ${formatSignedWhole(m.netCents)}`).join(" · "),
    },
    {
      icon: "cloud",
      title: `Cloud & Infra ${cloud >= prior ? "up" : "down"} ${pct}% vs. prior 30 days`,
      body: `${formatWholeDollars(cloud)} across AWS, Datadog, OpenAI and Vercel.`,
    },
    {
      icon: "clock",
      title: `${formatCents(pendingIn)} in deposits pending`,
      body: "Shown under Pending; added to balances once they post.",
    },
  ];
}

export interface AccountCard {
  id: Account["id"];
  name: string;
  type: Account["type"];
  mask: string;
  apy?: string;
  postedCents: Cents;
  availableCents: Cents;
  pendingCents: Cents;
  posted: string;
  available: string;
  /** "+$1,000.00 pending" or "Nothing pending". */
  pendingText: string;
}

export interface RecentRow {
  id: string;
  reference: string;
  merchant: string;
  simulated: boolean;
  category: Transaction["category"];
  categoryColor: string;
  categoryIcon: string;
  /** "Nov 9 · Revenue · Operating ••4821" */
  sub: string;
  /** "Nov 9 · Revenue": the part that may truncate on narrow screens. */
  subLead: string;
  /** "Operating ••4821": kept whole so the account is always readable. */
  subTail: string;
  amount: string;
  incoming: boolean;
  status: Transaction["status"];
}

export interface OverviewModel {
  range: RangeKey;
  rangeLabel: string;
  rangeDates: string;
  total: { posted: string; dollars: string; cents: string; available: string; pending: string };
  postedCents: Cents;
  delta: { label: string; negative: boolean; sub: string };
  points: CashFlowPoint[];
  chartSummary: string;
  summary: { in: string; out: string; net: string; inChange: string; outChange: string; netSub: string; netNegative: boolean } & {
    raw: PeriodSummary;
  };
  accounts: AccountCard[];
  categories: { rows: CategorySlice[]; totalCents: Cents; total: string; gradient: string; /** Whole dollars per row; sums to the displayed total. */ dollars: number[] };
  insights: Insight[];
  recent: RecentRow[];
}

export function buildOverview(
  state: Pick<LedgerState, "accounts" | "transactions">,
  balances: Record<string, AccountBalances>,
  totals: { postedCents: Cents; availableCents: Cents; pendingCents: Cents },
  range: RangeKey,
): OverviewModel {
  const stats = rangeStats(state, range);
  const chg = stats.endBalanceCents - stats.startBalanceCents;
  const cb = categoryBreakdown(stats.categories, 5);
  const byId = new Map(state.accounts.map((a) => [a.id, a]));
  const split = splitCents(totals.postedCents);
  const net = stats.current.netCents;
  return {
    range,
    rangeLabel: RANGE_LABEL[range],
    rangeDates: `${formatDayShort(stats.startDay)} - ${formatDayWithYear(stats.endDay)}`,
    total: {
      posted: formatCents(totals.postedCents),
      dollars: split.dollars,
      cents: split.cents,
      available: formatCents(totals.availableCents),
      pending: formatSignedCents(totals.pendingCents),
    },
    postedCents: totals.postedCents,
    delta: { label: deltaLabel(stats.startBalanceCents, stats.endBalanceCents), negative: chg < 0, sub: RANGE_LABEL[range].toLowerCase() },
    points: stats.points,
    chartSummary: `Total cash balance, ${RANGE_LABEL[range].toLowerCase()}, from ${formatWholeDollars(stats.startBalanceCents)} to ${formatWholeDollars(stats.endBalanceCents)}`,
    summary: {
      in: formatCents(stats.current.inCents),
      out: formatCents(stats.current.outCents),
      net: formatSignedCents(net),
      inChange: pctChangeText(stats.current.inCents, stats.prior.inCents, PRIOR_LABEL[range]),
      outChange: pctChangeText(stats.current.outCents, stats.prior.outCents, PRIOR_LABEL[range]),
      netSub: `Prior period: ${formatSignedCents(stats.prior.netCents)}`,
      netNegative: net < 0,
      raw: stats.current,
    },
    accounts: state.accounts.map((a) => {
      const b = balances[a.id];
      return {
        id: a.id, name: a.name, type: a.type, mask: a.mask, apy: a.apy,
        postedCents: b.postedCents, availableCents: b.availableCents, pendingCents: b.pendingCents,
        posted: formatCents(b.postedCents), available: formatCents(b.availableCents),
        pendingText: b.pendingCents ? `${formatSignedCents(b.pendingCents)} pending` : "Nothing pending",
      };
    }),
    categories: { rows: cb.rows, totalCents: cb.totalCents, total: formatWholeDollars(cb.totalCents), gradient: donutGradient(cb.rows), dollars: reconcileWholeDollars(cb.rows.map((r) => r.cents)) },
    insights: buildInsights(state),
    recent: state.transactions.slice(0, 5).map((t) => {
      const a = byId.get(t.accountId);
      const cat = CATEGORIES[t.category];
      return {
        id: t.id, reference: t.reference, merchant: t.merchant, simulated: t.simulated, category: t.category,
        categoryColor: cat?.color ?? "#9AA3AF", categoryIcon: cat?.icon ?? "swap",
        sub: `${formatDayShort(t.day)} · ${t.category} · ${a ? `${a.shortName} ••${a.mask}` : ""}`,
        subLead: `${formatDayShort(t.day)} · ${t.category}`,
        subTail: a ? `${a.shortName} ••${a.mask}` : "",
        amount: formatSignedCents(t.amountCents), incoming: t.amountCents > 0, status: t.status,
      };
    }),
  };
}
