import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookies",
  description:
    "What KYP Stamping stores in your browser. One sign-in cookie, a few saved drafts, and no tracking.",
  alternates: { canonical: "/cookies" },
};

/**
 * Short because the answer is short.
 *
 * Every entry here was read out of the codebase rather than copied from a
 * template: one session cookie, a small set of named browser-storage keys, and
 * no analytics, advertising or third-party tracking script anywhere in any of
 * the four apps. A generic "we and our partners use cookies to enhance your
 * experience" banner would describe a product we have not built.
 *
 * If an analytics tool is ever added, this page and the consent story both
 * have to change before it ships.
 */
const sections = [
  {
    title: "The short version",
    paragraphs: [
      "We set one cookie, and only after you sign in. We do not use analytics, advertising, or third-party tracking scripts on any KYP Stamping site or app. Nothing follows you to other websites, and nothing is sold or shared with an ad network.",
      "That is why you are not being asked to accept a banner. There is nothing here to consent to beyond the sign-in itself.",
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
    title: "Things saved in your browser, not sent to us",
    paragraphs: [
      "A few screens keep a draft or a preference in your browser's own storage so a refresh does not lose your work. These never leave the device, and clearing your browser data removes them.",
    ],
    bullets: [
      "A partly-filled partner application, so closing the tab does not discard what you typed.",
      "A stamp claimed from a counter poster, held only until your new account exists to put it in.",
      "The name you entered during sign-up, until your profile has caught up.",
      "On the business counter, visits taken while the tablet had no signal, held until they can be synced.",
    ],
  },
  {
    title: "Managing it",
    paragraphs: [
      "Your browser can block or clear cookies and site data at any time. Blocking the session cookie will stop you being able to sign in, because it is the mechanism that keeps you signed in — the signed-out marketing pages will still work normally.",
      "Questions can be sent to hello@kypstamping.ph.",
    ],
  },
  {
    title: "If this changes",
    paragraphs: [
      "Adding an analytics or advertising tool would change the answer on this page, and would require asking for consent before it loaded rather than after. We will update this page, and introduce a consent mechanism, before any such tool ships.",
    ],
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      path="/cookies"
      eyebrow="What we store on your device"
      title="Cookies"
      summary="One sign-in cookie, a few drafts saved in your own browser, and no tracking of any kind — which is why there is no banner asking you to accept anything."
      effective="2 September 2026"
      sections={sections}
    />
  );
}
