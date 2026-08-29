import type { Metadata } from "next";
import { DemoAuthFlow } from "@kypstamping/ui/auth";

export const metadata: Metadata = { title: "Recover access · KYPStamping Business" };

export default function BusinessForgotPasswordPage() {
  return <DemoAuthFlow role="business" mode="forgot" />;
}
