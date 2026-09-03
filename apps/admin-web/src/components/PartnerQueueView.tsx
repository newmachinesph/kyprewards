"use client";

import { useState } from "react";
import { Building2, Check, ExternalLink, Mail, MapPin, Phone, X } from "lucide-react";
import {
  usePartnerApplications,
  useApiMutation,
  decidePartnerApplication,
  setApplicationNotes,
  keys,
  PREVIEW_WRITE_REASON,
  type PartnerApplication,
} from "@kypstamping/api";
import { Button, Eyebrow, Pill, PreviewBadge, QueryBoundary, ViewFrame } from "@kypstamping/ui";
import { longDate, relativeTime } from "@kypstamping/ui/format";
import { useAdminState } from "@/components/AdminState";
import { FOUNDING, foundingWindowOpen } from "@/lib/catalog";

/**
 * Shops waiting to be let in.
 *
 * This is the whole point of the application record: approving one here
 * provisions the workspace and mails the sign-in, so nobody keys twelve
 * fields in again by hand. Anyone approved during the beta is a founding
 * merchant, and the setup-with-a-person step is noted against the record.
 */

const VOLUME: Record<string, string> = {
  "1-9": "under 10 a day",
  "10-19": "10 to 19 a day",
  "20-49": "20 to 49 a day",
  "50-149": "50 to 149 a day",
  "150+": "150+ a day",
};

const EXISTING: Record<string, string> = {
  none: "nothing formal today",
  paper: "paper punch cards today",
  app: "an app or POS today",
  other: "something else today",
};

const MECHANIC: Record<string, string> = {
  stamps: "leaning to stamps",
  points: "leaning to points",
  unsure: "undecided",
};

type Filter = "new" | "approved" | "rejected" | "all";

type Decision = { id: string; approve: boolean; reason?: string; founding: boolean };

