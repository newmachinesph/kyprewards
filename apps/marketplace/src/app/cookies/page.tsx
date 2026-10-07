import type { Metadata } from "next";
import { AnalyticsPreference } from "@kyprewards/ui/analytics";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { Eyebrow } from "@/components/Ui";

export const metadata: Metadata = {
  title: "Cookies",
  description:
    "What KYP keeps in your browser: no cookie on kyp.ph, one sign-in cookie in the wallet, and Google Analytics only if you say yes first.",
  alternates: { canonical: "/cookies" },
};

/**
 * kyp.ph's own cookies page, in the shopper's voice.
 *
 * The consent banner on this site points here, so this is where the answer
 * can be changed. Every entry was read out of the code: the analytics gate
 * shared with kyprewards.com (`@kyprewards/ui/analytics`), the position kept
 * by `useCoordinates`, and the wallet's session cookie. The wallet itself
 * never loads analytics.
 */
const sections: LegalSection[] = [
  {
    title: "The short version",
    paragraphs: [
      "Browsing kyp.ph sets no cookie. We ask you one question, once: may we count visits with Google Analytics? Nothing from Google loads until you say yes, and you can change your answer at the foot of this page.",
      "No advertising, nothing that follows you to other websites, and nothing sold. The wallet at app.kyp.ph sets one cookie when you sign in, and never loads analytics at all.",
    ],
  },
  {
    title: "Google Analytics, only if you allow it",
    paragraphs: [
      "On kyp.ph, and on kyprewards.com for shop owners, we ask whether we may use Google Analytics 4 to see which pages help people find a shop. Until you choose Allow, no script is fetched from Google and no analytics cookie exists. Choose No thanks and nothing loads, and you are not asked again in this browser.",
    ],
    bullets: [
      "If you allow it, Google sets cookies named _ga and _ga_ followed by an identifier, to tell one visit from the next. They are not tied to your name, your number or your wallet.",
      "What it records: pages viewed, roughly where in the world you are, and the kind of device and browser. Google shortens your IP address before storing it.",
      "What it is for: deciding what to improve on this site. Not advertising, and never joined to your cards or your visits at any shop.",
    ],
  },
  {
    title: "Kept in your browser, never sent to us",
    paragraphs: [
      "Two small things are saved in your browser's own storage. Clearing your browser data removes them.",
    ],
    bullets: [
      "Your answer to the analytics question, so you are not asked on every page.",
      "Your position, only after you tap Use my location, so shops stay sorted by distance as you move between pages. It is forgotten when you close the tab.",
    ],
  },
  {
    title: "The wallet's sign-in cookie",
    paragraphs: [
      "Signing in to your wallet at app.kyp.ph sets a cookie named kyp_session. It holds a random identifier, not your name or number, and it is what keeps you signed in. Page scripts cannot read it, it expires on its own, and signing out clears it. The wallet cannot work without it, so it is not something you are asked to accept.",
    ],
  },
  {
    title: "Managing it",
    paragraphs: [
      "Your browser can block or clear cookies and site data at any time. kyp.ph works the same without any of them; blocking the wallet's cookie stops you staying signed in.",
      "Questions go to privacy@kyp.ph.",
    ],
  },
];

export default function MarketplaceCookiesPage() {
  return (
    <>
      <LegalPage
        eyebrow="Cookies"
        title="What we keep in your browser"
        summary="No cookie while you browse kyp.ph, one when you sign in to your wallet, and Google Analytics only after you say yes."
        updated="6 October 2026"
        sections={sections}
      />
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[760px]">
          <Eyebrow>Your analytics choice</Eyebrow>
          <p className="mb-4 mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">
            This applies to this browser only. Turning it off reloads the page so the tag, if it
            was running, is gone.
          </p>
          <AnalyticsPreference />
        </div>
      </section>
    </>
  );
}
