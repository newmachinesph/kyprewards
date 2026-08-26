import type { Metadata } from "next";
import {
  MarketingCta,
  PageHero,
  SiteButton,
  SiteEyebrow,
} from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumb } from "@/lib/schema";

const groups = [
  {
    title: "Getting started",
    questions: [
      [
        "What is KYPStamping?",
        "KYPStamping is a loyalty platform concept for Philippine local businesses. It combines a customer PWA, business and staff workspace, public business website, and platform administration experience.",
      ],
      [
        "Is the product live today?",
        "This build is a complete frontend demo powered by local JSON data. It is designed to validate navigation, workflows, pricing, and visual direction before the FastAPI backend and delivery providers are connected.",
      ],
      [
        "Do customers need an app-store download?",
        "No. The customer experience is a Progressive Web App: it opens in a browser and can be saved to a home screen.",
      ],
      [
        "Do we need to replace our POS?",
        "No. A business can begin with QR scanning beside its existing checkout. POS and commerce adapters are planned for the Scale tier.",
      ],
    ],
  },
  {
    title: "Programs and operations",
    questions: [
      [
        "Which loyalty programs can we run?",
        "The demo supports stamps, cashback, discounts, membership, coupons, points-based rewards, multipass, and gift certificates.",
      ],
      [
        "Can multiple locations share a program?",
        "Yes. Grow models up to three locations and Scale up to ten, with location-level staff, activity, and performance views.",
      ],
      [
        "What happens if the internet drops at the counter?",
        "The business demo includes an offline queue and reconciliation state. Production must sign events, prevent duplicates, and replay them through the shared API when connectivity returns.",
      ],
      [
        "Can owners limit staff access?",
        "Yes. The demo includes owner, manager, marketer, and counter roles with distinct permissions and an activity ledger.",
      ],
    ],
  },
  {
    title: "Campaigns and cost",
    questions: [
      [
        "Which messaging channels are included?",
        "Campaign planning covers the in-app inbox, web push, email, Viber, and SMS. Campaigns reach customers on Viber before falling back to SMS, which lowers delivery cost without losing reach. WhatsApp and Messenger are planned and require a verified Meta Business account before they can be built.",
      ],
      [
        "Why is SMS not unlimited?",
        "Every SMS segment has a real delivery cost. KYPStamping models credits and ₱0.95 overage per 160-character segment so a campaign cannot quietly destroy product margin.",
      ],
      [
        "Are push notifications free?",
        "The provider delivery layer can be free, but consent, orchestration, support, and abuse prevention still have operating cost. KYPStamping includes push under a fair-use policy.",
      ],
      [
        "How do I know whether a campaign will pay back?",
        "The composer shows audience size, estimated channel cost, predicted visits, predicted revenue, and return on campaign spend before scheduling.",
      ],
    ],
  },
  {
    title: "Privacy and control",
    questions: [
      [
        "Who controls customer information?",
        "Customers can review joined businesses, shared fields, communication choices, loyalty history, exports, and deletion or leave requests in the PWA demo.",
      ],
      [
        "Does KYPStamping guarantee legal compliance?",
        "No software alone can guarantee compliance. The product is designed to support consent records, purpose limitation, objections, access control, audit history, exports, and deletion workflows; each operator still needs appropriate legal and operational review.",
      ],
      [
        "Can service and promotional messages be separated?",
        "Yes. Reward and account updates are presented separately from promotional push, email, SMS, and nearby reminders.",
      ],
      [
        "Can an administrator read every customer profile?",
        "The admin demo uses aggregate views. Scoped support access is time-limited, reason-bound, and written to the audit ledger.",
      ],
    ],
  },
];

const allQuestions = groups.flatMap((group) => group.questions);

export const metadata: Metadata = {
  title: "Loyalty Platform FAQ",
  description:
    "Answers about KYPStamping setup, digital loyalty programs, customer PWA access, staff operations, SMS and email pricing, privacy, and the frontend demo.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <main>
      <StructuredData data={breadcrumb([{ name: "FAQ", path: "/faq" }])} />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: allQuestions.map(([question, answer]) => ({
            "@type": "Question",
            name: question,
            acceptedAnswer: { "@type": "Answer", text: answer },
          })),
        }}
      />
      <PageHero
        image="/images/hero-pricing.webp"
        eyebrow="Buyer and operator answers"
        title="Everything important, answered plainly."
        description="A practical reference for owners, staff, customers, technical evaluators, and answer engines—without hiding the fact that this release is a frontend demo."
      >
        <SiteButton href="/pricing">See transparent pricing</SiteButton>
        <SiteButton href="/contact" tone="outline">
          Ask another question
        </SiteButton>
      </PageHero>
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-14 lg:grid-cols-[260px_1fr]">
          <aside>
            <SiteEyebrow>Quick answer</SiteEyebrow>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted-strong)]">
              KYPStamping is designed to make loyalty clear at the counter, useful
              between visits, controllable by customers, and economically
              sustainable for the platform.
            </p>
          </aside>
          <div className="space-y-14">
            {groups.map((group) => (
              <section key={group.title}>
                <h2 className="text-2xl font-extrabold tracking-[-0.02em]">
                  {group.title}
                </h2>
                <div className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                  {group.questions.map(([question, answer]) => (
                    <details key={question} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-extrabold">
                        <span>{question}</span>
                        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--line-strong)] transition group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-[var(--muted-strong)]">
                        {answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
      <MarketingCta
        title="See the whole relationship, not just the stamp."
        description="Explore the product direction or walk through the complete local demo with your team."
      />
    </main>
  );
}
