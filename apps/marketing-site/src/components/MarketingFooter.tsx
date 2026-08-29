import Link from "next/link";
import { BrandMark } from "@kypstamping/ui";
import { ArrowUpRight } from "lucide-react";
import { businessAppUrl, customerAppUrl } from "@/lib/site";

const groups = [
  {
    title: "Explore",
    links: [
      ["Product", "/product"],
      ["Features", "/features"],
      ["Integrations", "/integrations"],
      ["Solutions", "/solutions"],
      ["Pricing", "/pricing"],
      ["PH loyalty guide", "/loyalty-program-philippines"],
    ],
  },
  {
    title: "Industries",
    links: [
      ["Cafés & bakeries", "/solutions/cafes-and-bakeries"],
      ["Salons & wellness", "/solutions/salons-and-wellness"],
      ["Restaurants", "/solutions/restaurants"],
      ["Independent retail", "/solutions/retail"],
    ],
  },
  {
    title: "Compare",
    links: [
      ["All comparisons", "/compare"],
      ["vs GoBalik", "/compare/gobalik"],
      ["vs Suki Cards", "/compare/suki-cards"],
      ["vs ZAP", "/compare/zap"],
      ["Complete FAQ", "/faq"],
    ],
  },
  {
    title: "Open the demo",
    links: [
      ["Customer wallet", `${customerAppUrl}/login`],
      ["Business workspace", `${businessAppUrl}/login`],
      ["All four apps", "/product#apps"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Resources", "/resources"],
      ["Contact", "/contact"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_1.9fr] lg:px-8 lg:py-20">
        <div>
          <BrandMark />
          <p className="mt-5 max-w-[31ch] text-sm leading-relaxed text-[var(--muted-strong)]">
            The simple loyalty layer for businesses people love returning to.
          </p>
          <Link
            href="/contact"
            className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full text-sm font-bold text-[var(--accent-strong)]"
          >
            Talk to KYPStamping <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--muted)]">
                {group.title}
              </p>
              <div className="mt-4 space-y-3">
                {group.links.map(([label, href]) =>
                  href.startsWith("http") ? (
                    <a
                      key={href}
                      href={href}
                      className="focus-ring block w-fit rounded-md text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--ink)]"
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      key={href}
                      href={href}
                      className="focus-ring block w-fit rounded-md text-sm font-semibold text-[var(--muted-strong)] transition hover:text-[var(--ink)]"
                    >
                      {label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-5 text-[11px] font-semibold text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© 2026 KYPStamping. Loyalty, made local.</span>
          <span>Built for neighborhood businesses everywhere.</span>
        </div>
      </div>
    </footer>
  );
}
