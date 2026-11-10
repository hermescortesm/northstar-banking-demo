import type { ReactNode } from "react";

/** Numbered block of the transfer form (From / To / Amount) with an optional right-hand action. */
export function FormSection({ n, title, action, children }: { n: number; title: string; action?: ReactNode; children: ReactNode }) {
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
