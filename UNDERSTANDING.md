# Understanding Chitral Safe

This document explains, in simple English, what Chitral Safe is, how it was built, and how each part works. You don't need to be a programmer to follow most of it. The last sections go a little deeper for anyone who wants to change the code.

---

## 1. What is Chitral Safe?

Chitral Safe is a website that helps people in Chitral (Khyber Pakhtunkhwa, Pakistan) stay safe from natural hazards and crime.

People can:

- **See what is happening now**: weather, active hazards, and warnings, all on one screen.
- **Look at a live map** of Chitral with hazard reports and important places.
- **Report a hazard** (flood, landslide, glacier danger, blocked road, heavy rain, rockfall, snowfall) with photos and a map pin.
- **Report a crime** publicly, privately (only admins see it), or anonymously.
- **Read the community feed**, like reports, and leave comments.
- **Check real weather** for any town, valley or pass, or for where they are standing.
- **Ask an AI assistant** questions like "Which roads are blocked?" or "What should I do in a flood?"
- **Find emergency numbers** (Rescue 1122, Police 15) and call them with one tap.

The whole site works in **English and Urdu**. In Urdu, the layout switches to right-to-left.

---

## 2. The big idea in one picture

```
   A person sees a hazard or a crime
                 │
                 ▼
   They submit a report (photo + map pin + description)
                 │
                 ▼
   The report is saved as "Pending review"
   (nobody else can see it yet)
                 │
                 ▼
   An admin checks it in the Admin portal
          │                         │
       Approve                    Reject (with a reason)
          │                         │
          ▼                         ▼
   Public reports appear       The reporter sees the reason
   on the map and in the       in "My submissions"
   community feed
```

Nothing goes public until an admin approves it. This stops fake or harmful posts from spreading.

---

## 3. The pages

| Page | Address | What it does |
|---|---|---|
| Home | `/` | Weather, number of active hazards, AI safety summary, map, alerts, featured places, recent reports |
| Live Map | `/map` | Full map with all approved reports, filters, and featured places |
| Report a hazard | `/report` | Form to report a natural hazard |
| Report a crime | `/report/crime` | Form to report a crime, with privacy options |
| Community | `/community` | Feed of approved reports with likes and comments |
| Report details | `/reports/…` | One report in full: photos, map, comments, safety advice |
| Weather | `/weather` | Current weather, 24-hour chart, 7-day forecast, conditions across Chitral |
| AI Assistant | `/assistant` | Chat with the AI and see a risk analysis |
| Emergency | `/emergency` | Emergency phone numbers, SMS and email contacts |
| Sign in / Sign up | `/login`, `/signup` | Accounts, plus "Admin" and "User" demo buttons |
| My account | `/account` | Edit your name, photo, bio and private contact details |
| My submissions | `/account/submissions` | See the status of your own reports and delete them |
| Admin portal | `/admin` | Review queue, admin map, emergency contact settings |

---

## 4. Places on the map

**Main towns** are shown with a dark square and a bold label: Chitral Town, Ayun, Drosh, Garam Chashma, Booni, Mastuj and Brep.

**Featured valleys and passes** are shown with a round dot:

- **Kalash Valleys**: Bumburet, Rumbur and Birir, home of the Kalash people.
- **Lowari Tunnel**: the main road link to Dir and down-country.
- **Shandur**: a high pass at about 3,700 m, home of the Shandur polo festival.
- **Broghil**: a remote high valley in the far north, near the Wakhan corridor.
- **Tirich**: the valley below Tirich Mir, the highest peak of the Hindu Kush.
- **Torkhow**: a valley in Upper Chitral, north of Booni.

All of them are labelled on the map and listed under "Places" on the Live Map, where clicking a name moves the map there. The home page has a "Places in Chitral" section that shows each place's current temperature, with links to its map view and weather. They can also be chosen on the weather page and in the report form.

The map positions are approximate centre points of each valley or pass.

---

## 5. How it was built (the tools)

Think of a website as a restaurant. There is the **dining room** (what visitors see), the **kitchen** (the server that does the work) and the **storeroom** (the database that keeps everything).

