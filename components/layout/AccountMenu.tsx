"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ClipboardList, LogIn, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { Avatar, btn } from "@/components/ui/primitives";
import { logout } from "@/lib/api";

export function AccountMenu() {
  const { user, setUser } = useAppStore();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className={cn(btn.base, btn.secondary, btn.sm, "max-sm:size-9 max-sm:rounded-full max-sm:p-0")}
        aria-label={t("auth.signIn")}
      >
        <LogIn className="size-4 rtl:-scale-x-100" aria-hidden />
        <span className="max-sm:hidden">{t("auth.signIn")}</span>
      </Link>
    );
  }

  const item = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("account.menu")}
        className="rounded-full ring-2 ring-transparent hover:ring-slate-200"
      >
        <Avatar name={user.name} src={user.avatarUrl} className="size-9" />
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-11 z-50 w-60 animate-fade-in rounded-2xl border border-slate-200 bg-white p-1.5 shadow-float">
          <div className="border-b border-slate-100 px-3 pb-2.5 pt-2">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <Link role="menuitem" href="/account" onClick={() => setOpen(false)} className={cn(item, "mt-1")}>
            <UserRound className="size-4 text-slate-400" aria-hidden /> {t("account.profile")}
          </Link>
          <Link role="menuitem" href="/account/submissions" onClick={() => setOpen(false)} className={item}>
            <ClipboardList className="size-4 text-slate-400" aria-hidden /> {t("account.submissions")}
          </Link>
          {user.role === "admin" && (
            <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className={item}>
              <ShieldCheck className="size-4 text-slate-400" aria-hidden /> {t("admin.title")}
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={async () => {
              setOpen(false);
              await logout();
              setUser(null);
              router.refresh();
              if (pathname.startsWith("/account") || pathname.startsWith("/admin")) router.replace("/");
            }}
            className={cn(item, "border-t border-slate-100 text-red-700")}
          >
            <LogOut className="size-4 rtl:-scale-x-100" aria-hidden /> {t("auth.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
