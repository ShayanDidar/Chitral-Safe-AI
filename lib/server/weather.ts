/**
 * Weather service (server-side only — used by app/api/weather/route.ts).
 *
 * Providers:
 *   WEATHER_PROVIDER=open-meteo  (default) live data from Open-Meteo — free, no API key
 *   WEATHER_PROVIDER=demo        sample data, no network (e.g. for offline demos)
 *
 * To plug in another provider (OpenWeather, Tomorrow.io, PMD feed, ...), add a
 * function that returns `WeatherData` and select it in `getWeather()`; read its
 * key from a server-only env var so it never reaches the browser.
 * If the live provider fails, sample data is returned with `error: "unavailable"`
 * so the UI can say so honestly instead of breaking.
 */
import { buildDemoWeather } from "@/data/weather";
import { LOCATIONS, PICKER_LOCATION_IDS } from "@/data/locations";
import type { WeatherData, WeatherIcon } from "@/types";

export interface WeatherPoint {
  lat: number;
  lng: number;
  name: string;
}

/** Last real reading per place, used if Open-Meteo is briefly unavailable. */
const lastGood = new Map<string, WeatherData>();

export async function getWeather(point?: WeatherPoint): Promise<WeatherData> {
  const provider = (process.env.WEATHER_PROVIDER || "open-meteo").toLowerCase();
  if (provider === "demo") return { ...buildDemoWeather(), location: point?.name ?? "Chitral Town" };
  const key = point ? `${point.lat},${point.lng}` : "default";
  // Try twice: the free service sometimes answers "busy" (429/503) for a moment.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const data = await fetchOpenMeteo(point);
      lastGood.set(key, data);
      return data;
    } catch (err) {
      console.warn(`[weather] Open-Meteo attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
      if (attempt === 1) await new Promise((r) => setTimeout(r, 700));
    }
  }
  // Still failing: show the last real reading (its time is shown on screen), otherwise sample data.
  return lastGood.get(key) ?? { ...buildDemoWeather(), location: point?.name ?? "Chitral Town", error: "unavailable" };
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

async function fetchOpenMeteo(point?: WeatherPoint): Promise<WeatherData> {
  const locs = PICKER_LOCATION_IDS.map((id) => LOCATIONS.find((l) => l.id === id)!);
  // First coordinate is the selected point; the rest feed "Conditions across Chitral".
  const main0 = point ?? { lat: locs[0].coordinates.lat, lng: locs[0].coordinates.lng, name: locs[0].name };
  const points = [main0, ...locs.map((l) => ({ lat: l.coordinates.lat, lng: l.coordinates.lng }))];
  // Temperature depends strongly on height in the mountains, so tell Open-Meteo
  // the real height of each town (otherwise it may use a nearby mountainside).
  const heights = [await heightOf(main0), ...locs.map((l) => l.elevationM)];
  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat.toFixed(3)).join(","),
    longitude: points.map((p) => p.lng.toFixed(3)).join(","),
    elevation: heights.join(","),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m",
    hourly: "temperature_2m,precipitation_probability",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum",
    timezone: "Asia/Karachi",
    forecast_days: "7",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 900 }, // reuse a reading for 15 minutes (weather changes slowly; saves the free quota)
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const [main, ...all] = (await res.json()) as OpenMeteoResponse[];

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
    // Time of the latest model reading (Open-Meteo refreshes every 15 minutes).
    updatedAt: new Date(`${main.current.time}:00+05:00`).toISOString(),
    location: main0.name,
    coordinates: { lat: main0.lat, lng: main0.lng },
    current: {
      temperature: Math.round(main.current.temperature_2m),
      feelsLike: Math.round(main.current.apparent_temperature),
      condition: describeCode(code, main.current.temperature_2m).label,
      icon: describeCode(code, main.current.temperature_2m).icon,
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
      condition: describeCode(main.daily.weather_code[i], dayMean(main, i)).label,
      icon: describeCode(main.daily.weather_code[i], dayMean(main, i)).icon,
      high: Math.round(main.daily.temperature_2m_max[i]),
      low: Math.round(main.daily.temperature_2m_min[i]),
      rainProbability: main.daily.precipitation_probability_max[i] ?? 0,
    })),
    locations: all.map((w, i) => ({
      locationId: locs[i].id,
      name: locs[i].name,
      temperature: Math.round(w.current.temperature_2m),
      condition: describeCode(w.current.weather_code, w.current.temperature_2m).label,
      icon: describeCode(w.current.weather_code, w.current.temperature_2m).icon,
      rainProbability: w.daily.precipitation_probability_max[0] ?? 0,
    })),
  };
}

/**
 * Height of the ground (metres). Known places use the town's real height;
 * any other point (e.g. "My location") asks Open-Meteo's free terrain data.
 */
async function heightOf(p: WeatherPoint): Promise<number> {
  const known = LOCATIONS.find(
    (l) => l.name === p.name && Math.abs(l.coordinates.lat - p.lat) < 0.02 && Math.abs(l.coordinates.lng - p.lng) < 0.02,
  );
  if (known) return known.elevationM;
  const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${p.lat}&longitude=${p.lng}`, {
    next: { revalidate: 86_400 },
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`Open-Meteo elevation HTTP ${res.status}`);
  return ((await res.json()) as { elevation: number[] }).elevation[0];
}

const dayMean = (r: OpenMeteoResponse, i: number) => (r.daily.temperature_2m_max[i] + r.daily.temperature_2m_min[i]) / 2;

/**
 * WMO weather interpretation codes → label + icon.
 * The rain/snow choice comes from the model's coarse grid, which in Chitral is
 * mostly high mountains; when it is clearly above freezing in the town, show rain.
 */
function describeCode(code: number, tempC: number): { label: string; icon: WeatherIcon } {
  if (tempC >= 4) {
    if (code === 71 || code === 73 || code === 75) code -= 10; // snow → rain of the same strength
    else if (code === 77) code = 61;
    else if (code === 85 || code === 86) code -= 5; // snow showers → rain showers
  }
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
