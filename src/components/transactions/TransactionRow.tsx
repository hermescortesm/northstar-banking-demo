import { CATEGORIES } from "@/lib/data";
import { formatDayShort } from "@/lib/dates";
import { formatSignedCents } from "@/lib/money";
import { stagger } from "@/lib/motion";
import type { Transaction } from "@/lib/types";
import { Money } from "../ui/Money";
import { SimTag, STATUS_LABEL, StatusPill } from "../ui/Badge";
import { CategoryTile, GRID } from "./parts";

/** One clickable row of the transactions table (stacks into two columns on phones). `i` drives the entrance stagger. */
export function TransactionRow({
  t, i, accountText, onOpen,
}: { t: Transaction; i: number; accountText: string; onOpen: (t: Transaction, el: HTMLElement) => void }) {
  const date = formatDayShort(t.day);
  const cat = CATEGORIES[t.category];
  return (
    <button
      type="button"
      onClick={(e) => onOpen(t, e.currentTarget)}
      aria-label={`${t.merchant}, ${formatSignedCents(t.amountCents)}, ${STATUS_LABEL[t.status]}, ${date}`}
      style={stagger(i, 10)}
      className={`enter ${GRID} min-h-[62px] w-full cursor-pointer border-0 border-b border-border bg-transparent py-2.5 text-left transition-colors duration-150 hover:bg-surface-2`}
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
      <span className="max-[720px]:hidden"><StatusPill status={t.status} /></span>
      <span className="flex flex-col items-end gap-0.5 text-right">
        <Money cents={t.amountCents} signed tone strike={t.status === "failed"} className="whitespace-nowrap font-medium" />
        <span className="max-w-full truncate text-xs text-text-3">{t.method}</span>
      </span>
    </button>
  );
}
