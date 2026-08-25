import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Verify access · Stampr Business" };

export default function BusinessVerifyPage() {
  return <DemoAuthFlow role="business" mode="verify" />;
}
