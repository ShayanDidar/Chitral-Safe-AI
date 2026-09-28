/** Data every page needs on first render (server-only). */
import { unstable_rethrow } from "next/navigation";
import { getCurrentUser } from "./auth";
import { listContacts } from "./contacts";
import { listPublic } from "./reports";
import { toCurrentUser } from "./users";
import type { CurrentUser, EmergencyContact, Report } from "@/types";

export async function loadInitialData(): Promise<{
  initialUser: CurrentUser | null;
  initialReports: Report[];
  initialContacts: EmergencyContact[];
  offline: boolean;
}> {
  try {
    const user = await getCurrentUser();
    const [reports, contacts] = await Promise.all([listPublic(user), listContacts()]);
    return { initialUser: user ? toCurrentUser(user) : null, initialReports: reports, initialContacts: contacts, offline: false };
  } catch (err) {
    unstable_rethrow(err); // let Next.js handle its own control-flow errors
    // Keep the site usable (weather, AI, static pages) if the database is unreachable.
    console.error("[bootstrap] database unavailable:", err);
    return { initialUser: null, initialReports: [], initialContacts: [], offline: true };
  }
}
