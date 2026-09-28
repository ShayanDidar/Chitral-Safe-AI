"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export function AccountTabs() {
  const pathname = usePathname();
  const { t } = useI18n();
  const tabs = [
    { href: "/account", label: t("account.profile") },
    { href: "/account/submissions", label: t("account.submissions") },
  ];
  return (
    <nav className="flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={pathname === tab.href ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === tab.href ? "border-brand-700 text-brand-800" : "border-transparent text-slate-500 hover:text-slate-800",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
