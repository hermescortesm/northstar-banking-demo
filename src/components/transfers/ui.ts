// Shared class strings for the transfers UI (design: .btn, .chip, .note, .input, .kv, .card).
const btnBase =
  "inline-flex h-11 not-phone:h-9 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border px-[15px] text-[13.5px] font-medium no-underline transition-[background,border-color,opacity,filter] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0";

export const btn = `${btnBase} border-border-strong bg-surface !text-text hover:bg-surface-2 hover:border-text-3`;
export const btnPrimary = `${btnBase} border-text bg-text !text-surface hover:opacity-90`;
export const btnAccent = `${btnBase} border-accent-fill bg-accent-fill !text-accent-ink hover:brightness-[1.07]`;
export const btnGhost = `${btnBase} border-transparent bg-transparent !text-text-2 hover:bg-hover hover:!text-text`;

export const card = "rounded-[16px] border border-border bg-surface";
export const cardH = "flex flex-wrap items-center justify-between gap-3 px-5 pt-[18px]";
export const cardTitle = "text-[15px] font-semibold tracking-[-0.01em]";
export const cardB = "px-5 pb-5 pt-4";

export const chipPend =
  "inline-flex h-6 items-center whitespace-nowrap rounded-full border border-warn/20 bg-warn-soft px-[9px] text-xs font-medium text-warn";

export const note = "flex items-start gap-2.5 rounded-xl bg-warn-soft px-3.5 py-3 text-[13px] text-text";
export const noteErr = "flex items-start gap-2.5 rounded-xl bg-neg-soft px-3.5 py-3 text-[13px] text-text";

export const errTxt = "flex items-center gap-1.5 text-xs text-neg";
export const help = "text-xs text-text-3";
export const label = "text-[13px] font-medium text-text";

export const input =
  "w-full rounded-[10px] border bg-surface px-3 text-sm text-text outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)]";

export const kv = "flex items-center justify-between gap-4 border-b border-border py-[11px] text-[13px] last:border-b-0";
export const sumAmt = "text-[40px] font-semibold leading-none tracking-[-0.04em] tabular-nums";
