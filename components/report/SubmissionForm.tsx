"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  CircleCheck,
  Clock,
  Eye,
  EyeOff,
  Globe,
  ImagePlus,
  Loader2,
  LocateFixed,
  Lock,
  LogIn,
  MapPin,
  PhoneCall,
  Trash2,
} from "lucide-react";
import { LOCATIONS, PRIMARY_LOCATION_IDS, findLocationByName, nearestLocation } from "@/data/locations";
import { HAZARD_TYPES, HAZARD_TYPE_LIST, SEVERITIES, SEVERITY_LIST } from "@/lib/hazards";
import { CRIME_CATEGORIES, CRIME_ICONS } from "@/lib/crime";
import { MAP_CONFIG } from "@/lib/mapConfig";
import { compressImage } from "@/lib/image";
import { useHazardStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Card, ReviewBadge, SeverityMeter, btn } from "@/components/ui/primitives";
import { LocationPicker } from "@/components/map";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { ApiError, createReport } from "@/services/apiClient";
import type { CrimeCategory, HazardType, IdentityMode, LatLng, Report, Severity, Visibility } from "@/types";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

const MAX_DESC = 2000;
const MAX_PHOTOS = 4;
const PRIMARY = PRIMARY_LOCATION_IDS.map((id) => LOCATIONS.find((l) => l.id === id)!);
const [[MIN_LAT, MIN_LNG], [MAX_LAT, MAX_LNG]] = MAP_CONFIG.maxBounds;

type Field = "type" | "location" | "description" | "severity" | "image" | "occurredAt" | "visibility";
type Errors = Partial<Record<Field, DictKey>>;
type Photo = { blob: Blob; previewUrl: string };

/** Local time formatted for <input type="datetime-local">. */
function localNow() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function SubmissionForm({ kind }: { kind: "hazard" | "crime" }) {
  const { user } = useHazardStore();
  if (!user) return <SignInGate kind={kind} />;
  return <SubmissionFormInner kind={kind} />;
}

function SignInGate({ kind }: { kind: "hazard" | "crime" }) {
  const { t } = useI18n();
  const next = encodeURIComponent(kind === "crime" ? "/report/crime" : "/report");
  return (
    <Card className="mx-auto max-w-xl p-6 text-center sm:p-8">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50 text-brand-700">
        <LogIn className="size-6" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">{t("gate.title")}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-600">{t("gate.body")}</p>
      {kind === "crime" && <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{t("gate.anonNote")}</p>}
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        <Link href={`/login?next=${next}`} className={cn(btn.base, btn.primary, btn.md)}>
          {t("auth.signIn")}
        </Link>
        <Link href={`/signup?next=${next}`} className={cn(btn.base, btn.secondary, btn.md)}>
          {t("auth.createAccount")}
        </Link>
      </div>
    </Card>
  );
}

