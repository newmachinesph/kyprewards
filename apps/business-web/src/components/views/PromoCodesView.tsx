"use client";

import { useState } from "react";
import {
  createPromoCode,
  isPreview,
  keys,
  updatePromoCode,
  useApiMutation,
  usePromoCodes,
  type PromoCode,
} from "@kypstamping/api";
import { Button, Eyebrow, Pill, PreviewNotice, QueryBoundary, ViewFrame } from "@kypstamping/ui";
import { Checkbox, Field, Input, Select } from "@kypstamping/ui/form";
import { longDate } from "@kypstamping/ui/format";
import { PlanTag } from "@kypstamping/ui/shell";
import { Plus } from "lucide-react";
import { planFor, refusal, retryOnce, usePlanGate, writeBlock } from "@/lib/plan";
import {
  BlockedNote,
  isoDay,
  onlyDigits,
  type Notify,
} from "@/components/views/shared";

const GRANTS: { value: PromoCode["grants"]; label: string }[] = [
  { value: "stamp", label: "A stamp" },
  { value: "points", label: "Points" },
  { value: "coupon", label: "A coupon" },
];

const grantLabel = (code: PromoCode) =>
  code.grants === "coupon"
    ? code.couponName ?? "A coupon"
    : `${code.amount} ${code.grants === "stamp" ? (code.amount === 1 ? "stamp" : "stamps") : "points"}`;

