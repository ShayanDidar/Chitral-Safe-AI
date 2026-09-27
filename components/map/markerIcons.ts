import L from "leaflet";
import { CircleAlert, CloudRainWind, Mountain, MountainSnow, Snowflake, Stone, TrafficCone, Waves } from "lucide";
import { SEVERITIES } from "@/lib/hazards";
import type { HazardReport, HazardType } from "@/types";

type IconNode = typeof Mountain;

const NODES: Record<HazardType, IconNode> = {
  flood: Waves,
  landslide: Mountain,
  glacier: MountainSnow,
  road_blockage: TrafficCone,
  heavy_rain: CloudRainWind,
  rockfall: Stone,
  snowfall: Snowflake,
  other: CircleAlert,
};

function svg(node: IconNode) {
  const children = node
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs as Record<string, string | number>)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
}

const cache = new Map<string, L.DivIcon>();

export function hazardIcon(report: Pick<HazardReport, "type" | "severity" | "status" | "source">, selected = false) {
  const isNew = report.source === "user";
  const key = `${report.type}|${report.severity}|${report.status}|${isNew}|${selected}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const s = SEVERITIES[report.severity];
  const classes = [
    "hazard-pin",
    report.severity === "critical" && report.status !== "resolved" ? "is-critical" : "",
    report.status === "resolved" ? "is-resolved" : "",
    isNew ? "is-new" : "",
  ].join(" ");
  const size = selected ? 42 : 34;
  const icon = L.divIcon({
    className: "hazard-marker",
    html: `<div class="${classes}" style="background:${s.hex};${selected ? "width:42px;height:42px;border-width:3px;" : ""}">${svg(
      NODES[report.type],
    )}${isNew ? '<span class="badge-new">NEW</span>' : ""}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
  cache.set(key, icon);
  return icon;
}

export const pickIcon = L.divIcon({
  className: "pick-marker",
  html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg"><path d="M17 43s15-14.2 15-26A15 15 0 0 0 2 17c0 11.8 15 26 15 26Z" fill="#1d554d" stroke="#fff" stroke-width="2.5"/><circle cx="17" cy="17" r="5.5" fill="#fff"/></svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 43],
});
