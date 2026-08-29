import { CustomerApp } from "@/components/CustomerApp";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { DemoSessionGate } from "@kypstamping/ui/auth";

export default function CustomerPage() {
  return (
    <>
      <ServiceWorkerRegister />
      <DemoSessionGate role="customer">
        <CustomerApp />
      </DemoSessionGate>
    </>
  );
}
