/**
 * Money helpers. All money in the app is an integer number of cents.
 * Parsing is done on the string (no floats); formatting is display only.
 */

export type Cents = number;

export const MAX_INTEGER_DIGITS = 10;

export type AmountParseFailure = "empty" | "format" | "negative" | "precision" | "too_large" | "zero";

export type AmountParseResult =
  | { ok: true; cents: Cents }
  | { ok: false; reason: AmountParseFailure };

const AMOUNT_RE = /^(\d+|[1-9]\d{0,2}(?:,\d{3})+)(?:\.(\d*))?$/;

/**
 * Parse a user-entered dollar amount ("1250", "1,250.5", "$1,250.50") into a
 * strictly positive integer number of cents, using string arithmetic only.
 */
export function parseAmountInput(input: string): AmountParseResult {
  let s = String(input ?? "").trim();
  if (s === "") return { ok: false, reason: "empty" };
  if (s.startsWith("$")) s = s.slice(1).trim();
  if (s.startsWith("-") || s.startsWith("−") || s.startsWith("(")) return { ok: false, reason: "negative" };
  if (s.startsWith("+")) return { ok: false, reason: "format" };
  const m = AMOUNT_RE.exec(s);
  if (!m) return { ok: false, reason: "format" };
  const whole = m[1].replace(/,/g, "");
  const frac = m[2] ?? "";
  if (frac.length > 2) return { ok: false, reason: "precision" };
  if (whole.replace(/^0+/, "").length > MAX_INTEGER_DIGITS) return { ok: false, reason: "too_large" };
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (cents === 0) return { ok: false, reason: "zero" };
  return { ok: true, cents };
}

/** Convenience wrapper: cents, or null when the input is not a valid positive amount. */
export function parseAmountToCents(input: string): Cents | null {
  const r = parseAmountInput(input);
  return r.ok ? r.cents : null;
}

function groupThousands(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0, useGrouping: true }).format(n);
}

/** "$1,234.56"; negatives use a true minus sign: "−$1,234.56". */
export function formatCents(cents: Cents): string {
  const abs = Math.abs(cents);
  const text = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs / 100);
  return (cents < 0 ? "−" : "") + text;
}

/** Signed display: "+$1.00" / "−$1.00" / "$0.00". */
export function formatSignedCents(cents: Cents): string {
  if (cents === 0) return formatCents(0);
  return (cents > 0 ? "+" : "") + formatCents(cents);
}

/** Whole-dollar display, rounded half up on magnitude. */
export function formatWholeDollars(cents: Cents): string {
  const abs = Math.abs(cents);
  return (cents < 0 ? "−" : "") + "$" + groupThousands(Math.floor((abs + 50) / 100));
}

/** Axis labels: $950, $12K, $2.62M. */
export function formatCompactCents(cents: Cents): string {
  const a = Math.abs(cents) / 100;
  const sign = cents < 0 ? "−" : "";
  if (a >= 1e6) return sign + "$" + (a / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (a >= 1e3) return sign + "$" + Math.round(a / 1e3) + "K";
  return sign + "$" + Math.round(a);
}

/** Format cents as an editable input value: "1,250.00". */
export function centsToInputValue(cents: Cents): string {
  const abs = Math.abs(cents);
  return groupThousands(Math.floor(abs / 100)) + "." + String(abs % 100).padStart(2, "0");
}

export function sumCents(values: readonly Cents[]): Cents {
  let s = 0;
  for (const v of values) s += v;
  return s;
}

export function sumBy<T>(items: readonly T[], pick: (item: T) => Cents): Cents {
  let s = 0;
  for (const it of items) s += pick(it);
  return s;
}
