"use client";

import { useState } from "react";
import { DemoActionDialog } from "@stampr/ui";
import { Toast, useHashView, useToast } from "@stampr/ui/shell";
import { BusinessShell, type BusinessView } from "@/components/BusinessShell";
import { BusinessDashboard } from "@/components/BusinessDashboard";
import { BusinessViewContent } from "@/components/BusinessViews";

const VIEWS: readonly BusinessView[] = [
  "dashboard",
  "scan",
  "join-code",
  "customers",
  "business",
  "programs",
  "favorite-orders",
  "birthday",
  "redemptions",
  "campaigns",
  "message-log",
  "analytics",
  "integrations",
  "staff",
  "settings",
];

export function BusinessDemo() {
  const { view, navigate } = useHashView(VIEWS, "dashboard");
  const { toast, setToast, dismiss } = useToast();
  const [action, setAction] = useState<string | null>(null);

  function notify(message: string) {
    if (/opened|setup|editor|review/i.test(message)) {
      setAction(message);
      return;
    }
    setToast(message);
  }

  return (
    <BusinessShell activeView={view} onNavigate={navigate}>
      {view === "dashboard" ? (
        <BusinessDashboard onNavigate={navigate} notify={notify} />
      ) : (
        <BusinessViewContent view={view} notify={notify} onNavigate={navigate} />
      )}
      {toast && <Toast message={toast} onDismiss={dismiss} />}
      {action && (
        <DemoActionDialog
          title={action}
          onClose={() => setAction(null)}
          onConfirm={() => {
            setAction(null);
            setToast("Demo action confirmed for this browser session.");
          }}
        />
      )}
    </BusinessShell>
  );
}
