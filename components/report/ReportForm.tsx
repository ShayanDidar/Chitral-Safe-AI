"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import {
  CircleCheck,
  ImagePlus,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { LOCATIONS, PRIMARY_LOCATION_IDS, findLocationByName, nearestLocation } from "@/data/locations";
import { HAZARD_TYPES, HAZARD_TYPE_LIST, SEVERITIES, SEVERITY_LIST } from "@/lib/hazards";
import { compressImage } from "@/lib/image";
import { useHazardStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Card, SeverityBadge, SeverityMeter, btn } from "@/components/ui/primitives";
import { LocationPicker } from "@/components/map";
import { HazardCard } from "@/components/hazards/HazardCard";
import type { HazardReport, HazardType, LatLng, Severity } from "@/types";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

const MAX_DESC = 500;
const PRIMARY = PRIMARY_LOCATION_IDS.map((id) => LOCATIONS.find((l) => l.id === id)!);

type Errors = Partial<Record<"type" | "location" | "description" | "severity" | "image", string>>;

export function ReportForm() {
  const { addReport } = useHazardStore();
  const [type, setType] = useState<HazardType | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [locationName, setLocationName] = useState("");
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [submitted, setSubmitted] = useState<HazardReport | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function chooseLocation(name: string) {
    setLocationName(name);
    const known = findLocationByName(name);
    if (known && known.name.toLowerCase() === name.trim().toLowerCase()) setCoords(known.coordinates);
    setErrors((e) => ({ ...e, location: undefined }));
  }

  function pickOnMap(p: LatLng) {
    setCoords(p);
    if (!locationName.trim()) setLocationName(`Near ${nearestLocation(p).name}`);
    setErrors((e) => ({ ...e, location: undefined }));
  }

  function locateMe() {
    if (!navigator.geolocation) return;
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5) };
        setCoords(p);
        if (!locationName.trim()) setLocationName(`Near ${nearestLocation(p).name}`);
        setGeoBusy(false);
      },
      () => setGeoBusy(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setImageBusy(true);
    setErrors((e) => ({ ...e, image: undefined }));
    try {
      setImage(await compressImage(file));
    } catch (err) {
      setErrors((e) => ({ ...e, image: err instanceof Error ? err.message : "Could not load image." }));
    } finally {
      setImageBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!type) e.type = "Choose the type of hazard.";
    if (!locationName.trim() && !coords) e.location = "Enter a location or tap the map.";
    if (description.trim().length < 10) e.description = "Add a short description (at least 10 characters).";
    if (!severity) e.severity = "Select how severe it is.";
    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.querySelector(`[data-field="${Object.keys(e)[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    const report = addReport({
      type: type!,
      severity: severity!,
      description,
      locationName,
      coordinates: coords ?? undefined,
      imageUrl: image ?? undefined,
      author: author || "You",
    });
    setSubmitting(false);
    setSubmitted(report);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setType(null);
    setSeverity(null);
    setLocationName("");
    setCoords(null);
    setImage(null);
    setDescription("");
    setErrors({});
    setSubmitted(null);
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-xl animate-fade-in p-6 text-center sm:p-8">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-green-50 text-green-700 ring-8 ring-green-50/60">
          <CircleCheck className="size-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">Report Submitted Successfully</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
          Thank you. Your report is now live on the map, in the community feed and on the dashboard.
        </p>
        <div className="mx-auto mt-6 max-w-xs text-left">
          <HazardCard report={submitted} />
        </div>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href={`/community?highlight=${submitted.id}`} className={cn(btn.base, btn.primary, btn.md)}>
            <Users className="size-4" aria-hidden /> View in Community
          </Link>
          <Link href={`/map?focus=${submitted.id}`} className={cn(btn.base, btn.secondary, btn.md)}>
            <MapIcon className="size-4" aria-hidden /> See on Map
          </Link>
          <button type="button" onClick={reset} className={cn(btn.base, btn.ghost, btn.md)}>
            Report another
          </button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-5 lg:col-span-3">
        {/* Hazard type */}
        <Card className="p-4 sm:p-5">
          <fieldset data-field="type">
            <legend className="text-sm font-semibold text-slate-900">
              Hazard type <span className="text-red-600">*</span>
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {HAZARD_TYPE_LIST.map((t) => {
                const meta = HAZARD_TYPES[t];
                const Icon = meta.icon;
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setType(t);
                      setErrors((e) => ({ ...e, type: undefined }));
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[13px] font-medium transition-colors",
                      active
                        ? "border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-600"
                        : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <Icon className={cn("size-5", active ? "text-brand-700" : "text-slate-500")} aria-hidden />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <FieldError msg={errors.type} />
          </fieldset>
        </Card>

        {/* Location */}
        <Card className="p-4 sm:p-5">
          <div data-field="location">
            <label htmlFor="loc" className="text-sm font-semibold text-slate-900">
              Location <span className="text-red-600">*</span>
            </label>
            <div className="relative mt-3">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                id="loc"
                list="known-locations"
                value={locationName}
                onChange={(e) => chooseLocation(e.target.value)}
                placeholder="e.g. Ayun road, near the bridge"
                className={cn(inputCls, "h-11 pl-10")}
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
                    locationName === l.name
                      ? "bg-slate-900 text-white ring-slate-900"
                      : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
                  )}
                >
                  {l.name}
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
                      <span className="font-medium text-slate-700">Pin placed</span> · {coords.lat.toFixed(4)},{" "}
                      {coords.lng.toFixed(4)} · drag to adjust
                    </>
                  ) : (
                    "Tap the map to drop a pin (optional)"
                  )}
                </p>
                <button
                  type="button"
                  onClick={locateMe}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                >
                  {geoBusy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <LocateFixed className="size-3.5" aria-hidden />}
                  Use my location
                </button>
              </div>
            </div>
            <FieldError msg={errors.location} />
          </div>
        </Card>

        {/* Photo */}
        <Card className="p-4 sm:p-5">
          <div data-field="image">
            <p className="text-sm font-semibold text-slate-900">
              Photo <span className="font-normal text-slate-400">(recommended)</span>
            </p>
            <input
              ref={fileRef}
              id="photo"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            {image ? (
              <div className="relative mt-3 overflow-hidden rounded-xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Selected hazard photo preview" className="max-h-80 w-full object-cover" />
                <div className="absolute right-2 top-2 flex gap-1.5">
                  <label htmlFor="photo" className={cn(btn.base, btn.secondary, btn.sm, "cursor-pointer")}>
                    <RefreshCw className="size-3.5" aria-hidden /> Change
                  </label>
                  <button type="button" onClick={() => setImage(null)} className={cn(btn.base, btn.secondary, btn.sm, "text-red-700")}>
                    <Trash2 className="size-3.5" aria-hidden /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="photo"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void onFile(e.dataTransfer.files?.[0]);
                }}
                className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                {imageBusy ? (
                  <Loader2 className="size-6 animate-spin text-slate-400" aria-hidden />
                ) : (
                  <ImagePlus className="size-6 text-slate-400" aria-hidden />
                )}
                <span className="text-sm font-medium text-slate-700">Upload or take a photo</span>
                <span className="text-xs text-slate-500">JPG or PNG · drag & drop supported</span>
              </label>
            )}
            <FieldError msg={errors.image} />
          </div>
        </Card>

        {/* Description */}
        <Card className="p-4 sm:p-5">
          <div data-field="description">
            <label htmlFor="desc" className="text-sm font-semibold text-slate-900">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              id="desc"
              rows={4}
              maxLength={MAX_DESC}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (e.target.value.trim().length >= 10) setErrors((er) => ({ ...er, description: undefined }));
              }}
              placeholder="e.g. A landslide has blocked one side of the road near Ayun. Traffic is moving one vehicle at a time."
              className={cn(inputCls, "mt-3 resize-y py-2.5 leading-relaxed")}
            />
            <div className="mt-1 flex justify-between">
              <FieldError msg={errors.description} />
              <span className="ml-auto text-[11px] tabular-nums text-slate-400">
                {description.length}/{MAX_DESC}
              </span>
            </div>
          </div>
        </Card>

        {/* Severity */}
        <Card className="p-4 sm:p-5">
          <fieldset data-field="severity">
            <legend className="text-sm font-semibold text-slate-900">
              Severity <span className="text-red-600">*</span>
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
                      setErrors((e) => ({ ...e, severity: undefined }));
                    }}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      active ? cn(meta.soft, "ring-2", meta.ring, "border-transparent") : "border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <span className={cn("flex items-center gap-2 text-sm font-semibold", active ? meta.text : "text-slate-800")}>
                      <span className="size-2.5 rounded-full" style={{ background: meta.hex }} />
                      {meta.label}
                      <SeverityMeter severity={s} className="ml-auto text-slate-400" />
                    </span>
                    <span className="mt-1 block text-[11.5px] leading-snug text-slate-500">{meta.description}</span>
                  </button>
                );
              })}
            </div>
            <FieldError msg={errors.severity} />
          </fieldset>
        </Card>

        {/* Name */}
        <Card className="p-4 sm:p-5">
          <label htmlFor="author" className="text-sm font-semibold text-slate-900">
            Your name <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="author"
            value={author}
            maxLength={40}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Shown on your community post"
            className={cn(inputCls, "mt-3 h-11")}
          />
        </Card>

        <button type="submit" disabled={submitting} className={cn(btn.base, btn.primary, "h-12 w-full text-[15px]")}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden /> Submitting…
            </>
          ) : (
            "Submit Report"
          )}
        </button>
      </div>

      {/* Live preview */}
      <aside className="hidden lg:col-span-2 lg:block">
        <div className="sticky top-20 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
          <Card className="overflow-hidden">
            <div className="aspect-[16/10] bg-slate-100">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-xs text-slate-400">Your photo will appear here</div>
              )}
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">{type ? HAZARD_TYPES[type].label : "Hazard type"}</span>
                {severity && <SeverityBadge severity={severity} />}
              </div>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="size-3.5" aria-hidden /> {locationName || "Location"}
              </p>
              <p className="text-[13px] leading-relaxed text-slate-600">
                {description || "Your description will appear here."}
              </p>
            </div>
          </Card>
          <div className="rounded-xl bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-600/15">
            <p className="font-semibold">Stay safe while reporting</p>
            <p className="mt-1 text-amber-800">
              Never approach a hazard to take a photo. Report from a safe distance. If lives are at risk, call Rescue 1122
              first.
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-2 text-xs font-medium text-red-700">
      {msg}
    </p>
  );
}
