"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, isIconName, type IconName } from "@/components/icons";
import { TODAY } from "@/lib/data";
import { formatDayLong } from "@/lib/dates";
import type { RangeKey } from "@/lib/ledger";
import { RANGE_KEYS, buildOverview, type Insight } from "@/lib/overview";
import { useLedger } from "@/state/LedgerProvider";
import { BalanceChart } from "./BalanceChart";
import { transactionsHref } from "./links";

const card = "rounded-card border border-border bg-surface";
const cardH = "flex flex-wrap items-center justify-between gap-3 px-5 pt-[18px]";
const h2 = "text-[15px] font-semibold tracking-[-0.01em]";
const sub = "text-[13px] text-text-3";
const rowTitle = "block font-medium";
const rowSub = "block text-xs text-text-3";
const swatch = "inline-block size-2 flex-none rounded-[2px]";
const tile = "grid size-9 flex-none place-items-center rounded-[10px]";
const btn =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-[15px] text-[13.5px] font-medium no-underline transition-[background,border-color,filter] active:translate-y-px not-phone:h-9";

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "bg-pos-soft text-pos" },
  pending: { label: "Pending", cls: "bg-warn-soft text-warn" },
  failed: { label: "Failed", cls: "bg-neg-soft text-neg" },
};

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

function insightIcon(i: Insight): IconName {
  return i.icon;
}

