import { getWeather } from "@/services/weatherService";

export const dynamic = "force-dynamic";

export async function GET() {
  const weather = await getWeather();
  return Response.json(weather);
}
