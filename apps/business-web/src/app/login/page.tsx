import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Sign in · Stampr Business" };

export default function BusinessLoginPage() {
  return <DemoAuthFlow role="business" mode="login" />;
}
