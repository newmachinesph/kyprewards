import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Data sharing",
  description:
    "What moves between KYPStamping and a business when a customer joins its program, and who is answerable for what.",
  alternates: { canonical: "/data-sharing" },
};

/**
 * The relationship the privacy notice implies but never states.
 *
 * A customer's account is held centrally and a merchant sees the members who
 * joined them, so personal data genuinely moves between two parties who each
 * decide things about it. Under the Data Privacy Act that arrangement is
 * expected to be written down. This page is the public-facing summary of it;
 * the executed agreement with each merchant is the instrument that binds.
 */
const sections = [
  {
    title: "Why this page exists",
    paragraphs: [
      "A KYPStamping account belongs to the customer and works at every business they join - one card, many shops. That design is the point of the product, and it means a customer's details are held by us and, for the shops they choose, seen by those shops too.",
      "Both sides therefore decide things about the same personal data. The Data Privacy Act of 2012 (Republic Act No. 10173) expects that arrangement to be documented rather than assumed, and this page says publicly what the agreement with each merchant says privately.",
    ],
  },
  {
    title: "What a business sees, and when",
    paragraphs: [
      "Nothing is shared because a shop exists. Sharing begins when the customer joins that shop's program, and ends when they leave it.",
    ],
    bullets: [
      "On joining: the customer's name, their member code, and the profile details they chose to make visible.",
      "While a member: their activity with that business only - visits, stamps, points, rewards earned and redeemed, gift card and pass balances, and the channels they consented to.",
      "Contact details only where the customer consented to that channel for that business.",
      "Never: their activity at any other business, their password or credentials, their full account history, or the fact that they are a member anywhere else.",
    ],
  },
  {
    title: "What each side is answerable for",
    paragraphs: [
      "Neither party is simply acting on the other's instructions, so responsibility is split rather than delegated.",
    ],
    bullets: [
      "KYPStamping is answerable for the account itself: identity, authentication, the central record, retention, security of the platform, and honoring rights requests over platform-held data.",
      "The business is answerable for what it does with what it sees: the program it runs, the messages it sends, the staff it authorizes, and any copy it exports and holds itself.",
      "An exported file leaves our control. From the moment a business downloads its member list, that copy is the business's responsibility alone.",
      "Each side must tell the other promptly about a request, complaint or incident that touches the other's part.",
    ],
  },
  {
    title: "A customer's rights, and where to send them",
    paragraphs: [
      "A data subject may exercise their rights against either party. In practice it is usually easier to start with us, because we hold the account.",
      "Rights under the Act include being informed, access, objection, correction, erasure or blocking, data portability, damages, and lodging a complaint with the National Privacy Commission.",
    ],
    bullets: [
      "Requests about an account, its history, or removal from the platform: send to us at hello@kypsolutions.com.ph, or use the privacy center in the customer app.",
      "Requests about a specific shop's own records or messages: the shop is the right first stop, and we will pass on anything that reaches us.",
      "Leaving a business's program stops further sharing immediately and removes the customer from that business's member list.",
      "We may verify identity before acting, and will say so rather than going silent.",
    ],
  },
  {
    title: "Security, incidents and breach notification",
    paragraphs: [
      "Both sides are expected to protect what they hold with measures appropriate to the risk. On our side that means encrypted transport, access scoped to a single workspace, an audit record of privileged actions, and staff access that can be revoked.",
      "Where a security incident affects personal data and is likely to give rise to a real risk to the people involved, the Act requires notification to the National Privacy Commission and to affected data subjects within seventy-two hours of knowledge. We commit to that, and we expect a merchant to tell us without delay about an incident affecting data they received from us.",
    ],
  },
  {
    title: "Onward transfer",
    paragraphs: [
      "We use a small number of service providers to deliver messages, take payments, store files and monitor errors. They act on our instructions and are listed publicly on the sub-processors page.",
      "A business may not pass member data to its own third parties without a lawful basis and a clear notice to the customer. Selling member data is prohibited outright by the merchant agreement.",
    ],
  },
  {
    title: "Status of this document",
    paragraphs: [
      "This is a working draft published for transparency while the platform is pre-launch. The executed data sharing agreement, the appointment and contact details of the Data Protection Officer, and any registration with the National Privacy Commission will be settled with qualified Philippine counsel before commercial launch, and this page will be updated to match.",
      "Questions can be sent to hello@kypsolutions.com.ph.",
    ],
  },
];

export default function DataSharingPage() {
  return (
    <LegalPage
      path="/data-sharing"
      eyebrow="Between us and your shop"
      title="Data sharing"
      summary="One card works at every business a customer joins, so their details are held by us and seen by the shops they choose. This is what moves, when it moves, and who answers for it."
      effective="2 September 2026"
      sections={sections}
    />
  );
}
