import type { Metadata } from "next";
import { DemoAuthFlow } from "@kyprewards/ui/auth";

export const metadata: Metadata = { title: "Recover access · KYP Rewards Business" };

export default function BusinessForgotPasswordPage() {
  return <DemoAuthFlow role="business" mode="forgot" />;
}
