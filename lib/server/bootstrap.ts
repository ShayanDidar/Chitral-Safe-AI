/** Data every page needs on first render (server-only). */
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { getCurrentUser } from "./auth";
import { listContacts } from "./contacts";
import { listPublic } from "./reports";
import { toCurrentUser } from "./users";
import { getWeather } from "./weather";
import type { CurrentUser, EmergencyContact, Report, WeatherData } from "@/types";

/** Real weather for the first render, so visitors never see sample values flash up. */
async function initialWeather(): Promise<WeatherData | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
  return Promise.race([getWeather().catch(() => null), timeout]);
}

export async function loadInitialData(): Promise<{
  initialUser: CurrentUser | null;
  initialReports: Report[];
  initialContacts: EmergencyContact[];
  initialWeather: WeatherData | null;
  offline: boolean;
}> {
  // Reading cookies first marks every page as "rendered per request", so the
  // build never calls the weather service (which would use up its free quota).
  await cookies();
  const weather = await initialWeather();
  try {
    const user = await getCurrentUser();
    const [reports, contacts] = await Promise.all([listPublic(user), listContacts()]);
    return {
      initialUser: user ? toCurrentUser(user) : null,
      initialReports: reports,
      initialContacts: contacts,
      initialWeather: weather,
      offline: false,
    };
  } catch (err) {
    unstable_rethrow(err); // let Next.js handle its own control-flow errors
    // Keep the site usable (weather, AI, static pages) if the database is unreachable.
    console.error("[bootstrap] database unavailable:", err);
    return { initialUser: null, initialReports: [], initialContacts: [], initialWeather: weather, offline: true };
  }
}
