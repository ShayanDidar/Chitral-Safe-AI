import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { WeatherIcon } from "@/types";

const ICONS: Record<WeatherIcon, LucideIcon> = {
  clear: Sun,
  "partly-cloudy": CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  "heavy-rain": CloudRainWind,
  thunderstorm: CloudLightning,
  snow: CloudSnow,
};

export function WeatherIconGlyph({ icon, className }: { icon: WeatherIcon; className?: string }) {
  const Icon = ICONS[icon] ?? Cloud;
  return <Icon className={className} aria-hidden />;
}
