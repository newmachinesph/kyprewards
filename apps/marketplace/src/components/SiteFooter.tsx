import Link from "next/link";
import { BrandMark } from "@kypstamping/ui";
import { customerAppUrl, merchantSiteUrl } from "@/lib/site";

const groups = [
  {
    title: "Shoppers",
    links: [
      ["Discover shops", "/discover"],
      ["How it works", "/how-it-works"],
      ["Open my wallet", `${customerAppUrl}/login`],
    ],
  },
  {
    title: "Shops",
    links: [
      ["For shops", "/for-shops"],
      ["I run a shop", `${merchantSiteUrl}/partners`],
    ],
  },
  {
    title: "Legal",
    links: [
      // kyp.ph's own, written for shoppers. The merchant notice on
      // kyprewards.com is about workspaces, staff and billing - not the
      // document a person joining a stamp card should be reading.
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Cookies", "/cookies"],
    ],
  },
];

const linkClass =
  "focus-ring block w-fit rounded-md text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--ink)]";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-10 py-12 md:grid-cols-[1.2fr_1.8fr] lg:py-16">
          <div>
            <BrandMark label="KYP" tagline="Rewards from the shops around you" />
            <p className="mt-5 max-w-[34ch] text-sm leading-relaxed text-[var(--muted-strong)]">
              One card for every shop you already visit. Nothing to install, nothing to carry.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {group.title}
                </p>
                <div className="mt-4 space-y-3">
                  {group.links.map(([label, href]) =>
                    href.startsWith("http") ? (
                      <a key={href} href={href} className={linkClass}>
                        {label}
                      </a>
                    ) : (
                      <Link key={href} href={href} className={linkClass}>
                        {label}
                      </Link>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--line)] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 py-5 text-[11px] font-semibold text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 KYP.</span>
          <span>Shops across the Philippines.</span>
        </div>
      </div>
    </footer>
  );
}
