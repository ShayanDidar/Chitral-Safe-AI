import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Naskh_Arabic } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { HazardStoreProvider } from "@/lib/store";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Urdu UI font (Naskh stays readable at small UI sizes)
const urdu = Noto_Naskh_Arabic({
  variable: "--font-urdu",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${urdu.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <LanguageProvider>
          <HazardStoreProvider>
            <AppShell>{children}</AppShell>
          </HazardStoreProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
