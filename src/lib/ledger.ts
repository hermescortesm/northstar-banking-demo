import { CATEGORIES, MEMO_MAX, TODAY, TODAY_ISO, compareTransactionsDesc, txnId } from "./data";
import {
  MONTHS_LONG, MONTHS_SHORT, WEEKDAYS_LONG, daysInMonth, formatClock, formatDayShort, formatDayWithYear,
  fromDayNumber, isoDate, toDayNumber,
} from "./dates";
import { formatCents, parseAmountInput, sumBy, type Cents } from "./money";
import type {
  Account, AccountBalances, AccountId, CategoryName, LedgerState, Transaction, Transfer, TransferErrors, TransferInput,
} from "./types";

/* ------------------------------ balances ------------------------------ */

export function accountBalances(account: Account, transactions: readonly Transaction[]): AccountBalances {
  let posted = account.openingBalanceCents;
  let pending = 0;
  let pendingOut = 0;
  for (const t of transactions) {
    if (t.accountId !== account.id) continue;
    if (t.status === "completed") posted += t.amountCents;
    else if (t.status === "pending") {
      pending += t.amountCents;
      if (t.amountCents < 0) pendingOut += t.amountCents;
    }
  }
  return { accountId: account.id, postedCents: posted, pendingCents: pending, availableCents: posted + pendingOut };
}

export function allBalances(state: Pick<LedgerState, "accounts" | "transactions">): Record<AccountId, AccountBalances> {
  const out = {} as Record<AccountId, AccountBalances>;
  for (const a of state.accounts) out[a.id] = accountBalances(a, state.transactions);
  return out;
}

export interface CashTotals { postedCents: Cents; availableCents: Cents; pendingCents: Cents }

/** Total cash across all accounts (the hero balance is the posted total). */
export function totalCash(state: Pick<LedgerState, "accounts" | "transactions">): CashTotals {
  const b = allBalances(state);
  let postedCents = 0, availableCents = 0, pendingCents = 0;
  for (const a of state.accounts) {
    postedCents += b[a.id].postedCents;
    availableCents += b[a.id].availableCents;
    pendingCents += b[a.id].pendingCents;
  }
  return { postedCents, availableCents, pendingCents };
}

/** Total posted cash at the end of a given day (completed transactions only). */
export function totalPostedAt(state: Pick<LedgerState, "accounts" | "transactions">, day: number): Cents {
  let s = sumBy(state.accounts, (a) => a.openingBalanceCents);
  for (const t of state.transactions) if (t.status === "completed" && t.day <= day) s += t.amountCents;
  return s;
}

/* ------------------------------ summaries ------------------------------ */

export interface PeriodSummary { inCents: Cents; outCents: Cents; netCents: Cents }

/** Counts completed, non-transfer transactions only (the Overview rule). outCents is positive magnitude. */
export function isOperating(t: Transaction): boolean {
  return t.status === "completed" && t.category !== "Transfer";
}

export function summarizePeriod(transactions: readonly Transaction[], startDay: number, endDay: number): PeriodSummary {
  let inCents = 0, outCents = 0;
  for (const t of transactions) {
    if (!isOperating(t) || t.day < startDay || t.day > endDay) continue;
    if (t.amountCents > 0) inCents += t.amountCents;
    else outCents -= t.amountCents;
  }
  return { inCents, outCents, netCents: inCents - outCents };
}

export type Granularity = "day" | "week" | "month";
export type RangeKey = "7D" | "30D" | "90D" | "12M";
export const RANGE_DAYS: Record<RangeKey, number> = { "7D": 7, "30D": 30, "90D": 90, "12M": 365 };

export interface Bucket { startDay: number; endDay: number; short: string; long: string }

export function dayBuckets(count: number, endDay: number = TODAY): Bucket[] {
  const b: Bucket[] = [];
  for (let k = count - 1; k >= 0; k--) {
    const d = endDay - k;
    const c = fromDayNumber(d);
    b.push({ startDay: d, endDay: d, short: `${MONTHS_SHORT[c.m - 1]} ${c.d}`, long: `${WEEKDAYS_LONG[c.weekday]}, ${formatDayWithYear(d)}` });
  }
  return b;
}

export function weekBuckets(count: number, endDay: number = TODAY): Bucket[] {
  const b: Bucket[] = [];
  for (let k = count - 1; k >= 0; k--) {
    const e = endDay - k * 7;
    const s = e - 6;
    b.push({ startDay: s, endDay: e, short: formatDayShort(s), long: `${formatDayShort(s)} – ${formatDayShort(e)}` });
  }
  return b;
}

