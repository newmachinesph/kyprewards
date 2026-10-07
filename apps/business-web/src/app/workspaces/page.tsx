import type { Metadata } from "next";
import { DemoAuthFlow } from "@kyprewards/ui/auth";

export const metadata: Metadata = { title: "Choose workspace · KYP Rewards Business" };

export default function BusinessWorkspacesPage() {
  return <DemoAuthFlow role="business" mode="workspaces" />;
}
