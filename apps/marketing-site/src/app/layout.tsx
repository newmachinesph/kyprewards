import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { MarketingFooter } from "@/components/MarketingFooter";
import { MarketingHeader } from "@/components/MarketingHeader";
import { StructuredData } from "@/components/StructuredData";
import { businessAppUrl, customerAppUrl, siteUrl } from "@/lib/site";
import { ApiProvider } from "@kypstamping/api";

import "./globals.css";


const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "KYPStamping",
  title: { default: "KYPStamping — Loyalty, made local", template: "%s | KYPStamping" },
  description:
    "A digital loyalty platform for Philippine local businesses, their staff, and the customers who keep coming back.",
  keywords: [
    "loyalty program Philippines",
    "customer loyalty software",
    "digital stamp card",
    "customer retention",
    "loyalty PWA",
    "SMS loyalty campaign",
    "email loyalty marketing",
    "local business Philippines",
  ],
  authors: [{ name: "KYPStamping", url: siteUrl }],
  creator: "KYPStamping",
  publisher: "KYPStamping",
  category: "business software",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "KYPStamping — Loyalty, made local",
    description: "Turn everyday visits into lasting customer relationships.",
    url: siteUrl,
    siteName: "KYPStamping",
    type: "website",
    locale: "en_PH",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "KYPStamping loyalty program receipt and return-visit ledger",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KYPStamping — Loyalty, made local",
    description: "Turn everyday visits into lasting customer relationships.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${GeistMono.variable}`}>
      <body>
        <ApiProvider>
          <a
            href="#main-content"
            className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-bold text-[var(--paper)] shadow-xl transition focus:translate-y-0"
          >
            Skip to content
          </a>
          <StructuredData
            data={[
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "@id": `${siteUrl}/#organization`,
                name: "KYPStamping",
                alternateName: "KYP Stamping",
                url: siteUrl,
                description:
                  "A digital loyalty platform designed for Philippine local businesses.",
                // Entity anchors: generative engines resolve the company from
                // these, so keep them factual — no invented profiles or offices.
                areaServed: { "@type": "Country", name: "Philippines" },
                address: { "@type": "PostalAddress", addressCountry: "PH" },
                knowsLanguage: ["en-PH", "fil"],
                knowsAbout: [
                  "Customer loyalty programs",
                  "Digital stamp cards",
                  "Customer retention for small businesses",
                  "Loyalty program pricing in the Philippines",
                  "Data privacy for customer records",
                ],
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "sales",
                  url: `${siteUrl}/contact`,
                  areaServed: "PH",
                  availableLanguage: ["en", "fil"],
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": `${siteUrl}/#website`,
                url: siteUrl,
                name: "KYPStamping",
                publisher: { "@id": `${siteUrl}/#organization` },
                inLanguage: "en-PH",
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "@id": `${siteUrl}/#software`,
                name: "KYPStamping",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                description:
                  "Customer loyalty software with customer PWA, business operations, multichannel campaigns, analytics, and platform administration.",
                offers: {
                  "@type": "AggregateOffer",
                  lowPrice: 0,
                  highPrice: 3490,
                  priceCurrency: "PHP",
                  offerCount: 4,
                },
                provider: { "@id": `${siteUrl}/#organization` },
              },
            ]}
          />
          <MarketingHeader
            businessUrl={`${businessAppUrl}/login`}
            customerUrl={`${customerAppUrl}/login`}
          />
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
          <MarketingFooter />
        </ApiProvider>
      </body>
    </html>
  );
}
