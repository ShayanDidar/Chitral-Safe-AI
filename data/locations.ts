import type { ChitralLocation } from "@/types";

/** Known places in the Chitral region used for reports, weather and map pins. */
export const LOCATIONS: ChitralLocation[] = [
  { id: "chitral-town", name: "Chitral Town", area: "Lower Chitral", coordinates: { lat: 35.8518, lng: 71.7864 }, elevationM: 1500 },
  { id: "ayun", name: "Ayun", area: "Lower Chitral", coordinates: { lat: 35.7295, lng: 71.7789 }, elevationM: 1400 },
  { id: "drosh", name: "Drosh", area: "Lower Chitral", coordinates: { lat: 35.5611, lng: 71.7955 }, elevationM: 1300 },
  { id: "booni", name: "Booni", area: "Upper Chitral", coordinates: { lat: 36.2683, lng: 72.2528 }, elevationM: 2050 },
  { id: "mastuj", name: "Mastuj", area: "Upper Chitral", coordinates: { lat: 36.2869, lng: 72.5164 }, elevationM: 2350 },
  { id: "garam-chashma", name: "Garam Chashma", area: "Lower Chitral", coordinates: { lat: 35.9930, lng: 71.5594 }, elevationM: 2230 },
  { id: "reshun", name: "Reshun", area: "Upper Chitral", coordinates: { lat: 36.1617, lng: 72.1242 }, elevationM: 1850 },
  { id: "bumburet", name: "Bumburet", area: "Lower Chitral", coordinates: { lat: 35.7358, lng: 71.6781 }, elevationM: 1950 },
  { id: "lowari", name: "Lowari Tunnel", area: "Lower Chitral", coordinates: { lat: 35.4169, lng: 71.7894 }, elevationM: 2400 },
  // Featured valleys and passes (approximate centre points).
  { id: "kalash", name: "Kalash Valleys", area: "Lower Chitral", coordinates: { lat: 35.7240, lng: 71.6900 }, elevationM: 2000 },
  { id: "shandur", name: "Shandur", area: "Upper Chitral", coordinates: { lat: 36.0725, lng: 72.5390 }, elevationM: 3700 },
  { id: "broghil", name: "Broghil", area: "Upper Chitral", coordinates: { lat: 36.8450, lng: 73.3700 }, elevationM: 3300 },
  { id: "tirich", name: "Tirich", area: "Upper Chitral", coordinates: { lat: 36.3150, lng: 71.9400 }, elevationM: 2800 },
  { id: "torkhow", name: "Torkhow", area: "Upper Chitral", coordinates: { lat: 36.4546, lng: 72.4196 }, elevationM: 2370 },
  { id: "brep", name: "Brep", area: "Upper Chitral", coordinates: { lat: 36.4760, lng: 72.7100 }, elevationM: 2600 },
];

/** Places highlighted on the map, home page, weather and report form. */
const FEATURED_PLACES: { id: string; note: string; noteUr: string }[] = [
  { id: "kalash", note: "Bumburet, Rumbur and Birir, home of the Kalash people.", noteUr: "بمبوریت، رمبور اور بریر، کالاش لوگوں کا گھر۔" },
  { id: "lowari", note: "Main road link to Dir and down-country.", noteUr: "دیر اور ملک کے باقی حصوں سے مرکزی سڑک۔" },
  { id: "shandur", note: "High pass at about 3,700 m, home of the Shandur polo festival.", noteUr: "تقریباً 3,700 میٹر بلند درہ، شندور پولو میلے کی جگہ۔" },
  { id: "broghil", note: "Remote high valley in the far north, near the Wakhan corridor.", noteUr: "انتہائی شمال میں واخان کے قریب دور دراز بلند وادی۔" },
  { id: "tirich", note: "Valley below Tirich Mir, the highest peak of the Hindu Kush.", noteUr: "ہندوکش کی بلند ترین چوٹی ترچ میر کے دامن میں وادی۔" },
  { id: "torkhow", note: "Upper Chitral valley north of Booni.", noteUr: "بونی کے شمال میں اپر چترال کی وادی۔" },
];

/** Main towns, shown and labelled alongside the featured places. */
const TOWN_PLACES: { id: string; note: string; noteUr: string }[] = [
  { id: "chitral-town", note: "District headquarters on the Chitral River.", noteUr: "دریائے چترال کے کنارے ضلعی ہیڈکوارٹر۔" },
  { id: "ayun", note: "Gateway to the Kalash Valleys, south of Chitral Town.", noteUr: "کالاش وادیوں کا دروازہ، چترال ٹاؤن کے جنوب میں۔" },
  { id: "drosh", note: "Main town of Lower Chitral on the road to Lowari.", noteUr: "لواری جانے والی سڑک پر لوئر چترال کا بڑا قصبہ۔" },
  { id: "garam-chashma", note: "Valley known for its hot springs, west of Chitral Town.", noteUr: "گرم پانی کے چشموں کے لیے مشہور وادی، چترال ٹاؤن کے مغرب میں۔" },
  { id: "booni", note: "Headquarters of Upper Chitral.", noteUr: "اپر چترال کا ہیڈکوارٹر۔" },
  { id: "mastuj", note: "Historic town on the road to Shandur and Gilgit.", noteUr: "شندور اور گلگت جانے والی سڑک پر تاریخی قصبہ۔" },
  { id: "brep", note: "Village in the Yarkhun valley, beyond Mastuj.", noteUr: "مستوج سے آگے یارخون وادی کا گاؤں۔" },
];

type PlaceEntry = { id: string; note: string; noteUr: string; kind: "town" | "featured"; loc: ChitralLocation };
const withLoc = (list: { id: string; note: string; noteUr: string }[], kind: PlaceEntry["kind"]): PlaceEntry[] =>
  list.map((f) => ({ ...f, kind, loc: LOCATIONS.find((l) => l.id === f.id)! }));

export const featuredLocations = () => withLoc(FEATURED_PLACES, "featured");
export const townLocations = () => withLoc(TOWN_PLACES, "town");
/** Towns first, then featured valleys and passes. */
export const mapPlaces = () => [...townLocations(), ...featuredLocations()];

/** Primary towns plus featured places, without duplicates (for pickers). */
export const PICKER_LOCATION_IDS = ["chitral-town", "ayun", "drosh", "booni", "mastuj", "garam-chashma", "brep", ...FEATURED_PLACES.map((f) => f.id)];


export const DEFAULT_LOCATION = LOCATIONS[0];

export function findLocationByName(name: string): ChitralLocation | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  return (
    LOCATIONS.find((l) => l.name.toLowerCase() === needle) ??
    LOCATIONS.find((l) => needle.includes(l.name.toLowerCase()) || l.name.toLowerCase().includes(needle))
  );
}

export function nearestLocation(point: { lat: number; lng: number }): ChitralLocation {
  let best = LOCATIONS[0];
  let bestDist = Infinity;
  for (const loc of LOCATIONS) {
    const d = (loc.coordinates.lat - point.lat) ** 2 + (loc.coordinates.lng - point.lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = loc;
    }
  }
  return best;
}
