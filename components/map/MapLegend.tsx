import { SEVERITIES, SEVERITY_LIST } from "@/lib/hazards";
import { cn } from "@/lib/utils";
import { SeverityMeter } from "@/components/ui/primitives";

export function MapLegend({ className, horizontal = false }: { className?: string; horizontal?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-float backdrop-blur",
        className,
      )}
    >
      {!horizontal && <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Severity</p>}
      <ul className={cn(horizontal ? "flex flex-wrap items-center gap-x-3 gap-y-1" : "space-y-1.5")}>
        {SEVERITY_LIST.map((s) => (
          <li key={s} className="flex items-center gap-2 text-xs text-slate-700">
            <span className="size-3 rounded-full ring-2 ring-white" style={{ background: SEVERITIES[s].hex }} />
            <SeverityMeter severity={s} className="text-slate-400" />
            <span className="font-medium">{SEVERITIES[s].label}</span>
          </li>
        ))}
      </ul>
      {!horizontal && (
        <p className="mt-2 border-t border-slate-100 pt-1.5 text-[11px] leading-snug text-slate-500">
          Pulsing ring = critical or new report
        </p>
      )}
    </div>
  );
}
