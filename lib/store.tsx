"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildDemoWeather } from "@/data/weather";
import { createComment, createReport, getInitialAlerts, getInitialReports } from "@/services/reportService";
import { fetchWeather } from "@/services/apiClient";
import type {
  AIMode,
  ChatMessage,
  EnvironmentalAlert,
  HazardReport,
  NewReportInput,
  RiskAssessment,
  WeatherData,
} from "@/types";

interface RiskState {
  assessment: RiskAssessment;
  mode: AIMode;
  /** Number of reports when the assessment was made — used to refresh after new reports. */
  reportCount?: number;
}

interface HazardStore {
  reports: HazardReport[];
  alerts: EnvironmentalAlert[];
  weather: WeatherData;
  addReport: (input: NewReportInput) => HazardReport;
  toggleLike: (id: string) => void;
  addComment: (id: string, text: string) => void;
  getReport: (id: string) => HazardReport | undefined;
  /** Assistant conversation, kept across page navigation for the session. */
  chat: ChatMessage[];
  setChat: (update: (prev: ChatMessage[]) => ChatMessage[]) => void;
  aiMode: AIMode | null;
  setAiMode: (m: AIMode) => void;
  risk: RiskState | null;
  setRisk: (r: RiskState) => void;
}

const StoreContext = createContext<HazardStore | null>(null);

/**
 * Single shared source of truth for the session. A new report is added here
 * once and immediately shows up in the community feed, on the map and on the
 * dashboard, because all of them read from `reports`.
 */
export function HazardStoreProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<HazardReport[]>(getInitialReports);
  const [alerts] = useState<EnvironmentalAlert[]>(getInitialAlerts);
  const [weather, setWeather] = useState<WeatherData>(() => buildDemoWeather());
  const [chat, setChatState] = useState<ChatMessage[]>([]);
  const [aiMode, setAiMode] = useState<AIMode | null>(null);
  const [risk, setRisk] = useState<RiskState | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWeather()
      .then((w) => !cancelled && setWeather(w))
      .catch(() => {
        /* keep demo weather */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addReport = useCallback((input: NewReportInput) => {
    const report = createReport(input);
    setReports((prev) => [report, ...prev]);
    return report;
  }, []);

  const toggleLike = useCallback((id: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, likedByMe: !r.likedByMe, likes: r.likes + (r.likedByMe ? -1 : 1) } : r,
      ),
    );
  }, []);

  const addComment = useCallback((id: string, text: string) => {
    if (!text.trim()) return;
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, comments: [...r.comments, createComment(text)] } : r)));
  }, []);

  const getReport = useCallback((id: string) => reports.find((r) => r.id === id), [reports]);
  const setChat = useCallback((update: (prev: ChatMessage[]) => ChatMessage[]) => setChatState(update), []);

  const value = useMemo<HazardStore>(
    () => ({
      reports,
      alerts,
      weather,
      addReport,
      toggleLike,
      addComment,
      getReport,
      chat,
      setChat,
      aiMode,
      setAiMode,
      risk,
      setRisk,
    }),
    [reports, alerts, weather, addReport, toggleLike, addComment, getReport, chat, setChat, aiMode, risk],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useHazardStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useHazardStore must be used inside HazardStoreProvider");
  return ctx;
}

export function useActiveReports() {
  const { reports } = useHazardStore();
  return useMemo(() => reports.filter((r) => r.status !== "resolved"), [reports]);
}
