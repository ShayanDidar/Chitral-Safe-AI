export type HazardType =
  | "flood"
  | "landslide"
  | "glacier"
  | "road_blockage"
  | "heavy_rain"
  | "rockfall"
  | "snowfall"
  | "other";

export type Severity = "low" | "medium" | "high" | "critical";

export type ReportStatus = "active" | "monitoring" | "resolved";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ChitralLocation {
  id: string;
  name: string;
  area: string;
  coordinates: LatLng;
  elevationM: number;
}

export interface ReportComment {
  id: string;
  author: string;
  avatarUrl?: string | null;
  text: string;
  /** Urdu translation (demo data); user comments are shown as written. */
  textUr?: string;
  createdAt: string; // ISO timestamp
}

export type ReportKind = "hazard" | "crime";
export type ReviewStatus = "pending" | "approved" | "rejected";
/** Who may see the report: everyone (after approval) or only admins + the submitter. */
export type Visibility = "public" | "confidential";
/** Whether the reporter's name is shown. Independent of visibility. */
export type IdentityMode = "named" | "anonymous";

export type CrimeCategory =
  | "theft"
  | "robbery"
  | "assault"
  | "harassment"
  | "domestic_violence"
  | "fraud"
  | "drugs"
  | "vandalism"
  | "suspicious"
  | "other";

export interface ReportAuthor {
  name: string;
  avatarUrl: string | null;
}

interface ReportBase {
  id: string;
  kind: ReportKind;
  /** Hazard lifecycle (active / monitoring / resolved). */
  status: ReportStatus;
  title: string;
  description: string;
  locationName: string;
  area: string;
  coordinates: LatLng;
  /** True when the public location was rounded for privacy (crime reports). */
  approximate: boolean;
  imageUrls: string[];
  /** First image, for cards. */
  imageUrl?: string;
  /** null = anonymous report. */
  author: ReportAuthor | null;
  reportedAt: string; // ISO timestamp
  likes: number;
  likedByMe: boolean;
  comments: ReportComment[];
  review: ReviewStatus;
  visibility: Visibility;
  identity: IdentityMode;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  /** True when the signed-in user submitted it. */
  mine: boolean;
  /** Demo content added by the app to show how it works (not a real event). */
  sample: boolean;
  /** Urdu title/description (demo data and generated titles). */
  ur?: { title: string; description: string };
  /** Admin view only, and only for named reports (for follow-up). */
  reporter?: { name: string; email: string; phone: string | null; contactEmail: string | null } | null;
}

export interface HazardReport extends ReportBase {
  kind: "hazard";
  type: HazardType;
  severity: Severity;
}

export interface CrimeReport extends ReportBase {
  kind: "crime";
  category: CrimeCategory;
  occurredAt: string | null;
}

export type Report = HazardReport | CrimeReport;

export interface CurrentUser {
  id: string;
  email: string;
  role: "user" | "admin";
  name: string;
  bio: string;
  phone: string | null;
  contactEmail: string | null;
  avatarUrl: string | null;
}

export interface EmergencyContact {
  id: string;
  region: string;
  label: string;
  labelUr: string | null;
  kind: "phone" | "sms" | "email";
  value: string;
  note: string | null;
  sort: number;
  active: boolean;
}

export type AlertLevel = "advisory" | "watch" | "warning";

export interface EnvironmentalAlert {
  id: string;
  level: AlertLevel;
  severity: Severity;
  title: string;
  area: string;
  message: string;
  risks: string[];
  issuedAt: string;
  source: string;
  relatedReportId?: string;
  ur?: { title: string; area: string; message: string; risks: string[]; source: string };
}

export type WeatherIcon =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy-rain"
  | "thunderstorm"
  | "snow";

export interface HourlyPoint {
  time: string; // ISO
  temperature: number;
  rainProbability: number;
}

export interface DailyForecast {
  date: string; // ISO date
  condition: string;
  icon: WeatherIcon;
  high: number;
  low: number;
  rainProbability: number;
}

export interface LocationConditions {
  locationId: string;
  name: string;
  temperature: number;
  condition: string;
  icon: WeatherIcon;
  rainProbability: number;
}

export interface WeatherData {
  source: "demo" | "open-meteo";
  /** When the provider last observed/updated conditions. */
  updatedAt: string;
  location: string;
  coordinates?: LatLng;
  /** Set when live weather failed and sample data is shown instead. */
  error?: "unavailable";
  /** Latest real measurement from a nearby weather station (used to correct the forecast). */
  station?: { name: string; temperature: number; time: string };
  current: {
    temperature: number;
    feelsLike: number;
    condition: string;
    icon: WeatherIcon;
    humidity: number;
    windSpeed: number; // km/h
    windDirection: string;
    rainProbability: number; // today, %
    precipitationMm: number; // expected today
    high: number;
    low: number;
  };
  hourly: HourlyPoint[];
  daily: DailyForecast[];
  locations: LocationConditions[];
}

export type RiskLevel = "Low" | "Moderate" | "High" | "Severe";

export interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0-100
  headline: string;
  possibleRisks: string[];
  reason: string;
  suggestedAction: string;
  scope: string;
  generatedAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Compact snapshot of app state that is injected into AI prompts. */
export interface AIContext {
  generatedAt: string;
  selectedLocation: string | null;
  weather: {
    source: string;
    location: string;
    temperature: number;
    condition: string;
    humidity: number;
    wind: string;
    rainProbability: number;
    precipitationMm: number;
    next3Days: { date: string; condition: string; high: number; low: number; rainProbability: number }[];
    locations: { name: string; temperature: number; condition: string; rainProbability: number }[];
  } | null;
  reports: {
    type: string;
    severity: Severity;
    status: ReportStatus;
    location: string;
    description: string;
    reportedMinutesAgo: number;
    likes: number;
    comments: number;
  }[];
  /** Approved public safety (crime) reports — category and approximate area only. */
  safetyReports?: { category: string; area: string; reportedMinutesAgo: number }[];
  alerts: { title: string; area: string; level: AlertLevel; message: string }[];
}

export type AIMode = "live" | "demo";
