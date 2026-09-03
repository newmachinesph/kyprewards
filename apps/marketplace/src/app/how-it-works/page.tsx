import type { Metadata } from "next";
import { StampDots } from "@kypstamping/ui";
import { customerAppUrl } from "@/lib/site";
import { ActionLink, Eyebrow, PageIntro, Section } from "@/components/Ui";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Join a shop from its poster, get a welcome stamp marked pending, watch the card read two after your first visit, and approve every reward on your phone.",
  alternates: { canonical: "/how-it-works" },
};

const steps = [
  {
    title: "Join from the poster",
    text: "Scan the code on the poster, sticker or receipt, or open the shop's link, and join with one mobile number. A welcome stamp lands on your card marked pending. On its own it is worth nothing; it is waiting for your first visit. Pending stamps expire after 30 days if the visit never comes, and the date is on the card.",
    filled: 0,
    caption: "One pending stamp",
  },
  {
    title: "Your first visit makes it real",
    text: "Staff scan your own code, or find you by mobile number, from any phone or tablet beside the register. The pending stamp becomes real and the visit earns its own, so the card reads two.",
    filled: 2,
    caption: "The card reads two",
  },
  {
    title: "Every visit after is one scan",
    text: "About three seconds at the counter. A cooldown the shop sets, usually once a day, means a second scan the same day is refused with a plain reason and the time the next stamp is available.",
    filled: 5,
    caption: "One stamp a day, by default",
  },
  {
    title: "You approve the reward",
    text: "When the card fills, the reward is held for you. You approve its release on your phone before staff hand it over, and the card resets and keeps earning. Nothing is lost if you hold several.",
    filled: 8,
    caption: "Held until you say so",
  },
];

const promises = [
  ["One code at every shop", "Your code is yours, not the shop's. It works at every shop you join, saved or printed for when the signal drops."],
  ["Nothing to install", "The wallet runs in your browser and can sit on your home screen like an app. No download for each shop."],
  ["Nothing of value from the poster alone", "The public code grants a membership and a pending stamp. The reward only moves when staff scan your code in person."],
  ["Your data, per shop", "Joining is not consent to marketing. Each shop asks separately, and you can leave a program or withdraw a channel at any time from the wallet."],
];

export default function HowItWorks() {
  return (
    <>
      <PageIntro
        eyebrow="How it works"
        title="From the poster to the reward"
        description="The same card at every shop, with the same rules on every plan. Here is what happens, in order."
      />
      <Section className="py-12 lg:py-16">
        <ol className="grid gap-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="grid gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center"
            >
              <span className="font-mono text-sm font-bold text-[var(--muted)]">0{index + 1}</span>
              <div>
                <h2 className="text-xl font-bold tracking-[-0.01em] sm:text-2xl">{step.title}</h2>
                <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-[var(--muted-strong)] sm:text-base">
                  {step.text}
                </p>
              </div>
              <div className="lg:justify-self-end">
                <StampDots filled={step.filled} total={8} />
                <p className="mt-2 text-xs font-semibold text-[var(--muted)]">{step.caption}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
      <Section className="border-t border-[var(--line)] py-12 lg:py-16">
        <Eyebrow>What stays true</Eyebrow>
        <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
          {promises.map(([label, text]) => (
            <div key={label} className="bg-[var(--surface)] p-6">
              <dt className="font-bold">{label}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">{text}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <ActionLink href="/discover">Find a shop</ActionLink>
          <ActionLink href={`${customerAppUrl}/login`} tone="outline">
            Open my wallet
          </ActionLink>
        </div>
      </Section>
    </>
  );
}
