import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { siteUrl } from "@/lib/site";

import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "KYP — rewards from the shops around you",
  description:
    "One card for every shop you already visit. Collect stamps, points and rewards across Metro Manila without an app for each one.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "KYP — rewards from the shops around you",
    description:
      "One card for every shop you already visit. Coming soon across Metro Manila.",
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
      <body>{children}</body>
    </html>
  );
}
