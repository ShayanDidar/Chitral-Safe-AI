import type { Metadata } from "next";
import { Suspense } from "react";
import { AssistantView } from "./AssistantView";

export const metadata: Metadata = { title: "AI Assistant" };

export default function AssistantPage() {
  return (
    <Suspense>
      <AssistantView />
    </Suspense>
  );
}
