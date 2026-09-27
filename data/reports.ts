import type { HazardReport, HazardType, ReportStatus, Severity } from "@/types";
import { LOCATIONS } from "./locations";

/**
 * Seed community reports. Timestamps are stored as "minutes ago" and resolved
 * at load time so the demo always looks current.
 */
interface SeedReport {
  id: string;
  type: HazardType;
  severity: Severity;
  status: ReportStatus;
  title: string;
  description: string;
  locationId: string;
  offset: [number, number]; // small lat/lng offset from the location centre
  image: string;
  author: string;
  minutesAgo: number;
  likes: number;
  comments: { author: string; text: string; minutesAgo: number }[];
}

const SEED: SeedReport[] = [
  {
    id: "r-ayun-landslide",
    type: "landslide",
    severity: "high",
    status: "active",
    title: "Landslide blocking one lane near Ayun",
    description:
      "A landslide has blocked one side of the road near Ayun. Loose debris is still sliding after last night's rain. Vehicles are passing one at a time — drive slowly.",
    locationId: "ayun",
    offset: [0.012, 0.006],
    image: "/demo/landslide-1.svg",
    author: "Muhammad Rahim",
    minutesAgo: 34,
    likes: 21,
    comments: [
      { author: "Sana Gul", text: "Passed here 20 minutes ago. Only small cars getting through.", minutesAgo: 22 },
      { author: "Imran Shah", text: "Local volunteers are clearing rocks from the lower side.", minutesAgo: 12 },
    ],
  },
  {
    id: "r-drosh-flood",
    type: "flood",
    severity: "high",
    status: "active",
    title: "Road partially flooded near Drosh",
    description:
      "Road is partially flooded near Drosh. Water from the side nullah is running across the road. Traffic is moving slowly.",
    locationId: "drosh",
    offset: [0.006, -0.004],
    image: "/demo/flood-1.svg",
    author: "Nusrat Bibi",
    minutesAgo: 58,
    likes: 14,
    comments: [
      { author: "Farhan Ahmad", text: "Is the bridge still open for trucks?", minutesAgo: 41 },
      { author: "Nusrat Bibi", text: "Yes, but the approach is under about a foot of water.", minutesAgo: 37 },
    ],
  },
  {
    id: "r-town-rain",
    type: "heavy_rain",
    severity: "medium",
    status: "active",
    title: "Heavy rainfall in Chitral Town",
    description:
      "Heavy rain has started in the area. Visibility is getting lower and drains near the main bazaar are overflowing.",
    locationId: "chitral-town",
    offset: [0.002, 0.003],
    image: "/demo/rain-1.svg",
    author: "Muhammad Ali",
    minutesAgo: 18,
    likes: 12,
    comments: [
      { author: "Zahid Ullah", text: "Same in Danin. Very heavy for the last half hour.", minutesAgo: 10 },
      { author: "Ayesha Khan", text: "Please avoid the river side road near Shahi Masjid.", minutesAgo: 6 },
      { author: "Rahmat Wali", text: "Power is out in some parts of Singoor.", minutesAgo: 4 },
      { author: "Muhammad Ali", text: "Rain easing a little now.", minutesAgo: 2 },
    ],
  },
  {
    id: "r-reshun-glacier",
    type: "glacier",
    severity: "critical",
    status: "active",
    title: "Rapid rise in glacier-fed stream at Reshun",
    description:
      "Water in the Reshun nullah has turned dark and muddy and is rising quickly. Elders say it looks like the 2015 surge. Families near the stream are moving to higher ground as a precaution.",
    locationId: "reshun",
    offset: [0.004, 0.008],
    image: "/demo/glacier-1.svg",
    author: "Sher Afzal",
    minutesAgo: 47,
    likes: 38,
    comments: [
      { author: "Nazia Bibi", text: "Please share if the main road towards Booni is affected.", minutesAgo: 30 },
      { author: "Sher Afzal", text: "Road is still open but water is close to the culvert.", minutesAgo: 25 },
      { author: "Wali Khan", text: "Village committee has asked people to stay away from the stream bed.", minutesAgo: 15 },
    ],
  },
  {
    id: "r-mastuj-road",
    type: "road_blockage",
    severity: "high",
    status: "active",
    title: "Boulders on Booni–Mastuj road",
    description:
      "Several large boulders are on the Booni–Mastuj road after a slope failure. The road is closed to vehicles. A loader has been requested.",
    locationId: "mastuj",
    offset: [-0.018, -0.03],
    image: "/demo/road-1.svg",
    author: "Rahmat Karim",
    minutesAgo: 95,
    likes: 17,
    comments: [
      { author: "Imran Shah", text: "Any estimate on when it will reopen?", minutesAgo: 70 },
    ],
  },
  {
    id: "r-gc-rockfall",
    type: "rockfall",
    severity: "medium",
    status: "active",
    title: "Rockfall on Garam Chashma road",
    description:
      "Fresh small rocks falling on the road about 3 km before Garam Chashma. Road is open but pass quickly and do not stop under the cliff.",
    locationId: "garam-chashma",
    offset: [-0.03, 0.05],
    image: "/demo/rockfall-1.svg",
    author: "Zahid Ullah",
    minutesAgo: 140,
    likes: 9,
    comments: [
      { author: "Sana Gul", text: "Thanks — was planning to travel this afternoon.", minutesAgo: 120 },
    ],
  },
  {
    id: "r-booni-rain",
    type: "heavy_rain",
    severity: "medium",
    status: "active",
    title: "Continuous rain in Booni",
    description:
      "Steady rain since early morning in Booni. Small streams are higher than usual. No damage yet but people are keeping an eye on the nullahs.",
    locationId: "booni",
    offset: [0.004, -0.006],
    image: "/demo/rain-2.svg",
    author: "Ayesha Khan",
    minutesAgo: 72,
    likes: 8,
    comments: [],
  },
  {
    id: "r-lowari-snow",
    type: "snowfall",
    severity: "medium",
    status: "monitoring",
    title: "Early snowfall near Lowari Top",
    description:
      "Light snow on the upper Lowari road. The tunnel route is open, but the old pass road is slippery. Carry warm clothing.",
    locationId: "lowari",
    offset: [0.006, 0.004],
    image: "/demo/snow-1.svg",
    author: "Farhan Ahmad",
    minutesAgo: 210,
    likes: 6,
    comments: [
      { author: "Muhammad Rahim", text: "Tunnel traffic was normal this morning.", minutesAgo: 180 },
    ],
  },
  {
    id: "r-bumburet-flood",
    type: "flood",
    severity: "low",
    status: "monitoring",
    title: "Stream level slightly elevated in Bumburet",
    description:
      "The Bumburet stream is a little higher than normal after rain. Footbridges are fine. Visitors should avoid camping close to the water tonight.",
    locationId: "bumburet",
    offset: [0.002, 0.01],
    image: "/demo/flood-2.svg",
    author: "Wali Khan",
    minutesAgo: 185,
    likes: 5,
    comments: [],
  },
  {
    id: "r-town-landslide",
    type: "landslide",
    severity: "low",
    status: "resolved",
    title: "Small debris cleared near Chitral Town",
    description:
      "Minor landslide debris on the link road above Chitral Town has been cleared. Road is fully open again.",
    locationId: "chitral-town",
    offset: [0.022, -0.015],
    image: "/demo/landslide-2.svg",
    author: "Imran Shah",
    minutesAgo: 320,
    likes: 11,
    comments: [
      { author: "Ayesha Khan", text: "Thank you to the TMA team for the quick work.", minutesAgo: 300 },
    ],
  },
  {
    id: "r-drosh-road",
    type: "road_blockage",
    severity: "critical",
    status: "active",
    title: "Road washed out south of Drosh",
    description:
      "A section of the road south of Drosh has been washed away by the swollen river. Traffic towards Lowari is stopped. Please do not attempt to cross.",
    locationId: "drosh",
    offset: [-0.035, 0.012],
    image: "/demo/road-2.svg",
    author: "Rahmat Wali",
    minutesAgo: 26,
    likes: 29,
    comments: [
      { author: "Nusrat Bibi", text: "Police have put up a barrier on the Drosh side.", minutesAgo: 16 },
      { author: "Farhan Ahmad", text: "Buses from Peshawar are waiting at Lowari.", minutesAgo: 9 },
    ],
  },
];

function minutesAgoIso(now: number, minutes: number) {
  return new Date(now - minutes * 60_000).toISOString();
}

export function buildSeedReports(now = Date.now()): HazardReport[] {
  return SEED.map((s) => {
    const loc = LOCATIONS.find((l) => l.id === s.locationId) ?? LOCATIONS[0];
    return {
      id: s.id,
      type: s.type,
      severity: s.severity,
      status: s.status,
      title: s.title,
      description: s.description,
      locationName: loc.name,
      area: loc.area,
      coordinates: {
        lat: +(loc.coordinates.lat + s.offset[0]).toFixed(5),
        lng: +(loc.coordinates.lng + s.offset[1]).toFixed(5),
      },
      imageUrl: s.image,
      author: s.author,
      reportedAt: minutesAgoIso(now, s.minutesAgo),
      likes: s.likes,
      likedByMe: false,
      comments: s.comments.map((c, i) => ({
        id: `${s.id}-c${i}`,
        author: c.author,
        text: c.text,
        createdAt: minutesAgoIso(now, c.minutesAgo),
      })),
      source: "community" as const,
    };
  }).sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
}
