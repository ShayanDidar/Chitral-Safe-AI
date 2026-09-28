import {
  Banknote,
  CircleAlert,
  Eye,
  Hammer,
  HandMetal,
  House,
  Pill,
  ShieldAlert,
  ShoppingBag,
  UserX,
  type LucideIcon,
} from "lucide-react";
import type { CrimeCategory } from "@/types";

export const CRIME_CATEGORIES: CrimeCategory[] = [
  "theft",
  "robbery",
  "assault",
  "harassment",
  "domestic_violence",
  "fraud",
  "drugs",
  "vandalism",
  "suspicious",
  "other",
];

export const CRIME_ICONS: Record<CrimeCategory, LucideIcon> = {
  theft: ShoppingBag,
  robbery: ShieldAlert,
  assault: HandMetal,
  harassment: UserX,
  domestic_violence: House,
  fraud: Banknote,
  drugs: Pill,
  vandalism: Hammer,
  suspicious: Eye,
  other: CircleAlert,
};

/** Map colour for public safety (crime) reports — distinct from hazard severity colours. */
export const CRIME_HEX = "#4338ca";
