"use client";

import { useState } from "react";
import { DemoActionDialog } from "@kypstamping/ui";
import { Toast, useHashView, useToast } from "@kypstamping/ui/shell";
import type { NotifyIntent } from "@kypstamping/ui/shell";
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
  "bonus-windows",
  "promo-codes",
  "store-credit",
  "suki-tiers",
  "missions",
  "gifts",
  "favorite-orders",
  "birthday",
  "redemptions",
  "campaigns",
  "message-log",
  "feedback",
  "analytics",
  "integrations",
  "staff",
  "billing",
  "settings",
];

export function BusinessDemo() {
  const { view, navigate } = useHashView(VIEWS, "dashboard");
  const [action, setAction] = useState<string | null>(null);
  // Errors stay until dismissed; a plan refusal that fades in under three
  // seconds reads as a button that does nothing.
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const { toast, setToast, dismiss } = useToast(toastTone === "error" ? 0 : 2800);

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
