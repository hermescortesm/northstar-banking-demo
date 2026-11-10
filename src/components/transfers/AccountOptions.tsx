import type { Account, AccountId } from "@/lib/types";

export const acctLabel = (a: Account) => `${a.name} ••${a.mask}`;

/** Radio-card style picker for the source or destination account (a group of toggle buttons). */
export function AccountOptions({
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
            className={`flex min-h-11 w-full cursor-pointer items-start gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-[border-color,background,transform] duration-150 hover:-translate-y-px ${
              on ? "border-accent bg-accent-soft shadow-[inset_0_0_0_1px_var(--accent)]" : "border-border-strong bg-surface hover:border-text-3"
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-px grid size-[18px] flex-none place-items-center rounded-full border-[1.5px] bg-surface ${on ? "border-accent" : "border-border-strong"}`}
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
