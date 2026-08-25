import type { Metadata } from "next";
import { DemoAuthFlow } from "@stampr/ui/auth";

export const metadata: Metadata = { title: "Create wallet · Stampr" };

export default function CustomerCreateAccountPage() {
  return <DemoAuthFlow role="customer" mode="create" />;
}
