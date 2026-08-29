import { AdminDemo } from "@/components/AdminDemo";
import { SessionGate } from "@kypstamping/ui/auth";

export default function AdminPage() {
  return (
    <SessionGate role="admin">
      <AdminDemo />
    </SessionGate>
  );
}
