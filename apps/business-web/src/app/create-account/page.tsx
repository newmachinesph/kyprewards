import type { Metadata } from "next";
import { DemoAuthFlow } from "@kypstamping/ui/auth";

export const metadata: Metadata = { title: "Create account · KYP Stamping Business" };

export default function BusinessCreateAccountPage() {
  return <DemoAuthFlow role="business" mode="create" />;
}
