"use client";

import dynamic from "next/dynamic";
import { MapPinned } from "lucide-react";
import type { MapViewProps } from "./MapViewInner";
import type { LocationPickerProps } from "./LocationPickerInner";

function MapSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center bg-slate-100">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <MapPinned className="size-4 animate-pulse" aria-hidden /> Loading map…
      </div>
    </div>
  );
}

/** Leaflet needs `window`, so maps are loaded client-side only (and lazily). */
export const MapView = dynamic<MapViewProps>(() => import("./MapViewInner"), {
  ssr: false,
  loading: MapSkeleton,
});

export const LocationPicker = dynamic<LocationPickerProps>(() => import("./LocationPickerInner"), {
  ssr: false,
  loading: MapSkeleton,
});

export { MapLegend } from "./MapLegend";
