import { z } from "zod";
import { route } from "@/lib/server/http";
import { getWeather } from "@/lib/server/weather";

export const dynamic = "force-dynamic";

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  name: z.string().trim().max(80).default("Selected location"),
});

/**
 * GET /api/weather                      → Chitral Town
 * GET /api/weather?lat=..&lng=..&name=.. → any point (e.g. the user's current location)
 * Coordinates are rounded to ~1 km before calling the provider.
 */
export const GET = route(async (req) => {
  const q = new URL(req.url).searchParams;
  if (!q.has("lat")) return Response.json(await getWeather());
  const p = Query.parse(Object.fromEntries(q));
  return Response.json(await getWeather({ lat: +p.lat.toFixed(2), lng: +p.lng.toFixed(2), name: p.name }));
});
