import type { Metadata } from "next";
import Link from "next/link";
import { HandCoins, HeartHandshake, Rocket } from "lucide-react";
import { PartnerIntake } from "@/components/partner-intake/PartnerIntake";
import { SiteEyebrow } from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumb, organizationId } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Apply to Join — Free for Founding Merchants",
  description:
    "Start a loyalty program for your shop. Three minutes, no documents, no card. We read every application and set your first program up before you sign in.",
  alternates: { canonical: "/partners" },
  openGraph: {
    title: "Apply to join KYP Rewards — free during beta",
    description:
      "Three minutes, no documents, no card. A person sets your first program up with you.",
    url: "/partners",
    locale: "en_PH",
    type: "website",
  },
};

const REASSURANCE = [
  {
    icon: Rocket,
    title: "Free now, and Core free for three months later",
    detail:
      "The paid plans are not open yet, so everyone is on the free one: no card, no trial clock, unlimited customers and unlimited branches. When they open, founding merchants get Core free for three months. You keep your program and your customer list whatever you decide afterwards.",
  },
  {
    icon: HeartHandshake,
    title: "We set the first program up",
    detail:
      "A person reads this and configures your first program from these answers before you sign in. Approval usually comes the same working day, so the wait is short.",
  },
  {
    icon: HandCoins,
    title: "Your customers, not ours",
    detail:
      "Every customer you sign up stays yours. Export the whole list any day.",
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
            name: "Become a KYP Rewards partner",
            description:
              "Apply to run a loyalty program for a Philippine local business on KYP Rewards.",
            inLanguage: "en-PH",
            isPartOf: { "@id": organizationId },
          },
          breadcrumb([{ name: "Become a partner", path: "/partners" }]),
        ]}
      />

      {/* Deliberately shorter than the other page heroes. Somebody who has
          reached this page has already decided to look; the job now is to
          get them into the form, not to sell again. */}
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-partners.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-[center_38%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(250_248_243/62%)_0%,rgb(250_248_243/88%)_42%,rgb(250_248_243/95%)_72%,var(--paper)_100%)]"
        />
        <div className="relative mx-auto max-w-[760px] px-4 pb-10 pt-16 text-center sm:px-6 lg:px-8 lg:pt-20">
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
        {/* The other direction from /contact's pointer here. Somebody with a
            question should not have to fill in an application to ask it. */}
        <p className="mx-auto mt-10 max-w-[760px] text-center text-sm text-[var(--muted-strong)]">
          Not ready to apply, or just have a question?{" "}
          <Link
            href="/contact"
            className="font-extrabold text-[var(--accent-strong)] underline underline-offset-2"
          >
            Ask us instead
          </Link>
          .
        </p>
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
