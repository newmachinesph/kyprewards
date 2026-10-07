import type { Metadata } from "next";
import { DemoAuthFlow } from "@kyprewards/ui/auth";

export const metadata: Metadata = { title: "Recover access · KYP Rewards Platform" };

export default function AdminForgotPasswordPage() {
  return <DemoAuthFlow role="admin" mode="forgot" />;
}