/** Calendar-month buckets ending with the month of endDay (partial, "to date"). */
export function monthBuckets(count: number, endDay: number = TODAY): Bucket[] {
  const e = fromDayNumber(endDay);
  const b: Bucket[] = [];
  for (let k = count - 1; k >= 0; k--) {
    const idx = e.y * 12 + (e.m - 1) - k;
    const y = Math.floor(idx / 12);
    const m = (idx % 12) + 1;
    const start = toDayNumber(isoDate(y, m, 1));
    const end = Math.min(toDayNumber(isoDate(y, m, daysInMonth(y, m))), endDay);
    b.push({ startDay: start, endDay: end, short: MONTHS_SHORT[m - 1], long: `${MONTHS_LONG[m - 1]} ${y}${end === endDay ? " (to date)" : ""}` });
  }
  return b;
}

export function rangeBuckets(range: RangeKey, endDay: number = TODAY): Bucket[] {
  if (range === "7D") return dayBuckets(7, endDay);
  if (range === "30D") return dayBuckets(30, endDay);
  if (range === "90D") return weekBuckets(13, endDay);
  return monthBuckets(12, endDay);
}

export function bucketsFor(granularity: Granularity, count: number, endDay: number = TODAY): Bucket[] {
  return granularity === "day" ? dayBuckets(count, endDay) : granularity === "week" ? weekBuckets(count, endDay) : monthBuckets(count, endDay);
}

export interface CashFlowPoint extends Bucket {
  inCents: Cents;
  outCents: Cents;
  netCents: Cents;
  /** Total posted cash at the end of the bucket. */
  balanceCents: Cents;
}

/** Cash-flow series for the chart: one point per bucket. Excludes transfers; completed only. */
export function cashFlowSeries(state: Pick<LedgerState, "accounts" | "transactions">, buckets: readonly Bucket[]): CashFlowPoint[] {
  return buckets.map((b) => {
    const s = summarizePeriod(state.transactions, b.startDay, b.endDay);
    return { ...b, ...s, balanceCents: totalPostedAt(state, b.endDay) };
  });
}

export interface RangeStats {
  startDay: number;
  endDay: number;
  points: CashFlowPoint[];
  current: PeriodSummary;
  prior: PeriodSummary;
  startBalanceCents: Cents;
  endBalanceCents: Cents;
  categories: Record<string, Cents>;
  priorCategories: Record<string, Cents>;
}

export function categoryTotals(transactions: readonly Transaction[], startDay: number, endDay: number): Record<string, Cents> {
  const out: Record<string, Cents> = {};
  for (const t of transactions) {
    if (!isOperating(t) || t.amountCents >= 0 || t.day < startDay || t.day > endDay) continue;
    out[t.category] = (out[t.category] ?? 0) - t.amountCents;
  }
  return out;
}

export function rangeStats(state: Pick<LedgerState, "accounts" | "transactions">, range: RangeKey, endDay: number = TODAY): RangeStats {
  const buckets = rangeBuckets(range, endDay);
  const startDay = buckets[0].startDay;
  const end = buckets[buckets.length - 1].endDay;
  const len = end - startDay + 1;
  return {
    startDay,
    endDay: end,
    points: cashFlowSeries(state, buckets),
    current: summarizePeriod(state.transactions, startDay, end),
    prior: summarizePeriod(state.transactions, startDay - len, startDay - 1),
    startBalanceCents: totalPostedAt(state, startDay - 1),
    endBalanceCents: totalPostedAt(state, end),
    categories: categoryTotals(state.transactions, startDay, end),
    priorCategories: categoryTotals(state.transactions, startDay - len, startDay - 1),
  };
}

export interface CategorySlice { name: CategoryName | "Other"; cents: Cents; color: string; percent: number; other: boolean }

/** Top `max` categories by spend plus an "Other" remainder. */
export function categoryBreakdown(categories: Record<string, Cents>, max = 5): { rows: CategorySlice[]; totalCents: Cents } {
  const arr = Object.keys(categories)
    .map((name) => ({ name, cents: categories[name] }))
    .sort((a, b) => b.cents - a.cents || (a.name < b.name ? -1 : 1));
  const totalCents = arr.reduce((s, x) => s + x.cents, 0);
  const top = arr.slice(0, max);
  const rest = arr.slice(max);
  const rows: CategorySlice[] = top.map((x) => ({
    name: x.name as CategoryName,
    cents: x.cents,
    color: CATEGORIES[x.name as CategoryName]?.color ?? "#9AA3AF",
    percent: totalCents ? (x.cents / totalCents) * 100 : 0,
    other: false,
  }));
  if (rest.length) {
    const cents = rest.reduce((s, x) => s + x.cents, 0);
    rows.push({ name: "Other", cents, color: "#9AA3AF", percent: totalCents ? (cents / totalCents) * 100 : 0, other: true });
  }
  return { rows, totalCents };
}

/* ------------------------------ transfers ------------------------------ */

export const SIM_CLOCK = formatClock(15, 4);

function accountLabel(a: Account) {
  return `${a.name} ••${a.mask}`;
}

export interface ValidatedTransfer { errors: TransferErrors; cents: Cents | null }

