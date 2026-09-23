import type { Metadata } from "next";
import { DemoAuthFlow } from "@kypstamping/ui/auth";

export const metadata: Metadata = { title: "Verify access · KYP Rewards Business" };

export default function BusinessVerifyPage() {
  return <DemoAuthFlow role="business" mode="verify" />;
}
