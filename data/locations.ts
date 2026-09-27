import type { ChitralLocation } from "@/types";

/** Known places in the Chitral region used for reports, weather and map pins. */
export const LOCATIONS: ChitralLocation[] = [
  { id: "chitral-town", name: "Chitral Town", area: "Lower Chitral", coordinates: { lat: 35.8518, lng: 71.7864 }, elevationM: 1500 },
  { id: "ayun", name: "Ayun", area: "Lower Chitral", coordinates: { lat: 35.7295, lng: 71.7789 }, elevationM: 1400 },
  { id: "drosh", name: "Drosh", area: "Lower Chitral", coordinates: { lat: 35.5611, lng: 71.7955 }, elevationM: 1300 },
  { id: "booni", name: "Booni", area: "Upper Chitral", coordinates: { lat: 36.2683, lng: 72.2528 }, elevationM: 2050 },
  { id: "mastuj", name: "Mastuj", area: "Upper Chitral", coordinates: { lat: 36.2869, lng: 72.5164 }, elevationM: 2350 },
  { id: "garam-chashma", name: "Garam Chashma", area: "Lower Chitral", coordinates: { lat: 36.0122, lng: 71.5561 }, elevationM: 2000 },
  { id: "reshun", name: "Reshun", area: "Upper Chitral", coordinates: { lat: 36.1617, lng: 72.1242 }, elevationM: 1850 },
  { id: "bumburet", name: "Bumburet", area: "Lower Chitral", coordinates: { lat: 35.7358, lng: 71.6781 }, elevationM: 1950 },
  { id: "lowari", name: "Lowari Tunnel", area: "Lower Chitral", coordinates: { lat: 35.4169, lng: 71.7894 }, elevationM: 2400 },
];

/** The six primary locations shown in weather summaries. */
export const PRIMARY_LOCATION_IDS = ["chitral-town", "ayun", "drosh", "booni", "mastuj", "garam-chashma"];

export const DEFAULT_LOCATION = LOCATIONS[0];

export function findLocationByName(name: string): ChitralLocation | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  return (
    LOCATIONS.find((l) => l.name.toLowerCase() === needle) ??
    LOCATIONS.find((l) => needle.includes(l.name.toLowerCase()) || l.name.toLowerCase().includes(needle))
  );
}

export function nearestLocation(point: { lat: number; lng: number }): ChitralLocation {
  let best = LOCATIONS[0];
  let bestDist = Infinity;
  for (const loc of LOCATIONS) {
    const d = (loc.coordinates.lat - point.lat) ** 2 + (loc.coordinates.lng - point.lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = loc;
    }
  }
  return best;
}