| Part | Tool used | In simple words |
|---|---|---|
| Framework | **Next.js 16** with **React 19** | The main building kit. It makes both the pages people see and the server behind them. |
| Language | **TypeScript** | JavaScript with extra checks that catch mistakes before the site runs. |
| Styling | **Tailwind CSS** | Ready-made style classes for colours, spacing and layout. |
| Map | **Leaflet** with free Esri and OpenTopoMap tiles | Draws the interactive map. No map key is needed. |
| Icons | **Lucide** | Simple line icons. |
| Database | **PostgreSQL** via **Drizzle ORM** | Stores users, reports, comments, photos and emergency contacts. |
| Local database | **PGlite** | A small Postgres that runs inside the project, so nothing needs installing on your computer. |
| Image processing | **sharp** | Checks uploaded photos, resizes them, and removes hidden location data. |
| Input checking | **Zod** | Makes sure form data is valid before it is saved. |
| Weather | **Open-Meteo** | Free real weather data. **No API key needed.** |
| AI | Google Gemini, Anthropic Claude, or any OpenAI-compatible service | Answers questions. Works without a key too, using built-in demo answers. |
| Hosting | **Vercel** + **GitHub** | GitHub stores the code; Vercel puts it online automatically. |

---

## 6. How each part works

### 6.1 Accounts and signing in

- Anyone can **browse** without an account.
- To **report, comment or like**, you need a free account (name, email, password).
- Passwords are never stored as they are typed. They are scrambled with a one-way method called **scrypt**, so even the database owner can't read them.
- When you sign in, the site gives your browser a secret "session cookie", like a wristband at an event. The cookie can't be read by other websites or by page scripts.
- **Demo buttons:** the sign-in page has **Admin** and **User** buttons that sign you in without a password. They are for exhibitions and testing. Anyone can use them, so turn them off before real use by setting `DEMO_LOGIN=false`.

### 6.2 Roles: user and admin

- **User**: can submit reports, comment, like, edit their profile, and delete their own reports.
- **Admin**: can do everything a user can, plus approve, reject and delete any report, see the admin map, and manage emergency contacts.
- The server checks the role on **every** admin action. Hiding a button is not enough on its own; even if someone forces their way to an admin address, the server refuses.

### 6.3 Submitting a report

1. The user picks the type (for example "Landslide"), places a **pin on the map** (or uses "Use my location" or a known place), adds up to 4 photos, and writes a description.
2. The pin is **required**. This fixed an old bug where reports without a real location never showed on the map.
3. Photos are made smaller in the browser first, so uploads are quick.
4. On the server, each photo is checked to be a real image, then re-saved. This **removes hidden data** such as GPS coordinates and phone model.
5. The report is saved with status **Pending review**.

### 6.4 Crime reports and privacy

A crime report has **two separate settings**:

- **Who can see it:**
  - *Public*: after approval it appears on the map and in the feed.
  - *Confidential*: only admins and the person who reported it can ever see it, even after approval.
- **Show your name?**
  - *Named*: your name and photo appear.
  - *Anonymous*: your name, photo and contact details are hidden from the public **and from admins**.

Extra protections:

- Public crime reports show only an **approximate area** (about 1 km), never the exact spot or typed address.
- Photos on confidential reports can only be opened by the reporter and admins.
- The form explains honestly what "anonymous" can't do: the report is still linked to the account in the database (so the person can track or delete it), and the words or photos themselves might reveal who someone is.
- The form clearly says that **submitting a report does not call the police**.

### 6.5 Admin review

- The **Review queue** shows pending reports first. Tabs show how many are pending, approved and rejected.
- An admin can **Approve**, **Reject** (with an optional reason the reporter will see), or **Delete**.
- Approving a confidential report keeps it confidential.
- The **Admin map** shows every report at its exact location: a dashed ring means pending, faded means rejected, and a lock means confidential.
- **Restore demo reports** (button in the review queue) brings back the 11 sample hazard reports if they were deleted or rejected. Useful before a demo. The app also adds any missing demo reports automatically when it starts.

### 6.6 How new reports reach the map

- The map and feed only show reports that are **approved and public**.
- Open pages quietly check for updates every 30 seconds, and again when you return to the tab. A newly approved report appears **without reloading the page**.
- When something is deleted, it disappears straight away.

### 6.7 Weather

