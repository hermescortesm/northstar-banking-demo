"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { CATEGORIES, CATEGORY_NAMES } from "@/lib/data";
import { formatDayShort } from "@/lib/dates";
import { formatCents, formatSignedCents } from "@/lib/money";
import type { Transaction } from "@/lib/types";
import { useLedger } from "@/state/LedgerProvider";
import { TransactionDrawer } from "./TransactionDrawer";
import { TxIcon } from "./TxIcon";
import { accountLabel, CategoryTile, ghostBtn, outlineBtn, SimTag, STATUS_LABEL, StatusChip } from "./parts";
import {
  activeFilterCount, amountBounds, EMPTY_FILTERS, filterTransactions, nextSort, pageCount, pageItems,
  PAGE_SIZE, sortTransactions, totalsOf, type Filters, type SortDir, type SortKey,
} from "./filters";

const GRID =
  "grid items-center gap-4 px-5 grid-cols-[92px_minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_116px_136px] max-[1180px]:grid-cols-[92px_minmax(0,1.7fr)_minmax(0,1fr)_116px_136px] max-[720px]:grid-cols-[minmax(0,1fr)_auto] max-[720px]:gap-3";
const SELECT =
  "h-[38px] min-w-[130px] cursor-pointer appearance-none rounded-[10px] border border-border-strong bg-surface bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2378849A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_10px_center] bg-no-repeat pl-3 pr-[34px] text-sm text-text outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)] max-[720px]:h-11 max-[720px]:min-w-0 max-[720px]:flex-[1_1_140px]";
const AMT_INPUT =
  "h-[38px] w-[110px] rounded-[10px] border border-border-strong bg-surface px-3 text-sm text-text outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)] max-[720px]:h-11 max-[720px]:w-auto max-[720px]:min-w-0 max-[720px]:flex-[1_1_110px]";

function SortHeader({
  label, k, sort, onSort, className = "",
}: { label: string; k: SortKey; sort: { key: SortKey; dir: SortDir }; onSort: (k: SortKey) => void; className?: string }) {
  const on = sort.key === k;
  const state = on ? (sort.dir === "asc" ? "ascending" : "descending") : "not sorted";
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      aria-label={`Sort by ${label.toLowerCase()} (${state})`}
      className={`inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent py-1 text-xs font-medium hover:text-text ${
        on ? "text-text" : "text-text-3"
      } ${className}`}
    >
      {label}
      <TxIcon name={on ? (sort.dir === "asc" ? "chevUp" : "chevDown") : "chevUpDown"} size={14} />
    </button>
  );
}

function Select({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select id={id} className={SELECT} value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
    </>
  );
}

