import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { SEVERITIES } from "@/lib/hazards";
import { cn } from "@/lib/utils";
import { TimeAgo } from "@/components/ui/TimeAgo";
import type { EnvironmentalAlert } from "@/types";

const LEVEL_LABEL = { warning: "Warning", watch: "Watch", advisory: "Advisory" } as const;

export function AlertCard({
  alert,
  compact = false,
  onNavigate,
}: {
  alert: EnvironmentalAlert;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const s = SEVERITIES[alert.severity];
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-slate-200/80 bg-white", compact ? "p-3" : "p-4")}>
      <span className={cn("absolute inset-y-0 left-0 w-1", s.dot)} aria-hidden />
      <div className="flex items-start gap-3 pl-1">
        <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg", s.soft, s.text)}>
          <TriangleAlert className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
            <span className={cn("text-[11px] font-semibold uppercase tracking-wide", s.text)}>
              {LEVEL_LABEL[alert.level]}
            </span>
          </div>
          <p className="text-[13px] font-medium text-slate-600">{alert.area}</p>
          {!compact && <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{alert.message}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {alert.risks.map((r) => (
              <span key={r} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                {r}
              </span>
            ))}
            <span className="ml-auto text-[11px] text-slate-400">
              <TimeAgo iso={alert.issuedAt} /> · {alert.source}
            </span>
          </div>
          {alert.relatedReportId && !compact && (
            <Link
              href={`/reports/${alert.relatedReportId}`}
              onClick={onNavigate}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
            >
              View report <ArrowRight className="size-3" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
