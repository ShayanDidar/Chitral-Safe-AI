import type { HazardType, ReportStatus, Severity } from "@/types";

/**
 * Demo community reports, inserted into the database as approved content
 * the first time it is set up (see lib/server/db/seed.ts).
 * Timestamps are "minutes before seeding".
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
  ur: { title: string; description: string; comments: string[] };
}

const SEED: SeedReport[] = [
  {
    id: "r-ayun-landslide",
    ur: {
      title: "ایون کے قریب لینڈ سلائیڈ سے سڑک کی ایک لین بند",
      description: "ایون کے قریب لینڈ سلائیڈ سے سڑک کا ایک حصہ بند ہو گیا ہے۔ گزشتہ رات کی بارش کے بعد ملبہ اب بھی کھسک رہا ہے۔ گاڑیاں ایک ایک کر کے گزر رہی ہیں — آہستہ چلائیں۔",
      comments: ["بیس منٹ پہلے یہاں سے گزرا۔ صرف چھوٹی گاڑیاں گزر رہی ہیں۔", "مقامی رضاکار نچلی طرف سے پتھر ہٹا رہے ہیں۔"],
    },
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
    ur: {
      title: "دروش کے قریب سڑک جزوی طور پر زیرِ آب",
      description: "دروش کے قریب سڑک جزوی طور پر زیرِ آب ہے۔ ساتھ والے نالے کا پانی سڑک پر بہہ رہا ہے۔ ٹریفک آہستہ چل رہی ہے۔",
      comments: ["کیا پل ٹرکوں کے لیے کھلا ہے؟", "جی ہاں، لیکن پل تک جانے والا راستہ تقریباً ایک فٹ پانی میں ہے۔"],
    },
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
    ur: {
      title: "چترال ٹاؤن میں شدید بارش",
      description: "علاقے میں شدید بارش شروع ہو گئی ہے۔ حدِ نگاہ کم ہو رہی ہے اور مین بازار کے قریب نالیاں ابل رہی ہیں۔",
      comments: ["دنین میں بھی یہی حال ہے۔ پچھلے آدھے گھنٹے سے بہت تیز بارش۔", "شاہی مسجد کے قریب دریا کنارے والی سڑک سے گریز کریں۔", "سنگور کے کچھ حصوں میں بجلی بند ہے۔", "بارش اب کچھ کم ہو رہی ہے۔"],
    },
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
    ur: {
      title: "ریشن میں گلیشیئر سے آنے والے نالے میں تیزی سے اضافہ",
      description: "ریشن نالے کا پانی گدلا اور سیاہی مائل ہو گیا ہے اور تیزی سے بڑھ رہا ہے۔ بزرگوں کے مطابق یہ 2015 کے سیلاب جیسا لگ رہا ہے۔ نالے کے قریب رہنے والے خاندان احتیاطاً اونچی جگہ منتقل ہو رہے ہیں۔",
      comments: ["براہ کرم بتائیں کہ بونی جانے والی مین سڑک متاثر ہے یا نہیں۔", "سڑک ابھی کھلی ہے لیکن پانی پلیا کے قریب پہنچ گیا ہے۔", "ویلج کمیٹی نے لوگوں کو نالے سے دور رہنے کی ہدایت کی ہے۔"],
    },
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
    ur: {
      title: "بونی–مستوج روڈ پر بڑے پتھر",
      description: "ڈھلوان گرنے کے بعد بونی–مستوج روڈ پر کئی بڑے پتھر آ گئے ہیں۔ سڑک گاڑیوں کے لیے بند ہے۔ لوڈر منگوایا گیا ہے۔",
      comments: ["سڑک کب تک کھلنے کا امکان ہے؟"],
    },
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
    ur: {
      title: "گرم چشمہ روڈ پر پتھر گر رہے ہیں",
      description: "گرم چشمہ سے تقریباً 3 کلومیٹر پہلے سڑک پر چھوٹے پتھر گر رہے ہیں۔ سڑک کھلی ہے لیکن جلدی گزریں اور چٹان کے نیچے مت رکیں۔",
      comments: ["شکریہ — آج دوپہر سفر کا ارادہ تھا۔"],
    },
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
    ur: {
      title: "بونی میں مسلسل بارش",
      description: "بونی میں صبح سویرے سے مسلسل بارش ہو رہی ہے۔ چھوٹے نالوں میں پانی معمول سے زیادہ ہے۔ ابھی تک کوئی نقصان نہیں ہوا لیکن لوگ نالوں پر نظر رکھے ہوئے ہیں۔",
      comments: [],
    },
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
    ur: {
      title: "لواری ٹاپ کے قریب قبل از وقت برف باری",
      description: "لواری کی بالائی سڑک پر ہلکی برف باری ہوئی ہے۔ ٹنل کا راستہ کھلا ہے، لیکن پرانی پاس روڈ پر پھسلن ہے۔ گرم کپڑے ساتھ رکھیں۔",
      comments: ["آج صبح ٹنل میں ٹریفک معمول کے مطابق تھی۔"],
    },
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
    ur: {
      title: "بمبوریت میں نالے کی سطح میں معمولی اضافہ",
      description: "بارش کے بعد بمبوریت نالے میں پانی معمول سے کچھ زیادہ ہے۔ پیدل پل ٹھیک ہیں۔ سیاح آج رات پانی کے قریب کیمپ نہ لگائیں۔",
      comments: [],
    },
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
    ur: {
      title: "چترال ٹاؤن کے قریب معمولی ملبہ صاف کر دیا گیا",
      description: "چترال ٹاؤن کے اوپر لنک روڈ پر لینڈ سلائیڈ کا معمولی ملبہ صاف کر دیا گیا ہے۔ سڑک مکمل طور پر دوبارہ کھل گئی ہے۔",
      comments: ["ٹی ایم اے ٹیم کا فوری کام کرنے پر شکریہ۔"],
    },
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
    ur: {
      title: "دروش کے جنوب میں سڑک بہہ گئی",
      description: "دروش کے جنوب میں سڑک کا ایک حصہ چڑھے ہوئے دریا میں بہہ گیا ہے۔ لواری کی طرف ٹریفک روک دی گئی ہے۔ براہ کرم پار کرنے کی کوشش نہ کریں۔",
      comments: ["دروش کی طرف پولیس نے رکاوٹ لگا دی ہے۔", "پشاور سے آنے والی بسیں لواری پر انتظار کر رہی ہیں۔"],
    },
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

export const SEED_REPORTS = SEED;
