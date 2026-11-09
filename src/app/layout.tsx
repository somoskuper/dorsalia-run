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
import FirstPasswordGate from "@/components/FirstPasswordGate";
import ProfileCompletionModal from "@/components/ProfileCompletionModal";
import IniciarMetaPixel from "@/components/IniciarMetaPixel";
import { MARKETPLACE_HOST } from "@/lib/races";
import Script from "next/script";

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://dorsalia.run/#software",
  name: "Dorsalia.run",
  alternateName: ["Dorsalia México", "Dorsalia Run"],
  url: "https://dorsalia.run",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS",
  description: "Plataforma de gestión de eventos deportivos, venta de boletos e inscripciones en línea en México.",
  areaServed: {
    "@type": "Country",
    name: "Mexico",
  },
  publisher: {
    "@type": "Organization",
    "@id": "https://dorsalia.run/#organization",
    name: "Dorsalia",
    legalName: "Dorsalia",
    url: "https://dorsalia.run",
    address: {
      "@type": "PostalAddress",
      addressCountry: "MX",
    },
    sameAs: [
      "https://www.instagram.com/dorsalia.run",
      "https://www.facebook.com/dorsalia.run",
    ],
  },
} as const;

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
        <Script id="dorsalia-gtm-datalayer" strategy="beforeInteractive">
          {`window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments); }\ngtag('js', new Date());\ngtag('config', 'G-SNKH387NQT');`}
        </Script>
        <Script
          id="dorsalia-ga4-loader"
          src="https://www.googletagmanager.com/gtag/js?id=G-SNKH387NQT"
          strategy="beforeInteractive"
        />
        <Script
          id="dorsalia-gtm-loader"
          src="https://www.googletagmanager.com/gtm.js?id=GTM-N2388NHB"
          strategy="beforeInteractive"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationSchema).replace(/</g, "\\u003c"),
          }}
        />
        {bare ? (
          <>
            <ClearLegacyServiceWorker />
            {children}
          </>
        ) : (
          <AthleteAuthProvider>
            <MarketplacePageMetrics />
            <IniciarMetaPixel />
            <FirstPasswordGate>
            <ProfileCompletionModal />
            <SavedRacesProvider>
              <MarketplaceSearchProvider>
                <ClearLegacyServiceWorker />
                <AppShell>{children}</AppShell>
              </MarketplaceSearchProvider>
            </SavedRacesProvider>
            </FirstPasswordGate>
          </AthleteAuthProvider>
        )}
      </body>
    </html>
  );
}
