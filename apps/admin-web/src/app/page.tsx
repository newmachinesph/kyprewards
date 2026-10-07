import { AdminDemo } from "@/components/AdminDemo";
import { SessionGate } from "@kyprewards/ui/auth";

export default function AdminPage() {
  return (
    <SessionGate role="admin">
      <AdminDemo />
    </SessionGate>
  );
}
