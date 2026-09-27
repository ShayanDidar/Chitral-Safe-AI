import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-9 place-items-center rounded-xl bg-brand-700 text-white shadow-card", className)}>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <path d="M2.5 19.5 9 8.5l3.2 5.2 2.3-3.4 7 9.2H2.5Z" fill="currentColor" opacity="0.95" />
        <path d="m9 8.5 1.6 2.6-1.6-.8-1.5.9L9 8.5Z" fill="#aed9cf" />
        <circle cx="17.5" cy="5.5" r="2.5" fill="#fbbf24" />
      </svg>
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight text-slate-900">Chitral Safe</span>
          <span className="hidden text-[11px] text-slate-500 sm:block">Environmental monitoring</span>
        </span>
      )}
    </span>
  );
}
