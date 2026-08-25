import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Verify wallet · KYPStamping" };

export default function CustomerVerifyPage() {
  return <DemoAuthFlow role="customer" mode="verify" />;
}
