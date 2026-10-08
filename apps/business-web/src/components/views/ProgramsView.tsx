"use client";

import { useState } from "react";
import {
  useCatalog,
  useCoupons,
  usePrograms,
  useTiers,
  type Program,
  type ProgramDraft,
} from "@kyprewards/api";
import { Button, Eyebrow, Pill, QueryBoundary, ViewFrame } from "@kyprewards/ui";
import { Chip, Field, Input } from "@kyprewards/ui/form";
import { pesoFromCentavos } from "@kyprewards/ui/format";
import { PlanTag } from "@kyprewards/ui/shell";
import { BadgeCheck, Coins, CreditCard, Gift, Plus, ShieldCheck, Stamp, TicketCheck, WalletCards } from "lucide-react";
import { NewProgramDialog } from "@/components/WorkspaceForms";
import {
  useAddCatalogItem,
  useAddTier,
  useDuplicateProgram,
  useIssueCoupon,
  useIssueGiftCard,
  useUpdateProgram,
} from "@/components/mutations";
import { programCap, refusal, usePlanGate } from "@/lib/plan";
import { CategoryRatesEditor, PointsEarningEditor, ProgramRulesEditor } from "@/components/views/ProgramRules";
import type { Notify } from "@/components/views/shared";

const programIcons: Record<string, typeof Stamp> = {
  Stamps: Stamp,
  Points: Coins,
  Discount: CreditCard,
  Membership: BadgeCheck,
  Coupon: TicketCheck,
  Rewards: Gift,
  Multipass: WalletCards,
  "Gift card": CreditCard,
};
const PROGRAM_STATUSES = ["Live", "Ready", "Draft"] as const;
/**
 * The part of a program that is stock rather than rules.
 *
 * A Coupon program needs coupons, a Gift card program needs cards, and a
 * Rewards program needs a catalog to spend points on. None of that is
 * editable in the rule editor and none of it existed anywhere else, so three
 * of the eight types could be configured and never used.
 */
