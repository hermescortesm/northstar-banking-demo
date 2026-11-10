import { ListRowSkeleton, Skeleton, SkeletonRegion } from "../ui/Skeleton";

const card = "rounded-[16px] border border-border bg-surface";

function OptionsSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-2.5">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[66px] !rounded-[14px]" />
      ))}
    </div>
  );
}

function SectionSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border p-5 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-[22px] !rounded-[7px]" />
        <Skeleton className="h-4 w-16" />
      </div>
      {children}
    </div>
  );
}

/** Transfers screen body (form card, balances panel, recent transfers). The page header is rendered by the route. */
export function TransfersSkeleton() {
  return (
    <SkeletonRegion label="transfers" className="flex flex-col gap-6">
      <Skeleton className="h-[68px] !rounded-xl min-[560px]:h-[44px]" />
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-6 w-20 !rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5 max-[1180px]:grid-cols-[minmax(0,1fr)]">
        <div className={`${card} min-w-0`}>
          <SectionSkeleton><OptionsSkeleton /></SectionSkeleton>
          <SectionSkeleton><OptionsSkeleton /></SectionSkeleton>
          <SectionSkeleton>
            <Skeleton className="h-14 !rounded-[10px]" />
            <Skeleton className="h-11 !rounded-[10px] not-phone:h-10" />
          </SectionSkeleton>
          <div className="flex justify-end p-5">
            <Skeleton className="h-11 w-44 !rounded-full not-phone:h-9" />
          </div>
        </div>
        <div className={`${card} px-5 pb-5 pt-[18px]`}>
          <Skeleton className="h-[18px] w-40" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="mt-3 flex items-center justify-between gap-4 border-b border-border pb-[11px] last:border-b-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3.5 pt-[18px]">
          <div>
            <Skeleton className="h-[18px] w-36" />
            <Skeleton className="mt-1 h-4 w-56 max-w-full" />
          </div>
        </div>
        {[0, 1, 2].map((i) => <ListRowSkeleton key={i} py="py-3" />)}
      </section>
    </SkeletonRegion>
  );
}
