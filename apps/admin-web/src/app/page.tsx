import { AdminDemo } from "@/components/AdminDemo";
import { DemoSessionGate } from "@stampr/ui/auth";

export default function AdminPage() {
  return (
    <DemoSessionGate role="admin">
      <AdminDemo />
    </DemoSessionGate>
  );
}
