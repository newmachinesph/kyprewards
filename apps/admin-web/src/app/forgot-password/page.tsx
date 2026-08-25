import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Recover access · Stampr Platform" };

export default function AdminForgotPasswordPage() {
  return <DemoAuthFlow role="admin" mode="forgot" />;
}
