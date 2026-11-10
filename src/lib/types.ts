import type { Cents } from "./money";

export type AccountId = "op" | "pr" | "rs";

export interface Account {
  id: AccountId;
  name: string;
  /** Short label used in lists, e.g. "Operating". */
  shortName: string;
  type: "Checking" | "Savings";
  /** Last four digits, shown as ••4821. */
  mask: string;
  /** Balance before the first transaction in the ledger (back-solved so today's posted balance hits the design target). */
  openingBalanceCents: Cents;
  apy?: string;
}

export type CategoryName =
  | "Revenue" | "Interest" | "Transfer" | "Payroll" | "Rent" | "Cloud & Infra" | "Software"
  | "Contractors" | "Marketing" | "Travel" | "Meals" | "Office" | "Equipment" | "Insurance" | "Taxes";

/** Design uses completed/pending/failed. "completed" == posted. */
export type TransactionStatus = "completed" | "pending" | "failed";
export type Direction = "in" | "out";

export interface Transaction {
  /** Deterministic counter id, txn_0001... */
  id: string;
  /** Counter behind id; also the tie-breaker for ordering. */
  seq: number;
  accountId: AccountId;
  /** ISO date YYYY-MM-DD. */
  date: string;
  /** Days since 1970-01-01 (derived from date). */
  day: number;
  /** Minutes since midnight; used for ordering within a day. */
  minutes: number;
  /** Display time, e.g. "9:41 AM". */
  time: string;
  merchant: string;
  description: string;
  category: CategoryName;
  /** Signed integer cents: positive money in, negative money out. */
  amountCents: Cents;
  direction: Direction;
  status: TransactionStatus;
  /** "ACH", "Wire", "Debit card ••4417", "Internal transfer", "Interest credit". */
  method: string;
  /** Reference like NS-261109-1234 or SIM-0001. */
  reference: string;
  /** Failure explanation for failed rows. */
  reason: string | null;
  /** Stripe payout rows (used for pending copy). */
  payout: boolean;
  /** Created by the transfer simulation. */
  simulated: boolean;
  /** Set on the two legs created by a transfer. */
  transferId: string | null;
}

export interface Transfer {
  /** xfer_0001... */
  id: string;
  /** Idempotency key supplied by the caller. */
  requestId: string;
  fromAccountId: AccountId;
  toAccountId: AccountId;
  amountCents: Cents;
  memo: string;
  /** SIM-0001 */
  reference: string;
  date: string;
  debitTransactionId: string;
  creditTransactionId: string;
}

export interface LedgerState {
  accounts: readonly Account[];
  /** Newest first. */
  transactions: readonly Transaction[];
  transfers: readonly Transfer[];
  nextTransactionSeq: number;
  nextTransferSeq: number;
  appliedRequestIds: readonly string[];
}

export interface AccountBalances {
  accountId: AccountId;
  /** Opening plus completed transactions. */
  postedCents: Cents;
  /** Net of pending transactions (incoming positive, outgoing negative). */
  pendingCents: Cents;
  /** Posted plus pending outgoing only; what can be spent. */
  availableCents: Cents;
}

export interface TransferInput {
  /** Idempotency key / request id. Re-applying the same key is a no-op. */
  requestId: string;
  fromAccountId: AccountId | "" | null;
  toAccountId: AccountId | "" | null;
  /** Raw amount text as typed. */
  amount: string;
  memo: string;
}

export type TransferErrors = Partial<Record<"from" | "to" | "amount" | "memo" | "requestId", string>>;
