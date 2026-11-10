import { accountBalances } from "./ledger";
import { centsToInputValue, formatCents, parseAmountInput, type Cents } from "./money";
import type { AccountId, LedgerState, TransferErrors, TransferInput } from "./types";

/** Visual/focus order of the form fields. */
export const FIELD_ORDER = ["from", "to", "amount", "memo"] as const;
export type TransferField = (typeof FIELD_ORDER)[number];

/** One idempotency key per transfer attempt, derived from a caller-owned counter (deterministic, no randomness). */
export function makeRequestId(n: number): string {
  return "req_" + String(n).padStart(4, "0");
}

/**
 * Key for the NEXT transfer, derived from the ledger so it is unique per attempt across page remounts.
 * Retrying the same attempt (double click) sees the same ledger and therefore the same key.
 */
export function nextRequestId(appliedTransferCount: number): string {
  return makeRequestId(appliedTransferCount + 1);
}

export function firstErrorField(errors: TransferErrors): TransferField | null {
  return FIELD_ORDER.find((f) => errors[f]) ?? null;
}

/** DOM id of the element that should receive focus for a field error. */
export function fieldDomId(field: TransferField, form: Pick<TransferInput, "fromAccountId" | "toAccountId">): string {
  if (field === "amount") return "xf-amount";
  if (field === "memo") return "xf-memo";
  const picked = field === "from" ? form.fromAccountId : form.toAccountId;
  return `xf-${field}-${picked || "op"}`;
}

/** Re-formats a valid amount as "1,250.00" (on blur); anything else is returned untouched so errors can explain it. */
export function formatAmountOnBlur(text: string): string {
  const r = parseAmountInput(text);
  return r.ok ? centsToInputValue(r.cents) : text;
}

export function memoCounter(memo: string, max: number): string {
  return `${memo.length}/${max}`;
}

export function submitFailureMessage(errors: TransferErrors): string {
  const reason = errors.amount || errors.to || errors.from || errors.memo || "Please check the details.";
  return `This transfer is no longer valid: ${reason} Edit the details and try again.`;
}

export interface ReviewSide { id: AccountId; before: string; after: string }

/** Posted balances before and after the transfer, as shown on the review step. */
export function reviewBalances(
  state: Pick<LedgerState, "accounts" | "transactions">,
  fromId: AccountId,
  toId: AccountId,
  cents: Cents,
): { from: ReviewSide; to: ReviewSide } {
  const posted = (id: AccountId) => {
    const a = state.accounts.find((x) => x.id === id)!;
    return accountBalances(a, state.transactions).postedCents;
  };
  const f = posted(fromId);
  const t = posted(toId);
  return {
    from: { id: fromId, before: formatCents(f), after: formatCents(f - cents) },
    to: { id: toId, before: formatCents(t), after: formatCents(t + cents) },
  };
}
