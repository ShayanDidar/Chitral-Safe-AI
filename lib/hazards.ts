import {
  CircleAlert,
  CloudRainWind,
  Mountain,
  MountainSnow,
  Snowflake,
  Stone,
  TrafficCone,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { HazardType, Severity } from "@/types";

export interface HazardMeta {
  label: string;
  icon: LucideIcon;
  image: string;
  guidance: string[];
}

export const HAZARD_TYPES: Record<HazardType, HazardMeta> = {
  flood: {
    label: "Flood",
    icon: Waves,
    image: "/demo/flood-1.svg",
    guidance: [
      "Move to higher ground and stay away from riverbanks and nullahs.",
      "Never drive or walk through moving floodwater — 30 cm can move a car.",
      "Keep important documents and a phone charger ready to go.",
    ],
  },
  landslide: {
    label: "Landslide",
    icon: Mountain,
    image: "/demo/landslide-1.svg",
    guidance: [
      "Avoid the affected slope and the road below it until it is cleared.",
      "Watch for new cracks, tilting trees or sudden muddy streams.",
      "Landslides often recur after rain — do not stop beneath the slide area.",
    ],
  },
  glacier: {
    label: "Glacier Hazard",
    icon: MountainSnow,
    image: "/demo/glacier-1.svg",
    guidance: [
      "Stay away from streams draining glaciers, especially in the afternoon.",
      "A sudden rise in muddy water or a loud roar upstream can signal a surge.",
      "Know the nearest high ground and agree on a family meeting point.",
    ],
  },
  road_blockage: {
    label: "Road Blockage",
    icon: TrafficCone,
    image: "/demo/road-1.svg",
    guidance: [
      "Check community reports before starting a journey.",
      "Do not attempt to cross debris on foot while material is still moving.",
      "Carry water, warm clothing and a charged phone on mountain roads.",
    ],
  },
  heavy_rain: {
    label: "Heavy Rain",
    icon: CloudRainWind,
    image: "/demo/rain-1.svg",
    guidance: [
      "Heavy rain raises flood and landslide risk within hours.",
      "Avoid unnecessary travel on mountain roads during intense rainfall.",
      "Clear drains around your home and secure loose items.",
    ],
  },
  rockfall: {
    label: "Rockfall",
    icon: Stone,
    image: "/demo/rockfall-1.svg",
    guidance: [
      "Pass rockfall zones quickly and without stopping.",
      "Keep windows closed and watch the slope above the road.",
      "Report fresh rocks on the road so others can plan ahead.",
    ],
  },
  snowfall: {
    label: "Snowfall",
    icon: Snowflake,
    image: "/demo/snow-1.svg",
    guidance: [
      "Mountain passes can close quickly — check conditions before travel.",
      "Carry warm clothing, food and water in your vehicle.",
      "Watch for ice on shaded road sections in the morning.",
    ],
  },
  other: {
    label: "Other",
    icon: CircleAlert,
    image: "/demo/rain-2.svg",
    guidance: [
      "Keep a safe distance and follow instructions from local authorities.",
      "Share clear, accurate details so others can stay informed.",
    ],
  },
};

export const HAZARD_TYPE_LIST = Object.keys(HAZARD_TYPES) as HazardType[];

export interface SeverityMeta {
  label: string;
  level: number; // 1-4
  description: string;
  /** Hex used for map markers (Leaflet HTML). */
  hex: string;
  dot: string;
  badge: string;
  text: string;
  soft: string;
  ring: string;
}

export const SEVERITIES: Record<Severity, SeverityMeta> = {
  low: {
    label: "Low",
    level: 1,
    description: "Minor issue, passable with care",
    hex: "#16a34a",
    dot: "bg-green-600",
    badge: "bg-green-50 text-green-800 ring-green-600/20",
    text: "text-green-700",
    soft: "bg-green-50",
    ring: "ring-green-600",
  },
  medium: {
    label: "Medium",
    level: 2,
    description: "Caution advised, possible delays",
    hex: "#ca8a04",
    dot: "bg-yellow-500",
    badge: "bg-yellow-50 text-yellow-800 ring-yellow-600/25",
    text: "text-yellow-700",
    soft: "bg-yellow-50",
    ring: "ring-yellow-500",
  },
  high: {
    label: "High",
    level: 3,
    description: "Dangerous, avoid the area if possible",
    hex: "#ea580c",
    dot: "bg-orange-600",
    badge: "bg-orange-50 text-orange-800 ring-orange-600/25",
    text: "text-orange-700",
    soft: "bg-orange-50",
    ring: "ring-orange-600",
  },
  critical: {
    label: "Critical",
    level: 4,
    description: "Immediate danger to life or property",
    hex: "#dc2626",
    dot: "bg-red-600",
    badge: "bg-red-50 text-red-800 ring-red-600/25",
    text: "text-red-700",
    soft: "bg-red-50",
    ring: "ring-red-600",
  },
};

export const SEVERITY_LIST: Severity[] = ["low", "medium", "high", "critical"];
