import type { Metadata } from "next";
import { HandCoins, HeartHandshake, Rocket } from "lucide-react";
import { PartnerIntake } from "@/components/partner-intake/PartnerIntake";
import { SiteEyebrow } from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumb, organizationId } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Become a partner",
  description:
    "Apply to run your loyalty program on KYPStamping. Three minutes, no documents, no card — we verify from your Google Maps or Facebook page.",
  alternates: { canonical: "/partners" },
};

const REASSURANCE = [
  {
    icon: Rocket,
    title: "Free while we are in beta",
    detail:
      "No card, no trial clock. You keep your program and your customer list whatever you decide afterwards.",
  },
  {
    icon: HeartHandshake,
    title: "We set the first program up",
    detail:
      "You will not open an empty dashboard. It arrives configured to the answers you give here.",
  },
  {
    icon: HandCoins,
    title: "Your customers, not ours",
    detail:
      "Every customer you sign up stays yours. Export the whole list any day, in one click.",
  },
];

export default function PartnersPage() {
  return (
    <main>
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Become a KYPStamping partner",
            description:
              "Apply to run a loyalty program for a Philippine local business on KYPStamping.",
            inLanguage: "en-PH",
            isPartOf: { "@id": organizationId },
          },
          breadcrumb([{ name: "Become a partner", path: "/partners" }]),
        ]}
      />

      {/* Deliberately shorter than the other page heroes. Somebody who has
          reached this page has already decided to look; the job now is to
          get them into the form, not to sell again. */}
      <section className="site-grid border-b border-[var(--line)]">
        <div className="mx-auto max-w-[760px] px-4 pb-10 pt-16 text-center sm:px-6 lg:px-8 lg:pt-20">
          <SiteEyebrow>Become a partner</SiteEyebrow>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            Tell us about your shop.
          </h1>
          <p className="mx-auto mt-5 max-w-[46ch] text-[17px] leading-relaxed text-[var(--muted-strong)]">
            Twelve questions, about three minutes. No documents to upload and
            no card to enter — we verify your business the same way your
            customers find it.
          </p>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <PartnerIntake />
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--surface)] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-[1000px] gap-8 sm:grid-cols-3">
          {REASSURANCE.map((item) => (
            <div key={item.title}>
              <span className="grid size-11 place-items-center rounded-2xl bg-[var(--surface-2)]">
                <item.icon size={19} className="text-[var(--accent-strong)]" />
              </span>
              <h2 className="mt-5 text-base font-extrabold">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
