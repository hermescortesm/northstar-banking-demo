import type { ReactNode } from "react";
import { Icon } from "../icons";
import { cn } from "./cn";

export type PageItem = { gap: true; key: string } | { gap?: false; page: number };

function PageButton({
  label, current, disabled, onClick, children,
}: { label: string; current?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={current ? "page" : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border px-1 text-[13px] transition-colors enabled:hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40 not-phone:h-8 not-phone:min-w-8",
        current ? "border-border-strong bg-surface font-semibold text-text" : "border-transparent bg-transparent text-text-2",
      )}
    >
      {children}
    </button>
  );
}

/** Previous / numbered / next page buttons. `items` comes from pageItems() in transactions/filters. */
export function Pagination({
  items, current, last, onPage,
}: { items: readonly PageItem[]; current: number; last: number; onPage: (n: number) => void }) {
  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <PageButton label="Previous page" disabled={current <= 1} onClick={() => onPage(current - 1)}><Icon name="chevLeft" size={14} /></PageButton>
      {items.map((it) =>
        it.gap ? (
          <span key={it.key} aria-hidden="true" className="px-1">{"\u2026"}</span>
        ) : (
          <PageButton key={it.page} label={`Page ${it.page}`} current={it.page === current} onClick={() => onPage(it.page)}>{it.page}</PageButton>
        ),
      )}
      <PageButton label="Next page" disabled={current >= last} onClick={() => onPage(current + 1)}><Icon name="chevRight" size={14} /></PageButton>
    </nav>
  );
}
