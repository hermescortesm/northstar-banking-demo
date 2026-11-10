import { describe, expect, it } from "vitest";
import { createInitialLedgerState } from "./data";
import { allBalances, totalCash } from "./ledger";
import {
  RANGE_KEYS, balanceScale, buildOverview, deltaLabel, donutGradient, formatSignedWhole, niceStep, pctChangeText,
  splitCents, xTickLabels,
} from "./overview";

describe("overview helpers", () => {
  it("splits cents for the hero", () => expect(splitCents(261990509)).toEqual({ dollars: "$2,619,905", cents: ".09" }));
  it("formats signed whole dollars", () => {
    expect(formatSignedWhole(1421300)).toBe("+$14,213");
    expect(formatSignedWhole(-50)).toBe("−$1");
    expect(formatSignedWhole(0)).toBe("$0");
  });
  it("pct change text", () => {
    expect(pctChangeText(110, 100, "prior 30 days")).toBe("▲ 10.0% vs. prior 30 days");
    expect(pctChangeText(90, 100, "x")).toBe("▼ 10.0% vs. x");
    expect(pctChangeText(5, 0, "x")).toBe("No prior activity");
  });
  it("delta label", () => {
    expect(deltaLabel(100000, 105700)).toBe("+$57 (+5.7%)");
    expect(deltaLabel(0, 0)).toBe("$0 (+0.0%)");
  });
  it("niceStep", () => {
    expect(niceStep(0)).toBe(1);
    expect(niceStep(230)).toBe(250);
  });
  it("balanceScale covers the data with ticks", () => {
    const s = balanceScale([1000, 2000, 1500]);
    expect(s.lo).toBeLessThanOrEqual(1000);
    expect(s.hi).toBeGreaterThanOrEqual(2000);
    expect(s.ticks[0]).toBe(s.lo);
    expect(balanceScale([]).ticks.length).toBeGreaterThan(1);
    expect(balanceScale([500, 500]).hi).toBeGreaterThan(500);
  });
  it("xTickLabels thins long series", () => {
    const pts = Array.from({ length: 30 }, (_, i) => ({ short: `d${i}` }));
    expect(xTickLabels(pts)).toHaveLength(6);
    expect(xTickLabels(pts.slice(0, 7))).toHaveLength(7);
  });
  it("donutGradient handles empty and gaps", () => {
    expect(donutGradient([])).toContain("var(--hover)");
    expect(donutGradient([{ color: "#111", cents: 50 }, { color: "#222", cents: 50 }])).toContain("#222 50.00%");
  });
});

describe("buildOverview agrees with the ledger", () => {
  const state = createInitialLedgerState();
  const balances = allBalances(state);
  const totals = totalCash(state);
  it("hero total equals the sum of account balances", () => {
    const m = buildOverview(state, balances, totals, "30D");
    expect(m.accounts.reduce((s, a) => s + a.postedCents, 0)).toBe(m.postedCents);
    expect(m.total.posted).toBe("$2,619,905.09");
  });
  it.each(RANGE_KEYS)("range %s: net = in - out, spend total = money out, last point = hero total", (r) => {
    const m = buildOverview(state, balances, totals, r);
    expect(m.summary.raw.netCents).toBe(m.summary.raw.inCents - m.summary.raw.outCents);
    expect(m.categories.totalCents).toBe(m.summary.raw.outCents);
    expect(m.points.reduce((s, p) => s + p.inCents, 0)).toBe(m.summary.raw.inCents);
    expect(m.points[m.points.length - 1].balanceCents).toBe(m.postedCents);
  });
  it("recent rows are the 5 newest", () => {
    const m = buildOverview(state, balances, totals, "30D");
    expect(m.recent.map((r) => r.id)).toEqual(state.transactions.slice(0, 5).map((t) => t.id));
  });
  it("empty ledger is safe", () => {
    const empty = { accounts: state.accounts, transactions: [] };
    const m = buildOverview(empty, allBalances(empty), totalCash(empty), "7D");
    expect(m.recent).toEqual([]);
    expect(m.categories.rows).toEqual([]);
  });
});
