import type { ReactNode } from "react";
import { HAZARD_TYPES, SEVERITIES } from "@/lib/hazards";
import { cn } from "@/lib/utils";
import type { HazardType, ReportStatus, Severity } from "@/types";

export const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 disabled:pointer-events-none",
  primary: "bg-brand-700 text-white hover:bg-brand-800 shadow-card",
  secondary: "bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 shadow-card",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  md: "h-10 px-4",
  sm: "h-8 px-3 text-[13px]",
  lg: "h-11 px-5",
};

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-card", className)}>{children}</div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Four-step bar meter so severity is readable without relying on colour. */
export function SeverityMeter({ severity, className }: { severity: Severity; className?: string }) {
  const meta = SEVERITIES[severity];
  return (
    <span className={cn("inline-flex items-end gap-[2px]", className)} aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn("w-[3px] rounded-full", i <= meta.level ? meta.dot : "bg-current opacity-20")}
          style={{ height: 4 + i * 2 }}
        />
      ))}
    </span>
  );
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const meta = SEVERITIES[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        meta.badge,
        className,
      )}
    >
      <SeverityMeter severity={severity} />
      {meta.label}
    </span>
  );
}

export function HazardTypeLabel({ type, className }: { type: HazardType; className?: string }) {
  const meta = HAZARD_TYPES[type];
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-slate-700", className)}>
      <Icon className="size-3.5 text-slate-500" aria-hidden />
      {meta.label}
    </span>
  );
}

export function HazardIcon({
  type,
  severity,
  size = "md",
  className,
}: {
  type: HazardType;
  severity?: Severity;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = HAZARD_TYPES[type].icon;
  const s = severity ? SEVERITIES[severity] : null;
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl",
        s ? cn(s.soft, s.text) : "bg-slate-100 text-slate-600",
        size === "sm" && "size-8",
        size === "md" && "size-10",
        size === "lg" && "size-12",
        className,
      )}
    >
      <Icon className={size === "lg" ? "size-6" : size === "md" ? "size-5" : "size-4"} aria-hidden />
    </span>
  );
}

const STATUS: Record<ReportStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-slate-900 text-white" },
  monitoring: { label: "Monitoring", cls: "bg-slate-100 text-slate-700" },
  resolved: { label: "Resolved", cls: "bg-green-50 text-green-800" },
};

export function StatusPill({ status, className }: { status: ReportStatus; className?: string }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS[status].cls, className)}>
      {STATUS[status].label}
    </span>
  );
}

export function DemoBadge({ live, label }: { live: boolean; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        live ? "bg-brand-50 text-brand-800 ring-brand-600/20" : "bg-slate-100 text-slate-600 ring-slate-300/60",
      )}
    >
      <span className={cn("size-1.5 rounded-full", live ? "bg-brand-500" : "bg-slate-400")} />
      {label ?? (live ? "Live" : "Demo data")}
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const palette = ["bg-brand-100 text-brand-800", "bg-sky-100 text-sky-800", "bg-amber-100 text-amber-800", "bg-rose-100 text-rose-800", "bg-violet-100 text-violet-800", "bg-slate-200 text-slate-700"];
  const idx = [...name].reduce((s, c) => s + c.charCodeAt(0), 0) % palette.length;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold", palette[idx], className)}>
      {initials || "?"}
    </span>
  );
}
