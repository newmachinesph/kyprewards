"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandMark } from "@stampr/ui";
import { ArrowUpRight, Menu, X } from "lucide-react";

const links = [
  { href: "/product", label: "Product" },
  { href: "/features", label: "Features" },
  { href: "/integrations", label: "Integrations" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
];

export function MarketingHeader({ businessUrl }: { businessUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgb(250_248_243/88%)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="focus-ring rounded-xl"
        >
          <BrandMark />
        </Link>
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Primary navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring rounded-full px-3.5 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <a
            href={businessUrl}
            className="focus-ring rounded-full px-4 py-2.5 text-sm font-bold text-[var(--muted-strong)] transition hover:text-[var(--ink)]"
          >
            Business sign in
          </a>
          <Link
            href="/contact"
            className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--surface)] shadow-[0_2px_0_rgb(24_18_12/16%)] transition hover:-translate-y-0.5 hover:bg-[var(--ink-soft)] active:translate-y-0 active:scale-[0.98]"
          >
            Start your program <ArrowUpRight size={16} />
          </Link>
        </div>
        <button
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="focus-ring ml-auto grid size-11 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] lg:hidden"
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-[var(--line)] bg-[var(--surface)] p-4 lg:hidden">
          <nav className="space-y-1" aria-label="Mobile navigation">
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
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="focus-ring mt-3 flex min-h-11 items-center justify-center rounded-xl border border-[var(--ink)] bg-[var(--ink)] px-5 text-sm font-extrabold text-[var(--surface)]"
            >
              Start your program
            </Link>
            <a
              href={businessUrl}
              className="focus-ring flex min-h-11 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-5 text-sm font-bold"
            >
              Business sign in
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
