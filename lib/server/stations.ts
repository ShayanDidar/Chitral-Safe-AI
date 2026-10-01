/**
 * Real temperature measurements from the Pakistan Meteorological Department
 * weather stations in Chitral (server-only).
 *
 * The stations send a report every 3 hours in the international SYNOP code.
 * OGIMET (https://www.ogimet.com) publishes them for free, with no API key.
 * Forecast models are often several °C off in Chitral's deep valleys, so
 * weather.ts uses these readings to correct the forecast near each station.
 */

export interface Station {
  /** WMO station number. */
  id: string;
  /** Place name (matches data/locations.ts so it can be translated). */
  name: string;
  lat: number;
  lng: number;
  elevationM: number;
}

export const STATIONS: Station[] = [
  { id: "41506", name: "Chitral Town", lat: 35.85, lng: 71.833, elevationM: 1500 },
  { id: "41515", name: "Drosh", lat: 35.567, lng: 71.783, elevationM: 1465 },
];

export interface StationReading {
  station: Station;
  time: Date;
  temperature: number;
}

/** Latest reading from each station in the last 6 hours (empty if OGIMET is unreachable). */
export async function latestReadings(): Promise<StationReading[]> {
  // OGIMET wants the start time as YYYYMMDDHHmm (UTC). Rounded to the hour so the cache works.
  const begin = new Date(Date.now() - 6 * 3_600_000).toISOString().slice(0, 13).replace(/\D/g, "") + "00";
  try {
    const res = await fetch(`https://www.ogimet.com/cgi-bin/getsynop?block=415&begin=${begin}`, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`OGIMET HTTP ${res.status}`);
    const text = await res.text();

    const latest = new Map<string, StationReading>();
    // Each line: station,year,month,day,hour,minute,SYNOP report
    for (const line of text.trim().split("\n")) {
      const [id, y, mo, d, h, mi, report] = line.split(",");
      const station = STATIONS.find((s) => s.id === id);
      const temperature = report ? readTemperature(report, id) : null;
      if (!station || temperature === null) continue;
      const time = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi));
      const prev = latest.get(id);
      if (!prev || time > prev.time) latest.set(id, { station, time, temperature });
    }
    return [...latest.values()];
  } catch (err) {
    console.warn("[weather] station readings unavailable:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Air temperature from a SYNOP report, e.g. "... 41506 22697 61810 10280 ..." → 28.0°C.
 * After the station number come two groups (visibility, wind); the temperature
 * group is the first one shaped "1sTTT" (s = 0 for plus, 1 for minus; TTT in tenths).
 */
function readTemperature(report: string, id: string): number | null {
  const groups = report.replace(/=+$/, "").split(/\s+/);
  const i = groups.indexOf(id);
  if (i < 0) return null;
  for (const g of groups.slice(i + 3)) {
    if (g === "333") break; // end of the main section
    if (/^1[01]\d{3}$/.test(g)) return ((g[1] === "1" ? -1 : 1) * Number(g.slice(2))) / 10;
  }
  return null;
}
