"use client";

import { useState } from "react";
import {
  isPreview,
  keys,
  setCategoryRates,
  setStampRules,
  useApiMutation,
  useCategoryRates,
  useClosePreview,
  usePrograms,
  type CategoryRate,
  type Program,
  type StampRules,
  useBranding,
} from "@kypstamping/api";
import { Button, Eyebrow, IconButton, PreviewBadge, StampDots } from "@kypstamping/ui";
import { Checkbox, Chip, Field, Input, Select } from "@kypstamping/ui/form";
import { longDate, pesoFromCentavos, timeOfDay } from "@kypstamping/ui/format";
import { PlanTag } from "@kypstamping/ui/shell";
import { Plus, Trash2 } from "lucide-react";
import { planFor, refusal, retryOnce, usePlanGate, writeBlock } from "@/lib/plan";
import {
  BlockedNote,
  onlyDigits,
  onlyMoney,
  pesosToCentavos,
  type Notify,
} from "@/components/views/shared";

/** The product defaults, from the site: welcome on, once a day, nothing else set. */
export const DEFAULT_RULES: StampRules = {
  welcomeStamp: true,
  cooldownMinutes: 1440,
  minSpendCentavos: 0,
  expiryDays: 0,
  startsAt: null,
  endsAt: null,
  onClose: "expire",
  successorProgramId: null,
  rewardGraceDays: 30,
  maxCompletions: 0,
};

/** A pending welcome stamp lives this long before it lapses. From the site. */
const PENDING_STAMP_DAYS = 30;

const COOLDOWNS = [
  { minutes: 1440, label: "Once a day" },
  { minutes: 720, label: "Twice a day" },
  { minutes: 0, label: "Custom" },
] as const;

