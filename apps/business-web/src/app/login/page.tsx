import type { Metadata } from "next";
import { DemoAuthFlow } from "@kyprewards/ui/auth";

export const metadata: Metadata = { title: "Sign in · KYP Rewards Business" };

export default function BusinessLoginPage() {
  return <DemoAuthFlow role="business" mode="login" />;
}
