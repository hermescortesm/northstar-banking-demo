import { describe, expect, it } from "vitest";
import { CATEGORIES, CATEGORY_NAMES, MEMO_MAX, TODAY, TODAY_ISO, createInitialLedgerState } from "./data";
import {
  accountBalances, allBalances, applyTransfer, bucketsFor, cashFlowSeries, categoryBreakdown, monthBuckets, rangeBuckets,
  rangeStats, summarizePeriod, totalCash, totalPostedAt, validateTransfer,
} from "./ledger";
import { sumBy } from "./money";
import type { LedgerState, TransferInput } from "./types";

function deepFreeze<T>(o: T): T {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o as object)) deepFreeze(v);
  }
  return o;
}
const fresh = () => createInitialLedgerState();
const input = (over: Partial<TransferInput> = {}): TransferInput => ({
  requestId: "req-1", fromAccountId: "rs", toAccountId: "op", amount: "1,250.00", memo: "", ...over,
});

describe("dataset", () => {
  it("is deterministic across calls", () => {
    expect(fresh()).toEqual(fresh());
    expect(JSON.stringify(fresh())).toBe(JSON.stringify(fresh()));
  });
  it("has the design volume and unique counter ids", () => {
    const s = fresh();
    expect(s.transactions.length).toBe(506);
    expect(new Set(s.transactions.map((t) => t.id)).size).toBe(506);
    expect(s.transactions.every((t) => /^txn_\d{4}$/.test(t.id))).toBe(true);
    expect(s.nextTransactionSeq).toBe(507);
  });
  it("uses integer cents only, consistent direction, nothing in the future", () => {
    for (const t of fresh().transactions) {
      expect(Number.isInteger(t.amountCents)).toBe(true);
      expect(t.amountCents).not.toBe(0);
      expect(t.direction).toBe(t.amountCents > 0 ? "in" : "out");
      expect(t.day).toBeLessThanOrEqual(TODAY);
      expect(CATEGORY_NAMES).toContain(t.category);
    }
    for (const a of fresh().accounts) expect(Number.isInteger(a.openingBalanceCents)).toBe(true);
  });
  it("sorted newest first", () => {
    const tx = fresh().transactions;
    for (let i = 1; i < tx.length; i++) expect(tx[i - 1].day >= tx[i].day).toBe(true);
  });
  it("hits the design's posted balance targets and total", () => {
    const b = allBalances(fresh());
    expect(b.op.postedCents).toBe(84261538);
    expect(b.pr.postedCents).toBe(21488000);
    expect(b.rs.postedCents).toBe(156240971);
    expect(totalCash(fresh()).postedCents).toBe(261990509);
  });
  it("has the design's failed and pending rows", () => {
    const tx = fresh().transactions;
    expect(tx.filter((t) => t.status === "failed").map((t) => t.date).sort()).toEqual(["2026-10-26", "2026-11-06"]);
    const pending = tx.filter((t) => t.status === "pending");
    expect(pending.length).toBe(4);
    expect(pending.every((t) => t.day >= TODAY - 1)).toBe(true);
    expect(tx.some((t) => t.merchant === "Stripe" && t.status === "pending" && t.payout)).toBe(true);
  });
  it("transfers internal pairs net to zero", () => {
    const s = fresh();
    expect(sumBy(s.transactions.filter((t) => t.category === "Transfer" && t.status === "completed"), (t) => t.amountCents)).toBe(0);
  });
  it("covers every category color", () => {
    for (const n of CATEGORY_NAMES) expect(CATEGORIES[n].color).toMatch(/^#[0-9A-F]{6}$/);
  });
});

describe("balances", () => {
  it("sum of completed tx per account == posted - opening", () => {
    const s = fresh();
    for (const a of s.accounts) {
      const sum = sumBy(s.transactions.filter((t) => t.accountId === a.id && t.status === "completed"), (t) => t.amountCents);
      expect(accountBalances(a, s.transactions).postedCents - a.openingBalanceCents).toBe(sum);
    }
  });
  it("available = posted + pending outgoing only; failed ignored", () => {
    const s = fresh();
    const op = s.accounts.find((a) => a.id === "op")!;
    const b = accountBalances(op, s.transactions);
    const pendOut = sumBy(s.transactions.filter((t) => t.accountId === "op" && t.status === "pending" && t.amountCents < 0), (t) => t.amountCents);
    const pendIn = sumBy(s.transactions.filter((t) => t.accountId === "op" && t.status === "pending" && t.amountCents > 0), (t) => t.amountCents);
    expect(b.availableCents).toBe(b.postedCents + pendOut);
    expect(b.pendingCents).toBe(pendOut + pendIn);
    expect(b.pendingCents).toBe(7937440);
  });
  it("total cash equals sum of accounts and totalPostedAt(today)", () => {
    const s = fresh();
    const b = allBalances(s);
    const t = totalCash(s);
    expect(t.postedCents).toBe(sumBy(s.accounts, (a) => b[a.id].postedCents));
    expect(totalPostedAt(s, TODAY)).toBe(t.postedCents);
    expect(totalPostedAt(s, TODAY - 400)).toBe(sumBy(s.accounts, (a) => a.openingBalanceCents) + sumBy(s.transactions.filter((x) => x.status === "completed" && x.day <= TODAY - 400), (x) => x.amountCents));
  });
});

describe("summaries and series", () => {
  it("period summary excludes transfers, pending and failed; in - out == net", () => {
    const s = fresh();
    const p = summarizePeriod(s.transactions, TODAY - 29, TODAY);
    expect(p.netCents).toBe(p.inCents - p.outCents);
    const manual = s.transactions.filter((t) => t.status === "completed" && t.category !== "Transfer" && t.day >= TODAY - 29);
    expect(p.inCents).toBe(sumBy(manual.filter((t) => t.amountCents > 0), (t) => t.amountCents));
    expect(p.outCents).toBe(-sumBy(manual.filter((t) => t.amountCents < 0), (t) => t.amountCents));
    expect(summarizePeriod(s.transactions, TODAY + 1, TODAY + 10)).toEqual({ inCents: 0, outCents: 0, netCents: 0 });
  });
  it("buckets have the design shapes", () => {
    expect(rangeBuckets("7D")).toHaveLength(7);
    expect(rangeBuckets("30D")).toHaveLength(30);
    expect(rangeBuckets("90D")).toHaveLength(13);
    expect(rangeBuckets("12M")).toHaveLength(12);
    const m = rangeBuckets("12M");
    expect(m[11].endDay).toBe(TODAY);
    expect(m[11].long).toBe("November 2026 (to date)");
    expect(m[0].short).toBe("Dec");
    expect(rangeBuckets("30D")[29].endDay).toBe(TODAY);
    expect(bucketsFor("month", 6)).toEqual(monthBuckets(6));
  });
  it("series buckets partition the range: sum of points == range summary; balances chain", () => {
    const s = fresh();
    for (const r of ["7D", "30D", "90D", "12M"] as const) {
      const st = rangeStats(s, r);
      expect(sumBy(st.points, (p) => p.inCents)).toBe(st.current.inCents);
      expect(sumBy(st.points, (p) => p.outCents)).toBe(st.current.outCents);
      expect(st.endBalanceCents).toBe(totalCash(s).postedCents);
      expect(st.points[st.points.length - 1].balanceCents).toBe(st.endBalanceCents);
      expect(st.startBalanceCents + sumBy(s.transactions.filter((t) => t.status === "completed" && t.day >= st.startDay), (t) => t.amountCents)).toBe(st.endBalanceCents);
    }
  });
  it("transfers never change cash-flow series", () => {
    const s = fresh();
    const r = applyTransfer(s, input());
    if (r.status !== "applied") throw new Error("expected applied");
    const b = bucketsFor("day", 30);
    expect(cashFlowSeries(r.state, b)).toEqual(cashFlowSeries(s, b));
  });
  it("category breakdown sums to total spend with Other remainder", () => {
    const s = fresh();
    const st = rangeStats(s, "30D");
    const { rows, totalCents } = categoryBreakdown(st.categories, 5);
    expect(rows.length).toBeLessThanOrEqual(6);
    expect(sumBy(rows, (r) => r.cents)).toBe(totalCents);
    expect(totalCents).toBe(st.current.outCents);
    expect(Math.round(rows.reduce((a, r) => a + r.percent, 0))).toBe(100);
    for (let i = 1; i < rows.length - 1; i++) expect(rows[i - 1].cents).toBeGreaterThanOrEqual(rows[i].cents);
    expect(categoryBreakdown({}).rows).toEqual([]);
  });
});

describe("validateTransfer", () => {
  const s = fresh();
  const errs = (over: Partial<TransferInput>) => validateTransfer(s, input(over)).errors;
  it("accepts a good transfer", () => {
    expect(validateTransfer(s, input())).toEqual({ errors: {}, cents: 125000 });
  });
  it("missing accounts", () => {
    expect(errs({ fromAccountId: "" }).from).toBe("Choose the account to transfer from.");
    expect(errs({ toAccountId: null }).to).toBe("Choose the account to transfer to.");
    expect(errs({ fromAccountId: "zz" as never }).from).toMatch(/doesn't exist/);
    expect(errs({ toAccountId: "zz" as never }).to).toMatch(/doesn't exist/);
  });
  it("same account", () => expect(errs({ fromAccountId: "op", toAccountId: "op" }).to).toBe("Choose a different account than the source."));
  it("empty, junk, zero, negative, >2 decimals", () => {
    expect(errs({ amount: "" }).amount).toBe("Enter an amount.");
    expect(errs({ amount: "abc" }).amount).toBe("Enter a dollar amount, like 1,250.00.");
    expect(errs({ amount: "NaN" }).amount).toBeDefined();
    expect(errs({ amount: "0" }).amount).toBe("Amount must be greater than $0.00.");
    expect(errs({ amount: "0.00" }).amount).toBe("Amount must be greater than $0.00.");
    expect(errs({ amount: "-5" }).amount).toBe("Amount must be greater than $0.00.");
    expect(errs({ amount: "1.001" }).amount).toMatch(/two decimal/);
  });
  it("insufficient funds checks AVAILABLE, boundary exact", () => {
    const avail = allBalances(s).op.availableCents; // 84119298, below posted 84261538
    expect(errs({ fromAccountId: "op", toAccountId: "rs", amount: "841,192.98" })).toEqual({});
    expect(errs({ fromAccountId: "op", toAccountId: "rs", amount: "841,192.99" }).amount).toBe(
      "Insufficient funds. Operating Checking has $841,192.98 available.");
    expect(avail).toBe(84119298);
    expect(errs({ fromAccountId: "op", toAccountId: "rs", amount: "842,615.38" }).amount).toMatch(/Insufficient funds/);
  });
  it("memo length", () => {
    expect(errs({ memo: "x".repeat(MEMO_MAX) }).memo).toBeUndefined();
    expect(errs({ memo: "x".repeat(MEMO_MAX + 1) }).memo).toBe("Keep the note under 60 characters.");
  });
});

describe("applyTransfer", () => {
  it("creates exactly one debit and one credit, preserving total cash", () => {
    const s = fresh();
    const before = totalCash(s);
    const r = applyTransfer(s, input());
    expect(r.status).toBe("applied");
    if (r.status !== "applied") return;
    expect(r.state.transactions.length).toBe(s.transactions.length + 2);
    const fresh2 = r.state.transactions.filter((t) => t.transferId === r.transfer.id);
    expect(fresh2).toHaveLength(2);
    const debit = fresh2.find((t) => t.direction === "out")!;
    const credit = fresh2.find((t) => t.direction === "in")!;
    expect(debit).toMatchObject({ accountId: "rs", amountCents: -125000, id: "txn_0507", status: "completed", simulated: true, category: "Transfer", date: TODAY_ISO });
    expect(credit).toMatchObject({ accountId: "op", amountCents: 125000, id: "txn_0508", simulated: true });
    expect(debit.merchant).toBe("Transfer to Operating Checking ••4821");
    expect(credit.merchant).toBe("Transfer from Reserve Savings ••7730");
    expect(r.transfer).toMatchObject({ id: "xfer_0001", reference: "SIM-0001", debitTransactionId: "txn_0507", creditTransactionId: "txn_0508", amountCents: 125000 });
    expect(debit.reference).toBe("SIM-0001");
    const after = totalCash(r.state);
    expect(after.postedCents).toBe(before.postedCents);
    expect(after.availableCents).toBe(before.availableCents);
    const b0 = allBalances(s), b1 = allBalances(r.state);
    expect(b1.rs.postedCents).toBe(b0.rs.postedCents - 125000);
    expect(b1.op.postedCents).toBe(b0.op.postedCents + 125000);
    expect(b1.pr).toEqual(b0.pr);
    expect(r.state.transactions.slice(0, 2).map((t) => t.simulated)).toEqual([true, true]); // newest first
  });
  it("uses memo as description, default otherwise", () => {
    const a = applyTransfer(fresh(), input({ memo: "  Rainy day  " }));
    const b = applyTransfer(fresh(), input());
    if (a.status !== "applied" || b.status !== "applied") throw new Error();
    expect(a.transfer.memo).toBe("Rainy day");
    expect(a.state.transactions[0].description).toBe("Rainy day");
    expect(b.state.transactions[0].description).toBe("Internal transfer");
  });
  it("ids are unique and counter-based across several transfers", () => {
    let s = fresh();
    const refs: string[] = [];
    for (let i = 1; i <= 4; i++) {
      const r = applyTransfer(s, input({ requestId: `k${i}`, amount: "10.00" }));
      if (r.status !== "applied") throw new Error();
      s = r.state;
      refs.push(r.transfer.reference);
    }
    expect(refs).toEqual(["SIM-0001", "SIM-0002", "SIM-0003", "SIM-0004"]);
    expect(new Set(s.transactions.map((t) => t.id)).size).toBe(s.transactions.length);
    expect(s.nextTransactionSeq).toBe(515);
    expect(s.transfers.map((t) => t.id)).toEqual(["xfer_0004", "xfer_0003", "xfer_0002", "xfer_0001"]);
  });
  it("is deterministic: same inputs give identical states", () => {
    const a = applyTransfer(fresh(), input());
    const b = applyTransfer(fresh(), input());
    expect(a).toEqual(b);
  });
  it("duplicate request id is a no-op returning the same state and original transfer", () => {
    const r1 = applyTransfer(fresh(), input());
    if (r1.status !== "applied") throw new Error();
    const r2 = applyTransfer(r1.state, input({ amount: "999.00" })); // even with different payload
    expect(r2.status).toBe("duplicate");
    expect(r2.state).toBe(r1.state);
    if (r2.status === "duplicate") expect(r2.transfer).toBe(r1.transfer);
    expect(r2.state.transactions.length).toBe(fresh().transactions.length + 2);
  });
  it("a new key applies again", () => {
    const r1 = applyTransfer(fresh(), input());
    if (r1.status !== "applied") throw new Error();
    expect(applyTransfer(r1.state, input({ requestId: "req-2" })).status).toBe("applied");
  });
  it("invalid input returns the same state untouched and does not consume the key", () => {
    const s = fresh();
    const bad = applyTransfer(s, input({ amount: "0" }));
    expect(bad.status).toBe("invalid");
    expect(bad.state).toBe(s);
    const good = applyTransfer(bad.state, input());
    expect(good.status).toBe("applied");
  });
  it("rejects missing request id", () => {
    const r = applyTransfer(fresh(), input({ requestId: "" }));
    expect(r.status).toBe("invalid");
    if (r.status === "invalid") expect(r.errors.requestId).toBeDefined();
  });
  it("cannot overdraw: second transfer of full balance fails", () => {
    const s0 = fresh();
    const all = allBalances(s0).pr.availableCents; // 214,880.00
    const r1 = applyTransfer(s0, input({ fromAccountId: "pr", toAccountId: "op", amount: "214,880.00" }));
    expect(r1.status).toBe("applied");
    const r2 = applyTransfer(r1.state, input({ requestId: "r2", fromAccountId: "pr", toAccountId: "op", amount: "0.01" }));
    expect(r2.status).toBe("invalid");
    expect(all).toBe(21488000);
    if (r1.status === "applied") expect(allBalances(r1.state).pr.availableCents).toBe(0);
  });
  it("is immutable: works on deeply frozen state and never mutates it", () => {
    const s: LedgerState = deepFreeze(fresh());
    const snapshot = JSON.stringify(s);
    const r = applyTransfer(s, input());
    expect(r.status).toBe("applied");
    expect(JSON.stringify(s)).toBe(snapshot);
    if (r.status === "applied") {
      expect(r.state).not.toBe(s);
      expect(r.state.transactions).not.toBe(s.transactions);
      expect(r.state.accounts).toBe(s.accounts);
    }
    expect(Object.isFrozen(s.transactions)).toBe(true);
  });
});
