"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { CATEGORY_NAMES } from "@/lib/data";
import { Money } from "../ui/Money";
import { useLedger } from "@/state/LedgerProvider";
import { TransactionDrawer } from "./TransactionDrawer";
import { Icon } from "../icons";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Field } from "../ui/Field";
import { Input, SearchInput } from "../ui/Input";
import { Notice } from "../ui/Notice";
import { Pagination } from "../ui/Pagination";
import { Select } from "../ui/Select";
import { accountLabel, GRID } from "./parts";
import { SortHeader } from "./SortHeader";
import { TransactionRow } from "./TransactionRow";
import {
  activeFilterCount, amountBounds, EMPTY_FILTERS, filterTransactions, nextSort, pageCount, pageItems,
  PAGE_SIZE, sortTransactions, totalsOf, type Filters, type SortDir, type SortKey,
} from "./filters";

/** Toolbar select with a screen-reader-only label. */
function FilterSelect({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <Field id={id} label={label} hideLabel className="contents">
      {(p) => <Select {...p} value={value} onChange={(e) => onChange(e.target.value)}>{children}</Select>}
    </Field>
  );
}

/** Toolbar min/max amount box. */
function AmountFilter({ id, label, placeholder, value, onChange }: { id: string; label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field id={id} label={label} hideLabel className="contents">
      {(p) => (
        <Input {...p} size="md" inputMode="decimal" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="max-[720px]:w-auto max-[720px]:min-w-0 max-[720px]:flex-[1_1_110px] not-phone:w-[110px]" />
      )}
    </Field>
  );
}

