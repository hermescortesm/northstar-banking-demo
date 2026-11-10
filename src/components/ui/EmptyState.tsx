import type { ReactNode } from "react";
import { Icon, type IconName } from "../icons";

/** Centered "nothing here" block. Usage: <EmptyState icon="search" title="No results" action={<Button>Reset</Button>}>Try again</EmptyState> */
export function EmptyState({
  icon, title, action, children,
}: { icon: IconName; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 py-14 text-center">
      <span aria-hidden="true" className="grid size-[52px] place-items-center rounded-[14px] border border-border bg-surface-2 text-text-3">
        <Icon name={icon} />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-[380px] text-[13px] text-text-3">{children}</p>
      {action}
    </div>
  );
}
