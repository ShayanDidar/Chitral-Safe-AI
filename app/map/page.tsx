import type { Metadata } from "next";
import { Suspense } from "react";
import { LiveMapView } from "@/components/map/LiveMapView";

export const metadata: Metadata = { title: "Live Map" };

export default function MapPage() {
  return (
    <Suspense>
      <LiveMapView />
    </Suspense>
  );
}
