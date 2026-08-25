import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Accept invitation · Stampr Business" };

export default function BusinessInvitePage() {
  return <DemoAuthFlow role="business" mode="invite" />;
}
