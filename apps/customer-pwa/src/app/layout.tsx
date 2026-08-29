import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { ApiProvider } from "@kypstamping/api";

import "./globals.css";


const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "KYPStamping",
  description: "Keep every local reward in one pocket.",
  applicationName: "KYPStamping",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "KYPStamping" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#faf8f3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body>
        <ApiProvider>{children}</ApiProvider>
      </body>
    </html>
  );
}
