import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Create wallet · KYPStamping" };

export default function CustomerCreateAccountPage() {
  return <DemoAuthFlow role="customer" mode="create" />;
}
