"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Camera, Plus } from "lucide-react";
import { useHazardStore } from "@/lib/store";
import { HAZARD_TYPES, HAZARD_TYPE_LIST } from "@/lib/hazards";
import { cn } from "@/lib/utils";
import { Card, PageHeader, SectionHeader, btn } from "@/components/ui/primitives";
import { Page } from "@/components/layout/Page";
import { CommunityPost } from "@/components/community/CommunityPost";
import { ReportFilters, useReportFilters } from "@/components/hazards/ReportFilters";
import { AlertCard } from "@/components/alerts/AlertCard";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function CommunityView() {
  const params = useSearchParams();
  const highlight = params.get("highlight");
  const { reports, alerts } = useHazardStore();
  const { t, hazard } = useI18n();
  const { filters, setFilters, filtered, locations } = useReportFilters(reports);
  const [flash, setFlash] = useState<string | null>(highlight);

  useEffect(() => {
    if (!highlight) return;
    const t1 = setTimeout(() => {
      document.getElementById(`post-${highlight}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    const t2 = setTimeout(() => setFlash(null), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [highlight]);

  const byType = useMemo(() => {
    const active = reports.filter((r) => r.status !== "resolved");
    return HAZARD_TYPE_LIST.map((type) => ({ type, count: active.filter((r) => r.type === type).length }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [reports]);
  const maxCount = Math.max(1, ...byType.map((x) => x.count));

  return (
    <Page>
      <PageHeader
        title={t("community.title")}
        subtitle={t("community.subtitle")}
        action={
          <Link href="/report" className={cn(btn.base, btn.primary, btn.md)}>
            <Plus className="size-4" aria-hidden /> {t("community.new")}
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Card className="p-3">
            <ReportFilters filters={filters} setFilters={setFilters} locations={locations} resultCount={filtered.length} />
          </Card>

          <Link
            href="/report"
            className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-3.5 text-sm text-slate-500 transition-colors hover:border-brand-300 hover:bg-white"
          >
            <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-brand-700">
              <Camera className="size-4" aria-hidden />
            </span>
            {t("community.prompt")}
          </Link>

          {filtered.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-sm font-medium text-slate-900">{t("community.noMatch")}</p>
              <p className="mt-1 text-sm text-slate-500">{t("community.noMatchSub")}</p>
            </Card>
          ) : (
            filtered.map((r) => <CommunityPost key={r.id} report={r} highlighted={flash === r.id} />)
          )}
        </div>

        <aside className="hidden space-y-5 lg:sticky lg:top-20 lg:block lg:self-start">
          <Card className="p-4">
            <SectionHeader title={t("community.byType")} subtitle={t("community.byTypeSub")} />
            <ul className="mt-4 space-y-3">
              {byType.map(({ type, count }) => {
                const Icon = HAZARD_TYPES[type].icon;
                return (
                  <li key={type}>
                    <button
                      type="button"
                      onClick={() => setFilters({ ...filters, type })}
                      className="group w-full text-start"
                    >
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="inline-flex items-center gap-2 font-medium text-slate-700 group-hover:text-slate-900">
                          <Icon className="size-4 text-slate-400" aria-hidden />
                          {hazard(type)}
                        </span>
                        <span className="tabular-nums text-slate-500">{count}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand-600" style={{ width: `${(count / maxCount) * 100}%` }} />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
          <div className="space-y-3">
            <SectionHeader title={t("alerts.short")} />
            {alerts.slice(0, 3).map((a) => (
              <AlertCard key={a.id} alert={a} compact />
            ))}
          </div>
          <div className="rounded-2xl bg-brand-900 p-5 text-white">
            <p className="text-sm font-semibold">{t("community.guidelines")}</p>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-brand-100">
              <li>• {t("community.g1")}</li>
              <li>• {t("community.g2")}</li>
              <li>• {t("community.g3")}</li>
            </ul>
          </div>
        </aside>
      </div>
    </Page>
  );
}