export function TransactionsView({ initialFilters }: { initialFilters: Filters }) {
  const { accounts, transactions } = useLedger();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "date", dir: "desc" });
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const patch = useCallback((p: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...p }));
    setPage(1);
  }, []);
  const clear = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const filtered = useMemo(() => filterTransactions(transactions, filters), [transactions, filters]);
  const sorted = useMemo(() => sortTransactions(filtered, sort.key, sort.dir), [filtered, sort]);
  const totals = useMemo(() => totalsOf(filtered), [filtered]);
  const pages = pageCount(sorted.length);
  const cur = Math.min(page, pages);
  const rows = sorted.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  const active = activeFilterCount(filters);
  const amtError = amountBounds(filters).error;
  const open = openId ? transactions.find((t) => t.id === openId) : undefined;

  const closeDrawer = useCallback(() => {
    setOpenId(null);
    // Return focus to the row that opened the drawer once it is unmounted.
    const el = openerRef.current;
    requestAnimationFrame(() => el?.isConnected && el.focus());
  }, []);

  const showAllFrom = useCallback(
    (merchant: string) => {
      setFilters({ ...EMPTY_FILTERS, q: merchant });
      setPage(1);
      setOpenId(null);
      requestAnimationFrame(() => document.getElementById("txq")?.focus());
    },
    [],
  );

  return (
    <>
      <section className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <div role="search" aria-label="Filter transactions" className="flex flex-wrap items-center gap-2.5 border-b border-border px-5 py-4 max-[720px]:px-4">
          <Field id="txq" label="Search by merchant, description or reference" hideLabel className="flex min-w-[260px] flex-[1_1_260px] flex-col max-[720px]:min-w-full">
            {(p) => (
              <SearchInput {...p} placeholder="Search merchant, description or reference" value={filters.q} onChange={(e) => patch({ q: e.target.value })} />
            )}
          </Field>
          <FilterSelect id="f-date" label="Date range" value={filters.range} onChange={(v) => patch({ range: v as Filters["range"] })}>
            <option value="all">All dates</option>
            <option value="7D">Last 7 days</option>
            <option value="30D">Last 30 days</option>
            <option value="90D">Last 90 days</option>
            <option value="12M">Last 12 months</option>
          </FilterSelect>
          <FilterSelect id="f-type" label="Direction" value={filters.direction} onChange={(v) => patch({ direction: v as Filters["direction"] })}>
            <option value="all">All directions</option>
            <option value="in">Money in</option>
            <option value="out">Money out</option>
          </FilterSelect>
          <FilterSelect id="f-cat" label="Category" value={filters.category} onChange={(v) => patch({ category: v as Filters["category"] })}>
            <option value="all">All categories</option>
            {CATEGORY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
          </FilterSelect>
          <FilterSelect id="f-status" label="Status" value={filters.status} onChange={(v) => patch({ status: v as Filters["status"] })}>
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </FilterSelect>
          <FilterSelect id="f-acct" label="Account" value={filters.account} onChange={(v) => patch({ account: v as Filters["account"] })}>
            <option value="all">All accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.shortName} ••{a.mask}</option>)}
          </FilterSelect>
          <AmountFilter id="f-min" label="Minimum amount in dollars" placeholder="Min $" value={filters.min} onChange={(v) => patch({ min: v })} />
          <AmountFilter id="f-max" label="Maximum amount in dollars" placeholder="Max $" value={filters.max} onChange={(v) => patch({ max: v })} />
          {active > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <Icon name="x" size={14} />
              Clear {active} {active === 1 ? "filter" : "filters"}
            </Button>
          )}
        </div>

        {amtError && (
          <Notice tone="danger" role="alert" className="mx-5 mt-3 max-[720px]:mx-4">{amtError}</Notice>
        )}

        <div aria-live="polite" className="flex flex-wrap items-center gap-x-[18px] gap-y-1 border-b border-border bg-surface-2 px-5 py-2.5 text-[13px] text-text-3 max-[720px]:px-4">
          <span><b className="font-semibold text-text">{sorted.length.toLocaleString("en-US")}</b> results</span>
          <span>In <Money cents={totals.inCents} className="font-semibold text-text" /></span>
          <span>Out <Money cents={totals.outCents} className="font-semibold text-text" /></span>
          <span>Net <Money cents={totals.netCents} signed className="font-semibold text-text" /></span>
          <span className="ml-auto max-[720px]:hidden">Totals include posted and pending; failed excluded</span>
        </div>

        <div className={`${GRID} h-10 border-b border-border text-xs font-medium text-text-3 max-[720px]:hidden`}>
          <SortHeader label="Date" k="date" sort={sort} onSort={(k) => { setSort((s) => nextSort(s, k)); setPage(1); }} className="justify-self-start" />
          <SortHeader label="Merchant" k="merchant" sort={sort} onSort={(k) => { setSort((s) => nextSort(s, k)); setPage(1); }} className="justify-self-start" />
          <span>Category</span>
          <span className="max-[1180px]:hidden">Account</span>
          <span>Status</span>
          <SortHeader label="Amount" k="amount" sort={sort} onSort={(k) => { setSort((s) => nextSort(s, k)); setPage(1); }} className="justify-self-end" />
        </div>

        {rows.length > 0 ? (
          <div>
            {rows.map((t, i) => (
              <TransactionRow
                key={t.id}
                i={i}
                t={t}
                accountText={accountLabel(accounts, t.accountId)}
                onOpen={(tx, el) => { openerRef.current = el; setOpenId(tx.id); }}
              />
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[13px] text-text-3 max-[720px]:px-4">
              <span>
                Showing {(cur - 1) * PAGE_SIZE + 1}-{Math.min(cur * PAGE_SIZE, sorted.length)} of {sorted.length.toLocaleString("en-US")}
              </span>
              <Pagination items={pageItems(pages, cur)} current={cur} last={pages} onPage={setPage} />
            </div>
          </div>
        ) : (
          <EmptyState
            icon="search"
            title="No transactions match these filters"
            action={<Button onClick={clear}>Clear all filters</Button>}
          >
            Try a different search term, widen the date range or clear filters to see all activity.
          </EmptyState>
        )}
      </section>

      {open && <TransactionDrawer transaction={open} accounts={accounts} onClose={closeDrawer} onShowAll={showAllFrom} />}
    </>
  );
}
