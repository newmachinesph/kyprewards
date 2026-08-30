import type { Metadata } from "next";
import { FirstStamp } from "@/components/FirstStamp";

export const metadata: Metadata = {
  title: "Your first stamp · KYPStamping",
  // A counter poster, not a page anybody should find by searching.
  robots: { index: false, follow: false },
};

/**
 * Where the printed counter code lands.
 *
 * Straight into the wallet app rather than through a marketing page: the
 * promise is that the stamp appears on scan, and an interstitial with a
 * "continue" button is exactly the friction this flow exists to remove.
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <FirstStamp slug={slug} />;
}
