"use client";

import { useState } from "react";
import { DemoActionDialog } from "@stampr/ui";
import { Toast, useHashView, useToast } from "@stampr/ui/shell";
import type { NotifyIntent } from "@stampr/ui/shell";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminShell, type AdminView } from "@/components/AdminShell";
import { AdminStateProvider } from "@/components/AdminState";
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
  const [toastTone, setToastTone] = useState<"success" | "error">("success");

  // Behaviour is chosen by the caller, not by matching words in the copy.
  function notify(message: string, intent: NotifyIntent = "info") {
    if (intent === "review") {
      setAction(message);
      return;
    }
    setToastTone(intent === "error" ? "error" : "success");
    setToast(message);
  }

  return (
    <AdminStateProvider>
      <AdminShell activeView={view} onNavigate={navigate}>
      {view === "overview" ? (
        <AdminDashboard onNavigate={navigate} notify={notify} />
      ) : (
        <AdminViewContent view={view} notify={notify} />
      )}
      {toast && <Toast message={toast} onDismiss={dismiss} tone={toastTone} />}
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
    </AdminStateProvider>
  );
}
