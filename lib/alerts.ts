/**
 * Environmental alerts. The app works these out from real data; nothing is typed in by hand:
 *  - weather alerts from the live forecast (heavy rain, heat, frost, snow)
 *  - community alerts from approved critical or high-severity hazard reports
 * They are NOT official government warnings.
 */
import { HAZARD_TERMS, isolateNumbers, placeName } from "@/lib/i18n/terms";
import type { EnvironmentalAlert, HazardReport, Report, WeatherData } from "@/types";

export function buildAlerts(weather: WeatherData, reports: Report[]): EnvironmentalAlert[] {
  return [...weatherAlerts(weather), ...communityAlerts(reports)];
}

function weatherAlerts(w: WeatherData): EnvironmentalAlert[] {
  if (w.source !== "open-meteo" || w.error) return []; // never from sample weather
  const c = w.current;
  const alerts: EnvironmentalAlert[] = [];
  const add = (
    a: Pick<EnvironmentalAlert, "id" | "level" | "severity" | "title" | "message" | "risks">,
    ur: { title: string; message: string; risks: string[] },
  ) =>
    alerts.push({
      ...a,
      area: w.location,
      issuedAt: w.updatedAt,
      source: "Weather forecast",
      ur: { ...ur, message: isolateNumbers(ur.message), area: placeName(w.location, "ur"), source: "موسمی پیشگوئی" },
    });

  if (c.precipitationMm >= 10) {
    add(
      {
        id: "wx-heavy-rain",
        level: "warning",
        severity: "high",
        title: "Heavy Rain Today",
        message: `About ${c.precipitationMm} mm of rain is forecast today (${c.rainProbability}% chance). Streams and nullahs may rise quickly.`,
        risks: ["Flooding", "Landslides"],
      },
      {
        title: "آج شدید بارش",
        message: `آج تقریباً ${c.precipitationMm} ملی میٹر بارش کی پیشگوئی ہے (امکان ${c.rainProbability}%)۔ ندی نالوں میں پانی تیزی سے بڑھ سکتا ہے۔`,
        risks: ["سیلاب", "لینڈ سلائیڈ"],
      },
    );
  } else if (c.rainProbability >= 60) {
    add(
      {
        id: "wx-rain",
        level: "advisory",
        severity: "medium",
        title: "Rain Likely Today",
        message: `Light rain is likely today (${c.rainProbability}% chance, about ${Math.max(1, c.precipitationMm)} mm). Roads and paths may be slippery.`,
        risks: ["Slippery roads"],
      },
      {
        title: "آج بارش کا امکان",
        message: `آج ہلکی بارش کا امکان ہے (امکان ${c.rainProbability}%، تقریباً ${Math.max(1, c.precipitationMm)} ملی میٹر)۔ سڑکیں اور راستے پھسلن والے ہو سکتے ہیں۔`,
        risks: ["پھسلن والی سڑکیں"],
      },
    );
  }

  // Heat speeds up glacier melt, the main cause of glacier stream surges in Chitral.
  if (c.high >= 35) {
    add(
      {
        id: "wx-heat",
        level: "watch",
        severity: "high",
        title: "Hot Day: Faster Glacier Melt",
        message: `Temperatures up to ${c.high}°C today. Heat speeds up glacier melt, so glacier-fed streams can rise in the afternoon.`,
        risks: ["Glacier stream surge", "Flash flood"],
      },
      {
        title: "گرم دن: گلیشیئر تیزی سے پگھلیں گے",
        message: `آج درجہ حرارت ${c.high}°C تک۔ گرمی سے گلیشیئر تیزی سے پگھلتے ہیں، اس لیے دوپہر کو گلیشیئر کے نالوں میں پانی بڑھ سکتا ہے۔`,
        risks: ["گلیشیئر نالے میں طغیانی", "اچانک سیلاب"],
      },
    );
  }

  if (c.icon === "snow") {
    add(
      {
        id: "wx-snow",
        level: "advisory",
        severity: "medium",
        title: "Snowfall",
        message: "Snow is forecast. High roads and passes may close.",
        risks: ["Road closures"],
      },
      { title: "برف باری", message: "برف باری کی پیشگوئی ہے۔ بلند سڑکیں اور درے بند ہو سکتے ہیں۔", risks: ["سڑکوں کی بندش"] },
    );
  } else if (c.low <= 0) {
    add(
      {
        id: "wx-frost",
        level: "advisory",
        severity: "medium",
        title: "Freezing Temperatures",
        message: `Lows of ${c.low}°C expected. Roads may be icy in the early morning.`,
        risks: ["Icy roads"],
      },
      {
        title: "شدید سردی",
        message: `کم سے کم درجہ حرارت ${c.low}°C متوقع ہے۔ صبح سویرے سڑکوں پر پھسلن ہو سکتی ہے۔`,
        risks: ["برفیلی سڑکیں"],
      },
    );
  }
  return alerts;
}

/** The most serious active hazard reports (critical first, then newest), at most four. */
function communityAlerts(reports: Report[]): EnvironmentalAlert[] {
  return reports
    .filter(
      (r): r is HazardReport =>
        r.kind === "hazard" && r.status !== "resolved" && (r.severity === "critical" || r.severity === "high"),
    )
    .sort((a, b) =>
      a.severity === b.severity ? b.reportedAt.localeCompare(a.reportedAt) : a.severity === "critical" ? -1 : 1,
    )
    .slice(0, 4)
    .map((r) => ({
      id: `report-${r.id}`,
      level: r.severity === "critical" ? "warning" : "watch",
      severity: r.severity,
      title: HAZARD_TERMS[r.type].en,
      area: r.locationName,
      message: r.title,
      risks: [],
      issuedAt: r.reportedAt,
      source: "Community report",
      relatedReportId: r.id,
      ur: {
        title: HAZARD_TERMS[r.type].ur,
        area: placeName(r.locationName, "ur"),
        message: r.ur?.title ?? r.title,
        risks: [],
        source: "کمیونٹی رپورٹ",
      },
    }));
}
