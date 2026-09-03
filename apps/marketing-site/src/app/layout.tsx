import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { MarketingFooter } from "@/components/MarketingFooter";
import { MarketingHeader } from "@/components/MarketingHeader";
import { StructuredData } from "@/components/StructuredData";
import { businessAppUrl, siteUrl } from "@/lib/site";
import { ApiProvider } from "@kypstamping/api";

import "./globals.css";


const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "KYP Stamping",
  title: {
    default: "KYP Stamping — Digital Loyalty for Philippine Shops",
    template: "%s | KYP Stamping",
  },
  description:
    "Free digital stamp cards for Philippine cafés, salons, restaurants and shops. Unlimited customers, nothing to install, no POS to replace. Priced in pesos.",
  keywords: [
    "loyalty program Philippines",
    "digital stamp card Philippines",
    "customer loyalty software Philippines",
    "loyalty app for small business",
    "digital punch card",
    "customer retention Philippines",
    "cafe loyalty program",
    "salon loyalty program",
    "restaurant loyalty program",
    "SMS loyalty campaign Philippines",
    "Data Privacy Act loyalty program",
    "loyalty program pricing peso",
  ],
  authors: [{ name: "KYP Stamping", url: siteUrl }],
  creator: "KYP Stamping",
  publisher: "KYP Stamping",
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
    title: "KYP Stamping — Loyalty, made local",
    description:
      "Turn one visit into the next. A digital loyalty program Philippine shops can start free, with unlimited customers and nothing to install.",
    url: siteUrl,
    siteName: "KYP Stamping",
    type: "website",
    locale: "en_PH",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "KYP Stamping loyalty program receipt and return-visit ledger",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KYP Stamping — Loyalty, made local",
    description:
      "Turn one visit into the next. Free to start, unlimited customers, nothing to install.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-PH" className={`${inter.variable} ${sora.variable} ${GeistMono.variable}`}>
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
                name: "KYP Stamping",
                alternateName: ["KYPStamping", "KYP"],
                url: siteUrl,
                description:
                  "A digital loyalty platform designed for Philippine local businesses.",
                // Entity anchors: generative engines resolve the company from
                // these, so keep them factual — no invented profiles or offices.
                logo: {
                  "@type": "ImageObject",
                  url: `${siteUrl}/icon.svg`,
                },
                image: `${siteUrl}/opengraph-image`,
                areaServed: { "@type": "Country", name: "Philippines" },
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "Manila",
                  addressCountry: "PH",
                },
                email: "hello@kypstamping.ph",
                knowsLanguage: ["en-PH", "fil"],
                knowsAbout: [
                  "Customer loyalty programs",
                  "Digital stamp cards",
                  "Customer retention for small businesses",
                  "Loyalty program pricing in the Philippines",
                  "Data privacy for customer records",
                ],
                contactPoint: [
                  {
                    "@type": "ContactPoint",
                    contactType: "sales",
                    email: "hello@kypstamping.ph",
                    url: `${siteUrl}/partners`,
                    areaServed: "PH",
                    availableLanguage: ["en", "fil"],
                  },
                  {
                    "@type": "ContactPoint",
                    contactType: "customer support",
                    email: "hello@kypstamping.ph",
                    url: `${siteUrl}/contact`,
                    areaServed: "PH",
                    availableLanguage: ["en", "fil"],
                  },
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": `${siteUrl}/#website`,
                url: siteUrl,
                name: "KYP Stamping",
                publisher: { "@id": `${siteUrl}/#organization` },
                inLanguage: "en-PH",
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "@id": `${siteUrl}/#software`,
                name: "KYP Stamping",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
                description:
                  "Customer loyalty software with customer PWA, business operations, multichannel campaigns, analytics, and platform administration.",
                offers: {
                  "@type": "Offer",
                  name: "Launch",
                  price: 0,
                  priceCurrency: "PHP",
                  availability: "https://schema.org/InStock",
                  url: `${siteUrl}/pricing`,
                },
                provider: { "@id": `${siteUrl}/#organization` },
              },
            ]}
          />
          <MarketingHeader businessUrl={`${businessAppUrl}/login`} />
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
          <MarketingFooter />
        </ApiProvider>
      </body>
    </html>
  );
}
