import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How KYPStamping handles customer, business, staff, and website visitor information.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Information KYPStamping receives",
    paragraphs: [
      "KYPStamping receives information people provide when creating an account, joining a business program, operating a business workspace, contacting support, or using the public website.",
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
      "KYPStamping does not sell personal information. We may use contracted service providers for hosting, storage, authentication, communications, security, analytics, and payment processing. They may process information only to provide their contracted service.",
    ],
    bullets: [
      "We may disclose information when legally required or necessary to protect customers, businesses, KYPStamping, or the public.",
      "A business may receive information a customer intentionally shares after joining its program.",
    ],
  },
  {
    title: "Retention and security",
    paragraphs: [
      "We retain information for as long as needed to provide the service, meet contractual and legal obligations, resolve disputes, and prevent abuse. Retention periods differ by data type and account status.",
      "This notice describes the controls the production service is being built to use: access controls, encryption in transit and at rest, audit logging, and operational safeguards appropriate to the nature of the information. The service is not yet open to the public and holds only seeded demonstration records. No system is completely secure, and these controls will continue to be improved.",
    ],
  },
  {
    title: "Your choices and rights",
    paragraphs: [
      "Customers can update profile information, change notification and marketing preferences, leave joined business programs, and request account deletion. Business administrators can manage authorized staff and business information.",
    ],
    bullets: [
      "Depending on where you live, you may have rights to access, correct, delete, restrict, or receive a copy of personal information.",
      "Requests can be sent to privacy@kypstamping.ph. We may verify identity before completing a request.",
    ],
  },
  {
    title: "Changes and contact",
    paragraphs: [
      "We will update this notice when our practices or legal obligations change. Material changes will be communicated through the service or by another appropriate method.",
      "Questions about this notice can be sent to privacy@kypstamping.ph.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      path="/privacy"
      eyebrow="Your information"
      title="Privacy notice"
      summary="KYPStamping is designed so customers control their personal profile and businesses receive only the information needed to operate a joined loyalty program."
      effective="25 August 2026"
      sections={sections}
    />
  );
}
