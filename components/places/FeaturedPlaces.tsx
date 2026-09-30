"use client";

import Link from "next/link";
import { featuredLocations } from "@/data/locations";
import { useHazardStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { WeatherIconGlyph } from "@/components/weather/WeatherIconGlyph";

/** Plain list of featured valleys and passes with their current weather. */
export function FeaturedPlaces() {
  const { weather, weatherStatus } = useHazardStore();
  const { t, place, condition, lang } = useI18n();

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[15px] font-semibold text-slate-900">{t("places.home")}</h2>
        <p className="text-[13px] text-slate-500">{t("places.homeSub")}</p>
      </div>
      <ul className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
        {featuredLocations().map(({ id, loc, note, noteUr }) => {
          const w = weather.locations.find((l) => l.locationId === id);
          return (
            <li key={id} className="flex flex-col bg-white p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold text-slate-900">{place(loc.name)}</p>
                {w && weatherStatus !== "loading" && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm text-slate-700">
                    <WeatherIconGlyph icon={w.icon} className="size-4 text-slate-500" />
                    <span className="tabular-nums">{w.temperature}°</span>
                    <span className="sr-only">{condition(w.icon, w.condition)}</span>
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{lang === "ur" ? noteUr : note}</p>
              <div className="mt-auto flex gap-4 pt-3 text-[13px] font-medium">
                <Link href={`/map?place=${id}`} className="text-brand-700 hover:underline">
                  {t("places.onMap")}
                </Link>
                <Link href={`/weather?place=${id}`} className="text-brand-700 hover:underline">
                  {t("places.weather")}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
