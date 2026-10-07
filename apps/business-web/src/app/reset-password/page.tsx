import type { Metadata } from "next";
import { DemoAuthFlow } from "@kyprewards/ui/auth";

export const metadata: Metadata = {
  title: "Set a new password · KYP Rewards Business",
  // The token is in the query string. Nothing here should be indexed.
  robots: { index: false, follow: false },
};

/**
 * The token comes from the route, not from `window`.
 *
 * Reading the query string in the client component made the server render an
 * empty one and the client a real one, which React treats as a corrupt tree.
 */
export default async function BusinessResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <DemoAuthFlow role="business" mode="reset" token={token ?? ""} />;
}
