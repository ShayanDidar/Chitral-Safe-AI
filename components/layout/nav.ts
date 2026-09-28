import { CloudSun, House, Map, SquarePen, Sparkles, Users, type LucideIcon } from "lucide-react";
import type { DictKey } from "@/lib/i18n/dictionary";

export interface NavItem {
  href: string;
  label: DictKey;
  short: DictKey;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "nav.home", short: "nav.home", icon: House },
  { href: "/map", label: "nav.map", short: "nav.mapShort", icon: Map },
  { href: "/report", label: "nav.report", short: "nav.report", icon: SquarePen },
  { href: "/community", label: "nav.community", short: "nav.community", icon: Users },
  { href: "/weather", label: "nav.weather", short: "nav.weather", icon: CloudSun },
  { href: "/assistant", label: "nav.assistant", short: "nav.assistantShort", icon: Sparkles },
];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/community" && pathname.startsWith("/reports")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}
