"use client";

import { useState } from "react";
import { DemoActionDialog } from "@stampr/ui";
import { Toast, useHashView, useToast } from "@stampr/ui/shell";
import type { NotifyIntent } from "@stampr/ui/shell";
import { DemoStateProvider } from "@/components/DemoState";
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
  const [toastTone, setToastTone] = useState<"success" | "error">("success");

  // Behaviour is chosen by the caller, not by matching words in the copy.
  // "review" opens the confirm dialog; everything else is a passive toast.
  function notify(message: string, intent: NotifyIntent = "info") {
    if (intent === "review") {
      setAction(message);
      return;
    }
    setToastTone(intent === "error" ? "error" : "success");
    setToast(message);
  }

  return (
    <DemoStateProvider>
      <BusinessShell activeView={view} onNavigate={navigate}>
        {view === "dashboard" ? (
          <BusinessDashboard onNavigate={navigate} notify={notify} />
        ) : (
          <BusinessViewContent
            view={view}
            notify={notify}
            onNavigate={navigate}
          />
        )}
        {toast && (
          <Toast message={toast} onDismiss={dismiss} tone={toastTone} />
        )}
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
    </DemoStateProvider>
  );
}
