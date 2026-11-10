"use client";

import { useSearchParams } from "next/navigation";
import { CATEGORY_NAMES } from "@/lib/data";
import { useLedger } from "@/state/LedgerProvider";
import { filtersFromParams } from "./filters";
import { TransactionsView } from "./TransactionsView";

/** Reads URL params (q, account, category, type, status, range, min, max). A new query string re-initialises the view. */
export function TransactionsScreen() {
  const params = useSearchParams();
  const { accounts } = useLedger();
  const initial = filtersFromParams(params, { accounts: accounts.map((a) => a.id), categories: CATEGORY_NAMES });
  return <TransactionsView key={params.toString()} initialFilters={initial} />;
}