/** Pure validation against current available balances. Messages follow the design. */
export function validateTransfer(state: Pick<LedgerState, "accounts" | "transactions">, input: TransferInput): ValidatedTransfer {
  const errors: TransferErrors = {};
  const byId = new Map(state.accounts.map((a) => [a.id, a]));
  const from = input.fromAccountId ? byId.get(input.fromAccountId as AccountId) : undefined;
  const to = input.toAccountId ? byId.get(input.toAccountId as AccountId) : undefined;
  if (!input.fromAccountId) errors.from = "Choose the account to transfer from.";
  else if (!from) errors.from = "That source account doesn't exist.";
  if (!input.toAccountId) errors.to = "Choose the account to transfer to.";
  else if (!to) errors.to = "That destination account doesn't exist.";
  else if (input.toAccountId === input.fromAccountId) errors.to = "Choose a different account than the source.";

  const parsed = parseAmountInput(input.amount);
  let cents: Cents | null = null;
  if (parsed.ok) {
    cents = parsed.cents;
    if (from) {
      const avail = accountBalances(from, state.transactions).availableCents;
      if (cents > avail) errors.amount = `Insufficient funds. ${from.name} has ${formatCents(avail)} available.`;
    }
  } else {
    errors.amount = {
      empty: "Enter an amount.",
      format: "Enter a dollar amount, like 1,250.00.",
      negative: "Amount must be greater than $0.00.",
      zero: "Amount must be greater than $0.00.",
      precision: "Use at most two decimal places, like 1,250.00.",
      too_large: "That amount is too large.",
    }[parsed.reason];
  }
  if (input.memo.length > MEMO_MAX) errors.memo = `Keep the note under ${MEMO_MAX} characters.`;
  return { errors, cents: parsed.ok ? cents : null };
}

export type ApplyTransferResult =
  | { status: "applied"; state: LedgerState; transfer: Transfer }
  | { status: "duplicate"; state: LedgerState; transfer: Transfer }
  | { status: "invalid"; state: LedgerState; errors: TransferErrors };

/**
 * Applies a validated transfer: exactly one debit and one credit transaction, total cash unchanged.
 * Pure and immutable: returns a new state. Re-applying a request id is a no-op (same state returned).
 */
export function applyTransfer(state: LedgerState, input: TransferInput): ApplyTransferResult {
  if (!input.requestId) return { status: "invalid", state, errors: { requestId: "A request id is required." } };
  if (state.appliedRequestIds.includes(input.requestId)) {
    const transfer = state.transfers.find((t) => t.requestId === input.requestId);
    if (transfer) return { status: "duplicate", state, transfer };
  }
  const { errors, cents } = validateTransfer(state, input);
  if (Object.keys(errors).length || cents === null) return { status: "invalid", state, errors };

  const from = state.accounts.find((a) => a.id === input.fromAccountId)!;
  const to = state.accounts.find((a) => a.id === input.toAccountId)!;
  const xferSeq = state.nextTransferSeq;
  const xferId = "xfer_" + String(xferSeq).padStart(4, "0");
  const reference = "SIM-" + String(xferSeq).padStart(4, "0");
  const debitSeq = state.nextTransactionSeq;
  const creditSeq = debitSeq + 1;
  const memo = input.memo.trim();
  const base = {
    date: TODAY_ISO,
    day: TODAY,
    minutes: 24 * 60 + xferSeq, // sorts after every seed row dated today
    time: SIM_CLOCK,
    description: memo || "Internal transfer",
    category: "Transfer" as const,
    status: "completed" as const,
    method: "Internal transfer",
    reference,
    reason: null,
    payout: false,
    simulated: true,
    transferId: xferId,
  };
  const debit: Transaction = {
    ...base, id: txnId(debitSeq), seq: debitSeq, accountId: from.id, merchant: `Transfer to ${accountLabel(to)}`,
    amountCents: -cents, direction: "out",
  };
  const credit: Transaction = {
    ...base, id: txnId(creditSeq), seq: creditSeq, accountId: to.id, merchant: `Transfer from ${accountLabel(from)}`,
    amountCents: cents, direction: "in",
  };
  const transfer: Transfer = {
    id: xferId, requestId: input.requestId, fromAccountId: from.id, toAccountId: to.id, amountCents: cents, memo,
    reference, date: TODAY_ISO, debitTransactionId: debit.id, creditTransactionId: credit.id,
  };
  const transactions = [credit, debit, ...state.transactions].sort(compareTransactionsDesc);
  return {
    status: "applied",
    transfer,
    state: {
      accounts: state.accounts,
      transactions,
      transfers: [transfer, ...state.transfers],
      nextTransactionSeq: creditSeq + 1,
      nextTransferSeq: xferSeq + 1,
      appliedRequestIds: [...state.appliedRequestIds, input.requestId],
    },
  };
}
