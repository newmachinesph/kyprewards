import type { Metadata } from "next";
import { DemoAuthFlow } from "@kypstamping/ui/auth";

export const metadata: Metadata = {
  title: "Set a new password · KYP Rewards Platform",
  // The token is in the query string. Nothing here should be indexed.
  robots: { index: false, follow: false },
};

/**
 * The token comes from the route, not from `window`.
 *
 * Reading the query string in the client component made the server render an
 * empty one and the client a real one, which React treats as a corrupt tree.
 */
export default async function AdminResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <DemoAuthFlow role="admin" mode="reset" token={token ?? ""} />;
}
