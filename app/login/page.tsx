import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/layout/Page";
import { AuthForm } from "@/components/auth/AuthForm";
import { demoLoginEnabled } from "@/lib/server/demoAccounts";

export const metadata: Metadata = { title: "Sign in" };

export default function PageLogin() {
  return (
    <Page narrow className="flex min-h-[70vh] items-center">
      <Suspense>
        <AuthForm mode="login" demoEnabled={demoLoginEnabled()} />
      </Suspense>
    </Page>
  );
}
