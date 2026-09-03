import type { Metadata } from "next";
import { DemoAuthFlow } from "@kypstamping/ui/auth";

export const metadata: Metadata = {
  title: "Accept invitation · KYP Stamping Business",
  // The token rides in the query string.
  robots: { index: false, follow: false },
};

/**
 * The token comes from the route, not from `window`.
 *
 * Reading the query string in the client component made the server render an
 * empty one and the client a real one, which React treats as a corrupt tree.
 */
export default async function BusinessInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <DemoAuthFlow role="business" mode="invite" token={token ?? ""} />;
}
