import type { CSSProperties, ReactNode } from "react";

/** A shimmering placeholder block. Decorative: always hidden from assistive tech. */
export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={`sk block ${className}`} style={style} />;
}

/**
 * Wraps a skeleton layout: one polite live region that announces "Loading ..." once,
 * marked busy, with the decorative blocks hidden from the accessibility tree.
 */
export function SkeletonRegion({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" data-testid="skeleton" className={className}>
      <span className="sr-only">Loading {label}</span>
      <div aria-hidden="true" className="contents">
        {children}
      </div>
    </div>
  );
}

const rowCls = "grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-5";

/**
 * Row skeleton shared by the Accounts and Recent transactions lists (36px tile, two text lines, right-aligned value).
 * `h` fixes the row height (Tailwind classes) so the skeleton matches the real row it stands in for.
 */
export function ListRowSkeleton({ h = "h-[61px]", round = false }: { h?: string; round?: boolean }) {
  return (
    <div className={`${rowCls} ${h}`}>
      <Skeleton className={`size-9 ${round ? "!rounded-full" : "!rounded-[10px]"}`} />
      <span className="flex min-w-0 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-[55%]" />
        <Skeleton className="h-3 w-[38%]" />
      </span>
      <span className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3 w-12" />
      </span>
    </div>
  );
}
