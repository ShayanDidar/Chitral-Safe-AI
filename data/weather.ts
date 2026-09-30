import type { DailyForecast, HourlyPoint, WeatherData } from "@/types";

/** Realistic demo weather for Chitral, used whenever no live provider is configured. */
export function buildDemoWeather(now = Date.now()): WeatherData {
  const start = new Date(now);
  start.setMinutes(0, 0, 0);

  // 24h temperature curve peaking mid-afternoon, with rain chances building into the evening.
  const hourly: HourlyPoint[] = Array.from({ length: 24 }, (_, i) => {
    const t = new Date(start.getTime() + i * 3_600_000);
    const hour = (t.getUTCHours() + 5) % 24; // Pakistan Standard Time (UTC+5)
    const diurnal = Math.cos(((hour - 15) / 24) * 2 * Math.PI); // 1 at 15:00, -1 at 03:00
    const temperature = Math.round(15.5 + 5 * diurnal - (i > 14 ? 1 : 0));
    const rainBase = 45 + 30 * Math.sin((i / 23) * Math.PI * 1.2);
    const rainProbability = Math.max(10, Math.min(92, Math.round(rainBase + ((i * 37) % 11) - 5)));
    return { time: t.toISOString(), temperature, rainProbability };
  });

  const days: Omit<DailyForecast, "date">[] = [
    { condition: "Partly Cloudy", icon: "partly-cloudy", high: 21, low: 12, rainProbability: 72 },
    { condition: "Heavy Rain", icon: "heavy-rain", high: 17, low: 11, rainProbability: 86 },
    { condition: "Rain Showers", icon: "rain", high: 18, low: 11, rainProbability: 64 },
    { condition: "Thunderstorms", icon: "thunderstorm", high: 19, low: 12, rainProbability: 58 },
    { condition: "Cloudy", icon: "cloudy", high: 20, low: 11, rainProbability: 34 },
    { condition: "Partly Cloudy", icon: "partly-cloudy", high: 22, low: 12, rainProbability: 18 },
    { condition: "Sunny", icon: "clear", high: 23, low: 11, rainProbability: 8 },
  ];
  const daily: DailyForecast[] = days.map((d, i) => {
    // Calendar date in Pakistan time (UTC+5)
    const date = new Date(now + 5 * 3_600_000 + i * 86_400_000);
    return { ...d, date: date.toISOString().slice(0, 10) };
  });

  return {
    source: "demo",
    updatedAt: new Date(now - 5 * 60_000).toISOString(),
    location: "Chitral Town",
    current: {
      temperature: 18,
      feelsLike: 17,
      condition: "Partly Cloudy",
      icon: "partly-cloudy",
      humidity: 68,
      windSpeed: 14,
      windDirection: "NW",
      rainProbability: 72,
      precipitationMm: 12,
      high: 21,
      low: 12,
    },
    hourly,
    daily,
    locations: [
      { locationId: "chitral-town", name: "Chitral Town", temperature: 18, condition: "Partly Cloudy", icon: "partly-cloudy", rainProbability: 72 },
      { locationId: "ayun", name: "Ayun", temperature: 19, condition: "Light Rain", icon: "drizzle", rainProbability: 78 },
      { locationId: "drosh", name: "Drosh", temperature: 21, condition: "Rain", icon: "rain", rainProbability: 84 },
      { locationId: "booni", name: "Booni", temperature: 14, condition: "Rain", icon: "rain", rainProbability: 69 },
      { locationId: "mastuj", name: "Mastuj", temperature: 11, condition: "Cloudy", icon: "cloudy", rainProbability: 55 },
      { locationId: "garam-chashma", name: "Garam Chashma", temperature: 13, condition: "Showers", icon: "drizzle", rainProbability: 61 },
      { locationId: "brep", name: "Brep", temperature: 9, condition: "Cloudy", icon: "cloudy", rainProbability: 42 },
      { locationId: "kalash", name: "Kalash Valleys", temperature: 15, condition: "Light Rain", icon: "drizzle", rainProbability: 70 },
      { locationId: "lowari", name: "Lowari Tunnel", temperature: 9, condition: "Cloudy", icon: "cloudy", rainProbability: 58 },
      { locationId: "shandur", name: "Shandur", temperature: 3, condition: "Snow", icon: "snow", rainProbability: 45 },
      { locationId: "broghil", name: "Broghil", temperature: 1, condition: "Cloudy", icon: "cloudy", rainProbability: 30 },
      { locationId: "tirich", name: "Tirich", temperature: 6, condition: "Cloudy", icon: "cloudy", rainProbability: 40 },
      { locationId: "torkhow", name: "Torkhow", temperature: 10, condition: "Partly Cloudy", icon: "partly-cloudy", rainProbability: 38 },
    ],
  };
}
