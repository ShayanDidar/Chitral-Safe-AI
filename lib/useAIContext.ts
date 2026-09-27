"use client";

import { useCallback, useEffect, useState } from "react";
import { buildAIContext } from "@/lib/ai/context";
import { useHazardStore } from "@/lib/store";
import { requestRiskAnalysis } from "@/services/apiClient";
import type { AIMode, RiskAssessment } from "@/types";

/** Returns a function that snapshots current app data for the AI. */
export function useAIContextBuilder() {
  const { reports, weather, alerts } = useHazardStore();
  return useCallback(
    (selectedLocation: string | null = null) => buildAIContext({ reports, weather, alerts, selectedLocation }),
    [reports, weather, alerts],
  );
}

let inflight: Promise<void> | null = null;

/**
 * Risk analysis for all of Chitral, cached in the store for the session.
 * Re-runs automatically when the number of reports changes (e.g. after a new report).
 */
export function useChitralRisk(auto = true) {
  const { risk, setRisk, reports, setAiMode } = useHazardStore();
  const build = useAIContextBuilder();
  const count = reports.length;

  const run = useCallback(() => {
    if (inflight) return inflight;
    inflight = requestRiskAnalysis(build(null), null)
      .then((res) => {
        setRisk({ ...res, reportCount: count });
        setAiMode(res.mode);
      })
      .catch(() => {
        /* keep previous assessment */
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  }, [build, count, setRisk, setAiMode]);

  const stale = !risk || risk.reportCount !== count;
  useEffect(() => {
    if (auto && stale) void run();
  }, [auto, stale, run]);

  return { risk, loading: stale, run };
}

export function useScopedRisk() {
  const build = useAIContextBuilder();
  const { setAiMode } = useHazardStore();
  const [result, setResult] = useState<{ assessment: RiskAssessment; mode: AIMode } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (scope: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const res = await requestRiskAnalysis(build(scope), scope);
        setResult(res);
        setAiMode(res.mode);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [build, setAiMode],
  );

  return { result, loading, error, run };
}
