import { CustomerApp, OfflineMemberCode } from "@/components/CustomerApp";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SessionGate } from "@kyprewards/ui/auth";

export default function CustomerPage() {
  return (
    <>
      <ServiceWorkerRegister />
      <SessionGate role="customer" offline={<OfflineMemberCode />}>
        <CustomerApp />
      </SessionGate>
    </>
  );
}
