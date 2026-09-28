/**
 * Demo-mode AI. Used when AI_API_KEY is not set (or the provider fails) so the
 * assistant still gives realistic, context-aware answers during a demo.
 */
import type { AIContext, RiskAssessment, RiskLevel } from "@/types";
import { RISK_TERMS, SEVERITY_TERMS, WEATHER_TERMS, hazardLabelFromEnglish, placeName, type Lang } from "@/lib/i18n/terms";

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

type Intent =
  | "greeting"
  | "glacier"
  | "landslideWhy"
  | "floodTodo"
  | "weather"
  | "roads"
  | "active"
  | "risk"
  | "landslide"
  | "flood"
  | "howto"
  | "chitral"
  | "fallback";

/** Keyword intent detection for English and Urdu questions. Order matters. */
function detectIntent(question: string): Intent {
  const q = question.toLowerCase();
  const has = (...words: string[]) => words.some((x) => q.includes(x));
  const landslide = has("landslide", "لینڈ سلائیڈ", "لینڈسلائیڈ", "تودہ");
  const flood = has("flood", "سیلاب");

  if (/^\s*(hi|hello|hey|salam|assalam|aoa)\b/.test(q) || /^\s*(سلام|السلام|ہیلو)/.test(q)) return "greeting";
  if (has("glacier", "glof", "glacial", "lake outburst", "melt", "گلیشیئر", "گلیشیر", "برفانی")) return "glacier";
  if (landslide && has("why", "cause", "common", "happen", "reason", "کیوں", "وجہ", "عام")) return "landslideWhy";
  if (flood && has("what should", "what do", "do if", "safe", "prepare", "near my", "کیا کر", "محفوظ", "قریب")) return "floodTodo";
  if (has("weather", "temperature", "forecast", "rain today", "how hot", "how cold", "wind", "موسم", "درجہ حرارت", "گرمی", "سردی"))
    return "weather";
  if (has("road", "travel", "drive", "route", "lowari", "blocked", "journey", "open", "سڑک", "راستہ", "سفر", "لواری"))
    return "roads";
  if (has("risk", "aware", "danger", "threat", "worry", "concern", "آگاہ", "خطرناک")) return "risk";
  if (
    has("active", "right now", "current", "reported", "which area", "what area", "where", "happening", "hazards", "فعال", "ابھی", "کہاں", "کون سے خطرات")
  )
    return "active";
  if (landslide) return "landslide";
  if (flood) return "flood";
  if (has("report", "how to use", "how do i", "app", "post", "رپورٹ کیسے", "ایپ")) return "howto";
  if (has("chitral", "tirich", "kalash", "tell me about", "where is", "چترال", "ترچ میر", "کالاش")) return "chitral";
  if (has("خطرہ", "خطرے", "خطرات")) return "risk";
  return "fallback";
}

export function demoChat(question: string, ctx: AIContext | null, lang: Lang = "en"): string {
  const intent = detectIntent(question);
  return lang === "ur" ? demoChatUr(intent, ctx) : demoChatEn(intent, ctx);
}

