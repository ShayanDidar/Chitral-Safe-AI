import type { Metadata } from "next";
import { Page } from "@/components/layout/Page";
import { MySubmissions } from "@/components/account/MySubmissions";

export const metadata: Metadata = { title: "My submissions" };

export default function SubmissionsPage() {
  return (
    <Page narrow>
      <MySubmissions />
    </Page>
  );
}
