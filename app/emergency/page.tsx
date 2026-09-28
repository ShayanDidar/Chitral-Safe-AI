import type { Metadata } from "next";
import { Page } from "@/components/layout/Page";
import { EmergencyView } from "./EmergencyView";

export const metadata: Metadata = { title: "Emergency contacts" };

export default function EmergencyPage() {
  return (
    <Page narrow>
      <EmergencyView />
    </Page>
  );
}
