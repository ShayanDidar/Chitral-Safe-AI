/**
 * Map configuration. All base layers below are free and need no API key
 * (Esri World maps + OpenTopoMap).
 * To use a different provider (Mapbox, MapTiler, Stadia...), set
 * NEXT_PUBLIC_MAP_TILE_URL / NEXT_PUBLIC_MAP_ATTRIBUTION in your environment.
 * (Tile keys are embedded in tile URLs and are public by nature — use a
 * domain-restricted key if your provider requires one.)
 */
export const MAP_CONFIG = {
  center: [35.93, 71.98] as [number, number],
  zoom: 9,
  minZoom: 7,
  maxZoom: 17,
  maxBounds: [
    [34.6, 70.4],
    [37.4, 74.0],
  ] as [[number, number], [number, number]],
};

export interface BaseLayer {
  name: string;
  url: string;
  attribution: string;
  subdomains?: string;
  maxZoom?: number;
}

const ESRI = "Tiles &copy; Esri — Esri, HERE, Garmin, FAO, NOAA, USGS, &copy; OpenStreetMap contributors";

/** First layer is the default. */
export const BASE_LAYERS: BaseLayer[] = [
  {
    name: "Terrain",
    url:
      process.env.NEXT_PUBLIC_MAP_TILE_URL ||
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || ESRI,
  },
  {
    name: "Streets",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: ESRI,
  },
  {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
  },
  {
    name: "Relief",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    subdomains: "abc",
    maxZoom: 16,
  },
];
