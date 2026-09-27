"use client";

import { useState } from "react";
import { CloudRain, Droplets, Gauge, Table2, TriangleAlert, Wind } from "lucide-react";
import { useHazardStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Card, DemoBadge, PageHeader, SectionHeader } from "@/components/ui/primitives";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { Page } from "@/components/layout/Page";
import { WeatherIconGlyph } from "@/components/weather/WeatherIconGlyph";
import { RainChart, TemperatureChart, fmtDay } from "@/components/weather/charts";

export function WeatherView() {
  const { weather } = useHazardStore();
  const c = weather.current;
  const [showTable, setShowTable] = useState(false);
  const wet = c.rainProbability >= 60;

  return (
    <Page>
      <PageHeader
        title="Weather"
        subtitle={`Conditions and forecast for ${weather.location} and nearby valleys.`}
        action={
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <DemoBadge live={weather.source !== "demo"} label={weather.source === "demo" ? "Demo data" : "Live · Open-Meteo"} />
            <span>
              Updated <TimeAgo iso={weather.updatedAt} />
            </span>
          </div>
        }
      />

      {wet && (
        <div className="flex items-start gap-3 rounded-2xl bg-orange-50 p-4 ring-1 ring-inset ring-orange-600/20">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-orange-700" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold text-orange-900">Heavy rain likely today ({c.rainProbability}%)</p>
            <p className="mt-0.5 text-orange-800">
              Rain on steep slopes can raise the risk of flash floods and landslides. Avoid riverbanks and check road reports
              before travelling.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Current conditions */}
        <Card className="p-5 sm:p-6">
          <p className="text-sm font-medium text-slate-500">Now in {weather.location}</p>
          <div className="mt-3 flex items-center gap-4">
            <WeatherIconGlyph icon={c.icon} className="size-14 text-slate-700" />
            <div>
              <p className="text-5xl font-semibold tracking-tight text-slate-900 tabular-nums">{c.temperature}°</p>
              <p className="text-sm font-medium text-slate-700">{c.condition}</p>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Feels like {c.feelsLike}° · H {c.high}° · L {c.low}°
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <Metric icon={<Droplets className="size-4" aria-hidden />} label="Humidity" value={`${c.humidity}%`} />
            <Metric icon={<Wind className="size-4" aria-hidden />} label="Wind" value={`${c.windSpeed} km/h ${c.windDirection}`} />
            <Metric icon={<CloudRain className="size-4" aria-hidden />} label="Rain probability" value={`${c.rainProbability}%`} />
            <Metric icon={<Gauge className="size-4" aria-hidden />} label="Expected rain" value={`${c.precipitationMm} mm`} />
          </dl>
        </Card>

        {/* Temperature trend */}
        <Card className="p-5 lg:col-span-2">
          <SectionHeader title="Temperature trend" subtitle="Next 24 hours · hover for details" />
          <div className="mt-4">
            <TemperatureChart data={weather.hourly} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Rain probability */}
        <Card className="p-5 lg:col-span-2">
          <SectionHeader
            title="Rainfall probability"
            subtitle="Next 7 days"
            action={
              <button
                type="button"
                onClick={() => setShowTable((s) => !s)}
                aria-pressed={showTable}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                <Table2 className="size-3.5" aria-hidden /> {showTable ? "Chart" : "Table"}
              </button>
            }
          />
          <div className="mt-4">
            {showTable ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="py-2 font-medium">Day</th>
                    <th className="py-2 font-medium">Condition</th>
                    <th className="py-2 text-right font-medium">Rain</th>
                    <th className="py-2 text-right font-medium">High / Low</th>
                  </tr>
                </thead>
                <tbody>
                  {weather.daily.map((d, i) => (
                    <tr key={d.date} className="border-b border-slate-50">
                      <td className="py-2 font-medium text-slate-800">{fmtDay(d.date, i)}</td>
                      <td className="py-2 text-slate-600">{d.condition}</td>
                      <td className="py-2 text-right tabular-nums text-slate-800">{d.rainProbability}%</td>
                      <td className="py-2 text-right tabular-nums text-slate-600">
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
          <SectionHeader title="7-day forecast" />
          <ul className="mt-3 divide-y divide-slate-100">
            {weather.daily.map((d, i) => (
              <li key={d.date} className="flex items-center gap-3 py-2.5">
                <span className="w-12 text-sm font-medium text-slate-800">{fmtDay(d.date, i)}</span>
                <WeatherIconGlyph icon={d.icon} className="size-5 text-slate-500" />
                <span className="flex-1 truncate text-[13px] text-slate-600">{d.condition}</span>
                <span className="inline-flex w-12 items-center justify-end gap-1 text-xs tabular-nums text-sky-700">
                  <Droplets className="size-3" aria-hidden />
                  {d.rainProbability}%
                </span>
                <span className="w-16 text-right text-sm tabular-nums text-slate-800">
                  {d.high}° <span className="text-slate-400">{d.low}°</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Across Chitral */}
      <section className="space-y-3">
        <SectionHeader title="Conditions across Chitral" subtitle="Current temperature and today's rain probability" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {weather.locations.map((l) => (
            <Card key={l.locationId} className="p-4">
              <p className="truncate text-[13px] font-medium text-slate-600">{l.name}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{l.temperature}°</span>
                <WeatherIconGlyph icon={l.icon} className="size-6 text-slate-500" />
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">{l.condition}</p>
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Rain</span>
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
