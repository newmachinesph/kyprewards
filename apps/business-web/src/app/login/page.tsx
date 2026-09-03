import type { Metadata } from "next";
import { DemoAuthFlow } from "@kypstamping/ui/auth";

export const metadata: Metadata = { title: "Sign in · KYP Stamping Business" };

export default function BusinessLoginPage() {
  return <DemoAuthFlow role="business" mode="login" />;
}