function SubmissionFormInner({ kind }: { kind: "hazard" | "crime" }) {
  const { t, hazard, crime, severity: severityLabel, severityDesc, place } = useI18n();
  const [type, setType] = useState<HazardType | null>(null);
  const [category, setCategory] = useState<CrimeCategory | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [occurredAt, setOccurredAt] = useState(localNow);
  const [visibility, setVisibility] = useState<Visibility | null>(null);
  const [identity, setIdentity] = useState<IdentityMode>(kind === "crime" ? "anonymous" : "named");
  const [locationName, setLocationName] = useState("");
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [geoState, setGeoState] = useState<"idle" | "busy" | "denied" | "unavailable" | "outside">("idle");
  const [submitted, setSubmitted] = useState<Report | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const clear = (f: Field) => setErrors((e) => ({ ...e, [f]: undefined }));

  function chooseLocation(name: string) {
    setLocationName(name);
    const known = findLocationByName(name);
    if (known && known.name.toLowerCase() === name.trim().toLowerCase()) {
      setCoords(known.coordinates);
      clear("location");
    }
  }

  function pickOnMap(p: LatLng) {
    setCoords(p);
    if (!locationName.trim()) setLocationName(`Near ${nearestLocation(p).name}`);
    clear("location");
  }

  function locateMe() {
    if (!navigator.geolocation) return setGeoState("unavailable");
    setGeoState("busy");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) };
        if (p.lat < MIN_LAT || p.lat > MAX_LAT || p.lng < MIN_LNG || p.lng > MAX_LNG) return setGeoState("outside");
        setGeoState("idle");
        pickOnMap(p);
      },
      (err) => setGeoState(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function addFiles(files: FileList | File[] | null) {
    if (!files?.length) return;
    setPhotoBusy(true);
    clear("image");
    try {
      const room = MAX_PHOTOS - photos.length;
      const next = await Promise.all([...files].slice(0, room).map((f) => compressImage(f)));
      setPhotos((p) => [...p, ...next]);
      if (files.length > room) setErrors((e) => ({ ...e, image: "err.tooManyPhotos" }));
    } catch {
      setErrors((e) => ({ ...e, image: "err.image" }));
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function validate(): Errors {
    const e: Errors = {};
    if (kind === "hazard" && !type) e.type = "err.type";
    if (kind === "crime" && !category) e.type = "err.category";
    // The root cause of posts "missing" from the map was reports saved without real
    // coordinates. A pin (or a known place) is now required.
    if (!coords) e.location = locationName.trim() ? "err.pinRequired" : "err.location";
    if (description.trim().length < 10) e.description = "err.description";
    if (kind === "hazard" && !severity) e.severity = "err.severity";
    if (kind === "crime") {
      if (!visibility) e.visibility = "err.visibility";
      const when = new Date(occurredAt);
      if (!occurredAt || Number.isNaN(when.getTime())) e.occurredAt = "err.occurredAt";
      else if (when.getTime() > Date.now() + 5 * 60_000) e.occurredAt = "err.future";
    }
    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setServerError(null);
    const e = validate();
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      document.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("description", description.trim());
    fd.set("locationName", (locationName.trim() || `Near ${nearestLocation(coords!).name}`).slice(0, 160));
    fd.set("lat", String(coords!.lat));
    fd.set("lng", String(coords!.lng));
    fd.set("identity", identity);
    if (kind === "hazard") {
      fd.set("type", type!);
      fd.set("severity", severity!);
    } else {
      fd.set("category", category!);
      fd.set("visibility", visibility!);
      fd.set("occurredAt", new Date(occurredAt).toISOString());
    }
    photos.forEach((p, i) => fd.append("images", p.blob, `photo-${i + 1}.jpg`));

    setSubmitting(true);
    try {
      setSubmitted(await createReport(fd));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setType(null);
    setCategory(null);
    setSeverity(null);
    setVisibility(null);
    setLocationName("");
    setCoords(null);
    setPhotos([]);
    setDescription("");
    setOccurredAt(localNow());
    setErrors({});
    setSubmitted(null);
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-xl animate-fade-in p-6 text-center sm:p-8">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-amber-50 text-amber-700 ring-8 ring-amber-50/60">
          <Clock className="size-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">{t("submit.successTitle")}</h2>
        <div className="mt-2 flex justify-center">
          <ReviewBadge review="pending" />
        </div>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
          {submitted.visibility === "confidential" ? t("submit.successConfidential") : t("submit.successPublic")}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/account/submissions" className={cn(btn.base, btn.primary, btn.md)}>
            {t("account.submissions")}
          </Link>
          <Link href={`/reports/${submitted.id}`} className={cn(btn.base, btn.secondary, btn.md)}>
            {t("common.viewReport")}
          </Link>
          <button type="button" onClick={reset} className={cn(btn.base, btn.ghost, btn.md)}>
            {t("report.another")}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-5 lg:col-span-3">
        {kind === "crime" && (
          <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm ring-1 ring-inset ring-red-600/15">
            <PhoneCall className="mt-0.5 size-5 shrink-0 text-red-700" aria-hidden />
            <div>
              <p className="font-semibold text-red-900">{t("crime.emergencyTitle")}</p>
              <p className="mt-0.5 text-red-800">{t("crime.emergencyBody")}</p>
              <Link href="/emergency" className="mt-1.5 inline-block font-semibold text-red-800 underline underline-offset-2">
                {t("emergency.linkShort")}
              </Link>
            </div>
          </div>
        )}

        {/* Type / category */}
        <Card className="p-4 sm:p-5">
          <fieldset data-field="type">
            <legend className="text-sm font-semibold text-slate-900">
              {t(kind === "crime" ? "crime.category" : "report.type")} <span className="text-red-600">*</span>
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {kind === "hazard"
                ? HAZARD_TYPE_LIST.map((h) => (
                    <ChoiceTile
                      key={h}
                      active={type === h}
                      icon={HAZARD_TYPES[h].icon}
                      label={hazard(h)}
                      onClick={() => {
                        setType(h);
                        clear("type");
                      }}
                    />
                  ))
                : CRIME_CATEGORIES.map((c) => (
                    <ChoiceTile
                      key={c}
                      active={category === c}
                      icon={CRIME_ICONS[c]}
                      label={crime(c)}
                      onClick={() => {
                        setCategory(c);
                        clear("type");
                      }}
                    />
                  ))}
            </div>
            <FieldError msg={errors.type} />
          </fieldset>
        </Card>

        {/* Location */}
        <Card className="p-4 sm:p-5">
          <div data-field="location">
            <label htmlFor="loc" className="text-sm font-semibold text-slate-900">
              {t(kind === "crime" ? "crime.location" : "report.location")} <span className="text-red-600">*</span>
            </label>
            <div className="relative mt-3">
              <MapPin className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                id="loc"
                list="known-locations"
                value={locationName}
                maxLength={160}
                onChange={(e) => chooseLocation(e.target.value)}
                placeholder={t("report.locPlaceholder")}
                className={cn(inputCls, "h-11 ps-10")}
              />
              <datalist id="known-locations">
                {LOCATIONS.map((l) => (
                  <option key={l.id} value={l.name} />
                ))}
              </datalist>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {PRIMARY.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => chooseLocation(l.name)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
                    locationName === l.name ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
                  )}
                >
                  {place(l.name)}
                </button>
              ))}
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <div className="h-56 sm:h-64">
                <LocationPicker value={coords} onPick={pickOnMap} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-2">
                <p className="text-xs text-slate-500">
                  {coords ? (
                    <>
                      <span className="font-medium text-slate-700">{t("report.pinPlaced")}</span> ·{" "}
                      <span className="tabular-nums">
                        {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                      </span>{" "}
                      · {t("report.drag")}
                    </>
                  ) : (
                    t("report.tapMapRequired")
                  )}
                </p>
                <button
                  type="button"
                  onClick={locateMe}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                >
                  {geoState === "busy" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <LocateFixed className="size-3.5" aria-hidden />}
                  {t("report.myLocation")}
                </button>
              </div>
            </div>
            {geoState === "denied" && <p className="mt-2 text-xs text-amber-700">{t("geo.denied")}</p>}
            {geoState === "unavailable" && <p className="mt-2 text-xs text-amber-700">{t("geo.unavailable")}</p>}
            {geoState === "outside" && <p className="mt-2 text-xs text-amber-700">{t("geo.outside")}</p>}
            {kind === "crime" && <p className="mt-2 text-xs text-slate-500">{t("crime.locationPrivacy")}</p>}
            <FieldError msg={errors.location} />
          </div>
        </Card>

        {/* Crime: when */}
        {kind === "crime" && (
          <Card className="p-4 sm:p-5">
            <div data-field="occurredAt">
              <label htmlFor="occurred" className="text-sm font-semibold text-slate-900">
                {t("crime.occurredAt")} <span className="text-red-600">*</span>
              </label>
              <input
                id="occurred"
                type="datetime-local"
                value={occurredAt}
                max={localNow()}
                onChange={(e) => {
                  setOccurredAt(e.target.value);
                  clear("occurredAt");
                }}
                className={cn(inputCls, "mt-3 h-11")}
              />
              <FieldError msg={errors.occurredAt} />
            </div>
          </Card>
        )}

        {/* Photos */}
        <Card className="p-4 sm:p-5">
          <div data-field="image">
            <p className="text-sm font-semibold text-slate-900">
              {t("report.photos")}{" "}
              <span className="font-normal text-slate-400">{t(kind === "crime" ? "report.optional" : "report.recommended")}</span>
            </p>
            <input
              ref={fileRef}
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => void addFiles(e.target.files)}
            />
            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {photos.map((p, i) => (
                  <div key={p.previewUrl} className="relative overflow-hidden rounded-xl border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.previewUrl} alt={t("report.photoAlt")} className="aspect-square w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(p.previewUrl);
                        setPhotos((all) => all.filter((_, j) => j !== i));
                      }}
                      className="absolute end-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-white/95 text-red-700 shadow"
                      aria-label={t("report.remove")}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < MAX_PHOTOS && (
              <label
                htmlFor="photo"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void addFiles(e.dataTransfer.files);
                }}
                className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-7 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                {photoBusy ? <Loader2 className="size-6 animate-spin text-slate-400" aria-hidden /> : <ImagePlus className="size-6 text-slate-400" aria-hidden />}
                <span className="text-sm font-medium text-slate-700">{t("report.upload")}</span>
                <span className="text-xs text-slate-500">{t("report.uploadHintMulti", { n: MAX_PHOTOS })}</span>
              </label>
            )}
            <p className="mt-2 text-xs text-slate-500">{t("report.metadataNote")}</p>
            <FieldError msg={errors.image} />
          </div>
        </Card>

        {/* Description */}
        <Card className="p-4 sm:p-5">
          <div data-field="description">
            <label htmlFor="desc" className="text-sm font-semibold text-slate-900">
              {t("report.description")} <span className="text-red-600">*</span>
            </label>
            <textarea
              id="desc"
              rows={kind === "crime" ? 5 : 4}
              maxLength={MAX_DESC}
              value={description}
              dir="auto"
              onChange={(e) => {
                setDescription(e.target.value);
                if (e.target.value.trim().length >= 10) clear("description");
              }}
              placeholder={t(kind === "crime" ? "crime.descPlaceholder" : "report.descPlaceholder")}
              className={cn(inputCls, "mt-3 resize-y py-2.5 leading-relaxed")}
            />
            <div className="mt-1 flex justify-between">
              <FieldError msg={errors.description} />
              <span className="ms-auto text-[11px] tabular-nums text-slate-400">
                {description.length}/{MAX_DESC}
              </span>
            </div>
            {kind === "crime" && <p className="mt-1 text-xs text-slate-500">{t("crime.descPrivacy")}</p>}
          </div>
        </Card>

        {/* Hazard: severity */}
        {kind === "hazard" && (
          <Card className="p-4 sm:p-5">
            <fieldset data-field="severity">
              <legend className="text-sm font-semibold text-slate-900">
                {t("report.severity")} <span className="text-red-600">*</span>
              </legend>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SEVERITY_LIST.map((s) => {
                  const meta = SEVERITIES[s];
                  const active = severity === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setSeverity(s);
                        clear("severity");
                      }}
                      className={cn(
                        "rounded-xl border p-3 text-start transition-colors",
                        active ? cn(meta.soft, "ring-2", meta.ring, "border-transparent") : "border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      <span className={cn("flex items-center gap-2 text-sm font-semibold", active ? meta.text : "text-slate-800")}>
                        <span className="size-2.5 rounded-full" style={{ background: meta.hex }} />
                        {severityLabel(s)}
                        <SeverityMeter severity={s} className="ms-auto text-slate-400" />
                      </span>
                      <span className="mt-1 block text-[11.5px] leading-snug text-slate-500">{severityDesc(s)}</span>
                    </button>
                  );
                })}
              </div>
              <FieldError msg={errors.severity} />
            </fieldset>
          </Card>
        )}

        {/* Crime: who can see it */}
        {kind === "crime" && (
          <Card className="p-4 sm:p-5">
            <fieldset data-field="visibility">
              <legend className="text-sm font-semibold text-slate-900">
                {t("visibility.title")} <span className="text-red-600">*</span>
              </legend>
              <p className="mt-0.5 text-xs text-slate-500">{t("visibility.help")}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <OptionCard
                  active={visibility === "public"}
                  icon={<Globe className="size-4" aria-hidden />}
                  title={t("visibility.public")}
                  body={t("visibility.publicBody")}
                  onClick={() => {
                    setVisibility("public");
                    clear("visibility");
                  }}
                />
                <OptionCard
                  active={visibility === "confidential"}
                  icon={<Lock className="size-4" aria-hidden />}
                  title={t("visibility.confidential")}
                  body={t("visibility.confidentialBody")}
                  onClick={() => {
                    setVisibility("confidential");
                    clear("visibility");
                  }}
                />
              </div>
              <FieldError msg={errors.visibility} />
            </fieldset>
          </Card>
        )}

        {/* Identity (separate from visibility) */}
        <Card className="p-4 sm:p-5">
          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">{t("identity.title")}</legend>
            <p className="mt-0.5 text-xs text-slate-500">{t("identity.help")}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <OptionCard
                active={identity === "named"}
                icon={<Eye className="size-4" aria-hidden />}
                title={t("identity.named")}
                body={t("identity.namedBody")}
                onClick={() => setIdentity("named")}
              />
              <OptionCard
                active={identity === "anonymous"}
                icon={<EyeOff className="size-4" aria-hidden />}
                title={t("identity.anonymous")}
                body={t("identity.anonymousBody")}
                onClick={() => setIdentity("anonymous")}
              />
            </div>
            {identity === "anonymous" && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-inset ring-slate-200">
                <p className="font-semibold text-slate-800">{t("identity.limitsTitle")}</p>
                <ul className="mt-1 list-disc space-y-0.5 ps-4">
                  <li>{t("identity.limit1")}</li>
                  <li>{t("identity.limit2")}</li>
                  <li>{t("identity.limit3")}</li>
                </ul>
              </div>
            )}
          </fieldset>
        </Card>

        {serverError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {serverError}
          </p>
        )}
        <button type="submit" disabled={submitting} className={cn(btn.base, btn.primary, "h-12 w-full text-[15px]")}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> {t("report.submitting")}
            </>
          ) : (
            t("submit.button")
          )}
        </button>
        <p className="text-center text-xs text-slate-500">{t("submit.reviewNote")}</p>
      </div>

      {/* Guidance */}
      <aside className="hidden lg:col-span-2 lg:block">
        <div className="sticky top-20 space-y-4">
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-900">{t("submit.howTitle")}</p>
            <ol className="mt-3 space-y-3 text-[13px] text-slate-600">
              {(["submit.step1", "submit.step2", "submit.step3"] as const).map((k, i) => (
                <li key={k} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-800">
                    {i + 1}
                  </span>
                  {t(k)}
                </li>
              ))}
            </ol>
          </Card>
          <div className="rounded-xl bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-600/15">
            <p className="font-semibold">{t("report.safeTitle")}</p>
            <p className="mt-1 text-amber-800">{t("report.safeBody")}</p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function ChoiceTile({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-[13px] font-medium transition-colors",
        active ? "border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-600" : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <Icon className={cn("size-5", active ? "text-brand-700" : "text-slate-500")} aria-hidden />
      {label}
    </button>
  );
}

function OptionCard({
  active,
  icon,
  title,
  body,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3.5 text-start transition-colors",
        active ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-slate-200 hover:bg-slate-50",
      )}
    >
      <span className={cn("flex items-center gap-2 text-sm font-semibold", active ? "text-brand-800" : "text-slate-800")}>
        {icon}
        {title}
        {active && <CircleCheck className="ms-auto size-4 text-brand-700" aria-hidden />}
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-slate-600">{body}</span>
    </button>
  );
}

function FieldError({ msg }: { msg?: DictKey }) {
  const { t } = useI18n();
  if (!msg) return null;
  return (
    <p role="alert" className="mt-2 text-xs font-medium text-red-700">
      {t(msg)}
    </p>
  );
}
