import { BusinessDemo } from "@/components/BusinessDemo";
import { DemoSessionGate } from "@stampr/ui/auth";

export default function BusinessPage() {
  return (
    <DemoSessionGate role="business">
      <BusinessDemo />
    </DemoSessionGate>
  );
}
