"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/primitives";
import { MapView } from "@/components/map";
import { HazardListItem } from "@/components/hazards/HazardCard";
import { fetchAdminReports } from "@/services/apiClient";
import type { Report, ReviewStatus } from "@/types";

export function AdminMap() {
  return (
    <Suspense>
      <AdminMapInner />
    </Suspense>
  );
}

/** Every report at its exact location, styled by review status and visibility. Admin only. */
function AdminMapInner() {
  const { t, review } = useI18n();
  const params = useSearchParams();
  const focus = params.get("focus");
  const [reports, setReports] = useState<Report[] | null>(null);
  const [show, setShow] = useState<Record<ReviewStatus, boolean>>({ pending: true, approved: true, rejected: false });
  const [showConfidential, setShowConfidential] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(focus);
  const [flyTo, setFlyTo] = useState<{ id: string; key: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchAdminReports({ review: "all", kind: "all", visibility: "all" })
        .then((r) => !cancelled && setReports(r.reports))
        .catch(() => !cancelled && setReports([]));
    void load();
    const timer = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // Once data arrives, fly to the report requested in ?focus=.
  useEffect(() => {
    if (!focus || !reports?.some((r) => r.id === focus)) return;
    const target = reports.find((r) => r.id === focus)!;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from URL after data loads
    setShow((s) => ({ ...s, [target.review]: true }));
    setFlyTo((prev) => prev ?? { id: focus, key: 1 });
  }, [focus, reports]);

  const visible = useMemo(
    () => (reports ?? []).filter((r) => show[r.review] && (showConfidential || r.visibility !== "confidential")),
    [reports, show, showConfidential],
  );

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-2 p-3 text-sm">
        {(["pending", "approved", "rejected"] as ReviewStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={show[s]}
            onClick={() => setShow((v) => ({ ...v, [s]: !v[s] }))}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-medium ring-1 ring-inset",
              show[s] ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200",
            )}
          >
            <span
              className={cn(
                "size-2.5 rounded-full",
                s === "pending" ? "border-2 border-dashed border-amber-500" : s === "approved" ? "bg-green-600" : "bg-slate-400",
              )}
            />
            {review(s)} ({reports?.filter((r) => r.review === s).length ?? 0})
          </button>
        ))}
        <button
          type="button"
          aria-pressed={showConfidential}
          onClick={() => setShowConfidential((v) => !v)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium ring-1 ring-inset",
            showConfidential ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200",
          )}
        >
          <Lock className="size-3" aria-hidden /> {t("visibility.confidential")}
        </button>
        <p className="w-full text-xs text-slate-500 sm:ms-auto sm:w-auto">{t("admin.mapNote")}</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="relative h-[60vh] min-h-[420px] overflow-hidden">
          {!reports ? (
            <div className="grid h-full place-items-center">
              <Loader2 className="size-6 animate-spin text-slate-400" aria-label={t("common.loading")} />
            </div>
          ) : (
            <MapView reports={visible} admin selectedId={selectedId} flyTo={flyTo} onSelect={setSelectedId} />
          )}
        </Card>
        <Card className="max-h-[60vh] overflow-y-auto p-2">
          {visible.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-slate-500">{t("admin.empty")}</p>
          ) : (
            visible.map((r) => (
              <div key={r.id} className="relative">
                <HazardListItem
                  report={r}
                  active={r.id === selectedId}
                  onClick={() => {
                    setSelectedId(r.id);
                    setFlyTo((prev) => ({ id: r.id, key: (prev?.key ?? 0) + 1 }));
                  }}
                />
                <span className="pointer-events-none absolute end-2 top-9 text-[10px] font-semibold uppercase text-slate-400">
                  {review(r.review)}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
