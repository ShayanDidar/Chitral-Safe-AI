/** Location validation and privacy helpers (server-only). */
import { MAP_CONFIG } from "@/lib/mapConfig";
import { nearestLocation } from "@/data/locations";

const [[minLat, minLng], [maxLat, maxLng]] = MAP_CONFIG.maxBounds;

/** Reports must be inside the Chitral region the map covers. */
export function isInServiceArea(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/**
 * Public crime reports never expose the exact spot: coordinates are snapped to
 * a ~1 km grid and the free-text location is replaced by the nearest locality.
 */
export function approximate(lat: number, lng: number) {
  const snap = (v: number) => Math.round(v / 0.01) * 0.01;
  return { lat: +snap(lat).toFixed(2), lng: +snap(lng).toFixed(2) };
}

export function nearestPlace(lat: number, lng: number) {
  return nearestLocation({ lat, lng });
}
