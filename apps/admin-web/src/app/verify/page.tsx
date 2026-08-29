import type { Metadata } from "next";
import { DemoAuthFlow } from "@kypstamping/ui/auth";

export const metadata: Metadata = { title: "Verify access · KYPStamping Platform" };

export default function AdminVerifyPage() {
  return <DemoAuthFlow role="admin" mode="verify" />;
}
