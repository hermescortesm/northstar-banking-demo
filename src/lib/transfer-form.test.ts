import { describe, expect, it } from "vitest";
import { createInitialLedgerState } from "./data";
import { applyTransfer, totalCash } from "./ledger";
import { fieldDomId, firstErrorField, formatAmountOnBlur, makeRequestId, memoCounter, reviewBalances, submitFailureMessage } from "./transfer-form";

describe("transfer-form helpers", () => {
  it("makes deterministic padded request ids", () => {
    expect(makeRequestId(1)).toBe("req_0001");
    expect(makeRequestId(1)).not.toBe(makeRequestId(2));
  });
  it("finds the first error in visual order", () => {
    expect(firstErrorField({})).toBeNull();
    expect(firstErrorField({ memo: "m", amount: "a" })).toBe("amount");
    expect(firstErrorField({ memo: "m", to: "t", amount: "a" })).toBe("to");
  });
  it("maps fields to focus targets", () => {
    expect(fieldDomId("amount", { fromAccountId: "op", toAccountId: "rs" })).toBe("xf-amount");
    expect(fieldDomId("to", { fromAccountId: "op", toAccountId: "rs" })).toBe("xf-to-rs");
    expect(fieldDomId("from", { fromAccountId: "", toAccountId: "" })).toBe("xf-from-op");
  });
  it("formats valid amounts on blur and leaves invalid text alone", () => {
    expect(formatAmountOnBlur("1250")).toBe("1,250.00");
    expect(formatAmountOnBlur("$5.5")).toBe("5.50");
    expect(formatAmountOnBlur("12.345")).toBe("12.345");
    expect(formatAmountOnBlur("abc")).toBe("abc");
    expect(formatAmountOnBlur("")).toBe("");
  });
  it("renders the memo counter and failure message", () => {
    expect(memoCounter("abc", 60)).toBe("3/60");
    expect(submitFailureMessage({ amount: "Insufficient funds." })).toBe(
      "This transfer is no longer valid: Insufficient funds. Edit the details and try again.",
    );
  });
  it("computes review balances that match the applied result", () => {
    const s = createInitialLedgerState();
    const r = reviewBalances(s, "op", "rs", 12345);
    const res = applyTransfer(s, { requestId: "r1", fromAccountId: "op", toAccountId: "rs", amount: "123.45", memo: "" });
    expect(res.status).toBe("applied");
    if (res.status !== "applied") return;
    const after = reviewBalances(res.state, "op", "rs", 0);
    expect(after.from.before).toBe(r.from.after);
    expect(after.to.before).toBe(r.to.after);
    expect(totalCash(res.state).postedCents).toBe(totalCash(s).postedCents);
  });
});
