import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Sign in · Stampr Wallet" };

export default function CustomerLoginPage() {
  return <DemoAuthFlow role="customer" mode="login" />;
}
