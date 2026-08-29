import type { Metadata } from "next";
import { DemoAuthFlow } from "@kypstamping/ui/auth";

export const metadata: Metadata = {
  title: "Set a new password · KYPStamping Platform",
  // The token is in the query string. Nothing here should be indexed.
  robots: { index: false, follow: false },
};

export default function AdminResetPasswordPage() {
  return <DemoAuthFlow role="admin" mode="reset" />;
}
