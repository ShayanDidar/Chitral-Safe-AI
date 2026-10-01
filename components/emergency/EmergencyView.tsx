"use client";

import { PhoneCall } from "lucide-react";
import { Card, PageHeader } from "@/components/ui/primitives";
import { EmergencyContactList, NotEmergencyNotice } from "@/components/emergency/EmergencyContacts";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function EmergencyView() {
  const { t } = useI18n();
  return (
    <div className="space-y-5">
      <PageHeader title={t("emergency.title")} subtitle={t("emergency.subtitle")} />
      <NotEmergencyNotice className="text-sm" />
      <Card className="px-5">
        <EmergencyContactList />
      </Card>
      <Card className="flex items-start gap-3 p-5 text-sm text-slate-600">
        <PhoneCall className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden />
        <p>{t("emergency.configNote")}</p>
      </Card>
    </div>
  );
}
