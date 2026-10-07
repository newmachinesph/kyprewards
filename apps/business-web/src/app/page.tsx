import { BusinessDemo } from "@/components/BusinessDemo";
import { SessionGate } from "@kyprewards/ui/auth";

export default function BusinessPage() {
  return (
    <SessionGate role="business">
      <BusinessDemo />
    </SessionGate>
  );
}
