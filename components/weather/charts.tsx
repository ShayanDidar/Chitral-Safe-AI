"use client";

import { useEffect, useRef, useState } from "react";
import type { DailyForecast, HourlyPoint } from "@/types";
import { useI18n } from "@/lib/i18n/LanguageProvider";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

const fmtHour = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" });

/** Weekday label; `today` is the localized word for the first day. */
export const fmtDay = (date: string, i: number, today = "Today", locale = "en-GB") =>
  i === 0
    ? today
    : new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, { weekday: locale === "ur-PK" ? "long" : "short", timeZone: "Asia/Karachi" });

const TEMP = "#22695e"; // brand-600
const RAIN = "#0284c7"; // sky-600

/** 24-hour temperature line with hover crosshair + tooltip. */
export function TemperatureChart({ data, height = 220 }: { data: HourlyPoint[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const { t } = useI18n();
  const pad = { l: 34, r: 12, t: 16, b: 26 };
  const w = Math.max(0, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;
  const temps = data.map((d) => d.temperature);
  const min = Math.floor(Math.min(...temps) - 2);
  const max = Math.ceil(Math.max(...temps) + 2);
  const x = (i: number) => pad.l + (data.length > 1 ? (i / (data.length - 1)) * w : 0);
  const y = (v: number) => pad.t + h - ((v - min) / (max - min || 1)) * h;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.temperature).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${pad.t + h} L${x(0)},${pad.t + h} Z`;
  const ticks = [0, 1, 2, 3].map((k) => Math.round(min + ((max - min) * k) / 3));
  const peak = temps.indexOf(Math.max(...temps));

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - pad.l;
    const i = Math.round((px / (w || 1)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }

  const hp = hover !== null ? data[hover] : null;

  return (
    <div ref={ref} dir="ltr" className="relative" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={`${t("weather.tempTrend")}: ${Math.min(...temps)}°–${Math.max(...temps)}°`}
          className="touch-pan-y"
        >
          <defs>
            <linearGradient id="temp-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={TEMP} stopOpacity="0.16" />
              <stop offset="1" stopColor={TEMP} stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={pad.l + w} y1={y(t)} y2={y(t)} stroke="#eef1f4" />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-slate-400 text-[11px] tabular-nums">
                {t}°
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % (width < 480 ? 6 : 3) === 0 ? (
              <text key={d.time} x={x(i)} y={height - 6} textAnchor="middle" className="fill-slate-400 text-[11px] tabular-nums">
                {i === 0 ? t("weather.nowShort") : fmtHour(d.time)}
              </text>
            ) : null,
          )}
          <path d={area} fill="url(#temp-fill)" />
          <path d={line} fill="none" stroke={TEMP} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* Direct label on the peak only */}
          <circle cx={x(peak)} cy={y(temps[peak])} r={4} fill={TEMP} stroke="#fff" strokeWidth={2} />
          <text x={x(peak)} y={y(temps[peak]) - 10} textAnchor="middle" className="fill-slate-700 text-[11px] font-semibold">
            {temps[peak]}°
          </text>
          {hp && hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + h} stroke="#94a3b8" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(hp.temperature)} r={5} fill={TEMP} stroke="#fff" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {hp && hover !== null && (
        <div
          dir="auto"
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-float"
          style={{ left: Math.min(Math.max(x(hover), 60), width - 60) }}
        >
          <p className="font-semibold tabular-nums">{hp.temperature}°C</p>
          <p className="text-slate-300 tabular-nums">
            {fmtHour(hp.time)} · {t("weather.pctRain", { p: hp.rainProbability })}
          </p>
        </div>
      )}
    </div>
  );
}

/** Daily rain-probability bars with a 60% "high rain" reference line. */
export function RainChart({ data, height = 220 }: { data: DailyForecast[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const { t, locale, condition } = useI18n();
  const day = (date: string, i: number) => fmtDay(date, i, t("weather.today"), locale);
  const pad = { l: 34, r: 8, t: 16, b: 26 };
  const w = Math.max(0, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;
  const slot = w / Math.max(1, data.length);
  const barW = Math.min(36, slot * 0.56);
  const y = (v: number) => pad.t + h - (v / 100) * h;
  const maxIdx = data.reduce((m, d, i) => (d.rainProbability > data[m].rainProbability ? i : m), 0);

  return (
    <div ref={ref} dir="ltr" className="relative" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`${t("weather.rainTitle")} · ${t("weather.rainSub")}`} onPointerLeave={() => setHover(null)}>
          {[0, 25, 50, 75, 100].map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={pad.l + w} y1={y(t)} y2={y(t)} stroke="#eef1f4" />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-slate-400 text-[11px] tabular-nums">
                {t}%
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = pad.l + slot * i + slot / 2;
            const top = y(d.rainProbability);
            const bh = pad.t + h - top;
            const r = Math.min(4, bh);
            return (
              <g key={d.date} onPointerEnter={() => setHover(i)} onClick={() => setHover(i)}>
                {/* Oversized hit target */}
                <rect x={cx - slot / 2} y={pad.t} width={slot} height={h} fill="transparent" />
                <path
                  d={`M${cx - barW / 2},${pad.t + h} V${top + r} Q${cx - barW / 2},${top} ${cx - barW / 2 + r},${top} H${cx + barW / 2 - r} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + r} V${pad.t + h} Z`}
                  fill={RAIN}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
                {i === maxIdx && (
                  <text x={cx} y={top - 6} textAnchor="middle" className="fill-slate-700 text-[11px] font-semibold tabular-nums">
                    {d.rainProbability}%
                  </text>
                )}
                <text x={cx} y={height - 6} textAnchor="middle" className="fill-slate-400 text-[11px]">
                  {day(d.date, i)}
                </text>
              </g>
            );
          })}
          <line x1={pad.l} x2={pad.l + w} y1={y(60)} y2={y(60)} stroke="#64748b" strokeDasharray="4 4" strokeWidth={1} />
          <text x={pad.l + w} y={y(60) - 5} textAnchor="end" className="fill-slate-500 text-[10px]">
            {t("weather.highRain")}
          </text>
        </svg>
      )}
      {hover !== null && (
        <div
          dir="auto"
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-float"
          style={{ left: Math.min(Math.max(pad.l + slot * hover + slot / 2, 60), width - 60) }}
        >
          <p className="font-semibold">{day(data[hover].date, hover)}</p>
          <p className="text-slate-300 tabular-nums">
            {t("weather.pctRain", { p: data[hover].rainProbability })} · {condition(data[hover].icon, data[hover].condition)}
          </p>
        </div>
      )}
    </div>
  );
}