const cooldownWords = (minutes: number) => {
  if (minutes === 1440) return "one stamp a day";
  if (minutes === 720) return "two stamps a day, twelve hours apart";
  if (minutes % 60 === 0) return `one stamp every ${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  return `one stamp every ${minutes} minutes`;
};

const dateOnly = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const toIso = (date: string) => (date ? new Date(`${date}T00:00`).toISOString() : null);

/** The terms the way the customer reads them on the card. */
export function cardTerms(program: Program, rules: StampRules, successorName?: string) {
  const lines = [`${program.target} ${program.target === 1 ? "visit" : "visits"} → ${program.rewardName || "a reward"}`];
  if (rules.welcomeStamp) {
    lines.push(`A welcome stamp is waiting, pending until your first visit is confirmed. It lapses after ${PENDING_STAMP_DAYS} days.`);
  }
  lines.push(`Earn ${cooldownWords(rules.cooldownMinutes)}.`);
  if (rules.minSpendCentavos > 0) lines.push(`${pesoFromCentavos(rules.minSpendCentavos)} minimum for a stamp.`);
  if (rules.expiryDays > 0) lines.push(`Stamps and rewards expire ${rules.expiryDays} days after they are earned.`);
  if (rules.startsAt || rules.endsAt) {
    lines.push(
      `Runs ${rules.startsAt ? `from ${longDate(rules.startsAt)}` : ""}${rules.endsAt ? ` until ${longDate(rules.endsAt)}` : ""}.`.replace("Runs  until", "Runs until"),
    );
    lines.push(
      rules.onClose === "carryOver"
        ? `Unfinished stamps carry over to ${successorName ?? "the next card"} when it closes.`
        : "Unfinished stamps expire when the card closes.",
    );
    lines.push(`A reward you earned can be redeemed up to ${rules.rewardGraceDays} days after the card closes.`);
  }
  lines.push(
    rules.maxCompletions === 0
      ? "Complete the card as many times as you like; rewards are held until you redeem them."
      : `Complete the card up to ${rules.maxCompletions} time${rules.maxCompletions === 1 ? "" : "s"}; rewards are held until you redeem them.`,
  );
  lines.push("You approve each redemption on your phone before it is handed over.");
  return lines;
}

/** The counter messages these rules produce. */
function staffMessages(program: Program, rules: StampRules) {
  const next = new Date(Date.now() + rules.cooldownMinutes * 60_000).toISOString();
  const closes = rules.endsAt ? longDate(rules.endsAt) : null;
  const redeemBy = rules.endsAt
    ? longDate(new Date(new Date(rules.endsAt).getTime() + rules.rewardGraceDays * 86_400_000).toISOString())
    : null;
  return [
    ["Cooldown refusal", `No stamp yet: ${cooldownWords(rules.cooldownMinutes)}. Next stamp ${timeOfDay(next)}${rules.cooldownMinutes >= 1440 ? " tomorrow" : ""}. The visit is recorded.`],
    ...(rules.minSpendCentavos > 0
      ? [["Minimum spend not met", `Below the ${pesoFromCentavos(rules.minSpendCentavos)} minimum for a stamp. The visit is recorded; no stamp.`]]
      : []),
    ...(rules.welcomeStamp ? [["Welcome stamp confirmed", "First visit confirmed. Card reads 2."]] : []),
    ["Card completed", `${program.target} of ${program.target}. ${program.rewardName || "The reward"} is held until the customer approves it on their phone.`],
    ...(rules.maxCompletions > 0 ? [["Completion cap", `Completed ${rules.maxCompletions} time${rules.maxCompletions === 1 ? "" : "s"}; this card has stopped earning. The held reward is unaffected.`]] : []),
    ...(closes ? [["Card closed", `This card closed on ${closes}. Held rewards can be redeemed until ${redeemBy}.`]] : []),
  ] as const;
}

export function ProgramRulesEditor({ program, notify }: { program: Program; notify: Notify }) {
  const { data: programs = [] } = usePrograms();
  const { data: branding } = useBranding();
  const [draft, setDraft] = useState<StampRules | null>(null);
  const [draftFor, setDraftFor] = useState(program.id);
  if (draftFor !== program.id) {
    setDraftFor(program.id);
    setDraft(null);
  }
  const rules = draft ?? program.rules ?? DEFAULT_RULES;
  // The API sends rules on every stamp program; if one ever arrives without
  // them, the editor starts from the product defaults and saving writes them.
  const carried = Boolean(program.rules);
  const successors = programs.filter(
    (candidate) => candidate.id !== program.id && candidate.type === "Stamps" && candidate.status === "Live",
  );
  const successorName = successors.find((candidate) => candidate.id === rules.successorProgramId)?.name;
  const { data: closePreview } = useClosePreview(program.id, rules.onClose);
  const save = useApiMutation((body: StampRules) => retryOnce(() => setStampRules(program.id, body)), {
    invalidates: [keys.business.programs()],
  });
  const edit = (patch: Partial<StampRules>) => setDraft({ ...rules, ...patch });
  // "Custom" was unclickable, and derived state was why. It read as "the
  // current value is not one of the presets", so pressing it wrote
  // `customMinutes` - which starts at the current value, a preset - and the
  // value stayed a preset. The button never lit, the input never appeared,
  // and the only way into custom was to already be in it. Pressing it is now
  // a choice the component remembers.
  const [customPicked, setCustomPicked] = useState(false);
  const customCooldown =
    customPicked || !COOLDOWNS.some((option) => option.minutes === rules.cooldownMinutes);
  const [customMinutes, setCustomMinutes] = useState(String(rules.cooldownMinutes));
  const [customCompletions, setCustomCompletions] = useState(String(rules.maxCompletions || 2));

  return (
    <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
      <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Eyebrow>The stamp card</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">Card rules, on every plan</h2>
          </div>
          <span className="flex items-center gap-2">
            <PlanTag plan="Launch" included />
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
          These are the rules of the card, not upsells. Held-until-redeemed, customer approval and grandfathering are always on.
          {!carried && " Nothing is saved for this card yet; these are the defaults until you save."}
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 text-xs font-bold sm:col-span-2">
            <Checkbox checked={rules.welcomeStamp} onChange={(event) => edit({ welcomeStamp: event.target.checked })} className="mt-0.5" />
            <span>
              Welcome stamp
              <span className="mt-1 block font-normal leading-relaxed text-[var(--muted-strong)]">
                A pending stamp lands when someone joins from your poster and becomes real when staff confirm their first visit, so the card reads two. Turn it off if your ticket is too high to give one away.
              </span>
            </span>
          </label>
          <Field label="Target, 1 to 30" hint="Raising it grandfathers cards in progress. Saved with the program record.">
            <Input value={program.target} readOnly />
          </Field>
          <Field label="Reward, in plain words" hint="Saved with the program record on the right.">
            <Input value={program.rewardName} readOnly />
          </Field>
          <fieldset className="sm:col-span-2">
            <legend className="text-xs font-bold">Cooldown between stamps</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {COOLDOWNS.map((option) => {
                const on = option.minutes === 0 ? customCooldown : rules.cooldownMinutes === option.minutes;
                return (
                  <Chip
                    key={option.label}
                    pressed={on}
                    onClick={() => {
                      if (option.minutes === 0) {
                        setCustomPicked(true);
                        // Whatever is in the box, or an hour to start from -
                        // never 0, which would mean no cooldown at all.
                        edit({ cooldownMinutes: Number(customMinutes) || 60 });
                        return;
                      }
                      setCustomPicked(false);
                      edit({ cooldownMinutes: option.minutes });
                    }}
                  >
                    {option.label}
                  </Chip>
                );
              })}
              {customCooldown && (
                <Input
                  aria-label="Cooldown in minutes"
                  value={customMinutes}
                  onChange={(event) => {
                    const typed = onlyDigits(event.target.value);
                    setCustomMinutes(typed);
                    if (Number(typed) > 0) edit({ cooldownMinutes: Number(typed) });
                  }}
                  inputMode="numeric"
                  placeholder="minutes"
                  className="max-w-32"
                />
              )}
            </div>
            <p className="mt-1 text-[10px] font-semibold text-[var(--muted)]">
              So a card cannot be filled in one afternoon. A restaurant with lunch and dinner service can set two.
            </p>
          </fieldset>
          <Field label="Minimum spend per stamp, pesos" hint="Optional. Shown on the card so nobody argues at the counter.">
            <Input
              value={rules.minSpendCentavos ? String(rules.minSpendCentavos / 100) : ""}
              onChange={(event) => edit({ minSpendCentavos: pesosToCentavos(onlyMoney(event.target.value)) })}
              inputMode="decimal"
              placeholder="Off"
            />
          </Field>
          <Field label="Stamp expiry, days" hint="Off unless set. One term for unclaimed stamps and earned rewards, shown before the first stamp.">
            <Input
              value={rules.expiryDays || ""}
              onChange={(event) => edit({ expiryDays: Number(onlyDigits(event.target.value)) })}
              inputMode="numeric"
              placeholder="Off"
            />
          </Field>
          <Field label="Runs from" hint="Empty means forever.">
            <Input type="date" value={dateOnly(rules.startsAt)} onChange={(event) => edit({ startsAt: toIso(event.target.value) })} />
          </Field>
          <Field label="Runs until" hint="The card closes by itself at the end.">
            <Input type="date" value={dateOnly(rules.endsAt)} min={dateOnly(rules.startsAt)} onChange={(event) => edit({ endsAt: toIso(event.target.value) })} />
          </Field>
          <fieldset className="sm:col-span-2">
            <legend className="text-xs font-bold">Unfinished stamps at close</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["expire", "carryOver"] as const).map((option) => (
                <Chip
                  key={option}
                  pressed={rules.onClose === option}
                  onClick={() => edit({ onClose: option, successorProgramId: option === "expire" ? null : rules.successorProgramId })}
                >
                  {option === "expire" ? "Expire" : "Carry over to a successor card"}
                </Chip>
              ))}
            </div>
            {rules.onClose === "carryOver" && (
              <div className="mt-3">
                <Field label="Successor card" hint="Only live stamp cards can receive them.">
                  <Select value={rules.successorProgramId ?? ""} onChange={(event) => edit({ successorProgramId: event.target.value || null })}>
                    <option value="">Choose a card</option>
                    {successors.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>{candidate.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}
            {rules.endsAt && closePreview && (
              <p className="mt-3 rounded-xl bg-[var(--paper)] p-3 text-xs leading-relaxed">
                <strong>{closePreview.openCards} open cards</strong> would{" "}
                {rules.onClose === "carryOver" ? `carry over${successorName ? ` to ${successorName}` : ""}` : "expire"} at close;{" "}
                <strong>{closePreview.heldRewards} held rewards</strong> keep their {rules.rewardGraceDays}-day grace. Earned rewards are always honoured.
              </p>
            )}
          </fieldset>
          <Field label="Reward grace after close, days" hint="How long a held reward can still be redeemed after the card closes.">
            <Input value={rules.rewardGraceDays} onChange={(event) => edit({ rewardGraceDays: Number(onlyDigits(event.target.value)) })} inputMode="numeric" />
          </Field>
          <fieldset>
            <legend className="text-xs font-bold">Completions per member</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["One", 1],
                ["A number", -1],
                ["Unlimited", 0],
              ].map(([label, value]) => {
                const on = value === -1 ? rules.maxCompletions > 1 : rules.maxCompletions === value;
                return (
                  <Chip
                    key={String(label)}
                    pressed={on}
                    onClick={() => edit({ maxCompletions: value === -1 ? Math.max(2, Number(customCompletions) || 2) : Number(value) })}
                  >
                    {label}
                  </Chip>
                );
              })}
              {rules.maxCompletions > 1 && (
                <Input
                  aria-label="Completions per member"
                  value={customCompletions}
                  onChange={(event) => {
                    const typed = onlyDigits(event.target.value);
                    setCustomCompletions(typed);
                    if (Number(typed) > 1) edit({ maxCompletions: Number(typed) });
                  }}
                  inputMode="numeric"
                  className="max-w-20"
                />
              )}
            </div>
          </fieldset>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            disabled={(carried && !draft) || save.isPending}
            onClick={() =>
              save.mutate(draft ?? rules, {
                onSuccess: () => {
                  setDraft(null);
                  notify("Card rules saved. Cards in progress keep their target.");
                },
                onError: (failure) => notify(refusal(failure), "error"),
              })
            }
          >
            {save.isPending ? "Saving…" : "Save card rules"}
          </Button>
          {draft && (
            <Button tone="quiet" onClick={() => setDraft(null)}>
              Discard changes
            </Button>
          )}
        </div>
      </article>

      <div className="space-y-3">
        <article className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <div className="flex items-center justify-between">
            <Eyebrow>Card preview</Eyebrow>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">As the customer reads it</span>
          </div>
          <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.02em]">{program.name}</h3>
          <div className="mt-5 overflow-x-auto pb-1">
            <StampDots
              filled={rules.welcomeStamp ? 1 : 0}
              total={Math.max(1, Math.min(30, program.target))}
              icon={branding?.stampIcon}
              imageUrl={branding?.stampImageUrl}
              dark
            />
          </div>
          {rules.welcomeStamp && (
            <p className="mt-2 text-[11px] text-[var(--accent)]">1 pending welcome stamp, confirmed on your first visit</p>
          )}
          <ul className="mt-5 space-y-2 border-t border-dashed border-white/20 pt-4 text-xs leading-relaxed text-white/75">
            {cardTerms(program, rules, successorName).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <Eyebrow>What staff will see</Eyebrow>
          <p className="mt-1 text-xs text-[var(--muted-strong)]">The counter messages these rules produce. Every refusal names the reason and the time.</p>
          <dl className="mt-4 divide-y divide-[var(--line)]">
            {staffMessages(program, rules).map(([label, message]) => (
              <div key={label} className="py-3">
                <dt className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</dt>
                <dd className="mt-1 text-xs font-bold">{message}</dd>
              </div>
            ))}
          </dl>
        </article>
      </div>
    </section>
  );
}

/** Different rates for coffee and food, or one hero item. Points programs, Grow. */
export function CategoryRatesEditor({ programId, notify }: { programId: string; notify: Notify }) {
  const gate = usePlanGate();
  const needed = planFor("Earn by category or item");
  const { data: rates = [] } = useCategoryRates(programId);
  const preview = isPreview(rates);
  const blocked = writeBlock(gate, needed, preview);
  const [draft, setDraft] = useState<Omit<CategoryRate, "id" | "preview">[] | null>(null);
  const [draftFor, setDraftFor] = useState(programId);
  if (draftFor !== programId) {
    setDraftFor(programId);
    setDraft(null);
  }
  const rows = draft ?? rates.map(({ category, rateBps, items }) => ({ category, rateBps, items }));
  const save = useApiMutation(
    (body: Omit<CategoryRate, "id" | "preview">[]) => retryOnce(() => setCategoryRates(programId, body)),
    { invalidates: [keys.levers.categoryRates(programId)] },
  );
  const editRow = (index: number, patch: Partial<(typeof rows)[number]>) =>
    setDraft(rows.map((row, at) => (at === index ? { ...row, ...patch } : row)));

  return (
    <section className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Eyebrow>Earn by category or item</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">Category earning rates</h2>
        </div>
        <span className="flex items-center gap-2">
          {preview && <PreviewBadge />}
          <PlanTag plan={needed} included={gate.covers(needed)} />
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
        Different rates for coffee and food, services and retail, or one hero item you want to move. Needs items entered at the counter or a connected register. 1× is the program&rsquo;s base rate.
      </p>
      <ul className="mt-4 space-y-2">
        {rows.map((row, index) => (
          <li key={index} className="grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 sm:grid-cols-[1fr_120px_2fr_auto] sm:items-end">
            <Field label="Category">
              <Input value={row.category} onChange={(event) => editRow(index, { category: event.target.value })} />
            </Field>
            <Field label="Rate ×">
              <Input value={(row.rateBps / 10_000).toString()} onChange={(event) => editRow(index, { rateBps: Math.round((Number.parseFloat(event.target.value) || 0) * 10_000) })} inputMode="decimal" />
            </Field>
            <Field label="Items, comma separated">
              <Input value={row.items.join(", ")} onChange={(event) => editRow(index, { items: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
            </Field>
            <IconButton tone="quiet" label={`Remove ${row.category || "row"}`} onClick={() => setDraft(rows.filter((_, at) => at !== index))} className="text-[var(--danger)]">
              <Trash2 size={14} />
            </IconButton>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button tone="quiet" icon={<Plus size={15} />} onClick={() => setDraft([...rows, { category: "", rateBps: 10_000, items: [] }])}>
          Add a category
        </Button>
        <Button
          disabled={Boolean(blocked) || !draft || save.isPending || rows.some((row) => !row.category.trim())}
          title={blocked ?? undefined}
          onClick={() =>
            draft &&
            save.mutate(draft, {
              onSuccess: () => {
                setDraft(null);
                notify("Category rates saved.");
              },
              onError: (failure) => notify(refusal(failure, needed), "error"),
            })
          }
        >
          {save.isPending ? "Saving…" : "Save rates"}
        </Button>
        <BlockedNote reason={blocked} />
      </div>
    </section>
  );
}
