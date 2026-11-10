"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { createInitialLedgerState } from "@/lib/data";
import { allBalances, applyTransfer, totalCash, type ApplyTransferResult, type CashTotals } from "@/lib/ledger";
import type { Account, AccountBalances, AccountId, LedgerState, Transaction, Transfer, TransferInput } from "@/lib/types";

export interface LedgerContextValue {
  accounts: readonly Account[];
  /** Newest first. */
  transactions: readonly Transaction[];
  transfers: readonly Transfer[];
  balances: Record<AccountId, AccountBalances>;
  totals: CashTotals;
  /** Validates and applies a transfer. Same requestId twice is a no-op ("duplicate"). */
  submitTransfer: (input: TransferInput) => ApplyTransferResult;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function LedgerProvider({ children, initialState }: { children: ReactNode; initialState?: LedgerState }) {
  const [state, setState] = useState<LedgerState>(() => initialState ?? createInitialLedgerState());
  // Ref mirrors state so rapid consecutive submits always see the latest ledger (double-click safe).
  const ref = useRef(state);

  const submitTransfer = useCallback((input: TransferInput) => {
    const result = applyTransfer(ref.current, input);
    if (result.state !== ref.current) {
      ref.current = result.state;
      setState(result.state);
    }
    return result;
  }, []);

  const value = useMemo<LedgerContextValue>(
    () => ({
      accounts: state.accounts,
      transactions: state.transactions,
      transfers: state.transfers,
      balances: allBalances(state),
      totals: totalCash(state),
      submitTransfer,
    }),
    [state, submitTransfer],
  );
  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerContextValue {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used within <LedgerProvider>");
  return ctx;
}
