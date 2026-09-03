import type { Metadata } from "next";
import { FeedbackForm } from "@/components/FeedbackForm";

export const metadata: Metadata = {
  title: "How was your visit?",
  // The id is the only thing standing between a stranger and this form, so
  // it must not end up in an index.
  robots: { index: false, follow: false },
};

/**
 * One question, no sign-in.
 *
 * The answer endpoint is unauthenticated on purpose: the link goes out by
 * email and the id is unguessable. Requiring an account to leave feedback is
 * how response rates collapse.
 */
export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FeedbackForm feedbackId={id} />;
}