export function OverviewView() {
  const ledger = useLedger();
  const [range, setRange] = useState<RangeKey>("30D");
  const m = useMemo(
    () => buildOverview({ accounts: ledger.accounts, transactions: ledger.transactions }, ledger.balances, ledger.totals, range),
    [ledger.accounts, ledger.transactions, ledger.balances, ledger.totals, range],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-[18px]">
        <div>
          <h1 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.035em] max-[720px]:text-[28px]">
            Good morning, Avery
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-text-3">
            <span>{formatDayLong(TODAY)}</span>
            <span aria-hidden="true">·</span>
            <span>Fernhill Robotics, Inc.</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/transfers"
            className={`${btn} border-accent-fill bg-accent-fill !text-accent-ink hover:brightness-[1.07]`}
          >
            <Icon name="swap" size={16} />
            Transfer between accounts
          </Link>
          <Link href="/transactions" className={`${btn} border-border-strong bg-surface !text-text hover:bg-surface-2`}>
            <Icon name="transactions" size={16} />
            View transactions
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-stretch gap-5 max-[1180px]:grid-cols-1">
        <section
          aria-labelledby="tc-h"
          className={`${card} flex min-w-0 flex-col overflow-hidden px-6 pt-[22px] max-[720px]:px-[18px] max-[720px]:pt-5`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div id="tc-h" className="flex flex-wrap items-center gap-x-2 text-[13px] font-medium text-text-3">
                Total cash<span aria-hidden="true">·</span>
                <span data-testid="range-dates">{m.rangeDates}</span>
              </div>
              <div
                className="num mt-2.5 flex items-start leading-none"
                aria-label={`Total cash ${m.total.posted}`}
                data-testid="hero-total"
                data-cents={m.postedCents}
              >
                <span className="text-[56px] font-semibold leading-none tracking-[-0.045em] max-[720px]:text-[44px]">
                  {m.total.dollars}
                </span>
                <span className="ml-0.5 mt-[5px] text-2xl font-semibold leading-none tracking-[-0.02em] text-text-3 max-[720px]:text-xl">
                  {m.total.cents}
                </span>
              </div>
              <div className="mt-3.5 flex flex-wrap items-center gap-x-[18px] gap-y-2 text-[13px]">
                <span>
                  <span className="mr-1.5 text-text-3">Available</span>
                  <strong className="num font-semibold" data-testid="hero-available">{m.total.available}</strong>
                </span>
                <span>
                  <span className="mr-1.5 text-text-3">Pending</span>
                  <strong className="num font-semibold" data-testid="hero-pending">{m.total.pending}</strong>
                </span>
                <span
                  data-testid="hero-delta"
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    m.delta.negative ? "bg-neg-soft text-neg" : "bg-pos-soft text-pos"
                  }`}
                >
                  <Icon name={m.delta.negative ? "trendDown" : "trend"} size={14} />
                  {m.delta.label}
                </span>
                <span className="text-xs text-text-3">{m.delta.sub}</span>
              </div>
            </div>
            <div
              role="group"
              aria-label="Overview range"
              className="inline-flex flex-wrap gap-0.5 rounded-full border border-border bg-surface-2 p-[3px]"
            >
              {RANGE_KEYS.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={range === r}
                  onClick={() => setRange(r)}
                  className={`h-11 min-w-11 cursor-pointer rounded-full border-0 px-3 text-[13px] font-medium transition-colors not-phone:h-7 not-phone:min-w-0 ${
                    range === r ? "bg-text text-surface" : "bg-transparent text-text-2 hover:text-text"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <BalanceChart points={m.points} summary={m.chartSummary} />

          <div
            data-testid="kpis"
            className="-mx-6 mt-2 grid grid-cols-3 border-t border-border max-[720px]:-mx-[18px] max-[720px]:grid-cols-1"
          >
            {[
              { id: "in", label: "Money in", value: m.summary.in, note: m.summary.inChange, dot: "var(--chart-line)", color: "" },
              { id: "out", label: "Money out", value: m.summary.out, note: m.summary.outChange, dot: "var(--chart-out)", color: "" },
              {
                id: "net", label: "Net cash flow", value: m.summary.net, note: m.summary.netSub, dot: "",
                color: m.summary.netNegative ? "var(--neg)" : "var(--pos)",
              },
            ].map((k) => (
              <div
                key={k.id}
                data-testid={`kpi-${k.id}`}
                className="flex min-w-0 flex-col gap-1 border-r border-border px-6 pb-[18px] pt-4 last:border-r-0 max-[720px]:flex-row max-[720px]:flex-wrap max-[720px]:items-center max-[720px]:justify-between max-[720px]:border-b max-[720px]:border-r-0 max-[720px]:px-[18px] max-[720px]:py-3.5 max-[720px]:last:border-b-0"
              >
                <span className="flex items-center gap-1.5 text-xs text-text-3">
                  {k.dot && <i className={swatch} style={{ background: k.dot }} />}
                  {k.label}
                </span>
                <span
                  className="num whitespace-nowrap text-[22px] font-semibold tracking-[-0.035em]"
                  style={k.color ? { color: k.color } : undefined}
                  data-testid={`kpi-${k.id}-value`}
                >
                  {k.value}
                </span>
                <span className="text-xs text-text-3">{k.note}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-5 max-[1180px]:grid max-[1180px]:grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))]">
          <section aria-labelledby="ac-h" className={card}>
            <div className={`${cardH} !pb-3.5`}>
              <h2 id="ac-h" className={h2}>Accounts</h2>
              <span className={sub}>Posted balances</span>
            </div>
            {m.accounts.map((a) => (
              <Link
                key={a.id}
                href={transactionsHref({ account: a.id })}
                data-testid="account-card"
                data-account={a.id}
                data-cents={a.postedCents}
                className="flex items-center gap-3 border-t border-border px-5 py-3 !text-text no-underline transition-colors hover:bg-surface-2"
              >
                <span className={`${tile} bg-accent-soft text-accent`}>
                  <Icon name={a.type === "Savings" ? "wallet" : "accounts"} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={rowTitle}>{a.name}</span>
                  <span className={rowSub}>
                    {a.type} ••{a.mask}
                    {a.apy ? ` · ${a.apy} (simulated)` : ""}
                  </span>
                </span>
                <span className="text-right">
                  <span className={`${rowTitle} num`} data-testid="account-posted">{a.posted}</span>
                  <span className={`${rowSub} num`}>{a.pendingText}</span>
                </span>
              </Link>
            ))}
          </section>

          <section aria-labelledby="in-h" className={card}>
            <div className={cardH}>
              <h2 id="in-h" className={h2}>Insights</h2>
              <span className={sub}>From posted activity</span>
            </div>
            <div className="px-5 pb-5 pt-4">
              {m.insights.map((n) => (
                <div key={n.icon} className="flex gap-3 border-t border-border py-3 text-[13px] first:border-t-0 first:pt-0">
                  <span className="grid size-[30px] flex-none place-items-center rounded-lg border border-border bg-surface-2 text-accent">
                    <Icon name={insightIcon(n)} size={16} />
                  </span>
                  <div>
                    <div className="font-semibold">{n.title}</div>
                    <div className="mt-0.5 text-text-3">{n.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section aria-labelledby="sc-h" className={card}>
        <div className={cardH}>
          <div>
            <h2 id="sc-h" className={h2}>Spending by category</h2>
            <div className={`${sub} mt-0.5`}>{m.rangeLabel} · posted outflows · select to filter</div>
          </div>
        </div>
        <div className="px-5 pb-5 pt-4">
          <div className="grid grid-cols-[168px_minmax(0,1fr)] items-center gap-6 max-[720px]:grid-cols-1 max-[720px]:justify-items-center">
            <div
              role="img"
              aria-label={`Spending breakdown by category, ${m.categories.total} total`}
              className="relative size-[168px] rounded-full after:absolute after:inset-[22px] after:rounded-full after:bg-surface after:content-['']"
              style={{ background: `conic-gradient(${m.categories.gradient})` }}
            >
              <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center text-center">
                <span className={sub}>Total spend</span>
                <strong className="num text-lg font-semibold tracking-[-0.02em]" data-testid="spend-total">
                  {m.categories.total}
                </strong>
              </div>
            </div>
            <div className="w-full min-w-0">
              {m.categories.rows.length === 0 && <p className={sub}>No posted spending in this period.</p>}
              {m.categories.rows.map((c) => (
                <Link
                  key={c.name}
                  data-testid="category-row"
                  href={transactionsHref(c.other ? { type: "out", range } : { category: c.name, range })}
                  className="group grid w-full grid-cols-[minmax(0,1fr)_auto_48px] items-center gap-2.5 rounded-lg py-[7px] text-[13px] max-[720px]:min-h-11 !text-text no-underline"
                >
                  <span className="flex min-w-0 items-center gap-2 group-hover:text-accent">
                    <i className={swatch} style={{ background: c.color }} />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="num font-medium">{`$${Math.floor((c.cents + 50) / 100).toLocaleString("en-US")}`}</span>
                  <span className="num text-right text-text-3">{c.percent.toFixed(0)}%</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="rt-h" className={card}>
        <div className={`${cardH} !pb-3.5`}>
          <h2 id="rt-h" className={h2}>Recent transactions</h2>
          <Link
            href="/transactions"
            className="inline-flex h-11 items-center gap-1 rounded-full px-2 text-xs font-medium !text-text-2 no-underline hover:bg-hover hover:!text-text not-phone:h-7"
          >
            View all
            <Icon name="chevRight" size={14} />
          </Link>
        </div>
        {m.recent.length === 0 && <p className={`${sub} border-t border-border px-5 py-6`}>No transactions yet.</p>}
        <ul className="m-0 list-none p-0">
          {m.recent.map((t) => {
            const st = STATUS[t.status];
            return (
              <li key={t.id}>
                <Link
                  href={transactionsHref({ q: t.reference })}
                  data-testid="recent-row"
                  className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-5 py-[11px] !text-text no-underline transition-colors hover:bg-surface-2"
                >
                  <span className={tile} style={{ color: t.categoryColor, background: hexA(t.categoryColor, 0.13) }}>
                    <Icon name={isIconName(t.categoryIcon) ? t.categoryIcon : "swap"} />
                  </span>
                  <span className="min-w-0">
                    <span className={`${rowTitle} truncate`}>
                      {t.merchant}
                      {t.simulated && (
                        <span className="ml-1.5 rounded-[5px] bg-warn-soft px-[5px] py-px text-[10px] font-semibold uppercase tracking-[0.04em] text-warn">
                          Simulated
                        </span>
                      )}
                    </span>
                    <span className={`${rowSub} truncate`}>{t.sub}</span>
                  </span>
                  <span className="flex flex-col items-end gap-[3px]">
                    <span className={`num font-medium ${t.incoming ? "text-pos" : ""}`}>{t.amount}</span>
                    <span className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium ${st.cls}`}>
                      {st.label}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
