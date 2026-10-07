import type { Metadata } from "next";
import { DemoAuthFlow } from "@kyprewards/ui/auth";

export const metadata: Metadata = { title: "Verify access · KYP Rewards Platform" };

export default function AdminVerifyPage() {
  return <DemoAuthFlow role="admin" mode="verify" />;
}
