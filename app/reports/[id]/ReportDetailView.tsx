"use client";

import Link from "next/link";
import { ArrowLeft, Heart, Map as MapIcon, MapPin, ShieldCheck } from "lucide-react";
import { useHazardStore } from "@/lib/store";
import { HAZARD_TYPES, SEVERITIES } from "@/lib/hazards";
import { cn, formatDateTime } from "@/lib/utils";
import { Avatar, Card, HazardIcon, SectionHeader, SeverityBadge, StatusPill, btn } from "@/components/ui/primitives";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { Page } from "@/components/layout/Page";
import { MapView } from "@/components/map";
import { CommentThread } from "@/components/community/CommunityPost";

export function ReportDetailView({ id }: { id: string }) {
  const { getReport, toggleLike } = useHazardStore();
  const report = getReport(id);

  if (!report) {
    return (
      <Page narrow>
        <Card className="p-10 text-center">
          <p className="text-base font-semibold text-slate-900">Report not available</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            This report may have been created in an earlier session. In this demo, new reports are kept only until the
            page is refreshed.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/community" className={cn(btn.base, btn.primary, btn.md)}>
              Go to Community
            </Link>
            <Link href="/map" className={cn(btn.base, btn.secondary, btn.md)}>
              Open map
            </Link>
          </div>
        </Card>
      </Page>
    );
  }

  const meta = HAZARD_TYPES[report.type];
  const sev = SEVERITIES[report.severity];
  const TypeIcon = meta.icon;

  return (
    <Page>
      <Link href="/community" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden /> Community reports
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/9] bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={report.imageUrl ?? meta.image} alt={`Photo: ${report.title}`} className="h-full w-full object-cover" />
              {!report.imageUrl && (
                <span className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-1 text-[11px] text-slate-600">
                  No photo submitted — illustration shown
                </span>
              )}
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={report.severity} />
                <StatusPill status={report.status} />
                {report.source === "user" && (
                  <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[11px] font-semibold text-white">Your report</span>
                )}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                  <TypeIcon className="size-4" aria-hidden /> {meta.label}
                </p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{report.title}</h1>
                <p className="mt-1.5 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="size-4 text-slate-400" aria-hidden /> {report.locationName}, {report.area}
                </p>
              </div>
              <p className="text-[15px] leading-relaxed text-slate-700">{report.description}</p>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={report.author} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{report.author}</p>
                    <p className="text-xs text-slate-500">
                      Reported <TimeAgo iso={report.reportedAt} />
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleLike(report.id)}
                    aria-pressed={report.likedByMe}
                    className={cn(btn.base, btn.secondary, btn.md, report.likedByMe && "text-red-600")}
                  >
                    <Heart className={cn("size-4", report.likedByMe && "fill-red-500")} aria-hidden />
                    {report.likes}
                  </button>
                  <Link href={`/map?focus=${report.id}`} className={cn(btn.base, btn.primary, btn.md)}>
                    <MapIcon className="size-4" aria-hidden /> View on Map
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-5 pb-1 pt-4">
              <SectionHeader title={`Community comments (${report.comments.length})`} subtitle="Updates from people nearby" />
            </div>
            <div className="mt-3">
              <CommentThread report={report} showAll />
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <HazardIcon type={report.type} severity={report.severity} size="lg" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{meta.label}</p>
                <p className={cn("text-xs font-medium", sev.text)}>
                  {sev.label} severity — {sev.description.toLowerCase()}
                </p>
              </div>
            </div>
            <dl className="mt-4 divide-y divide-slate-100 text-sm">
              <Row label="Location" value={report.locationName} />
              <Row label="Area" value={report.area} />
              <Row
                label="Coordinates"
                value={`${report.coordinates.lat.toFixed(4)}, ${report.coordinates.lng.toFixed(4)}`}
              />
              <Row label="Reported" value={<span suppressHydrationWarning>{formatDateTime(report.reportedAt)}</span>} />
              <Row label="Status" value={<StatusPill status={report.status} />} />
              <Row label="Source" value="Community report (unverified)" />
            </dl>
          </Card>

          <Card className="overflow-hidden">
            <div className="h-56">
              <MapView
                reports={[report]}
                interactive={false}
                center={[report.coordinates.lat, report.coordinates.lng]}
                zoom={11}
              />
            </div>
            <div className="p-3">
              <Link href={`/map?focus=${report.id}`} className={cn(btn.base, btn.secondary, btn.md, "w-full")}>
                <MapIcon className="size-4" aria-hidden /> View on Map
              </Link>
            </div>
          </Card>

          <Card className="p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="size-4 text-brand-700" aria-hidden /> Safety guidance
            </p>
            <ul className="mt-3 space-y-2">
              {meta.guidance.map((g) => (
                <li key={g} className="flex gap-2 text-[13px] leading-snug text-slate-600">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
                  {g}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Emergency: call <a href="tel:1122" className="font-semibold text-red-700">Rescue 1122</a>
            </p>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}
