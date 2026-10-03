"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildDemoWeather } from "@/data/weather";
import { buildAlerts } from "@/lib/alerts";
import { DEFAULT_LOCATION, LOCATIONS } from "@/data/locations";
import * as api from "@/lib/api";
import type {
  AIMode,
  ChatMessage,
  CurrentUser,
  EmergencyContact,
  EnvironmentalAlert,
  HazardReport,
  Report,
  RiskAssessment,
  WeatherData,
} from "@/types";

interface RiskState {
  assessment: RiskAssessment;
  mode: AIMode;
  /** Number of reports when the assessment was made — used to refresh after new reports. */
  reportCount?: number;
  lang?: "en" | "ur";
}

export interface WeatherPlace {
  name: string;
  lat: number;
  lng: number;
  /** "preset" = a known Chitral location; "current" = from the device's location (never stored). */
  kind: "preset" | "current";
}

export type WeatherStatus = "loading" | "live" | "sample" | "unavailable";

interface AppStore {
  /** Approved, public reports (what the feed and public map show). */
  reports: Report[];
  refreshReports: () => Promise<void>;
  /** Replace/insert a report returned by the API (e.g. after a comment). */
  upsertReport: (r: Report) => void;
  removeReport: (id: string) => void;
  toggleLike: (id: string) => Promise<"ok" | "signin">;
  addComment: (id: string, text: string) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  getReport: (id: string) => Report | undefined;

  user: CurrentUser | null;
  setUser: (u: CurrentUser | null) => void;
  contacts: EmergencyContact[];
  setContacts: (c: EmergencyContact[]) => void;
  /** True when the server could not reach the database. */
  offline: boolean;

  alerts: EnvironmentalAlert[];
  weather: WeatherData;
  weatherStatus: WeatherStatus;
  weatherPlace: WeatherPlace;
  setWeatherPlace: (p: WeatherPlace) => void;
  refreshWeather: () => void;

  /** Assistant conversation, kept across page navigation for the session. */
  chat: ChatMessage[];
  setChat: (update: (prev: ChatMessage[]) => ChatMessage[]) => void;
  aiMode: AIMode | null;
  setAiMode: (m: AIMode) => void;
  risk: RiskState | null;
  setRisk: (r: RiskState) => void;
}

const StoreContext = createContext<AppStore | null>(null);

const statusOf = (w: WeatherData): WeatherStatus => (w.error ? "unavailable" : w.source === "demo" ? "sample" : "live");

/*
 * The app's shared state. Every page reads from here:
 *  - reports: approved public reports (refreshed from the server every 30 s)
 *  - user: who is signed in
 *  - contacts: emergency contacts
 *  - weather: live weather for the chosen place
 *  - chat / risk: the AI assistant's conversation and risk summary
 */

const PLACE_KEY = "chitral-safe-weather-place";
const REFRESH_MS = 30_000;
const DEFAULT_PLACE: WeatherPlace = {
  name: DEFAULT_LOCATION.name,
  lat: DEFAULT_LOCATION.coordinates.lat,
  lng: DEFAULT_LOCATION.coordinates.lng,
  kind: "preset",
};

