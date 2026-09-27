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

export function CommunityView() {
  const params = useSearchParams();
  const highlight = params.get("highlight");
  const { reports, alerts } = useHazardStore();
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
    return HAZARD_TYPE_LIST.map((t) => ({ type: t, count: active.filter((r) => r.type === t).length }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [reports]);
  const maxCount = Math.max(1, ...byType.map((x) => x.count));

  return (
    <Page>
      <PageHeader
        title="Community"
        subtitle="Environmental reports shared by people across Chitral. Reports are unverified — use your judgement."
        action={
          <Link href="/report" className={cn(btn.base, btn.primary, btn.md)}>
            <Plus className="size-4" aria-hidden /> New report
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
            Seen something? Share a photo and update with the community…
          </Link>

          {filtered.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-sm font-medium text-slate-900">No reports match your filters</p>
              <p className="mt-1 text-sm text-slate-500">Try clearing a filter or searching for another location.</p>
            </Card>
          ) : (
            filtered.map((r) => <CommunityPost key={r.id} report={r} highlighted={flash === r.id} />)
          )}
        </div>

        <aside className="hidden space-y-5 lg:sticky lg:top-20 lg:block lg:self-start">
          <Card className="p-4">
            <SectionHeader title="Active reports by type" subtitle="Excludes resolved reports" />
            <ul className="mt-4 space-y-3">
              {byType.map(({ type, count }) => {
                const Icon = HAZARD_TYPES[type].icon;
                return (
                  <li key={type}>
                    <button
                      type="button"
                      onClick={() => setFilters({ ...filters, type })}
                      className="group w-full text-left"
                    >
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="inline-flex items-center gap-2 font-medium text-slate-700 group-hover:text-slate-900">
                          <Icon className="size-4 text-slate-400" aria-hidden />
                          {HAZARD_TYPES[type].label}
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
            <SectionHeader title="Alerts" />
            {alerts.slice(0, 3).map((a) => (
              <AlertCard key={a.id} alert={a} compact />
            ))}
          </div>
          <div className="rounded-2xl bg-brand-900 p-5 text-white">
            <p className="text-sm font-semibold">Reporting guidelines</p>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-brand-100">
              <li>• Report only what you have seen yourself.</li>
              <li>• Include a clear location and a photo if safe.</li>
              <li>• Update the report in comments when things change.</li>
            </ul>
          </div>
        </aside>
      </div>
    </Page>
  );
}
