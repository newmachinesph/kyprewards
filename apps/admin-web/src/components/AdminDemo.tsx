"use client";

import { useState } from "react";
import { DemoActionDialog } from "@stampr/ui";
import { Toast, useHashView, useToast } from "@stampr/ui/shell";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminShell, type AdminView } from "@/components/AdminShell";
import { AdminViewContent } from "@/components/AdminViews";

const VIEWS: readonly AdminView[] = [
  "overview",
  "businesses",
  "people",
  "operations",
  "integrations",
  "support",
  "audit",
  "economics",
  "settings",
];

export function AdminDemo() {
  const { view, navigate } = useHashView(VIEWS, "overview");
  const { toast, setToast, dismiss } = useToast();
  const [action, setAction] = useState<string | null>(null);

  function notify(message: string) {
    if (/opened|runbook|review/i.test(message)) {
      setAction(message);
      return;
    }
    setToast(message);
  }

  return (
    <AdminShell activeView={view} onNavigate={navigate}>
      {view === "overview" ? (
        <AdminDashboard onNavigate={navigate} notify={notify} />
      ) : (
        <AdminViewContent view={view} notify={notify} />
      )}
      {toast && <Toast message={toast} onDismiss={dismiss} />}
      {action && (
        <DemoActionDialog
          title={action}
          onClose={() => setAction(null)}
          onConfirm={() => {
            setAction(null);
            setToast("Demo action confirmed and recorded locally.");
          }}
        />
      )}
    </AdminShell>
  );
}
