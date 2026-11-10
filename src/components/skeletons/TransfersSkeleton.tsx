import type { ReactNode } from "react";
import { ListRowSkeleton, Skeleton, SkeletonRegion } from "../ui/Skeleton";

const card = "rounded-[16px] border border-border bg-surface";

/**
 * Three account cards. Their real height depends on the form width (names wrap when the cards are narrow), so the
 * height follows the form's own width via container queries: 64px (one line), 85px (wrapped, 3 columns), 64px again when wide.
 */
function OptionsSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-2.5">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-16 !rounded-[14px] @min-[660px]:h-[85px] @min-[810px]:h-16" />
      ))}
    </div>
  );
}

function SectionSkeleton({ headerClass = "h-[22px]", children }: { headerClass?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border p-5 last:border-b-0">
      <div className={`flex items-center gap-2.5 ${headerClass}`}>
        <Skeleton className="size-[22px] !rounded-[7px]" />
        <Skeleton className="h-4 w-16" />
      </div>
      {children}
    </div>
  );
}

/**
 * Transfers screen body: notice, stepper, form card, balances panel, recent transfers. The page header is rendered by the
 * route. Block heights were measured from the real screen at 1440px and 390px so swapping in the real UI does not shift it.
 */
export function TransfersSkeleton() {
  return (
    <SkeletonRegion label="transfers" className="flex flex-col gap-6">
      <Skeleton className="h-[43px] !rounded-xl max-[720px]:h-[99px]" />
      <div className="flex h-6 items-center gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-6 w-20 !rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-5 max-[1180px]:grid-cols-[minmax(0,1fr)]">
        <div className={`${card} min-w-0 @container`}>
          <SectionSkeleton><OptionsSkeleton /></SectionSkeleton>
          <SectionSkeleton headerClass="h-8 max-[720px]:h-11"><OptionsSkeleton /></SectionSkeleton>
          <SectionSkeleton>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-[19px] w-16" />
              <Skeleton className="h-14 !rounded-[10px]" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-[19px] w-24" />
              <Skeleton className="h-10 !rounded-[10px] max-[720px]:h-11" />
            </div>
          </SectionSkeleton>
          <div className="flex h-[76px] items-center justify-end p-5 max-[720px]:h-[84px]">
            <Skeleton className="h-9 w-44 !rounded-full max-[720px]:h-11" />
          </div>
        </div>
        <div className={`${card} px-5 pb-5 pt-[18px]`}>
          <Skeleton className="h-[22px] w-40" />
          <div className="mt-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex h-[60px] items-center justify-between gap-4 border-b border-border last:border-b-0">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3.5 pt-[18px]">
          <div>
            <Skeleton className="h-[22px] w-36" />
            <Skeleton className="mt-0.5 h-[19px] w-[260px] max-w-full" />
          </div>
          <Skeleton className="h-11 w-20 !rounded-full not-phone:h-7" />
        </div>
        {[0, 1, 2, 3, 4].map((i) => <ListRowSkeleton key={i} h="h-16" />)}
      </section>
    </SkeletonRegion>
  );
}
