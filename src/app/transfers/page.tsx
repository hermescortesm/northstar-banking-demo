import type { Metadata } from "next";
import { TransfersHeader } from "@/components/transfers/TransfersHeader";
import { TransferFlow } from "@/components/transfers/TransferFlow";

export const metadata: Metadata = { title: "Transfers" };

export default function TransfersPage() {
  return (
    <>
      <TransfersHeader />
      <TransferFlow />
    </>
  );
}
