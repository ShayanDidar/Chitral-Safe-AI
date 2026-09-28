"use client";

import Link from "next/link";
import { Page } from "@/components/layout/Page";
import { Card, btn } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <Page narrow>
      <Card className="p-10 text-center">
        <p className="text-base font-semibold text-slate-900">{t("notFound.title")}</p>
        <p className="mt-1 text-sm text-slate-500">{t("notFound.body")}</p>
        <Link href="/" className={cn(btn.base, btn.primary, btn.md, "mt-5")}>
          {t("notFound.back")}
        </Link>
      </Card>
    </Page>
  );
}
