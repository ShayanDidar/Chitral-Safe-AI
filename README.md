# Chitral Safe

Community-powered environmental and public-safety awareness for Chitral, Pakistan. People can see live weather, view hazards on a map, report hazards or crimes with photos, follow a moderated community feed, and ask an AI assistant about conditions and safety. The interface is available in English and Urdu.

Browsing needs no account. Submitting, commenting and liking need a free account, so people can track and delete their own reports.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

With no configuration, the app uses an embedded Postgres database (PGlite, stored in `.data/pglite`). The database is created and filled with demo reports on first use.

### Create an admin

For demos, the sign-in page has **Admin** and **User** demo buttons (no password; admin@chitralsafe.test and user@chitralsafe.test). They are on by default. **Anyone who opens the site can use them**, so set `DEMO_LOGIN=false` before handling real reports.

For real admins, pick one:

- Set `ADMIN_EMAILS=you@example.com` in `.env.local`, then sign up or sign in with that email.
- Sign up normally, then run `npm run admin:grant -- you@example.com`.

## Environment variables

See `.env.example`.

| Variable | Needed | Purpose |
|---|---|---|
| `DATABASE_URL` | **Yes on Vercel** | Postgres connection string (Neon, Supabase, Vercel Postgres…). Leave empty locally to use the embedded database. |
| `ADMIN_EMAILS` | Recommended | Comma-separated emails that become admins. |
| `DEMO_LOGIN` | No | Set to `false` to remove the one-click demo accounts. |
| `SEED_DEMO_DATA` | No | Set to `false` to start with an empty database. |
| `AI_API_KEY` | No | Enables the live AI. Anthropic, Google Gemini and OpenAI-compatible keys are detected automatically. Without it, demo answers are used. |
| `AI_PROVIDER`, `AI_MODEL`, `AI_BASE_URL` | No | Override AI provider details. |
| `WEATHER_PROVIDER` | No | `open-meteo` (default, live, no key) or `demo` (offline sample data). |
| `NEXT_PUBLIC_MAP_TILE_URL` / `_ATTRIBUTION` | No | Custom map tiles. |

All secrets are read on the server only.

## Deploy to Vercel

1. Create a Postgres database. In Vercel: **Storage → Create → Neon** (free tier). This adds `DATABASE_URL` to the project automatically. Any Postgres provider works.
2. Add `ADMIN_EMAILS` (your email) and, optionally, `AI_API_KEY` under **Settings → Environment Variables**.
3. Deploy. `npm run build` runs the database migrations and seeds demo content before building.
4. Sign up with the admin email and open **Admin portal** from the account menu.

Without `DATABASE_URL`, the deployed site still loads (weather, AI and map tiles work), but it shows a banner saying reports are unavailable.

## How submissions work

```
User submits → Pending review → Admin approves or rejects (optional reason)
            → Approved + public → shown in the community feed and on the map
```

- **Every** new hazard or crime report starts as *pending*. It never appears publicly until an admin approves it.
- The feed and map refresh every 30 seconds and whenever the tab regains focus, so approved reports appear without a reload. Deleted reports disappear immediately.
- Submitters see their reports' status (and any rejection reason) under **Account → My submissions**. They can delete their own reports there, and admins can delete any report. Deletion asks for confirmation, and the server checks ownership.

### Crime reports: visibility and identity are separate settings

| | Named | Anonymous |
|---|---|---|
| **Public** | Shown after approval with the reporter's name | Shown after approval without any name or photo |
| **Confidential** | Only admins and the reporter can see it. Admins can see contact details to follow up. | Only admins and the reporter can see it. The identity is hidden from admins too. |

- Approval never changes visibility: a confidential report stays confidential.
- Public crime reports only show an **approximate location** (about a 1 km grid) and the nearest locality name, never the typed address.
- Photos are re-encoded on the server, which removes all metadata (including GPS). Report photos are served through an access-checked route, so confidential photos are never publicly reachable.
- **Anonymity limits (explained in the form):** an anonymous report is still linked to the account in the database so the reporter can track and delete it, and anyone with direct database access could see that link. The report's text, photos and location could also identify someone. IP addresses are not stored with reports.

### Emergency contacts

Admins manage emergency contacts (phone, SMS, email) in **Admin portal → Emergency contacts**. They appear in the sidebar and on `/emergency` as `tel:`, `sms:` and `mailto:` links. Only Rescue 1122 and Police 15 are seeded; add other numbers only after verifying them. The app states clearly that submitting a report does not contact emergency services.

## Where things live

```
app/api/auth/*            sign up, sign in, sign out, current user
app/api/reports/*         public list, submit, view, delete, like, comment
app/api/me/reports        the user's own submissions
app/api/admin/*           review queue, approve/reject, emergency contacts (admin only)
app/api/profile/*         profile details and photo
app/api/images/[id]       images, with the same access rules as their report
app/api/weather           live weather for a place or coordinates
lib/server/db/schema.ts   database tables (Drizzle ORM)
drizzle/                  SQL migrations (npm run db:generate after schema changes)
lib/server/reports.ts     report queries + the single place where visibility rules apply
lib/server/auth.ts        password hashing, sessions, role checks
lib/server/images.ts      image validation and metadata stripping
services/weatherService.ts  weather provider (Open-Meteo)
services/aiService.ts     AI provider calls + demo fallback
lib/i18n/                 English/Urdu text
```

## Security notes

- Passwords are hashed with scrypt. Sessions are random tokens in an httpOnly cookie, and only a hash is stored.
- Admin checks happen on the server for every admin route; the UI only hides buttons.
- State-changing requests from other websites are rejected (Origin check, SameSite cookies).
- Sign-in, sign-up and submissions are rate-limited per server instance.
