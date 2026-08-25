import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Recover access · Stampr Business" };

export default function BusinessForgotPasswordPage() {
  return <DemoAuthFlow role="business" mode="forgot" />;
}