export function PromoCodesView({ notify }: { notify: Notify }) {
  const gate = usePlanGate();
  const needed = planFor("Promo codes");
  const { data: codes = [], isPending, error, refetch } = usePromoCodes();
  const preview = isPreview(codes);
  const blocked = writeBlock(gate, needed, preview);

  const create = useApiMutation(
    (body: Parameters<typeof createPromoCode>[0]) => retryOnce(() => createPromoCode(body)),
    { invalidates: [keys.levers.promoCodes()] },
  );
  const update = useApiMutation(
    ({ id, ...body }: { id: string } & Partial<PromoCode>) =>
      retryOnce(() => updatePromoCode(id, body)),
    { invalidates: [keys.levers.promoCodes()] },
  );

  const [code, setCode] = useState("");
  const [grants, setGrants] = useState<PromoCode["grants"]>("stamp");
  const [amount, setAmount] = useState("1");
  const [couponName, setCouponName] = useState("");
  const [startsOn, setStartsOn] = useState(isoDay(new Date()));
  const [endsOn, setEndsOn] = useState("");
  const [oncePerMember, setOncePerMember] = useState(true);

  const ready =
    /^[A-Z0-9]{3,20}$/.test(code) &&
    (grants === "coupon" ? couponName.trim().length > 1 : Number(amount) > 0);

  return (
    <ViewFrame
      eyebrow="Earning more, on purpose"
      title="Promo codes"
      description="WELCOME, FIESTA, the name of the barangay. A public code that grants a stamp, points or a coupon once per member, for a tarp, a flyer, a Facebook post. The customer types it into their wallet."
      action={<PlanTag plan={needed} included={gate.covers(needed)} />}
    >
      {preview && <PreviewNotice feature="Promo codes" />}
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <Eyebrow>Your codes</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">Active, paused and ended</h2>
          </div>
          <QueryBoundary isPending={isPending} error={error} onRetry={refetch} label="promo codes">
            {codes.length === 0 ? (
              <p className="p-5 text-sm text-[var(--muted-strong)]">
                No promo codes yet. Make one and put it where people will see it.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      <th className="px-5 py-3">Code</th>
                      <th className="px-4 py-3">Grants</th>
                      <th className="px-4 py-3">Valid</th>
                      <th className="px-4 py-3">Redeemed</th>
                      <th className="px-4 py-3">Per member</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((entry) => (
                      <tr key={entry.id} className="border-b border-[var(--line)] last:border-0">
                        <td className="px-5 py-4 font-mono text-sm font-extrabold">{entry.code}</td>
                        <td className="px-4 py-4 text-sm">{grantLabel(entry)}</td>
                        <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                          From {longDate(entry.startsOn)}
                          {entry.endsOn ? ` to ${longDate(entry.endsOn)}` : ", no end"}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold">{entry.redemptions}</td>
                        <td className="px-4 py-4 text-xs">
                          {entry.limitPerMember ? `${entry.limitPerMember}×` : "No limit"}
                        </td>
                        <td className="px-4 py-4">
                          <Pill tone={entry.status === "active" ? "success" : entry.status === "paused" ? "warning" : "neutral"}>
                            {entry.status}
                          </Pill>
                        </td>
                        <td className="px-4 py-4">
                          {entry.status !== "ended" && (
                            <span className="flex gap-2">
                              <Button
                                tone="quiet"
                                className="min-h-9 px-3 text-xs"
                                disabled={Boolean(blocked) || update.isPending}
                                title={blocked ?? undefined}
                                onClick={() =>
                                  update.mutate(
                                    { id: entry.id, status: entry.status === "paused" ? "active" : "paused" },
                                    {
                                      onSuccess: (saved) => notify(`${saved.code} is ${saved.status}.`),
                                      onError: (failure) => notify(refusal(failure, needed), "error"),
                                    },
                                  )
                                }
                              >
                                {entry.status === "paused" ? "Resume" : "Pause"}
                              </Button>
                              <Button
                                tone="quiet"
                                className="min-h-9 px-3 text-xs"
                                disabled={Boolean(blocked) || update.isPending}
                                title={blocked ?? undefined}
                                onClick={() =>
                                  update.mutate(
                                    { id: entry.id, status: "ended" },
                                    {
                                      onSuccess: (saved) => notify(`${saved.code} ended.`),
                                      onError: (failure) => notify(refusal(failure, needed), "error"),
                                    },
                                  )
                                }
                              >
                                End
                              </Button>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </QueryBoundary>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <Eyebrow>Composer</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">A new code</h2>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (blocked || !ready) return;
              create.mutate(
                {
                  code,
                  grants,
                  amount: grants === "coupon" ? 1 : Number(amount),
                  couponName: grants === "coupon" ? couponName.trim() : null,
                  startsOn,
                  endsOn: endsOn || null,
                  limitPerMember: oncePerMember ? 1 : 0,
                },
                {
                  onSuccess: (saved) => {
                    notify(`${saved.code} is live.`);
                    setCode("");
                    setCouponName("");
                  },
                  onError: (failure) => notify(refusal(failure, needed), "error"),
                },
              );
            }}
          >
            <Field label="Code" hint="Letters and numbers, 3 to 20. Shown uppercase everywhere.">
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="FIESTA"
                className="font-mono"
              />
            </Field>
            <Field label="Grants">
              <Select value={grants} onChange={(event) => setGrants(event.target.value as PromoCode["grants"])}>
                {GRANTS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </Field>
            {grants === "coupon" ? (
              <Field label="Coupon name">
                <Input value={couponName} onChange={(event) => setCouponName(event.target.value)} placeholder="₱50 off any cake" />
              </Field>
            ) : (
              <Field label={grants === "stamp" ? "Stamps" : "Points"}>
                <Input value={amount} onChange={(event) => setAmount(onlyDigits(event.target.value))} inputMode="numeric" />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <Input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} />
              </Field>
              <Field label="Until" hint="Empty means no end.">
                <Input type="date" value={endsOn} min={startsOn} onChange={(event) => setEndsOn(event.target.value)} />
              </Field>
            </div>
            <label className="flex items-center gap-3 text-xs font-bold">
              <Checkbox checked={oncePerMember} onChange={(event) => setOncePerMember(event.target.checked)} />
              Once per member
            </label>
            <Button type="submit" icon={<Plus size={15} />} disabled={Boolean(blocked) || !ready || create.isPending} title={blocked ?? undefined}>
              {create.isPending ? "Saving…" : "Make it live"}
            </Button>
            <BlockedNote reason={blocked} />
          </form>
        </section>
      </div>
    </ViewFrame>
  );
}
