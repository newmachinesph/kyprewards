import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Sub-processors",
  description:
    "The third-party services KYPStamping uses to deliver messages, take payments, store files, and monitor errors.",
  alternates: { canonical: "/subprocessors" },
};

/**
 * Named, not summarised.
 *
 * "We use trusted service providers" is the sentence every privacy notice has
 * and no reader can act on. A merchant deciding whether to put their customer
 * list on this platform is entitled to know which companies touch it, which is
 * also what a data sharing agreement is normally asked to disclose.
 *
 * Everything here is a service the codebase actually integrates. Where the
 * production choice is not settled yet it says so rather than naming a vendor
 * we have not committed to - an invented list is worse than none.
 */
const sections = [
  {
    title: "Messaging",
    paragraphs: [
      "Semaphore (Philippines) sends SMS, including one-time sign-in codes and any SMS campaign a business chooses to run. It receives the destination mobile number and the message text, and nothing else.",
      "Email is sent over SMTP. The provider for production is not settled; whichever is chosen receives the destination address, the subject and the body of the message. This page will name it before launch.",
    ],
    bullets: [
      "A one-time code is transactional and is sent regardless of marketing consent.",
      "SMS is only used for a business's campaigns where the customer consented to that channel.",
      "Message bodies are retained on our side so a merchant can see what was sent on their behalf.",
    ],
  },
  {
    title: "Payments",
    paragraphs: [
      "PayMongo (Philippines) processes subscription payments from businesses. It receives the payer's billing details and the amount.",
      "Card and e-wallet credentials are entered with the provider and are never held by KYPStamping. Customers of a business never transact through this path - it bills the shop, not the shopper.",
    ],
  },
  {
    title: "Storage and infrastructure",
    paragraphs: [
      "Uploaded files - storefront photos, exports, and generated bundles - are held in S3-compatible object storage. Application data is held in PostgreSQL, with Redis used for queues and short-lived state.",
      "The production hosting region and provider are being settled and will be named here before launch, along with where data is stored at rest.",
    ],
    bullets: [
      "Export bundles containing personal data are served through short-lived signed links rather than public URLs.",
      "Files uploaded by a business are scoped to that business's workspace.",
    ],
  },
  {
    title: "Error monitoring",
    paragraphs: [
      "Sentry receives application errors so faults can be found and fixed. Reports carry technical context - the request path, an error type, a request identifier - and are configured to avoid message bodies, credentials and personal details.",
    ],
  },
  {
    title: "Changes to this list",
    paragraphs: [
      "We will update this page when a sub-processor is added, removed, or replaced. A business that objects to a new sub-processor on reasonable data-protection grounds can raise it with us before the change takes effect, and can export its data and close its workspace if it is not resolved.",
      "Questions can be sent to hello@kypsolutions.com.ph.",
    ],
  },
  {
    title: "Status of this page",
    paragraphs: [
      "This list describes the services the platform integrates today, while it is pre-launch. Two entries - the production email provider and the hosting region - are deliberately unnamed because those decisions are not made yet, and naming a vendor we have not committed to would be worse than saying so.",
    ],
  },
];

export default function SubprocessorsPage() {
  return (
    <LegalPage
      path="/subprocessors"
      eyebrow="Who else touches the data"
      title="Sub-processors"
      summary="The third-party services that see some part of what the platform holds, named individually — including the two we have not chosen yet."
      effective="2 September 2026"
      sections={sections}
    />
  );
}
