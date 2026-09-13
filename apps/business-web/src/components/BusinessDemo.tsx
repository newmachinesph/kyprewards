"use client";

import { useState } from "react";
import { Toast, useHashView, useToast } from "@kypstamping/ui/shell";
import type { NotifyIntent } from "@kypstamping/ui/shell";
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
  // Errors stay until dismissed; a plan refusal that fades in under three
  // seconds reads as a button that does nothing.
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const { toast, setToast, dismiss } = useToast(toastTone === "error" ? 0 : 2800);

  // Behaviour is chosen by the caller, not by matching words in the copy.
  // Every intent is a toast here: the confirm dialog promised "no backend
  // request will occur" and "demo action confirmed", and real API errors -
  // a refused stamp undo among them - were being routed into it.
  function notify(message: string, intent: NotifyIntent = "info") {
    setToastTone(intent === "error" ? "error" : "success");
    setToast(message);
  }

  return (
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
      </BusinessShell>
  );
}
