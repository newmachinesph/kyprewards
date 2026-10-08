"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getCouponPage,
  getGiftCards,
  keys,
  useBusinessCustomers,
  usePrograms,
  type Coupon,
  type GiftCard,
  type Program,
  type ProgramType,
} from "@kyprewards/api";
import { Button, Eyebrow, Pill, QueryBoundary, ViewFrame } from "@kyprewards/ui";
import { Chip, Field, Input, Segmented, Select, Switch } from "@kyprewards/ui/form";
import { longDate, pesoFromCentavos } from "@kyprewards/ui/format";
import { PlanTag } from "@kyprewards/ui/shell";
import { BadgeCheck, Coins, CreditCard, Gift, Plus, ShieldCheck, Stamp, TicketCheck, WalletCards } from "lucide-react";
import {
  NewProgramDialog,
  REWARD_PLACEHOLDER,
  settingFromText,
  settingsFor,
  settingToText,
  typeSettingsBody,
  type SettingName,
} from "@/components/WorkspaceForms";
import { useDuplicateProgram, useIssueCoupon, useUpdateProgram } from "@/components/mutations";
import { useIssueGiftCard, useRefundGiftCard, useVoidGiftCard } from "@/components/mutations-programs";
import { programCap, refusal, usePlanGate } from "@/lib/plan";
import {
  CatalogEditor,
  CategoryRatesEditor,
  PointsEarningEditor,
  ProgramRulesEditor,
  TierEditor,
  placeErrors,
} from "@/components/views/ProgramRules";
import { isoDay, onlyMoney, pesosToCentavos, type Notify } from "@/components/views/shared";

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

/** What the "owed to customers" figure counts, per type. */
const OWED: Partial<Record<ProgramType, string>> = {
  "Gift card": "Balances left on the gift cards you have issued.",
  Multipass: "Passes sold and not yet used, at the price paid.",
  Points: "Rewards held for customers, plus cashback not yet spent.",
};
const owedWords = (type: ProgramType) => OWED[type] ?? "Rewards earned and held, not yet handed over.";

/** `"2026-10-08"` to the start or the end of that day, local time. */
const dayStart = (day: string) => new Date(`${day}T00:00`).toISOString();
const dayEnd = (day: string) => new Date(`${day}T23:59:59`).toISOString();

/**
 * Name, status, the one-line reward and the settings this type reads.
 *
 * Keyed by program id where it is used, so switching programs starts a fresh
 * draft. Only the type's own settings are sent: the API refuses the others by
 * name, and a Discount never carries a stamp target.
 */