function ProgramStock({ program, notify }: { program: Program; notify: Notify }) {
  const issueCouponFor = useIssueCoupon();
  const issueCard = useIssueGiftCard();
  const addItem = useAddCatalogItem();
  const addTierRung = useAddTier();
  const { data: coupons = [] } = useCoupons({ enabled: program.type === "Coupon" });
  const { data: catalog = [] } = useCatalog(program.type === "Rewards" ? program.id : "");
  const hasTiers = program.type === "Points" || program.type === "Discount";
  const { data: tiers = [] } = useTiers(hasTiers ? program.id : "");
  const [couponName, setCouponName] = useState("");
  const [couponValue, setCouponValue] = useState("");
  const [cardValue, setCardValue] = useState("");
  const [cardFor, setCardFor] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCost, setItemCost] = useState("");
  const [tierName, setTierName] = useState("");
  const [tierThreshold, setTierThreshold] = useState("");
  const [tierRate, setTierRate] = useState("");

  const pesosToCentavos = (typed: string) => Math.round(Number.parseFloat(typed) * 100);
  const onlyMoney = (typed: string) => typed.replace(/[^0-9.]/g, "");
  const onlyDigits = (typed: string) => typed.replace(/[^0-9]/g, "");

  if (program.type === "Coupon") {
    const active = coupons.filter((coupon) => coupon.state === "active");
    return (
      <div className="mt-5 rounded-2xl border border-white/12 bg-white/5 p-4">
        <Eyebrow>Coupons</Eyebrow>
        <p className="mt-2 text-xs text-white/55">
          {active.length} active of {coupons.length} issued. Single use, enforced
          by the API rather than by the counter.
        </p>
        <div className="mt-4 grid gap-2">
          <Input
            value={couponName}
            onChange={(event) => setCouponName(event.target.value)}
            surface="dark"
            aria-label="What it is for"
            placeholder="What it is for"
          />
          <Input
            value={couponValue}
            onChange={(event) => setCouponValue(onlyMoney(event.target.value))}
            inputMode="decimal"
            surface="dark"
            aria-label="Value in pesos"
            placeholder="Value in pesos"
          />
          <Button
            tone="accent"
            disabled={!couponName.trim() || !couponValue || issueCouponFor.isPending}
            onClick={() =>
              issueCouponFor.mutate(
                {
                  name: couponName.trim(),
                  valueCentavos: pesosToCentavos(couponValue),
                  programId: program.id,
                },
                {
                  onSuccess: (issued) => {
                    setCouponName("");
                    setCouponValue("");
                    notify(`Coupon ${issued.code} issued.`);
                  },
                  onError: (failure) => notify(refusal(failure), "error"),
                },
              )
            }
          >
            Issue a coupon
          </Button>
        </div>
        {active.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {active.slice(0, 6).map((coupon) => (
              <li key={coupon.id} className="flex justify-between gap-3 text-xs">
                <span className="truncate font-mono text-white/70">{coupon.code}</span>
                <span className="shrink-0 font-bold">
                  {pesoFromCentavos(coupon.valueCentavos)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (program.type === "Gift card") {
    return (
      <div className="mt-5 rounded-2xl border border-white/12 bg-white/5 p-4">
        <Eyebrow>Gift cards</Eyebrow>
        <p className="mt-2 text-xs text-white/55">
          Sold at the counter and spent down in parts. The code is what the
          holder presents.
        </p>
        <div className="mt-4 grid gap-2">
          <Input
            value={cardFor}
            onChange={(event) => setCardFor(event.target.value)}
            surface="dark"
            aria-label="Who it is for, optional"
            placeholder="Who it is for, optional"
          />
          <Input
            value={cardValue}
            onChange={(event) => setCardValue(onlyMoney(event.target.value))}
            inputMode="decimal"
            surface="dark"
            aria-label="Amount in pesos"
            placeholder="Amount in pesos"
          />
          <Button
            tone="accent"
            disabled={!cardValue || issueCard.isPending}
            onClick={() =>
              issueCard.mutate(
                {
                  amountCentavos: pesosToCentavos(cardValue),
                  issuedToName: cardFor.trim(),
                  programId: program.id,
                },
                {
                  onSuccess: (card) => {
                    setCardValue("");
                    setCardFor("");
                    notify(`Gift card ${card.code} issued.`);
                  },
                  onError: (failure) => notify(refusal(failure), "error"),
                },
              )
            }
          >
            Issue a gift card
          </Button>
        </div>
      </div>
    );
  }

  if (program.type === "Rewards") {
    return (
      <div className="mt-5 rounded-2xl border border-white/12 bg-white/5 p-4">
        <Eyebrow>Reward catalog</Eyebrow>
        <p className="mt-2 text-xs text-white/55">
          What points buy. Without at least one item a points balance has
          nowhere to go.
        </p>
        {catalog.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {catalog.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-xs">
                <span className="truncate">{item.name}</span>
                <span className="shrink-0 font-bold">{item.costUnits} pts</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 grid gap-2">
          <Input
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            surface="dark"
            aria-label="Item name"
            placeholder="Item name"
          />
          <Input
            value={itemCost}
            onChange={(event) => setItemCost(onlyDigits(event.target.value))}
            inputMode="numeric"
            surface="dark"
            aria-label="Cost in points"
            placeholder="Cost in points"
          />
          <Button
            tone="accent"
            disabled={!itemName.trim() || !itemCost || addItem.isPending}
            onClick={() =>
              addItem.mutate(
                {
                  programId: program.id,
                  name: itemName.trim(),
                  costUnits: Number(itemCost),
                },
                {
                  onSuccess: (item) => {
                    setItemName("");
                    setItemCost("");
                    notify(`${item.name} added to the catalog.`);
                  },
                  onError: (failure) => notify(refusal(failure), "error"),
                },
              )
            }
          >
            Add to catalog
          </Button>
        </div>
      </div>
    );
  }

  if (program.type === "Points" || program.type === "Discount") {
    const isPoints = program.type === "Points";
    return (
      <div className="mt-5 rounded-2xl border border-white/12 bg-white/5 p-4">
        <Eyebrow>Earning tiers</Eyebrow>
        <p className="mt-2 text-xs text-white/55">
          {isPoints
            ? "A member who has cleared a tier earns at its multiplier instead of the base rate."
            : "A member who has cleared a tier is charged at its rate instead of the base discount."}{" "}
          Tiers unlock on lifetime visits, and the API applies the highest one
          cleared.
        </p>
        {tiers.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {tiers.map((tier) => (
              <li key={tier.id} className="flex justify-between gap-3 text-xs">
                <span className="truncate">
                  {tier.name}
                  <span className="text-white/55"> · from {tier.threshold} visits</span>
                </span>
                <span className="shrink-0 font-bold">
                  {isPoints
                    ? `${(tier.rateBps / 10000).toFixed(2)}x`
                    : `${(tier.rateBps / 100).toFixed(1)}%`}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 grid gap-2">
          <Input
            value={tierName}
            onChange={(event) => setTierName(event.target.value)}
            surface="dark"
            aria-label="Tier name, for example Gold"
            placeholder="Tier name, for example Gold"
          />
          <Input
            value={tierThreshold}
            onChange={(event) => setTierThreshold(onlyDigits(event.target.value))}
            inputMode="numeric"
            surface="dark"
            aria-label="Unlocks at how many visits"
            placeholder="Unlocks at how many visits"
          />
          <Input
            value={tierRate}
            onChange={(event) => setTierRate(onlyMoney(event.target.value))}
            inputMode="decimal"
            surface="dark"
            aria-label={isPoints ? "Multiplier, for example 1.5" : "Percent off, for example 12.5"}
            placeholder={isPoints ? "Multiplier, for example 1.5" : "Percent off, for example 12.5"}
          />
          <Button
            tone="accent"
            disabled={!tierName.trim() || !tierThreshold || !tierRate || addTierRung.isPending}
            onClick={() =>
              addTierRung.mutate(
                {
                  programId: program.id,
                  name: tierName.trim(),
                  threshold: Number(tierThreshold),
                  // Basis points either way: 10000 is one multiplier or 100%.
                  rateBps: Math.round(
                    Number.parseFloat(tierRate) * (isPoints ? 10000 : 100),
                  ),
                },
                {
                  onSuccess: (tier) => {
                    setTierName("");
                    setTierThreshold("");
                    setTierRate("");
                    notify(`${tier.name} unlocks at ${tier.threshold} visits.`);
                  },
                  onError: (failure) => notify(refusal(failure), "error"),
                },
              )
            }
          >
            Add a tier
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

export function ProgramsView({ notify }: { notify: Notify }) {
  const { data: programs = [], isPending, error, refetch } = usePrograms();
  const gate = usePlanGate();
  const cap = programCap(gate.plan);
  const liveCount = programs.filter((program) => program.status === "Live").length;
  const duplicate = useDuplicateProgram();
  const update = useUpdateProgram();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const selected = programs.find((program) => program.id === selectedId) ?? programs[0];

  /**
   * The rule editor holds a draft rather than writing through.
   *
   * It used to call updateProgramRule on every keystroke, which against a
   * fixture was free and against the API is one PATCH per character. The
   * draft is keyed by program id, so changing selection re-seeds it.
   */
  const [draft, setDraft] = useState<Partial<ProgramDraft>>({});
  const [draftFor, setDraftFor] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  if (selected && draftFor !== selected.id) {
    setDraftFor(selected.id);
    setDraft({
      name: selected.name,
      status: selected.status,
      // A Coupon, Gift card, Membership or Discount carries target 0, and the
      // API refuses anything below 1. Seeding the draft with that 0 meant
      // publishing any non-stamp program answered "target: Input should be
      // greater than or equal to 1" over a field its editor never touched.
      // The patch field is optional, so an unused target is simply not sent.
      target: selected.target || undefined,
      rewardName: selected.rewardName,
      rewardValueCentavos: selected.rewardValueCentavos,
    });
  }

  if (isPending || error || !selected) {
    return (
      <ViewFrame
        eyebrow="Loyalty engine"
        title="Programs"
        description="Run all eight proven loyalty mechanics from one rules engine."
      >
        <QueryBoundary
          isPending={isPending}
          error={error}
          onRetry={refetch}
          label="programs"
        >
          <p className="text-sm text-[var(--muted-strong)]">
            No programs yet. Create one to start earning.
          </p>
        </QueryBoundary>
      </ViewFrame>
    );
  }

  return (
    <ViewFrame
      eyebrow="Loyalty engine"
      title="Programs"
      description="The stamp card on every plan, and seven more types from Core: points, discounts, coupons, memberships, a reward catalog, multipass and gift cards, all on one engine."
      action={
        <span className="flex flex-wrap items-center gap-2">
          <Pill tone={cap > 0 && liveCount >= cap ? "warning" : "neutral"}>
            {liveCount} of {cap > 0 ? cap : "unlimited"} live
          </Pill>
          <PlanTag plan="Launch" included />
          <Button icon={<Plus size={16} />} onClick={() => setCreating(true)}>
            New program
          </Button>
        </span>
      }
    >
      <p className="mb-3 text-xs leading-relaxed text-[var(--muted-strong)]">
        One live program on Launch, three on Core, unlimited on Grow. A draft can always be written; the API refuses switching it live past the cap or above your plan, and says which plan opens it.
      </p>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="grid sm:grid-cols-2">
            {programs.map((program, index) => {
              const Icon = programIcons[program.type] ?? Gift;
              const active = selected.id === program.id;
              return (
                <button
                  type="button"
                  key={program.id}
                  aria-pressed={active}
                  onClick={() => setSelectedId(program.id)}
                  className={`min-h-44 border-[var(--line)] p-5 text-left transition ${index > 1 ? "border-t" : ""} ${index % 2 === 1 ? "sm:border-l" : ""} ${index === 1 ? "border-t sm:border-t-0" : ""} ${active ? "bg-[var(--accent)]" : "hover:bg-[var(--paper)]"}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-[var(--paper)]">
                      <Icon size={18} />
                    </span>
                    <Pill
                      tone={
                        program.status === "Live"
                          ? "success"
                          : program.status === "Ready"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {program.status}
                    </Pill>
                  </div>
                  <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted-strong)]">
                    {program.type}
                  </p>
                  <h3 className="mt-1 text-base font-extrabold">{program.name}</h3>
                </button>
              );
            })}
          </div>
        </section>
        <aside className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <Eyebrow>Program record</Eyebrow>
          <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--accent)]">
            {selected.type}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.02em]">
            {selected.name}
          </h2>
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
            {[
              ["Members", selected.members.toLocaleString()],
              ["Completion", `${selected.completion}%`],
              ["Redemption", `${selected.redemption}%`],
              ["Liability", pesoFromCentavos(selected.liabilityCentavos)],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--ink-soft)] p-4">
                <p className="text-[10px] text-white/50">{label}</p>
                <p className="mt-1 text-lg font-extrabold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-2xl border border-white/12 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-[var(--accent)]"
              />
              <p className="text-xs leading-relaxed text-white/65">
                Existing points, balances, and rewards remain protected.
              </p>
            </div>
          </div>
          <ProgramStock program={selected} notify={notify} />
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button
              tone="ghost"
              disabled={duplicate.isPending}
              onClick={() =>
                duplicate.mutate(selected.id, {
                  onSuccess: (copy) =>
                    notify(`${copy.name} added to your programs as a draft.`),
                  onError: (failure) => notify(refusal(failure), "error"),
                })
              }
            >
              Duplicate
            </Button>
            <Button
              tone="accent"
              aria-expanded={editing}
              onClick={() => setEditing((open) => !open)}
            >
              {editing ? "Close editor" : "Edit rules"}
            </Button>
          </div>
          {editing && (
            <div className="mt-5 rounded-2xl border border-white/12 bg-white/5 p-4">
              <Eyebrow>Rule editor</Eyebrow>
              <Field label="Program name" surface="dark" className="mt-4">
                <Input
                  value={draft.name ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Field>
              <fieldset className="mt-4">
                <legend className="text-xs font-bold">Status</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PROGRAM_STATUSES.map((status) => (
                    <Chip
                      key={status}
                      surface="dark"
                      pressed={draft.status === status}
                      onClick={() => setDraft((current) => ({ ...current, status }))}
                    >
                      {status}
                    </Chip>
                  ))}
                </div>
              </fieldset>
              <Field label="Reward" surface="dark" className="mt-4">
                <Input
                  value={draft.rewardName ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, rewardName: event.target.value }))
                  }
                />
              </Field>
              <Field label="Visits to earn it" surface="dark" className="mt-4">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={draft.target ?? 1}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      target: Number(event.target.value) || 1,
                    }))
                  }
                />
              </Field>
              {/* Derived from the ledger, so it is shown rather than edited.
                  It used to be an input, which could never have saved. */}
              <p className="mt-4 text-xs text-white/55">
                Outstanding reward liability{" "}
                <span className="font-extrabold text-white">
                  {pesoFromCentavos(selected.liabilityCentavos)}
                </span>
              </p>
              <Button
                tone="accent"
                className="mt-5 w-full"
                disabled={update.isPending}
                onClick={() =>
                  update.mutate(
                    { id: selected.id, patch: draft },
                    {
                      onSuccess: (saved) => {
                        setEditing(false);
                        notify(`${saved.name} saved.`);
                      },
                      // The API refuses a target outside 1-30 and names the
                      // field. There is one editor on this screen, so the
                      // message carries enough on its own.
                      onError: (failure) => notify(refusal(failure), "error"),
                    },
                  )
                }
              >
                {update.isPending ? "Saving\u2026" : "Publish new version"}
              </Button>
            </div>
          )}
        </aside>
      </div>
      {selected.type === "Stamps" && <ProgramRulesEditor program={selected} notify={notify} />}
      {selected.type === "Points" && <PointsEarningEditor program={selected} notify={notify} />}
      {selected.type === "Points" && <CategoryRatesEditor programId={selected.id} notify={notify} />}
      {creating && (
        <NewProgramDialog onClose={() => setCreating(false)} notify={notify} />
      )}
    </ViewFrame>
  );
}
