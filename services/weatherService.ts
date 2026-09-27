/**
 * Weather service (server-side only — used by app/api/weather/route.ts).
 *
 * Providers:
 *   WEATHER_PROVIDER=demo        (default) realistic demo data, no network needed
 *   WEATHER_PROVIDER=open-meteo  live data from Open-Meteo (free, no API key)
 *
 * To plug in another provider (OpenWeather, Tomorrow.io, PMD feed, ...), add a
 * function that returns `WeatherData` and select it in `getWeather()`.
 * Any failure falls back to demo data so the UI never breaks.
 */
import { buildDemoWeather } from "@/data/weather";
import { LOCATIONS, PRIMARY_LOCATION_IDS } from "@/data/locations";
import type { WeatherData, WeatherIcon } from "@/types";

export async function getWeather(): Promise<WeatherData> {
  const provider = (process.env.WEATHER_PROVIDER || "demo").toLowerCase();
  if (provider === "open-meteo") {
    try {
      return await fetchOpenMeteo();
    } catch (err) {
      console.warn("[weatherService] Open-Meteo failed, using demo data:", err);
    }
  }
  return buildDemoWeather();
}

// ---------------------------------------------------------------------------
// Open-Meteo (https://open-meteo.com) — free, keyless.

interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: number[] };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
  };
}

async function fetchOpenMeteo(): Promise<WeatherData> {
  const locs = PRIMARY_LOCATION_IDS.map((id) => LOCATIONS.find((l) => l.id === id)!);
  const params = new URLSearchParams({
    latitude: locs.map((l) => l.coordinates.lat).join(","),
    longitude: locs.map((l) => l.coordinates.lng).join(","),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m",
    hourly: "temperature_2m,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum",
    timezone: "Asia/Karachi",
    forecast_days: "7",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const all = (await res.json()) as OpenMeteoResponse[];
  const main = all[0];

  const nowIdx = Math.max(
    0,
    main.hourly.time.findIndex((t) => new Date(`${t}:00+05:00`).getTime() >= Date.now() - 3_600_000),
  );
  const hourly = main.hourly.time.slice(nowIdx, nowIdx + 24).map((t, i) => ({
    time: new Date(`${t}:00+05:00`).toISOString(),
    temperature: Math.round(main.hourly.temperature_2m[nowIdx + i]),
    rainProbability: main.hourly.precipitation_probability[nowIdx + i] ?? 0,
  }));
  const code = main.current.weather_code;

  return {
    source: "open-meteo",
    updatedAt: new Date().toISOString(),
    location: locs[0].name,
    current: {
      temperature: Math.round(main.current.temperature_2m),
      feelsLike: Math.round(main.current.apparent_temperature),
      condition: describeCode(code).label,
      icon: describeCode(code).icon,
      humidity: Math.round(main.current.relative_humidity_2m),
      windSpeed: Math.round(main.current.wind_speed_10m),
      windDirection: compass(main.current.wind_direction_10m),
      rainProbability: main.daily.precipitation_probability_max[0] ?? 0,
      precipitationMm: Math.round(main.daily.precipitation_sum[0] ?? 0),
      high: Math.round(main.daily.temperature_2m_max[0]),
      low: Math.round(main.daily.temperature_2m_min[0]),
    },
    hourly,
    daily: main.daily.time.map((date, i) => ({
      date,
      condition: describeCode(main.daily.weather_code[i]).label,
      icon: describeCode(main.daily.weather_code[i]).icon,
      high: Math.round(main.daily.temperature_2m_max[i]),
      low: Math.round(main.daily.temperature_2m_min[i]),
      rainProbability: main.daily.precipitation_probability_max[i] ?? 0,
    })),
    locations: all.map((w, i) => ({
      locationId: locs[i].id,
      name: locs[i].name,
      temperature: Math.round(w.current.temperature_2m),
      condition: describeCode(w.current.weather_code).label,
      icon: describeCode(w.current.weather_code).icon,
      rainProbability: w.daily.precipitation_probability_max[0] ?? 0,
    })),
  };
}

/** WMO weather interpretation codes → label + icon. */
function describeCode(code: number): { label: string; icon: WeatherIcon } {
  if (code === 0) return { label: "Clear", icon: "clear" };
  if (code <= 2) return { label: "Partly Cloudy", icon: "partly-cloudy" };
  if (code === 3) return { label: "Overcast", icon: "cloudy" };
  if (code <= 48) return { label: "Fog", icon: "fog" };
  if (code <= 57) return { label: "Drizzle", icon: "drizzle" };
  if (code <= 63) return { label: "Rain", icon: "rain" };
  if (code <= 67) return { label: "Heavy Rain", icon: "heavy-rain" };
  if (code <= 77) return { label: "Snow", icon: "snow" };
  if (code <= 81) return { label: "Rain Showers", icon: "rain" };
  if (code <= 82) return { label: "Heavy Showers", icon: "heavy-rain" };
  if (code <= 86) return { label: "Snow Showers", icon: "snow" };
  return { label: "Thunderstorms", icon: "thunderstorm" };
}

function compass(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}
