"use client";

import { useRef } from "react";
import { TODAY } from "@/lib/data";
import { formatDayWithYear } from "@/lib/dates";
import type { Account, Transaction } from "@/lib/types";
import { Icon, isIconName, type IconName } from "../icons";
import { SimTag, StatusPill } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Drawer } from "../ui/Drawer";
import { IconButton } from "../ui/IconButton";
import { KeyValueList, KeyValueRow } from "../ui/KeyValue";
import { Money } from "../ui/Money";
import { Notice } from "../ui/Notice";
import { CategoryTile } from "./parts";

interface Step { tone: "ok" | "pend" | "fail"; icon: IconName; title: string; sub: string }

function buildSteps(t: Transaction): Step[] {
  const when = `${t.day === TODAY ? "Today" : formatDayWithYear(t.day)} · ${t.time}`;
  const card = t.method.includes("card");
  const steps: Step[] = [
    { tone: "ok", icon: "check", title: t.amountCents > 0 && !t.simulated ? "Initiated by sender" : "Initiated", sub: when },
  ];
  if (t.status === "completed") {
    steps.push({
      tone: "ok",
      icon: "check",
      title: t.simulated ? "Recorded (simulated)" : card ? "Settled" : "Posted to account",
      sub: t.simulated ? "Instant · demo ledger only" : formatDayWithYear(t.day),
    });
  } else if (t.status === "pending") {
    steps.push({ tone: "pend", icon: "clock", title: "Processing", sub: t.payout ? "Expected Nov 10" : "Expected within 1-2 business days" });
  } else {
    steps.push({ tone: "fail", icon: "x", title: card ? "Declined" : "Returned", sub: "Not included in balances" });
  }
  return steps;
}

const DOT = { ok: "bg-pos-soft text-pos", pend: "bg-warn-soft text-warn", fail: "bg-neg-soft text-neg" };

/** Slide-over with the full details and timeline of one transaction. */
export function TransactionDrawer({
  transaction: t,
  accounts,
  onClose,
  onShowAll,
}: {
  transaction: Transaction;
  accounts: readonly Account[];
  onClose: () => void;
  onShowAll: (merchant: string) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const account = accounts.find((a) => a.id === t.accountId);
  const incoming = t.amountCents > 0;
  const when = `${t.day === TODAY ? "Today" : formatDayWithYear(t.day)} · ${t.time}`;

  return (
    <Drawer labelledBy="dt-h" closeLabel="Close transaction details" onClose={onClose} initialFocus={closeRef}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <span className="text-[13px] font-medium text-text-3">
          {incoming ? "Money in" : "Money out"} · {t.reference}
        </span>
        <IconButton ref={closeRef} label="Close transaction details" onClick={onClose} className="!size-11 !text-text">
          <Icon name="x" size={16} />
        </IconButton>
      </div>

      {/* focusable on purpose: keyboard users can scroll the details when nothing inside is focusable */}
      <div role="region" aria-label="Transaction details" tabIndex={0} className="flex flex-1 flex-col gap-5 overflow-y-auto p-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
        <div className="flex flex-col items-start gap-2.5">
          <CategoryTile category={t.category} size="lg" />
          <div className="min-w-0 max-w-full">
            <h2 id="dt-h" className="break-words text-lg font-semibold">
              {t.merchant}
              {t.simulated && <SimTag />}
            </h2>
            <div className="break-words text-[13px] text-text-3">{t.description}</div>
          </div>
          <Money
            cents={t.amountCents}
            signed
            tone
            className="block max-w-full break-all text-[30px] font-semibold leading-none tracking-[-0.04em] not-phone:text-[36px]"
          />
          <StatusPill status={t.status} />
        </div>

        {t.reason && <Notice tone="danger" role="note">{t.reason}</Notice>}
        {t.status === "pending" && (
          <Notice icon="clock">Pending transactions aren’t included in the current balance until they post.</Notice>
        )}
        {t.simulated && <Notice>Created by the transfer simulation in this preview. No money moved.</Notice>}

        <section aria-label="Timeline">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.05em] text-text-3">Timeline</div>
          <ol className="mt-2.5 list-none p-0">
            {buildSteps(t).map((s, i, arr) => (
              <li
                key={s.title}
                className={`relative grid grid-cols-[20px_minmax(0,1fr)] gap-3 ${i < arr.length - 1 ? "pb-4" : ""}`}
              >
                {i < arr.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[9px] top-5 w-0.5 bg-border" />}
                <span className={`grid size-5 place-items-center rounded-full ${DOT[s.tone]}`}>
                  <Icon name={isIconName(s.icon) ? s.icon : "check"} size={14} strokeWidth={2.5} />
                </span>
                <div>
                  <div className="text-[13px] font-medium">{s.title}</div>
                  <div className="text-xs text-text-3">{s.sub}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Details">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.05em] text-text-3">Details</div>
          <KeyValueList>
            <KeyValueRow label="Category">{t.category}</KeyValueRow>
            <KeyValueRow label="Payment method">{t.method}</KeyValueRow>
            <KeyValueRow label="Account">{account ? `${account.name} ••${account.mask}` : t.accountId}</KeyValueRow>
            <KeyValueRow label="Date">{when}</KeyValueRow>
            <KeyValueRow label="Reference">{t.reference}</KeyValueRow>
          </KeyValueList>
        </section>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3.5">
        <Button onClick={() => onShowAll(t.merchant)}>
          <Icon name="search" size={14} />
          Show all from {t.merchant}
        </Button>
      </div>
    </Drawer>
  );
}
