import { BusinessDemo } from "@/components/BusinessDemo";
import { SessionGate } from "@kypstamping/ui/auth";

export default function BusinessPage() {
  return (
    <SessionGate role="business">
      <BusinessDemo />
    </SessionGate>
  );
}