export function PartnerQueueView({ notify }: { notify: (message: string) => void }) {
  const [filter, setFilter] = useState<Filter>("new");
  const {
    data: applications = [],
    isPending,
    error,
    refetch,
  } = usePartnerApplications(filter === "all" ? undefined : filter);
  const [openId, setOpenId] = useState<string | null>(null);

  const decide = useApiMutation(
    ({ id, founding, ...body }: Decision) =>
      // `founding` rides along with the decision. The API records it once it
      // accepts the field; until then it ignores it and the row says so.
      decidePartnerApplication(id, { ...body, founding } as Parameters<
        typeof decidePartnerApplication
      >[1]),
    { invalidates: [keys.admin.partnerApplications(), keys.admin.tenants()] },
  );

  return (
    <ViewFrame
      wide
      className="admin-grid"
      eyebrow="Acquisition"
      title="Partner applications"
      description="Every shop that applied from the public site. Approving one creates a Launch workspace and emails the owner their sign-in; nothing else is purchasable yet."
      action={
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter applications">
          {(["new", "approved", "rejected", "all"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
              className={`min-h-10 rounded-full px-4 text-xs font-extrabold capitalize transition ${
                filter === option
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "border border-[var(--line-strong)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      }
    >
      <QueryBoundary
        isPending={isPending}
        error={error}
        onRetry={refetch}
        label="partner applications"
        rows={4}
      >
        {applications.length === 0 ? (
          <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted-strong)]">
            {filter === "new"
              ? "Nothing waiting. New applications from the marketing site land here."
              : `No ${filter} applications.`}
          </p>
        ) : (
          <ul className="space-y-3">
            {applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                open={openId === application.id}
                onToggle={() =>
                  setOpenId((current) => (current === application.id ? null : application.id))
                }
                busy={decide.isPending}
                onDecide={(approve, reason, founding) =>
                  decide.mutate(
                    { id: application.id, approve, reason, founding },
                    {
                      onSuccess: (decided) =>
                        notify(
                          approve
                            ? `${decided.businessName} approved${founding ? " as a founding merchant" : ""}. The owner has their sign-in.`
                            : `${decided.businessName} rejected.`,
                        ),
                      onError: (failure) => notify(failure.message),
                    },
                  )
                }
              />
            ))}
          </ul>
        )}
      </QueryBoundary>
    </ViewFrame>
  );
}

function Answer({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-xs">{children}</dd>
    </div>
  );
}

function ApplicationCard({
  application,
  open,
  onToggle,
  busy,
  onDecide,
}: {
  application: PartnerApplication;
  open: boolean;
  onToggle: () => void;
  busy: boolean;
  onDecide: (approve: boolean, reason: string | undefined, founding: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [founding, setFounding] = useState(() => foundingWindowOpen());
  const waiting = application.status === "new";
  const { setFocusTenantId } = useAdminState();
  const decidedInWindow =
    application.decidedAt !== null && application.decidedAt.slice(0, 10) <= FOUNDING.closesOn;

  return (
    <li className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-[var(--paper)]"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--surface-2)]">
          <Building2 size={18} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold">{application.businessName}</span>
          <span className="mt-0.5 block truncate text-xs text-[var(--muted-strong)]">
            {application.category} · {application.branches}{" "}
            {application.branches === 1 ? "branch" : "branches"}
            {application.volume ? ` · ${VOLUME[application.volume] ?? application.volume}` : ""}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <Pill
            tone={
              application.status === "approved"
                ? "success"
                : application.status === "rejected"
                  ? "danger"
                  : "warning"
            }
          >
            {application.status}
          </Pill>
          <span className="mt-1 block text-[10px] text-[var(--muted)]">
            {relativeTime(application.createdAt)}
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--line)] p-5">
          <Eyebrow>The application, as submitted</Eyebrow>
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <Answer label="Business name">{application.businessName}</Answer>
            <Answer label="What kind of place">{application.category}</Answer>
            <Answer label="Branches">{application.branches}</Answer>
            <Answer label="Where">
              <span className="flex items-start gap-1.5">
                <MapPin size={13} className="mt-0.5 shrink-0 text-[var(--muted)]" aria-hidden="true" />
                {application.address || "—"}
              </span>
            </Answer>
            <Answer label="Google Maps">
              {application.mapsLink ? (
                <a
                  href={application.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold underline underline-offset-2"
                >
                  Open on Maps <ExternalLink size={11} aria-hidden="true" />
                </a>
              ) : (
                "Not on Maps yet"
              )}
            </Answer>
            <Answer label="Owner">{application.ownerName}</Answer>
            <Answer label="Mobile">
              <a href={`tel:${application.mobile}`} className="inline-flex items-center gap-1.5 font-bold">
                <Phone size={12} aria-hidden="true" /> {application.mobile}
              </a>
            </Answer>
            <Answer label="Email">
              <a
                href={`mailto:${application.email}`}
                className="inline-flex items-center gap-1.5 font-bold underline underline-offset-2"
              >
                <Mail size={12} aria-hidden="true" /> {application.email}
              </a>
            </Answer>
            <Answer label="Facebook page">
              {application.facebook ? (
                <a
                  href={
                    application.facebook.startsWith("http")
                      ? application.facebook
                      : `https://${application.facebook}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold underline underline-offset-2"
                >
                  {application.facebook} <ExternalLink size={11} aria-hidden="true" />
                </a>
              ) : (
                "—"
              )}
            </Answer>
            <Answer label="Customers a day">
              {application.volume ? (VOLUME[application.volume] ?? application.volume) : "—"}
            </Answer>
            <Answer label="Runs today">
              {application.existing ? (EXISTING[application.existing] ?? application.existing) : "—"}
            </Answer>
            <Answer label="Stamps or points">
              {application.mechanic ? (MECHANIC[application.mechanic] ?? application.mechanic) : "—"}
            </Answer>
            <Answer label="Heard about us">{application.heardFrom || "—"}</Answer>
          </dl>

          {application.status !== "new" && (
            <div className="mt-5 rounded-xl bg-[var(--paper)] p-4 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-extrabold capitalize">
                  {application.status} {relativeTime(application.decidedAt)}
                </p>
                {application.status === "approved" &&
                  (application.founding ? (
                    <Pill tone="success">Founding merchant</Pill>
                  ) : decidedInWindow ? (
                    <span className="text-[var(--muted-strong)]">
                      Founding by decision date; the API does not store the flag yet.
                    </span>
                  ) : null)}
              </div>
              {application.reason && (
                <p className="mt-1 text-[var(--muted-strong)]">{application.reason}</p>
              )}
              {application.merchantId && (
                <p className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="font-mono text-[10px] text-[var(--muted)]">
                    {application.merchantId}
                  </code>
                  <a
                    href="#businesses"
                    onClick={() => setFocusTenantId(application.merchantId)}
                    className="inline-flex items-center gap-1 font-extrabold underline underline-offset-2"
                  >
                    Open the workspace in Businesses <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </p>
              )}
            </div>
          )}

          <SetupNotes application={application} />

          {waiting && (
            <div className="mt-5 border-t border-[var(--line)] pt-5">
              <label className="grid gap-2 text-xs font-extrabold">
                Reason, sent to them if you reject
                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Optional for an approval, kind for a rejection"
                  className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm font-normal outline-none focus:border-[var(--accent-strong)]"
                />
              </label>
              <label className="mt-4 flex items-start gap-3 text-xs">
                <input
                  type="checkbox"
                  checked={founding}
                  onChange={(event) => setFounding(event.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--accent-strong)]"
                />
                <span>
                  <span className="block font-extrabold">Founding merchant</span>
                  <span className="text-[var(--muted-strong)]">
                    {FOUNDING.note}. On by default for any decision through{" "}
                    {longDate(FOUNDING.closesOn)}.
                  </span>
                </span>
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  tone="quiet"
                  icon={<X size={15} />}
                  disabled={busy}
                  onClick={() => onDecide(false, reason.trim() || undefined, false)}
                >
                  Reject
                </Button>
                <Button
                  icon={<Check size={15} />}
                  disabled={busy}
                  onClick={() => onDecide(true, reason.trim() || undefined, founding)}
                >
                  {busy ? "Working…" : "Approve and create the workspace"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Where the setup-with-a-person step is noted: what was configured with the
 * owner, and what is still to check on their phone. The route that stores it
 * is not built, so the field reads and drafts but cannot save yet.
 */
function SetupNotes({ application }: { application: PartnerApplication }) {
  const [draft, setDraft] = useState<string | null>(null);
  const save = useApiMutation(
    (setupNotes: string) => setApplicationNotes(application.id, { setupNotes }),
    { invalidates: [keys.admin.partnerApplications()] },
  );
  const value = draft ?? application.setupNotes ?? "";

  return (
    <div className="mt-5">
      <label className="grid gap-2 text-xs font-extrabold">
        <span className="flex flex-wrap items-center gap-2">
          Setup with a person
          <PreviewBadge />
        </span>
        <textarea
          rows={3}
          value={value}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What was configured with the owner, what to check on their phone before they go live"
          className="rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] p-3 text-sm font-normal outline-none focus:border-[var(--accent-strong)]"
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button
          tone="quiet"
          disabled
          title={PREVIEW_WRITE_REASON}
          onClick={() => draft !== null && save.mutate(draft)}
        >
          Save notes
        </Button>
        <p className="text-[11px] text-[var(--muted-strong)]">{PREVIEW_WRITE_REASON}</p>
      </div>
    </div>
  );
}