- Real weather comes from **Open-Meteo**, a free service that needs **no API key and no sign-up**.
- You can choose a town, a featured place, or "My location" (the browser asks your permission first).
- Your location is rounded to about 1 km and **never saved**.
- The page shows when the weather was last updated.
- Forecast models are often several °C off in Chitral's deep valleys (on 1 Oct 2026 they said 22°C when it was really 28°C).
- So the app also reads the **real measurements** from the Pakistan Meteorological Department weather stations in **Chitral Town** and **Drosh**. They report every 3 hours, and OGIMET (ogimet.com) shares them free, with no API key (`lib/server/stations.ts`).
- For places within 30 km of a station (Chitral Town, Ayun, Kalash Valleys, Garam Chashma, Drosh, Lowari Tunnel) the app works out how far off the forecast was at the station and corrects it. The page says, for example, "Chitral Town weather station measured 28°C at 14:00".
- Places further away (Upper Chitral, Shandur, Broghil...) have no station, so they show the plain forecast, labelled "Forecast estimate".
- In the mountains temperature drops about 6°C for every 1,000 m. The app tells Open-Meteo the **real height of each town** (from `data/locations.ts`), so a pin that sits on a nearby slope does not give a too-cold reading.
- If the model says "snow" but the town is clearly above freezing (4°C or more), the app shows rain instead.
- A high chance of only a little rain shows a calm "some rain likely" note; the orange "heavy rain" warning appears only when 10 mm or more is expected.
- Weather is loaded on the server together with the page, so visitors see real values straight away.
- Open-Meteo is free but sometimes briefly busy. The app tries again, and if it still fails it keeps showing the **last real reading** (with its time). Only if there has never been a reading does it show sample weather, clearly labelled.
- Each reading is reused for 15 minutes, which keeps well within Open-Meteo's free limits.
- To use sample data on purpose (for example at an exhibition with no internet), set `WEATHER_PROVIDER=demo`.

### 6.8 The AI assistant

- The assistant receives the current app data with each question: weather, approved reports and alerts. So it can answer "What hazards are active right now?" using real information.
- It is told never to claim certainty, and to say "may indicate an increased risk" rather than "will happen".
- It answers in English or Urdu, following the language the user picked.
- **Without an API key** it still works, using built-in demo answers.
- **With a Google Gemini key** it tries `gemini-3.6-flash` first. If that model is busy, it automatically tries other Gemini models.
- The API key stays on the server and is never sent to the browser.

### 6.9 Emergency contacts

- Shown in the sidebar, in a red phone button on mobile, and on the `/emergency` page.
- Tapping a contact opens the phone's dialler (`tel:`), messages app (`sms:`) or email (`mailto:`).
- Only **Rescue 1122** and **Police 15** are pre-filled. Admins can add more (phone, SMS or email) in the Admin portal. No contact details were made up.

### 6.10 Profiles

- Users can change their name, bio and profile photo.
- Phone number and contact email are **private**: never shown publicly. Admins can see them only on reports submitted with a name, so they can follow up.
- Profile details are never shown on anonymous reports.

### 6.11 English and Urdu

- The **اردو / English** button in the top bar switches language, and the choice is remembered.
- Urdu uses the **Noto Naskh Arabic** font and a right-to-left layout.
- The map and charts stay left-to-right, because maps and timelines read that way.
- All UI text lives in one file, `lib/i18n/dictionary.ts`, with English and Urdu side by side.

---

## 7. Where things are in the code

The project follows one simple rule:

- **`app/`** only decides the **web addresses**. Each `page.tsx` is a few lines that show a screen from `components/`.
- **`components/`** is **what you see**, grouped by feature.
- **`lib/`** is **the logic** shared by the screens.
- **`lib/server/`** is code that **only runs on the server** (database, passwords, photos, weather, AI keys).

