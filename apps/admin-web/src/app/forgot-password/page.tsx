import type { Metadata } from "next";
import { DemoAuthFlow } from "@kypstamping/ui/auth";

export const metadata: Metadata = { title: "Recover access · KYP Stamping Platform" };

export default function AdminForgotPasswordPage() {
  return <DemoAuthFlow role="admin" mode="forgot" />;
}
