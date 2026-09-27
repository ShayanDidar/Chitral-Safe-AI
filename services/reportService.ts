/**
 * Report data layer.
 *
 * For the MVP everything lives in memory for the current browser session.
 * To connect a database later, replace these functions with API calls
 * (e.g. fetch("/api/reports")) — the rest of the app only talks to this module
 * through the HazardStore provider.
 */
import { buildSeedAlerts } from "@/data/alerts";
import { findLocationByName, DEFAULT_LOCATION } from "@/data/locations";
import { buildSeedReports } from "@/data/reports";
import { HAZARD_TYPES } from "@/lib/hazards";
import { uid } from "@/lib/utils";
import type { EnvironmentalAlert, HazardReport, NewReportInput, ReportComment } from "@/types";

export function getInitialReports(): HazardReport[] {
  return buildSeedReports();
}

export function getInitialAlerts(): EnvironmentalAlert[] {
  return buildSeedAlerts();
}

export function createReport(input: NewReportInput): HazardReport {
  const known = findLocationByName(input.locationName);
  const coordinates =
    input.coordinates ??
    (known
      ? jitter(known.coordinates)
      : jitter(DEFAULT_LOCATION.coordinates));
  const label = HAZARD_TYPES[input.type].label;
  const locationName = input.locationName.trim() || known?.name || "Chitral";

  return {
    id: uid("r"),
    type: input.type,
    severity: input.severity,
    status: "active",
    title: `${label} reported near ${locationName}`,
    description: input.description.trim(),
    locationName,
    area: known?.area ?? "Chitral",
    coordinates,
    imageUrl: input.imageUrl,
    author: input.author?.trim() || "You",
    reportedAt: new Date().toISOString(),
    likes: 0,
    likedByMe: false,
    comments: [],
    source: "user",
  };
}

export function createComment(text: string, author = "You"): ReportComment {
  return { id: uid("c"), author, text: text.trim(), createdAt: new Date().toISOString() };
}

function jitter(p: { lat: number; lng: number }) {
  const r = () => (Math.random() - 0.5) * 0.01;
  return { lat: +(p.lat + r()).toFixed(5), lng: +(p.lng + r()).toFixed(5) };
}
