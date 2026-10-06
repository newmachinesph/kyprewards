"use client";

import { useState } from "react";
import { useLocations, useStaff, type StaffMember } from "@kypstamping/api";
import { Button, Eyebrow, IconButton, Pill, ViewFrame } from "@kypstamping/ui";
import { Field, Input, Select } from "@kypstamping/ui/form";
import { relativeTime } from "@kypstamping/ui/format";
import { PlanTag } from "@kypstamping/ui/shell";
import { ChevronRight, Send, UserPlus } from "lucide-react";
import { EditStaffDialog } from "@/components/WorkspaceForms";
import { useInviteStaff } from "@/components/mutations";
import { PLAN_NAMES, planFor, refusal, staffCap, usePlanGate } from "@/lib/plan";
import type { Notify } from "@/components/views/shared";

const STAFF_ROLES = [
  ["Owner", "Everything, including billing and deletion"],
  ["Manager", "Programs, customers, campaigns, and staff"],
  ["Cashier", "Scan, earn, redeem, and the reversal window"],
  ["Analyst", "Read-only customers and analytics"],
  ["Campaign", "Campaigns and the message log, nothing at the counter"],
] as const;

export function StaffView({ notify }: { notify: Notify }) {
  const gate = usePlanGate();
  const { data: locations = [] } = useLocations();
  const { data: staff = [] } = useStaff();
  const invite = useInviteStaff();
  const cap = staffCap(gate.plan);
  const active = staff.filter((person) => person.status !== "Suspended").length;
  const full = cap > 0 && active >= cap;
  const nextPlan = PLAN_NAMES.find((plan) => staffCap(plan) > cap);
  const rolesPlan = planFor("Role-based staff permissions");
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("Cashier");
  const [inviteLocation, setInviteLocation] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  function sendInvite() {
    if (!inviteName.trim()) {
      notify("Add the name the invitation should be addressed to.", "error");
      return;
    }
    if (!inviteEmail.trim()) {
      notify("Add the email address the invitation should go to.", "error");
      return;
    }
    invite.mutate(
      {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        location: inviteLocation || locations[0]?.name,
      },
      {
        onSuccess: (member) => {
          notify(`Invitation sent to ${member.name} as ${member.role}.`);
          setInviteName("");
          setInviteEmail("");
          setComposerOpen(false);
        },
        onError: (failure) => notify(refusal(failure, nextPlan), "error"),
      },
    );
  }

  return (
    <ViewFrame
      eyebrow="People & permissions"
      title="Staff access"
      description="Give each person only the counter, customer, campaign, analytics, or configuration actions their role needs. Every stamp, reversal and redemption carries their name."
      action={
        <span className="flex items-center gap-2">
          <Pill tone={full ? "warning" : "neutral"}>
            {active} of {cap} seats
          </Pill>
          <Button
            icon={<UserPlus size={16} />}
            aria-expanded={composerOpen}
            aria-controls="staff-invite"
            onClick={() => setComposerOpen((open) => !open)}
          >
            Invite staff
          </Button>
        </span>
      }
    >
      <p className="mb-3 text-xs leading-relaxed text-[var(--muted-strong)]">
        Your plan includes {cap} staff accounts
        {nextPlan ? `; ${nextPlan} raises it to ${staffCap(nextPlan)}` : ""}. Suspended members do not count.
        {full ? " Every seat is in use, so the next invitation is refused until one is freed." : ""}
      </p>
      {composerOpen && (
        <section id="staff-invite" className="mb-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <Eyebrow>New invitation</Eyebrow>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Name">
              <Input value={inviteName} onChange={(event) => setInviteName(event.target.value)} placeholder="Who are you inviting?" />
            </Field>
            <Field label="Email">
              <Input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Where should the invitation go?" />
            </Field>
            <Field label="Role">
              <Select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}>
                {STAFF_ROLES.map(([role]) => (
                  <option key={role}>{role}</option>
                ))}
              </Select>
            </Field>
            <Field label="Location">
              <Select value={inviteLocation} onChange={(event) => setInviteLocation(event.target.value)}>
                {locations.map((location) => (
                  <option key={location.id}>{location.name}</option>
                ))}
                <option>All locations</option>
              </Select>
            </Field>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted-strong)]">
            {STAFF_ROLES.find(([role]) => role === inviteRole)?.[1]}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button icon={<Send size={15} />} onClick={sendInvite} disabled={invite.isPending} title={full ? `Every one of your ${cap} seats is in use` : undefined}>
              {invite.isPending ? "Sending…" : "Send invitation"}
            </Button>
            <Button tone="quiet" onClick={() => setComposerOpen(false)}>
              Cancel
            </Button>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[var(--muted)]">
            An invitation email goes out as soon as you send this. The invited person opens{" "}
            <code className="font-mono">/accept-invite</code> to review the role before joining.
          </p>
        </section>
      )}
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead>
              <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <th className="px-5 py-3">Person</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Last active</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => (
                <tr key={person.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-2)] text-[11px] font-extrabold">
                        {person.initials}
                      </span>
                      <span className="text-sm font-extrabold">{person.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Pill tone={person.role === "Owner" ? "warning" : "neutral"}>{person.role}</Pill>
                  </td>
                  <td className="px-4 py-4 text-xs">{person.location}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)]">{relativeTime(person.lastActiveAt)}</td>
                  <td className="px-4 py-4">
                    <Pill tone={person.status === "Active" ? "success" : "warning"}>{person.status}</Pill>
                  </td>
                  <td className="px-4 py-4">
                    <IconButton tone="plain" label={`Edit ${person.name} access`} onClick={() => setEditingStaff(person)}>
                      <ChevronRight size={16} />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--muted-strong)]">
          Roles beyond Owner and Cashier open with {rolesPlan}; the named ledger is on every plan.
        </p>
        <PlanTag plan={rolesPlan} included={gate.covers(rolesPlan)} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STAFF_ROLES.map(([role, detail]) => (
          <article key={role} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <p className="text-sm font-extrabold">{role}</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">{detail}</p>
          </article>
        ))}
      </div>
      {editingStaff && (
        <EditStaffDialog member={editingStaff} locations={locations} onClose={() => setEditingStaff(null)} notify={notify} />
      )}
    </ViewFrame>
  );
}
