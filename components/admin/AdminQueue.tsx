"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, EyeOff, Loader2, Lock, Map as MapIcon, MapPin, RefreshCw, UserRound } from "lucide-react";
import { useHazardStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn, formatDateTime } from "@/lib/utils";
import { Card, ReportIcon, ReportTag, ReviewBadge, btn } from "@/components/ui/primitives";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { DeleteReportButton } from "@/components/hazards/DeleteReportButton";
import { fetchAdminReports, type AdminFilter } from "@/services/apiClient";
import type { Report, ReviewStatus } from "@/types";
import { ReviewActions } from "./ReviewActions";

const selectCls =
  "h-9 appearance-none rounded-lg border border-slate-200 bg-white ps-3 pe-8 text-[13px] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

export function AdminQueue() {
  const { t } = useI18n();
  const { refreshReports } = useHazardStore();
  const [filter, setFilter] = useState<AdminFilter>({ review: "pending", kind: "all", visibility: "all" });
  const [reports, setReports] = useState<Report[] | null>(null);
  const [counts, setCounts] = useState<Partial<Record<ReviewStatus, number>>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      fetchAdminReports(filter)
        .then((res) => {
          setReports(res.reports);
          setCounts(res.counts);
          setError(null);
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : t("common.error"))),
    [filter, t],
  );

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 30_000);
    return () => clearInterval(timer);
  }, [load]);

  const onChanged = () => {
    void load();
    // Keep the public feed/map in sync with the decision.
    void refreshReports();
  };

  const tabs: { key: string; label: string; n?: number }[] = [
    { key: "pending", label: t("review.pendingShort"), n: counts.pending },
    { key: "approved", label: t("admin.approved"), n: counts.approved },
    { key: "rejected", label: t("admin.rejected"), n: counts.rejected },
    { key: "all", label: t("filters.all") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("admin.status")}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={filter.review === tab.key}
              onClick={() => {
                setReports(null);
                setFilter((f) => ({ ...f, review: tab.key }));
              }}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium ring-1 ring-inset",
                filter.review === tab.key ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {tab.label}
              {tab.n !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                    filter.review === tab.key ? "bg-white/20" : tab.key === "pending" && tab.n > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100",
                  )}
                >
                  {tab.n}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dropdown
            label={t("admin.kind")}
            value={filter.kind}
            onChange={(kind) => setFilter((f) => ({ ...f, kind }))}
            options={[
              ["all", t("admin.allKinds")],
              ["hazard", t("report.tabHazard")],
              ["crime", t("report.tabCrime")],
            ]}
          />
          <Dropdown
            label={t("visibility.title")}
            value={filter.visibility}
            onChange={(visibility) => setFilter((f) => ({ ...f, visibility }))}
            options={[
              ["all", t("admin.allVisibility")],
              ["public", t("visibility.public")],
              ["confidential", t("visibility.confidential")],
            ]}
          />
          <button type="button" onClick={() => void load()} className={cn(btn.base, btn.ghost, btn.sm)} aria-label={t("admin.refresh")}>
            <RefreshCw className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {!reports && !error && (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-6 animate-spin text-slate-400" aria-label={t("common.loading")} />
        </div>
      )}
      {reports?.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-500">{t(filter.review === "pending" ? "admin.emptyPending" : "admin.empty")}</Card>
      )}
      <ul className="space-y-3">
        {reports?.map((r) => (
          <li key={r.id}>
            <AdminReportCard report={r} onChanged={onChanged} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminReportCard({ report: r, onChanged }: { report: Report; onChanged: () => void }) {
  const { t, label, place, lang } = useI18n();
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ReviewBadge review={r.review} />
            <ReportTag report={r} />
            {r.visibility === "confidential" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-white">
                <Lock className="size-3" aria-hidden /> {t("visibility.confidential")}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{t("visibility.public")}</span>
            )}
            {r.identity === "anonymous" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                <EyeOff className="size-3" aria-hidden /> {t("identity.anonymous")}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-start gap-3">
            <ReportIcon report={r} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{label(r)}</p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="size-3" aria-hidden /> {place(r.locationName)} ·{" "}
                <span className="tabular-nums">
                  {r.coordinates.lat.toFixed(4)}, {r.coordinates.lng.toFixed(4)}
                </span>
              </p>
            </div>
          </div>
          <p dir="auto" className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-slate-700">
            {r.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <UserRound className="size-3" aria-hidden />
              {r.reporter ? `${r.reporter.name} · ${r.reporter.email}` : t("admin.anonymousReporter")}
            </span>
            <span>
              {t("detail.reported")} <TimeAgo iso={r.reportedAt} />
            </span>
            {r.kind === "crime" && r.occurredAt && (
              <span suppressHydrationWarning>
                {t("crime.occurredShort")}: {formatDateTime(r.occurredAt, lang)}
              </span>
            )}
          </div>
          {r.review === "rejected" && r.rejectionReason && (
            <p dir="auto" className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <strong className="font-semibold">{t("review.reason")}:</strong> {r.rejectionReason}
            </p>
          )}
          {r.kind === "crime" && r.visibility === "public" && r.review === "pending" && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{t("admin.crimeChecklist")}</p>
          )}
        </div>
        {r.imageUrls.length > 0 && (
          <div className="flex gap-2 sm:w-56 sm:flex-col">
            {r.imageUrls.slice(0, 2).map((src) => (
              <a key={src} href={src} target="_blank" rel="noreferrer" className="block flex-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={t("post.photo")} className="h-28 w-full rounded-lg object-cover" />
              </a>
            ))}
            {r.imageUrls.length > 2 && <p className="text-xs text-slate-500">+{r.imageUrls.length - 2}</p>}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-start justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
        <Link href={`/reports/${r.id}`} className={cn(btn.base, btn.ghost, btn.md)}>
          {t("common.viewReport")}
        </Link>
        <Link href={`/admin/map?focus=${r.id}`} className={cn(btn.base, btn.ghost, btn.md)}>
          <MapIcon className="size-4" aria-hidden /> {t("common.map")}
        </Link>
        <DeleteReportButton report={r} onDeleted={onChanged} />
        <ReviewActions report={r} onChange={onChanged} />
      </div>
    </Card>
  );
}

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
    </label>
  );
}
