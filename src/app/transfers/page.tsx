import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { TransferFlow } from "@/components/transfers/TransferFlow";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Transfers" };

export default function TransfersPage() {
  return (
    <>
      <PageHeader
        title="Transfers"
        description="Move money between your Northstar accounts."
        actions={<Badge tone="warning" dot outlined>Simulation</Badge>}
      />
      <TransferFlow />
    </>
  );
}
