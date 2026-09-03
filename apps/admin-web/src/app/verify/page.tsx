import type { Metadata } from "next";
import { DemoAuthFlow } from "@kypstamping/ui/auth";

export const metadata: Metadata = { title: "Verify access · KYP Stamping Platform" };

export default function AdminVerifyPage() {
  return <DemoAuthFlow role="admin" mode="verify" />;
}
