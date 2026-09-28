"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  CrimeCategory,
  EnvironmentalAlert,
  Report,
  ReviewStatus,
  HazardType,
  ReportComment,
  ReportStatus,
  RiskLevel,
  Severity,
  WeatherIcon,
} from "@/types";
import { DICTIONARIES, type DictKey } from "./dictionary";
import {
  CRIME_TERMS,
  HAZARD_TERMS,
  REVIEW_TERMS,
  RISK_NAME_TERMS,
  RISK_TERMS,
  SEVERITY_TERMS,
  STATUS_TERMS,
  WEATHER_TERMS,
  isolateNumbers,
  placeName,
  timeAgoText,
  type Lang,
} from "./terms";

const STORAGE_KEY = "chitral-safe-lang";

type Vars = Record<string, string | number>;

interface I18n {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: DictKey, vars?: Vars) => string;
  hazard: (type: HazardType) => string;
  crime: (c: CrimeCategory) => string;
  review: (s: ReviewStatus) => string;
  /** Hazard type or crime category label for any report. */
  label: (r: Report) => string;
  /** Reporter name, or "Anonymous". */
  authorName: (r: Report) => string;
  severity: (s: Severity) => string;
  severityDesc: (s: Severity) => string;
  status: (s: ReportStatus) => string;
  riskLevel: (l: RiskLevel) => string;
  riskName: (name: string) => string;
  place: (name: string) => string;
  condition: (icon: WeatherIcon, english: string) => string;
  ago: (iso: string) => string;
  /** Display name; the default "You" author is localized. */
  person: (name: string) => string;
  /** Keeps numbers readable inside Urdu text coming from data or the AI. */
  bidi: (text: string) => string;
  locale: string;
  report: (r: Report) => { title: string; description: string };
  comment: (c: ReportComment) => string;
  alert: (a: EnvironmentalAlert) => { title: string; area: string; message: string; risks: string[]; source: string };
}

const Ctx = createContext<I18n | null>(null);

function format(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start in English so server and client render the same HTML, then
  // switch to the saved language after hydration.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a saved preference after hydration
      if (saved === "ur") setLangState("ur");
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18n>(() => {
    const ur = lang === "ur";
    const dict = DICTIONARIES[lang];
    return {
      lang,
      dir: ur ? "rtl" : "ltr",
      setLang,
      toggle: () => setLang(ur ? "en" : "ur"),
      t: (key, vars) => {
        const text = format(dict[key] ?? DICTIONARIES.en[key] ?? key, vars);
        return ur ? isolateNumbers(text) : text;
      },
      hazard: (type) => HAZARD_TERMS[type][lang],
      crime: (c) => CRIME_TERMS[c][lang],
      review: (s) => REVIEW_TERMS[s][lang],
      label: (r) => (r.kind === "crime" ? CRIME_TERMS[r.category][lang] : HAZARD_TERMS[r.type][lang]),
      authorName: (r) => (r.author ? r.author.name : ur ? "گمنام" : "Anonymous"),
      severity: (s) => SEVERITY_TERMS[s][lang],
      severityDesc: (s) => (ur ? SEVERITY_TERMS[s].descUr : SEVERITY_TERMS[s].descEn),
      status: (s) => STATUS_TERMS[s][lang],
      riskLevel: (l) => RISK_TERMS[l][lang],
      riskName: (name) => (ur ? (RISK_NAME_TERMS[name] ?? name) : name),
      place: (name) => placeName(name, lang),
      condition: (icon, english) => (ur ? WEATHER_TERMS[icon] : english),
      ago: (iso) => timeAgoText(iso, lang),
      bidi: (text) => (ur ? isolateNumbers(text) : text),
      person: (name) =>
        ur ? ({ You: "آپ", "Anonymous reporter": "گمنام رپورٹر", "Former user": "سابق صارف" }[name] ?? name) : name,
      locale: ur ? "ur-PK" : "en-GB",
      report: (r) =>
        ur && r.ur ? { title: r.ur.title, description: r.ur.description } : { title: r.title, description: r.description },
      comment: (c) => (ur && c.textUr ? c.textUr : c.text),
      alert: (a) =>
        ur && a.ur
          ? a.ur
          : { title: a.title, area: a.area, message: a.message, risks: a.risks, source: a.source },
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}
