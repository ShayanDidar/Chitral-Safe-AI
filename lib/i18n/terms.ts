/**
 * Domain vocabulary in English and Urdu. Plain data (no React) so it can be
 * used on the server too — e.g. by the demo AI responses.
 */
import type { CrimeCategory, HazardType, ReportStatus, ReviewStatus, RiskLevel, Severity, WeatherIcon } from "@/types";

export type Lang = "en" | "ur";

type Pair = { en: string; ur: string };

export const HAZARD_TERMS: Record<HazardType, Pair> = {
  flood: { en: "Flood", ur: "سیلاب" },
  landslide: { en: "Landslide", ur: "لینڈ سلائیڈ" },
  glacier: { en: "Glacier Hazard", ur: "گلیشیئر کا خطرہ" },
  road_blockage: { en: "Road Blockage", ur: "سڑک کی بندش" },
  heavy_rain: { en: "Heavy Rain", ur: "شدید بارش" },
  rockfall: { en: "Rockfall", ur: "پتھر گرنا" },
  snowfall: { en: "Snowfall", ur: "برف باری" },
  other: { en: "Other", ur: "دیگر" },
};

export const CRIME_TERMS: Record<CrimeCategory, Pair> = {
  theft: { en: "Theft", ur: "چوری" },
  robbery: { en: "Robbery", ur: "ڈکیتی" },
  assault: { en: "Assault", ur: "حملہ / مار پیٹ" },
  harassment: { en: "Harassment", ur: "ہراسانی" },
  domestic_violence: { en: "Domestic violence", ur: "گھریلو تشدد" },
  fraud: { en: "Fraud or scam", ur: "دھوکہ دہی" },
  drugs: { en: "Drug-related", ur: "منشیات سے متعلق" },
  vandalism: { en: "Vandalism", ur: "توڑ پھوڑ" },
  suspicious: { en: "Suspicious activity", ur: "مشکوک سرگرمی" },
  other: { en: "Other", ur: "دیگر" },
};

export const REVIEW_TERMS: Record<ReviewStatus, Pair> = {
  pending: { en: "Pending review", ur: "زیرِ جائزہ" },
  approved: { en: "Approved", ur: "منظور شدہ" },
  rejected: { en: "Rejected", ur: "مسترد" },
};

/** Looks up a hazard label given its English label (as sent in AI context). */
export function hazardLabelFromEnglish(label: string, lang: Lang) {
  if (lang === "en") return label;
  const hit = Object.values(HAZARD_TERMS).find((p) => p.en === label);
  return hit ? hit.ur : label;
}

export const SEVERITY_TERMS: Record<Severity, Pair & { descEn: string; descUr: string }> = {
  low: { en: "Low", ur: "کم", descEn: "Minor issue, passable with care", descUr: "معمولی مسئلہ، احتیاط سے گزرا جا سکتا ہے" },
  medium: { en: "Medium", ur: "درمیانہ", descEn: "Caution advised, possible delays", descUr: "احتیاط کریں، تاخیر ممکن ہے" },
  high: { en: "High", ur: "زیادہ", descEn: "Dangerous, avoid the area if possible", descUr: "خطرناک، ممکن ہو تو علاقے سے دور رہیں" },
  critical: { en: "Critical", ur: "سنگین", descEn: "Immediate danger to life or property", descUr: "جان و مال کو فوری خطرہ" },
};

export const STATUS_TERMS: Record<ReportStatus, Pair> = {
  active: { en: "Active", ur: "فعال" },
  monitoring: { en: "Monitoring", ur: "زیرِ نگرانی" },
  resolved: { en: "Resolved", ur: "حل شدہ" },
};

export const RISK_TERMS: Record<RiskLevel, Pair> = {
  Low: { en: "Low", ur: "کم" },
  Moderate: { en: "Moderate", ur: "معتدل" },
  High: { en: "High", ur: "زیادہ" },
  Severe: { en: "Severe", ur: "شدید" },
};

export const WEATHER_TERMS: Record<WeatherIcon, string> = {
  clear: "صاف",
  "partly-cloudy": "جزوی ابر آلود",
  cloudy: "ابر آلود",
  fog: "دھند",
  drizzle: "ہلکی بارش",
  rain: "بارش",
  "heavy-rain": "شدید بارش",
  thunderstorm: "گرج چمک کے ساتھ بارش",
  snow: "برف باری",
};

/** Place and area names. Unknown (user-typed) names are shown as written. */
const PLACE_TERMS: Record<string, string> = {
  Chitral: "چترال",
  "Chitral Town": "چترال ٹاؤن",
  Ayun: "ایون",
  Drosh: "دروش",
  Booni: "بونی",
  Mastuj: "مستوج",
  "Garam Chashma": "گرم چشمہ",
  Reshun: "ریشن",
  Bumburet: "بمبوریت",
  "Lowari Tunnel": "لواری ٹنل",
  "Kalash Valleys": "کالاش وادیاں",
  Shandur: "شندور",
  Broghil: "بروغل",
  Tirich: "تریچ",
  Torkhow: "تورکہو",
  Brep: "بریپ",
  "Lower Chitral": "لوئر چترال",
  "Upper Chitral": "اپر چترال",
  "Chitral Valley": "وادئ چترال",
  "All of Chitral": "پورا چترال",
};

export function placeName(name: string, lang: Lang) {
  if (lang === "en") return name;
  if (PLACE_TERMS[name]) return PLACE_TERMS[name];
  // "Near Ayun" style names produced by the report form
  const near = name.match(/^Near (.+)$/);
  if (near && PLACE_TERMS[near[1]]) return `${PLACE_TERMS[near[1]]} کے قریب`;
  return name;
}

/** Risk names produced by the demo risk analysis. */
export const RISK_NAME_TERMS: Record<string, string> = {
  Flooding: "سیلاب",
  Landslides: "لینڈ سلائیڈ",
  "Glacier stream surge": "گلیشیئر نالے میں طغیانی",
  "Road blockages": "سڑکوں کی بندش",
  Rockfall: "پتھر گرنا",
  "Icy roads": "برفیلی سڑکیں",
  "No significant risks indicated": "کوئی نمایاں خطرہ نہیں",
};

/**
 * Wraps numbers with their units (72%, 18°C, 12.5, 3/100) in Unicode
 * left-to-right isolates so they don't get reordered inside Urdu text
 * (otherwise "68%" renders as "%68").
 */
export function isolateNumbers(text: string) {
  return text.replace(/[~-]?\d[\d.,:/–]*(?:\s?(?:°C|°|%))?/g, (m) => `\u2066${m}\u2069`);
}

export function timeAgoText(iso: string, lang: Lang, now = Date.now()) {
  const min = Math.floor(Math.max(0, now - new Date(iso).getTime()) / 60_000);
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  if (lang === "ur") {
    if (min < 1) return "ابھی ابھی";
    if (min < 60) return `${min} منٹ پہلے`;
    if (h < 24) return `${h} گھنٹے پہلے`;
    return `${d} دن پہلے`;
  }
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  return `${d} day${d > 1 ? "s" : ""} ago`;
}
