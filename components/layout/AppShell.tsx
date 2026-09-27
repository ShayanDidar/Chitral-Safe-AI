"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Phone, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHazardStore } from "@/lib/store";
import { btn } from "@/components/ui/primitives";
import { WeatherIconGlyph } from "@/components/weather/WeatherIconGlyph";
import { AlertsBell } from "./AlertsBell";
import { Logo } from "./Logo";
import { NAV_ITEMS, isActive } from "./nav";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { weather } = useHazardStore();

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="px-5 pb-4 pt-5">
          <Link href="/" aria-label="Chitral Safe home">
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
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 p-4">
          <div className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-inset ring-slate-200/70">
            <p className="text-xs font-medium text-slate-900">In an emergency</p>
            <p className="mt-0.5 text-[12px] leading-snug text-slate-500">
              This app is informational. For immediate help call Rescue.
            </p>
            <a
              href="tel:1122"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-slate-200 hover:bg-red-50"
            >
              <Phone className="size-3.5" aria-hidden /> Rescue 1122
            </a>
          </div>
          <p className="px-1 text-[11px] leading-snug text-slate-400">
            Community reports are unverified. Session data resets on refresh.
          </p>
        </div>
      </aside>

      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <Link href="/" className="lg:hidden" aria-label="Chitral Safe home">
              <Logo />
            </Link>
            <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex">
              <span className="font-medium text-slate-900">Chitral, Khyber Pakhtunkhwa</span>
              <span className="text-slate-300">•</span>
              <span suppressHydrationWarning>
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "Asia/Karachi",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/weather"
                className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-sm text-slate-700 hover:bg-slate-100 sm:flex"
              >
                <WeatherIconGlyph icon={weather.current.icon} className="size-4 text-slate-500" />
                <span className="font-medium">{weather.current.temperature}°C</span>
                <span className="text-slate-500">{weather.current.condition}</span>
              </Link>
              <AlertsBell />
              <Link href="/report" className={cn(btn.base, btn.primary, btn.sm, "max-sm:hidden")}>
                <Plus className="size-4" aria-hidden /> Report hazard
              </Link>
            </div>
          </div>
        </header>

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
                {item.short}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