```
app/                        Web addresses
  page.tsx                  "/"          → components/home/HomeView
  map/page.tsx              "/map"       → components/map/LiveMapView
  report/page.tsx           "/report"    → components/reports/SubmissionForm (hazard)
  report/crime/page.tsx     "/report/crime" → SubmissionForm (crime)
  community/page.tsx        "/community" → components/community/CommunityView
  reports/[id]/page.tsx     one report   → components/reports/ReportDetailView
  weather/page.tsx          "/weather"   → components/weather/WeatherView
  assistant/page.tsx        "/assistant" → components/ai/AssistantView
  emergency/page.tsx        "/emergency" → components/emergency/EmergencyView
  login, signup, account, admin …
  api/                      Server endpoints the screens call (see below)

components/                 What you see, by feature
  home/                     Home dashboard and "Places in Chitral"
  map/                      Leaflet map, markers, legend, location picker
  reports/                  Report card, filters, form, detail page, delete button
  community/                Community feed and comments
  weather/                  Weather page, charts, place picker
  ai/                       AI chat and risk summary
  emergency/                Emergency contacts
  account/                  Profile and "My submissions"
  admin/                    Review queue, admin map, contact settings
  auth/                     Sign-in / sign-up form
  alerts/                   Alert cards
  layout/                   Sidebar, top bar, bottom navigation
  ui/                       Small shared pieces (buttons, cards, badges)

lib/                        Logic shared by the screens
  store.tsx                 Shared app state (reports, user, weather, chat)
  api.ts                    Every call from the browser to the server
  i18n/                     English and Urdu text
  ai/                       AI instructions, demo answers, data sent to the AI
  hazards.ts, crime.ts      Hazard types, severities, crime categories
  mapConfig.ts              Map centre and map styles
  compressImage.ts          Shrinks photos in the browser before upload

lib/server/                 Server only
  db/schema.ts              The database tables
  auth.ts                   Passwords, sessions, admin checks
  reports.ts                Who can see what (the privacy rules)
  images.ts                 Photo checking and location-data removal
  weather.ts                Real weather from Open-Meteo
  stations.ts               Real measurements from Chitral and Drosh weather stations
  ai.ts                     Talks to Gemini / Claude / OpenAI

data/                       Demo reports, places, alerts, sample weather
types/                      Shared TypeScript types
drizzle/                    Database set-up files (migrations)
scripts/                    Database set-up, make-admin, demo images
```

### The server endpoints (`app/api/`)

| Endpoint | What it does |
|---|---|
| `auth/*` | Sign up, sign in, sign out, demo sign-in, "who am I" |
| `reports` | List approved reports; submit a new one |
| `reports/[id]` | View or delete one report; `like` and `comments` inside |
| `me/reports` | Your own reports and their status |
| `admin/reports` | Review queue; approve or reject (admins only) |
| `admin/contacts` | Add, edit or remove emergency contacts (admins only) |
| `emergency-contacts` | The public list of emergency contacts |
| `profile` | Edit your profile and photo |
| `images/[id]` | Serves photos, checking who is allowed to see them |
| `weather` | Real weather for a place or a location |
| `ai/chat`, `ai/risk` | AI answers and risk analysis |

The most important file for privacy is **`lib/server/reports.ts`**. Every report that leaves the server passes through it, and it removes anything a person is not allowed to see.

---

## 8. Running it and putting it online

### On your own computer

```bash
npm install
npm run dev
```

Then open http://localhost:3000. The local database is created and filled with demo reports automatically.

### Online (Vercel)

1. The code is on GitHub. Vercel builds and publishes it automatically on every push.
2. In Vercel, add a free Postgres database: **Storage → Create Database → Neon**. This sets `DATABASE_URL` for you. **Reports, accounts and the admin portal need this.**
3. Optional settings (Vercel → Settings → Environment Variables):

| Setting | What it does |
|---|---|
| `DATABASE_URL` | The database (required online) |
| `AI_API_KEY` | Turns on the real AI (Gemini, Claude or OpenAI-compatible) |
| `ADMIN_EMAILS` | Emails that automatically become admins |
| `DEMO_LOGIN=false` | Removes the Admin/User demo buttons |
| `WEATHER_PROVIDER=demo` | Uses sample weather instead of real weather |

4. Redeploy after changing settings.

**No API key is needed for weather or maps.** Only the AI can use a key, and it is optional.

---

## 9. Safety and honesty rules the app follows

- It is an **information tool**, not an official warning service.
- Submitting a report does **not** contact emergency services, and the app says so clearly.
- Community reports are checked by admins but not independently verified.
- The AI never claims a disaster will certainly happen.
- Private and confidential information is never published automatically.

---

## 10. Known limits and next steps

- **Demo buttons** let anyone become admin. Turn them off (`DEMO_LOGIN=false`) before real use.
- There is no email verification or password reset yet.
- Rate limits (to slow down spam) are kept in each server's memory. A shared store would be better for heavy use.
- Featured place positions are approximate.
- The server does not yet detect personal details (names, addresses) in descriptions automatically; admins check these by hand before approving.
