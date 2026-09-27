import type { Metadata } from "next";
import { ReportDetailView } from "./ReportDetailView";

export const metadata: Metadata = { title: "Hazard Report" };

export default async function ReportPage(props: PageProps<"/reports/[id]">) {
  const { id } = await props.params;
  return <ReportDetailView id={id} />;
}
