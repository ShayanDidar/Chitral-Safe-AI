"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LOCATIONS } from "@/data/locations";
import { CloudRain, Droplets, Gauge, Table2, TriangleAlert, Wind } from "lucide-react";
import { useHazardStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Card, PageHeader, SectionHeader } from "@/components/ui/primitives";
import { Page } from "@/components/layout/Page";
import { WeatherIconGlyph } from "@/components/weather/WeatherIconGlyph";
import { RainChart, TemperatureChart, fmtDay } from "@/components/weather/charts";
import { WeatherLocationBar } from "@/components/weather/WeatherLocationBar";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function WeatherView() {
  const { weather, weatherStatus, setWeatherPlace } = useHazardStore();
  const placeParam = useSearchParams().get("place");

  // /weather?place=shandur opens that place's weather.
  useEffect(() => {
    const loc = LOCATIONS.find((l) => l.id === placeParam);
    if (loc) setWeatherPlace({ name: loc.name, lat: loc.coordinates.lat, lng: loc.coordinates.lng, kind: "preset" });
  }, [placeParam, setWeatherPlace]);
  const c = weather.current;
  const { t, place, condition, locale } = useI18n();
  const day = (date: string, i: number) => fmtDay(date, i, t("weather.today"), locale);
  const [showTable, setShowTable] = useState(false);
  const wet = c.rainProbability >= 60;

  return (
    <Page>
      <PageHeader
        title={t("weather.title")}
        subtitle={t("weather.subtitle", { place: place(weather.location) })}
      />
      <WeatherLocationBar />

      <div className={cn("space-y-6 transition-opacity", weatherStatus === "loading" && "pointer-events-none opacity-40")} aria-busy={weatherStatus === "loading"}>
      {wet && (
        <div className="flex items-start gap-3 rounded-2xl bg-orange-50 p-4 ring-1 ring-inset ring-orange-600/20">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-orange-700" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold text-orange-900">{t("weather.heavyTitle", { p: c.rainProbability })}</p>
            <p className="mt-0.5 text-orange-800">
              {t("weather.heavyBody")}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Current conditions */}
        <Card className="p-5 sm:p-6">
          <p className="text-sm font-medium text-slate-500">{t("weather.now", { place: place(weather.location) })}</p>
          <div className="mt-3 flex items-center gap-4">
            <WeatherIconGlyph icon={c.icon} className="size-14 text-slate-700" />
            <div>
              <p className="text-5xl font-semibold tracking-tight text-slate-900 tabular-nums">{c.temperature}°</p>
              <p className="text-sm font-medium text-slate-700">{condition(c.icon, c.condition)}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {t("weather.feels", { f: c.feelsLike, h: c.high, l: c.low })}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <Metric icon={<Droplets className="size-4" aria-hidden />} label={t("weather.humidity")} value={`${c.humidity}%`} />
            <Metric icon={<Wind className="size-4" aria-hidden />} label={t("weather.wind")} value={`${c.windSpeed} ${t("weather.kmh")} ${c.windDirection}`} />
            <Metric icon={<CloudRain className="size-4" aria-hidden />} label={t("weather.rainProb")} value={`${c.rainProbability}%`} />
            <Metric icon={<Gauge className="size-4" aria-hidden />} label={t("weather.expected")} value={`${c.precipitationMm} ${t("weather.mm")}`} />
          </dl>
        </Card>

        {/* Temperature trend */}
        <Card className="p-5 lg:col-span-2">
          <SectionHeader title={t("weather.tempTrend")} subtitle={t("weather.tempSub")} />
          <div className="mt-4">
            <TemperatureChart data={weather.hourly} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Rain probability */}
        <Card className="p-5 lg:col-span-2">
          <SectionHeader
            title={t("weather.rainTitle")}
            subtitle={t("weather.rainSub")}
            action={
              <button
                type="button"
                onClick={() => setShowTable((s) => !s)}
                aria-pressed={showTable}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                <Table2 className="size-3.5" aria-hidden /> {t(showTable ? "weather.chart" : "weather.table")}
              </button>
            }
          />
          <div className="mt-4">
            {showTable ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-start text-xs text-slate-500">
                    <th className="py-2 font-medium">{t("weather.day")}</th>
                    <th className="py-2 font-medium">{t("weather.condition")}</th>
                    <th className="py-2 text-end font-medium">{t("weather.rain")}</th>
                    <th className="py-2 text-end font-medium">{t("weather.highLow")}</th>
                  </tr>
                </thead>
                <tbody>
                  {weather.daily.map((d, i) => (
                    <tr key={d.date} className="border-b border-slate-50">
                      <td className="py-2 font-medium text-slate-800">{day(d.date, i)}</td>
                      <td className="py-2 text-slate-600">{condition(d.icon, d.condition)}</td>
                      <td className="py-2 text-end tabular-nums text-slate-800">{d.rainProbability}%</td>
                      <td className="py-2 text-end tabular-nums text-slate-600">
                        {d.high}° / {d.low}°
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <RainChart data={weather.daily} />
            )}
          </div>
        </Card>

        {/* 7-day forecast list */}
        <Card className="p-5">
          <SectionHeader title={t("weather.forecast")} />
          <ul className="mt-3 divide-y divide-slate-100">
            {weather.daily.map((d, i) => (
              <li key={d.date} className="flex items-center gap-3 py-2.5">
                <span className="w-14 text-sm font-medium text-slate-800">{day(d.date, i)}</span>
                <WeatherIconGlyph icon={d.icon} className="size-5 text-slate-500" />
                <span className="flex-1 truncate text-[13px] text-slate-600">{condition(d.icon, d.condition)}</span>
                <span className="inline-flex w-12 items-center justify-end gap-1 text-xs tabular-nums text-sky-700">
                  <Droplets className="size-3" aria-hidden />
                  {d.rainProbability}%
                </span>
                <span className="w-16 text-end text-sm tabular-nums text-slate-800">
                  {d.high}° <span className="text-slate-400">{d.low}°</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Across Chitral */}
      <section className="space-y-3">
        <SectionHeader title={t("weather.across")} subtitle={t("weather.acrossSub")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {weather.locations.map((l) => (
            <Card key={l.locationId} className="p-4">
              <p className="truncate text-[13px] font-medium text-slate-600">{place(l.name)}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{l.temperature}°</span>
                <WeatherIconGlyph icon={l.icon} className="size-6 text-slate-500" />
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">{condition(l.icon, l.condition)}</p>
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{t("weather.rain")}</span>
                  <span className={cn("font-medium tabular-nums", l.rainProbability >= 60 ? "text-sky-800" : "text-slate-700")}>
                    {l.rainProbability}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-sky-600" style={{ width: `${l.rainProbability}%` }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
      </div>
    </Page>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="flex items-center gap-1.5 text-xs text-slate-500">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">{value}</dd>
    </div>
  );
}
