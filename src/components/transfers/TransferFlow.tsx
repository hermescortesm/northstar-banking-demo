"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { MEMO_MAX } from "@/lib/data";
import { formatDayShort } from "@/lib/dates";
import { SIM_CLOCK, validateTransfer } from "@/lib/ledger";
import { formatCents } from "@/lib/money";
import {
  fieldDomId, firstErrorField, formatAmountOnBlur, memoCounter, nextRequestId, reviewBalances, submitFailureMessage,
} from "@/lib/transfer-form";
import type { Account, AccountId, TransferErrors, TransferInput } from "@/lib/types";
import { useLedger } from "@/state/LedgerProvider";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import {
  btn, btnAccent, btnGhost, btnPrimary, card, cardB, cardH, cardTitle, chipPend, errTxt, help, input, kv, label, note,
  noteErr, sumAmt,
} from "./ui";

type Step = "form" | "review" | "sending" | "done";

interface DoneResult { amountCents: number; from: string; to: string; reference: string; time: string }

const SEND_MS = 800;
const acctLabel = (a: Account) => `${a.name} ••${a.mask}`;

function Stepper({ step }: { step: Step }) {
  const idx = step === "form" ? 0 : step === "done" ? 2 : 1;
  const items = ["Details", "Review", "Done"];
  return (
    <ol aria-label="Transfer steps" className="flex flex-wrap items-center gap-2">
      {items.map((name, i) => {
        const on = i === idx && step !== "done";
        const done = i < idx || step === "done";
        return (
          <li key={name} className="contents" aria-current={on ? "step" : undefined}>
            {i > 0 && <span aria-hidden="true" className="h-[1.5px] w-7 bg-border-strong" />}
            <span className={`flex items-center gap-2 text-[13px] font-medium ${on ? "text-text" : "text-text-3"}`}>
              <span
                aria-hidden="true"
                className={`grid size-6 place-items-center rounded-full border-[1.5px] text-xs font-semibold ${
                  on
                    ? "border-text bg-text text-surface"
                    : done
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border-strong"
                }`}
              >
                {i + 1}
              </span>
              {name}
              {done && <span className="sr-only"> (complete)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function AccountOptions({
  side, accounts, selected, onPick, caption, describedBy,
}: {
  side: "from" | "to";
  accounts: readonly Account[];
  selected: AccountId | "";
  onPick: (id: AccountId) => void;
  caption: (a: Account) => string;
  describedBy?: string;
}) {
  return (
    <div
      role="group"
      aria-label={side === "from" ? "Source account" : "Destination account"}
      aria-describedby={describedBy}
      className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-2.5"
    >
      {accounts.map((a) => {
        const on = selected === a.id;
        return (
          <button
            key={a.id}
            id={`xf-${side}-${a.id}`}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(a.id)}
            className={`flex min-h-11 w-full cursor-pointer items-start gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-[border-color,box-shadow,background] ${
              on
                ? "border-accent bg-accent-soft shadow-[0_0_0_3px_var(--accent-ring)]"
                : "border-border-strong bg-surface hover:border-text-3"
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-px grid size-[18px] flex-none place-items-center rounded-full border-[1.5px] bg-surface ${
                on ? "border-accent" : "border-border-strong"
              }`}
            >
              {on && <span className="size-2 rounded-full bg-accent" />}
            </span>
            <span>
              <span className="block font-medium">{acctLabel(a)}</span>
              <span className="mt-0.5 block text-xs text-text-3">{caption(a)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Section({ n, title, action, children }: { n: number; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border p-5 last:border-b-0">
      <div className="flex items-center justify-between gap-2.5 text-sm font-semibold">
        <span className="flex items-center gap-2.5">
          <span aria-hidden="true" className="grid size-[22px] place-items-center rounded-[7px] bg-hover text-xs text-text-2">
            {n}
          </span>
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className={errTxt}>
      <span aria-hidden="true" className="flex-none"><Icon name="alert" size={14} /></span>
      {message}
    </span>
  );
}

export function TransferFlow() {
  const ledger = useLedger();
  const { accounts, balances, submitTransfer } = ledger;
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("form");
  const [from, setFrom] = useState<AccountId | "">("op");
  const [to, setTo] = useState<AccountId | "">("rs");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [errors, setErrors] = useState<TransferErrors>({});
  const [submitErr, setSubmitErr] = useState("");
  const [result, setResult] = useState<DoneResult | null>(null);

  // Idempotency: one key per transfer attempt (reset by "New transfer"). Re-submitting it is a ledger no-op.
  const sending = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const prevStep = useRef<Step>("form");

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Focus management: heading on Review/Done, amount field when returning to edit, heading again after a failed confirm.
  useEffect(() => {
    const prev = prevStep.current;
    prevStep.current = step;
    if (step === prev) return;
    if (step === "review" || step === "done") stepHeading.current?.focus();
    else if (step === "form" && prev === "review") document.getElementById("xf-amount")?.focus();
  }, [step]);

  const input_: TransferInput = { requestId: nextRequestId(ledger.transfers.length), fromAccountId: from, toAccountId: to, amount, memo };
  const fromAcct = accounts.find((a) => a.id === from);
  const toAcct = accounts.find((a) => a.id === to);

  const clearErr = (k: keyof TransferErrors) =>
    setErrors((e) => {
      if (!e[k]) return e;
      const n = { ...e };
      delete n[k];
      return n;
    });

  const focusField = (errs: TransferErrors) => {
    const f = firstErrorField(errs);
    if (!f) return;
    const id = fieldDomId(f, input_);
    setTimeout(() => document.getElementById(id)?.focus(), 30);
  };

  const onReview = (e?: FormEvent) => {
    e?.preventDefault();
    const { errors: errs } = validateTransfer(ledger, input_);
    setErrors(errs);
    if (Object.keys(errs).length) return focusField(errs);
    setSubmitErr("");
    setStep("review");
  };

  const onConfirm = useCallback(() => {
    if (sending.current) return; // double-click / Enter twice
    sending.current = true;
    const reqId = nextRequestId(ledger.transfers.length);
    setSubmitErr("");
    setStep("sending");
    timer.current = setTimeout(() => {
      timer.current = null;
      const res = submitTransfer({ requestId: reqId, fromAccountId: from, toAccountId: to, amount, memo });
      sending.current = false;
      if (res.status === "invalid") {
        setSubmitErr(submitFailureMessage(res.errors));
        setStep("review");
        toast("Simulated transfer could not be completed", "error");
        return;
      }
      const t = res.transfer;
      const a = accounts.find((x) => x.id === t.fromAccountId)!;
      const b = accounts.find((x) => x.id === t.toAccountId)!;
      setResult({ amountCents: t.amountCents, from: acctLabel(a), to: acctLabel(b), reference: t.reference, time: `Today, ${SIM_CLOCK}` });
      setStep("done");
      if (res.status === "applied") toast(`Simulated transfer of ${formatCents(t.amountCents)} recorded`);
    }, SEND_MS);
  }, [submitTransfer, ledger.transfers.length, from, to, amount, memo, accounts, toast]);

  const reset = () => {
    setFrom("op");
    setTo("rs");
    setAmount("");
    setMemo("");
    setErrors({});
    setSubmitErr("");
    setResult(null);
    setStep("form");
  };

  const validated = validateTransfer(ledger, input_);
  const cents = validated.cents ?? 0;
  const review = fromAcct && toAcct && step !== "form" && step !== "done" ? reviewBalances(ledger, fromAcct.id, toAcct.id, cents) : null;

  const recent = ledger.transactions.filter((t) => t.category === "Transfer" && t.amountCents < 0).slice(0, 5);
  const acctName = (id: AccountId) => accounts.find((a) => a.id === id)?.shortName ?? id;
  const hasErr = Object.keys(errors).length > 0;
  const inputBorder = (bad: boolean) => (bad ? "border-neg focus:!shadow-[0_0_0_3px_var(--neg-soft)]" : "border-border-strong");

  return (
    <div className="flex flex-col gap-6">
      <div className={note}>
        <span className="mt-px flex-none text-warn"><Icon name="info" size={16} /></span>
        <span>
          <b>This is a simulated transfer.</b> No money moves and no bank is contacted. Balances and transactions update
          only in this preview and reset when it reloads.
        </span>
      </div>

      <Stepper step={step} />

      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5 max-[1180px]:grid-cols-[minmax(0,1fr)]">
        <div className="min-w-0">
          {step === "form" && (
            <form className={card} aria-label="Transfer details" onSubmit={onReview} noValidate>
              <Section n={1} title="From">
                <AccountOptions
                  side="from"
                  accounts={accounts}
                  selected={from}
                  describedBy={errors.from ? "xf-from-err" : undefined}
                  caption={(a) => `Available ${formatCents(balances[a.id].availableCents)}`}
                  onPick={(id) => {
                    setFrom(id);
                    clearErr("from");
                    clearErr("amount");
                  }}
                />
                <FieldError id="xf-from-err" message={errors.from} />
              </Section>
              <Section
                n={2}
                title="To"
                action={
                  <button
                    type="button"
                    className={`${btnGhost} !h-11 not-phone:!h-8 !px-2.5 !text-[13px]`}
                    disabled={!from || !to}
                    onClick={() => {
                      setFrom(to);
                      setTo(from);
                      setErrors({});
                    }}
                  >
                    <Icon name="swap" size={14} />
                    Swap accounts
                  </button>
                }
              >
                <AccountOptions
                  side="to"
                  accounts={accounts}
                  selected={to}
                  describedBy={errors.to ? "xf-to-err" : undefined}
                  caption={(a) => `Balance ${formatCents(balances[a.id].postedCents)}`}
                  onPick={(id) => {
                    setTo(id);
                    clearErr("to");
                  }}
                />
                <FieldError id="xf-to-err" message={errors.to} />
              </Section>
              <Section n={3} title="Amount">
                <div className="flex flex-col gap-1.5">
                  <label className={label} htmlFor="xf-amount">Amount</label>
                  <div className="relative">
                    <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[22px] text-text-3">$</span>
                    <input
                      id="xf-amount"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        clearErr("amount");
                      }}
                      onBlur={() => setAmount((v) => formatAmountOnBlur(v))}
                      aria-invalid={!!errors.amount}
                      aria-describedby={`${errors.amount ? "xf-amount-err " : ""}xf-amount-hint`}
                      className={`${input} h-14 pl-8 text-2xl font-medium tabular-nums ${inputBorder(!!errors.amount)}`}
                    />
                  </div>
                  <FieldError id="xf-amount-err" message={errors.amount} />
                  <span id="xf-amount-hint" className={help}>
                    {fromAcct
                      ? `Available in ${fromAcct.name}: ${formatCents(balances[fromAcct.id].availableCents)}`
                      : "Choose a source account to see what’s available."}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <label className={label} htmlFor="xf-memo">
                      Note <span className="font-normal text-text-3">(optional)</span>
                    </label>
                    <span className={help} aria-hidden="true">{memoCounter(memo, MEMO_MAX)}</span>
                  </div>
                  <input
                    id="xf-memo"
                    maxLength={80}
                    placeholder="e.g. Move excess cash to reserve"
                    value={memo}
                    onChange={(e) => {
                      setMemo(e.target.value);
                      clearErr("memo");
                    }}
                    aria-invalid={!!errors.memo}
                    aria-describedby={errors.memo ? "xf-memo-err" : undefined}
                    className={`${input} h-11 not-phone:h-10 ${inputBorder(!!errors.memo)}`}
                  />
                  <FieldError id="xf-memo-err" message={errors.memo} />
                </div>
              </Section>
              <div className="flex flex-wrap items-center justify-end gap-3 p-5">
                {hasErr && (
                  <span role="alert" className={`${errTxt} mr-auto`}>
                    <span aria-hidden="true"><Icon name="alert" size={14} /></span>
                    Fix the highlighted fields to continue.
                  </span>
                )}
                <button type="submit" className={btnPrimary}>
                  Review transfer
                  <Icon name="arrowRight" size={16} />
                </button>
              </div>
            </form>
          )}

          {(step === "review" || step === "sending") && review && fromAcct && toAcct && (
            <section className={card} aria-labelledby="rv-h">
              <div className={cardH}>
                <h2 id="rv-h" ref={stepHeading} tabIndex={-1} className={`${cardTitle} outline-none`}>
                  Review and confirm
                </h2>
                <span className={chipPend}>Simulated transfer</span>
              </div>
              <div className={`${cardB} flex flex-col gap-[18px]`}>
                <div>
                  <div className="text-[13px] text-text-3">You’re moving</div>
                  <div className={`${sumAmt} mt-1`}>{formatCents(cents)}</div>
                </div>
                <dl>
                  {[
                    ["From", acctLabel(fromAcct), `Balance ${review.from.before} → ${review.from.after}`],
                    ["To", acctLabel(toAcct), `Balance ${review.to.before} → ${review.to.after}`],
                    ["Note", memo.trim() || "-", ""],
                    ["Arrives", "Instantly (simulated)", ""],
                    ["Fee", "$0.00", ""],
                  ].map(([k, v, small]) => (
                    <div key={k} className={kv}>
                      <dt className="text-text-3">{k}</dt>
                      <dd className="flex min-w-0 flex-col items-end gap-0.5 break-words text-right font-medium">
                        {v}
                        {small && <small className="text-xs font-normal text-text-3">{small}</small>}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className={note}>
                  <span className="mt-px flex-none text-warn"><Icon name="info" size={16} /></span>
                  <span>
                    Confirming records this transfer in the demo ledger only. It’s labeled <b>Simulated</b> everywhere it appears.
                  </span>
                </div>
                {submitErr && (
                  <div className={noteErr} role="alert">
                    <span className="mt-px flex-none text-neg"><Icon name="alert" size={16} /></span>
                    <span>{submitErr}</span>
                  </div>
                )}
                <div className="flex flex-wrap justify-between gap-2">
                  <button
                    type="button"
                    className={btn}
                    disabled={step === "sending"}
                    onClick={() => {
                      setSubmitErr("");
                      setStep("form");
                    }}
                  >
                    <Icon name="chevLeft" size={16} />
                    Edit details
                  </button>
                  <button
                    type="button"
                    className={btnAccent}
                    disabled={step === "sending"}
                    aria-busy={step === "sending"}
                    onClick={onConfirm}
                  >
                    {step === "sending" ? (
                      <>
                        <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                        Processing…
                      </>
                    ) : (
                      "Confirm simulated transfer"
                    )}
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === "done" && result && (
            <section className={card} aria-labelledby="done-h">
              <div role="status" className="flex flex-col items-center gap-3.5 px-6 py-12 text-center">
                <span aria-hidden="true" className="animate-rise grid size-16 place-items-center rounded-full bg-pos-soft text-pos">
                  <svg viewBox="0 0 24 24" width={30} height={30} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <h2 id="done-h" ref={stepHeading} tabIndex={-1} className="text-[22px] font-semibold tracking-[-0.02em] outline-none">
                  Simulated transfer complete
                </h2>
                <div className={sumAmt}>{formatCents(result.amountCents)}</div>
                <p className="text-text-3">{result.from} → {result.to}</p>
                <p className="text-text-3">Reference {result.reference} · {result.time}</p>
                <p className="max-w-[420px] text-text-3">
                  Balances on every screen now include this transfer, and it appears at the top of Transactions.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Link href="/transactions" className={btn}>View in transactions</Link>
                  <button type="button" className={btnPrimary} onClick={reset}>New transfer</button>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className={`${card} sticky top-[88px] max-[1180px]:static`} aria-label="Account balances">
          <div className={`${cardH} !pb-1.5`}>
            <h2 className={cardTitle}>Account balances</h2>
          </div>
          <div className="px-5 pb-5 pt-1.5">
            {accounts.map((a) => (
              <div key={a.id} className={kv} data-testid={`bal-${a.id}`}>
                <span className="text-text-3">{acctLabel(a)}</span>
                <span className="flex flex-col items-end gap-0.5 text-right font-medium tabular-nums">
                  <span data-role="posted">{formatCents(balances[a.id].postedCents)}</span>
                  <small className="text-xs font-normal text-text-3">
                    {balances[a.id].pendingCents !== 0
                      ? `Available ${formatCents(balances[a.id].availableCents)}`
                      : "No pending activity"}
                  </small>
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <section className={card} aria-labelledby="rx-h">
        <div className={`${cardH} !pb-3.5`}>
          <div>
            <h2 id="rx-h" className={cardTitle}>Recent transfers</h2>
            <div className="mt-0.5 text-[13px] text-text-3">Outgoing side of each internal transfer</div>
          </div>
          <Link href="/transactions?category=Transfer&type=out" className={`${btnGhost} !h-11 not-phone:!h-7 !px-2 !text-xs`}>
            View all
            <Icon name="chevRight" size={14} />
          </Link>
        </div>
        <ul>
          {recent.map((t) => (
            <li
              key={t.id}
              className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-5 py-[11px]"
            >
              <span aria-hidden="true" className="grid size-9 place-items-center rounded-[10px] bg-[#6B7A9021] text-[#6B7A90]">
                <Icon name="swap" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="min-w-0 truncate">{t.merchant}</span>
                  {t.simulated && (
                    <span className="flex-none rounded-[5px] bg-warn-soft px-[5px] py-px text-[10px] font-semibold uppercase tracking-[.04em] text-warn">
                      Simulated
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-text-3">{formatDayShort(t.day)} · {t.description}</span>
              </span>
              <span className="flex flex-col items-end gap-[3px]">
                <span className="font-medium tabular-nums">{formatCents(t.amountCents)}</span>
                <span className="text-xs text-text-3">{acctName(t.accountId)}</span>
              </span>
            </li>
          ))}
          {recent.length === 0 && <li className="border-t border-border px-5 py-6 text-center text-text-3">No transfers yet.</li>}
        </ul>
      </section>
    </div>
  );
}
