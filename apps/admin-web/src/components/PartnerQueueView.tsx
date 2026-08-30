"use client";

import { useState } from "react";
import {
  Building2,
  Check,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import {
  usePartnerApplications,
  useApiMutation,
  decidePartnerApplication,
  keys,
  type PartnerApplication,
} from "@kypstamping/api";
import { Button, Eyebrow, Pill, QueryBoundary, ViewFrame } from "@kypstamping/ui";
import { relativeTime } from "@kypstamping/ui/format";

/**
 * Shops waiting to be let in.
 *
 * This is the whole point of the application record: approving one here
 * provisions the workspace and mails the sign-in, so nobody keys twelve
 * fields in again by hand.
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

export function PartnerQueueView({ notify }: { notify: (message: string) => void }) {
  const [filter, setFilter] = useState<Filter>("new");
  const { data: applications = [], isPending, error, refetch } = usePartnerApplications(
    filter === "all" ? undefined : filter,
  );
  const [openId, setOpenId] = useState<string | null>(null);

  const decide = useApiMutation(
    ({ id, ...body }: { id: string; approve: boolean; reason?: string }) =>
      decidePartnerApplication(id, body),
    { invalidates: [keys.admin.partnerApplications()] },
  );

  return (
    <ViewFrame
      eyebrow="Acquisition"
      title="Partner applications"
      description="Every shop that applied from the public site. Approving one creates the workspace and emails the owner their sign-in."
      action={
        <div className="flex flex-wrap gap-1.5">
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
                onDecide={(approve, reason) =>
                  decide.mutate(
                    { id: application.id, approve, reason },
                    {
                      onSuccess: (decided) =>
                        notify(
                          approve
                            ? `${decided.businessName} approved. The owner has their sign-in.`
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
  onDecide: (approve: boolean, reason?: string) => void;
}) {
  const [reason, setReason] = useState("");
  const waiting = application.status === "new";

  return (
    <li className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-[var(--paper)]"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--surface-2)]">
          <Building2 size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-extrabold">
            {application.businessName}
          </span>
          <span className="mt-0.5 block truncate text-xs text-[var(--muted-strong)]">
            {application.category} · {application.branches}{" "}
            {application.branches === 1 ? "branch" : "branches"} ·{" "}
            {VOLUME[application.volume] ?? application.volume}
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
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <Eyebrow>Who applied</Eyebrow>
              <p className="mt-3 text-sm font-extrabold">{application.ownerName}</p>
              <ul className="mt-2 space-y-1.5 text-xs">
                <li className="flex items-center gap-2">
                  <Mail size={13} className="shrink-0 text-[var(--muted)]" />
                  <a
                    href={`mailto:${application.email}`}
                    className="truncate font-bold underline underline-offset-2"
                  >
                    {application.email}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={13} className="shrink-0 text-[var(--muted)]" />
                  <a href={`tel:${application.mobile}`} className="font-bold">
                    {application.mobile}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-[var(--muted)]" />
                  <span>{application.address}</span>
                </li>
              </ul>
              {/* The two links that verify the shop is real, which is the
                  whole review. Opened in a new tab so a half-read
                  application is not lost to a back button. */}
              <div className="mt-3 flex flex-wrap gap-2">
                {application.mapsLink ? (
                  <a
                    href={application.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-3 text-[11px] font-extrabold hover:bg-[var(--surface-2)]"
                  >
                    Google Maps <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--surface-2)] px-3 text-[11px] font-bold text-[var(--muted-strong)]">
                    Not on Maps yet
                  </span>
                )}
                {application.facebook && (
                  <a
                    href={
                      application.facebook.startsWith("http")
                        ? application.facebook
                        : `https://${application.facebook}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--line-strong)] px-3 text-[11px] font-extrabold hover:bg-[var(--surface-2)]"
                  >
                    Facebook <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            <div>
              <Eyebrow>What they run</Eyebrow>
              <ul className="mt-3 space-y-1.5 text-xs">
                <li>{EXISTING[application.existing] ?? application.existing}</li>
                <li>{MECHANIC[application.mechanic] ?? "undecided"}</li>
                {application.heardFrom && <li>found us via {application.heardFrom}</li>}
              </ul>

              {application.status !== "new" && (
                <div className="mt-4 rounded-xl bg-[var(--paper)] p-3 text-xs">
                  <p className="font-extrabold capitalize">
                    {application.status} {relativeTime(application.decidedAt)}
                  </p>
                  {application.reason && (
                    <p className="mt-1 text-[var(--muted-strong)]">{application.reason}</p>
                  )}
                  {application.merchantId && (
                    <p className="mt-1 font-mono text-[10px] text-[var(--muted)]">
                      {application.merchantId}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

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
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  tone="quiet"
                  icon={<X size={15} />}
                  disabled={busy}
                  onClick={() => onDecide(false, reason.trim() || undefined)}
                >
                  Reject
                </Button>
                <Button
                  icon={<Check size={15} />}
                  disabled={busy}
                  onClick={() => onDecide(true, reason.trim() || undefined)}
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
