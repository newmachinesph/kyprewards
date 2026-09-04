import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The terms for using a KYP wallet: what KYP does, what the shop is responsible for, and how a card can end.",
  alternates: { canonical: "/terms" },
};

/**
 * The shopper's terms.
 *
 * The distinction that matters throughout: KYP keeps the count, the shop
 * gives the reward. Merchant terms on kypstamping.ph govern the shop's side
 * of that and are not these.
 */
const sections: LegalSection[] = [
  {
    title: "What this covers",
    paragraphs: [
      "These terms are between you and KYP Solutions, who operate KYP, and they cover the wallet at app.kyp.ph and this directory at kyp.ph. They do not govern what any shop sells you — that is between you and the shop.",
      "Using a KYP wallet is free. There is nothing to buy here and no subscription.",
    ],
  },
  {
    title: "Your wallet",
    paragraphs: [
      "One wallet belongs to one person, identified by one mobile number. Signing in is a one-time code, so keeping access to that number is what keeps the wallet yours.",
      "You must be old enough to enter a contract on your own, or have a parent or guardian agree for you.",
      "Your member code is not a secret and is not a payment instrument. It identifies you to a counter; it cannot spend anything on its own, and a reward is only handed over after you approve it on your own phone.",
    ],
  },
  {
    title: "What KYP does, and what the shop does",
    paragraphs: [
      "KYP keeps the count. Every stamp, reward and redemption is recorded here, and the record is what a dispute is settled against.",
      "The shop sets the rules and gives the reward. How many stamps a card takes, what the reward is, whether there is a minimum spend, how long stamps last and when a card's run ends are the shop's choices, shown to you on the card before you join.",
      "A reward is a promise from the shop, not from KYP. If a shop closes, stops using KYP, or refuses to honour something it offered, KYP can show you the record of what you earned, but it cannot make the shop serve you.",
    ],
  },
  {
    title: "Stamps and rewards",
    paragraphs: [
      "A stamp is earned at the counter, by staff, on a real visit. The welcome stamp a poster offers is marked pending until your first visit confirms it — on its own it is worth nothing, and a screenshot of it is not a voucher.",
      "Cards can carry limits the shop set: at most one stamp a day, a minimum spend, an expiry, an end date for the run, and a cap on how many times one person can complete the same card. Whatever applies is written on the card.",
      "An earned reward is held until you claim it. It is never spent automatically, and claiming it needs your approval on your own screen.",
      "Stamps and rewards have no cash value, cannot be exchanged for money, and are not transferable between people except where a shop switches on gifting.",
    ],
  },
  {
    title: "When a card ends",
    paragraphs: [
      "A shop can set an end date for a card's run. When it closes, unfinished stamps either expire or carry over to the next card, whichever the shop chose — and the card says which before you join.",
      "Rewards you already earned are honoured for a grace period after the run ends, so finishing a card on the last day does not cost you the reward.",
      "If a shop leaves KYP, its cards stop earning. You keep the record of what you earned and can export it.",
    ],
  },
  {
    title: "Fair use",
    paragraphs: [
      "Do not try to earn stamps for visits that did not happen, hold more than one wallet to claim a welcome stamp twice, or interfere with the service or other people's accounts.",
      "A shop can remove a member from its own programme, and KYP can close a wallet, where there is genuine evidence of this. Where it is a mistake rather than abuse, we will say what we saw and give you a chance to answer.",
    ],
  },
  {
    title: "Leaving",
    paragraphs: [
      "You can leave a shop from its card, or delete your wallet entirely from Profile, at any time, without asking anyone. Leaving a shop closes that card and any unclaimed reward on it.",
      "Deleting the wallet removes your details as described in the privacy notice.",
    ],
  },
  {
    title: "What KYP does not promise",
    paragraphs: [
      "The service is provided as it is. We work to keep it available and accurate, but we do not promise it will never be down or never make a mistake.",
      "Where something does go wrong, KYP's responsibility is limited to correcting the record of what you earned. Since the wallet is free, there is no fee to refund. Nothing here limits liability that the law does not allow to be limited.",
    ],
  },
  {
    title: "Changes, and the law that applies",
    paragraphs: [
      "If these terms change materially, the wallet will tell you before the change applies to you.",
      "Philippine law applies, and Philippine courts have jurisdiction. Nothing here removes a right the Consumer Act or the Data Privacy Act gives you.",
      "Questions go to support@kyp.ph.",
    ],
  },
];

export default function MarketplaceTermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Using a KYP wallet"
      summary="KYP keeps the count; the shop gives the reward. These terms say which is which, what your card can and cannot do, and how to leave."
      updated="4 September 2026"
      sections={sections}
    />
  );
}
