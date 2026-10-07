import type { Metadata } from "next";
import { DemoAuthFlow } from "@kyprewards/ui/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function CustomerLoginPage() {
  return <DemoAuthFlow role="customer" mode="login" />;
}
