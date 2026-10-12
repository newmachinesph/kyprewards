import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Sub-processors",
  description:
    "The third-party services KYP Rewards uses to deliver messages, sign shoppers in, take payments, store files, and monitor errors.",
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
 * Everything here is a service production actually runs on. Add a vendor
 * here before it receives any data, never after — an invented or stale list
 * is worse than none.
 */
const sections = [
  {
    title: "Messaging",
    paragraphs: [
      "Semaphore (Philippines) sends SMS, including one-time sign-in codes and any SMS campaign a business chooses to run. It receives the destination mobile number and the message text, and nothing else.",
      "Zoho sends transactional email: sign-in codes, reward notices, staff invitations and data-export links. It receives the destination address, the subject and the body of the message.",
    ],
    bullets: [
      "A one-time code is transactional and is sent regardless of marketing consent.",
      "A business's SMS campaigns go only to customers who consented to SMS from that business.",
      "Message bodies are retained on our side so a merchant can see what was sent on their behalf.",
    ],
  },
  {
    title: "Sign-in",
    paragraphs: [
      "KYP Rewards runs its own sign-in: passwords and one-time codes, with the codes delivered by the messaging services above. A shopper can instead choose Sign in with Google or Sign in with Apple; that company then confirms who they are and sends us their name and email address. It receives nothing from their wallet.",
    ],
  },
  {
    title: "Payments",
    paragraphs: [
      "PayMongo (Philippines) processes subscription payments from businesses. It receives the payer's billing details and the amount.",
      "Every payment is a QR Ph code the business scans with GCash, Maya or a bank app, so wallet and bank credentials stay with the payer and are never held by KYP Rewards. Customers of a business never transact through this path; it bills the shop, not the shopper.",
    ],
  },
  {
    title: "Storage and infrastructure",
    paragraphs: [
      "DigitalOcean, in Singapore, hosts the API and its PostgreSQL database, where application data is stored, encrypted at rest. Singapore is the nearest region to the Philippines.",
      "Cloudflare R2 holds uploaded files, encrypted at rest: storefront photos, exports, and generated bundles. Upstash holds the short-lived counters used for rate limiting. Inngest schedules and runs background jobs, such as sending queued messages and the nightly clean-up. Vercel serves the websites, kyprewards.com and kyp.ph, and the apps under them.",
    ],
    bullets: [
      "Export bundles containing personal data are served through short-lived signed links rather than public URLs.",
      "Files uploaded by a business are scoped to that business's workspace.",
    ],
  },
  {
    title: "Analytics, with consent",
    paragraphs: [
      "Google (Google Analytics 4) counts visits to the two public sites, kyprewards.com and kyp.ph, and only for visitors who answered yes to the one question each site asks. It receives the pages viewed, a truncated IP address, and the kind of device and browser. It is not used in the shopper wallet or the signed-in business and admin apps, is not used for advertising, and is never joined to a customer or merchant record.",
    ],
    bullets: [
      "No script is fetched from Google until the visitor allows it, and the choice can be reversed on the cookies page.",
      "A merchant's customer list, stamps and messages never pass through this service.",
    ],
  },
  {
    title: "Error monitoring",
    paragraphs: [
      "Sentry receives application errors so faults can be found and fixed. Personal data is scrubbed: reports are sent without IP addresses, cookies or request bodies, and carry technical context (the request path, an error type, where in the code it happened).",
    ],
  },
  {
    title: "Changes to this list",
    paragraphs: [
      "We will update this page when a sub-processor is added, removed, or replaced. A business that objects to a new sub-processor on reasonable data-protection grounds can raise it with us before the change takes effect, and can export its data and close its workspace if it is not resolved.",
      "Questions can be sent to support@kyprewards.com.",
    ],
  },
  {
    title: "Status of this page",
    paragraphs: [
      "This list describes the services the platform runs on today, while it is in open beta.",
    ],
  },
];

export default function SubprocessorsPage() {
  return (
    <LegalPage
      path="/subprocessors"
      eyebrow="Who else touches the data"
      title="Sub-processors"
      summary="The third-party services that see some part of what the platform holds, named individually."
      effective="12 October 2026"
      sections={sections}
    />
  );
}
