import type { Metadata } from "next";
import { Anybody } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import ClearLegacyServiceWorker from "@/components/ClearLegacyServiceWorker";
import AthleteAuthProvider from "@/components/AthleteAuthProvider";
import SavedRacesProvider from "@/components/SavedRacesProvider";
import { MarketplaceSearchProvider } from "@/components/MarketplaceSearchProvider";
import AppShell from "@/components/AppShell";
import MarketplacePageMetrics from "@/components/MarketplacePageMetrics";
import ProfileCompletionModal from "@/components/ProfileCompletionModal";
import IniciarMetaPixel from "@/components/IniciarMetaPixel";
import { MARKETPLACE_HOST } from "@/lib/races";

/** Wide display sans (OFL) — closest free stand-in for Joyride Ext. */
const anybody = Anybody({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-anybody",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${MARKETPLACE_HOST}`),
  title: {
    default: "Dorsalia",
    template: "%s · Dorsalia",
  },
  description: "Descubre carreras y eventos deportivos en México. Inscríbete y encuentra tu próxima meta.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: "Dorsalia",
    description: "Marketplace de carreras y eventos deportivos.",
    type: "website",
    locale: "es_MX",
    images: [{ url: "/images/marketplace-hero.webp", width: 1200, height: 800 }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const bare = h.get("x-dorsalia-chrome") === "off";

  return (
    <html lang="es" className={anybody.variable}>
      <body className={`antialiased bg-black text-white${bare ? " overflow-hidden" : ""}`}>
        {bare ? (
          <>
            <ClearLegacyServiceWorker />
            {children}
          </>
        ) : (
          <AthleteAuthProvider>
            <MarketplacePageMetrics />
            <IniciarMetaPixel />
            <ProfileCompletionModal />
            <SavedRacesProvider>
              <MarketplaceSearchProvider>
                <ClearLegacyServiceWorker />
                <AppShell>{children}</AppShell>
              </MarketplaceSearchProvider>
            </SavedRacesProvider>
          </AthleteAuthProvider>
        )}
      </body>
    </html>
  );
}
