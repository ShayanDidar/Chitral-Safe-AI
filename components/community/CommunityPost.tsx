"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, Heart, MapPin, MessageCircle, Send, Map as MapIcon } from "lucide-react";
import { useHazardStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Avatar, Card, HazardTypeLabel, SeverityBadge, StatusPill } from "@/components/ui/primitives";
import { TimeAgo } from "@/components/ui/TimeAgo";
import type { HazardReport } from "@/types";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export function CommunityPost({ report, highlighted }: { report: HazardReport; highlighted?: boolean }) {
  const { toggleLike } = useHazardStore();
  const { t, place, person, report: localize } = useI18n();
  const text = localize(report);
  const [showComments, setShowComments] = useState(report.source === "user");

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow duration-700",
        highlighted && "ring-2 ring-brand-500 ring-offset-2 ring-offset-[#f5f6f6]",
      )}
    >
      <article id={`post-${report.id}`} className="scroll-mt-20">
        <header className="flex items-start gap-3 p-4 pb-3">
          <Avatar name={person(report.author)} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="text-sm font-semibold text-slate-900">{person(report.author)}</p>
              {report.source === "user" && (
                <span className="rounded-full bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">{t("common.yourReport")}</span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {t("post.communityReport")} · <TimeAgo iso={report.reportedAt} />
            </p>
          </div>
          <SeverityBadge severity={report.severity} />
        </header>

        <div className="space-y-2 px-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1 text-[13px] font-medium text-slate-800">
              <MapPin className="size-3.5 text-slate-400" aria-hidden />
              {t("common.placeInChitral", { place: place(report.locationName) })}
            </span>
            <HazardTypeLabel type={report.type} />
            {report.status !== "active" && <StatusPill status={report.status} />}
          </div>
          <p dir="auto" className="text-[14px] leading-relaxed text-slate-700">
            {text.description}
          </p>
        </div>

        {report.imageUrl && (
          <Link href={`/reports/${report.id}`} className="mt-3 block px-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={report.imageUrl}
              alt={`${t("post.photo")}: ${text.title}`}
              loading="lazy"
              className="max-h-[420px] w-full rounded-xl border border-slate-100 object-cover"
            />
          </Link>
        )}

        <div className="mt-3 flex items-center gap-1 border-t border-slate-100 px-2 py-1.5">
          <button
            type="button"
            onClick={() => toggleLike(report.id)}
            aria-pressed={report.likedByMe}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors hover:bg-slate-50",
              report.likedByMe ? "text-red-600" : "text-slate-600",
            )}
          >
            <Heart className={cn("size-[18px] transition-transform", report.likedByMe && "scale-110 fill-red-500")} aria-hidden />
            <span className="tabular-nums">{report.likes}</span>
            <span className="sr-only">{t("post.likes")}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowComments((s) => !s)}
            aria-expanded={showComments}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            <MessageCircle className="size-[18px]" aria-hidden />
            <span className="tabular-nums">{report.comments.length}</span>
            <span className="hidden sm:inline">{t("post.comments")}</span>
          </button>
          <Link
            href={`/map?focus=${report.id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            <MapIcon className="size-[18px]" aria-hidden />
            <span className="hidden sm:inline">{t("common.map")}</span>
          </Link>
          <Link
            href={`/reports/${report.id}`}
            className="ms-auto inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-[13px] font-medium text-brand-700 hover:bg-brand-50"
          >
            {t("common.viewReport")} <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
          </Link>
        </div>

        {showComments && <CommentThread report={report} />}
      </article>
    </Card>
  );
}

export function CommentThread({ report, showAll = false }: { report: HazardReport; showAll?: boolean }) {
  const { addComment } = useHazardStore();
  const { t, person, comment } = useI18n();
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(showAll);
  const comments = expanded ? report.comments : report.comments.slice(-2);
  const hidden = report.comments.length - comments.length;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addComment(report.id, text);
    setText("");
    setExpanded(true);
  }

  return (
    <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
      {hidden > 0 && (
        <button type="button" onClick={() => setExpanded(true)} className="text-xs font-medium text-slate-500 hover:text-slate-800">
          {t("post.viewAll", { n: report.comments.length })}
        </button>
      )}
      {comments.length === 0 && <p className="text-xs text-slate-500">{t("post.noComments")}</p>}
      {comments.map((c) => (
        <div key={c.id} className="flex animate-fade-in gap-2.5">
          <Avatar name={person(c.author)} className="size-7 text-[10px]" />
          <div className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 ring-1 ring-inset ring-slate-200/70">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-semibold text-slate-900">{person(c.author)}</p>
              <TimeAgo iso={c.createdAt} className="text-[11px] text-slate-400" />
            </div>
            <p dir="auto" className="mt-0.5 text-[13px] leading-snug text-slate-700">
              {comment(c)}
            </p>
          </div>
        </div>
      ))}
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <label htmlFor={`c-${report.id}`} className="sr-only">
          {t("post.addCommentLabel")}
        </label>
        <input
          id={`c-${report.id}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          dir="auto"
          placeholder={t("post.addComment")}
          className="h-9 flex-1 rounded-full border border-slate-200 bg-white px-3.5 text-[13px] placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="grid size-9 place-items-center rounded-full bg-brand-700 text-white hover:bg-brand-800 disabled:bg-slate-200 disabled:text-slate-400"
          aria-label={t("post.postComment")}
        >
          <Send className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
