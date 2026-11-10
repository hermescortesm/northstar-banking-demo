import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Transfers" };

export default function TransfersPage() {
  return <PageHeader title="Transfers" description="Move money between your accounts." />;
}
