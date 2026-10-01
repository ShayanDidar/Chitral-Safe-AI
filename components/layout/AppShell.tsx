"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Languages, Phone, Plus, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { btn } from "@/components/ui/primitives";
import { WeatherIconGlyph } from "@/components/weather/WeatherIconGlyph";
import { EmergencyContactList } from "@/components/emergency/EmergencyContacts";
import { AccountMenu } from "./AccountMenu";
import { AlertsBell } from "./AlertsBell";
import { Logo } from "./Logo";
import { NAV_ITEMS, isActive } from "./nav";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { weather, weatherStatus, user, offline } = useAppStore();
  const { t, condition, locale } = useI18n();

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-60 flex-col border-e border-slate-200/80 bg-white lg:flex">
        <div className="px-5 pb-4 pt-5">
          <Link href="/" aria-label={t("shell.home")}>
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-2" aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon
                  className={cn("size-[18px]", active ? "text-brand-700" : "text-slate-400 group-hover:text-slate-600")}
                  aria-hidden
                />
                {t(item.label)}
              </Link>
            );
          })}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              aria-current={pathname.startsWith("/admin") ? "page" : undefined}
              className={cn(
                "group mt-3 flex items-center gap-3 rounded-xl border-t border-slate-100 px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/admin") ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <ShieldCheck className="size-[18px] text-slate-400" aria-hidden />
              {t("admin.title")}
            </Link>
          )}
        </nav>
        <div className="space-y-3 p-4">
          <div className="rounded-xl bg-red-50/60 p-3.5 ring-1 ring-inset ring-red-600/10">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-red-900">
              <Phone className="size-3.5" aria-hidden /> {t("shell.emergencyTitle")}
            </p>
            <p className="mb-2.5 mt-0.5 text-[11.5px] leading-snug text-red-900/70">{t("emergency.sidebarNote")}</p>
            <EmergencyContactList variant="sidebar" />
            <Link href="/emergency" className="mt-2 inline-block text-[11.5px] font-semibold text-red-800 hover:underline">
              {t("emergency.allContacts")}
            </Link>
          </div>
          <p className="px-1 text-[11px] leading-snug text-slate-400">
            {t("shell.disclaimer")}
          </p>
        </div>
      </aside>

      <div className="lg:ps-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <Link href="/" className="lg:hidden" aria-label={t("shell.home")}>
              <Logo />
            </Link>
            <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex">
              <span className="font-medium text-slate-900">{t("shell.region")}</span>
              <span className="text-slate-300">•</span>
              <span suppressHydrationWarning>
                {new Date().toLocaleDateString(locale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "Asia/Karachi",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {weatherStatus !== "loading" && (
                <Link
                  href="/weather"
                  className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-sm text-slate-700 hover:bg-slate-100 xl:flex"
                >
                  <WeatherIconGlyph icon={weather.current.icon} className="size-4 text-slate-500" />
                  <span className="font-medium">{weather.current.temperature}°C</span>
                  <span className="text-slate-500">{condition(weather.current.icon, weather.current.condition)}</span>
                </Link>
              )}
              <Link
                href="/emergency"
                aria-label={t("emergency.title")}
                className="grid size-9 place-items-center rounded-full bg-red-50 text-red-700 hover:bg-red-100 lg:hidden"
              >
                <Phone className="size-[18px]" aria-hidden />
              </Link>
              <LanguageToggle />
              <AlertsBell />
              <Link href="/report" className={cn(btn.base, btn.primary, btn.sm, "max-md:hidden")}>
                <Plus className="size-4" aria-hidden /> {t("shell.reportHazard")}
              </Link>
              <AccountMenu />
            </div>
          </div>
        </header>

        {offline && (
          <p role="status" className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
            {t("shell.offline")}
          </p>
        )}
        <main>{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-6">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const isReport = item.href === "/report";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10.5px] font-medium",
                  active ? "text-brand-700" : "text-slate-500",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-10 place-items-center rounded-full transition-colors",
                    isReport ? "bg-brand-700 text-white" : active ? "bg-brand-50" : "",
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                {t(item.short)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function LanguageToggle() {
  const { t, toggle, lang } = useI18n();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("lang.toggleLabel")}
      title={t("lang.toggleLabel")}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50",
        lang === "en" && "font-[family-name:var(--font-urdu)]",
      )}
    >
      <Languages className="size-4 text-slate-500" aria-hidden />
      <span lang={lang === "en" ? "ur" : "en"} className="max-sm:hidden">
        {t("lang.toggle")}
      </span>
    </button>
  );
}
