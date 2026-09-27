"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { BASE_LAYERS, MAP_CONFIG } from "@/lib/mapConfig";
import type { LatLng } from "@/types";
import { pickIcon } from "./markerIcons";

export interface LocationPickerProps {
  value: LatLng | null;
  onPick: (p: LatLng) => void;
}

export default function LocationPickerInner({ value, onPick }: LocationPickerProps) {
  return (
    <MapContainer
      center={value ? [value.lat, value.lng] : MAP_CONFIG.center}
      zoom={value ? 12 : 8}
      minZoom={MAP_CONFIG.minZoom}
      maxBounds={MAP_CONFIG.maxBounds}
      scrollWheelZoom={false}
      className="h-full w-full cursor-crosshair"
    >
      <TileLayer
        url={BASE_LAYERS[0].url}
        attribution={BASE_LAYERS[0].attribution}
        subdomains={BASE_LAYERS[0].subdomains ?? "abc"}
      />
      <ClickHandler onPick={onPick} />
      <Recenter value={value} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pickIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = e.target.getLatLng();
              onPick({ lat: +p.lat.toFixed(5), lng: +p.lng.toFixed(5) });
            },
          }}
        />
      )}
    </MapContainer>
  );
}

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5) }),
  });
  return null;
}

function Recenter({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (!value) return;
    const inView = map.getBounds().pad(-0.15).contains([value.lat, value.lng]);
    if (!inView) map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 11), { duration: 0.6 });
  }, [value, map]);
  return null;
}
