import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Choose workspace · KYPStamping Business" };

export default function BusinessWorkspacesPage() {
  return <DemoAuthFlow role="business" mode="workspaces" />;
}
