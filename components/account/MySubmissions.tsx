"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { EyeOff, Loader2, Lock, Plus } from "lucide-react";
import { useHazardStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn, formatDateTime } from "@/lib/utils";
import { Card, PageHeader, ReportIcon, ReviewBadge, btn } from "@/components/ui/primitives";
import { DeleteReportButton } from "@/components/hazards/DeleteReportButton";
import { fetchMyReports } from "@/services/apiClient";
import type { Report } from "@/types";
import { AccountTabs } from "./AccountTabs";

/** The signed-in user's own reports, with their review status. */
export function MySubmissions() {
  const { t, label, place, report: localize, lang } = useI18n();
  const { user } = useHazardStore();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    fetchMyReports()
      .then((r) => {
        setReports(r);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
    // Pick up admin decisions while the page is open.
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load, user?.id]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("account.title")}
        subtitle={user?.email}
        action={
          <Link href="/report" className={cn(btn.base, btn.primary, btn.md)}>
            <Plus className="size-4" aria-hidden /> {t("community.new")}
          </Link>
        }
      />
      <AccountTabs />
      <p className="text-sm text-slate-600">{t("account.submissionsHelp")}</p>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{t("common.error")}</p>}
      {!reports && !error && (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-6 animate-spin text-slate-400" aria-label={t("common.loading")} />
        </div>
      )}
      {reports?.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-sm font-medium text-slate-900">{t("account.noSubmissions")}</p>
          <p className="mt-1 text-sm text-slate-500">{t("account.noSubmissionsSub")}</p>
        </Card>
      )}

      <ul className="space-y-3">
        {reports?.map((r) => (
          <li key={r.id}>
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <ReportIcon report={r} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReviewBadge review={r.review} />
                    {r.visibility === "confidential" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-white">
                        <Lock className="size-3" aria-hidden /> {t("visibility.confidential")}
                      </span>
                    )}
                    {r.identity === "anonymous" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        <EyeOff className="size-3" aria-hidden /> {t("identity.anonymous")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">
                    {label(r)} · {place(r.locationName)}
                  </p>
                  <p dir="auto" className="mt-0.5 line-clamp-2 text-[13px] text-slate-600">
                    {localize(r).description}
                  </p>
                  <p className="mt-1 text-xs text-slate-400" suppressHydrationWarning>
                    {t("account.submittedOn", { date: formatDateTime(r.reportedAt, lang) })}
                  </p>
                  {r.review === "rejected" && (
                    <p dir="auto" className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
                      <strong className="font-semibold">{t("review.reason")}:</strong> {r.rejectionReason || t("review.noReason")}
                    </p>
                  )}
                  {r.review === "pending" && <p className="mt-2 text-xs text-amber-700">{t("review.pendingNote")}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                <Link href={`/reports/${r.id}`} className={cn(btn.base, btn.secondary, btn.md)}>
                  {t("common.viewReport")}
                </Link>
                <DeleteReportButton report={r} onDeleted={() => setReports((all) => all?.filter((x) => x.id !== r.id) ?? null)} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
