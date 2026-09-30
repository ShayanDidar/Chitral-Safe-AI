"use client";

import { useState } from "react";
import { Loader2, LocateFixed, RefreshCw, TriangleAlert } from "lucide-react";
import { LOCATIONS, PICKER_LOCATION_IDS, nearestLocation } from "@/data/locations";
import { useHazardStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn, formatDateTime } from "@/lib/utils";
import { Card, DemoBadge } from "@/components/ui/primitives";
import { TimeAgo } from "@/components/ui/TimeAgo";

const PRIMARY = PICKER_LOCATION_IDS.map((id) => LOCATIONS.find((l) => l.id === id)!);

/** Distance in km (haversine) — used to name the user's current location. */
function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/**
 * Choose which location the weather is for: a Chitral place, or the device's
 * current location (asked only when the user taps the button; coordinates are
 * rounded to ~1 km and never stored).
 */
export function WeatherLocationBar() {
  const { weather, weatherStatus, weatherPlace, setWeatherPlace, refreshWeather } = useHazardStore();
  const { t, place, lang } = useI18n();
  const [geo, setGeo] = useState<"idle" | "busy" | "denied" | "unavailable">("idle");

  function locateMe() {
    if (!("geolocation" in navigator)) return setGeo("unavailable");
    setGeo("busy");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: +pos.coords.latitude.toFixed(2), lng: +pos.coords.longitude.toFixed(2) };
        const near = nearestLocation(p);
        const name = km(p, near.coordinates) < 25 ? `Near ${near.name}` : "Your location";
        setGeo("idle");
        setWeatherPlace({ ...p, name, kind: "current" });
      },
      (err) => setGeo(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60_000 },
    );
  }

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium ring-1 ring-inset transition-colors",
      active ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
    );

  return (
    <Card className="space-y-3 p-3 sm:p-4">
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        <button
          type="button"
          onClick={locateMe}
          aria-pressed={weatherPlace.kind === "current"}
          className={chip(weatherPlace.kind === "current")}
        >
          {geo === "busy" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <LocateFixed className="size-3.5" aria-hidden />}
          {t("weather.myLocation")}
        </button>
        {PRIMARY.map((l) => {
          const active = weatherPlace.kind === "preset" && weatherPlace.name === l.name;
          return (
            <button
              key={l.id}
              type="button"
              aria-pressed={active}
              onClick={() => setWeatherPlace({ name: l.name, lat: l.coordinates.lat, lng: l.coordinates.lng, kind: "preset" })}
              className={chip(active)}
            >
              {place(l.name)}
            </button>
          );
        })}
      </div>

      {geo === "denied" && <p className="text-xs text-amber-800">{t("weather.geoDenied")}</p>}
      {geo === "unavailable" && <p className="text-xs text-amber-800">{t("weather.geoUnavailable")}</p>}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        {weatherStatus === "loading" ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> {t("weather.loading")}
          </span>
        ) : (
          <>
            <DemoBadge
              live={weatherStatus === "live"}
              label={t(weatherStatus === "live" ? "weather.live" : weatherStatus === "sample" ? "weather.demo" : "weather.sampleFallback")}
            />
            <span suppressHydrationWarning>
              {t("weather.observed", { time: formatDateTime(weather.updatedAt, lang) })} (<TimeAgo iso={weather.updatedAt} />)
            </span>
            {weatherPlace.kind === "current" && <span>{t("weather.coordsRounded")}</span>}
          </>
        )}
        <button
          type="button"
          onClick={refreshWeather}
          className="ms-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-brand-700 hover:bg-brand-50"
        >
          <RefreshCw className="size-3" aria-hidden /> {t("admin.refresh")}
        </button>
      </div>

      {weatherStatus === "unavailable" && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          {t("weather.unavailable")}
        </p>
      )}
    </Card>
  );
}
