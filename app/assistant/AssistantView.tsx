"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, CloudSun, Loader2, Radar, TriangleAlert, Users } from "lucide-react";
import { PICKER_LOCATION_IDS, LOCATIONS } from "@/data/locations";
import { useHazardStore, useActiveReports } from "@/lib/store";
import { useScopedRisk } from "@/lib/useAIContext";
import { cn } from "@/lib/utils";
import { Card, DemoBadge, btn } from "@/components/ui/primitives";
import { AIChat } from "@/components/ai/AIChat";
import { RiskDisclaimer, RiskLevelPill, RiskScoreBar } from "@/components/ai/RiskSummary";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function AssistantView() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q");

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 pb-[92px] pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-6">
      <Card className="flex h-[calc(100dvh-3.5rem-108px)] min-h-[480px] flex-col overflow-hidden lg:h-[calc(100dvh-3.5rem-48px)]">
        <AIChat initialQuestion={q} onConsumedInitial={() => router.replace("/assistant", { scroll: false })} />
      </Card>
      <aside className="space-y-4 lg:h-[calc(100dvh-3.5rem-48px)] lg:overflow-y-auto">
        <RiskAnalysisPanel />
        <ContextPanel />
      </aside>
    </div>
  );
}

function RiskAnalysisPanel() {
  const { reports } = useHazardStore();
  const { result, loading, error, run } = useScopedRisk();
  const { t, place, riskName, lang, bidi } = useI18n();
  const [scope, setScope] = useState<string>("all");

  const scopes = [
    ...PICKER_LOCATION_IDS.map((id) => LOCATIONS.find((l) => l.id === id)!.name),
    ...new Set(reports.map((r) => r.locationName)),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  // Run for all of Chitral on open, and again when the language changes.
  useEffect(() => {
    void run(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const a = result?.assessment;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Radar className="size-4 text-brand-700" aria-hidden /> {t("rp.title")}
        </p>
        {result && <DemoBadge live={result.mode === "live"} label={t(result.mode === "live" ? "rp.live" : "rp.demo")} />}
      </div>
      <div className="mt-3 flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">{t("rp.area")}</span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white ps-3 pe-8 text-[13px] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="all">{t("rp.all")}</option>
            {scopes.map((s) => (
              <option key={s} value={s}>
                {place(s)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => void run(scope === "all" ? null : scope)}
          className={cn(btn.base, btn.primary, btn.sm, "h-9")}
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null} {t("rp.analyze")}
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-700">{error}</p>}

      {a ? (
        <div className={cn("mt-4 space-y-3.5 transition-opacity", loading && "opacity-50")}>
          <div className="flex items-center justify-between gap-2">
            <RiskLevelPill level={a.level} />
            <span className="text-xs text-slate-500">{place(a.scope)}</span>
          </div>
          <RiskScoreBar score={a.score} level={a.level} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("rp.possible")}</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {a.possibleRisks.map((r) => (
                <li key={r} dir="auto" className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {riskName(r)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("rp.reason")}</p>
            <p dir="auto" className="mt-1 text-[13px] leading-relaxed text-slate-700">
              {bidi(a.reason)}
            </p>
          </div>
          <div className="rounded-xl bg-brand-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">{t("rp.action")}</p>
            <p dir="auto" className="mt-1 text-[13px] leading-relaxed text-brand-900">
              {bidi(a.suggestedAction)}
            </p>
          </div>
          <RiskDisclaimer />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <div className="h-5 w-28 animate-pulse rounded-full bg-slate-100" />
          <div className="h-2 animate-pulse rounded bg-slate-100" />
          <div className="h-12 animate-pulse rounded bg-slate-100" />
        </div>
      )}
    </Card>
  );
}

function ContextPanel() {
  const { weather, alerts } = useHazardStore();
  const active = useActiveReports();
  const { t, condition } = useI18n();
  const items = [
    {
      icon: CloudSun,
      label: t("ctx.weather"),
      value: t("ctx.weatherVal", {
        t: weather.current.temperature,
        c: condition(weather.current.icon, weather.current.condition),
        r: weather.current.rainProbability,
      }),
    },
    { icon: Users, label: t("ctx.reports"), value: t("ctx.reportsVal", { n: active.length }) },
    { icon: TriangleAlert, label: t("ctx.alerts"), value: t("ctx.alertsVal", { n: alerts.length }) },
    { icon: BookOpen, label: t("ctx.kb"), value: t("ctx.kbVal") },
  ];
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-slate-900">{t("ctx.title")}</p>
      <p className="mt-0.5 text-xs text-slate-500">{t("ctx.sub")}</p>
      <ul className="mt-3 space-y-3">
        {items.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="text-[13px] text-slate-800">{value}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
