import type { Metadata } from "next";
import { Suspense } from "react";
import { CommunityView } from "@/components/community/CommunityView";

export const metadata: Metadata = { title: "Community" };

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityView />
    </Suspense>
  );
}
