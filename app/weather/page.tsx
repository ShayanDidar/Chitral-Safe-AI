import type { Metadata } from "next";
import { Suspense } from "react";
import { WeatherView } from "@/components/weather/WeatherView";

export const metadata: Metadata = { title: "Weather" };

export default function WeatherPage() {
  return (
    <Suspense>
      <WeatherView />
    </Suspense>
  );
}
