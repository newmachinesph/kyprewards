import type { Metadata } from "next";
import { AnalyticsPreference } from "@kyprewards/ui/analytics";
import { LegalPage } from "@/components/LegalPage";
import { SiteEyebrow } from "@/components/MarketingUi";

export const metadata: Metadata = {
  title: "Cookies",
  description:
    "What KYP Rewards stores in your browser: one sign-in cookie, a few saved drafts, and Google Analytics only if you say yes first.",
  alternates: { canonical: "/cookies" },
};

/**
 * Short because the answer is short.
 *
 * Every entry here was read out of the codebase rather than copied from a
 * template: one session cookie, a small set of named browser-storage keys,
 * and one analytics tool on the two public sites, kyprewards.com and kyp.ph,
 * that does not load until the visitor allows it. The gate is one shared
 * component, `@kyprewards/ui/analytics`. The signed-in apps and the shopper
 * wallet carry no analytics at all.
 */
const sections = [
  {
    title: "The short version",
    paragraphs: [
      "We set one cookie, and only after you sign in. On the marketing site we also ask, once, whether we may count visits with Google Analytics. Nothing from Google loads until you say yes, and you can turn it off below at any time. We use no advertising or tracking scripts, nothing follows you to other websites, and nothing is sold or shared with an ad network.",
      "That is why the only thing you are asked to accept is the one question about counting visits, and only on the public site.",
    ],
  },
  {
    title: "The sign-in cookie",
    paragraphs: [
      "Signing in sets a cookie named kyp_session. It holds a random session identifier — not your name, your email, or anything readable about you — and it is what keeps you signed in as you move between pages.",
    ],
    bullets: [
      "It is HttpOnly, so page scripts cannot read it, which is what stops a cross-site scripting flaw from stealing a session.",
      "It is Secure everywhere except local development, where there is no HTTPS to be secure over.",
      "It expires on its own, and signing out clears it immediately.",
      "Strictly necessary: the signed-in product cannot work without it, so it is set on the basis of providing the service you asked for.",
    ],
  },
  {
    title: "Google Analytics, only if you allow it",
    paragraphs: [
      "On kyprewards.com — not in the signed-in apps — we ask once whether we may use Google Analytics 4 to see which pages help people and which do not. Until you choose Allow, no script is fetched from Google and no analytics cookie exists. If you choose No thanks, nothing is loaded and you are not asked again in this browser.",
      "kyp.ph, the site for shoppers, uses the same consent gate and has its own cookies page; an answer given on one site does not carry over to the other. The shopper wallet never loads analytics.",
    ],
    bullets: [
      "If allowed, Google sets cookies named _ga and _ga_ followed by an identifier, to tell one visit from the next. They are not tied to your name or email; the marketing site does not know who you are.",
      "What it records: pages viewed, roughly where in the world you are, and the kind of device and browser. Your IP address is truncated by Google before it is stored.",
      "What it is used for: deciding what to improve on this site. It is not used for advertising and is not joined to any customer or merchant record.",
      "Your choice is kept in your own browser's storage, not on our servers, and the control below changes it.",
    ],
  },
  {
    title: "Things saved in your browser, not sent to us",
    paragraphs: [
      "A few screens keep a draft or a preference in your browser's own storage so a refresh does not lose your work. These never leave the device, and clearing your browser data removes them.",
    ],
    bullets: [
      "Your answer to the analytics question, so you are not asked on every page.",
      "A partly-filled partner application, so closing the tab does not discard what you typed.",
      "A stamp claimed from a counter poster, held only until your new account exists to put it in.",
      "The name you entered during sign-up, until your profile has caught up.",
      "On the business counter, visits taken while the tablet had no signal, held until they can be synced.",
    ],
  },
  {
    title: "Managing it",
    paragraphs: [
      "Your browser can block or clear cookies and site data at any time. Blocking the session cookie will stop you being able to sign in, because it is the mechanism that keeps you signed in — the signed-out marketing pages will still work normally. The analytics choice is changed with the control at the foot of this page.",
      "Questions can be sent to support@kyprewards.com.",
    ],
  },
  {
    title: "If this changes",
    paragraphs: [
      "Adding any further analytics or advertising tool would change the answer on this page and would be asked for before it loaded, in the same way. We will update this page before any such tool ships.",
    ],
  },
];

export default function CookiesPage() {
  return (
    <>
      <LegalPage
        path="/cookies"
        eyebrow="What we store on your device"
        title="Cookies"
        summary="One sign-in cookie, a few drafts saved in your own browser, and Google Analytics only after you say yes — which is why the only banner you see asks one question."
        effective="4 September 2026"
        sections={sections}
      />
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[760px]">
          <SiteEyebrow>Your analytics choice</SiteEyebrow>
          <p className="mb-4 mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">
            This applies to this browser only. Turning it off reloads the page
            so the tag, if it was running, is gone.
          </p>
          <AnalyticsPreference />
        </div>
      </section>
    </>
  );
}
