import { BusinessDemo } from "@/components/BusinessDemo";
import { DemoSessionGate } from "@kypstamping/ui/auth";

export default function BusinessPage() {
  return (
    <DemoSessionGate role="business">
      <BusinessDemo />
    </DemoSessionGate>
  );
}
