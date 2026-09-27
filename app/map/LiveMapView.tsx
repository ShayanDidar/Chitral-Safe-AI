"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ListFilter, Plus } from "lucide-react";
import { useHazardStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { btn } from "@/components/ui/primitives";
import { MapLegend, MapView } from "@/components/map";
import { HazardListItem } from "@/components/hazards/HazardCard";
import { ReportFilters, useReportFilters } from "@/components/hazards/ReportFilters";

export function LiveMapView() {
  const params = useSearchParams();
  const { reports } = useHazardStore();
  const { filters, setFilters, filtered, locations } = useReportFilters(reports);
  const initialFocus = params.get("focus");
  const [selectedId, setSelectedId] = useState<string | null>(initialFocus);
  const [flyTo, setFlyTo] = useState<{ id: string; key: number } | null>(
    initialFocus ? { id: initialFocus, key: 0 } : null,
  );
  const focus = (id: string) => {
    setSelectedId(id);
    setFlyTo((prev) => ({ id, key: (prev?.key ?? 0) + 1 }));
  };
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeCount = filtered.filter((r) => r.status !== "resolved").length;

  const list = (
    <div className="space-y-1">
      {filtered.length === 0 ? (
        <p className="px-2 py-8 text-center text-sm text-slate-500">No reports match these filters.</p>
      ) : (
        filtered.map((r) => (
          <HazardListItem
            key={r.id}
            report={r}
            active={r.id === selectedId}
            onClick={() => {
              focus(r.id);
              setSheetOpen(false);
            }}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-3.5rem-68px)] lg:h-[calc(100dvh-3.5rem)]">
      {/* Desktop side panel */}
      <aside className="hidden w-[340px] shrink-0 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="space-y-3 border-b border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">Live Map</h1>
              <p className="text-xs text-slate-500">
                {activeCount} active · {filtered.length} shown of {reports.length} reports
              </p>
            </div>
            <Link href="/report" className={cn(btn.base, btn.primary, btn.sm)}>
              <Plus className="size-3.5" aria-hidden /> Report
            </Link>
          </div>
          <ReportFilters filters={filters} setFilters={setFilters} locations={locations} layout="stack" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">{list}</div>
      </aside>

      {/* Map */}
      <div className="relative min-w-0 flex-1">
        <MapView reports={filtered} selectedId={selectedId} flyTo={flyTo} onSelect={setSelectedId} />
        <MapLegend className="absolute bottom-6 left-3 z-[500] hidden sm:block" />

        {/* Mobile controls */}
        <div className="absolute left-1/2 top-3 z-[500] -translate-x-1/2 lg:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={cn(btn.base, btn.secondary, btn.md, "whitespace-nowrap shadow-float")}
          >
            <ListFilter className="size-4" aria-hidden /> Filters & list
            <span className="rounded-full bg-slate-900 px-1.5 text-[11px] font-semibold text-white">{filtered.length}</span>
          </button>
        </div>
        <MapLegend horizontal className="absolute inset-x-3 bottom-3 z-[500] sm:hidden" />

        {sheetOpen && (
          <div className="absolute inset-0 z-[600] flex flex-col justify-end bg-slate-900/30 lg:hidden" onClick={() => setSheetOpen(false)}>
            <div
              className="flex max-h-[80%] animate-fade-in flex-col rounded-t-2xl bg-white shadow-float"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  {filtered.length} report{filtered.length === 1 ? "" : "s"}
                </p>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="grid size-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <ChevronDown className="size-5" aria-hidden />
                </button>
              </div>
              <div className="border-b border-slate-100 p-3">
                <ReportFilters filters={filters} setFilters={setFilters} locations={locations} layout="stack" />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">{list}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
