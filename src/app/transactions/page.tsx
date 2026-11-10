import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return <PageHeader title="Transactions" description="Review every deposit, payment, and transfer." />;
}