function demoChatEn(intent: Intent, ctx: AIContext | null): string {
  const w = ctx?.weather;
  const act = active(ctx);

  if (intent === "greeting") {
    return `Hello! I'm the Chitral Safe assistant. I can tell you about current weather, active hazard reports, road conditions and how to stay safe around Chitral.\n\nTry asking: "What hazards are active right now?"`;
  }

  if (intent === "glacier") {
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

  if (intent === "landslideWhy") {
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

  if (intent === "floodTodo") {
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

  if (intent === "weather") {
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

  if (intent === "roads") {
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

  if (intent === "active") {
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

  if (intent === "risk") {
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

  if (intent === "landslide") {
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

  if (intent === "flood") {
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

  if (intent === "howto") {
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

  if (intent === "chitral") {
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
// Urdu demo answers

const urPlace = (name: string) => placeName(name, "ur");
const urType = (label: string) => hazardLabelFromEnglish(label, "ur");
const urSev = (s: Report["severity"]) => SEVERITY_TERMS[s].ur;
const urAgo = (min: number) => (min < 60 ? `${min} منٹ پہلے` : `${Math.round(min / 60)} گھنٹے پہلے`);
const UR_DISCLAIMER = "_یہ کمیونٹی رپورٹس پر مبنی معلوماتی رہنمائی ہے، سرکاری انتباہ نہیں۔_";
const UR_NO_CERTAINTY = "موجودہ حالات خطرے میں اضافے کی نشاندہی کر سکتے ہیں، لیکن اسے یقینی پیشگوئی نہ سمجھا جائے۔";

function urCondition(english: string) {
  const c = english.toLowerCase();
  if (c.includes("thunder")) return WEATHER_TERMS.thunderstorm;
  if (c.includes("snow")) return WEATHER_TERMS.snow;
  if (c.includes("heavy")) return WEATHER_TERMS["heavy-rain"];
  if (c.includes("drizzle") || c.includes("light") || c.includes("shower")) return WEATHER_TERMS.drizzle;
  if (c.includes("rain")) return WEATHER_TERMS.rain;
  if (c.includes("fog")) return WEATHER_TERMS.fog;
  if (c.includes("partly")) return WEATHER_TERMS["partly-cloudy"];
  if (c.includes("cloud") || c.includes("overcast")) return WEATHER_TERMS.cloudy;
  if (c.includes("clear") || c.includes("sun")) return WEATHER_TERMS.clear;
  return english;
}

function demoChatUr(intent: Intent, ctx: AIContext | null): string {
  const w = ctx?.weather;
  const act = active(ctx);

  switch (intent) {
    case "greeting":
      return "السلام علیکم! میں چترال سیف کا معاون ہوں۔ میں آپ کو موجودہ موسم، فعال خطرات کی رپورٹس، سڑکوں کی صورتحال اور چترال میں محفوظ رہنے کے بارے میں بتا سکتا ہوں۔\n\nپوچھ کر دیکھیں: \"ابھی کون سے خطرات فعال ہیں؟\"";

    case "glacier": {
      const g = act.filter((r) => r.type === "Glacier Hazard");
      return [
        "گلیشیئر سے جڑے خطرات چترال کے سب سے سنگین خطرات میں سے ہیں، خاص طور پر گرمیوں اور شدید گرمی کی لہر کے دوران۔",
        "",
        "- **وجہ:** گرم موسم میں گلیشیئر تیزی سے پگھلتے ہیں؛ پانی کمزور ملبے کے بند کے پیچھے جھیلوں میں جمع ہو جاتا ہے جو اچانک ٹوٹ سکتا ہے (GLOF)۔",
        "- **کہاں:** گلیشیئر سے آنے والی ذیلی وادیاں — ریشن، گولین، بونی اور اپر چترال کے کئی علاقے پہلے متاثر ہو چکے ہیں۔",
        "- **خطرے کی علامات:** گدلے پانی میں اچانک اضافہ، اوپر سے گرج کی آواز، یا نالے میں ملبہ۔",
        g.length
          ? `- **اس وقت:** گلیشیئر سے متعلق ${g.length} رپورٹ — ${g.map((r) => `${urPlace(r.location)} (${urSev(r.severity)})`).join("، ")}۔ نالے سے دور رہیں۔`
          : "- **اس وقت:** ایپ میں گلیشیئر سے متعلق کوئی رپورٹ نہیں۔",
        "",
        UR_NO_CERTAINTY,
      ].join("\n");
    }

    case "landslideWhy":
      return [
        "چترال میں لینڈ سلائیڈ قدرتی اور انسانی عوامل کے ملاپ کی وجہ سے عام ہیں:",
        "",
        "- **ڈھلوان علاقہ:** ہندوکش کی وادیوں کی ڈھلوانیں بہت اونچی اور تیز ہیں۔",
        "- **کمزور، ٹوٹی ہوئی چٹانیں اور ڈھیلا ملبہ** جو گیلا ہونے پر اپنی مضبوطی کھو دیتا ہے۔",
        "- **شدید بارش اور برف کا پگھلنا** مٹی کو سیراب کر کے ڈھلوان کا وزن بڑھا دیتے ہیں۔",
        "- **زلزلے:** یہ خطہ زلزلوں کی زد میں ہے جس سے وقت کے ساتھ ڈھلوانیں کمزور ہوتی ہیں۔",
        "- **سڑکوں کی کٹائی اور جنگلات کا خاتمہ** ڈھلوان کی بنیاد کو کمزور کرتے ہیں۔",
        "",
        "لینڈ سلائیڈ کا امکان شدید بارش کے دوران اور فوراً بعد سب سے زیادہ ہوتا ہے — اسی لیے آج کی بارش کی پیشگوئی اہم ہے۔",
      ].join("\n");

    case "floodTodo":
      return [
        "اگر آپ کے قریب سیلاب ہو تو جلد قدم اٹھائیں — پہاڑی وادیوں میں پانی بہت تیزی سے بڑھتا ہے۔",
        "",
        "- **فوراً اونچی جگہ پر چلے جائیں۔** پانی کے گھر تک پہنچنے کا انتظار نہ کریں۔",
        "- **دریا اور نالوں سے دور رہیں**، اور بہتے پانی کو کبھی پیدل یا گاڑی سے پار نہ کریں۔",
        "- **ضروری چیزیں ساتھ لیں:** شناختی دستاویزات، ادویات، چارج شدہ فون، پانی اور گرم کپڑے۔",
        "- **دوسروں کی مدد کریں:** بزرگ پڑوسیوں اور بچوں کا خیال رکھیں۔",
        "- **ایپ میں رپورٹ کریں** تاکہ قریبی لوگ خبردار ہو جائیں۔",
        "",
        "اگر جان کو خطرہ ہو تو **فوراً ریسکیو 1122 کو کال کریں**۔",
      ].join("\n");

    case "weather": {
      if (!w) return "اس وقت موسم کا ڈیٹا دستیاب نہیں۔ براہ کرم موسم کا صفحہ دیکھیں۔";
      const wettest = [...w.locations].sort((a, b) => b.rainProbability - a.rainProbability)[0];
      const tomorrow = w.next3Days[1];
      const wind = w.wind.replace("km/h", "کلومیٹر فی گھنٹہ");
      return [
        `${urPlace(w.location)} میں اس وقت **${w.temperature}°C اور ${urCondition(w.condition)}** ہے، اور آج **بارش کا امکان ${w.rainProbability}%** ہے۔`,
        "",
        `- نمی ${w.humidity}%، ہوا ${wind}۔`,
        `- آج متوقع بارش: تقریباً ${w.precipitationMm} ملی میٹر۔`,
        ...(wettest ? [`- بارش کا سب سے زیادہ امکان: **${urPlace(wettest.name)}** (${wettest.rainProbability}%)۔`] : []),
        ...(tomorrow
          ? [`- کل: ${urCondition(tomorrow.condition)}، ${tomorrow.low} سے ${tomorrow.high}°C، بارش کا امکان ${tomorrow.rainProbability}%۔`]
          : []),
        "",
        w.rainProbability >= 60
          ? "اتنی بارش کی توقع کے ساتھ ندی نالوں میں پانی بڑھ سکتا ہے اور ڈھلوانیں غیر مستحکم ہو سکتی ہیں۔ دریا کے کناروں سے دور رہیں اور سفر سے پہلے سڑکوں کی رپورٹس دیکھیں۔"
          : "حالات کافی حد تک پرسکون ہیں، لیکن پہاڑی موسم تیزی سے بدل سکتا ہے۔",
      ].join("\n");
    }

    case "roads": {
      const roads = act.filter((r) => ["Road Blockage", "Landslide", "Rockfall", "Flood", "Snowfall"].includes(r.type));
      if (!roads.length) return "اس وقت ایپ میں سڑکوں سے متعلق کوئی فعال رپورٹ نہیں۔ حالات تیزی سے بدل سکتے ہیں، اس لیے سفر سے پہلے دوبارہ دیکھ لیں۔";
      return [
        `**${roads.length} فعال رپورٹس** ایسی ہیں جو سڑکوں کو متاثر کر سکتی ہیں:`,
        "",
        ...roads.slice(0, 6).map((r) => `- **${urPlace(r.location)}** — ${urType(r.type)}، شدت: ${urSev(r.severity)} (${urAgo(r.reportedMinutesAgo)})`),
        "",
        "اضافی وقت رکھیں، کمزور ڈھلوانوں کے نیچے نہ رکیں، اور زیرِ آب یا بہہ جانے والے حصوں کو پار نہ کریں۔",
        UR_DISCLAIMER,
      ].join("\n");
    }

    case "active": {
      if (!act.length) return "اس وقت ایپ میں کوئی فعال خطرے کی رپورٹ نہیں۔";
      const serious = act.filter((r) => r.severity === "critical" || r.severity === "high");
      const areas = [...new Set(act.map((r) => urPlace(r.location)))];
      return [
        `${areas.length} علاقوں میں **${act.length} فعال خطرات کی رپورٹس** ہیں: ${areas.join("، ")}۔`,
        "",
        ...act.slice(0, 7).map((r) => `- **${urType(r.type)}** — ${urPlace(r.location)}، شدت: ${urSev(r.severity)} (${urAgo(r.reportedMinutesAgo)})`),
        "",
        serious.length
          ? `سب سے سنگین صورتحال **${[...new Set(serious.map((r) => urPlace(r.location)))].slice(0, 3).join("، ")}** میں ہے۔ ممکن ہو تو ان علاقوں سے دور رہیں۔`
          : "زیادہ تر رپورٹس کم یا درمیانی شدت کی ہیں۔",
        UR_DISCLAIMER,
      ].join("\n");
    }

    case "risk": {
      const risk = demoRisk(ctx, null, "ur");
      return [
        "چترال کے لوگوں کو ان اہم ماحولیاتی خطرات سے آگاہ رہنا چاہیے:",
        "",
        "- **اچانک سیلاب** — شدید بارش کے بعد نالوں اور دریائے چترال کے ساتھ۔",
        "- **لینڈ سلائیڈ اور پتھر گرنا** — ایون، گرم چشمہ اور بونی–مستوج جیسی ڈھلوان سڑکوں پر۔",
        "- **گلیشیئر جھیلوں کے سیلاب (GLOF)** — گرم موسم میں گلیشیئر والی وادیوں میں۔",
        "- **سڑکوں کی بندش** — جس سے دیہات گھنٹوں یا دنوں تک کٹ سکتے ہیں۔",
        "- **شدید برف باری اور برفانی تودے** — سردیوں میں بلند دروں پر۔",
        "",
        `**اس وقت:** مجموعی خطرہ **${RISK_TERMS[risk.level].ur}** نظر آتا ہے۔ ${risk.reason}`,
        "",
        UR_NO_CERTAINTY,
      ].join("\n");
    }

    case "landslide": {
      const ls = act.filter((r) => r.type === "Landslide");
      return [
        ls.length
          ? `لینڈ سلائیڈ کی ${ls.length} فعال رپورٹس: ${ls.map((r) => `${urPlace(r.location)} (${urSev(r.severity)})`).join("، ")}۔`
          : "اس وقت لینڈ سلائیڈ کی کوئی فعال رپورٹ نہیں۔",
        "",
        "- ڈھلوان اور اس کے بالکل نیچے والی سڑک سے دور رہیں۔",
        "- دراڑوں، جھکتے درختوں، گرتے کنکروں یا گدلے پانی پر نظر رکھیں — یہ ڈھلوان کھسکنے کی علامات ہیں۔",
        "- بارش کے بعد لینڈ سلائیڈ دوبارہ ہو سکتی ہے، اس لیے علاقہ صاف ہونے کا انتظار کریں۔",
      ].join("\n");
    }

    case "flood": {
      const fl = act.filter((r) => r.type === "Flood");
      return [
        fl.length
          ? `سیلاب کی ${fl.length} فعال رپورٹس: ${fl.map((r) => `${urPlace(r.location)} (${urSev(r.severity)})`).join("، ")}۔`
          : "اس وقت سیلاب کی کوئی فعال رپورٹ نہیں۔",
        "",
        "- دریا کے کناروں اور نالوں سے دور رہیں، خاص طور پر شدید بارش کے بعد۔",
        "- بہتے پانی کو کبھی پار نہ کریں۔",
        "- اگر قریب پانی بڑھ رہا ہو تو اونچی جگہ پر جائیں اور ضرورت ہو تو ریسکیو 1122 کو کال کریں۔",
      ].join("\n");
    }

    case "howto":
      return [
        "آپ چند آسان مراحل میں خطرے کی رپورٹ کر سکتے ہیں — لاگ اِن کی ضرورت نہیں:",
        "",
        "- مینو سے **رپورٹ** کھولیں۔",
        "- خطرے کی قسم اور شدت منتخب کریں۔",
        "- مقام لکھیں یا نقشے پر ٹیپ کریں۔",
        "- تصویر اور مختصر تفصیل شامل کریں۔",
        "- جمع کریں — آپ کی رپورٹ فوراً نقشے اور کمیونٹی فیڈ پر نظر آئے گی۔",
      ].join("\n");

    case "chitral":
      return [
        "چترال خیبر پختونخوا کا سب سے شمالی علاقہ ہے جو ہندوکش کے پہاڑوں میں واقع ہے۔",
        "",
        "- یہ **لوئر چترال** (چترال ٹاؤن، دروش، ایون، گرم چشمہ، کالاش وادیاں) اور **اپر چترال** (بونی، مستوج، ریشن وغیرہ) میں تقسیم ہے۔",
        "- یہاں ہندوکش کی سب سے اونچی چوٹی **ترچ میر (7,708 میٹر)** واقع ہے۔",
        "- یہاں پہنچنے کا اہم راستہ **لواری ٹنل** ہے؛ کئی سڑکیں ڈھلوانوں کے نیچے دریاؤں کے ساتھ گزرتی ہیں۔",
        "- ڈھلوان علاقے، گلیشیئرز اور شدید بارشوں کی وجہ سے یہاں سیلاب، لینڈ سلائیڈ اور گلیشیئر کے خطرات عام ہیں۔",
      ].join("\n");

    default:
      return [
        "میں چترال میں ماحولیاتی حالات اور حفاظت کے بارے میں مدد کر سکتا ہوں۔ مثال کے طور پر آپ پوچھ سکتے ہیں:",
        "",
        "- \"ابھی کون سے خطرات فعال ہیں؟\"",
        "- \"آج چترال کا موسم کیسا ہے؟\"",
        "- \"کون سی سڑکیں متاثر ہیں؟\"",
        "- \"چترال میں لینڈ سلائیڈ کیوں عام ہیں؟\"",
        "- \"اگر میرے علاقے کے قریب سیلاب آئے تو مجھے کیا کرنا چاہیے؟\"",
      ].join("\n");
  }
}

// ---------------------------------------------------------------------------

export function demoRisk(ctx: AIContext | null, scope: string | null, lang: Lang = "en"): RiskAssessment {
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
  const roadIssue = act.find((r) => r.type === "Road Blockage" || r.type === "Landslide");
  const place = scope ?? "Chitral";
  const text = lang === "ur" ? riskTextUr({ rain, act, serious, level, scope, roadIssue }) : riskTextEn({ rain, act, serious, level, scope, roadIssue });

  return {
    level,
    score,
    headline: text.headline,
    possibleRisks: [...risks].slice(0, 4),
    reason: text.reason,
    suggestedAction: text.suggestedAction,
    scope: place,
    generatedAt: new Date().toISOString(),
  };
}

interface RiskTextInput {
  rain: number;
  act: Report[];
  serious: Report[];
  level: RiskLevel;
  scope: string | null;
  roadIssue: Report | undefined;
}

function riskTextEn({ rain, act, serious, level, scope, roadIssue }: RiskTextInput) {
  const place = scope ?? "Chitral";
  const reason =
    `${rain >= 60 ? "Heavy rainfall" : rain >= 35 ? "Possible rainfall" : "Mostly dry weather"} (${rain}% chance) ` +
    (act.length
      ? `combined with ${act.length} active community report${act.length > 1 ? "s" : ""}${serious.length ? `, including ${serious.length} high or critical,` : ""} may indicate ${level === "Low" ? "limited" : "increased"} local risk.`
      : "and no active community reports suggest limited local risk.");
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
  return { headline, reason, suggestedAction };
}

function riskTextUr({ rain, act, serious, level, scope, roadIssue }: RiskTextInput) {
  const place = urPlace(scope ?? "Chitral");
  const weather = rain >= 60 ? "شدید بارش" : rain >= 35 ? "ممکنہ بارش" : "زیادہ تر خشک موسم";
  const reason =
    `${weather} (امکان ${rain}%) ` +
    (act.length
      ? `اور ${act.length} فعال کمیونٹی رپورٹس${serious.length ? `، جن میں ${serious.length} زیادہ یا سنگین شدت کی ہیں،` : ""} مل کر ${level === "Low" ? "محدود" : "بڑھتے ہوئے"} مقامی خطرے کی نشاندہی کر سکتی ہیں۔`
      : "اور کسی فعال کمیونٹی رپورٹ کا نہ ہونا محدود مقامی خطرے کی طرف اشارہ کرتا ہے۔");
  const suggestedAction =
    level === "Low"
      ? "حالات قابو میں نظر آتے ہیں۔ موسم کی پیشگوئی اور کمیونٹی رپورٹس پر نظر رکھیں۔"
      : `مقامی انتباہات پر نظر رکھیں${roadIssue ? ` اور بند بتائی گئی سڑکوں، جیسے ${urPlace(roadIssue.location)} کے قریب، سے گریز کریں` : ""}۔ شدید بارش کے دوران دریا کے کناروں اور نالوں سے دور رہیں۔`;
  const headline =
    rain >= 60
      ? `آج ${scope ? place : "کئی علاقوں"} میں بارش متوقع ہے۔ ${scope ? "اس علاقے" : "کچھ مقامات"} میں سیلاب اور لینڈ سلائیڈ کا خطرہ بڑھ سکتا ہے۔`
      : act.length
        ? `${place} میں ${act.length} فعال خطرات کی رپورٹس ہیں۔ احتیاط سے سفر کریں اور تازہ صورتحال دیکھتے رہیں۔`
        : `${place} میں کوئی بڑا خطرہ رپورٹ نہیں ہوا۔ حالات پرسکون نظر آتے ہیں۔`;
  return { headline, reason, suggestedAction };
}
