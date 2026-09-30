import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/layout/Page";
import { AuthForm } from "@/components/auth/AuthForm";
import { demoLoginEnabled } from "@/lib/server/demoAccounts";

export const metadata: Metadata = { title: "Create account" };

export default function PageSignup() {
  return (
    <Page narrow className="pt-12 lg:pt-16">
      <Suspense>
        <AuthForm mode="signup" demoEnabled={demoLoginEnabled()} />
      </Suspense>
    </Page>
  );
}
