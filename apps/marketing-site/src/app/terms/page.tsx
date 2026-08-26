import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The terms governing customer, business, and staff access to KYPStamping.",
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    title: "Using KYPStamping",
    paragraphs: [
      "These terms govern access to KYPStamping’s websites, customer application, business workspace, administration tools, and related services. By creating an account or using the service, you agree to these terms.",
    ],
    bullets: [
      "You must provide accurate account information and keep access credentials secure.",
      "You may use KYPStamping only in accordance with applicable law and these terms.",
      "You are responsible for activity performed through your account unless you report unauthorized access promptly.",
    ],
  },
  {
    title: "Customer accounts",
    paragraphs: [
      "Customers may join participating business programs, collect stamps, unlock rewards, manage permissions, and leave programs. Each business defines its own eligible visits, reward terms, availability, and redemption rules.",
    ],
    bullets: [
      "A stamp or reward has no cash value unless a business explicitly states otherwise.",
      "Businesses remain responsible for fulfilling valid rewards they issue.",
      "KYPStamping may reverse activity that results from error, fraud, or misuse after appropriate review.",
    ],
  },
  {
    title: "Business and staff accounts",
    paragraphs: [
      "Business owners are responsible for their published information, program rules, staff access, customer communications, and compliance with consumer, marketing, privacy, and promotional laws.",
    ],
    bullets: [
      "Owners must assign appropriate staff roles and remove access when a team member no longer requires it.",
      "Businesses may not send deceptive, unlawful, discriminatory, or unwanted communications.",
      "Reward terms must be clear and must not be changed retroactively in a way that unfairly removes an earned customer benefit.",
    ],
  },
  {
    title: "Subscriptions and payment",
    paragraphs: [
      "Paid plans are billed according to the selected billing period and displayed price, plus applicable taxes. Subscription changes take effect as described at checkout or in the business workspace.",
    ],
    bullets: [
      "Businesses can cancel future renewal through account settings or support.",
      "Fees already paid are non-refundable except where required by law or explicitly stated otherwise.",
      "We may change plan features or prices with reasonable advance notice.",
    ],
  },
  {
    title: "Acceptable use",
    paragraphs: [
      "You may not interfere with the service, bypass access controls, manipulate stamps or rewards, scrape restricted data, impersonate another person, upload malicious material, or use KYPStamping to harm others.",
    ],
    bullets: [
      "We may limit or suspend access when necessary to protect the service, investigate misuse, or comply with law.",
      "Where practical, we will provide notice and a path to resolve the issue.",
    ],
  },
  {
    title: "Service changes and availability",
    paragraphs: [
      "We work to keep KYPStamping reliable, but the service may occasionally be unavailable for maintenance, security, provider interruption, or circumstances outside our control. Features may evolve as the product develops.",
    ],
    bullets: [
      "Preview, beta, or simulated features may change or stop without notice.",
      "Businesses should maintain reasonable operational alternatives for critical counter workflows.",
    ],
  },
  {
    title: "Liability and governing terms",
    paragraphs: [
      "To the fullest extent permitted by law, KYPStamping is provided without guarantees beyond those expressly stated. We are not responsible for indirect or consequential losses arising from service use, business reward decisions, or third-party services.",
      "Final governing-law, dispute-resolution, entity, and jurisdiction provisions will be added before commercial launch following legal review.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "Questions about these terms can be sent to legal@kypstamping.com. Support questions should be sent through the in-product support channel or hello@kypstamping.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      path="/terms"
      eyebrow="Using the platform"
      title="Terms of service"
      summary="These terms explain the responsibilities of customers, businesses, staff, and KYPStamping while using the loyalty platform."
      effective="25 August 2026"
      sections={sections}
    />
  );
}
