/**
 * Small shared building blocks (buttons, cards, headers, avatar).
 * Badges that need the current language live in ./badges.tsx and are re-exported here.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export { SeverityBadge, SeverityMeter, StatusPill, DemoBadge, ReviewBadge, ReportIcon, ReportTag } from "./badges";

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

export function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={cn("size-9 shrink-0 rounded-full object-cover", className)} />;
  }
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
