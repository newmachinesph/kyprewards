import { CustomerApp } from "@/components/CustomerApp";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SessionGate } from "@kypstamping/ui/auth";

export default function CustomerPage() {
  return (
    <>
      <ServiceWorkerRegister />
      <SessionGate role="customer">
        <CustomerApp />
      </SessionGate>
    </>
  );
}
