import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TransactionsSkeleton } from "@/components/skeletons/TransactionsSkeleton";
import { TransactionsScreen } from "@/components/transactions/TransactionsScreen";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return (
    <>
      <PageHeader title="Transactions" description="Card charges, ACH, wires and internal transfers across your accounts." />
      <Suspense fallback={<TransactionsSkeleton />}>
        <TransactionsScreen />
      </Suspense>
    </>
  );
}
