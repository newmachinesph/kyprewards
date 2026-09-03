import type { Metadata } from "next";
import { BusinessOnboarding } from "@/components/BusinessOnboarding";

export const metadata: Metadata = { title: "Set up your program · KYP Stamping Business" };

export default function BusinessOnboardingPage() {
  return <BusinessOnboarding />;
}
