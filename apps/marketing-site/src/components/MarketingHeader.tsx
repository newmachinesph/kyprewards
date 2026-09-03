"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandMark } from "@kypstamping/ui";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { businessAppUrl } from "@/lib/site";

const links = [
  { href: "/product", label: "Product" },
  { href: "/features", label: "Features" },
  { href: "/integrations", label: "Integrations" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/partners", label: "Partners" },
];

export function MarketingHeader({
  businessUrl,
}: {
  businessUrl: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgb(250_248_243/88%)] backdrop-blur-xl">
      {/* Padding outside the 1400px box, which is how every section on the
          site is built. Inside it, the gutter came out of the content instead
          of off the edge, so the nav sat 64px narrower than everything under
          it and nothing lined up down the left. */}
      <div className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-4 min-[1360px]:gap-6">
        <Link href="/" className="focus-ring shrink-0 rounded-xl">
          <BrandMark />
        </Link>
        <nav
          className="hidden items-center gap-0.5 min-[1360px]:flex"
          aria-label="Primary navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-1 min-[1360px]:flex">
          <a
            href={businessUrl}
            className="focus-ring shrink-0 whitespace-nowrap rounded-full px-3 py-2.5 text-sm font-bold text-[var(--muted-strong)] transition hover:text-[var(--ink)]"
          >
            Business sign in
          </a>
          <Link
            href={`${businessAppUrl}/create-account`}
            className="focus-ring ml-1 inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--surface)] shadow-[0_2px_0_rgb(24_18_12/16%)] transition hover:-translate-y-0.5 hover:bg-[var(--ink-soft)] active:translate-y-0 active:scale-[0.98]"
          >
            Start your program <ArrowUpRight size={16} />
          </Link>
        </div>
        <button
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="focus-ring ml-auto grid size-11 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] min-[1360px]:hidden"
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      </div>
      {open && (
        <div className="border-t border-[var(--line)] bg-[var(--surface)] px-4 sm:px-6 lg:px-8 min-[1360px]:hidden">
          {/* Held to the same container as the row above. This panel now
              covers laptop widths too, and buttons stretched across 1300px
              read as a mistake rather than a menu. */}
          <nav
            className="mx-auto max-w-[1400px] py-4"
            aria-label="Site navigation"
          >
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-bold hover:bg-[var(--surface-2)]"
              >
                {link.label}
              </Link>
            ))}
            </div>
            <div className="mt-4 grid gap-2 border-t border-[var(--line)] pt-4 sm:grid-cols-2">
              <a
                href={businessUrl}
                className="focus-ring flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-5 text-sm font-bold"
              >
                Business sign in
              </a>
              <Link
                href={`${businessAppUrl}/create-account`}
                onClick={() => setOpen(false)}
                className="focus-ring flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--surface)]"
              >
                Start your program
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
