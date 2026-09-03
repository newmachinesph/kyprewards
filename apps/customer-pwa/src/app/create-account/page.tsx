import type { Metadata } from "next";
import { DemoAuthFlow } from "@kypstamping/ui/auth";

export const metadata: Metadata = { title: "Create your wallet" };

export default function CustomerCreateAccountPage() {
  return <DemoAuthFlow role="customer" mode="create" />;
}
