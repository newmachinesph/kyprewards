import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Sign in · Stampr Platform" };

export default function AdminLoginPage() {
  return <DemoAuthFlow role="admin" mode="login" />;
}
