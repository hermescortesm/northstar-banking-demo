import { Icon } from "../icons";
import type { SortDir, SortKey } from "./filters";

/** Column header button that shows and toggles the sort state. */
export function SortHeader({
  label, k, sort, onSort, className = "",
}: { label: string; k: SortKey; sort: { key: SortKey; dir: SortDir }; onSort: (k: SortKey) => void; className?: string }) {
  const on = sort.key === k;
  const state = on ? (sort.dir === "asc" ? "ascending" : "descending") : "not sorted";
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      aria-label={`Sort by ${label.toLowerCase()} (${state})`}
      className={`inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent py-1 text-xs font-medium transition-colors hover:text-text ${on ? "text-text" : "text-text-3"} ${className}`}
    >
      {label}
      <Icon name={on ? (sort.dir === "asc" ? "chevUp" : "chevDown") : "chevUpDown"} size={14} />
    </button>
  );
}
