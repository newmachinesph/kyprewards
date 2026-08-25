"use client";

import { useEffect, useState } from "react";
import { DemoActionDialog } from "@stampr/ui";
import { Check, X } from "lucide-react";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminShell, type AdminView } from "@/components/AdminShell";
import { AdminViewContent } from "@/components/AdminViews";

export function AdminDemo() {
  const [view, setView] = useState<AdminView>("overview");
  const [toast, setToast] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const validViews = new Set<AdminView>([
      "overview",
      "businesses",
      "people",
      "operations",
      "integrations",
      "support",
      "audit",
      "economics",
      "settings",
    ]);
    function syncFromHash() {
      const next = window.location.hash.slice(1) as AdminView;
      if (validViews.has(next)) setView(next);
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("popstate", syncFromHash);
    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("popstate", syncFromHash);
    };
  }, []);

  function navigate(next: AdminView) {
    setView(next);
    const url = new URL(window.location.href);
    url.hash = next;
    window.history.pushState({ view: next }, "", url);
  }

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
      {toast && (
        <div
          className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-3 rounded-2xl border border-white/10 bg-[var(--ink)] px-4 py-3 text-sm font-bold text-[var(--paper)] shadow-2xl"
          role="status"
          aria-live="polite"
        >
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--success)]">
            <Check size={12} strokeWidth={3} />
          </span>
          <span className="flex-1">{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss message"
            className="text-white/70 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}
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
