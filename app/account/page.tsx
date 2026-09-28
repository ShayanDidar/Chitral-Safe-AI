import type { Metadata } from "next";
import { Page } from "@/components/layout/Page";
import { ProfileView } from "@/components/account/ProfileView";

export const metadata: Metadata = { title: "Your profile" };

export default function AccountPage() {
  return (
    <Page narrow>
      <ProfileView />
    </Page>
  );
}
