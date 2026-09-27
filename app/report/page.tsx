import type { Metadata } from "next";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/ui/primitives";
import { ReportForm } from "@/components/report/ReportForm";

export const metadata: Metadata = { title: "Report a Hazard" };

export default function ReportPage() {
  return (
    <Page>
      <PageHeader
        title="Report a Hazard"
        subtitle="No account needed. Your report appears instantly on the map and in the community feed."
      />
      <ReportForm />
    </Page>
  );
}
