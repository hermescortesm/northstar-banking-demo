"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CATEGORIES, MEMO_MAX } from "@/lib/data";
import { formatDayShort } from "@/lib/dates";
import { SIM_CLOCK, validateTransfer } from "@/lib/ledger";
import { formatCents } from "@/lib/money";
import {
  fieldDomId, firstErrorField, formatAmountOnBlur, memoCounter, nextRequestId, reviewBalances, submitFailureMessage,
} from "@/lib/transfer-form";
import type { AccountId, TransferErrors, TransferInput } from "@/lib/types";
import { useFlash } from "@/lib/useFlash";
import { useLedger } from "@/state/LedgerProvider";
import { Icon } from "../icons";
import { TransfersSkeleton } from "../skeletons/TransfersSkeleton";
import { useToast } from "../Toast";
import { Badge, SimTag } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardSub, CardTitle } from "../ui/Card";
import { Field, FieldError } from "../ui/Field";
import { IconTile } from "../ui/IconTile";
import { AmountInput, Input } from "../ui/Input";
import { KeyValueList, KeyValueRow } from "../ui/KeyValue";
import { LinkButton } from "../ui/LinkButton";
import { ListRow } from "../ui/ListRow";
import { Money } from "../ui/Money";
import { Notice } from "../ui/Notice";
import { AccountOptions, acctLabel } from "./AccountOptions";
import { FormSection } from "./FormSection";
import { Stepper, type Step } from "./Stepper";

interface DoneResult { amountCents: number; from: string; to: string; reference: string; time: string }

const SEND_MS = 800;

/** Balance in the side panel; flashes briefly when the amount changes. */
function Posted({ cents }: { cents: number }) {
  const n = useFlash(cents);
  return (
    <Money key={n} cents={cents} data-role="posted" className={n ? "flash" : undefined} />
  );
}

