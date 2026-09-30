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

### 6.6 How new reports reach the map

- The map and feed only show reports that are **approved and public**.
- Open pages quietly check for updates every 30 seconds, and again when you return to the tab. A newly approved report appears **without reloading the page**.
- When something is deleted, it disappears straight away.

### 6.7 Weather

- Real weather comes from **Open-Meteo**, a free service that needs **no API key and no sign-up**.
- You can choose a town, a featured place, or "My location" (the browser asks your permission first).
- Your location is rounded to about 1 km and **never saved**.
- The page shows when the weather was last observed.
- If Open-Meteo can't be reached, the site shows sample weather and clearly labels it as sample data.
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

```
app/                    The pages (each folder is a web address)
app/api/                The server endpoints that the pages talk to
  auth/                 sign up, sign in, sign out, demo sign-in
  reports/              list, submit, view, delete, like, comment
  admin/                review queue, approve/reject, emergency contacts
  profile/              edit profile and photo
  images/               serves photos, checking who is allowed to see them
  weather/              real weather for a place or a location
  ai/                   AI chat and risk analysis
components/             Reusable pieces of the screens (map, cards, forms, …)
lib/server/             Server-only code
  db/schema.ts          The database tables
  auth.ts               Passwords, sessions, admin checks
  reports.ts            The single place that decides who can see what
  images.ts             Photo checking and metadata removal
lib/i18n/               English and Urdu text
data/                   Demo reports, places, alerts and sample weather
drizzle/                Database set-up files (migrations)
services/               Weather and AI connections, and the browser's API calls
scripts/                Database set-up and "make this user an admin"
```

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
