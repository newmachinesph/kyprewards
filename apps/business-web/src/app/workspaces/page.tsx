import type { Metadata } from "next";
import { DemoAuthFlow } from "@kypstamping/ui/auth";

export const metadata: Metadata = { title: "Choose workspace · KYP Stamping Business" };

export default function BusinessWorkspacesPage() {
  return <DemoAuthFlow role="business" mode="workspaces" />;
}
