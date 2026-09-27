/**
 * Demo-mode AI. Used when AI_API_KEY is not set (or the provider fails) so the
 * assistant still gives realistic, context-aware answers during a demo.
 */
import type { AIContext, RiskAssessment, RiskLevel } from "@/types";

type Report = AIContext["reports"][number];

const WEIGHT = { critical: 14, high: 9, medium: 5, low: 2 } as const;

function active(ctx: AIContext | null): Report[] {
  return (ctx?.reports ?? []).filter((r) => r.status !== "resolved");
}

function ago(min: number) {
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return `${h} hr${h > 1 ? "s" : ""} ago`;
}

function reportLine(r: Report) {
  return `- **${r.type}** at ${r.location} — ${cap(r.severity)} (${ago(r.reportedMinutesAgo)})`;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const DISCLAIMER =
  "_This is informational guidance based on community reports, not an official warning._";

export function demoChat(question: string, ctx: AIContext | null): string {
  const q = question.toLowerCase();
  const w = ctx?.weather;
  const act = active(ctx);
  const has = (...words: string[]) => words.some((x) => q.includes(x));

  if (/^\s*(hi|hello|hey|salam|assalam|aoa)\b/.test(q)) {
    return `Hello! I'm the Chitral Safe assistant. I can tell you about current weather, active hazard reports, road conditions and how to stay safe around Chitral.\n\nTry asking: "What hazards are active right now?"`;
  }

  if (has("glacier", "glof", "glacial", "lake outburst", "melt")) {
    const g = act.filter((r) => r.type === "Glacier Hazard");
    return [
      "Glacier-related hazards are one of Chitral's most serious risks, especially in summer and during heatwaves.",
      "",
      "- **Why:** warm temperatures speed up glacier melt; meltwater can build up in lakes held back by loose moraine, which may burst suddenly (a GLOF).",
      "- **Where:** side valleys draining glaciers — Reshun, Golen, Booni and parts of Upper Chitral have been affected before.",
      "- **Warning signs:** a sudden rise in muddy water, a loud roar upstream, or debris in the stream.",
      g.length
        ? `- **Right now:** ${g.length} glacier-related report(s) — ${g.map((r) => `${r.location} (${cap(r.severity)})`).join(", ")}. Stay away from the stream bed.`
        : "- **Right now:** no glacier-related reports in the app.",
      "",
      "Current conditions may indicate an increased risk, but this cannot be treated as a confirmed prediction.",
    ].join("\n");
  }

  if (has("landslide") && has("why", "cause", "common", "happen", "reason")) {
    return [
      "Landslides are common in Chitral because of a combination of natural and human factors:",
      "",
      "- **Steep terrain:** the Hindu Kush valleys have very steep, high slopes.",
      "- **Weak, fractured rock and loose glacial deposits** that lose strength when wet.",
      "- **Intense rainfall and snowmelt** saturate the soil and add weight to slopes.",
      "- **Earthquakes:** the region is seismically active, which loosens slopes over time.",
      "- **Road cutting and deforestation** remove support at the base of slopes.",
      "",
      "They are most likely during and just after heavy rain — which is why today's rain forecast matters.",
    ].join("\n");
  }

  if (has("flood") && has("what should", "what do", "do if", "safe", "prepare", "near my")) {
    return [
      "If there is a flood near you, act early — floodwater in mountain valleys rises fast.",
      "",
      "- **Move to higher ground immediately.** Do not wait for water to reach your home.",
      "- **Stay away from rivers and nullahs**, and never cross moving water on foot or by car.",
      "- **Take essentials:** ID documents, medicines, a charged phone, water and warm clothes.",
      "- **Help others:** check on elderly neighbours and children.",
      "- **Report it** in the app so others nearby are warned.",
      "",
      "If lives are at risk, **call Rescue 1122** right away.",
    ].join("\n");
  }

  if (has("weather", "temperature", "forecast", "rain today", "how hot", "how cold", "wind")) {
    if (!w) return "Weather data isn't available right now. Please check the Weather page.";
    const wettest = [...w.locations].sort((a, b) => b.rainProbability - a.rainProbability)[0];
    const tomorrow = w.next3Days[1];
    const bullets = [
      `- Humidity ${w.humidity}%, wind ${w.wind}.`,
      `- Expected rainfall today: about ${w.precipitationMm} mm.`,
      wettest && `- Highest rain chance: **${wettest.name}** (${wettest.rainProbability}%).`,
      tomorrow &&
        `- Tomorrow: ${tomorrow.condition.toLowerCase()}, ${tomorrow.low}–${tomorrow.high}°C, ${tomorrow.rainProbability}% rain chance.`,
    ].filter(Boolean);
    return [
      `In ${w.location} it is currently **${w.temperature}°C and ${w.condition.toLowerCase()}**, with a **${w.rainProbability}% chance of rain** today.`,
      "",
      ...bullets,
      "",
      w.rainProbability >= 60
        ? "With this much rain expected, streams may rise and slopes may become unstable. Avoid riverbanks and check road reports before travelling."
        : "Conditions look fairly settled, but mountain weather can change quickly.",
    ].join("\n");
  }

  if (has("road", "travel", "drive", "route", "lowari", "blocked", "journey", "open")) {
    const roads = act.filter((r) => ["Road Blockage", "Landslide", "Rockfall", "Flood", "Snowfall"].includes(r.type));
    if (!roads.length) return "There are no active road-related reports in the app right now. Conditions can change quickly, so check again before you travel.";
    return [
      `There are **${roads.length} active reports** that may affect roads:`,
      "",
      ...roads.slice(0, 6).map((r) => `- **${r.location}** — ${r.type}, ${cap(r.severity)}: ${r.description.split(".")[0]}.`),
      "",
      "Plan extra time, avoid stopping below unstable slopes, and do not cross flooded or washed-out sections.",
      DISCLAIMER,
    ].join("\n");
  }

  if (has("active", "right now", "current", "reported", "which area", "what area", "where", "happening", "hazards")) {
    if (!act.length) return "There are no active hazard reports in the app right now.";
    const critical = act.filter((r) => r.severity === "critical" || r.severity === "high");
    const areas = [...new Set(act.map((r) => r.location))];
    return [
      `There are **${act.length} active hazard reports** across ${areas.length} areas: ${areas.join(", ")}.`,
      "",
      ...act.slice(0, 7).map(reportLine),
      "",
      critical.length
        ? `The most serious are at **${[...new Set(critical.map((r) => r.location))].slice(0, 3).join(", ")}**. Avoid these areas if you can.`
        : "Most reports are low to medium severity.",
      DISCLAIMER,
    ].join("\n");
  }

  if (has("risk", "aware", "danger", "threat", "worry", "concern")) {
    const risk = demoRisk(ctx, null);
    return [
      "People in Chitral should be aware of these main environmental risks:",
      "",
      "- **Flash floods** in nullahs and along the Chitral River after heavy rain.",
      "- **Landslides and rockfall** on steep roads such as Ayun, Garam Chashma and Booni–Mastuj.",
      "- **Glacier-related floods (GLOFs)** in glacier-fed valleys during warm periods.",
      "- **Road blockages** that can cut off villages for hours or days.",
      "- **Heavy snow and avalanches** on high passes in winter.",
      "",
      `**Right now:** overall risk looks **${risk.level.toLowerCase()}**. ${risk.reason}`,
      "",
      "Current conditions may indicate an increased risk, but this cannot be treated as a confirmed prediction.",
    ].join("\n");
  }

  if (has("landslide")) {
    const ls = act.filter((r) => r.type === "Landslide");
    return [
      ls.length
        ? `There ${ls.length === 1 ? "is 1 active landslide report" : `are ${ls.length} active landslide reports`}: ${ls.map((r) => `${r.location} (${cap(r.severity)})`).join(", ")}.`
        : "There are no active landslide reports right now.",
      "",
      "- Avoid the slope and the road directly below it.",
      "- Watch for cracks, tilting trees, falling pebbles or muddy water — signs a slope may move.",
      "- Landslides often recur after rain, so wait for the area to be cleared.",
    ].join("\n");
  }

  if (has("flood")) {
    const fl = act.filter((r) => r.type === "Flood");
    return [
      fl.length
        ? `There ${fl.length === 1 ? "is 1 active flood report" : `are ${fl.length} active flood reports`}: ${fl.map((r) => `${r.location} (${cap(r.severity)})`).join(", ")}.`
        : "There are no active flood reports right now.",
      "",
      "- Stay away from riverbanks and nullahs, especially after heavy rain.",
      "- Never cross moving water.",
      "- If water is rising near you, move to higher ground and call Rescue 1122 if needed.",
    ].join("\n");
  }

  if (has("report", "how to use", "how do i", "app", "post")) {
    return [
      "You can report a hazard in a few steps — no login needed:",
      "",
      "- Open **Report** from the menu.",
      "- Choose the hazard type and severity.",
      "- Enter the location or tap it on the map.",
      "- Add a photo and a short description.",
      "- Submit — your report appears instantly on the map and in the Community feed.",
    ].join("\n");
  }

  if (has("chitral", "tirich", "kalash", "tell me about", "where is")) {
    return [
      "Chitral is the northernmost region of Khyber Pakhtunkhwa, Pakistan, in the Hindu Kush mountains.",
      "",
      "- Split into **Lower Chitral** (Chitral Town, Drosh, Ayun, Garam Chashma, the Kalash valleys) and **Upper Chitral** (Booni, Mastuj, Reshun and beyond).",
      "- Home to **Tirich Mir (7,708 m)**, the highest peak of the Hindu Kush.",
      "- Reached mainly through the **Lowari Tunnel**; many roads follow rivers beneath steep slopes.",
      "- Its steep terrain, glaciers and intense rain events make floods, landslides and glacier hazards common.",
    ].join("\n");
  }

  return [
    "I can help with environmental conditions and safety in Chitral. For example, you can ask:",
    "",
    "- \"What hazards are active right now?\"",
    "- \"What is the weather like in Chitral today?\"",
    "- \"Which roads are affected?\"",
    "- \"Why are landslides common in Chitral?\"",
    "- \"What should I do if there is a flood near my area?\"",
  ].join("\n");
}

// ---------------------------------------------------------------------------

export function demoRisk(ctx: AIContext | null, scope: string | null): RiskAssessment {
  const act = active(ctx).filter((r) => !scope || r.location === scope);
  const w = ctx?.weather;
  const locWeather = scope ? w?.locations.find((l) => l.name === scope) : undefined;
  const rain = locWeather?.rainProbability ?? w?.rainProbability ?? 0;
  const warnings = (ctx?.alerts ?? []).filter(
    (a) => a.level === "warning" && (!scope || a.area.includes(scope) || a.area.includes("Valley")),
  ).length;

  const reportLoad = act.reduce((s, r) => s + WEIGHT[r.severity], 0);
  const score = Math.round(Math.min(100, rain * 0.4 + Math.min(40, reportLoad * 0.45) + warnings * 3));
  const level: RiskLevel = score < 30 ? "Low" : score < 55 ? "Moderate" : score < 75 ? "High" : "Severe";

  const risks = new Set<string>();
  if (rain >= 50) {
    risks.add("Flooding");
    risks.add("Landslides");
  }
  for (const r of act) {
    if (r.type === "Glacier Hazard") risks.add("Glacier stream surge");
    if (r.type === "Road Blockage" || r.type === "Landslide") risks.add("Road blockages");
    if (r.type === "Rockfall") risks.add("Rockfall");
    if (r.type === "Flood") risks.add("Flooding");
    if (r.type === "Snowfall") risks.add("Icy roads");
  }
  if (!risks.size) risks.add("No significant risks indicated");

  const serious = act.filter((r) => r.severity === "high" || r.severity === "critical");
  const place = scope ?? "Chitral";
  const reason =
    `${rain >= 60 ? "Heavy rainfall" : rain >= 35 ? "Possible rainfall" : "Mostly dry weather"} (${rain}% chance) ` +
    (act.length
      ? `combined with ${act.length} active community report${act.length > 1 ? "s" : ""}${serious.length ? `, including ${serious.length} high or critical,` : ""} may indicate ${level === "Low" ? "limited" : "increased"} local risk.`
      : "and no active community reports suggest limited local risk.");

  const roadIssue = act.find((r) => r.type === "Road Blockage" || r.type === "Landslide");
  const suggestedAction =
    level === "Low"
      ? "Conditions look manageable. Keep an eye on the forecast and community reports."
      : `Monitor local alerts${roadIssue ? ` and avoid roads currently reported as blocked, such as near ${roadIssue.location}` : ""}. Stay away from riverbanks and nullahs during heavy rain.`;

  const headline =
    rain >= 60
      ? `Rainfall is expected in ${scope ? place : "several areas"} today. ${scope ? "This area" : "Some locations"} may have an increased risk of flooding and landslides.`
      : act.length
        ? `${act.length} active hazard report${act.length > 1 ? "s" : ""} in ${place}. Travel with care and check updates.`
        : `No major hazards reported in ${place}. Conditions look calm.`;

  return {
    level,
    score,
    headline,
    possibleRisks: [...risks].slice(0, 4),
    reason,
    suggestedAction,
    scope: place,
    generatedAt: new Date().toISOString(),
  };
}
