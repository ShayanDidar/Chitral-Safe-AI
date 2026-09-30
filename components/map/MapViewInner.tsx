"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import Link from "next/link";
import L from "leaflet";
import { Circle, LayersControl, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { featuredLocations } from "@/data/locations";
import { ArrowRight, Lock, MapPin } from "lucide-react";
import { BASE_LAYERS, MAP_CONFIG } from "@/lib/mapConfig";
import { HAZARD_TYPES } from "@/lib/hazards";
import { CRIME_HEX, CRIME_ICONS } from "@/lib/crime";
import { ReviewBadge, SeverityBadge, btn } from "@/components/ui/primitives";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Report } from "@/types";
import { placeIcon, reportIcon } from "./markerIcons";

export interface MapViewProps {
  reports: Report[];
  /** Admin map: show review status and confidential markers. */
  admin?: boolean;
  /** Highlighted marker. */
  selectedId?: string | null;
  /** Fly to a report and open its popup; change `key` to repeat. */
  flyTo?: { id: string; key: number } | null;
  /** Compact = dashboard preview: no scroll-zoom, no layer switcher. */
  compact?: boolean;
  /** Static = small detail map for a single report. */
  interactive?: boolean;
  center?: [number, number];
  zoom?: number;
  className?: string;
  onSelect?: (id: string) => void;
  /** Show labelled featured places (Kalash, Shandur, …). */
  showPlaces?: boolean;
  /** Pan to a point (e.g. a featured place); change `key` to repeat. */
  flyToPoint?: { lat: number; lng: number; zoom: number; key: number } | null;
}

