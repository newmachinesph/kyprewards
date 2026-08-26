import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Create account · KYPStamping Business" };

export default function BusinessCreateAccountPage() {
  return <DemoAuthFlow role="business" mode="create" />;
}
