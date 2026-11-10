import { GRID } from "../transactions/parts";
import { Skeleton, SkeletonRegion } from "./Skeleton";

/** One table row: desktop grid columns, collapsing to the stacked two-column layout on phones. */
export function TransactionRowSkeleton() {
  return (
    <div className={`${GRID} min-h-[62px] border-b border-border py-2.5`}>
      <Skeleton className="h-3.5 w-14 max-[720px]:hidden" />
      <span className="flex min-w-0 items-center gap-3">
        <Skeleton className="size-9 flex-none !rounded-[10px]" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-3.5 w-[55%]" />
          <Skeleton className="h-3 w-[35%]" />
        </span>
      </span>
      <Skeleton className="h-3.5 w-20 max-[720px]:hidden" />
      <Skeleton className="h-3.5 w-24 max-[1180px]:hidden" />
      <Skeleton className="h-6 w-20 !rounded-full max-[720px]:hidden" />
      <span className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3 w-12" />
      </span>
    </div>
  );
}

export function TransactionsSkeleton({ rows = 12 }: { rows?: number }) {
  return (
    <SkeletonRegion label="transactions">
      <section className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-5 py-4 max-[720px]:px-4">
          <Skeleton className="h-[38px] min-w-[260px] flex-[1_1_260px] !rounded-full max-[720px]:h-11 max-[720px]:min-w-full" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[38px] min-w-[130px] !rounded-[10px] max-[720px]:h-11 max-[720px]:min-w-0 max-[720px]:flex-[1_1_140px]" />
          ))}
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-[38px] w-[110px] !rounded-[10px] max-[720px]:h-11 max-[720px]:w-auto max-[720px]:min-w-0 max-[720px]:flex-[1_1_110px]" />
          ))}
        </div>
        <div className="flex items-center gap-[18px] border-b border-border bg-surface-2 px-5 py-2.5 max-[720px]:px-4">
          <Skeleton className="h-[19px] w-72 max-w-full" />
        </div>
        <div className={`${GRID} h-10 border-b border-border max-[720px]:hidden`}>
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14 max-[1180px]:hidden" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-14 justify-self-end" />
        </div>
        {Array.from({ length: rows }, (_, i) => <TransactionRowSkeleton key={i} />)}
        <div className="flex items-center justify-between gap-3 px-5 py-3 max-[720px]:px-4">
          <Skeleton className="h-[19px] w-40" />
          <Skeleton className="h-8 w-48 !rounded-lg max-[720px]:h-11" />
        </div>
      </section>
    </SkeletonRegion>
  );
}
