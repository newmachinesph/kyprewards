import { AdminDemo } from "@/components/AdminDemo";
import { DemoSessionGate } from "@kypstamping/ui/auth";

export default function AdminPage() {
  return (
    <DemoSessionGate role="admin">
      <AdminDemo />
    </DemoSessionGate>
  );
}
