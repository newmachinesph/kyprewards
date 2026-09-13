"use client";

import { useState } from "react";
import { useSession } from "@kypstamping/api";
import { DemoActionDialog } from "@kypstamping/ui";
import { Toast, useHashView, useToast } from "@kypstamping/ui/shell";
import type { NotifyIntent } from "@kypstamping/ui/shell";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminShell, ADMIN_VIEWS, MANAGER_VIEWS } from "@/components/AdminShell";
import { AdminStateProvider } from "@/components/AdminState";
import { AdminViewContent } from "@/components/AdminViews";

export function AdminDemo() {
  const { view: requested, navigate } = useHashView(ADMIN_VIEWS, "overview");
  const { data: session } = useSession();
  // An account manager's console is the businesses assigned to them; any
  // other hash lands there rather than on a view the API refuses.
  const view =
    session?.platformRole === "account_manager" && !MANAGER_VIEWS.includes(requested)
      ? "businesses"
      : requested;
  const [action, setAction] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const { toast, setToast, dismiss } = useToast(toastTone === "error" ? 0 : 2800);

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
          // Nothing is recorded: the dialog exists to say why a control has
          // no endpoint behind it, so closing it is the whole action.
          onConfirm={() => setAction(null)}
        />
      )}
      </AdminShell>
    </AdminStateProvider>
  );
}
