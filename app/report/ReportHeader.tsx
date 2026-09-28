"use client";

import { PageHeader } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function ReportHeader() {
  const { t } = useI18n();
  return <PageHeader title={t("report.title")} subtitle={t("report.subtitle")} />;
}
