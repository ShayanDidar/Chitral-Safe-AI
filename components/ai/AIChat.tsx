"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAIContextBuilder } from "@/lib/ai/hooks";
import { askAssistant } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DemoBadge } from "@/components/ui/primitives";
import { Markdown } from "./Markdown";
import { useI18n } from "@/lib/i18n/LanguageProvider";

const SUGGESTED_QUESTIONS = ["ai.q1", "ai.q2", "ai.q3", "ai.q4", "ai.q5", "ai.q6"] as const;

export function AIChat({ initialQuestion, onConsumedInitial }: { initialQuestion?: string | null; onConsumedInitial?: () => void }) {
  const { chat, setChat, aiMode, setAiMode } = useAppStore();
  const buildContext = useAIContextBuilder();
  const { t, lang } = useI18n();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const consumed = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    const next = [...chat, { role: "user" as const, content: question }];
    setChat(() => next);
    setInput("");
    setLoading(true);
    setNotice(null);
    try {
      const res = await askAssistant(next, buildContext(null), lang);
      setChat((prev) => [...prev, { role: "assistant", content: res.reply }]);
      setAiMode(res.mode);
      if (res.notice) setNotice(t("ai.notice"));
    } catch {
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: t("ai.error") },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuestion && !consumed.current) {
      consumed.current = true;
      onConsumedInitial?.();
      void send(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [chat.length, loading]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Sparkles className="size-[18px]" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{t("ai.title")}</p>
            <p className="text-xs text-slate-500">{t("ai.sub")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {aiMode && <DemoBadge live={aiMode === "live"} label={t(aiMode === "live" ? "ai.live" : "ai.demo")} />}
          {chat.length > 0 && (
            <button
              type="button"
              onClick={() => setChat(() => [])}
              className="grid size-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label={t("ai.new")}
              title={t("ai.new")}
            >
              <RotateCcw className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5" aria-live="polite">
        {chat.length === 0 && !loading ? (
          <div className="mx-auto flex max-w-lg flex-col items-center py-6 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              <Sparkles className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">{t("ai.emptyTitle")}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("ai.emptyBody")}
            </p>
            <div className="mt-5 grid w-full gap-2 sm:grid-cols-2">
              {SUGGESTED_QUESTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => void send(t(key))}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-start text-[13px] text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {chat.map((m, i) => (
              <div key={i} className={cn("flex animate-fade-in", m.role === "user" ? "justify-end" : "justify-start gap-2.5")}>
                {m.role === "assistant" && (
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                    <Sparkles className="size-3.5" aria-hidden />
                  </span>
                )}
                <div
                  dir="auto"
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
                    m.role === "user"
                      ? "rounded-ee-md bg-brand-700 text-white"
                      : "rounded-ss-md border border-slate-200/80 bg-white text-slate-700 shadow-card",
                  )}
                >
                  {m.role === "assistant" ? <Markdown text={m.content} /> : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  <Sparkles className="size-3.5" aria-hidden />
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-ss-md border border-slate-200/80 bg-white px-4 py-3.5 shadow-card">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="size-1.5 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: `${d * 120}ms` }}
                    />
                  ))}
                  <span className="sr-only">{t("ai.typing")}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-3 sm:p-4">
        {notice && <p className="mb-2 text-xs text-amber-700">{notice}</p>}
        {chat.length > 0 && (
          <div className="no-scrollbar -mx-1 mb-2.5 flex gap-1.5 overflow-x-auto px-1">
            {SUGGESTED_QUESTIONS.slice(1, 5).map((key) => (
              <button
                key={key}
                type="button"
                disabled={loading}
                onClick={() => void send(t(key))}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                {t(key)}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={onSubmit} className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 ps-3.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
          <label htmlFor="ai-input" className="sr-only">
            {t("ai.askLabel")}
          </label>
          <textarea
            id="ai-input"
            dir="auto"
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder={t("ask.placeholder")}
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-700 text-white transition-colors hover:bg-brand-800 disabled:bg-slate-200 disabled:text-slate-400"
            aria-label={t("ai.send")}
          >
            <ArrowUp className="size-4" aria-hidden />
          </button>
        </form>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          {t("ai.footer")}
        </p>
      </div>
    </div>
  );
}
