# Chitral Safe

Community-powered environmental hazard awareness for Chitral, Pakistan. People can see current conditions, view hazards on a live map, report a hazard with a photo, follow a community feed, and ask an AI assistant about weather, hazards and safety.

There's no login. The app opens straight onto the dashboard.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start   # production build
```

The app works with **no environment variables at all**. It falls back to demo weather and demo AI responses.

## Environment variables

Copy `.env.example` to `.env.local`. Every variable is optional.

| Variable | Purpose |
|---|---|
| `AI_API_KEY` | Enables the live AI. Without it, context-aware demo responses are used. Server-side only. |
| `AI_PROVIDER` | `anthropic` or `openai` (any OpenAI-compatible API). Auto-detected from the key if empty. |
| `AI_MODEL` | Model name. Defaults to `claude-sonnet-5` (Anthropic) or `gpt-4o-mini` (OpenAI). |
| `AI_BASE_URL` | Base URL for OpenAI-compatible providers (Groq, OpenRouter, Gemini…). |
| `WEATHER_PROVIDER` | `demo` (default) or `open-meteo` for live weather (free, no key). |
| `NEXT_PUBLIC_MAP_TILE_URL` / `NEXT_PUBLIC_MAP_ATTRIBUTION` | Optional custom map tiles. |

## Where things live

```
app/                  pages (Home, map, report, community, weather, assistant, reports/[id])
app/api/ai/chat       AI chat endpoint (server)
app/api/ai/risk       AI risk-analysis endpoint (server)
app/api/weather       weather endpoint (server)
services/aiService.ts       AI provider calls + demo fallback   ← AI key is used here
services/weatherService.ts  weather providers                    ← connect a real weather API here
services/reportService.ts   report data layer                    ← swap for a database later
lib/ai/systemPrompt.ts      assistant instructions / knowledge base
lib/ai/context.ts           app data injected into every AI request
lib/ai/demo.ts              demo responses when no key is set
lib/mapConfig.ts            map centre, bounds and tile layers
lib/store.tsx               shared session state (reports, likes, comments, chat)
data/                       demo reports, alerts, weather, locations
components/                 UI components (map, hazards, community, weather, ai, …)
scripts/generate-demo-images.mjs   regenerates the illustrated demo photos in public/demo
```

## English and Urdu

Use the **اردو / English** button in the top bar to switch languages. Urdu switches the whole layout to right-to-left and uses the Noto Naskh Arabic font. The choice is remembered in the browser.

- UI text: `lib/i18n/dictionary.ts` (every English key must also have an Urdu entry; TypeScript enforces this).
- Hazard types, severities, place names and weather terms: `lib/i18n/terms.ts`.
- Demo reports, comments and alerts carry Urdu translations in `data/`. Reports that users submit are shown as they were written.
- The AI answers in the selected language. The live AI is told which language to use, and the demo answers exist in both.

## How data flows

A submitted report goes into the shared store (`lib/store.tsx`). The community feed, the map and the dashboard all read from that same list, so the report shows up in all three immediately. Data lasts for the browser session; a refresh resets it to the demo data. To persist it, replace the functions in `services/reportService.ts` with API or database calls.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, click **Add New → Project** and import the repo. The framework is detected as Next.js, so no settings are needed.
3. Optional: add `AI_API_KEY` (and the other variables above) under **Settings → Environment Variables**, then redeploy.

Or use the CLI: `npx vercel` (preview) and then `npx vercel --prod`.

## Notes

- Community reports and AI output are informational only, not official warnings. The UI says so, and the AI is instructed never to claim certainty.
- Map tiles are keyless: Esri World Topo, Street and Imagery, plus OpenTopoMap.