export default function MapViewInner({
  reports,
  admin = false,
  selectedId,
  flyTo,
  compact = false,
  interactive = true,
  center,
  zoom,
  className,
  onSelect,
  showPlaces = false,
  flyToPoint,
}: MapViewProps) {
  const markers = useRef(new Map<string, L.Marker>());

  return (
    <MapContainer
      center={center ?? MAP_CONFIG.center}
      zoom={zoom ?? MAP_CONFIG.zoom}
      minZoom={MAP_CONFIG.minZoom}
      maxZoom={MAP_CONFIG.maxZoom}
      maxBounds={MAP_CONFIG.maxBounds}
      scrollWheelZoom={!compact && interactive}
      dragging={interactive}
      zoomControl={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      className={cn("h-full w-full", className)}
    >
      {compact || !interactive ? (
        <TileLayer
          url={BASE_LAYERS[0].url}
          attribution={BASE_LAYERS[0].attribution}
          subdomains={BASE_LAYERS[0].subdomains ?? "abc"}
        />
      ) : (
        <LayersControl position="topright">
          {BASE_LAYERS.map((layer, i) => (
            <LayersControl.BaseLayer key={layer.name} name={layer.name} checked={i === 0}>
              <TileLayer
                url={layer.url}
                attribution={layer.attribution}
                subdomains={layer.subdomains ?? "abc"}
                maxZoom={layer.maxZoom ?? MAP_CONFIG.maxZoom}
              />
            </LayersControl.BaseLayer>
          ))}
        </LayersControl>
      )}

      {/* Approximate (privacy-protected) locations are shown as an area, not a precise point. */}
      {reports
        .filter((r) => r.approximate)
        .map((r) => (
          <Circle
            key={`area-${r.id}`}
            center={[r.coordinates.lat, r.coordinates.lng]}
            radius={700}
            pathOptions={{ color: CRIME_HEX, weight: 1, fillOpacity: 0.12, dashArray: "4 4" }}
          />
        ))}

      {reports.map((r) => (
        <Marker
          key={r.id}
          position={[r.coordinates.lat, r.coordinates.lng]}
          icon={reportIcon(r, r.id === selectedId, admin)}
          zIndexOffset={r.id === selectedId ? 1000 : r.kind === "hazard" && r.severity === "critical" ? 500 : 0}
          ref={(m) => {
            if (m) markers.current.set(r.id, m);
            else markers.current.delete(r.id);
          }}
          eventHandlers={{ click: () => onSelect?.(r.id) }}
        >
          {interactive && (
            <Popup>
              <ReportPopup report={r} admin={admin} />
            </Popup>
          )}
        </Marker>
      ))}

      {showPlaces && <PlaceMarkers />}
      <FocusController flyTo={flyTo} markers={markers} interactive={interactive} />
      <PointController point={flyToPoint} />
      <AutoResize />
    </MapContainer>
  );
}

function ReportPopup({ report, admin }: { report: Report; admin: boolean }) {
  const Icon = report.kind === "hazard" ? HAZARD_TYPES[report.type].icon : CRIME_ICONS[report.category];
  const { t, dir, label, place, report: localize } = useI18n();
  const text = localize(report);
  return (
    <div dir={dir}>
      {report.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={report.imageUrl} alt={text.title} className="h-32 w-full object-cover" />
      )}
      <div className="space-y-2 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-900">
            <Icon className="size-4 text-slate-500" aria-hidden />
            {label(report)}
          </span>
          {report.kind === "hazard" ? (
            <SeverityBadge severity={report.severity} />
          ) : (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{ background: CRIME_HEX }}>
              {t("crime.badge")}
            </span>
          )}
        </div>
        {admin && (
          <div className="flex flex-wrap items-center gap-1.5">
            <ReviewBadge review={report.review} />
            {report.visibility === "confidential" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-white">
                <Lock className="size-3" aria-hidden /> {t("visibility.confidential")}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="size-3.5" aria-hidden />
          <span className="font-medium text-slate-700">{place(report.locationName)}</span>
          <span>·</span>
          <TimeAgo iso={report.reportedAt} />
        </div>
        {report.approximate && <p className="text-[11px] text-slate-500">{t("crime.approxNote")}</p>}
        <p dir="auto" className="line-clamp-3 text-[13px] text-slate-600">
          {text.description}
        </p>
        <Link href={`/reports/${report.id}`} className={cn(btn.base, btn.primary, btn.sm, "w-full !text-white")}>
          {t("common.viewReportCta")} <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

function PlaceMarkers() {
  const { t, place, lang } = useI18n();
  return (
    <>
      {featuredLocations().map(({ id, loc, note, noteUr }) => (
        <Marker key={id} position={[loc.coordinates.lat, loc.coordinates.lng]} icon={placeIcon} zIndexOffset={-100}>
          <Tooltip direction="right" offset={[8, 0]} permanent className="place-label">
            {place(loc.name)}
          </Tooltip>
          <Popup>
            <div className="space-y-1.5 p-3.5" dir={lang === "ur" ? "rtl" : "ltr"}>
              <p className="text-sm font-semibold text-slate-900">{place(loc.name)}</p>
              <p className="text-[13px] text-slate-600">{lang === "ur" ? noteUr : note}</p>
              <p className="text-xs text-slate-500">
                {t("places.elevation", { m: loc.elevationM.toLocaleString("en") })}
              </p>
              <Link href={`/weather?place=${id}`} className="inline-block text-xs font-semibold text-brand-700 hover:underline">
                {t("places.weather")}
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function PointController({ point }: { point?: { lat: number; lng: number; zoom: number; key: number } | null }) {
  const map = useMap();
  const key = point?.key;
  useEffect(() => {
    if (!point) return;
    map.flyTo([point.lat, point.lng], point.zoom, { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

function FocusController({
  flyTo,
  markers,
  interactive,
}: {
  flyTo?: { id: string; key: number } | null;
  markers: React.RefObject<Map<string, L.Marker>>;
  interactive: boolean;
}) {
  const map = useMap();
  const id = flyTo?.id;
  const key = flyTo?.key;
  useEffect(() => {
    if (!id) return;
    const marker = markers.current.get(id);
    if (!marker) return;
    const target = marker.getLatLng();
    map.flyTo(target, Math.max(map.getZoom(), 12), { duration: 0.8 });
    if (interactive) map.once("moveend", () => marker.openPopup());
  }, [id, key, map, markers, interactive]);
  return null;
}

function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}
