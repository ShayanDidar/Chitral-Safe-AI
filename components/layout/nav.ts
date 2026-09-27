import { CloudSun, House, Map, SquarePen, Sparkles, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", short: "Home", icon: House },
  { href: "/map", label: "Live Map", short: "Map", icon: Map },
  { href: "/report", label: "Report", short: "Report", icon: SquarePen },
  { href: "/community", label: "Community", short: "Community", icon: Users },
  { href: "/weather", label: "Weather", short: "Weather", icon: CloudSun },
  { href: "/assistant", label: "AI Assistant", short: "Ask AI", icon: Sparkles },
];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/community" && pathname.startsWith("/reports")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}