export function AppStoreProvider({
  children,
  initialReports,
  initialUser,
  initialContacts,
  initialWeather,
  offline,
}: {
  children: ReactNode;
  initialReports: Report[];
  initialUser: CurrentUser | null;
  initialContacts: EmergencyContact[];
  initialWeather: WeatherData | null;
  offline: boolean;
}) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [user, setUserState] = useState<CurrentUser | null>(initialUser);
  const [contacts, setContacts] = useState<EmergencyContact[]>(initialContacts);
  // Real weather comes from the server with the page; sample data is only a placeholder.
  const [weather, setWeather] = useState<WeatherData>(() => initialWeather ?? buildDemoWeather());
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>(() =>
    initialWeather ? statusOf(initialWeather) : "loading",
  );
  const hasInitialWeather = useRef(!!initialWeather);
  // Alerts are worked out from the live weather and approved reports (see lib/alerts.ts).
  const alerts = useMemo<EnvironmentalAlert[]>(() => buildAlerts(weather, reports), [weather, reports]);
  const [weatherPlace, setWeatherPlaceState] = useState<WeatherPlace>(DEFAULT_PLACE);
  const [chat, setChatState] = useState<ChatMessage[]>([]);
  const [aiMode, setAiMode] = useState<AIMode | null>(null);
  const [risk, setRisk] = useState<RiskState | null>(null);
  /** Ids deleted in this tab — kept out even if a refresh races with the delete. */
  const deleted = useRef(new Set<string>());

  // ---- Reports: server is the source of truth; refresh in the background ----
  const refreshReports = useCallback(async () => {
    try {
      const fresh = await api.fetchPublicReports();
      setReports(fresh.filter((r) => !deleted.current.has(r.id)));
    } catch {
      /* keep what we have */
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void refreshReports();
    }, REFRESH_MS);
    const onFocus = () => void refreshReports();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshReports]);

  const setUser = useCallback(
    (u: CurrentUser | null) => {
      setUserState(u);
      // likedByMe / "mine" depend on who is signed in.
      void refreshReports();
    },
    [refreshReports],
  );

  const upsertReport = useCallback((r: Report) => {
    setReports((prev) => (prev.some((x) => x.id === r.id) ? prev.map((x) => (x.id === r.id ? r : x)) : [r, ...prev]));
  }, []);

  const removeReport = useCallback((id: string) => {
    deleted.current.add(id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleLike = useCallback(
    async (id: string) => {
      if (!user) return "signin" as const;
      const flip = (r: Report) => (r.id === id ? { ...r, likedByMe: !r.likedByMe, likes: r.likes + (r.likedByMe ? -1 : 1) } : r);
      setReports((prev) => prev.map(flip));
      try {
        await api.toggleLike(id);
      } catch {
        setReports((prev) => prev.map(flip)); // undo
      }
      return "ok" as const;
    },
    [user],
  );

  const addComment = useCallback(
    async (id: string, text: string) => {
      if (!text.trim()) return;
      upsertReport(await api.addComment(id, text));
    },
    [upsertReport],
  );

  const deleteReport = useCallback(
    async (id: string) => {
      await api.deleteReport(id);
      removeReport(id);
    },
    [removeReport],
  );

  const getReport = useCallback((id: string) => reports.find((r) => r.id === id), [reports]);

  // ---- Weather for the selected place ----
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PLACE_KEY) ?? "null") as { name?: string } | null;
      const loc = saved?.name ? LOCATIONS.find((l) => l.name === saved.name) : undefined;
      if (loc) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a saved preference after hydration
        setWeatherPlaceState({ name: loc.name, lat: loc.coordinates.lat, lng: loc.coordinates.lng, kind: "preset" });
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const [weatherTick, setWeatherTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const isDefault = weatherPlace.kind === "preset" && weatherPlace.name === DEFAULT_PLACE.name;
    // The server already sent the default place's weather with the page (only skip that first time).
    if (isDefault && weatherTick === 0 && hasInitialWeather.current) {
      hasInitialWeather.current = false;
      return;
    }
    api
      .fetchWeather(isDefault ? undefined : weatherPlace)
      .then((w) => {
        if (cancelled) return;
        setWeather(w);
        setWeatherStatus(statusOf(w));
      })
      .catch(() => !cancelled && setWeatherStatus("unavailable"));
    return () => {
      cancelled = true;
    };
  }, [weatherPlace, weatherTick]);

  const setWeatherPlace = useCallback((p: WeatherPlace) => {
    setWeatherStatus("loading");
    setWeatherPlaceState(p);
    try {
      // Only named presets are remembered — never the device's coordinates.
      if (p.kind === "preset") localStorage.setItem(PLACE_KEY, JSON.stringify({ name: p.name }));
    } catch {
      /* ignore */
    }
  }, []);
  const refreshWeather = useCallback(() => {
    setWeatherStatus("loading");
    setWeatherTick((n) => n + 1);
  }, []);

  const setChat = useCallback((update: (prev: ChatMessage[]) => ChatMessage[]) => setChatState(update), []);

  const value = useMemo<AppStore>(
    () => ({
      reports,
      refreshReports,
      upsertReport,
      removeReport,
      toggleLike,
      addComment,
      deleteReport,
      getReport,
      user,
      setUser,
      contacts,
      setContacts,
      offline,
      alerts,
      weather,
      weatherStatus,
      weatherPlace,
      setWeatherPlace,
      refreshWeather,
      chat,
      setChat,
      aiMode,
      setAiMode,
      risk,
      setRisk,
    }),
    [
      reports,
      refreshReports,
      upsertReport,
      removeReport,
      toggleLike,
      addComment,
      deleteReport,
      getReport,
      user,
      setUser,
      contacts,
      offline,
      alerts,
      weather,
      weatherStatus,
      weatherPlace,
      setWeatherPlace,
      refreshWeather,
      chat,
      setChat,
      aiMode,
      risk,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}

/** Public hazard reports that are still ongoing. */
export function useActiveReports() {
  const { reports } = useAppStore();
  return useMemo(
    () => reports.filter((r): r is HazardReport => r.kind === "hazard" && r.status !== "resolved"),
    [reports],
  );
}
