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
        "KYPStamping is a loyalty platform for Philippine local businesses. It combines a customer wallet that runs in the browser, a business and staff workspace, a public page for each shop, and platform administration.",
      ],
      [
        "Is the product live today?",
        "The product is built and running end to end - the API, the background workers, the counter, and the customer wallet - but it is not open to the public yet. The database holds seeded demonstration records rather than real shops, and the paid plans are published without being sellable while we finish onboarding and the legal review.",
      ],
      [
        "Do customers need an app-store download?",
        "No. The customer experience is a Progressive Web App: it opens in a browser and can be saved to a home screen.",
      ],
      [
        "Do we need to replace our POS?",
        "No. A business can begin with QR scanning beside its existing checkout, then connect the register through the API, signed webhooks, or a POS adapter from the Grow plan upward.",
      ],
    ],
  },
  {
    title: "Programs and operations",
    questions: [
      [
        "Which loyalty programs can we run?",
        "Eight formats from one program engine: stamp cards, points and cashback, tiered discounts, memberships, coupons, a reward catalog, prepaid multipasses, and gift cards. Every format is included from the Core plan, and a stamp card runs on the free plan.",
      ],
      [
        "Can multiple locations share a program?",
        "Yes. Grow covers up to three locations and Scale up to ten, with location-level staff, activity, and performance views.",
      ],
      [
        "What happens if the internet drops at the counter?",
        "The counter keeps a signed local queue and shows what is pending. When the connection returns the visits replay through the API, and idempotency keys stop a replayed visit becoming a second stamp.",
      ],
      [
        "Can owners limit staff access?",
        "Yes. Owner, manager, marketer, and counter roles carry distinct permissions, and every privileged action is written to an activity ledger.",
      ],
    ],
  },
  {
    title: "Campaigns and cost",
    questions: [
      [
        "Which messaging channels are included?",
        "The in-app inbox and push are included on every plan. Email campaigns come with the paid tiers - 1,000 a month on Core, 3,000 on Grow, 10,000 on Scale - and none on the free plan. SMS is bought as credits rather than bundled, because it costs real money on every single send and folding it into a price hides that until the invoice. Messaging apps, Viber and WhatsApp, are being connected next; a campaign will try them before falling back to SMS, because they cost a fraction as much to deliver. Sign-in codes, reward notices and data exports are separate from all of this: they always send, on every plan, and never touch an allowance.",
      ],
      [
        "Why is SMS not unlimited?",
        "Every SMS segment costs real money to deliver, every time. Credits and a ₱0.95 rate per 160-character segment keep that visible: you see what a send costs before it goes, instead of finding out on an invoice.",
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
        "Customers can review joined businesses, shared fields, communication choices, loyalty history, exports, and deletion or leave requests in the privacy center of the wallet.",
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
        "No. Platform administration works from aggregate views. Scoped support access is time-limited, reason-bound, and written to the audit ledger.",
      ],
    ],
  },
];

const allQuestions = groups.flatMap((group) => group.questions);

export const metadata: Metadata = {
  title: "Loyalty Platform FAQ",
  description:
    "Answers about KYPStamping setup, digital loyalty programs, customer wallet access, staff operations, SMS and email pricing, privacy, and what is live today.",
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
        description="A practical reference for owners, staff, customers, technical evaluators, and answer engines—including a straight answer about what is running today and what is not."
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
