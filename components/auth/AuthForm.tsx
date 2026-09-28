"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2, ShieldCheck, UserRound } from "lucide-react";
import { useHazardStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { Card, btn } from "@/components/ui/primitives";
import { LogoMark } from "@/components/layout/Logo";
import { ApiError, demoLogin, fetchMe, login, signup } from "@/services/apiClient";

const inputCls =
  "mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

/** Only allow redirects to paths on this site. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function AuthForm({ mode, demoEnabled = false }: { mode: "login" | "signup"; demoEnabled?: boolean }) {
  const { t } = useI18n();
  const { setUser } = useHazardStore();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoBusy, setDemoBusy] = useState<"admin" | "user" | null>(null);

  async function onDemo(account: "admin" | "user") {
    setDemoBusy(account);
    setError(null);
    try {
      await demoLogin(account);
      setUser(await fetchMe());
      router.replace(account === "admin" && next === "/" ? "/admin" : next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
      setDemoBusy(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") await signup({ name, email, password });
      else await login({ email, password });
      setUser(await fetchMe());
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.error"));
      setBusy(false);
    }
  }

  const other = mode === "login" ? "/signup" : "/login";
  return (
    <Card className="mx-auto w-full max-w-md p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <LogoMark />
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
          {t(mode === "login" ? "auth.signInTitle" : "auth.signUpTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t(mode === "login" ? "auth.signInSub" : "auth.signUpSub")}</p>
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <label className="block">
            <span className="text-sm font-medium text-slate-800">{t("profile.name")}</span>
            <input required minLength={2} maxLength={60} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </label>
        )}
        <label className="block">
          <span className="text-sm font-medium text-slate-800">{t("auth.email")}</span>
          <input
            required
            type="email"
            autoComplete="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-800">{t("auth.password")}</span>
          <input
            required
            type="password"
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
          {mode === "signup" && <span className="mt-1 block text-xs text-slate-500">{t("auth.passwordHint")}</span>}
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={cn(btn.base, btn.primary, "h-11 w-full")}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {t(mode === "login" ? "auth.signIn" : "auth.createAccount")}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        {t(mode === "login" ? "auth.noAccount" : "auth.haveAccount")}{" "}
        <Link href={`${other}?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700 hover:text-brand-800">
          {t(mode === "login" ? "auth.createAccount" : "auth.signIn")}
        </Link>
      </p>
      {mode === "signup" && <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">{t("auth.privacyNote")}</p>}

      {demoEnabled && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">{t("demo.title")}</p>
          <div className="mt-3 grid gap-2">
            {(
              [
                ["admin", ShieldCheck, "demo.admin", "demo-admin@chitralsafe.test"],
                ["user", UserRound, "demo.user", "demo-reporter@chitralsafe.test"],
              ] as const
            ).map(([account, Icon, label, email]) => (
              <button
                key={account}
                type="button"
                disabled={!!demoBusy}
                onClick={() => void onDemo(account)}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 text-start transition-colors hover:border-brand-300 hover:bg-brand-50/50 disabled:opacity-60"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  {demoBusy === account ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Icon className="size-4" aria-hidden />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{t(label)}</span>
                  <span dir="ltr" className="block truncate text-xs text-slate-500">
                    {email}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">{t("demo.note")}</p>
        </div>
      )}
    </Card>
  );
}
