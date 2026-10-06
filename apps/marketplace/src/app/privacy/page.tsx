import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What KYP holds about you when you join a shop's loyalty card, who can see it, and how to get it back or delete it.",
  alternates: { canonical: "/privacy" },
};

/**
 * The shopper's notice.
 *
 * kyprewards.com carries the merchant one, written for somebody running a
 * shop - workspaces, staff accounts, billing, exports. A person who joined a
 * stamp card is a different reader with a different set of rights, and
 * sending them to the merchant notice to agree to it was asking consent to
 * the wrong document.
 *
 * Everything here describes what the API and the wallet actually do today.
 * Nothing describes a feature that is not switched on.
 */
const sections: LegalSection[] = [
  {
    title: "What KYP holds about you",
    paragraphs: [
      "A wallet is deliberately thin. Joining a shop needs a mobile number and nothing else; a name, an email address and a birthday are each optional and each asked for a stated reason.",
    ],
    bullets: [
      "Your mobile number, which is how you sign in and how a counter finds your card.",
      "Your name, if you gave one, so staff can greet you rather than read a number aloud.",
      "Your email address, if you gave one, as a second way to sign in.",
      "Your password, stored only as a one-way hash that cannot be turned back into the password. Nobody at KYP or at a shop can read it. A one-time code to your number or address is used only to prove it is yours: when you join, set a password or reset it.",
      "If you sign in with Google or Apple, the email address and name they share with KYP, and nothing else from that account.",
      "The day and month of your birthday, if you gave them, so a shop can offer you something. Never the year.",
      "Your member code — the number on your card, which staff scan.",
      "Your visits and rewards at each shop you joined: when a stamp was earned, when a reward was claimed, and at which branch.",
      "Which channels you allow each shop to reach you on, and every time you changed that.",
    ],
  },
  {
    title: "What KYP does not hold",
    paragraphs: [
      "No card or bank details. Shoppers never pay KYP anything, so there is nothing to store. If a shop takes payment, that happens at the counter and KYP is not part of it.",
      "No location history. The marketplace can sort shops by distance, and it asks for your position only when you tap the button. That position stays in the browser tab and is never sent to KYP or kept.",
      "No tracking of you across other websites, and no advertising profile.",
    ],
  },
  {
    title: "Who can see it",
    paragraphs: [
      "A shop sees the members of that shop. It does not see the other shops you have joined, what you spend anywhere else, or that you are a member anywhere else at all. Each membership is separate.",
      "Staff at a shop see your name, member code, and your progress and rewards at that shop, because that is what serving you at the counter needs.",
      "KYP staff can see the data needed to run the platform and answer support, and privileged access is recorded.",
    ],
  },
  {
    title: "Why KYP is allowed to hold it",
    paragraphs: [
      "Under the Data Privacy Act of 2012, the basis is the agreement you make when you join: a loyalty card cannot count your visits without recording them. Optional details — a birthday, an email address, a marketing channel — rest on your consent, which is why each one is optional and each one is reversible.",
    ],
  },
  {
    title: "How long it is kept",
    paragraphs: [
      "Your wallet and its history are kept while your account is open. Leave a shop and that membership's card closes; delete your account and the personal details go with it.",
      "Some records are kept after that where the law requires it — a shop's own sales records are the shop's obligation, not yours to erase.",
    ],
  },
  {
    title: "Messages you get",
    paragraphs: [
      "Sign-in codes are sent because you asked to sign in. Everything else is a choice you make per shop and can change at any time from Profile, in the wallet.",
      "A shop can only reach you on a channel you left on. Turning one off takes effect immediately and does not need the shop's agreement.",
    ],
  },
  {
    title: "Your rights, and how to use them",
    paragraphs: [
      "The Data Privacy Act gives you the right to know what is held, to correct it, to object to how it is used, to have it erased, and to take a copy with you. All of it is in the wallet rather than behind an email request.",
    ],
    bullets: [
      "See and change your details: Profile in the wallet.",
      "Change what a shop may send you: Profile, then the shop.",
      "Leave a shop: the card's own screen. The membership closes and the shop stops seeing you.",
      "Take a copy: Profile, then Export. The file is yours, machine-readable.",
      "Delete your account: Profile, then Delete. This removes the wallet and its memberships.",
      "Anything you cannot do yourself, or a complaint: privacy@kyp.ph.",
    ],
  },
  {
    title: "Where the data lives",
    paragraphs: [
      "KYP runs on servers in Singapore, the nearest region to the Philippines, and the data is transferred there to be processed. It is not sold, and it is not shared with anyone beyond the providers that run the service — hosting, the SMS network that carries your sign-in code, and email delivery.",
    ],
  },
  {
    title: "Who operates KYP",
    paragraphs: [
      "KYP is the party responsible for the personal information described here. Questions, requests and complaints go to privacy@kyp.ph and are answered on weekdays, Manila time.",
      "If you are not satisfied with the answer, you may raise it with the National Privacy Commission.",
    ],
  },
  {
    title: "Changes to this notice",
    paragraphs: [
      "If this notice changes in a way that affects what is collected or who sees it, the wallet will say so before the change applies to you, rather than quietly updating a page nobody re-reads.",
    ],
  },
];

export default function MarketplacePrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="What we hold, and what you can do about it"
      summary="You joined a loyalty card, not a data platform. This is the whole of what KYP keeps about you, who can see it, and how to take it back."
      updated="19 September 2026"
      sections={sections}
    />
  );
}
