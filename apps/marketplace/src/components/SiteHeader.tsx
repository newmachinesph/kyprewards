"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandMark } from "@kypstamping/ui";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { customerAppUrl } from "@/lib/site";

const links = [
  { href: "/discover", label: "Discover" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-shops", label: "For shops" },
];

const walletUrl = `${customerAppUrl}/login`;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgb(250_248_243/88%)] backdrop-blur-xl">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center gap-6">
          <Link href="/" className="focus-ring shrink-0 rounded-xl" aria-label="KYP home">
            <BrandMark label="KYP" tagline="Rewards from the shops around you" />
          </Link>
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="focus-ring whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <a
            href={walletUrl}
            className="focus-ring ml-auto hidden min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)] shadow-[0_2px_0_rgb(24_18_12/16%)] transition hover:-translate-y-0.5 hover:bg-[var(--ink-soft)] md:inline-flex"
          >
            Open my wallet <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
            className="focus-ring ml-auto grid size-11 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] md:hidden"
          >
            {open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open && (
        <div
          id="site-menu"
          className="border-t border-[var(--line)] bg-[var(--surface)] px-4 sm:px-6 md:hidden"
        >
          <nav className="mx-auto max-w-[1200px] py-4" aria-label="Site navigation">
            <div className="grid gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="focus-ring block rounded-xl px-3 py-3 text-sm font-bold hover:bg-[var(--surface-2)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <a
              href={walletUrl}
              className="focus-ring mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--paper)]"
            >
              Open my wallet <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