function ProgramRecordEditor({
  program,
  notify,
  onSaved,
}: {
  program: Program;
  notify: Notify;
  onSaved: () => void;
}) {
  const update = useUpdateProgram();
  const settings = settingsFor(program.type);
  const [name, setName] = useState(program.name);
  const [status, setStatus] = useState(program.status);
  const [rewardName, setRewardName] = useState(program.rewardName);
  const [text, setText] = useState<Partial<Record<SettingName, string>>>(() =>
    Object.fromEntries(settings.map((setting) => [setting.name, settingToText(setting.unit, program[setting.name])])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function save() {
    const typed: Record<string, string> = {};
    const patch = {
      name: name.trim(),
      status,
      rewardName: rewardName.trim(),
      ...typeSettingsBody(program.type, (field) => {
        const setting = settings.find((candidate) => candidate.name === field)!;
        const value = settingFromText(setting.unit, text[field] ?? "");
        // Cleared means none: no discount, no price, unlimited benefits. The
        // two counts that must be at least 1 are left as they were.
        if (value === undefined) return field === "target" || field === "bundleSize" ? undefined : 0;
        if (!Number.isFinite(value)) typed[field] = "Enter a number";
        return value;
      }),
    };
    setErrors(typed);
    if (Object.keys(typed).length) return;
    update.mutate(
      { id: program.id, patch },
      {
        onSuccess: (saved) => {
          notify(`${saved.name} saved.`);
          onSaved();
        },
        onError: (failure) =>
          setErrors(placeErrors(failure, ["name", "status", "rewardName", ...settings.map((setting) => setting.name)], notify)),
      },
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-white/12 bg-white/5 p-4">
      <Eyebrow>Program settings</Eyebrow>
      <Field label="Program name" surface="dark" className="mt-4" error={errors.name}>
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <fieldset className="mt-4">
        <legend className="text-xs font-bold">Status</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROGRAM_STATUSES.map((option) => (
            <Chip key={option} surface="dark" pressed={status === option} onClick={() => setStatus(option)}>
              {option}
            </Chip>
          ))}
        </div>
        {errors.status && <p className="mt-1 text-xs font-bold text-[var(--danger-on-dark)]">{errors.status}</p>}
      </fieldset>
      <Field label="What the customer gets, in one line" surface="dark" className="mt-4" error={errors.rewardName}>
        <Input
          value={rewardName}
          placeholder={REWARD_PLACEHOLDER[program.type]}
          onChange={(event) => setRewardName(event.target.value)}
        />
      </Field>
      {settings.map((setting) => (
        <Field
          key={setting.name}
          label={setting.label}
          hint={setting.hint}
          surface="dark"
          className="mt-4"
          error={errors[setting.name]}
        >
          <Input
            value={text[setting.name] ?? ""}
            placeholder={setting.placeholder}
            inputMode={setting.unit === "count" ? "numeric" : "decimal"}
            onChange={(event) => setText((current) => ({ ...current, [setting.name]: event.target.value }))}
          />
        </Field>
      ))}
      <Button tone="accent" className="mt-5 w-full" disabled={update.isPending || !name.trim()} onClick={save}>
        {update.isPending ? "Saving…" : "Publish new version"}
      </Button>
    </div>
  );
}

const couponWorth = (coupon: Coupon) =>
  coupon.valueCentavos > 0 ? pesoFromCentavos(coupon.valueCentavos) : `${coupon.percentBps / 100}% off`;

const COUPON_FIELDS = ["name", "valueCentavos", "percentBps", "customerId", "validFrom", "validUntil"];

/** The API's page cap. Both lists page by id, which is random, so whatever
 *  is loaded is sorted newest first here and the rest is a "Show more". */
const PAGE = 200;

function ShowMore({ more, busy }: { more: () => void; busy: boolean }) {
  return (
    <div className="border-t border-[var(--line)] p-4 text-center">
      <Button tone="quiet" size="sm" disabled={busy} onClick={more}>
        {busy ? "Loading…" : "Show more"}
      </Button>
    </div>
  );
}

/** Issue coupons for one Coupon program, and see where each one stands. */
function CouponDesk({ program, notify }: { program: Program; notify: Notify }) {
  const issue = useIssueCoupon();
  const couponPages = useInfiniteQuery({
    // Under `couponList()`, so issuing or redeeming a coupon refetches it.
    queryKey: [...keys.business.couponList(), "pages", PAGE],
    queryFn: ({ pageParam }) => getCouponPage({ limit: PAGE, cursor: pageParam || undefined }),
    initialPageParam: "",
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const coupons = (couponPages.data?.pages.flatMap((page) => page.items) ?? []).sort((a, b) =>
    b.validFrom.localeCompare(a.validFrom),
  );
  const { data: customers = [] } = useBusinessCustomers();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"pesos" | "percent">("pesos");
  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState(isoDay(new Date()));
  const [until, setUntil] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const amountField = mode === "pesos" ? "valueCentavos" : "percentBps";
  const ours = coupons.filter((coupon) => !coupon.programId || coupon.programId === program.id);
  const active = ours.filter((coupon) => coupon.state === "active").length;

  return (
    <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
      <form
        className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (until && from && until < from) {
            setErrors({ validUntil: "Pick an end date on or after the start." });
            return;
          }
          setErrors({});
          issue.mutate(
            {
              name: name.trim(),
              programId: program.id,
              ...(mode === "pesos"
                ? { valueCentavos: pesosToCentavos(amount) }
                : { percentBps: Math.round(Number.parseFloat(amount) * 100) }),
              ...(from && { validFrom: dayStart(from) }),
              ...(until && { validUntil: dayEnd(until) }),
              ...(customerId && { customerId }),
            },
            {
              onSuccess: (issued) => {
                setName("");
                setAmount("");
                setCustomerId("");
                notify(`Coupon ${issued.code} issued.`);
              },
              onError: (failure) => setErrors(placeErrors(failure, COUPON_FIELDS, notify)),
            },
          );
        }}
      >
        <Eyebrow>Issue a coupon</Eyebrow>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
          Single use. A coupon for one customer is handed over after they approve it on their phone; one for anyone works for whoever shows the code.
        </p>
        <div className="mt-4 grid gap-4">
          <Field label="What it is for" error={errors.name}>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="₱50 off any cake" />
          </Field>
          <Segmented
            label="Coupon worth"
            options={[
              { value: "pesos", label: "Pesos off" },
              { value: "percent", label: "Percent off" },
            ]}
            value={mode}
            onChange={setMode}
          />
          <Field label={mode === "pesos" ? "Pesos off" : "Percent off"} error={errors[amountField]}>
            <Input
              value={amount}
              onChange={(event) => setAmount(onlyMoney(event.target.value))}
              inputMode="decimal"
              placeholder={mode === "pesos" ? "50" : "10"}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valid from" error={errors.validFrom}>
              <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </Field>
            <Field label="Valid until" hint="Empty is 30 days." error={errors.validUntil}>
              <Input type="date" value={until} min={from} onChange={(event) => setUntil(event.target.value)} />
            </Field>
          </div>
          <Field label="For" hint="Optional. Pick a customer to issue it to them alone." error={errors.customerId}>
            <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Anyone with the code</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={!name.trim() || !(Number.parseFloat(amount) > 0) || issue.isPending}>
            {issue.isPending ? "Issuing…" : "Issue the coupon"}
          </Button>
        </div>
      </form>
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="border-b border-[var(--line)] p-5">
          <Eyebrow>Coupons</Eyebrow>
          <p className="mt-1 text-xs text-[var(--muted-strong)]">
            {active} active of {ours.length} issued.
          </p>
        </div>
        {ours.length === 0 ? (
          <p className="p-5 text-sm text-[var(--muted-strong)]">None issued yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-4 py-3">For</th>
                  <th className="px-4 py-3">Worth</th>
                  <th className="px-4 py-3">Valid until</th>
                  <th className="px-4 py-3">State</th>
                </tr>
              </thead>
              <tbody>
                {ours.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-5 py-3">
                      <span className="font-mono text-sm font-extrabold">{coupon.code}</span>
                      <span className="block text-xs text-[var(--muted-strong)]">{coupon.name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{coupon.customerId ? coupon.customerName : "Anyone with the code"}</td>
                    <td className="px-4 py-3 text-sm font-bold">{couponWorth(coupon)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-strong)]">{longDate(coupon.validUntil)}</td>
                    <td className="px-4 py-3">
                      <Pill tone={coupon.state === "active" ? "success" : coupon.state === "scheduled" ? "warning" : "neutral"}>
                        {coupon.state}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {couponPages.hasNextPage && (
          <ShowMore more={() => void couponPages.fetchNextPage()} busy={couponPages.isFetchingNextPage} />
        )}
      </div>
    </section>
  );
}

const GIFT_FIELDS = ["amountCentavos", "bonusCentavos", "issuedToName", "expiresOn"];

/**
 * Sell or give gift cards, and look after the ones out there.
 *
 * A card someone paid for never expires (RA 10962), so the expiry date only
 * appears for a promotional voucher. Refund and void are the API's to allow:
 * it asks for the roles that run the shop and says so when the caller is not.
 */
function GiftCardDesk({ program, notify }: { program: Program; notify: Notify }) {
  const issue = useIssueGiftCard();
  const refund = useRefundGiftCard();
  const voidCard = useVoidGiftCard();
  const [show, setShow] = useState<"active" | "all">("active");
  const cardPages = useInfiniteQuery({
    // Under `giftCards()`, so issuing, refunding or voiding refetches it.
    queryKey: [...keys.business.giftCardList({ status: show, limit: PAGE }), "pages"],
    queryFn: ({ pageParam }) => getGiftCards({ status: show, limit: PAGE, cursor: pageParam || undefined }),
    initialPageParam: "",
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const cards = (cardPages.data?.pages.flatMap((page) => page.items) ?? [])
    .filter((card) => !card.programId || card.programId === program.id)
    .sort((a, b) => (b.issuedAt ?? "").localeCompare(a.issuedAt ?? ""));
  const [amount, setAmount] = useState("");
  const [bonus, setBonus] = useState("");
  const [forName, setForName] = useState("");
  const [promotional, setPromotional] = useState(false);
  const [expiresOn, setExpiresOn] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refunding, setRefunding] = useState<{ code: string; amount: string } | null>(null);
  const paid = pesosToCentavos(amount);
  const extra = promotional ? 0 : pesosToCentavos(bonus);

  const doRefund = (card: GiftCard, amountCentavos: number) => {
    if (!window.confirm(`Put ${pesoFromCentavos(amountCentavos)} back on ${card.code}?`)) return;
    refund.mutate(
      { code: card.code, amountCentavos },
      {
        onSuccess: (saved) => {
          setRefunding(null);
          notify(`${saved.code} now holds ${pesoFromCentavos(saved.balanceCentavos)}.`);
        },
        onError: (failure) => notify(refusal(failure), "error"),
      },
    );
  };

  return (
    <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
      <form
        className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setErrors({});
          issue.mutate(
            {
              amountCentavos: paid,
              ...(extra > 0 && { bonusCentavos: extra }),
              issuedToName: forName.trim(),
              programId: program.id,
              promotional,
              ...(promotional && expiresOn && { expiresOn }),
            },
            {
              onSuccess: (card) => {
                setAmount("");
                setBonus("");
                setForName("");
                setExpiresOn("");
                notify(`Gift card ${card.code} issued with ${pesoFromCentavos(card.balanceCentavos)}.`);
              },
              onError: (failure) => setErrors(placeErrors(failure, GIFT_FIELDS, notify)),
            },
          );
        }}
      >
        <Eyebrow>Issue a gift card</Eyebrow>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
          Spent down in parts at the counter. The code is what the holder shows. A card someone paid for never expires.
        </p>
        <div className="mt-4 grid gap-4">
          <span className="flex items-start justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-xs font-bold">
            <span id={`promo-${program.id}`}>
              Promotional voucher
              <span className="mt-1 block font-normal text-[var(--muted-strong)]">
                Given away, not sold. Only a voucher can carry an expiry date.
              </span>
            </span>
            <Switch
              aria-labelledby={`promo-${program.id}`}
              checked={promotional}
              onCheckedChange={(next) => {
                setPromotional(next);
                if (!next) setExpiresOn("");
              }}
            />
          </span>
          <Field label={promotional ? "Voucher value, pesos" : "Amount paid, pesos"} error={errors.amountCentavos}>
            <Input value={amount} onChange={(event) => setAmount(onlyMoney(event.target.value))} inputMode="decimal" placeholder="500" />
          </Field>
          {!promotional && (
            <Field label="Bonus, pesos" hint="Optional. Loaded on top of what was paid." error={errors.bonusCentavos}>
              <Input value={bonus} onChange={(event) => setBonus(onlyMoney(event.target.value))} inputMode="decimal" placeholder="50" />
            </Field>
          )}
          {promotional && (
            <Field label="Expires on" hint="Optional." error={errors.expiresOn}>
              <Input type="date" value={expiresOn} min={isoDay(new Date())} onChange={(event) => setExpiresOn(event.target.value)} />
            </Field>
          )}
          <Field label="Who it is for" hint="Optional." error={errors.issuedToName}>
            <Input value={forName} onChange={(event) => setForName(event.target.value)} />
          </Field>
          {paid > 0 && extra > 0 && (
            <p className="text-sm font-bold">
              Load {pesoFromCentavos(paid)}, get {pesoFromCentavos(paid + extra)}.
            </p>
          )}
          <Button type="submit" disabled={paid < 100 || issue.isPending}>
            {issue.isPending ? "Issuing…" : "Issue the card"}
          </Button>
        </div>
      </form>
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-5">
          <div>
            <Eyebrow>Issued cards</Eyebrow>
            <p className="mt-1 text-xs text-[var(--muted-strong)]">
              {show === "active" ? "Cards with a balance left to spend." : "Every card, spent and void included."}
            </p>
          </div>
          <Segmented
            label="Which cards"
            className="min-w-48"
            options={[
              { value: "active", label: "Active" },
              { value: "all", label: "All" },
            ]}
            value={show}
            onChange={setShow}
          />
        </div>
        {cards.length === 0 ? (
          <p className="p-5 text-sm text-[var(--muted-strong)]">No cards here yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-5 py-3">Card</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.id} className="border-b border-[var(--line)] align-top last:border-0">
                    <td className="px-5 py-3">
                      <span className="font-mono text-sm font-extrabold">{card.code}</span>
                      <span className="block text-xs text-[var(--muted-strong)]">
                        {card.issuedToName || "No name"}
                        {card.issuedAt && ` · ${longDate(card.issuedAt)}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold">
                      {pesoFromCentavos(card.balanceCentavos)}
                      <span className="block text-xs font-normal text-[var(--muted-strong)]">
                        of {pesoFromCentavos(card.initialCentavos)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {card.promotional ? "Voucher" : pesoFromCentavos(card.paidCentavos)}
                      {card.expiresOn && (
                        <span className="block text-xs text-[var(--muted-strong)]">Expires {longDate(card.expiresOn)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={card.status === "active" ? "success" : card.status === "void" ? "danger" : "neutral"}>
                        {card.status}
                      </Pill>
                    </td>
                    <td className="px-4 py-3">
                      {card.status !== "void" &&
                        (refunding?.code === card.code ? (
                          <span className="flex flex-wrap items-center gap-2">
                            <Input
                              aria-label={`Refund onto ${card.code}, pesos`}
                              value={refunding.amount}
                              onChange={(event) => setRefunding({ code: card.code, amount: onlyMoney(event.target.value) })}
                              inputMode="decimal"
                              placeholder="Pesos"
                              className="max-w-28"
                            />
                            <Button
                              size="sm"
                              disabled={!(pesosToCentavos(refunding.amount) > 0) || refund.isPending}
                              onClick={() => doRefund(card, pesosToCentavos(refunding.amount))}
                            >
                              Refund
                            </Button>
                            <Button tone="quiet" size="sm" onClick={() => setRefunding(null)}>
                              Cancel
                            </Button>
                          </span>
                        ) : (
                          <span className="flex gap-2">
                            <Button tone="quiet" size="sm" onClick={() => setRefunding({ code: card.code, amount: "" })}>
                              Refund
                            </Button>
                            <Button
                              tone="danger"
                              size="sm"
                              disabled={voidCard.isPending}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    `Void ${card.code}? The ${pesoFromCentavos(card.balanceCentavos)} left on it is written off and it cannot be used again.`,
                                  )
                                )
                                  return;
                                voidCard.mutate(
                                  { code: card.code },
                                  {
                                    onSuccess: (saved) => notify(`${saved.code} is void.`),
                                    onError: (failure) => notify(refusal(failure), "error"),
                                  },
                                );
                              }}
                            >
                              Void
                            </Button>
                          </span>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {cardPages.hasNextPage && (
          <ShowMore more={() => void cardPages.fetchNextPage()} busy={cardPages.isFetchingNextPage} />
        )}
        <p className="border-t border-[var(--line)] p-4 text-[11px] leading-relaxed text-[var(--muted-strong)]">
          Refund puts money from a returned purchase back on the card, never more than was spent from it. Void cancels the card. Both are for owners and managers, and both are kept in the audit log.
        </p>
      </div>
    </section>
  );
}

export function ProgramsView({ notify }: { notify: Notify }) {
  const { data: programs = [], isPending, error, refetch } = usePrograms();
  const gate = usePlanGate();
  const cap = programCap(gate.plan);
  const liveCount = programs.filter((program) => program.status === "Live").length;
  const duplicate = useDuplicateProgram();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const selected = programs.find((program) => program.id === selectedId) ?? programs[0];

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
              ["Owed to customers", pesoFromCentavos(selected.liabilityCentavos)],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--ink-soft)] p-4">
                <p className="text-[10px] text-white/50">{label}</p>
                <p className="mt-1 text-lg font-extrabold">{value}</p>
              </div>
            ))}
          </div>
          {/* Derived from the ledger, so it is explained rather than edited. */}
          <p className="mt-2 text-[11px] leading-relaxed text-white/55">
            Owed to customers: {owedWords(selected.type)}
          </p>
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
            <ProgramRecordEditor
              key={selected.id}
              program={selected}
              notify={notify}
              onSaved={() => setEditing(false)}
            />
          )}
        </aside>
      </div>
      {selected.type === "Stamps" && <ProgramRulesEditor program={selected} notify={notify} />}
      {selected.type === "Points" && <PointsEarningEditor program={selected} notify={notify} />}
      {(selected.type === "Points" || selected.type === "Discount") && (
        <TierEditor key={`tiers-${selected.id}`} program={selected} notify={notify} />
      )}
      {(selected.type === "Points" || selected.type === "Rewards") && (
        <CatalogEditor key={`catalog-${selected.id}`} program={selected} notify={notify} />
      )}
      {selected.type === "Points" && <CategoryRatesEditor programId={selected.id} notify={notify} />}
      {selected.type === "Coupon" && <CouponDesk key={selected.id} program={selected} notify={notify} />}
      {selected.type === "Gift card" && <GiftCardDesk key={selected.id} program={selected} notify={notify} />}
      {creating && (
        <NewProgramDialog onClose={() => setCreating(false)} notify={notify} />
      )}
    </ViewFrame>
  );
}
