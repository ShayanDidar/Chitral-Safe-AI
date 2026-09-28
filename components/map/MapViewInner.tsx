"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import Link from "next/link";
import L from "leaflet";
import { LayersControl, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { ArrowRight, MapPin } from "lucide-react";
import { BASE_LAYERS, MAP_CONFIG } from "@/lib/mapConfig";
import { HAZARD_TYPES } from "@/lib/hazards";
import { SeverityBadge, btn } from "@/components/ui/primitives";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { HazardReport } from "@/types";
import { hazardIcon } from "./markerIcons";

export interface MapViewProps {
  reports: HazardReport[];
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
}

export default function MapViewInner({
  reports,
  selectedId,
  flyTo,
  compact = false,
  interactive = true,
  center,
  zoom,
  className,
  onSelect,
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

      {reports.map((r) => (
        <Marker
          key={r.id}
          position={[r.coordinates.lat, r.coordinates.lng]}
          icon={hazardIcon(r, r.id === selectedId)}
          zIndexOffset={r.id === selectedId ? 1000 : r.severity === "critical" ? 500 : 0}
          ref={(m) => {
            if (m) markers.current.set(r.id, m);
            else markers.current.delete(r.id);
          }}
          eventHandlers={{ click: () => onSelect?.(r.id) }}
        >
          {interactive && (
            <Popup>
              <ReportPopup report={r} />
            </Popup>
          )}
        </Marker>
      ))}

      <FocusController flyTo={flyTo} markers={markers} interactive={interactive} />
      <AutoResize />
    </MapContainer>
  );
}

function ReportPopup({ report }: { report: HazardReport }) {
  const meta = HAZARD_TYPES[report.type];
  const Icon = meta.icon;
  const { t, dir, hazard, place, report: localize } = useI18n();
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
            {hazard(report.type)}
          </span>
          <SeverityBadge severity={report.severity} />
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="size-3.5" aria-hidden />
          <span className="font-medium text-slate-700">{place(report.locationName)}</span>
          <span>·</span>
          <TimeAgo iso={report.reportedAt} />
        </div>
        <p className="line-clamp-3 text-[13px] text-slate-600">{text.description}</p>
        <Link
          href={`/reports/${report.id}`}
          className={cn(btn.base, btn.primary, btn.sm, "w-full !text-white")}
        >
          {t("common.viewReportCta")} <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
        </Link>
      </div>
    </div>
  );
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
