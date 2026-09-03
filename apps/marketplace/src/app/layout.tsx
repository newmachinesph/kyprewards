import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { ApiProvider } from "@kypstamping/api";
import { siteUrl } from "@/lib/site";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

import "./globals.css";

const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const description =
  "One card for every shop you already visit. Find the shops around you with a live rewards program, join from the poster, and keep every card in one wallet.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "KYP — rewards from the shops around you", template: "%s · KYP" },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "KYP — rewards from the shops around you",
    description,
    url: siteUrl,
    siteName: "KYP",
    locale: "en_PH",
    type: "website",
  },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body className="flex min-h-[100dvh] flex-col">
        {/* No session here: the provider is only the query client the public hooks read through. */}
        <ApiProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </ApiProvider>
      </body>
    </html>
  );
}
