import { describe, expect, it } from "vitest";
import { createInitialLedgerState, TODAY } from "@/lib/data";
import {
  activeFilterCount, amountBounds, EMPTY_FILTERS, filterTransactions, filtersFromParams, matchesQuery,
  nextSort, pageCount, pageItems, sortTransactions, totalsOf, type Filters,
} from "./filters";

const { transactions: all } = createInitialLedgerState();
const f = (p: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...p });

describe("filterTransactions", () => {
  it("returns everything with empty filters", () => {
    expect(filterTransactions(all, EMPTY_FILTERS)).toHaveLength(all.length);
  });
  it("searches merchant, description and reference case-insensitively", () => {
    const t = all[0];
    expect(matchesQuery(t, t.merchant.toUpperCase())).toBe(true);
    expect(matchesQuery(t, t.reference)).toBe(true);
    expect(matchesQuery(t, `  ${t.description.slice(0, 5)}  `)).toBe(true);
    expect(matchesQuery(t, "zzzz-no-such-thing")).toBe(false);
    const hits = filterTransactions(all, f({ q: "stripe" }));
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((x) => `${x.merchant} ${x.description} ${x.reference}`.toLowerCase().includes("stripe"))).toBe(true);
  });
  it("filters by direction, status, account, category", () => {
    expect(filterTransactions(all, f({ direction: "in" })).every((t) => t.amountCents > 0)).toBe(true);
    expect(filterTransactions(all, f({ direction: "out" })).every((t) => t.amountCents < 0)).toBe(true);
    expect(filterTransactions(all, f({ status: "failed" }))).toHaveLength(2);
    expect(filterTransactions(all, f({ account: "rs" })).every((t) => t.accountId === "rs")).toBe(true);
    expect(filterTransactions(all, f({ category: "Rent" })).every((t) => t.category === "Rent")).toBe(true);
  });
  it("date range excludes rows on or before today minus N days", () => {
    const r = filterTransactions(all, f({ range: "7D" }));
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((t) => t.day > TODAY - 7)).toBe(true);
  });
  it("amount bounds compare absolute cents; invalid or inverted bounds are ignored", () => {
    const r = filterTransactions(all, f({ min: "1,000", max: "2000.00" }));
    expect(r.every((t) => Math.abs(t.amountCents) >= 100000 && Math.abs(t.amountCents) <= 200000)).toBe(true);
    expect(filterTransactions(all, f({ min: "abc" }))).toHaveLength(all.length);
    expect(filterTransactions(all, f({ min: "500", max: "100" }))).toHaveLength(all.length);
    expect(amountBounds({ min: "0", max: "" })).toEqual({ min: 0, max: null, error: "" });
    expect(amountBounds({ min: "x", max: "" }).error).toMatch(/Enter amounts as numbers/);
    expect(amountBounds({ min: "5", max: "1" }).error).toMatch(/minimum amount is higher/);
  });
});

describe("sort, count, totals, paging", () => {
  it("sorts by date, merchant and amount in both directions", () => {
    expect(sortTransactions(all, "date", "desc")[0]).toBe(all[0]);
    expect(sortTransactions(all, "date", "asc")[0]).toBe(all[all.length - 1]);
    const m = sortTransactions(all, "merchant", "asc");
    expect(m[0].merchant.localeCompare(m[m.length - 1].merchant)).toBeLessThanOrEqual(0);
    const a = sortTransactions(all, "amount", "desc");
    expect(a[0].amountCents).toBeGreaterThanOrEqual(a[1].amountCents);
  });
  it("nextSort toggles the same key and picks sensible defaults for a new one", () => {
    expect(nextSort({ key: "date", dir: "desc" }, "date")).toEqual({ key: "date", dir: "asc" });
    expect(nextSort({ key: "date", dir: "desc" }, "merchant")).toEqual({ key: "merchant", dir: "asc" });
    expect(nextSort({ key: "date", dir: "desc" }, "amount")).toEqual({ key: "amount", dir: "desc" });
  });
  it("counts active filters (min+max count once)", () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(activeFilterCount(f({ q: " x ", min: "1", max: "2", status: "pending" }))).toBe(3);
  });
  it("totals exclude failed rows", () => {
    const failed = all.filter((t) => t.status === "failed");
    expect(failed.length).toBeGreaterThan(0);
    expect(totalsOf(failed)).toEqual({ inCents: 0, outCents: 0, netCents: 0 });
    const mix = totalsOf(all.slice(0, 50));
    expect(mix.netCents).toBe(mix.inCents - mix.outCents);
  });
  it("pagination helpers", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(12)).toBe(1);
    expect(pageCount(13)).toBe(2);
    const labels = pageItems(20, 10).map((i) => (i.gap ? "…" : String(i.page)));
    expect(labels).toEqual(["1", "…", "9", "10", "11", "…", "20"]);
    expect(pageItems(3, 1).map((i) => (i.gap ? "…" : i.page))).toEqual([1, 2, 3]);
  });
});

describe("filtersFromParams", () => {
  const valid = { accounts: ["op", "pr", "rs"], categories: ["Rent", "Transfer"] };
  it("reads known params and drops invalid values", () => {
    const p = new URLSearchParams("q=%20aws%20&account=pr&category=Rent&type=out&status=pending&range=30D&min=5");
    expect(filtersFromParams(p, valid)).toEqual(
      f({ q: "aws", account: "pr", category: "Rent", direction: "out", status: "pending", range: "30D", min: "5" }),
    );
    expect(filtersFromParams(new URLSearchParams("account=zz&category=Nope&direction=up&status=x&range=1Y"), valid)).toEqual(EMPTY_FILTERS);
  });
});
