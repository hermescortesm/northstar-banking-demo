"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { Icon, isIconName } from "@/components/icons";
import { OverviewSkeleton } from "@/components/skeletons/OverviewSkeleton";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card, CardHeader, CardSub, CardTitle } from "@/components/ui/Card";
import { DeltaPill } from "@/components/ui/DeltaPill";
import { IconTile } from "@/components/ui/IconTile";
import { LinkButton } from "@/components/ui/LinkButton";
import { ListRow } from "@/components/ui/ListRow";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SimTag, STATUS_LABEL } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { TODAY } from "@/lib/data";
import { formatDayLong } from "@/lib/dates";
import { stagger } from "@/lib/motion";
import { RANGE_KEYS, buildOverview } from "@/lib/overview";
import { useFlash } from "@/lib/useFlash";
import { useLedger } from "@/state/LedgerProvider";
import type { RangeKey } from "@/lib/ledger";
import { BalanceChart } from "./BalanceChart";
import { Donut } from "./Donut";
import { transactionsHref } from "./links";

const rowSub = "block text-xs text-text-3";
const STATUS_TONE: Record<string, BadgeTone> = { completed: "success", pending: "warning", failed: "danger" };

function AccountPosted({ cents, text }: { cents: number; text: string }) {
  const n = useFlash(cents);
  return (
    <span key={n} className={`block font-medium num ${n ? "flash" : ""}`} data-testid="account-posted">
      {text}
    </span>
  );
}

