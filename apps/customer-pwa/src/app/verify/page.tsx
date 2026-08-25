import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Verify wallet · Stampr" };

export default function CustomerVerifyPage() {
  return <DemoAuthFlow role="customer" mode="verify" />;
}
