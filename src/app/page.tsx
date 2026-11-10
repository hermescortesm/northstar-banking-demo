import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  return <PageHeader title="Overview" description="Your accounts at a glance." />;
}
