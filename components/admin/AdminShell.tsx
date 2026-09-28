"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ClipboardList, Map as MapIcon, PhoneCall, ShieldX } from "lucide-react";
import { Page } from "@/components/layout/Page";
import { Card, PageHeader, btn } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const tabs = [
    { href: "/admin", label: t("admin.queue"), icon: ClipboardList },
    { href: "/admin/map", label: t("admin.map"), icon: MapIcon },
    { href: "/admin/contacts", label: t("admin.contacts"), icon: PhoneCall },
  ];
  return (
    <Page>
      <PageHeader title={t("admin.title")} subtitle={t("admin.subtitle")} />
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium",
              pathname === href ? "border-brand-700 text-brand-800" : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </Page>
  );
}

export function NotAuthorized() {
  const { t } = useI18n();
  return (
    <Page narrow>
      <Card className="p-10 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
          <ShieldX className="size-6" aria-hidden />
        </span>
        <p className="mt-4 text-base font-semibold text-slate-900">{t("admin.forbiddenTitle")}</p>
        <p className="mt-1 text-sm text-slate-500">{t("admin.forbiddenBody")}</p>
        <Link href="/" className={cn(btn.base, btn.primary, btn.md, "mt-5")}>
          {t("notFound.back")}
        </Link>
      </Card>
    </Page>
  );
}
