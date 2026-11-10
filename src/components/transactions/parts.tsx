import { CATEGORIES } from "@/lib/data";
import type { Account, Transaction } from "@/lib/types";
import { TxIcon } from "./TxIcon";

/** Table grid shared by the header, rows and the loading skeleton so they line up exactly. */
export const GRID =
  "grid items-center gap-4 px-5 grid-cols-[92px_minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_116px_136px] max-[1180px]:grid-cols-[92px_minmax(0,1.7fr)_minmax(0,1fr)_116px_136px] max-[720px]:grid-cols-[minmax(0,1fr)_auto] max-[720px]:gap-3";

export const STATUS_LABEL = { completed: "Completed", pending: "Pending", failed: "Failed" } as const;

const CHIP: Record<Transaction["status"], string> = {
  completed: "bg-pos-soft text-pos",
  pending: "bg-warn-soft text-warn",
  failed: "bg-neg-soft text-neg",
};

export function StatusChip({ status, small }: { status: Transaction["status"]; small?: boolean }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full font-medium ${
        small ? "h-5 px-2 text-[11px]" : "h-6 px-2.5 text-xs"
      } ${CHIP[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function SimTag() {
  return (
    <span className="ml-1.5 rounded-[5px] bg-warn-soft px-[5px] py-px text-[10px] font-semibold uppercase tracking-[0.04em] text-warn">
      Simulated
    </span>
  );
}

/** Category tile: icon in the category colour on a 13% tint. */
export function CategoryTile({ category, size = "md" }: { category: Transaction["category"]; size?: "md" | "lg" }) {
  const c = CATEGORIES[category] ?? CATEGORIES.Transfer;
  const lg = size === "lg";
  return (
    <span
      aria-hidden="true"
      className={`grid flex-none place-items-center ${lg ? "size-12 rounded-[14px]" : "size-9 rounded-[10px]"}`}
      style={{ color: c.color, background: `${c.color}21` }}
    >
      <TxIcon name={c.icon} size={lg ? 22 : 18} />
    </span>
  );
}

export function accountLabel(accounts: readonly Account[], id: string): string {
  const a = accounts.find((x) => x.id === id);
  return a ? `${a.shortName} ••${a.mask}` : id;
}

export const ghostBtn =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-transparent bg-transparent px-3 text-[13.5px] font-medium text-text hover:bg-hover";
export const outlineBtn =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-border-strong bg-surface px-[15px] text-[13.5px] font-medium text-text hover:bg-hover active:translate-y-px";
