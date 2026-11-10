import type { Metadata } from "next";
import { TransferFlow } from "@/components/transfers/TransferFlow";

export const metadata: Metadata = { title: "Transfers" };

export default function TransfersPage() {
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] max-[720px]:text-[22px]">Transfers</h1>
          <p className="mt-1 text-text-3">Move money between your Northstar accounts.</p>
        </div>
        <span className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border border-warn/20 bg-warn-soft px-[9px] text-xs font-medium text-warn">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          Simulation
        </span>
      </header>
      <TransferFlow />
    </>
  );
}
