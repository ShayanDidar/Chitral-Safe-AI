"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { useHazardStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { AlertCard } from "@/components/alerts/AlertCard";

export function AlertsBell() {
  const { alerts } = useHazardStore();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const warnings = alerts.filter((a) => a.level === "warning").length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t("alerts.aria", { n: alerts.length })}
        className="relative grid size-9 place-items-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <Bell className="size-[18px]" aria-hidden />
        {warnings > 0 && (
          <span className="absolute end-1 top-1 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-white">
            {warnings}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-50 animate-fade-in rounded-2xl border border-slate-200 bg-white shadow-float sm:absolute sm:inset-x-auto sm:end-0 sm:top-11 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("alerts.title")}</p>
              <p className="text-xs text-slate-500">{t("alerts.count", { n: alerts.length })}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label={t("common.close")}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
            {alerts.map((a) => (
              <AlertCard key={a.id} alert={a} onNavigate={() => setOpen(false)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
