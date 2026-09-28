import type { Metadata } from "next";
import { Page } from "@/components/layout/Page";
import { ReportForm } from "@/components/report/ReportForm";
import { ReportHeader } from "./ReportHeader";

export const metadata: Metadata = { title: "Report a Hazard" };

export default function ReportPage() {
  return (
    <Page>
      <ReportHeader />
      <ReportForm />
    </Page>
  );
}
