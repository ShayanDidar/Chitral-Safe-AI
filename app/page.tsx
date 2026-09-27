"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, CloudRain, Maximize2, Plus, Sparkles, Thermometer, TriangleAlert } from "lucide-react";
import { useHazardStore, useActiveReports } from "@/lib/store";
import { useChitralRisk } from "@/lib/useAIContext";
import { cn } from "@/lib/utils";
import { Card, DemoBadge, PageHeader, SectionHeader, btn } from "@/components/ui/primitives";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { MapLegend, MapView } from "@/components/map";
import { AlertCard } from "@/components/alerts/AlertCard";
import { HazardCard } from "@/components/hazards/HazardCard";
import { WeatherIconGlyph } from "@/components/weather/WeatherIconGlyph";
import { RiskDisclaimer, RiskLevelPill, RiskScoreBar } from "@/components/ai/RiskSummary";
import { AskAIPrompt } from "@/components/ai/AskAIPrompt";
import { Page } from "@/components/layout/Page";

export default function HomePage() {
  const { reports, weather, alerts } = useHazardStore();
  const active = useActiveReports();
  const recent = useMemo(() => reports.slice(0, 8), [reports]);
  const serious = active.filter((r) => r.severity === "critical").length;
  const high = active.filter((r) => r.severity === "high").length;
  const mine = reports.filter((r) => r.source === "user").length;
  const c = weather.current;

  return (
    <Page>
      <PageHeader
        title="Chitral Environmental Overview"
        subtitle="Live community reports, weather and alerts across Chitral."
        action={
          <div className="flex gap-2">
            <Link href="/map" className={cn(btn.base, btn.secondary, btn.md)}>
              Open map
            </Link>
            <Link href="/report" className={cn(btn.base, btn.primary, btn.md)}>
              <Plus className="size-4" aria-hidden /> Report a hazard
            </Link>
          </div>
        }
      />

      {/* Environmental status */}
      <section aria-label="Environmental status" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile
          label="Temperature"
          icon={<Thermometer className="size-4" aria-hidden />}
          value={`${c.temperature}°C`}
          sub={`H ${c.high}° · L ${c.low}° · Feels ${c.feelsLike}°`}
        />
        <StatTile
          label="Weather"
          icon={<WeatherIconGlyph icon={c.icon} className="size-4" />}
          value={c.condition}
          valueClass="text-xl sm:text-2xl"
          sub={`Humidity ${c.humidity}% · Wind ${c.windSpeed} km/h`}
        />
        <StatTile
          label="Rain probability"
          icon={<CloudRain className="size-4" aria-hidden />}
          value={`${c.rainProbability}%`}
          sub={
            <span className="block">
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                <span className="block h-full rounded-full bg-sky-600" style={{ width: `${c.rainProbability}%` }} />
              </span>
              <span className="mt-1.5 block">~{c.precipitationMm} mm expected today</span>
            </span>
          }
        />
        <StatTile
          label="Active hazards"
          icon={<TriangleAlert className="size-4" aria-hidden />}
          value={String(active.length)}
          sub={
            <span className="flex flex-wrap items-center gap-x-2">
              {serious > 0 && <span className="font-medium text-red-700">{serious} critical</span>}
              {high > 0 && <span className="font-medium text-orange-700">{high} high</span>}
              {mine > 0 && <span className="font-medium text-brand-700">{mine} new from you</span>}
            </span>
          }
          accent
        />
      </section>

      <StatusSummary />

      {/* Map + alerts */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden lg:col-span-2">
          <div className="h-[340px] sm:h-[440px]">
            <MapView reports={reports} compact />
          </div>
          <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] flex justify-end">
            <Link href="/map" className={cn(btn.base, btn.secondary, btn.sm, "pointer-events-auto shadow-float")}>
              <Maximize2 className="size-3.5" aria-hidden /> Full map
            </Link>
          </div>
          <MapLegend horizontal className="absolute bottom-3 left-3 z-[500] hidden sm:block" />
        </Card>

        <div className="flex flex-col gap-3">
          <SectionHeader
            title="Environmental alerts"
            subtitle={`${alerts.length} active across Chitral`}
          />
          <AlertCard alert={alerts[0]} />
          {alerts.slice(1, 3).map((a) => (
            <AlertCard key={a.id} alert={a} compact />
          ))}
        </div>
      </section>

      {/* Recent reports */}
      <section className="space-y-3">
        <SectionHeader
          title="Recent community reports"
          subtitle="Submitted by people across Chitral"
          action={
            <Link href="/community" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
              View all <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        />
        <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6">
          {recent.map((r) => (
            <HazardCard key={r.id} report={r} className="w-[260px] shrink-0 snap-start sm:w-72" />
          ))}
        </div>
      </section>

      <AskAIPrompt />

      <p className="text-center text-xs text-slate-400">
        Weather {weather.source === "demo" ? "(demo data)" : "from Open-Meteo"} updated <TimeAgo iso={weather.updatedAt} />
      </p>
    </Page>
  );
}

function StatTile({
  label,
  icon,
  value,
  sub,
  valueClass,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  sub?: React.ReactNode;
  valueClass?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <span className={cn("grid size-7 place-items-center rounded-lg", accent ? "bg-orange-50 text-orange-700" : "bg-slate-100 text-slate-500")}>
          {icon}
        </span>
      </div>
      <p className={cn("mt-2 truncate font-semibold tracking-tight text-slate-900 tabular-nums", valueClass ?? "text-2xl sm:text-3xl")}>
        {value}
      </p>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </Card>
  );
}

function StatusSummary() {
  const { risk, loading } = useChitralRisk();
  const a = risk?.assessment;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">Environmental status</p>
              {a && <RiskLevelPill level={a.level} />}
              {risk && <DemoBadge live={risk.mode === "live"} label={risk.mode === "live" ? "AI analysis" : "Demo analysis"} />}
            </div>
            {a ? (
              <>
                <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">{a.headline}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-500">Possible risks:</span>
                  {a.possibleRisks.map((r) => (
                    <span key={r} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {r}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-2 space-y-2" aria-busy={loading}>
                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-3/5 animate-pulse rounded bg-slate-100" />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:w-64">
          {a ? <RiskScoreBar score={a.score} level={a.level} /> : <div className="h-12 animate-pulse rounded bg-slate-100" />}
          <Link href="/assistant" className={cn(btn.base, btn.secondary, btn.sm)}>
            <Sparkles className="size-3.5 text-brand-700" aria-hidden /> Full risk analysis
          </Link>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-2">
        <RiskDisclaimer />
      </div>
    </Card>
  );
}
