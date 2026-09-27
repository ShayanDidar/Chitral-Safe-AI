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
  text: string;
  createdAt: string; // ISO timestamp
}

export interface HazardReport {
  id: string;
  type: HazardType;
  severity: Severity;
  status: ReportStatus;
  title: string;
  description: string;
  locationName: string;
  area: string;
  coordinates: LatLng;
  imageUrl?: string;
  author: string;
  reportedAt: string; // ISO timestamp
  likes: number;
  likedByMe: boolean;
  comments: ReportComment[];
  /** "user" = created in this browser session via the Report form */
  source: "community" | "user";
}

export interface NewReportInput {
  type: HazardType;
  severity: Severity;
  description: string;
  locationName: string;
  coordinates?: LatLng;
  imageUrl?: string;
  author?: string;
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
  updatedAt: string;
  location: string;
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
  alerts: { title: string; area: string; level: AlertLevel; message: string }[];
}

export type AIMode = "live" | "demo";
