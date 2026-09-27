import { HAZARD_TYPES } from "@/lib/hazards";
import { minutesSince } from "@/lib/utils";
import type { AIContext, EnvironmentalAlert, HazardReport, WeatherData } from "@/types";

const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 } as const;

/**
 * Builds the compact data snapshot that is sent with every AI request.
 * This is the "context injection" layer — add fields here to give the
 * assistant more knowledge about the current app state.
 */
export function buildAIContext(input: {
  reports: HazardReport[];
  weather: WeatherData | null;
  alerts: EnvironmentalAlert[];
  selectedLocation?: string | null;
}): AIContext {
  const { weather } = input;
  const selected = input.selectedLocation ?? null;

  const reports = [...input.reports]
    .filter((r) => !selected || r.locationName === selected || r.area === selected)
    .sort(
      (a, b) =>
        Number(b.status !== "resolved") - Number(a.status !== "resolved") ||
        SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
        b.reportedAt.localeCompare(a.reportedAt),
    )
    .slice(0, 15)
    .map((r) => ({
      type: HAZARD_TYPES[r.type].label,
      severity: r.severity,
      status: r.status,
      location: r.locationName,
      description: r.description.slice(0, 240),
      reportedMinutesAgo: minutesSince(r.reportedAt),
      likes: r.likes,
      comments: r.comments.length,
    }));

  return {
    generatedAt: new Date().toISOString(),
    selectedLocation: selected,
    weather: weather
      ? {
          source: weather.source,
          location: weather.location,
          temperature: weather.current.temperature,
          condition: weather.current.condition,
          humidity: weather.current.humidity,
          wind: `${weather.current.windSpeed} km/h ${weather.current.windDirection}`,
          rainProbability: weather.current.rainProbability,
          precipitationMm: weather.current.precipitationMm,
          next3Days: weather.daily.slice(0, 3).map((d) => ({
            date: d.date,
            condition: d.condition,
            high: d.high,
            low: d.low,
            rainProbability: d.rainProbability,
          })),
          locations: weather.locations.map((l) => ({
            name: l.name,
            temperature: l.temperature,
            condition: l.condition,
            rainProbability: l.rainProbability,
          })),
        }
      : null,
    reports,
    alerts: input.alerts.map((a) => ({ title: a.title, area: a.area, level: a.level, message: a.message })),
  };
}
