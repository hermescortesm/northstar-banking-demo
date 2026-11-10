"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TODAY } from "@/lib/data";
import { formatDayWithYear } from "@/lib/dates";
import { formatSignedCents } from "@/lib/money";
import type { Account, Transaction } from "@/lib/types";
import { TxIcon } from "./TxIcon";
import { CategoryTile, outlineBtn, SimTag, StatusChip } from "./parts";

interface Step { tone: "ok" | "pend" | "fail"; icon: string; title: string; sub: string }

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

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Modal behaviour: lock page scroll and make everything behind the drawer inert while it is open.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const inerted: HTMLElement[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el instanceof HTMLElement && !el.hasAttribute("data-drawer-layer") && !el.inert) {
        el.inert = true;
        inerted.push(el);
      }
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      for (const el of inerted) el.inert = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!panelRef.current.contains(active)) {
        e.preventDefault();
        first?.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const account = accounts.find((a) => a.id === t.accountId);
  const incoming = t.amountCents > 0;
  const when = `${t.day === TODAY ? "Today" : formatDayWithYear(t.day)} · ${t.time}`;
  const kv = "flex items-center justify-between gap-4 border-b border-border py-[11px] text-[13px] last:border-b-0";

  return createPortal(
    <>
      <button
        type="button"
        data-drawer-layer
        aria-label="Close transaction details"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-[60] w-full cursor-pointer border-0 bg-scrim"
      />
      <aside
        ref={panelRef}
        data-drawer-layer
        role="dialog"
        aria-modal="true"
        aria-labelledby="dt-h"
        className="fixed inset-y-0 right-0 z-[61] flex w-[min(480px,100vw)] flex-col border-l border-border bg-surface shadow-lg"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <span className="text-[13px] font-medium text-text-3">
            {incoming ? "Money in" : "Money out"} · {t.reference}
          </span>
          <button
            type="button"
            ref={closeRef}
            aria-label="Close transaction details"
            onClick={onClose}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-transparent bg-transparent text-text hover:bg-hover"
          >
            <TxIcon name="x" size={16} />
          </button>
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
            <div
              className={`num max-w-full break-all text-[30px] font-semibold leading-none tracking-[-0.04em] not-phone:text-[36px] ${
                incoming ? "text-pos" : ""
              }`}
            >
              {formatSignedCents(t.amountCents)}
            </div>
            <StatusChip status={t.status} />
          </div>

          {t.reason && (
            <div role="note" className="flex items-start gap-2.5 rounded-xl bg-neg-soft px-3.5 py-3 text-[13px]">
              <span className="mt-px text-neg"><TxIcon name="alert" size={16} /></span>
              <span>{t.reason}</span>
            </div>
          )}
          {t.status === "pending" && (
            <div className="flex items-start gap-2.5 rounded-xl bg-warn-soft px-3.5 py-3 text-[13px]">
              <span className="mt-px text-warn"><TxIcon name="clock" size={16} /></span>
              <span>Pending transactions aren’t included in the current balance until they post.</span>
            </div>
          )}
          {t.simulated && (
            <div className="flex items-start gap-2.5 rounded-xl bg-warn-soft px-3.5 py-3 text-[13px]">
              <span className="mt-px text-warn"><TxIcon name="info" size={16} /></span>
              <span>Created by the transfer simulation in this preview. No money moved.</span>
            </div>
          )}

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
                    <TxIcon name={s.icon} size={14} strokeWidth={2.5} />
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
            <dl className="m-0">
              {(
                [
                  ["Category", t.category],
                  ["Payment method", t.method],
                  ["Account", account ? `${account.name} ••${account.mask}` : t.accountId],
                  ["Date", when],
                  ["Reference", t.reference],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className={kv}>
                  <dt className="text-text-3">{k}</dt>
                  <dd className="num m-0 min-w-0 break-words text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3.5">
          <button type="button" className={outlineBtn} onClick={() => onShowAll(t.merchant)}>
            <TxIcon name="search" size={14} />
            Show all from {t.merchant}
          </button>
        </div>
      </aside>
    </>,
    document.body,
  );
}