export function TransferFlow({ loading = false }: { loading?: boolean }) {
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
  if (loading) return <TransfersSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <Notice>
        <b>This is a simulated transfer.</b> No money moves and no bank is contacted. Balances and transactions update
        only in this preview and reset when it reloads.
      </Notice>

      <Stepper step={step} />

      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5 max-[1180px]:grid-cols-[minmax(0,1fr)]">
        <div className="min-w-0">
          {step === "form" && (
            <Card as="form" className="animate-step" aria-label="Transfer details" onSubmit={onReview} noValidate>
              <FormSection n={1} title="From">
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
              </FormSection>
              <FormSection
                n={2}
                title="To"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!px-2.5 !text-[13px]"
                    disabled={!from || !to}
                    onClick={() => {
                      setFrom(to);
                      setTo(from);
                      setErrors({});
                    }}
                  >
                    <Icon name="swap" size={14} />
                    Swap accounts
                  </Button>
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
              </FormSection>
              <FormSection n={3} title="Amount">
                <Field
                  id="xf-amount"
                  label="Amount"
                  error={errors.amount}
                  hint={
                    fromAcct
                      ? `Available in ${fromAcct.name}: ${formatCents(balances[fromAcct.id].availableCents)}`
                      : "Choose a source account to see what’s available."
                  }
                >
                  {(p) => (
                    <AmountInput
                      {...p}
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        clearErr("amount");
                      }}
                      onBlur={() => setAmount((v) => formatAmountOnBlur(v))}
                    />
                  )}
                </Field>
                <Field
                  id="xf-memo"
                  label={<>Note <span className="font-normal text-text-3">(optional)</span></>}
                  aside={memoCounter(memo, MEMO_MAX)}
                  error={errors.memo}
                >
                  {(p) => (
                    <Input
                      {...p}
                      maxLength={80}
                      placeholder="e.g. Move excess cash to reserve"
                      value={memo}
                      onChange={(e) => {
                        setMemo(e.target.value);
                        clearErr("memo");
                      }}
                    />
                  )}
                </Field>
              </FormSection>
              <div className="flex flex-wrap items-center justify-end gap-3 p-5">
                {hasErr && (
                  <span role="alert" className="mr-auto flex items-center gap-1.5 text-xs text-neg">
                    <span aria-hidden="true"><Icon name="alert" size={14} /></span>
                    Fix the highlighted fields to continue.
                  </span>
                )}
                <Button type="submit" variant="primary">
                  Review transfer
                  <Icon name="arrowRight" size={16} />
                </Button>
              </div>
            </Card>
          )}

          {(step === "review" || step === "sending") && review && fromAcct && toAcct && (
            <Card as="section" className="animate-step" aria-labelledby="rv-h">
              <CardHeader>
                <h2 id="rv-h" ref={stepHeading} tabIndex={-1} className="text-[15px] font-semibold tracking-[-0.01em] outline-none">
                  Review and confirm
                </h2>
                <Badge tone="warning" outlined>Simulated transfer</Badge>
              </CardHeader>
              <div className="flex flex-col gap-[18px] px-5 pb-5 pt-4">
                <div>
                  <div className="text-[13px] text-text-3">You’re moving</div>
                  <div className="mt-1 text-[40px] font-semibold leading-none tracking-[-0.04em] tabular-nums">{formatCents(cents)}</div>
                </div>
                <KeyValueList>
                  <KeyValueRow label="From" small={`Balance ${review.from.before} → ${review.from.after}`}>{acctLabel(fromAcct)}</KeyValueRow>
                  <KeyValueRow label="To" small={`Balance ${review.to.before} → ${review.to.after}`}>{acctLabel(toAcct)}</KeyValueRow>
                  <KeyValueRow label="Note">{memo.trim() || "-"}</KeyValueRow>
                  <KeyValueRow label="Arrives">Instantly (simulated)</KeyValueRow>
                  <KeyValueRow label="Fee">$0.00</KeyValueRow>
                </KeyValueList>
                <Notice>
                  Confirming records this transfer in the demo ledger only. It’s labeled <b>Simulated</b> everywhere it appears.
                </Notice>
                {submitErr && <Notice tone="danger" role="alert">{submitErr}</Notice>}
                <div className="flex flex-wrap justify-between gap-2">
                  <Button
                    disabled={step === "sending"}
                    onClick={() => {
                      setSubmitErr("");
                      setStep("form");
                    }}
                  >
                    <Icon name="chevLeft" size={16} />
                    Edit details
                  </Button>
                  <Button variant="accent" loading={step === "sending"} onClick={onConfirm}>
                    {step === "sending" ? "Processing…" : "Confirm simulated transfer"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {step === "done" && result && (
            <Card as="section" className="animate-step" aria-labelledby="done-h">
              <div role="status" className="flex flex-col items-center gap-3.5 px-6 py-12 text-center">
                <span aria-hidden="true" className="animate-pop grid size-16 place-items-center rounded-full bg-pos-soft text-pos">
                  <svg viewBox="0 0 24 24" width={30} height={30} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" pathLength={1} className="draw-check" />
                  </svg>
                </span>
                <h2 id="done-h" ref={stepHeading} tabIndex={-1} className="text-[22px] font-semibold tracking-[-0.02em] outline-none">
                  Simulated transfer complete
                </h2>
                <div className="text-[40px] font-semibold leading-none tracking-[-0.04em] tabular-nums">{formatCents(result.amountCents)}</div>
                <p className="text-text-3">{result.from} → {result.to}</p>
                <p className="text-text-3">Reference {result.reference} · {result.time}</p>
                <p className="max-w-[420px] text-text-3">
                  Balances on every screen now include this transfer, and it appears at the top of Transactions.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <LinkButton href="/transactions">View in transactions</LinkButton>
                  <Button variant="primary" onClick={reset}>New transfer</Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <Card as="aside" className="sticky top-[88px] max-[1180px]:static" aria-label="Account balances">
          <CardHeader className="!pb-1.5">
            <CardTitle>Account balances</CardTitle>
          </CardHeader>
          <div className="px-5 pb-5 pt-1.5">
            <KeyValueList>
              {accounts.map((a) => (
                <KeyValueRow
                  key={a.id}
                  testId={`bal-${a.id}`}
                  label={acctLabel(a)}
                  small={balances[a.id].pendingCents !== 0 ? `Available ${formatCents(balances[a.id].availableCents)}` : "No pending activity"}
                >
                  <Posted cents={balances[a.id].postedCents} />
                </KeyValueRow>
              ))}
            </KeyValueList>
          </div>
        </Card>
      </div>

      <Card as="section" aria-labelledby="rx-h">
        <CardHeader>
          <div>
            <CardTitle id="rx-h">Recent transfers</CardTitle>
            <CardSub className="mt-0.5 block">Outgoing side of each internal transfer</CardSub>
          </div>
          <LinkButton href="/transactions?category=Transfer&type=out" variant="ghost" size="sm" className="!px-2 !text-xs not-phone:!h-7">
            View all
            <Icon name="chevRight" size={14} />
          </LinkButton>
        </CardHeader>
        <ul>
          {recent.map((t) => (
            <li key={t.id}>
              <ListRow
                leading={<IconTile color={CATEGORIES.Transfer.color}><Icon name="swap" /></IconTile>}
                title={
                  <span className="flex items-center gap-1.5">
                    <span className="min-w-0 truncate">{t.merchant}</span>
                    {t.simulated && <SimTag className="ml-0" />}
                  </span>
                }
                subtitle={<>{formatDayShort(t.day)} · {t.description}</>}
                trailing={
                  <>
                    <Money cents={t.amountCents} className="font-medium" />
                    <span className="text-xs text-text-3">{acctName(t.accountId)}</span>
                  </>
                }
              />
            </li>
          ))}
          {recent.length === 0 && <li className="border-t border-border px-5 py-6 text-center text-text-3">No transfers yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
