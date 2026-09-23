import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How KYP Rewards handles customer, business, staff, and website visitor information.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Information KYP Rewards receives",
    paragraphs: [
      "KYP Rewards receives information people provide when creating an account, joining a business program, operating a business workspace, contacting support, or using the public website.",
    ],
    bullets: [
      "Account details such as name, email address, mobile number, and birthday when provided.",
      "Business details such as name, category, location, operating hours, team membership, and program settings.",
      "Loyalty activity such as joined programs, stamps, rewards, redemptions, favorite orders, and communication preferences.",
      "Technical information needed to secure and operate the service, including device, browser, IP address, and audit events.",
    ],
  },
  {
    title: "How information is used",
    paragraphs: [
      "We use information to operate the loyalty service, keep accounts secure, deliver requested communications, provide support, understand product performance, and comply with legal obligations.",
    ],
    bullets: [
      "Customers control which businesses they join and what optional profile information those businesses can see.",
      "Marketing communications are sent only where the relevant customer has provided consent.",
      "Business administrators use program data only for the businesses and locations they are authorized to manage.",
    ],
  },
  {
    title: "Sharing and service providers",
    paragraphs: [
      "KYP Rewards does not sell personal information. We may use contracted service providers for hosting, storage, authentication, communications, security, analytics, and payment processing. They may process information only to provide their contracted service.",
    ],
    bullets: [
      "We may disclose information when legally required or necessary to protect customers, businesses, KYP Rewards, or the public.",
      "A business may receive information a customer intentionally shares after joining its program.",
      "On the public website only, Google Analytics counts visits — and only after a visitor allows it. Nothing loads before that choice, and the cookies page explains and controls it.",
    ],
  },
  {
    title: "Retention and security",
    paragraphs: [
      "We retain information for as long as needed to provide the service, meet contractual and legal obligations, resolve disputes, and prevent abuse. Retention periods differ by data type and account status.",
      "The service runs with access controls, encryption in transit and at rest, audit logging, and operational safeguards appropriate to the information it holds. The platform is in open beta and onboarding merchants by application, so the number of people whose data we hold is small and deliberately so. No system is completely secure, and these controls will keep being improved rather than declared finished.",
    ],
  },
  {
    title: "Your choices and rights",
    paragraphs: [
      "Customers can update profile information, change notification and marketing preferences, leave joined business programs, and request account deletion. Business administrators can manage authorized staff and business information.",
    ],
    bullets: [
      "Depending on where you live, you may have rights to access, correct, delete, restrict, or receive a copy of personal information.",
      "Requests can be sent to hello@kypstamping.ph. We may verify identity before completing a request.",
    ],
  },
  {
    title: "Your rights under Philippine law",
    paragraphs: [
      "KYP Rewards operates in the Philippines, and personal information here is protected by the Data Privacy Act of 2012 (Republic Act No. 10173). The Act gives every data subject a specific set of rights, and naming them is more use than a general promise to respect your privacy.",
    ],
    bullets: [
      "To be informed that your personal data is being collected and processed, and why.",
      "To access what is held about you, and to receive a copy in a portable form.",
      "To correct anything inaccurate or out of date.",
      "To object to processing, including withdrawing consent for marketing at any time and per channel.",
      "To erasure or blocking, where the law provides for it.",
      "To be indemnified for damage arising from inaccurate, incomplete or unlawfully obtained data.",
      "To complain to the National Privacy Commission if you believe your rights have not been honored.",
    ],
  },
  {
    title: "Data Protection Officer",
    paragraphs: [
      "The Act requires a Personal Information Controller to appoint a Data Protection Officer accountable for compliance. Ours is being appointed alongside our incorporation and registration with the National Privacy Commission, and this section will carry their name and a direct address before anything is charged. We would rather name a real person here than a role nobody answers.",
      "In the meantime privacy questions, access requests, corrections, objections and deletion requests reach the team at hello@kypstamping.ph, and are handled on the timescales set out on this page — the process is running now, whatever the title on the door.",
    ],
  },
  {
    title: "If something goes wrong",
    paragraphs: [
      "Where a security incident affects personal data and is likely to put the people involved at real risk, the Act requires notification within seventy-two hours of us knowing about it. That notice goes to the National Privacy Commission and to those affected. We commit to that timescale.",
      "A notification will say what happened, what data was involved, what we are doing about it, and what you can do — not merely that an incident occurred.",
    ],
  },
  {
    title: "How long information is kept",
    paragraphs: [
      "Personal data is kept while it is needed for the purpose it was collected for, and then deleted or anonymized. Account data is held while the account is open; loyalty history is held while the customer is a member of that program; and a closed business workspace is retained briefly so it can be restored or exported before removal.",
      "One-time codes, sessions and password-reset tokens are short-lived by design and are swept automatically rather than accumulating.",
      "Specific retention periods for each category are being fixed before the paid tiers open, and will be published here rather than left to be inferred.",
    ],
  },
  {
    title: "Businesses you join",
    paragraphs: [
      "Joining a business's program shares a defined set of your details with that business, and both they and KYP Rewards then make decisions about that data. What moves, when it moves, and who answers for what is set out on the data sharing page.",
      "Leaving a program stops that sharing and removes you from that business's member list. Your account, and your membership of any other business, is unaffected.",
    ],
  },
  {
    title: "Changes and contact",
    paragraphs: [
      "We will update this notice when our practices or legal obligations change. Material changes will be communicated through the service or by another appropriate method.",
      "Questions about this notice can be sent to hello@kypstamping.ph.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      path="/privacy"
      eyebrow="Your information"
      title="Privacy notice"
      summary="KYP Rewards is designed so customers control their personal profile and businesses receive only the information needed to operate a joined loyalty program."
      effective="4 September 2026"
      sections={sections}
    />
  );
}
