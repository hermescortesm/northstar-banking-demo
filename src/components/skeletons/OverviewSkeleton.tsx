import { ListRowSkeleton, Skeleton, SkeletonRegion } from "../ui/Skeleton";

const card = "rounded-card border border-border bg-surface";
const cardH = "flex flex-wrap items-center justify-between gap-3 px-5 pt-[18px]";

export function OverviewHeroSkeleton() {
  return (
    <div className="flex flex-col items-start gap-[18px]">
      <div>
        <Skeleton className="h-[32px] w-[280px] max-w-full !rounded-lg" />
        <Skeleton className="mt-2 h-[20px] w-[240px] max-w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-[226px] !rounded-full not-phone:h-9" />
        <Skeleton className="h-11 w-[172px] !rounded-full not-phone:h-9" />
      </div>
    </div>
  );
}

/** Heights below were measured from the real card (1440px and 390px) so the swap does not shift the layout. */
export function OverviewChartSkeleton() {
  return (
    <section className={`${card} flex min-w-0 flex-col overflow-hidden px-6 pt-[22px] max-[720px]:px-[18px] max-[720px]:pt-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 w-[531px] max-w-full max-[720px]:min-h-[137px]">
          <Skeleton className="h-[19px] w-[190px]" />
          <Skeleton className="mt-2.5 h-[56px] w-[260px] !rounded-xl max-[720px]:h-[44px]" />
          <Skeleton className="mt-3.5 h-[23px] w-[300px] max-w-full !rounded-full" />
        </div>
        <Skeleton className="h-[36px] w-[202px] !rounded-full max-[720px]:h-[52px] max-[720px]:w-[206px]" />
      </div>
      <div className="mt-[18px] h-[200px] not-phone:h-[246px]">
        <Skeleton className="h-full w-full !rounded-xl" />
      </div>
      <div className="-mx-6 mt-2 grid grid-cols-3 border-t border-border max-[720px]:-mx-[18px] max-[720px]:grid-cols-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex min-w-0 flex-col gap-1 border-r border-border px-6 pb-[18px] pt-4 last:border-r-0 max-[720px]:flex-row max-[720px]:flex-wrap max-[720px]:items-center max-[720px]:justify-between max-[720px]:h-[81px] max-[720px]:border-b max-[720px]:border-r-0 max-[720px]:px-[18px] max-[720px]:py-3.5 max-[720px]:last:border-b-0"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </section>
  );
}

const ACCOUNT_ROWS = ["h-[82px] max-[720px]:h-[64px]", "h-[64px]", "h-[77px]"]; // the demo's three accounts

export function AccountsSkeleton() {
  return (
    <section className={card}>
      <div className={`${cardH} !pb-3.5`}>
        <Skeleton className="h-[22px] w-24" />
        <Skeleton className="h-[19px] w-24" />
      </div>
      {ACCOUNT_ROWS.map((h, i) => <ListRowSkeleton key={i} h={h} />)}
    </section>
  );
}

const INSIGHT_ROWS = ["h-[89px] max-[720px]:h-[71px]", "h-[84px]", "h-[84px]"]; // title + body line counts of the real insights

export function InsightsSkeleton() {
  return (
    <section className={card}>
      <div className={`${cardH} !pb-0`}>
        <Skeleton className="h-[22px] w-24" />
        <Skeleton className="h-[19px] w-32" />
      </div>
      <div className="px-5 pb-5 pt-4">
        {INSIGHT_ROWS.map((h, i) => (
          <div key={i} className={`flex gap-3 border-t border-border py-3 first:border-t-0 first:pt-0 ${h}`}>
            <Skeleton className="size-[30px] flex-none !rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-[19px] w-[60%]" />
              <Skeleton className="mt-2 h-[38px] w-[90%]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CategoriesSkeleton() {
  return (
    <section className={card}>
      <div className={`${cardH} !pb-0`}>
        <div>
          <Skeleton className="h-[22px] w-44" />
          <Skeleton className="mt-0.5 h-[19px] w-64 max-w-full" />
        </div>
      </div>
      <div className="px-5 pb-5 pt-4">
        <div className="grid grid-cols-[168px_minmax(0,1fr)] items-center gap-6 max-[720px]:grid-cols-1 max-[720px]:justify-items-center">
          <Skeleton className="size-[168px] !rounded-full" />
          <div className="w-full min-w-0">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex h-[33px] items-center justify-between gap-2.5 max-[720px]:h-11">
                <Skeleton className="h-4 w-[45%]" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function RecentTransactionsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <section className={card}>
      <div className={`${cardH} !pb-3.5`}>
        <Skeleton className="h-[22px] w-44" />
        <Skeleton className="h-7 w-20 !rounded-full max-[720px]:h-11" />
      </div>
      {Array.from({ length: rows }, (_, i) => <ListRowSkeleton key={i} h="h-[68px]" />)}
    </section>
  );
}

/** Whole Overview screen (used by app/loading.tsx). */
export function OverviewSkeleton() {
  return (
    <SkeletonRegion label="overview" className="flex flex-col gap-6">
      <OverviewHeroSkeleton />
      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-stretch gap-5 max-[1180px]:grid-cols-1">
        <OverviewChartSkeleton />
        <div className="flex min-w-0 flex-col gap-5 max-[1180px]:grid max-[1180px]:grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))]">
          <AccountsSkeleton />
          <InsightsSkeleton />
        </div>
      </div>
      <CategoriesSkeleton />
      <RecentTransactionsSkeleton />
    </SkeletonRegion>
  );
}
