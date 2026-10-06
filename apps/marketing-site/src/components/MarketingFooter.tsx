import Link from "next/link";
import { BrandMark } from "@kypstamping/ui";
import { ArrowUpRight } from "lucide-react";
import { businessAppUrl } from "@/lib/site";

const groups = [
  {
    title: "Explore",
    links: [
      ["Product", "/product"],
      ["Features", "/features"],
      ["Integrations", "/integrations"],
      ["Solutions", "/solutions"],
      ["Pricing", "/pricing"],
      ["Roadmap", "/roadmap"],
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
      ["Milk tea & dessert", "/solutions/milk-tea-and-dessert"],
      ["Sari-sari & convenience", "/solutions/sari-sari-and-convenience"],
    ],
  },
  {
    title: "Compare",
    links: [
      ["All comparisons", "/compare"],
      ["vs ZAP", "/compare/zap"],
      ["vs Qashier Treats", "/compare/qashier"],
      ["vs StoreHub", "/compare/storehub"],
      ["vs Suki Cards", "/compare/suki-cards"],
      ["vs GoBalik", "/compare/gobalik"],
      ["Complete FAQ", "/faq"],
    ],
  },
  {
    title: "For merchants",
    links: [
      ["Apply to join", "/partners"],
      ["Business sign in", `${businessAppUrl}/login`],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Resources", "/resources"],
      ["Contact", "/contact"],
      ["Facebook page", "https://www.facebook.com/kypstamping"],
    ],
  },
  // Its own column rather than two links at the end of Company. A merchant
  // deciding whether to put their customer list on this platform reads these,
  // and burying the data sharing terms under "Company" hides the answer.
  {
    title: "Legal",
    links: [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Merchant agreement", "/merchant-terms"],
      ["Data sharing", "/data-sharing"],
      ["Sub-processors", "/subprocessors"],
      ["Cookies", "/cookies"],
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="band border-t border-[var(--line)]">
      <div className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1400px] gap-12 py-14 md:grid-cols-[1.1fr_1.9fr] lg:py-20">
        <div>
          <BrandMark />
          <p className="mt-5 max-w-[31ch] text-sm leading-relaxed text-[var(--muted-strong)]">
            The simple loyalty layer for businesses people love returning to.
          </p>
          {/* Two facts the site already states, as pills: what it costs and
              what it needs. */}
          <div className="mt-5 flex flex-wrap gap-2">
            {["Free to start, unlimited customers", "Nothing to install"].map(
              (fact) => (
                <span
                  key={fact}
                  className="shadow-soft rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-bold text-[var(--accent-strong)]"
                >
                  {fact}
                </span>
              ),
            )}
          </div>
          <Link
            href="/contact"
            className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full text-sm font-bold text-[var(--accent-strong)]"
          >
            Talk to KYP Rewards <ArrowUpRight size={15} />
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
      </div>
      <div className="border-t border-[var(--line)] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 py-5 text-[11px] font-semibold text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 KYP Rewards.</span>
          <span>Built in Manila, for Philippine businesses.</span>
        </div>
      </div>
    </footer>
  );
}
