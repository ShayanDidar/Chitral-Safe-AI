"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { HAZARD_TYPE_LIST, SEVERITIES, SEVERITY_LIST } from "@/lib/hazards";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { CRIME_TERMS, HAZARD_TERMS, placeName } from "@/lib/i18n/terms";
import type { HazardType, Report, Severity } from "@/types";

export interface Filters {
  /** A hazard type, "crime" for all safety reports, or "all". */
  type: HazardType | "crime" | "all";
  severity: Severity | "all";
  location: string | "all";
  query: string;
  hideResolved: boolean;
}

const EMPTY_FILTERS: Filters = { type: "all", severity: "all", location: "all", query: "", hideResolved: false };

function applyFilters(reports: Report[], f: Filters) {
  const q = f.query.trim().toLowerCase();
  return reports.filter((r) => {
    const terms = r.kind === "hazard" ? HAZARD_TERMS[r.type] : CRIME_TERMS[r.category];
    return (
      (f.type === "all" || (f.type === "crime" ? r.kind === "crime" : r.kind === "hazard" && r.type === f.type)) &&
      // Severity applies to hazard reports only.
      (f.severity === "all" || (r.kind === "hazard" && r.severity === f.severity)) &&
      (f.location === "all" || r.locationName === f.location) &&
      (!f.hideResolved || r.status !== "resolved") &&
      (!q ||
        r.description.toLowerCase().includes(q) ||
        r.locationName.toLowerCase().includes(q) ||
        terms.en.toLowerCase().includes(q) ||
        terms.ur.includes(q) ||
        placeName(r.locationName, "ur").includes(q) ||
        (r.ur?.description.includes(q) ?? false))
    );
  });
}

export function useReportFilters(reports: Report[], initial: Partial<Filters> = {}) {
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, ...initial });
  const filtered = useMemo(() => applyFilters(reports, filters), [reports, filters]);
  const locations = useMemo(() => [...new Set(reports.map((r) => r.locationName))].sort(), [reports]);
  return { filters, setFilters, filtered, locations };
}

const selectCls =
  "h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white ps-3 pe-8 text-[13px] text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select {...props} className={selectCls} />
      <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
    </span>
  );
}

export function ReportFilters({
  filters,
  setFilters,
  locations,
  layout = "row",
  showSearch = true,
  resultCount,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  locations: string[];
  layout?: "row" | "stack";
  showSearch?: boolean;
  resultCount?: number;
}) {
  const { t, hazard, severity, place } = useI18n();
  const dirty =
    filters.type !== "all" || filters.severity !== "all" || filters.location !== "all" || filters.query !== "";
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters({ ...filters, [k]: v });

  return (
    <div className={cn("flex gap-2.5", layout === "row" ? "flex-col sm:flex-row sm:flex-wrap sm:items-center" : "flex-col")}>
      {showSearch && (
        <label className={cn("relative", layout === "row" && "sm:w-56")}>
          <span className="sr-only">{t("filters.search")}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={filters.query}
            onChange={(e) => set("query", e.target.value)}
            placeholder={t("filters.search")}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white ps-9 pe-3 text-[13px] placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </label>
      )}
      <div className={cn("grid gap-2.5", layout === "row" ? "grid-cols-2 sm:flex" : "grid-cols-2")}>
        <label>
          <span className="sr-only">{t("filters.type")}</span>
          <Select value={filters.type} onChange={(e) => set("type", e.target.value as Filters["type"])}>
            <option value="all">{t("filters.allTypes")}</option>
            {HAZARD_TYPE_LIST.map((type) => (
              <option key={type} value={type}>
                {hazard(type)}
              </option>
            ))}
            <option value="crime">{t("filters.crime")}</option>
          </Select>
        </label>
        <label>
          <span className="sr-only">{t("filters.location")}</span>
          <Select value={filters.location} onChange={(e) => set("location", e.target.value)}>
            <option value="all">{t("filters.allLocations")}</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {place(l)}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("report.severity")}>
        {(["all", ...SEVERITY_LIST] as const).map((s) => {
          const active = filters.severity === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => set("severity", s)}
              aria-pressed={active}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium ring-1 ring-inset transition-colors",
                active ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {s !== "all" && <span className="size-2 rounded-full" style={{ background: SEVERITIES[s].hex }} />}
              {s === "all" ? t("filters.all") : severity(s)}
            </button>
          );
        })}
      </div>
      {(dirty || resultCount !== undefined) && (
        <div className={cn("flex items-center gap-2 text-xs text-slate-500", layout === "row" && "sm:ms-auto")}>
          {resultCount !== undefined && <span>{t("filters.results", { n: resultCount })}</span>}
          {dirty && (
            <button
              type="button"
              onClick={() => setFilters({ ...EMPTY_FILTERS, hideResolved: filters.hideResolved })}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium text-slate-600 hover:bg-slate-100"
            >
              <X className="size-3" aria-hidden /> {t("filters.clear")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
