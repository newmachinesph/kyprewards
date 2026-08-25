import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Verify access · KYPStamping Business" };

export default function BusinessVerifyPage() {
  return <DemoAuthFlow role="business" mode="verify" />;
}
