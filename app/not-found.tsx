import Link from "next/link";
import { Page } from "@/components/layout/Page";
import { Card, btn } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <Page narrow>
      <Card className="p-10 text-center">
        <p className="text-base font-semibold text-slate-900">Page not found</p>
        <p className="mt-1 text-sm text-slate-500">The page you are looking for doesn&apos;t exist.</p>
        <Link href="/" className={cn(btn.base, btn.primary, btn.md, "mt-5")}>
          Back to overview
        </Link>
      </Card>
    </Page>
  );
}
