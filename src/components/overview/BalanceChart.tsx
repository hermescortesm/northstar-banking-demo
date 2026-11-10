"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { formatCents, formatCompactCents } from "@/lib/money";
import { balanceScale, xTickLabels } from "@/lib/overview";
import type { CashFlowPoint } from "@/lib/ledger";

const LINE = "var(--chart-line)";

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const p = active ? (payload?.[0]?.payload as CashFlowPoint | undefined) : undefined;
  if (!p) return null;
  const row = "flex justify-between gap-4 py-px tabular-nums";
  const lbl = "flex items-center gap-1.5 opacity-70";
  return (
    <div className="min-w-[168px] rounded-xl border border-tip-bd bg-tip-bg px-3 py-2.5 text-xs text-tip-fg shadow-md">
      <div className="mb-1.5 font-semibold opacity-80">{p.long}</div>
      <div className={row}>
        <span className={lbl}>Ending balance</span>
        <span>{formatCents(p.balanceCents)}</span>
      </div>
      <div className={row}>
        <span className={lbl}>
          <i className="inline-block size-2 flex-none rounded-[2px]" style={{ background: "var(--chart-line)" }} />
          Money in
        </span>
        <span>{formatCents(p.inCents)}</span>
      </div>
      <div className={row}>
        <span className={lbl}>
          <i className="inline-block size-2 flex-none rounded-[2px]" style={{ background: "var(--chart-out)" }} />
          Money out
        </span>
        <span>{formatCents(p.outCents)}</span>
      </div>
    </div>
  );
}

export function BalanceChart({ points, summary }: { points: readonly CashFlowPoint[]; summary: string }) {
  const reduced = usePrefersReducedMotion();
  const scale = balanceScale(points.map((p) => p.balanceCents));
  const xTicks = xTickLabels(points);
  const tick = { fontSize: 11, fill: "var(--text-3)" };
  return (
    <div role="group" aria-label={summary} className="mt-[18px]" data-testid="balance-chart">
      {/* Screen-reader alternative: the same buckets the chart draws. */}
      <div className="sr-only">
      <table>
        <caption>{summary}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Ending balance</th>
            <th scope="col">Money in</th>
            <th scope="col">Money out</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.startDay}>
              <th scope="row">{p.long}</th>
              <td>{formatCents(p.balanceCents)}</td>
              <td>{formatCents(p.inCents)}</td>
              <td>{formatCents(p.outCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <div className="h-[200px] not-phone:h-[246px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={points as CashFlowPoint[]} margin={{ top: 8, right: 14, bottom: 0, left: 0 }} accessibilityLayer title={summary}>
            <defs>
              <linearGradient id="g-ov" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={LINE} stopOpacity={0.32} />
                <stop offset="1" stopColor={LINE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.7} />
            <XAxis
              dataKey="short"
              ticks={xTicks}
              interval={0}
              tickLine={false}
              axisLine={false}
              tick={tick}
              tickMargin={8}
              padding={{ left: 0, right: 0 }}
            />
            <YAxis
              domain={[scale.lo, scale.hi]}
              ticks={scale.ticks}
              tickFormatter={(v: number) => formatCompactCents(v)}
              tickLine={false}
              axisLine={false}
              tick={tick}
              width={52}
              tickMargin={10}
            />
            <Tooltip
              content={ChartTooltip}
              isAnimationActive={false}
              offset={12}
              cursor={{ stroke: "var(--text-3)", strokeOpacity: 0.4 }}
            />
            <Area
              type="linear"
              dataKey="balanceCents"
              stroke={LINE}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="url(#g-ov)"
              isAnimationActive={!reduced}
              animationDuration={500}
              animationEasing="ease-out"
              activeDot={{ r: 6, fill: "var(--surface)", stroke: LINE, strokeWidth: 2.5 }}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
