import type { Metadata } from "next";
import { DemoAuthFlow } from "@kyprewards/ui/auth";

export const metadata: Metadata = { title: "Verify your code" };

export default function CustomerVerifyPage() {
  return <DemoAuthFlow role="customer" mode="verify" />;
}
