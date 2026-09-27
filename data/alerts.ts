import type { EnvironmentalAlert } from "@/types";

export function buildSeedAlerts(now = Date.now()): EnvironmentalAlert[] {
  const ago = (m: number) => new Date(now - m * 60_000).toISOString();
  return [
    {
      id: "a-rain",
      level: "warning",
      severity: "high",
      title: "High Rainfall",
      area: "Chitral Valley",
      message:
        "Heavy rainfall is expected across the valley through tomorrow evening. Streams and nullahs may rise quickly.",
      risks: ["Flooding", "Landslides"],
      issuedAt: ago(40),
      source: "Weather outlook",
    },
    {
      id: "a-glacier",
      level: "warning",
      severity: "critical",
      title: "Glacier Stream Surge",
      area: "Reshun, Upper Chitral",
      message:
        "Community members report a rapid rise in the glacier-fed stream at Reshun. Stay away from the stream bed.",
      risks: ["Flash flood", "Debris flow"],
      issuedAt: ago(45),
      source: "Community reports",
      relatedReportId: "r-reshun-glacier",
    },
    {
      id: "a-ayun-road",
      level: "watch",
      severity: "high",
      title: "Road Hazard",
      area: "Ayun Road",
      message: "A community report indicates a possible road blockage. Expect single-lane traffic and delays.",
      risks: ["Landslide", "Road blockage"],
      issuedAt: ago(30),
      source: "Community reports",
      relatedReportId: "r-ayun-landslide",
    },
    {
      id: "a-lowari",
      level: "advisory",
      severity: "medium",
      title: "Cold & Snow Advisory",
      area: "Lowari Pass",
      message: "Light snowfall on higher roads. The tunnel is open; the old pass road may be slippery.",
      risks: ["Icy roads"],
      issuedAt: ago(200),
      source: "Weather outlook",
      relatedReportId: "r-lowari-snow",
    },
  ];
}
