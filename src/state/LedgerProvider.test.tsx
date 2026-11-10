import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { LedgerProvider, useLedger } from "./LedgerProvider";

const wrapper = ({ children }: { children: ReactNode }) => <LedgerProvider>{children}</LedgerProvider>;
const req = { requestId: "a", fromAccountId: "rs", toAccountId: "op", amount: "100.00", memo: "" } as const;

describe("LedgerProvider", () => {
  it("throws outside the provider", () => {
    expect(() => renderHook(() => useLedger())).toThrow(/LedgerProvider/);
  });

  it("exposes seed data and derived totals", () => {
    const { result } = renderHook(() => useLedger(), { wrapper });
    expect(result.current.accounts).toHaveLength(3);
    expect(result.current.transactions).toHaveLength(506);
    expect(result.current.totals.postedCents).toBe(261990509);
    expect(result.current.balances.op.postedCents).toBe(84261538);
  });

  it("submitTransfer updates state and preserves total cash", () => {
    const { result } = renderHook(() => useLedger(), { wrapper });
    const total = result.current.totals.postedCents;
    act(() => { expect(result.current.submitTransfer(req).status).toBe("applied"); });
    expect(result.current.transactions).toHaveLength(508);
    expect(result.current.transfers).toHaveLength(1);
    expect(result.current.totals.postedCents).toBe(total);
    expect(result.current.balances.rs.postedCents).toBe(156240971 - 10000);
  });

  it("double submit in the same tick applies once", () => {
    const { result } = renderHook(() => useLedger(), { wrapper });
    act(() => {
      const a = result.current.submitTransfer(req);
      const b = result.current.submitTransfer(req);
      expect([a.status, b.status]).toEqual(["applied", "duplicate"]);
    });
    expect(result.current.transactions).toHaveLength(508);
  });
});
