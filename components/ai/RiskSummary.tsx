"use client";

import { Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";
import { useI18n } from "@/lib/i18n/LanguageProvider";

const RISK_STYLE: Record<RiskLevel, { pill: string; bar: string; text: string }> = {
  Low: { pill: "bg-green-50 text-green-800 ring-green-600/20", bar: "bg-green-600", text: "text-green-700" },
  Moderate: { pill: "bg-yellow-50 text-yellow-800 ring-yellow-600/25", bar: "bg-yellow-500", text: "text-yellow-700" },
  High: { pill: "bg-orange-50 text-orange-800 ring-orange-600/25", bar: "bg-orange-600", text: "text-orange-700" },
  Severe: { pill: "bg-red-50 text-red-800 ring-red-600/25", bar: "bg-red-600", text: "text-red-700" },
};

export function RiskLevelPill({ level, className }: { level: RiskLevel; className?: string }) {
  const { t, riskLevel } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        RISK_STYLE[level].pill,
        className,
      )}
    >
      <ShieldAlert className="size-3.5" aria-hidden />
      {t("risk.level", { level: riskLevel(level) })}
    </span>
  );
}

export function RiskScoreBar({ score, level }: { score: number; level: RiskLevel }) {
  const { t, riskLevel } = useI18n();
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-slate-500">{t("risk.index")}</span>
        <span className="font-semibold tabular-nums text-slate-900">{score}/100</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-all duration-700", RISK_STYLE[level].bar)} style={{ width: `${score}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>{riskLevel("Low")}</span>
        <span>{riskLevel("Moderate")}</span>
        <span>{riskLevel("High")}</span>
        <span>{riskLevel("Severe")}</span>
      </div>
    </div>
  );
}

export function RiskDisclaimer() {
  const { t } = useI18n();
  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-400">
      <Info className="mt-px size-3 shrink-0" aria-hidden />
      {t("risk.disclaimer")}
    </p>
  );
}
