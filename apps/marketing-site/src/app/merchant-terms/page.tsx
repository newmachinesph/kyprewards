import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Merchant agreement",
  description:
    "The agreement between KYP Rewards and a business running a loyalty program on the platform.",
  alternates: { canonical: "/merchant-terms" },
};

/**
 * The business-facing half of the terms.
 *
 * `/terms` covers customers, businesses and staff in one document, which is
 * readable but conflates two different relationships: a customer accepts terms
 * to hold a card, a merchant enters a commercial arrangement about other
 * people's personal data. The second needs saying separately, because it is
 * where the obligations that actually bite live — who answers a customer's
 * privacy request, who owns the reward liability, what happens to the member
 * list when the shop leaves.
 */
const sections = [
  {
    title: "What this covers",
    paragraphs: [
      "This agreement applies to a business that operates a loyalty program through KYP Rewards, and to the staff accounts it authorizes. It sits alongside the general terms; where the two differ on a business matter, this document governs.",
      "Accepting an invitation, opening a workspace, or running a program is acceptance of these terms by the business.",
    ],
  },
  {
    title: "Each side's role with customer data",
    paragraphs: [
      "A customer's account belongs to the customer and lives on the platform, not inside any one shop. When a customer joins your program they choose to share a defined set of details with you, and from that moment both KYP Rewards and your business make decisions about that data.",
      "That makes each of us responsible in our own right rather than one of us acting purely on the other's instructions. What each side may do is set out in the data sharing terms.",
    ],
    bullets: [
      "You may use member data to run the program the customer joined: recognizing them at the counter, awarding and redeeming value, and messaging them within the consent they gave.",
      "You may not sell member data, share it outside your business, or use it for a purpose the customer was not told about when they joined.",
      "A customer who leaves your program stops being visible to you. Their account, and their membership of any other shop, is unaffected.",
      "You must pass on any privacy request you receive that concerns platform-held data, and we will do the same for requests that concern yours.",
    ],
  },
  {
    title: "Running a program honestly",
    paragraphs: [
      "The reward you publish is a promise to the customer, and it is your promise. KYP Rewards records and enforces the mechanics; the obligation to honor a completed card is yours.",
    ],
    bullets: [
      "Reward terms must be stated before a customer starts earning, and must not be changed in a way that removes value somebody has already earned.",
      "A program that ends must let existing holders redeem what they have already completed, or must compensate them fairly.",
      "Stamps, points, passes and stored balances are not legal tender and carry no cash value unless you say otherwise in writing.",
      "Gift cards and prepaid balances are money your customers have already paid you. Local rules on expiry and forfeiture apply to you, not to us.",
    ],
  },
  {
    title: "Staff, counters and reversals",
    paragraphs: [
      "Every stamp, redemption and reversal is recorded against the staff member or credential that performed it. You are responsible for who holds those credentials.",
    ],
    bullets: [
      "Remove access promptly when a team member leaves. A suspended staff account cannot transact.",
      "Reversals exist for genuine error. Using them to withdraw value a customer legitimately earned is a breach of these terms.",
      "You are responsible for activity performed with your integration credentials, including from a point-of-sale system you connect.",
    ],
  },
  {
    title: "Messaging your members",
    paragraphs: [
      "Marketing messages go only to members who have given consent for that channel, and the platform enforces that. Quiet hours and frequency caps apply on every plan.",
    ],
    bullets: [
      "Consent is per channel and per person. A customer who accepts email has not accepted SMS.",
      "Transactional messages — a code, a receipt, a reward notice — are not marketing and are not suppressed by a marketing opt-out.",
      "You are responsible for the content you send and for complying with the rules on unsolicited commercial messages.",
      "SMS is charged per segment from credits you buy; no plan includes SMS. Sending stops at your credit balance and at any spend ceiling you set.",
    ],
  },
  {
    title: "Sending SMS from your own phone",
    paragraphs: [
      "From Core upwards, once the companion app is released, you can install it to send your messages from your own handset, using your own SIM and your own load, instead of paying a per-message fee to us. It is Android only, because iOS does not permit an app to send SMS.",
      "When you send this way you are the sender, not us. The message leaves your number, under your telco's terms, and the responsibility for it is yours.",
    ],
    bullets: [
      "Consumer unlimited-text promotions are generally sold for personal use. Using one for bulk commercial messaging may breach your telco's terms, and the usual consequence is that your number is blocked for spam. Check what your plan permits before you rely on it.",
      "Philippine rules on SIM registration and on unsolicited commercial messages apply to you as the sender.",
      "The consent, quiet-hours and frequency rules the platform enforces still apply. Sending is queued and checked here before it reaches your phone.",
      "A handset sends slowly and carriers throttle bursts, so a large send takes time. This route suits a timely message to a modest list, not a mass promotion.",
      "If your phone is off, out of load, or out of signal, messages wait. On Grow and above they fall back to our gateway against your SMS credits; below that they stay queued until the phone is reachable.",
      "Sign-in codes are never sent this way. They are platform authentication, they must work whether or not your phone is on, and the person signing in may not be your customer at all.",
    ],
  },
  {
    title: "Fees, plans and the free tier",
    paragraphs: [
      "Plan prices, allowances and inclusions are published on the pricing page and may change with reasonable advance notice. Paid plans are billed for the selected period plus applicable taxes.",
      "The free plan is offered without charge and without a customer limit. It is not a perpetual commitment: we may change what it includes, and if we do we will give notice and a reasonable path to continue — including exporting your data if you decide not to stay.",
    ],
    bullets: [
      "Metered channels carry a real per-message cost. Campaign email beyond your plan's allowance is billed as used; SMS is billed per segment from credits you buy, on every plan.",
      "Fees already paid are non-refundable except where the law requires otherwise or we have said otherwise in writing.",
      "Cancelling stops future renewal. It does not delete your data immediately; see the section below.",
    ],
  },
  {
    title: "Ending the arrangement",
    paragraphs: [
      "Either side may end this agreement. What matters is what happens to the people in the middle.",
    ],
    bullets: [
      "You can export your member list, transaction history and reward liability at any time while the workspace is open, on every plan including the free one.",
      "After closure we retain workspace data for a limited window so it can be restored or exported, then delete or anonymize it.",
      "Customers keep their accounts and their memberships of other businesses. Closing your workspace ends your program, not their wallet.",
      "We may suspend a workspace immediately where there is fraud, a security risk, or a legal requirement, and will explain why where we lawfully can.",
    ],
  },
  {
    title: "Liability, and what is still being settled",
    paragraphs: [
      "To the fullest extent permitted by law, the platform is provided without guarantees beyond those expressly stated here. We are not liable for the reward decisions you make, for losses arising from a third-party service you connect, or for indirect or consequential loss.",
      "These terms govern the free beta and are complete for it. Four clauses are deliberately still open: governing law, dispute resolution, limitation amounts and the contracting entity. They are being settled with qualified Philippine counsel alongside our incorporation, and we would rather leave them blank than state something we would have to change. Nothing is being charged during the beta, and we will give notice before these become paid terms.",
      "Questions about this agreement can be sent to hello@kypstamping.ph.",
    ],
  },
];

export default function MerchantTermsPage() {
  return (
    <LegalPage
      path="/merchant-terms"
      eyebrow="For businesses"
      title="Merchant agreement"
      summary="The terms for a business running a loyalty program on KYP Rewards: what you may do with member data, what your reward promise obliges, and what happens to both when the arrangement ends."
      effective="2 September 2026"
      sections={sections}
    />
  );
}
