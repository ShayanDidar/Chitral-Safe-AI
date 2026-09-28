"use client";

import Link from "next/link";
import { ShieldAlert, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

/** Title plus a switcher between hazard and crime reporting. */
export function ReportHeader({ kind }: { kind: "hazard" | "crime" }) {
  const { t } = useI18n();
  const tabs = [
    { href: "/report", key: "hazard", label: t("report.tabHazard"), icon: TriangleAlert },
    { href: "/report/crime", key: "crime", label: t("report.tabCrime"), icon: ShieldAlert },
  ] as const;
  return (
    <div className="space-y-4">
      <PageHeader
        title={t(kind === "crime" ? "crime.title" : "report.title")}
        subtitle={t(kind === "crime" ? "crime.subtitle" : "report.subtitle")}
      />
      <nav aria-label={t("report.kindLabel")} className="inline-flex rounded-xl bg-slate-100 p-1">
        {tabs.map(({ href, key, label, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            aria-current={kind === key ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              kind === key ? "bg-white text-slate-900 shadow-card" : "text-slate-600 hover:text-slate-900",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