/** `loading` renders the matching skeleton instead (same layout, no data). */
export function OverviewView({ loading = false }: { loading?: boolean }) {
  const ledger = useLedger();
  const [range, setRange] = useState<RangeKey>("30D");
  const m = useMemo(
    () => buildOverview({ accounts: ledger.accounts, transactions: ledger.transactions }, ledger.balances, ledger.totals, range),
    [ledger.accounts, ledger.transactions, ledger.balances, ledger.totals, range],
  );
  const totalFlash = useFlash(m.postedCents);
  if (loading) return <OverviewSkeleton />;

  const kpis = [
    { id: "in", label: "Money in", value: m.summary.in, note: m.summary.inChange, dot: "var(--chart-line)", color: undefined },
    { id: "out", label: "Money out", value: m.summary.out, note: m.summary.outChange, dot: "var(--chart-out)", color: undefined },
    { id: "net", label: "Net cash flow", value: m.summary.net, note: m.summary.netSub, dot: undefined, color: m.summary.netNegative ? "var(--neg)" : "var(--pos)" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="enter flex flex-col items-start gap-[18px]" style={stagger(0)}>
        <div>
          <h1 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.035em] max-[720px]:text-[28px]">Good morning, Avery</h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-text-3">
            <span>{formatDayLong(TODAY)}</span>
            <span aria-hidden="true">·</span>
            <span>Fernhill Robotics, Inc.</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/transfers" variant="accent">
            <Icon name="swap" size={16} />
            Transfer between accounts
          </LinkButton>
          <LinkButton href="/transactions">
            <Icon name="transactions" size={16} />
            View transactions
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-stretch gap-5 max-[1180px]:grid-cols-1">
        <Card as="section" aria-labelledby="tc-h" style={stagger(1)} className="enter flex min-w-0 flex-col overflow-hidden px-6 pt-[22px] max-[720px]:px-[18px] max-[720px]:pt-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div id="tc-h" className="flex flex-wrap items-center gap-x-2 text-[13px] font-medium text-text-3">
                Total cash<span aria-hidden="true">·</span>
                <span data-testid="range-dates">{m.rangeDates}</span>
              </div>
              <div
                key={totalFlash}
                className={`num mt-2.5 flex items-start leading-none ${totalFlash ? "flash" : ""}`}
                aria-label={`Total cash ${m.total.posted}`}
                data-testid="hero-total"
                data-cents={m.postedCents}
              >
                <span className="text-[56px] font-semibold leading-none tracking-[-0.045em] max-[720px]:text-[44px]">{m.total.dollars}</span>
                <span className="ml-0.5 mt-[5px] text-2xl font-semibold leading-none tracking-[-0.02em] text-text-3 max-[720px]:text-xl">{m.total.cents}</span>
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
                <span key={`d-${range}`} className="animate-fade">
                  <DeltaPill negative={m.delta.negative} data-testid="hero-delta">{m.delta.label}</DeltaPill>
                </span>
                <span className="text-xs text-text-3">{m.delta.sub}</span>
              </div>
            </div>
            <SegmentedControl label="Overview range" options={RANGE_KEYS} value={range} onChange={setRange} />
          </div>

          <BalanceChart points={m.points} summary={m.chartSummary} />

          <div data-testid="kpis" className="-mx-6 mt-2 grid grid-cols-3 border-t border-border max-[720px]:-mx-[18px] max-[720px]:grid-cols-1">
            {kpis.map((k) => (
              <Stat
                key={k.id}
                testId={`kpi-${k.id}`}
                label={k.label}
                value={<span key={range} className="animate-fade">{k.value}</span>}
                note={k.note}
                dot={k.dot}
                valueColor={k.color}
                className="border-r border-border px-6 pb-[18px] pt-4 last:border-r-0 max-[720px]:flex-row max-[720px]:flex-wrap max-[720px]:items-center max-[720px]:justify-between max-[720px]:border-b max-[720px]:border-r-0 max-[720px]:px-[18px] max-[720px]:py-3.5 max-[720px]:last:border-b-0"
              />
            ))}
          </div>
        </Card>

        <div className="flex min-w-0 flex-col gap-5 max-[1180px]:grid max-[1180px]:grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))]">
          <Card as="section" aria-labelledby="ac-h" className="enter" style={stagger(2)}>
            <CardHeader>
              <CardTitle id="ac-h">Accounts</CardTitle>
              <CardSub>Posted balances</CardSub>
            </CardHeader>
            {m.accounts.map((a) => (
              <ListRow
                key={a.id}
                href={transactionsHref({ account: a.id })}
                data-testid="account-card"
                data-account={a.id}
                data-cents={a.postedCents}
                wrap
                leading={<IconTile><Icon name={a.type === "Savings" ? "wallet" : "accounts"} /></IconTile>}
                title={a.name}
                subtitle={
                  <>
                    {a.type} ••{a.mask}
                    {a.apy ? ` · ${a.apy} (simulated)` : ""}
                  </>
                }
                trailing={
                  <>
                    <AccountPosted cents={a.postedCents} text={a.posted} />
                    <span className={`${rowSub} num`}>{a.pendingText}</span>
                  </>
                }
              />
            ))}
          </Card>

          <Card as="section" aria-labelledby="in-h" className="enter" style={stagger(3)}>
            <CardHeader flush>
              <CardTitle id="in-h">Insights</CardTitle>
              <CardSub>From posted activity</CardSub>
            </CardHeader>
            <div className="px-5 pb-5 pt-4">
              {m.insights.map((n) => (
                <div key={n.icon} className="flex gap-3 border-t border-border py-3 text-[13px] first:border-t-0 first:pt-0">
                  <IconTile size="sm" bordered><Icon name={n.icon} size={16} /></IconTile>
                  <div>
                    <div className="font-semibold">{n.title}</div>
                    <div className="mt-0.5 text-text-3">{n.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card as="section" aria-labelledby="sc-h" className="enter" style={stagger(4)}>
        <CardHeader flush>
          <div>
            <CardTitle id="sc-h">Spending by category</CardTitle>
            <CardSub className="mt-0.5 block">{m.rangeLabel} · posted outflows · select to filter</CardSub>
          </div>
        </CardHeader>
        <div className="px-5 pb-5 pt-4">
          <div className="grid grid-cols-[168px_minmax(0,1fr)] items-center gap-6 max-[720px]:grid-cols-1 max-[720px]:justify-items-center">
            <div
              key={range}
              role="img"
              aria-label={`Spending breakdown by category, ${m.categories.total} total`}
              className="relative size-[168px]"
            >
              <Donut rows={m.categories.rows} />
              <div className="donut-center absolute inset-0 z-[1] flex flex-col items-center justify-center text-center">
                <CardSub>Total spend</CardSub>
                <strong className="num text-lg font-semibold tracking-[-0.02em]" data-testid="spend-total">{m.categories.total}</strong>
              </div>
            </div>
            <div key={`rows-${range}`} className="w-full min-w-0">
              {m.categories.rows.length === 0 && <CardSub>No posted spending in this period.</CardSub>}
              {m.categories.rows.map((c, i) => (
                <Link
                  key={c.name}
                  data-testid="category-row"
                  href={transactionsHref(c.other ? { type: "out", range } : { category: c.name, range })}
                  style={stagger(i, 6)}
                  className="enter group -mx-2 grid grid-cols-[minmax(0,1fr)_auto_48px] items-center gap-2.5 rounded-lg px-2 py-[7px] text-[13px] text-text no-underline transition-[background-color,transform] duration-150 hover:bg-hover active:scale-[0.99] active:bg-accent-soft max-[720px]:min-h-11"
                >
                  <span className="flex min-w-0 items-center gap-2 transition-colors group-hover:text-accent">
                    <i className="pop inline-block size-2 flex-none rounded-[2px]" style={{ background: c.color, "--pop-from": 0 } as CSSProperties} />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span key={`a-${range}`} className="num animate-fade font-medium">{`$${Math.floor((c.cents + 50) / 100).toLocaleString("en-US")}`}</span>
                  <span key={`p-${range}`} className="num animate-fade text-right text-text-3">{c.percent.toFixed(0)}%</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card as="section" aria-labelledby="rt-h" className="enter" style={stagger(5)}>
        <CardHeader>
          <CardTitle id="rt-h">Recent transactions</CardTitle>
          <LinkButton href="/transactions" variant="ghost" size="sm" className="!h-11 !px-2 !text-xs not-phone:!h-7">
            View all
            <Icon name="chevRight" size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
          </LinkButton>
        </CardHeader>
        {m.recent.length === 0 && <CardSub className="block border-t border-border px-5 py-6">No transactions yet.</CardSub>}
        <ul className="m-0 list-none p-0">
          {m.recent.map((t, i) => (
            <li key={t.id} className="enter" style={stagger(i, 5)}>
              <ListRow
                href={transactionsHref({ q: t.reference })}
                data-testid="recent-row"
                chevron
                leading={
                  <IconTile color={t.categoryColor} pop>
                    <Icon name={isIconName(t.categoryIcon) ? t.categoryIcon : "swap"} />
                  </IconTile>
                }
                title={
                  <>
                    {t.merchant}
                    {t.simulated && <SimTag />}
                  </>
                }
                subtitle={t.sub}
                trailing={
                  <>
                    <span className={`num font-medium ${t.incoming ? "text-pos" : ""}`}>{t.amount}</span>
                    <Badge size="sm" tone={STATUS_TONE[t.status]} className="pop">{STATUS_LABEL[t.status as keyof typeof STATUS_LABEL]}</Badge>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
