import type { Metadata } from "next";
import { DemoAuthFlow } from "@kypstamping/ui/auth";

export const metadata: Metadata = { title: "Sign in · KYP Stamping Platform" };

export default function AdminLoginPage() {
  return <DemoAuthFlow role="admin" mode="login" />;
}
