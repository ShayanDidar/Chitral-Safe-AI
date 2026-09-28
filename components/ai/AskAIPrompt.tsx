"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, btn } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/LanguageProvider";

const EXAMPLES = ["ask.ex1", "ask.ex2", "ask.ex3"] as const;

export function AskAIPrompt() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const { t } = useI18n();

  const go = (question: string) => {
    const text = question.trim();
    if (!text) return;
    router.push(`/assistant?q=${encodeURIComponent(text)}`);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    go(q);
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-700">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{t("ask.title")}</p>
          <p className="text-xs text-slate-500">{t("ask.subtitle")}</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="mt-3.5 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="home-ask" className="sr-only">
          {t("ask.placeholder")}
        </label>
        <input
          id="home-ask"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("ask.placeholder")}
          className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button type="submit" className={cn(btn.base, btn.primary, btn.lg)}>
          {t("ask.button")}
        </button>
      </form>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {EXAMPLES.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => go(t(key))}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-brand-200 hover:bg-brand-50/60"
          >
            {t(key)}
          </button>
        ))}
      </div>
    </Card>
  );
}