function Row({ t, accountText, onOpen }: { t: Transaction; accountText: string; onOpen: (t: Transaction, el: HTMLElement) => void }) {
  const incoming = t.amountCents > 0;
  const date = formatDayShort(t.day);
  const cat = CATEGORIES[t.category];
  return (
    <button
      type="button"
      onClick={(e) => onOpen(t, e.currentTarget)}
      aria-label={`${t.merchant}, ${formatSignedCents(t.amountCents)}, ${STATUS_LABEL[t.status]}, ${date}`}
      className={`${GRID} min-h-[62px] w-full cursor-pointer border-0 border-b border-border bg-transparent py-2.5 text-left transition-colors hover:bg-surface-2`}
    >
      <span className="text-[13px] text-text-2 max-[720px]:hidden">{date}</span>
      <span className="flex min-w-0 items-center gap-3">
        <CategoryTile category={t.category} />
        <span className="min-w-0">
          <span className="block truncate font-medium">
            {t.merchant}
            {t.simulated && <SimTag />}
          </span>
          <span className="block truncate text-xs text-text-3">{t.description}</span>
          <span className="hidden truncate text-xs text-text-3 max-[720px]:block">
            {date} · {STATUS_LABEL[t.status]}
          </span>
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-2 text-[13px] text-text-2 max-[720px]:hidden">
        <i className="size-2 flex-none rounded-sm" style={{ background: cat.color }} />
        <span className="truncate">{t.category}</span>
      </span>
      <span className="truncate text-[13px] text-text-2 max-[1180px]:hidden">{accountText}</span>
      <span className="max-[720px]:hidden"><StatusChip status={t.status} /></span>
      <span className="flex flex-col items-end gap-0.5 text-right">
        <span className={`num whitespace-nowrap font-medium ${incoming ? "text-pos" : ""} ${t.status === "failed" ? "line-through decoration-text-3/60" : ""}`}>
          {formatSignedCents(t.amountCents)}
        </span>
        <span className="max-w-full truncate text-xs text-text-3">{t.method}</span>
      </span>
    </button>
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
          <div className="relative min-w-[260px] flex-[1_1_260px] max-[720px]:min-w-full">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-3"><TxIcon name="search" size={16} /></span>
            <label htmlFor="txq" className="sr-only">Search by merchant, description or reference</label>
            <input
              id="txq"
              type="search"
              autoComplete="off"
              placeholder="Search merchant, description or reference"
              value={filters.q}
              onChange={(e) => patch({ q: e.target.value })}
              className="h-[38px] w-full rounded-full border border-border bg-surface-2 pl-[38px] pr-3 text-sm outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)] max-[720px]:h-11"
            />
          </div>
          <Select id="f-date" label="Date range" value={filters.range} onChange={(v) => patch({ range: v as Filters["range"] })}>
            <option value="all">All dates</option>
            <option value="7D">Last 7 days</option>
            <option value="30D">Last 30 days</option>
            <option value="90D">Last 90 days</option>
            <option value="12M">Last 12 months</option>
          </Select>
          <Select id="f-type" label="Direction" value={filters.direction} onChange={(v) => patch({ direction: v as Filters["direction"] })}>
            <option value="all">All directions</option>
            <option value="in">Money in</option>
            <option value="out">Money out</option>
          </Select>
          <Select id="f-cat" label="Category" value={filters.category} onChange={(v) => patch({ category: v as Filters["category"] })}>
            <option value="all">All categories</option>
            {CATEGORY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select id="f-status" label="Status" value={filters.status} onChange={(v) => patch({ status: v as Filters["status"] })}>
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </Select>
          <Select id="f-acct" label="Account" value={filters.account} onChange={(v) => patch({ account: v as Filters["account"] })}>
            <option value="all">All accounts</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.shortName} ••{a.mask}</option>)}
          </Select>
          <label htmlFor="f-min" className="sr-only">Minimum amount in dollars</label>
          <input id="f-min" className={AMT_INPUT} inputMode="decimal" placeholder="Min $" value={filters.min} onChange={(e) => patch({ min: e.target.value })} />
          <label htmlFor="f-max" className="sr-only">Maximum amount in dollars</label>
          <input id="f-max" className={AMT_INPUT} inputMode="decimal" placeholder="Max $" value={filters.max} onChange={(e) => patch({ max: e.target.value })} />
          {active > 0 && (
            <button type="button" className={`${ghostBtn} max-[720px]:h-11`} onClick={clear}>
              <TxIcon name="x" size={14} />
              Clear {active} {active === 1 ? "filter" : "filters"}
            </button>
          )}
        </div>

        {amtError && (
          <div role="alert" className="mx-5 mt-3 flex items-start gap-2.5 rounded-xl bg-neg-soft px-3.5 py-3 text-[13px] max-[720px]:mx-4">
            <span className="mt-px text-neg"><TxIcon name="alert" size={16} /></span>
            <span>{amtError}</span>
          </div>
        )}

        <div aria-live="polite" className="flex flex-wrap items-center gap-x-[18px] gap-y-1 border-b border-border bg-surface-2 px-5 py-2.5 text-[13px] text-text-3 max-[720px]:px-4">
          <span><b className="font-semibold text-text">{sorted.length.toLocaleString("en-US")}</b> results</span>
          <span>In <b className="num font-semibold text-text">{formatCents(totals.inCents)}</b></span>
          <span>Out <b className="num font-semibold text-text">{formatCents(totals.outCents)}</b></span>
          <span>Net <b className="num font-semibold text-text">{formatSignedCents(totals.netCents)}</b></span>
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
            {rows.map((t) => (
              <Row
                key={t.id}
                t={t}
                accountText={accountLabel(accounts, t.accountId)}
                onOpen={(tx, el) => { openerRef.current = el; setOpenId(tx.id); }}
              />
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[13px] text-text-3 max-[720px]:px-4">
              <span>
                Showing {(cur - 1) * PAGE_SIZE + 1}–{Math.min(cur * PAGE_SIZE, sorted.length)} of {sorted.length.toLocaleString("en-US")}
              </span>
              <nav aria-label="Pagination" className="flex items-center gap-1">
                <PageBtn label="Previous page" disabled={cur <= 1} onClick={() => setPage(cur - 1)}><TxIcon name="chevLeft" size={14} /></PageBtn>
                {pageItems(pages, cur).map((it) =>
                  it.gap ? (
                    <span key={it.key} aria-hidden="true" className="px-1">…</span>
                  ) : (
                    <PageBtn key={it.page} label={`Page ${it.page}`} current={it.page === cur} onClick={() => setPage(it.page)}>{it.page}</PageBtn>
                  ),
                )}
                <PageBtn label="Next page" disabled={cur >= pages} onClick={() => setPage(cur + 1)}><TxIcon name="chevRight" size={14} /></PageBtn>
              </nav>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5 px-6 py-14 text-center">
            <span aria-hidden="true" className="grid size-[52px] place-items-center rounded-[14px] border border-border bg-surface-2 text-text-3">
              <TxIcon name="search" />
            </span>
            <h3 className="text-base font-semibold">No transactions match these filters</h3>
            <p className="max-w-[380px] text-[13px] text-text-3">
              Try a different search term, widen the date range or clear filters to see all activity.
            </p>
            <button type="button" className={outlineBtn} onClick={clear}>Clear all filters</button>
          </div>
        )}
      </section>

      {open && <TransactionDrawer transaction={open} accounts={accounts} onClose={closeDrawer} onShowAll={showAllFrom} />}
    </>
  );
}

function PageBtn({
  label, current, disabled, onClick, children,
}: { label: string; current?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={current ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg border px-1 text-[13px] enabled:hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40 max-[720px]:h-11 max-[720px]:min-w-11 ${
        current ? "border-border-strong bg-surface font-semibold text-text" : "border-transparent bg-transparent text-text-2"
      }`}
    >
      {children}
    </button>
  );
}
