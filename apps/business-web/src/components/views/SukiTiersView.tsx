"use client";

import { useState } from "react";
import {
  isPreview,
  keys,
  setSukiTiers,
  useApiMutation,
  useSukiTiers,
  type SukiTier,
  type SukiTierProgram,
} from "@kyprewards/api";
import { Button, Eyebrow, IconButton, PreviewNotice, QueryBoundary, ViewFrame } from "@kyprewards/ui";
import { Chip, Field, Input } from "@kyprewards/ui/form";
import { PlanTag } from "@kyprewards/ui/shell";
import { Crown, Plus, Trash2 } from "lucide-react";
import { planFor, refusal, retryOnce, usePlanGate, writeBlock } from "@/lib/plan";
import { BlockedNote, onlyDigits, type Notify } from "@/components/views/shared";

const MIN_RUNGS = 3;

const blankTier = (rank: number): SukiTier => ({
  id: `tier_new_${rank}`,
  name: "",
  rank,
  threshold: 0,
  benefit: "",
  earnRateBps: 10_000,
  members: 0,
});

function TiersEditor({
  program,
  blocked,
  needed,
  notify,
}: {
  program: SukiTierProgram;
  blocked: string | null;
  needed: ReturnType<typeof planFor>;
  notify: Notify;
}) {
  const [draft, setDraft] = useState<SukiTierProgram | null>(null);
  const shown = draft ?? program;
  const save = useApiMutation(
    (body: SukiTierProgram) => retryOnce(() => setSukiTiers(body)),
    { invalidates: [keys.levers.sukiTiers()] },
  );

  const editTier = (index: number, patch: Partial<SukiTier>) =>
    setDraft({
      ...shown,
      tiers: shown.tiers.map((tier, at) => (at === index ? { ...tier, ...patch } : tier)),
    });

  const ready =
    shown.tiers.length >= MIN_RUNGS &&
    shown.tiers.every((tier) => tier.name.trim() && tier.benefit.trim()) &&
    shown.tiers.every((tier, index) => index === 0 || tier.threshold > shown.tiers[index - 1].threshold);

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
      <Eyebrow>Ladder</Eyebrow>
      <h2 className="mt-1 text-lg font-extrabold">Name the rungs</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="text-xs font-bold">Climb by</legend>
          <div className="mt-2 flex gap-2">
            {(["visits", "spend"] as const).map((basis) => (
              <Chip key={basis} pressed={shown.basis === basis} onClick={() => setDraft({ ...shown, basis })}>
                {basis === "visits" ? "Visits" : "Pesos spent"}
              </Chip>
            ))}
          </div>
        </fieldset>
        <Field label="Drop a rung after" hint="Quiet days before a member moves down one rung.">
          <Input
            value={shown.downgradeAfterDays}
            onChange={(event) => setDraft({ ...shown, downgradeAfterDays: Number(onlyDigits(event.target.value)) })}
            inputMode="numeric"
          />
        </Field>
      </div>
      <ol className="mt-5 space-y-3">
        {shown.tiers.map((tier, index) => (
          <li key={tier.id} className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 sm:grid-cols-[auto_1fr_1fr_1fr_auto] sm:items-end">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-2)] text-xs font-extrabold">
              {index + 1}
            </span>
            <Field label="Name">
              <Input value={tier.name} onChange={(event) => editTier(index, { name: event.target.value })} placeholder={["Bago", "Suki", "Super suki"][index] ?? "Rung"} />
            </Field>
            <Field label={shown.basis === "visits" ? "From visits" : "From pesos"}>
              <Input value={tier.threshold} onChange={(event) => editTier(index, { threshold: Number(onlyDigits(event.target.value)) })} inputMode="numeric" />
            </Field>
            <Field label="Earn rate ×">
              <Input
                value={(tier.earnRateBps / 10_000).toString()}
                onChange={(event) => editTier(index, { earnRateBps: Math.round((Number.parseFloat(event.target.value) || 0) * 10_000) })}
                inputMode="decimal"
              />
            </Field>
            <span className="text-right text-xs text-[var(--muted-strong)]">
              {tier.members.toLocaleString()} member{tier.members === 1 ? "" : "s"}
            </span>
            <div className="sm:col-span-4 sm:col-start-2">
              <Field label="Benefit, in plain words">
                <Input value={tier.benefit} onChange={(event) => editTier(index, { benefit: event.target.value })} placeholder="1.5× stamps on Tuesdays" />
              </Field>
            </div>
            {shown.tiers.length > MIN_RUNGS && (
              <IconButton
                tone="quiet"
                label={`Remove ${tier.name || `rung ${index + 1}`}`}
                onClick={() =>
                  setDraft({
                    ...shown,
                    tiers: shown.tiers.filter((_, at) => at !== index).map((entry, at) => ({ ...entry, rank: at + 1 })),
                  })
                }
                className="text-[var(--danger)] sm:col-start-5 sm:justify-self-end"
              >
                <Trash2 size={14} />
              </IconButton>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button tone="quiet" icon={<Plus size={15} />} onClick={() => setDraft({ ...shown, tiers: [...shown.tiers, blankTier(shown.tiers.length + 1)] })}>
          Add a rung
        </Button>
        <Button
          icon={<Crown size={15} />}
          disabled={Boolean(blocked) || !draft || !ready || save.isPending}
          title={blocked ?? undefined}
          onClick={() =>
            draft &&
            save.mutate(
              { ...draft, tiers: draft.tiers.map((tier, index) => ({ ...tier, rank: index + 1, name: tier.name.trim(), benefit: tier.benefit.trim() })) },
              {
                onSuccess: () => {
                  setDraft(null);
                  notify("Suki tiers saved. Members move the moment they qualify.");
                },
                onError: (failure) => notify(refusal(failure, needed), "error"),
              },
            )
          }
        >
          {save.isPending ? "Saving…" : "Save tiers"}
        </Button>
      </div>
      {!ready && draft && (
        <p className="mt-2 text-[11px] font-semibold text-[var(--muted-strong)]">
          At least {MIN_RUNGS} rungs, each named with a benefit, thresholds rising.
        </p>
      )}
      <BlockedNote reason={blocked} />
    </section>
  );
}

export function SukiTiersView({ notify }: { notify: Notify }) {
  const gate = usePlanGate();
  const needed = planFor("Suki tiers");
  const { data: program, isPending, error, refetch } = useSukiTiers();
  const preview = isPreview(program);
  const blocked = writeBlock(gate, needed, preview);
  const total = program?.tiers.reduce((sum, tier) => sum + tier.members, 0) ?? 0;

  return (
    <ViewFrame
      eyebrow="Earning more, on purpose"
      title="Suki tiers"
      description="Levels a customer climbs by visits or spend. You name them, three is plenty, and each carries a benefit that feels like recognition: a better earn rate, a reserved reward, first pick of a bonus window."
      action={<PlanTag plan={needed} included={gate.covers(needed)} />}
    >
      {preview && <PreviewNotice feature="Suki tiers" />}
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <QueryBoundary isPending={isPending} error={error} onRetry={refetch} label="suki tiers">
          {program ? (
            <TiersEditor program={program} blocked={blocked} needed={needed} notify={notify} />
          ) : (
            <TiersEditor
              program={{ basis: "visits", downgradeAfterDays: 90, tiers: [blankTier(1), blankTier(2), blankTier(3)] }}
              blocked={blocked}
              needed={needed}
              notify={notify}
            />
          )}
        </QueryBoundary>
        <aside className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <Eyebrow>Automatic up, gentle down</Eyebrow>
          <p className="mt-5 text-sm leading-relaxed text-white/70">
            A member climbs the moment they clear a rung&rsquo;s threshold and is told on their card. Nobody drops for one quiet month: a rung is only lost after the quiet days you set, one rung at a time, never to the bottom.
          </p>
          {program && (
            <div className="mt-7 divide-y divide-white/12 border-y border-white/12">
              {program.tiers.map((tier) => (
                <div key={tier.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    <span className="font-extrabold">{tier.name}</span>
                    <span className="ml-2 text-xs text-white/50">
                      from {tier.threshold} {program.basis === "visits" ? "visits" : "pesos"}
                    </span>
                  </span>
                  <span className="font-bold">
                    {tier.members.toLocaleString()}
                    <span className="ml-1 text-xs text-white/50">
                      {total ? `${Math.round((tier.members / total) * 100)}%` : ""}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-5 text-[11px] leading-relaxed text-white/50">
            Earn rate 1× is the card&rsquo;s base rate; 1.5× earns half again as much on every visit.
          </p>
        </aside>
      </div>
    </ViewFrame>
  );
}
