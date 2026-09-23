import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { ApiProvider } from "@kypstamping/api";

import "./globals.css";


const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const sora = Sora({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "KYP Rewards Business",
  description: "Run your loyalty program from one calm workspace.",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
  robots: { index: false, follow: false },
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
