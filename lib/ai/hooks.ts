"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildAIContext } from "@/lib/ai/context";
import { useAppStore } from "@/lib/store";
import { requestRiskAnalysis } from "@/lib/api";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { AIMode, RiskAssessment } from "@/types";

/** Returns a function that snapshots current app data for the AI. */
export function useAIContextBuilder() {
  const { reports, weather, alerts } = useAppStore();
  return useCallback(
    (selectedLocation: string | null = null) => buildAIContext({ reports, weather, alerts, selectedLocation }),
    [reports, weather, alerts],
  );
}

/** One shared request at a time per language, so several components don't duplicate calls. */
let inflight: { lang: string; promise: Promise<void> } | null = null;
let wantedLang = "en";

/**
 * Risk analysis for all of Chitral, cached in the store for the session.
 * Re-runs when the number of reports or the language changes.
 */
export function useChitralRisk(auto = true) {
  const { risk, setRisk, reports, setAiMode } = useAppStore();
  const build = useAIContextBuilder();
  const { lang } = useI18n();
  const count = reports.length;

  const run = useCallback(() => {
    wantedLang = lang;
    if (inflight && inflight.lang === lang) return inflight.promise;
    const promise = requestRiskAnalysis(build(null), null, lang)
      .then((res) => {
        // Ignore a response for a language the user has since switched away from.
        if (wantedLang !== lang) return;
        setRisk({ ...res, reportCount: count, lang });
        setAiMode(res.mode);
      })
      .catch(() => {
        /* keep previous assessment */
      })
      .finally(() => {
        if (inflight?.promise === promise) inflight = null;
      });
    inflight = { lang, promise };
    return promise;
  }, [build, count, lang, setRisk, setAiMode]);

  const stale = !risk || risk.reportCount !== count || risk.lang !== lang;
  useEffect(() => {
    if (auto && stale) void run();
  }, [auto, stale, run]);

  return { risk, loading: stale, run };
}

export function useScopedRisk() {
  const build = useAIContextBuilder();
  const { setAiMode } = useAppStore();
  const { lang } = useI18n();
  const [result, setResult] = useState<{ assessment: RiskAssessment; mode: AIMode } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const run = useCallback(
    async (scope: string | null) => {
      // Only the most recent request may update state (e.g. after a language switch).
      const id = ++latest.current;
      setLoading(true);
      setError(null);
      try {
        const res = await requestRiskAnalysis(build(scope), scope, lang);
        if (id !== latest.current) return;
        setResult(res);
        setAiMode(res.mode);
      } catch (e) {
        if (id === latest.current) setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (id === latest.current) setLoading(false);
      }
    },
    [build, lang, setAiMode],
  );

  return { result, loading, error, run };
}
