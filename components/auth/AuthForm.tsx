"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { btn } from "@/components/ui/primitives";
import { ApiError, demoLogin, fetchMe, login, signup } from "@/lib/api";

const inputCls =
  "mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-600 focus:outline-none";

/** Only allow redirects to paths on this site. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function AuthForm({ mode, demoEnabled = false }: { mode: "login" | "signup"; demoEnabled?: boolean }) {
  const { t } = useI18n();
  const { setUser } = useAppStore();
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
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-slate-900">{t(mode === "login" ? "auth.signIn" : "auth.createAccount")}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {t(mode === "login" ? "auth.noAccount" : "auth.haveAccount")}{" "}
        <Link href={`${other}?next=${encodeURIComponent(next)}`} className="font-medium text-brand-700 underline underline-offset-2">
          {t(mode === "login" ? "auth.createAccount" : "auth.signIn")}
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <label className="block">
            <span className="text-sm text-slate-700">{t("profile.name")}</span>
            <input required minLength={2} maxLength={60} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </label>
        )}
        <label className="block">
          <span className="text-sm text-slate-700">{t("auth.email")}</span>
          <input required type="email" autoComplete="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-sm text-slate-700">{t("auth.password")}</span>
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
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={cn(btn.base, btn.primary, "h-11 w-full")}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {t(mode === "login" ? "auth.signIn" : "auth.createAccount")}
        </button>
      </form>

      {demoEnabled && (
        <div className="mt-8 border-t border-slate-200 pt-5">
          <p className="text-sm text-slate-600">{t("demo.title")}</p>
          <div className="mt-2 flex gap-2">
            {(["admin", "user"] as const).map((account) => (
              <button
                key={account}
                type="button"
                disabled={!!demoBusy}
                onClick={() => void onDemo(account)}
                className={cn(btn.base, btn.secondary, "h-10 flex-1")}
              >
                {demoBusy === account && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {t(account === "admin" ? "demo.admin" : "demo.user")}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{t("demo.note")}</p>
        </div>
      )}
    </div>
  );
}
