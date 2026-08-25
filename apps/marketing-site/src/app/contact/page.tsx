import type { Metadata } from "next";
import { Clock3, Mail, MapPin, MessagesSquare } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { PageHero, SiteEyebrow } from "@/components/MarketingUi";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to Stampr about launching or improving a loyalty program for your local business.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main>
      <PageHero
        eyebrow="Talk to the team"
        title="Tell us how customers return today."
        description="We’ll help you shape a program around the rhythm, reward, and counter workflow that already make sense for your business."
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
                  text: "A teammate reads every note and replies with useful next steps.",
                },
                {
                  icon: MessagesSquare,
                  title: "A practical conversation",
                  text: "We ask about visits, rewards, staff, and the customer experience—not your software stack.",
                },
                {
                  icon: MapPin,
                  title: "Singapore time zone",
                  text: "Remote conversations are available across Southeast Asia and beyond.",
                },
                {
                  icon: Mail,
                  title: "Prefer email?",
                  text: "hello@stampr.com",
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
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
