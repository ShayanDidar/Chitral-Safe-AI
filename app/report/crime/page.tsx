import type { Metadata } from "next";
import { Page } from "@/components/layout/Page";
import { SubmissionForm } from "@/components/report/SubmissionForm";
import { ReportHeader } from "../ReportHeader";

export const metadata: Metadata = { title: "Report a Crime" };

export default function ReportCrimePage() {
  return (
    <Page>
      <ReportHeader kind="crime" />
      <SubmissionForm kind="crime" />
    </Page>
  );
}
