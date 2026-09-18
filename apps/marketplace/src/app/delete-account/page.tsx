import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Delete your account",
  description:
    "How to delete your KYP wallet, what is deleted with it, and what shops keep.",
  alternates: { canonical: "/delete-account" },
};

/**
 * The page the app stores link to for account deletion (Google Play asks for
 * one that names the app, shows the steps and says what is kept).
 *
 * Every line matches services/erasure.py and the wallet's own screens:
 * Profile > Leave or delete > Request account deletion. Change them together.
 */
const sections: LegalSection[] = [
  {
    title: "Delete your account in the KYP app or at app.kyp.ph",
    paragraphs: [
      "The request is recorded straight away and the screen shows it as received. It is checked for anything that should not be cut off halfway, such as a reward being handed over at a counter, and then carried out. You get a last message by email, or by SMS if the wallet has no email, when it is done.",
    ],
    bullets: [
      "Sign in to KYP.",
      "Open Profile.",
      "Tap Leave or delete.",
      "Tap Request account deletion, then confirm with Request deletion.",
    ],
  },
  {
    title: "Without the app",
    paragraphs: [
      "Email privacy@kyp.ph from the address on your wallet, or tell us the mobile number on it, and ask for the account to be deleted. We confirm the request is yours before acting on it.",
    ],
  },
  {
    title: "What is deleted",
    paragraphs: ["Everything that identifies you goes, across every shop you joined:"],
    bullets: [
      "Your name, email address, mobile number, birthday and city.",
      "Your password, and the link to Google or Apple if you signed in with one. An Apple sign-in is revoked with Apple too.",
      "Your member code. It is replaced with a random one, so a printed card left somewhere finds nobody.",
      "The devices registered for notifications, your inbox, your message preferences and any sign-in codes.",
      "Every copy of your data you downloaded from the wallet.",
      "Every signed-in session, on every device.",
      "Your memberships are closed and every shop's permission to message you is switched off.",
    ],
  },
  {
    title: "What is kept, and for how long",
    paragraphs: [
      "Each shop keeps an anonymous record of past visits, stamps and rewards for its own books. It carries no name, number, email or code that leads back to you, and it is kept for as long as the shop keeps its sales records.",
      "A record of the deletion request itself is kept, so KYP can show it was carried out.",
    ],
  },
  {
    title: "Leave one shop instead",
    paragraphs: [
      "To stop one shop without deleting your account: Profile, Leave or delete, then choose the shop. You can also remove your email or birthday under Profile, Personal information, and turn off any message channel under Notifications.",
    ],
  },
];

export default function DeleteAccountPage() {
  return (
    <LegalPage
      eyebrow="Your account"
      title="Delete your KYP account"
      summary="How to delete your KYP wallet, what goes with it, and the anonymous history shops keep."
      updated="19 September 2026"
      sections={sections}
    />
  );
}
