import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { HazardStoreProvider } from "@/lib/store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Chitral Safe — Environmental hazard awareness",
    template: "%s · Chitral Safe",
  },
  description:
    "Community-powered platform to report, discover and understand environmental hazards in Chitral, Pakistan.",
};

export const viewport: Viewport = {
  themeColor: "#1d554d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <HazardStoreProvider>
          <AppShell>{children}</AppShell>
        </HazardStoreProvider>
      </body>
    </html>
  );
}
