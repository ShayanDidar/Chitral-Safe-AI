import type { Metadata } from "next";
import { Page } from "@/components/layout/Page";
import { SubmissionForm } from "@/components/reports/SubmissionForm";
import { ReportHeader } from "@/components/reports/ReportHeader";

export const metadata: Metadata = { title: "Report a Hazard" };

export default function ReportPage() {
  return (
    <Page>
      <ReportHeader kind="hazard" />
      <SubmissionForm kind="hazard" />
    </Page>
  );
}
