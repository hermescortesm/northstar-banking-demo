import type { ReactNode } from "react";

/** Page title block: h1, one-line description and an optional badge/action on the right. */
export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] max-[720px]:text-[22px]">{title}</h1>
        <p className="mt-1 text-text-3">{description}</p>
      </div>
      {actions}
    </header>
  );
}
