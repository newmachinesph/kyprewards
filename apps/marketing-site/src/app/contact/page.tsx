import type { Metadata } from "next";
import { Clock3, Mail, MapPin, MessagesSquare } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { PageHero, SiteButton, SiteEyebrow } from "@/components/MarketingUi";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumb, organizationId } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about KYPStamping — support for a running shop, anything before you apply, or press. To start a program, use the partner application.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main>
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "Contact KYPStamping",
            description:
              "Talk through a loyalty setup for a Philippine local business.",
            inLanguage: "en-PH",
            mainEntity: { "@id": organizationId },
          },
          breadcrumb([{ name: "Contact", path: "/contact" }]),
        ]}
      />
      <PageHero
        image="/images/hero-contact.webp"
        eyebrow="Questions"
        title="Ask us anything."
        description="Support for a shop already running, a question before you apply, press, or something that does not fit a form. If you are ready to start a program, the application asks better questions than this page can."
      />
      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-[0.62fr_1.38fr]">
          <aside>
            <SiteEyebrow>What happens next</SiteEyebrow>
            <div className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {[
                {
                  icon: Clock3,
                  title: "Within one business day",
                  text: "A teammate reads every note and replies with useful next steps. You get a copy in your own inbox too.",
                },
                {
                  icon: MessagesSquare,
                  title: "A practical conversation",
                  text: "We ask about visits, rewards, staff, and the customer experience—not your software stack.",
                },
                {
                  icon: MapPin,
                  title: "Manila hours",
                  text: "Weekdays, UTC+8. Replies go out the same working day where we can.",
                },
                {
                  icon: Mail,
                  title: "Prefer email?",
                  text: "hello@kypstamping.ph",
                  email: "hello@kypstamping.ph",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-4 py-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--surface)]">
                      <Icon size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                        {"email" in item && item.email ? (
                          <a href={`mailto:${item.email}`} className="font-bold underline underline-offset-2">
                            {item.text}
                          </a>
                        ) : (
                          item.text
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
          <div>
            {/* Most people landing here want to sign up, not ask something.
                Say so once, at the top, rather than letting them fill in the
                wrong form and wait. */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--surface)] p-5">
              <p className="max-w-[46ch] text-sm leading-relaxed">
                <strong className="font-extrabold">Want to start a program?</strong>{" "}
                <span className="text-[var(--muted-strong)]">
                  The partner application takes about three minutes and gets you
                  an answer the same working day.
                </span>
              </p>
              <SiteButton href="/partners">Apply to join</SiteButton>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
