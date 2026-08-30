"use client";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { QueryBoundary, Skeleton } from "@kypstamping/ui";
import { sharedScenario } from "@kypstamping/demo-data";
import {
  useBilling,
  useBusinessCustomers,
  useBusinessMetrics,
  useBranding,
  useBusinessProfile,
  useDiscountQuote,
  useCatalog,
  useCustomFieldValues,
  useApprovals,
  useCustomFields,
  useCoupons,
  useFeedback,
  useReferrals,
  useHeldPrograms,
  useMessagingPolicy,
  useRfm,
  useSettings,
  type BusinessLocation,
  type MessagingPolicy,
  type Program,
  type RedemptionResult,
  useCampaigns,
  useFavoriteOrders,
  useIntegrations,
  useLocations,
  useMessages,
  usePrograms,
  useRedemptions,
  useStaff,
  useRetention,
  useTimeToSecondVisit,
  useCustomerBalance,
  lookupCustomer,
  idempotencyKey,
  ApiError,
  downloadExport,
  keys,
  payInvoice,
  useApiMutation,
  useQueryClient,
  type Allowance,
  type ExportKind,
  EMPTY_BUSINESS_METRICS,
  type MessageRecord,
  type ProgramDraft,
  type StaffMember,
  type VisitResult,
} from "@kypstamping/api";
import { useCounterStore } from "@kypstamping/api/stores";
import {
  ChangePlanDialog,
  EditProfileDialog,
  EditStaffDialog,
  EditLocationDialog,
  NewLocationDialog,
  NewProgramDialog,
} from "@/components/WorkspaceForms";
import { useOfflineQueue } from "@/components/useOfflineQueue";
import {
  useCreateCampaign,
  useRecordVisit,
  useDuplicateProgram,
  useInviteStaff,
  useToggleIntegration,
  useUpdateProgram,
  useSetMessagingPolicy,
  useCancelRedemption,
  useAddCatalogItem,
  useAddCustomField,
  useDecideApproval,
  useCreateCustomer,
  useCreateReferral,
  useImportCustomers,
  useSetCustomFieldValues,
  useIssueCoupon,
  useIssueGiftCard,
  useRedeemCoupon,
  useRequestFeedback,
  useRedeemGiftCard,
  useUseBenefit,
  useUseMultipass,
  usePurchaseMultipass,
  useSubscribeMembership,
  useCommitRedemption,
  useReserveRedemption,
  useSetSetting,
  useVoidVisit,
} from "@/components/mutations";
import { Button, Eyebrow, Pill, StampDots, ViewFrame } from "@kypstamping/ui";
import {
  daysUntilBirthday,
  longDate,
  peso,
  pesoCompactFromCentavos,
  pesoFromCentavos,
  relativeTime,
  timeOfDay,
} from "@kypstamping/ui/format";
import {
  BadgeCheck,
  BellRing,
  CakeSlice,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Coins,
  Copy,
  CreditCard,
  Download,
  Eye,
  FileDown,
  Gift,
  Heart,
  Link2,
  Mail,
  MessageCircle,
  MessagesSquare,
  MessageSquareText,
  Nfc,
  Pencil,
  Phone,
  PlugZap,
  Plus,
  QrCode,
  Search,
  Send,
  Route,
  ShieldCheck,
  Smartphone,
  Stamp,
  Store,
  TicketCheck,
  Undo2,
  Upload,
  UserPlus,
  Users,
  WalletCards,
  WifiOff,
} from "lucide-react";
import type { NotifyIntent } from "@kypstamping/ui/shell";
import type { BusinessView } from "@/components/BusinessShell";
import { useDemoState } from "@/components/DemoState";
import { IntegrationsView } from "@/components/IntegrationsView";
type Notify = (message: string, intent?: NotifyIntent) => void;
/**
 * Streams a CSV and hands it to the browser.
 *
 * Shared by the customers, redemptions and message-log screens: three buttons
 * that promised an export and produced a toast until the endpoints existed.
 */
function useExport(notify: Notify) {
  const [busy, setBusy] = useState<ExportKind | null>(null);
  return {
    busy,
    runExport: async (kind: ExportKind) => {
      setBusy(kind);
      try {
        await downloadExport(kind);
        notify(`${kind} export downloaded.`);
      } catch (failure) {
        notify(
          failure instanceof ApiError ? failure.message : "Could not prepare that export.",
          "error",
        );
      } finally {
        setBusy(null);
      }
    },
  };
}

/** Initials from a name, since a counter lookup does not return them. */
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * What else this counter can settle for the customer in front of it.
 *
 * A merchant can run eight program types at once and the till only knew how
 * to add a stamp - so a Coupon or Gift card program was a row in a list that
 * did nothing. Each type has its own rule, and only the ones the merchant
 * actually runs appear.
 */
function OtherProgramActions({
  customerId,
  amountCentavos,
  notify,
}: {
  customerId: string;
  amountCentavos: number;
  notify: Notify;
}) {
  const { data: programs = [] } = usePrograms();
  const live = (type: string) =>
    programs.find((program) => program.type === type && program.status === "Live");

  const coupon = useRedeemCoupon();
  const giftCard = useRedeemGiftCard();
  const pass = useUseMultipass();
  const benefit = useUseBenefit();
  const buyPass = usePurchaseMultipass();
  const subscribe = useSubscribeMembership();
  const { data: held = [] } = useHeldPrograms(customerId);
  const [couponCode, setCouponCode] = useState("");
  const [cardCode, setCardCode] = useState("");

  const discount = live("Discount");
  const { data: quote } = useDiscountQuote(
    discount ? customerId : "",
    amountCentavos,
  );

  const membership = live("Membership");
  const anything =
    discount ||
    membership ||
    held.length > 0 ||
    live("Multipass") ||
    live("Coupon") ||
    live("Gift card");
  if (!anything) return null;

  return (
    <div className="mt-5 space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <Eyebrow>Also on this counter</Eyebrow>

      {discount && quote && amountCentavos > 0 && (
        <p className="text-xs font-bold">
          {quote.tier ? `${quote.tier} tier: ` : ""}
          {(quote.rateBps / 100).toFixed(quote.rateBps % 100 ? 2 : 0)}% off &middot; member
          pays{" "}
          <span className="font-extrabold text-[var(--success)]">
            {pesoFromCentavos(quote.netCentavos)}
          </span>
        </p>
      )}

      {live("Coupon") && (
        <div className="flex gap-2">
          <input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="min-h-10 flex-1 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm font-mono outline-none focus:border-[var(--accent-strong)]"
          />
          <Button
            tone="quiet"
            disabled={!couponCode.trim() || coupon.isPending}
            onClick={() =>
              coupon.mutate(
                { code: couponCode.trim(), customerId },
                {
                  onSuccess: (redeemed) => {
                    setCouponCode("");
                    notify(`${redeemed.name} redeemed.`);
                  },
                  onError: (failure) => notify(failure.message, "error"),
                },
              )
            }
          >
            Redeem
          </Button>
        </div>
      )}

      {live("Gift card") && (
        <div className="flex gap-2">
          <input
            value={cardCode}
            onChange={(event) => setCardCode(event.target.value.toUpperCase())}
            placeholder="Gift card code"
            className="min-h-10 flex-1 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm font-mono outline-none focus:border-[var(--accent-strong)]"
          />
          <Button
            tone="quiet"
            // Needs the purchase amount: a gift card pays for something, and
            // spending an unstated amount off a card is not a transaction.
            disabled={!cardCode.trim() || amountCentavos <= 0 || giftCard.isPending}
            onClick={() =>
              giftCard.mutate(
                { code: cardCode.trim(), amountCentavos, reason: "Paid at the counter" },
                {
                  onSuccess: (card) => {
                    setCardCode("");
                    notify(
                      `Paid from gift card. ${pesoFromCentavos(card.balanceCentavos)} left on it.`,
                    );
                  },
                  onError: (failure) => notify(failure.message, "error"),
                },
              )
            }
          >
            {amountCentavos > 0 ? `Pay ${pesoFromCentavos(amountCentavos)}` : "Enter an amount"}
          </Button>
        </div>
      )}

      {/* What they hold, not what the merchant sells. A bundle with nothing
          left is offered for sale rather than hidden, and a membership needs
          its subscription id - which is exactly what this read is for. */}
      {held.map((item) =>
        item.programType === "Multipass" ? (
          <div key={item.programId} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs font-bold">
              {item.programName}
              <span className="ml-1 font-normal text-[var(--muted-strong)]">
                {item.remaining} of {item.included} left
              </span>
            </span>
            {item.remaining > 0 ? (
              <Button
                tone="quiet"
                disabled={pass.isPending}
                onClick={() =>
                  pass.mutate(
                    { customerId, programId: item.programId },
                    {
                      onSuccess: (left) =>
                        notify(`Pass used. ${left.remaining} left on the bundle.`),
                      onError: (failure) => notify(failure.message, "error"),
                    },
                  )
                }
              >
                Use a pass
              </Button>
            ) : (
              <Button
                tone="quiet"
                disabled={buyPass.isPending}
                onClick={() =>
                  buyPass.mutate(
                    { customerId, programId: item.programId },
                    {
                      onSuccess: (bought) => notify(`Bundle sold. ${bought.remaining} passes.`),
                      onError: (failure) => notify(failure.message, "error"),
                    },
                  )
                }
              >
                Sell a bundle
              </Button>
            )}
          </div>
        ) : (
          <div key={item.subscriptionId} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs font-bold">
              {item.programName}
              <span className="ml-1 font-normal text-[var(--muted-strong)]">
                {item.included
                  ? `${item.remaining} of ${item.included} this period`
                  : item.status}
              </span>
            </span>
            <Button
              tone="quiet"
              disabled={benefit.isPending || item.status !== "active"}
              onClick={() =>
                benefit.mutate(item.subscriptionId, {
                  onSuccess: (left) =>
                    notify(`Benefit used. ${left.remaining} of ${left.included} left.`),
                  onError: (failure) => notify(failure.message, "error"),
                })
              }
            >
              Use a benefit
            </Button>
          </div>
        ),
      )}

      {/* Offered when they hold nothing yet - the till is where a membership
          is actually sold. */}
      {membership && !held.some((item) => item.programId === membership.id) && (
        <Button
          tone="quiet"
          className="w-full"
          disabled={subscribe.isPending}
          onClick={() =>
            subscribe.mutate(
              { customerId, programId: membership.id },
              {
                onSuccess: () => notify(`${membership.name} started.`),
                onError: (failure) => notify(failure.message, "error"),
              },
            )
          }
        >
          Start {membership.name}
        </Button>
      )}
    </div>
  );
}

/**
 * Someone at the counter with no wallet yet.
 *
 * The old answer was "they can join with the counter QR", which asks a
 * queueing customer to install something. Their name, plus the number
 * already typed, is enough to make the account.
 */
function AddWalkIn({
  identifier,
  name,
  onName,
  onCancel,
  onAdded,
  notify,
}: {
  identifier: string;
  name: string;
  onName: (value: string) => void;
  onCancel: () => void;
  onAdded: (customer: { id: string; name: string }) => void;
  notify: Notify;
}) {
  const add = useCreateCustomer();
  const looksLikeEmail = identifier.includes("@");

  return (
    <div className="mt-5 rounded-2xl border border-[var(--accent)] bg-white/5 p-4">
      <p className="text-xs font-extrabold">Nobody found for {identifier}.</p>
      <p className="mt-1 text-[11px] leading-relaxed text-white/60">
        Add them now and stamp in the same breath.
      </p>
      <input
        value={name}
        onChange={(event) => onName(event.target.value)}
        placeholder="Their name"
        className="mt-3 min-h-11 w-full rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button tone="quiet" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={!name.trim() || add.isPending}
          onClick={() =>
            add.mutate(
              {
                name: name.trim(),
                ...(looksLikeEmail ? { email: identifier } : { mobile: identifier }),
              },
              {
                onSuccess: (created) => {
                  notify(`${created.name} added.`);
                  onAdded(created);
                },
                onError: (failure) => notify(failure.message, "error"),
              },
            )
          }
        >
          {add.isPending ? "Adding…" : "Add and continue"}
        </Button>
      </div>
    </div>
  );
}

function ScanView({
  notify,
  onNavigate,
}: {
  notify: Notify;
  onNavigate: (view: BusinessView) => void;
}) {
  const { data: customers = [] } = useBusinessCustomers();
  const { data: redemptions = [] } = useRedemptions();
  // The dashboard scanner already picked a customer; arriving here and being
  // asked to pick again broke the flow.
  const { scanHandoff, consumeScanHandoff } = useDemoState();
  const { scanned, amount, idempotencyReference, scan, setAmount, reset } =
    useCounterStore();
  const record = useRecordVisit();

  const [identifier, setIdentifier] = useState("");
  const [notFound, setNotFound] = useState("");
  const [newName, setNewName] = useState("");
  const [looking, setLooking] = useState(false);
  const [done, setDone] = useState<VisitResult | null>(null);
  const undo = useVoidVisit();
  const askFeedback = useRequestFeedback();
  const queryClient = useQueryClient();
  const { queue, online, enqueue } = useOfflineQueue(
    useCallback(
      (settled: number) => {
        notify(`${settled} held ${settled === 1 ? "stamp" : "stamps"} synced.`);
        void queryClient.invalidateQueries({ queryKey: keys.business.all });
      },
      [notify, queryClient],
    ),
  );
  const reserve = useReserveRedemption();
  const handOver = useCommitRedemption();
  const giveBack = useCancelRedemption();
  const [held, setHeld] = useState<RedemptionResult | null>(null);
  /**
   * Bumped whenever a reservation is put back.
   *
   * The idempotency key has to stay stable across a retry of the same
   * reserve, and change when the cashier deliberately starts a new one -
   * otherwise the API replays the cancelled reservation and the commit that
   * follows is refused as already-decided.
   */
  const [redeemAttempt, setRedeemAttempt] = useState(0);

  const { data: balance } = useCustomerBalance(scanned?.id);

  useEffect(() => {
    if (!scanHandoff) return;
    consumeScanHandoff();
    const first = customers[0];
    if (first && !scanned) {
      scan({
        id: first.id,
        name: first.name,
        memberCode: `KYP-${first.id.toUpperCase()}`,
        isMember: true,
      });
    }
  }, [scanHandoff, consumeScanHandoff, customers, scanned, scan]);

  const step: "ready" | "found" | "complete" = done
    ? "complete"
    : scanned
      ? "found"
      : "ready";

  /**
   * A scanner is a keyboard here: the QR carries the member's code and a
   * cashier without one types a mobile number. Both go to the same lookup,
   * which is the only thing that can say whether the person is a member.
   */
  async function find() {
    const typed = identifier.trim();
    if (!typed) {
      notify("Scan a code, or enter a mobile number or email.", "error");
      return;
    }
    setLooking(true);
    try {
      const found = await lookupCustomer(
        typed.includes("@") ? { email: typed } : { phone: typed },
      );
      scan(found);
      setIdentifier("");
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 404) {
        // Offer to add them rather than send them away to scan a QR: the
        // person is standing at the counter, which is the one moment they
        // are certain to give a name and a number.
        setNotFound(typed);
        return;
      }
      notify(
        failure instanceof ApiError ? failure.message : "Could not look that up.",
        "error",
      );
    } finally {
      setLooking(false);
    }
  }

  function approve() {
    if (!scanned) return;
    const typed = amount.trim();
    const pesos = Number.parseFloat(typed);
    if (typed && (!Number.isFinite(pesos) || pesos < 0)) {
      notify("Enter a valid purchase amount, or clear the field.", "error");
      return;
    }

    const amountCentavos = typed ? Math.round(pesos * 100) : 0;

    // No signal: hold it rather than lose it. The reference is minted once
    // here and resent on every retry, so syncing twice stamps once.
    if (!online) {
      enqueue({
        // The same key the online path would have used, kept with the visit:
        // replaying it later settles once however many times it is sent.
        idempotencyKey: idempotencyKey("visit", idempotencyReference),
        customerId: scanned.id,
        customerName: scanned.name,
        amountCentavos,
        occurredAt: new Date().toISOString(),
      });
      notify(`Held for ${scanned.name}. It will sync when the signal is back.`);
      startOver();
      return;
    }

    record.mutate(
      {
        customerId: scanned.id,
        // Centavos on the wire, always. The cashier types pesos.
        amountCentavos,
        // Stable until this visit settles, so a cashier who presses again
        // after a timeout replays the first one rather than stamping twice.
        idempotencyKey: idempotencyKey("visit", idempotencyReference),
      },
      {
        onSuccess: (visit) => {
          setDone(visit);
          notify(
            visit.rewardEarned
              ? `Stamp added. ${visit.customerName} earned ${visit.rewardEarned}.`
              : `Stamp added. ${visit.stampsAfter} of ${visit.target}.`,
          );
        },
        onError: (failure) => notify(failure.message, "error"),
      },
    );
  }

  function startOver() {
    // A reward still on hold goes back. Walking away from a reservation would
    // leave it out of circulation for a customer who never received it.
    if (held) giveBack.mutate(held.id);
    setHeld(null);
    setRedeemAttempt((n) => n + 1);
    setDone(null);
    // Also mints a new idempotency reference: the next customer is a
    // different visit, not a retry of this one.
    reset();
  }

  return (
    <ViewFrame
      eyebrow="Counter"
      title="Scan a customer"
      description="A guided earn-and-redeem flow that remains safe and understandable during the busiest part of service."
      action={
        <Pill tone={online ? (queue.length ? "warning" : "success") : "warning"}>
          <WifiOff size={12} className="mr-1.5" />
          {!online
            ? "No signal - stamps are being held"
            : queue.length
              ? `${queue.length} held, syncing`
              : "Offline queue ready"}
        </Pill>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(420px,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)] sm:p-8">
          <div className="flex items-center justify-between">
            <Eyebrow>Secure scanner</Eyebrow>
            <span className="font-mono text-[10px] text-white/60">CAMERA 01</span>
          </div>

          {step === "ready" && (
            <div className="mx-auto mt-8 max-w-sm">
              <div className="relative aspect-square rounded-[var(--radius-card)] border border-white/15 bg-white/[0.04] p-12">
                <span className="absolute left-5 top-5 size-16 border-l-2 border-t-2 border-[var(--accent)]" />
                <span className="absolute right-5 top-5 size-16 border-r-2 border-t-2 border-[var(--accent)]" />
                <span className="absolute bottom-5 left-5 size-16 border-b-2 border-l-2 border-[var(--accent)]" />
                <span className="absolute bottom-5 right-5 size-16 border-b-2 border-r-2 border-[var(--accent)]" />
                <QrCode className="size-full text-white/65" strokeWidth={1} />
              </div>
              <form
                className="mt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void find();
                }}
              >
                <label className="grid gap-2 text-xs font-bold">
                  Member code, mobile number, or email
                  <input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="0917 555 0182"
                    className="min-h-11 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                  />
                  <span className="text-[10px] font-semibold text-white/45">
                    A hardware scanner types here and presses Enter.
                  </span>
                </label>
                <Button tone="accent" className="mt-4 w-full" disabled={looking}>
                  {looking ? "Looking up\u2026" : "Find customer"}
                </Button>
              </form>
              {notFound && (
                <AddWalkIn
                  identifier={notFound}
                  name={newName}
                  onName={setNewName}
                  onCancel={() => {
                    setNotFound("");
                    setNewName("");
                  }}
                  onAdded={(created) => {
                    setNotFound("");
                    setNewName("");
                    setIdentifier("");
                    scan({
                      id: created.id,
                      name: created.name,
                      memberCode: `KYP-${created.id.toUpperCase()}`,
                      isMember: true,
                    });
                  }}
                  notify={notify}
                />
              )}
              {customers[0] && (
                <button
                  type="button"
                  onClick={() =>
                    scan({
                      id: customers[0].id,
                      name: customers[0].name,
                      memberCode: `KYP-${customers[0].id.toUpperCase()}`,
                      isMember: true,
                    })
                  }
                  className="mt-4 min-h-11 w-full text-xs font-extrabold text-white/60 hover:text-white"
                >
                  Use {customers[0].name}
                </button>
              )}
            </div>
          )}

          {step === "found" && scanned && (
            <div className="mt-8">
              <div className="rounded-2xl bg-[var(--surface)] p-5 text-[var(--ink)]">
                <div className="flex items-center gap-4">
                  <span className="grid size-14 place-items-center rounded-xl bg-[var(--accent)] text-lg font-extrabold">
                    {initialsOf(scanned.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{scanned.name}</p>
                    <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                      {scanned.memberCode}
                    </p>
                  </div>
                  <BadgeCheck className="text-[var(--success)]" />
                </div>

                <div className="mt-6 rounded-2xl bg-[var(--paper)] p-4">
                  <p className="text-xs font-bold text-[var(--muted)]">
                    Eligible program
                  </p>
                  {balance ? (
                    <>
                      <p className="mt-1 font-extrabold">{balance.programName}</p>
                      <div className="mt-4 overflow-x-auto">
                        <StampDots filled={balance.balance} total={balance.target} />
                      </div>
                      {balance.rewardsAvailable > 0 && !held && (
                        <>
                          <p className="mt-3 text-xs font-extrabold text-[var(--success)]">
                            {balance.rewardsAvailable} reward
                            {balance.rewardsAvailable === 1 ? "" : "s"} ready to redeem
                          </p>
                          <Button
                            tone="accent"
                            className="mt-3 w-full"
                            icon={<Gift size={15} />}
                            disabled={reserve.isPending}
                            onClick={() =>
                              reserve.mutate(
                                {
                                  customerId: scanned.id,
                                  idempotencyKey: idempotencyKey(
                                    "redeem",
                                    `${scanned.id}_${idempotencyReference}_${redeemAttempt}`,
                                  ),
                                },
                                {
                                  onSuccess: setHeld,
                                  onError: (failure) => notify(failure.message, "error"),
                                },
                              )
                            }
                          >
                            {reserve.isPending ? "Holding…" : "Redeem a reward"}
                          </Button>
                        </>
                      )}
                      {held && (
                        /* Reserved, not spent. The balance only moves when the
                           cashier confirms the customer actually has it. */
                        <div className="mt-3 rounded-xl border border-[var(--success)] bg-[rgb(15_118_85/8%)] p-3">
                          <p className="text-xs font-extrabold text-[var(--success)]">
                            {held.rewardName} is on hold. Hand it over, then confirm.
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button
                              tone="quiet"
                              disabled={giveBack.isPending || handOver.isPending}
                              onClick={() =>
                                giveBack.mutate(held.id, {
                                  onSuccess: () => {
                                    setHeld(null);
                                    setRedeemAttempt((n) => n + 1);
                                    notify("Reward put back. Nothing was spent.");
                                  },
                                  onError: (failure) => notify(failure.message, "error"),
                                })
                              }
                            >
                              Put it back
                            </Button>
                            <Button
                              disabled={handOver.isPending || giveBack.isPending}
                              onClick={() =>
                                handOver.mutate(
                                  {
                                    id: held.id,
                                    idempotencyKey: idempotencyKey("commit", held.id),
                                  },
                                  {
                                    onSuccess: (committed) => {
                                      setHeld(null);
                                      setRedeemAttempt((n) => n + 1);
                                      notify(`${committed.rewardName} redeemed.`);
                                    },
                                    onError: (failure) => notify(failure.message, "error"),
                                  },
                                )
                              }
                            >
                              {handOver.isPending ? "Confirming…" : "Handed over"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Skeleton className="mt-3 h-10 w-full" />
                  )}
                </div>

                <label className="mt-5 grid gap-2 text-xs font-bold">
                  Purchase amount, optional
                  <input
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value.replace(/[^\d.]/g, ""))
                    }
                    inputMode="decimal"
                    aria-describedby="scan-amount-help"
                    className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent-strong)]"
                  />
                  <span
                    id="scan-amount-help"
                    className="text-[10px] font-semibold text-[var(--muted)]"
                  >
                    Recorded with the visit. Leave blank for a visit-only stamp.
                  </span>
                </label>

                <OtherProgramActions
                  customerId={scanned.id}
                  amountCentavos={
                    Number.isFinite(Number.parseFloat(amount))
                      ? Math.round(Number.parseFloat(amount) * 100)
                      : 0
                  }
                  notify={notify}
                />

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button tone="quiet" onClick={startOver} disabled={record.isPending}>
                    Cancel
                  </Button>
                  <Button onClick={approve} disabled={record.isPending}>
                    {record.isPending ? "Recording\u2026" : "Approve +1 stamp"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === "complete" && done && (
            <div className="grid min-h-[500px] place-items-center text-center">
              <div>
                <span className="mx-auto grid size-20 place-items-center rounded-full bg-[var(--success)]">
                  <Check size={36} strokeWidth={3} />
                </span>
                <h2 className="mt-6 text-3xl font-extrabold tracking-[-0.02em]">
                  {done.rewardEarned ? "Reward earned." : "Stamp added."}
                </h2>
                <p className="mx-auto mt-3 max-w-[36ch] text-sm leading-relaxed text-white/65">
                  {done.customerName} now has {done.stampsAfter} of {done.target} stamps
                  {done.amountCentavos
                    ? ` from a ${pesoFromCentavos(done.amountCentavos)} purchase`
                    : ""}
                  .{done.rewardEarned ? ` ${done.rewardEarned} is ready to redeem.` : ""}
                </p>
                <p className="mt-4 font-mono text-[10px] text-white/40">{done.id}</p>
                <Button tone="accent" className="mt-7" onClick={startOver}>
                  Scan the next customer
                </Button>
                {/* Right here, because this is where a wrong scan is
                    noticed - one customer back, before the queue moves on. */}
                <button
                  type="button"
                  disabled={askFeedback.isPending}
                  onClick={() =>
                    askFeedback.mutate(
                      { customerId: done.customerId },
                      {
                        onSuccess: () =>
                          notify(`Asked ${done.customerName} how it went.`),
                        onError: (failure) => notify(failure.message, "error"),
                      },
                    )
                  }
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/20 text-xs font-extrabold text-white/70 transition hover:bg-white/5 disabled:opacity-50"
                >
                  <MessageCircle size={14} />
                  {askFeedback.isPending ? "Sending…" : "Ask how it went"}
                </button>
                <button
                  type="button"
                  disabled={undo.isPending}
                  onClick={() =>
                    undo.mutate(
                      { id: done.id, idempotencyKey: idempotencyKey("void", done.id) },
                      {
                        onSuccess: () => {
                          notify(`Stamp reversed for ${done.customerName}.`);
                          startOver();
                        },
                        onError: (failure) => notify(failure.message, "review"),
                      },
                    )
                  }
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 text-xs font-extrabold text-white/55 transition hover:text-white disabled:opacity-50"
                >
                  <Undo2 size={14} /> {undo.isPending ? "Reversing…" : "That was a mistake, undo it"}
                </button>
              </div>
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow>Recent counter activity</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">
                Today at {sharedScenario.branch}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("redemptions")}
              className="text-xs font-bold text-[var(--accent-strong)]"
            >
              View ledger
            </button>
          </div>
          <article className="mt-5 rounded-2xl border border-[rgb(15_118_85/24%)] bg-[rgb(15_118_85/7%)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-[var(--success)]">
                  Shared demo event · recorded
                </p>
                <p className="mt-1 text-sm font-extrabold">
                  {sharedScenario.customer} · {sharedScenario.purchase.display}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-strong)]">
                  {sharedScenario.loyaltyEvent.effect} · {sharedScenario.loyaltyEvent.after} · approved by {sharedScenario.staff}
                </p>
              </div>
              <code className="rounded-lg bg-[var(--surface)] px-2.5 py-1.5 text-[10px] font-extrabold text-[var(--muted-strong)]">
                {sharedScenario.loyaltyEvent.id}
              </code>
            </div>
          </article>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {redemptions.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-4"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-2)]">
                  <TicketCheck size={17} />
                </span>
                <div>
                  <p className="text-sm font-extrabold">{item.customer}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {item.reward} · {item.staff}
                  </p>
                </div>
                <div className="text-right">
                  <Pill
                    tone={item.status === "Approved" ? "success" : "warning"}
                  >
                    {item.status}
                  </Pill>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    {timeOfDay(item.occurredAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--line-strong)] p-4">
            <div className="flex items-start gap-3">
              <Nfc size={18} className="mt-0.5 text-[var(--accent-strong)]" />
              <div>
                <p className="text-sm font-extrabold">NFC counter mode</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                  Customers can tap a supported tag to open the same
                  confirmation flow. Staff still approves the value event.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ViewFrame>
  );
}
/** Where a printed poster points. The marketing site owns /join/<slug>. */
const MARKETING_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kypstamping.ph";

/** The slug form the poster and /public/join/{slug} both use. */
const slugify = (value: string) => value.toLowerCase().replaceAll(" ", "-");

/**
 * The scannable poster code for one branch.
 *
 * This was a hardcoded 14x14 grid of divs. It looked like a QR and was not
 * one - the smallest real symbol is 21x21, and the pattern carried no data at
 * all - so a merchant who printed the poster shipped something no phone could
 * read. The customer wallet already generates a real symbol with the `qrcode`
 * package; this does the same, for the same reason.
 */
function JoinPosterCode({ url }: { url: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void import("qrcode")
      .then((module) =>
        module.default.toDataURL(url, {
          width: 320,
          margin: 2,
          // A poster gets scuffed, curled and photographed at an angle. The
          // higher correction level is what survives that.
          errorCorrectionLevel: "H",
          color: { dark: "#181210", light: "#ffffff" },
        }),
      )
      .then((dataUrl) => {
        if (live) setSrc(dataUrl);
      })
      .catch(() => {
        if (live) setSrc(null);
      });
    return () => {
      live = false;
    };
  }, [url]);

  if (!src) {
    return <Skeleton className="size-[280px]" />;
  }

  return (
    // A data: URL generated in the browser has nothing for the image
    // optimiser to do, and next/image cannot handle one anyway.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`QR code linking to ${url}`}
      width={280}
      height={280}
      className="size-[280px]"
    />
  );
}

function JoinCodeView({ notify }: { notify: Notify }) {
  const [nfcOpen, setNfcOpen] = useState(false);
  const { data: locations = [] } = useLocations();
  const { data: profile } = useBusinessProfile();
  const [branch, setBranch] = useState<string | null>(null);

  const selected = branch ?? locations[0]?.name ?? "";
  // The slug a poster carries: short name and branch, both slugified. It has
  // to match what /public/join/{slug} resolves, so it is built once here.
  const slug = `${slugify(profile?.shortName ?? "")}-${slugify(selected)}`;
  const joinUrl = `${MARKETING_ORIGIN}/join/${slug}`;

  return (
    <ViewFrame
      eyebrow="Enrollment"
      title="Join codes"
      description="Use a branch-specific poster, social link, or NFC tag. Customers review terms and choose what to share before joining."
      action={
        <Button
          icon={<Download size={16} />}
          onClick={() => notify("Print-ready poster prepared for download.")}
        >
          Download poster
        </Button>
      }
    >
      <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
          <label className="grid gap-2 text-xs font-bold">
            Location
            <select
              value={selected}
              onChange={(event) => setBranch(event.target.value)}
              className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 text-sm outline-none"
            >
              {locations.map((location) => (
                <option key={location.id}>{location.name}</option>
              ))}
            </select>
          </label>
          <div className="mx-auto mt-8 w-fit rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_18px_45px_rgb(24_18_12/10%)]">
            <JoinPosterCode url={joinUrl} />
          </div>
          <p className="mt-5 text-center text-lg font-extrabold">
            Join {profile?.shortName ?? ""} · {selected}
          </p>
          <p className="mt-1 text-center break-all text-xs text-[var(--muted)]">
            {joinUrl}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button
              tone="quiet"
              icon={<Copy size={15} />}
              onClick={() => {
                const link = joinUrl;
                navigator.clipboard?.writeText(link).catch(() => {});
                notify("Join link copied.");
              }}
            >
              Copy link
            </Button>
            <Button
              tone="quiet"
              icon={<Nfc size={15} />}
              aria-expanded={nfcOpen}
              onClick={() => setNfcOpen((open) => !open)}
            >
              {nfcOpen ? "Hide NFC steps" : "Set up NFC"}
            </Button>
          </div>
          {nfcOpen && (
            /* There is nothing to configure server-side: an NFC tag holds a
               URL, and the join link above is that URL. The only thing a
               merchant is missing is being told so. */
            <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <Eyebrow>Writing a tag</Eyebrow>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-[var(--muted-strong)]">
                <li>
                  Open any NFC writer app on an Android phone, or NFC Tools on
                  iPhone.
                </li>
                <li>
                  Choose <strong>Write &rarr; URL</strong> and paste the join
                  link.
                </li>
                <li>Hold the tag to the back of the phone until it confirms.</li>
                <li>
                  Tap it with another phone to check it opens{" "}
                  {profile?.shortName ?? "your"} sign-up.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(joinUrl).catch(() => {});
                  notify("Join link copied. Paste it into the writer app.");
                }}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--line-strong)] px-4 text-xs font-extrabold"
              >
                <Copy size={14} /> Copy the link again
              </button>
              <p className="mt-4 text-[11px] leading-relaxed text-[var(--muted)]">
                A tag is just a link. Re-writing one costs nothing, and a tag
                for a branch that closes can be pointed somewhere else.
              </p>
            </div>
          )}
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)]">
                  <CreditCard size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold">Printed member cards</p>
                  <p className="mt-1 max-w-[52ch] text-xs leading-relaxed text-[var(--muted-strong)]">
                    Wallet-sized cards carrying each customer&rsquo;s own code. For
                    customers without a smartphone, or when data is down, staff scan
                    the printed card exactly like the in-app code.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[rgb(232_163_61/16%)] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--accent-strong)]">
                Add-on
              </span>
            </div>
            <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
              {[
                ["Linked by", "Customer mobile number"],
                ["Minimum order", "100 cards"],
                ["Quoted separately", "Not included in plan"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[var(--paper)] p-3">
                  <dt className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted)]">
                    {label}
                  </dt>
                  <dd className="mt-1 font-bold">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                tone="quiet"
                icon={<Send size={15} />}
                onClick={() => notify("Card order request opened in demo mode.", "review")}
              >
                Request a quote
              </Button>
              <Button
                tone="quiet"
                icon={<WalletCards size={15} />}
                onClick={() => notify("Wallet pass preview opened in demo mode.", "review")}
              >
                Use wallet passes instead
              </Button>
            </div>
          </div>
        </section>
        <section className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)] sm:p-8">
          <Eyebrow>What customers see</Eyebrow>
          <h2 className="mt-5 max-w-[13ch] text-3xl font-extrabold tracking-[-0.02em]">
            Join in under thirty seconds.
          </h2>
          <div className="mt-8 divide-y divide-white/12 border-y border-white/12">
            {[
              {
                icon: Eye,
                title: "Clear program terms",
                text: "Reward, expiry, earning, and redemption terms appear before joining.",
              },
              {
                icon: ShieldCheck,
                title: "Purpose-by-purpose choice",
                text: "Service updates, promotions, email, SMS, push, and location are separate controls.",
              },
              {
                icon: Smartphone,
                title: "No app-store gate",
                text: "The PWA opens immediately; a quick wallet pass is optional.",
              },
              {
                icon: WifiOff,
                title: "Works without a signal",
                text: "Customers can save or print their code, or carry a printed member card, and still be scanned.",
              },
              {
                icon: Link2,
                title: "One identity, private by design",
                text: "The business receives only the customer details approved for this program.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4 py-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[var(--accent)]">
                    <Icon size={17} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/65">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </ViewFrame>
  );
}
/**
 * The merchant's own columns on a customer, and their referral code.
 *
 * Custom fields are what makes this a CRM rather than a visit counter - a
 * bakery tracks allergies, a salon tracks preferred stylist. The endpoints
 * existed and nothing read or wrote them.
 */
function CustomerExtras({
  customerId,
  customerName,
  notify,
}: {
  customerId: string;
  customerName: string;
  notify: Notify;
}) {
  const { data: fields = [] } = useCustomFields();
  const { data: values = [] } = useCustomFieldValues(customerId);
  const { data: referrals = [] } = useReferrals();
  const save = useSetCustomFieldValues();
  const invite = useCreateReferral();
  const [draft, setDraft] = useState<Record<string, string> | null>(null);

  // Keyed by customer: switching selection drops a half-typed draft rather
  // than carrying one person's notes onto another's record.
  const [draftFor, setDraftFor] = useState("");
  if (draftFor !== customerId) {
    setDraftFor(customerId);
    setDraft(null);
  }

  const current =
    draft ?? Object.fromEntries(values.map((value) => [value.key, value.value]));
  const theirs = referrals.filter((referral) => referral.status !== "qualified");

  return (
    <>
      {fields.length > 0 && (
        <div className="mt-7">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">
            Your own fields
          </p>
          <div className="mt-3 space-y-2">
            {fields.map((field) => (
              <label key={field.key} className="grid gap-1.5 text-xs font-bold">
                {field.label}
                <input
                  value={current[field.key] ?? ""}
                  onChange={(event) =>
                    setDraft({ ...current, [field.key]: event.target.value })
                  }
                  className="min-h-10 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm font-normal outline-none focus:border-[var(--accent)]"
                />
              </label>
            ))}
          </div>
          <Button
            tone="quiet"
            className="mt-3 w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
            disabled={!draft || save.isPending}
            onClick={() =>
              draft &&
              save.mutate(
                { customerId, values: draft },
                {
                  onSuccess: () => {
                    setDraft(null);
                    notify(`Saved against ${customerName}.`);
                  },
                  onError: (failure) => notify(failure.message, "error"),
                },
              )
            }
          >
            {save.isPending ? "Saving\u2026" : draft ? "Save fields" : "Saved"}
          </Button>
        </div>
      )}

      <div className="mt-7">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">
          Referral code
        </p>
        {theirs.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {theirs.slice(0, 3).map((referral) => (
              <li key={referral.id} className="flex justify-between gap-3 text-xs">
                <span className="font-mono text-white/75">{referral.code}</span>
                <span className="shrink-0 text-white/50">{referral.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-white/55">None outstanding.</p>
        )}
        <Button
          tone="quiet"
          className="mt-3 w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
          disabled={invite.isPending}
          onClick={() =>
            invite.mutate(
              { customerId },
              {
                onSuccess: (referral) => notify(`Referral code ${referral.code} issued.`),
                onError: (failure) => notify(failure.message, "error"),
              },
            )
          }
        >
          Issue a referral code
        </Button>
      </div>
    </>
  );
}

/**
 * A CSV of regulars off the old paper cards.
 *
 * The CRM had no way in but one join at a time from the customer's own
 * phone, which is a week of retyping for a shop that already has a list.
 * Someone whose number already has a wallet is joined rather than
 * duplicated, so re-importing the same file splits nobody's history.
 */
function ImportCustomers({ notify }: { notify: Notify }) {
  const load = useImportCustomers();

  return (
    <label
      className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm font-extrabold transition hover:bg-[var(--surface-2)] ${load.isPending ? "pointer-events-none opacity-60" : ""}`}
    >
      <Upload size={16} />
      {load.isPending ? "Importing…" : "Import CSV"}
      <input
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          // Cleared so choosing the same file twice fires again - a merchant
          // fixing a rejected row re-picks the file they just edited.
          event.target.value = "";
          load.mutate(file, {
            onSuccess: (result) =>
              notify(
                `${result.created} added, ${result.joined} already had a wallet` +
                  (result.skipped ? `, ${result.skipped} skipped.` : "."),
              ),
            onError: (failure) => notify(failure.message, "error"),
          });
        }}
      />
    </label>
  );
}

function CustomersView({ notify }: { notify: Notify }) {
  const { runExport, busy: exporting } = useExport(notify);
  const {
    data: customers = [],
    isPending: customersPending,
    error: customersError,
    refetch: refetchCustomers,
  } = useBusinessCustomers();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = customers.filter(
    (customer) =>
      (segment === "All" || customer.segment === segment) &&
      customer.name.toLowerCase().includes(query.toLowerCase()),
  );
  const selected =
    customers.find((customer) => customer.id === selectedId) ?? customers[0];

  if (!selected) {
    return (
      <ViewFrame
        eyebrow="Customer CRM"
        title="Customers"
        description="Understand the relationship without turning people into a contact export."
      >
        <QueryBoundary
          isPending={customersPending}
          error={customersError}
          onRetry={refetchCustomers}
          label="customers"
          rows={5}
        >
          <p className="text-sm text-[var(--muted-strong)]">
            No customers yet. They appear here as soon as somebody joins from
            your counter code.
          </p>
        </QueryBoundary>
      </ViewFrame>
    );
  }

  return (
    <ViewFrame
      eyebrow="Customer CRM"
      title="Customers"
      description="Understand the relationship without turning people into a contact export. Profile access follows the customer’s sharing choices."
      action={
        <div className="flex flex-wrap gap-2">
          <ImportCustomers notify={notify} />
        <Button
          icon={<FileDown size={16} />}
          disabled={exporting === "customers"}
          onClick={() => runExport("customers")}
        >
          {exporting === "customers" ? "Preparing…" : "Export view"}
        </Button>
        </div>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="grid gap-3 border-b border-[var(--line)] p-4 sm:grid-cols-[1fr_auto]">
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3">
              <Search size={16} className="text-[var(--muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search customers"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder="Search customers"
              />
            </label>
            <select
              value={segment}
              onChange={(event) => setSegment(event.target.value)}
              aria-label="Filter customers by lifecycle segment"
              className="min-h-11 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-bold"
            >
              {[
                "All",
                "VIP",
                "Regular",
                "Almost regular",
                "New",
                "At risk",
                "Lapsed",
                "Reward ready",
              ].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-4 py-3">Lifecycle</th>
                  <th className="px-4 py-3">Visits</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Last visit</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    tabIndex={0}
                    aria-label={`Open ${customer.name}`}
                    onClick={() => setSelectedId(customer.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(customer.id);
                      }
                    }}
                    className={`cursor-pointer border-b border-[var(--line)] outline-offset-[-2px] transition focus-visible:outline-2 focus-visible:outline-[var(--accent)] last:border-0 ${selected.id === customer.id ? "bg-[rgb(232_163_61/9%)]" : "hover:bg-[var(--paper)]"}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-2)] text-[11px] font-extrabold">
                          {customer.initials}
                        </span>
                        <div>
                          <p className="text-sm font-extrabold">{customer.name}</p>
                          <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                            {customer.favorite}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Pill
                        tone={
                          customer.risk === "High"
                            ? "danger"
                            : customer.segment === "VIP"
                              ? "success"
                              : "neutral"
                        }
                      >
                        {customer.segment}
                      </Pill>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">
                      {customer.visits}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">
                      {pesoFromCentavos(customer.lifetimeValueCentavos)}
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                      {relativeTime(customer.lastVisitAt)}
                    </td>
                    <td className="px-4 py-4">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-12 text-center">
                <Users className="mx-auto text-[var(--muted)]" />
                <p className="mt-4 text-sm font-extrabold">
                  No customers match this view.
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Clear the search or choose another lifecycle segment.
                </p>
              </div>
            )}
          </div>
        </section>
        <aside className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-xl bg-[var(--accent)] text-lg font-extrabold text-[var(--ink)]">
              {selected.initials}
            </span>
            <div>
              <p className="text-lg font-extrabold">{selected.name}</p>
              <p className="mt-1 text-xs text-white/60">
                {selected.segment} · {selected.risk}
              </p>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10">
            {[
              ["Visits", selected.visits],
              ["Lifetime value", pesoFromCentavos(selected.lifetimeValueCentavos)],
              ["Progress", selected.progress],
              ["Birthday", selected.birthday],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--ink-soft)] p-4">
                <p className="text-[10px] uppercase tracking-[0.1em] text-white/50">
                  {label}
                </p>
                <p className="mt-1 text-sm font-extrabold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">
              Favorite order
            </p>
            <p className="mt-2 text-sm font-bold">{selected.favorite}</p>
          </div>
          <div className="mt-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/50">
              Reachable by consent
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["Email", selected.emailConsent],
                ["SMS", selected.smsConsent],
                ["Push", selected.pushConsent],
              ].map(([label, allowed]) => (
                <span
                  key={String(label)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${allowed ? "bg-[rgb(15_118_85/28%)] text-[#8ee0c2]" : "bg-white/7 text-white/50"}`}
                >
                  {label} · {allowed ? "Allowed" : "Off"}
                </span>
              ))}
            </div>
          </div>
          <CustomerExtras
            customerId={selected.id}
            customerName={selected.name}
            notify={notify}
          />
        </aside>
      </div>
    </ViewFrame>
  );
}
function BusinessProfileView({ notify }: { notify: Notify }) {
  const { data: locations = [] } = useLocations();
  const { data: profile, isPending, error, refetch } = useBusinessProfile();
  const { data: branding } = useBranding();
  const [editingLocation, setEditingLocation] = useState<BusinessLocation | null>(null);
  const [addingLocation, setAddingLocation] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  if (!profile) {
    return (
      <ViewFrame
        eyebrow="Workspace"
        title="Business profile"
        description="The record every customer-facing surface reads from."
      >
        <QueryBoundary
          isPending={isPending}
          error={error}
          onRetry={refetch}
          label="the business profile"
          rows={3}
        >
          <p className="text-sm text-[var(--muted-strong)]">No profile found.</p>
        </QueryBoundary>
      </ViewFrame>
    );
  }

  return (
    <ViewFrame
      eyebrow="Business profile"
      title="Locations & identity"
      description="Keep public discovery details, local operating settings, and branch performance in one place."
      action={
        <Button
          icon={<Plus size={16} />}
          onClick={() => setAddingLocation(true)}
        >
          Add location
        </Button>
      }
    >
      <section className="grid gap-3 lg:grid-cols-[0.75fr_1.25fr]">
        <article className="overflow-hidden rounded-xl bg-[var(--ink)] text-[var(--paper)]">
          <div className="grid h-36 place-items-center overflow-hidden bg-white/6">
            {branding?.imageUrl ? (
              /* A presigned storage URL on a host the image optimiser is not
                 configured for, and it changes every time it is signed. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.imageUrl}
                alt={`Inside ${profile.name}`}
                width={1200}
                height={800}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-white/45">
                No storefront photo yet
              </span>
            )}
          </div>
          <div className="p-6">
          <h2 className="mt-2 text-2xl font-extrabold">{profile.name}</h2>
          <p className="mt-2 text-sm text-white/60">
            {profile.category} · owned by {profile.owner}
          </p>
          <div className="mt-8 divide-y divide-white/12 border-y border-white/12">
            {[
              ["Plan", profile.plan],
              ["Billing", profile.billing],
              ["Renewal", longDate(profile.renewalOn)],
              ["Timezone", profile.timezone],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <span className="text-white/55">{label}</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
          <Button
            tone="accent"
            className="mt-6"
            icon={<Pencil size={15} />}
            onClick={() => setEditingProfile(true)}
          >
            Edit public profile
          </Button>
        </div>
        </article>
        <div className="space-y-3">
          {locations.map((location, index) => (
            <article
              key={location.id}
              className="grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <span
                className={`grid size-12 place-items-center rounded-2xl ${index === 0 ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"}`}
              >
                <Store size={19} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold">{location.name}</h3>
                  <Pill
                    tone={location.status === "Live" ? "success" : "warning"}
                  >
                    {location.status}
                  </Pill>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-strong)]">
                  {location.address}
                </p>
                <p className="mt-2 text-[10px] font-bold text-[var(--muted)]">
                  {location.staff} staff · {location.members.toLocaleString()}{" "}
                  members
                </p>
              </div>
              <button
                type="button"
                aria-label={`Open ${location.name} settings`}
                onClick={() => setEditingLocation(location)}
                className="grid size-10 place-items-center rounded-full border border-[var(--line)] hover:bg-[var(--surface-2)]"
              >
                <ChevronRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>
      {addingLocation && (
        <NewLocationDialog onClose={() => setAddingLocation(false)} notify={notify} />
      )}
      {editingLocation && (
        <EditLocationDialog
          location={editingLocation}
          onClose={() => setEditingLocation(null)}
          notify={notify}
        />
      )}
      {editingProfile && (
        <EditProfileDialog
          profile={profile}
          onClose={() => setEditingProfile(false)}
          notify={notify}
        />
      )}
    </ViewFrame>
  );
}
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
  const { data: coupons = [] } = useCoupons({ enabled: program.type === "Coupon" });
  const { data: catalog = [] } = useCatalog(program.type === "Rewards" ? program.id : "");
  const [couponName, setCouponName] = useState("");
  const [couponValue, setCouponValue] = useState("");
  const [cardValue, setCardValue] = useState("");
  const [cardFor, setCardFor] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCost, setItemCost] = useState("");

  const pesosToCentavos = (typed: string) => Math.round(Number.parseFloat(typed) * 100);
  const onlyMoney = (typed: string) => typed.replace(/[^0-9.]/g, "");
  const onlyDigits = (typed: string) => typed.replace(/[^0-9]/g, "");
  const field =
    "min-h-11 w-full rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]";

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
          <input
            value={couponName}
            onChange={(event) => setCouponName(event.target.value)}
            placeholder="What it is for"
            className={field}
          />
          <input
            value={couponValue}
            onChange={(event) => setCouponValue(onlyMoney(event.target.value))}
            inputMode="decimal"
            placeholder="Value in pesos"
            className={field}
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
                  onError: (failure) => notify(failure.message, "error"),
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
          <input
            value={cardFor}
            onChange={(event) => setCardFor(event.target.value)}
            placeholder="Who it is for, optional"
            className={field}
          />
          <input
            value={cardValue}
            onChange={(event) => setCardValue(onlyMoney(event.target.value))}
            inputMode="decimal"
            placeholder="Amount in pesos"
            className={field}
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
                  onError: (failure) => notify(failure.message, "error"),
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
          <input
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            placeholder="Item name"
            className={field}
          />
          <input
            value={itemCost}
            onChange={(event) => setItemCost(onlyDigits(event.target.value))}
            inputMode="numeric"
            placeholder="Cost in points"
            className={field}
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
                  onError: (failure) => notify(failure.message, "error"),
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

  return null;
}

function ProgramsView({ notify }: { notify: Notify }) {
  const { data: programs = [], isPending, error, refetch } = usePrograms();
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
      target: selected.target,
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
      description="Run all eight proven loyalty mechanics from one rules engine while preserving every customer’s earned value."
      action={
        <Button
          icon={<Plus size={16} />}
          onClick={() => setCreating(true)}
        >
          New program
        </Button>
      }
    >
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
                Publishing a rule change creates a new version. Existing points,
                balances, and rewards remain protected.
              </p>
            </div>
          </div>
          <ProgramStock program={selected} notify={notify} />
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button
              tone="quiet"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              disabled={duplicate.isPending}
              onClick={() =>
                duplicate.mutate(selected.id, {
                  onSuccess: (copy) =>
                    notify(`${copy.name} added to your programs as a draft.`),
                  onError: (failure) => notify(failure.message, "error"),
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
              <label className="mt-4 grid gap-2 text-xs font-bold">
                Program name
                <input
                  value={draft.name ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  className="min-h-11 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <fieldset className="mt-4">
                <legend className="text-xs font-bold">Status</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PROGRAM_STATUSES.map((status) => (
                    <button
                      type="button"
                      key={status}
                      aria-pressed={draft.status === status}
                      onClick={() => setDraft((current) => ({ ...current, status }))}
                      className={`min-h-10 rounded-full px-3 text-xs font-bold ${
                        draft.status === status
                          ? "bg-[var(--accent)] text-[var(--ink)]"
                          : "border border-white/15 text-white/60"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="mt-4 grid gap-2 text-xs font-bold">
                Reward
                <input
                  value={draft.rewardName ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, rewardName: event.target.value }))
                  }
                  className="min-h-11 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label className="mt-4 grid gap-2 text-xs font-bold">
                Visits to earn it
                <input
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
                  className="min-h-11 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
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
                      onError: (failure) => notify(failure.message, "error"),
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
      {creating && (
        <NewProgramDialog onClose={() => setCreating(false)} notify={notify} />
      )}
    </ViewFrame>
  );
}
function FavoriteOrdersView({
  notify,
  onNavigate,
}: {
  notify: Notify;
  onNavigate: (view: BusinessView) => void;
}) {
  const { data: favoriteOrders = [] } = useFavoriteOrders();
  const draft = useCreateCampaign();
  // The item the most regulars actually order, rather than a fixed example.
  const top = [...favoriteOrders].sort((a, b) => b.regulars - a.regulars)[0];
  // Math.max of nothing is -Infinity, which would make every bar NaN wide.
  const max = Math.max(1, ...favoriteOrders.map((item) => item.orders));
  return (
    <ViewFrame
      eyebrow="Customer context"
      title="Favorite orders"
      description="Connect visit behavior with the items regulars actually choose. SKU context stays optional until a POS or file import is connected."
      action={
        <Button
          tone="quiet"
          icon={<PlugZap size={16} />}
          onClick={() => onNavigate("integrations")}
        >
          Connect order data
        </Button>
      }
    >
      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <Eyebrow>Top regular choices</Eyebrow>
          <div className="mt-6 space-y-5">
            {favoriteOrders.map((item, index) => (
              <div key={item.item}>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-extrabold">
                      {index + 1}. {item.item}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      Chosen by {item.regulars} regulars
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold">{item.orders}</p>
                    <p
                      className={`text-[10px] font-bold ${item.change >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                    >
                      {item.change >= 0 ? "+" : ""}
                      {item.change}%
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div
                    className={`h-full rounded-full ${index === 0 ? "bg-[var(--accent)]" : "bg-[var(--ink)]"}`}
                    style={{ width: `${(item.orders / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-[var(--accent)] p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Useful segment</Eyebrow>
            <Heart size={19} />
          </div>
          {top ? (
            <>
              <h2 className="mt-8 max-w-[13ch] text-3xl font-extrabold leading-[1.02] tracking-[-0.02em]">
                {top.regulars} regulars order {top.item}.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]/80">
                {top.orders.toLocaleString()} orders on record
                {top.change > 0
                  ? `, up ${top.change}% on last month`
                  : top.change < 0
                    ? `, down ${Math.abs(top.change)}% on last month`
                    : ", level with last month"}
                . They are the easiest people in your list to say something
                relevant to.
              </p>
              <div className="mt-8 rounded-2xl bg-[var(--surface)] p-4">
                <p className="text-xs font-extrabold">
                  Audience · {top.regulars} customer{top.regulars === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-strong)]">
                  Favourite-order context reaches only the customers who chose
                  personalised recommendations.
                </p>
              </div>
              <Button
                className="mt-5"
                disabled={draft.isPending}
                onClick={() =>
                  draft.mutate(
                    {
                      name: `${top.item} regulars`,
                      audience: `Regulars who order ${top.item}`,
                      channels: ["Push"],
                    },
                    {
                      onSuccess: (campaign) => {
                        notify(`${campaign.name} drafted.`);
                        onNavigate("campaigns");
                      },
                      onError: (failure) => notify(failure.message, "error"),
                    },
                  )
                }
              >
                {draft.isPending ? "Creating\u2026" : "Create this audience"}
              </Button>
            </>
          ) : (
            <>
              <h2 className="mt-8 max-w-[14ch] text-3xl font-extrabold leading-[1.02] tracking-[-0.02em]">
                No order data yet.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]/80">
                Connect a POS or import a file and the items your regulars
                actually choose appear here, ready to build an audience from.
              </p>
            </>
          )}
        </section>
      </div>
    </ViewFrame>
  );
}
function BirthdayView({ notify }: { notify: Notify }) {
  const { data: customers = [] } = useBusinessCustomers();
  // Was a literal list of three dates under a "next 30 days" heading, so it
  // was only ever correct on the day it was written.
  const upcoming = customers
    .map((customer) => ({ customer, inDays: daysUntilBirthday(customer.birthday) }))
    .filter((entry): entry is { customer: typeof entry.customer; inDays: number } =>
      entry.inDays !== null,
    )
    .sort((a, b) => a.inDays - b.inDays);
  const [channels, setChannels] = useState({
    Push: true,
    Email: true,
    SMS: false,
  });
  return (
    <ViewFrame
      eyebrow="Birthday moments"
      title="Birthday offers"
      description="Build one thoughtful birthday journey with explicit eligibility, a budget ceiling, and channel-specific consent."
      action={<Pill tone="success">Automation live</Pill>}
    >
      <div className="grid gap-3 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow>Next 30 days</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">
                {upcoming.length} known birthdays
              </h2>
            </div>
            <CakeSlice className="text-[var(--accent-strong)]" />
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {upcoming.map(({ customer, inDays }) => {
              // Every consented channel counts, not just SMS.
              const reachable = [
                customer.pushConsent,
                customer.emailConsent,
                customer.smsConsent,
              ].filter(Boolean).length;
              return (
                <div key={customer.id} className="flex items-center gap-3 py-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-2)] text-xs font-extrabold">
                    {customer.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold">{customer.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {customer.birthday} ·{" "}
                      {inDays === 0 ? "today" : `in ${inDays} day${inDays === 1 ? "" : "s"}`} ·{" "}
                      {customer.favorite}
                    </p>
                  </div>
                  <Pill tone={reachable > 1 ? "success" : "neutral"}>
                    {reachable} channel{reachable === 1 ? "" : "s"}
                  </Pill>
                </div>
              );
            })}
            {upcoming.length === 0 && (
              <p className="py-6 text-xs text-[var(--muted)]">
                No known birthdays in the next 30 days.
              </p>
            )}
          </div>
        </section>
        <section className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <Eyebrow>Journey editor</Eyebrow>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold">
              Send timing
              <select className="min-h-11 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm">
                <option>7 days before</option>
                <option>On the birthday</option>
                <option>Birthday month</option>
              </select>
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Reward
              <select className="min-h-11 rounded-xl border border-white/15 bg-[var(--ink-soft)] px-3 text-sm">
                <option>Birthday pastry</option>
                <option>Double stamp</option>
                <option>₱100 gift value</option>
              </select>
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-xs font-bold">
            Message
            <textarea
              defaultValue="A birthday treat should feel easy. Visit any Sweet Crumbs branch this week and choose a pastry on us."
              rows={4}
              className="rounded-xl border border-white/15 bg-[var(--ink-soft)] p-3 text-sm leading-relaxed outline-none focus:border-[var(--accent)]"
            />
          </label>
          <div className="mt-5">
            <p className="text-xs font-bold">Delivery channels</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(channels).map(([channel, active]) => (
                <button
                  type="button"
                  key={channel}
                  aria-pressed={active}
                  onClick={() =>
                    setChannels((current) => ({
                      ...current,
                      [channel]: !active,
                    }))
                  }
                  className={`rounded-full border px-3 py-2 text-xs font-bold ${active ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--ink)]" : "border-white/15 text-white/55"}`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-white/6 p-4">
            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-[var(--accent)]"
            />
            <p className="text-xs leading-relaxed text-white/65">
              Each channel checks current consent at delivery time. SMS is
              skipped when consent is off or the credit budget is exhausted.
            </p>
          </div>
          <Button
            tone="accent"
            className="mt-6"
            onClick={() =>
              notify("Birthday journey saved with channel guardrails.")
            }
          >
            Save journey
          </Button>
        </section>
      </div>
    </ViewFrame>
  );
}
function RedemptionsView({ notify }: { notify: Notify }) {
  const { runExport, busy: exporting } = useExport(notify);
  const { data: redemptions = [] } = useRedemptions();
  const { data: programs = [] } = usePrograms();
  // These were three hardcoded figures, one of which quoted the stamp-card
  // liability under a "reward value" label. All three now say what they count.
  const approved = redemptions.filter((item) => item.status === "Approved");
  const reversals = redemptions.length - approved.length;
  const rewardValue = approved.reduce((sum, item) => sum + item.valueCentavos, 0);
  const approvalRate = (approved.length / redemptions.length) * 100;
  const stampLiability =
    programs.find((program) => program.type === "Stamps")?.liabilityCentavos ?? 0;
  return (
    <ViewFrame
      eyebrow="Value ledger"
      title="Redemptions"
      description="Every reward event shows the customer, branch, approving staff member, value, status, and reversal path."
      action={
        <Button
          tone="quiet"
          icon={<Download size={16} />}
          disabled={exporting === "redemptions"}
          onClick={() => runExport("redemptions")}
        >
          {exporting === "redemptions" ? "Preparing…" : "Export ledger"}
        </Button>
      }
    >
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <th className="px-5 py-4">Customer</th>
                <th className="px-4 py-4">Reward</th>
                <th className="px-4 py-4">Location</th>
                <th className="px-4 py-4">Approved by</th>
                <th className="px-4 py-4">Value</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  <td className="px-5 py-4 text-sm font-extrabold">
                    {item.customer}
                  </td>
                  <td className="px-4 py-4 text-sm">{item.reward}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                    {item.branch}
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                    {item.staff}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold">
                    {item.valueCentavos ? pesoFromCentavos(item.valueCentavos) : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <Pill
                      tone={item.status === "Approved" ? "success" : "warning"}
                    >
                      {item.status}
                    </Pill>
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)]">
                    {relativeTime(item.occurredAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {[
          [
            "Reward value in this ledger",
            peso(rewardValue),
            `${approved.length} approved redemption${approved.length === 1 ? "" : "s"}`,
          ],
          [
            "Approval rate",
            `${approvalRate.toFixed(1)}%`,
            `${reversals} reversal${reversals === 1 ? "" : "s"}`,
          ],
          [
            "Outstanding stamp-card liability",
            peso(stampLiability),
            "What unredeemed stamps would cost",
          ],
        ].map(([label, value, detail]) => (
          <article
            key={label}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
              {label}
            </p>
            <p className="mt-4 text-2xl font-extrabold tracking-[-0.02em]">
              {value}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-strong)]">{detail}</p>
          </article>
        ))}
      </div>
    </ViewFrame>
  );
}
/** Per-campaign delivery ceiling quoted in the preflight copy. */
const SMS_CEILING = 1000;
/**
 * What is left of this month's plan allowance, per channel.
 *
 * Email was billed at the overage rate from the first message while its own
 * label read "Uses allowance". A channel with allowance left costs nothing
 * until that allowance runs out.
 */
const allowanceRemainingFrom = (allowances: Allowance[]): Record<string, number> =>
  Object.fromEntries(
    allowances
      .filter((item) => item.unit === "messages" || item.unit === "credits")
      .map((item) => [
        item.label === "SMS credits" ? "SMS" : item.label,
        Math.max(0, item.included - item.used),
      ]),
);
/**
 * Cost of sending to `count` recipients on one channel, allowance first.
 *
 * The remaining allowance is passed in rather than read from a module
 * constant: it comes from the billing request now, so it is only known once
 * that has answered.
 */
function channelCost(
  name: string,
  unit: number,
  count: number,
  allowanceRemaining: Record<string, number>,
) {
  if (unit === 0) return 0;
  const free = Math.min(count, allowanceRemaining[name] ?? 0);
  return (count - free) * unit;
}
type ChannelStatus = "ready" | "planned";
const channelConfig: {
  name: string;
  icon: typeof BellRing;
  eligible: number;
  unit: number;
  note: string;
  status: ChannelStatus;
}[] = [
  {
    name: "In-app",
    icon: MessageSquareText,
    eligible: 1280,
    unit: 0,
    note: "Included",
    status: "ready",
  },
  {
    name: "Push",
    icon: BellRing,
    eligible: 1120,
    unit: 0,
    note: "Included",
    status: "ready",
  },
  {
    name: "Email",
    icon: Mail,
    eligible: 1060,
    unit: 0.025,
    note: "₱0.025 / email",
    status: "ready",
  },
  {
    name: "Viber",
    icon: MessageCircle,
    eligible: 610,
    unit: 0.42,
    note: "₱0.42 / message",
    status: "ready",
  },
  {
    name: "SMS",
    icon: Phone,
    eligible: 780,
    unit: 0.95,
    note: "₱0.95 / segment",
    status: "ready",
  },
  {
    name: "WhatsApp",
    icon: Send,
    eligible: 240,
    unit: 0.55,
    note: "Needs Meta Business verification",
    status: "planned",
  },
  {
    name: "Messenger",
    icon: MessagesSquare,
    eligible: 430,
    unit: 0.35,
    note: "Needs Meta Business verification",
    status: "planned",
  },
];
function CampaignsView({ notify }: { notify: Notify }) {
  const { data: metrics = EMPTY_BUSINESS_METRICS } = useBusinessMetrics();
  const { data: campaigns = [] } = useCampaigns();
  const schedule = useCreateCampaign();
  const { data: billing } = useBilling();
  const allowanceRemaining = useMemo(
    () => allowanceRemainingFrom(billing?.allowances ?? []),
    [billing],
  );
  const [campaignName, setCampaignName] = useState("Tuesday treat");
  const [audience, setAudience] = useState(1280);
  // These three were uncontrolled selects, so the composer showed choices that
  // never reached the scheduled campaign.
  const [audienceSegment, setAudienceSegment] = useState("Almost regulars");
  const [sendTime, setSendTime] = useState("Tuesday, 1:30 PM");
  const [frequencyPolicy, setFrequencyPolicy] = useState("Respect 2 promos / week");
  const [channels, setChannels] = useState<Record<string, boolean>>({
    "In-app": true,
    Push: true,
    Email: true,
    Viber: false,
    SMS: false,
  });
  const [smartRouting, setSmartRouting] = useState(true);
  const [message, setMessage] = useState(
    "A warm pastry is waiting. Visit Sweet Crumbs before 4 PM this Tuesday and your next stamp counts twice.",
  );
  const selectedChannels = channelConfig.filter(
    (channel) => channel.status === "ready" && channels[channel.name],
  );
  const smsChannel = channelConfig.find((channel) => channel.name === "SMS");
  const viberChannel = channelConfig.find((channel) => channel.name === "Viber");
  // ponytail: routing only ever diverts SMS to the cheaper messaging app. One
  // subtraction beats modelling a full per-recipient channel waterfall.
  const smsAudience =
    smsChannel && channels.SMS ? Math.min(audience, smsChannel.eligible) : 0;
  const divertedToViber =
    smartRouting && viberChannel ? Math.min(smsAudience, viberChannel.eligible) : 0;
  const routingSavings =
    smsChannel && viberChannel
      ? divertedToViber * (smsChannel.unit - viberChannel.unit)
      : 0;
  const deliveryCost = Math.max(
    0,
    selectedChannels.reduce(
      (sum, channel) =>
        sum +
        channelCost(
          channel.name,
          channel.unit,
          Math.min(audience, channel.eligible),
          allowanceRemaining,
        ),
      0,
    ) - routingSavings,
  );
  const reachable = Math.min(
    audience,
    Math.max(...selectedChannels.map((channel) => channel.eligible), 0),
  );
  const predictedVisits = Math.round(reachable * 0.118);
  // deliveryCost is pesos, from the published channel rates in plans.ts; the
  // API sends the average order in centavos. Both are named for their unit
  // because dividing one by the other silently put the ROI out by 100x.
  const predictedRevenuePesos = (predictedVisits * metrics.averageOrderCentavos) / 100;
  const roi = deliveryCost ? predictedRevenuePesos / deliveryCost : predictedRevenuePesos;
  return (
    <ViewFrame
      eyebrow="Campaign studio"
      title="Campaigns"
      description="Plan across in-app, push, email, Viber, and SMS with consent eligibility, delivery cost, quiet hours, and expected business value visible before launch. Messaging apps are used ahead of SMS whenever a customer is reachable there."
      action={
        <Button
          tone="quiet"
          icon={<ClipboardCheck size={16} />}
          onClick={() => {
            const problems: string[] = [];
            if (selectedChannels.length === 0) {
              problems.push("no channel selected");
            }
            if (!message.trim()) problems.push("the message is empty");
            if (message.length > 320) problems.push("the message is over 320 characters");
            if (channels.SMS && deliveryCost > SMS_CEILING) {
              problems.push(
                `estimated cost ${peso(deliveryCost, { decimals: true })} is over the ${peso(SMS_CEILING)} campaign ceiling`,
              );
            }
            if (reachable === 0) problems.push("no reachable customers with consent");
            notify(
              problems.length
                ? `Preflight failed: ${problems.join("; ")}.`
                : `Preflight passed: ${reachable.toLocaleString()} reachable, estimated ${peso(deliveryCost, { decimals: true })}.`,
              problems.length ? "error" : "info",
            );
          }}
        >
          Run preflight
        </Button>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold">
              Campaign name
              <input
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent-strong)]"
              />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Audience
              <select
                value={audienceSegment}
                onChange={(event) => setAudienceSegment(event.target.value)}
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm"
              >
                <option>Almost regulars</option>
                <option>At-risk regulars</option>
                <option>One action from reward</option>
                <option>Custom segment</option>
              </select>
            </label>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <label htmlFor="audience-size" className="text-xs font-bold">
                Audience size
              </label>
              <span className="text-sm font-extrabold">
                {audience.toLocaleString()}
              </span>
            </div>
            <input
              id="audience-size"
              type="range"
              min="100"
              max="2000"
              step="20"
              value={audience}
              onChange={(event) => setAudience(Number(event.target.value))}
              className="mt-3 w-full accent-[var(--accent-strong)]"
            />
          </div>
          <div className="mt-6">
            <p className="text-xs font-bold">Channels</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {channelConfig.map((channel) => {
                const Icon = channel.icon;
                const planned = channel.status === "planned";
                const active = !planned && channels[channel.name];
                return (
                  <button
                    type="button"
                    key={channel.name}
                    aria-pressed={planned ? undefined : active}
                    disabled={planned}
                    title={planned ? "Available after Meta Business verification" : undefined}
                    onClick={() =>
                      setChannels((current) => ({
                        ...current,
                        [channel.name]: !active,
                      }))
                    }
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${planned ? "cursor-not-allowed border-dashed border-[var(--line-strong)] bg-[var(--surface)] opacity-70" : active ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--line)] bg-[var(--paper)]"}`}
                  >
                    <span
                      className={`grid size-9 place-items-center rounded-xl ${active ? "bg-white/10 text-[var(--accent)]" : "bg-[var(--surface)]"}`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold">{channel.name}</span>
                        {planned && (
                          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted-strong)]">
                            Soon
                          </span>
                        )}
                      </span>
                      <span
                        className={`mt-0.5 block text-[10px] ${active ? "text-white/60" : "text-[var(--muted)]"}`}
                      >
                        {channel.eligible.toLocaleString()} reachable ·{" "}
                        {allowanceRemaining[channel.name]
                          ? `${allowanceRemaining[channel.name].toLocaleString()} left in plan, then ${channel.note.toLowerCase()}`
                          : channel.note}
                      </span>
                    </span>
                    {active && <Check size={16} />}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-pressed={smartRouting}
              onClick={() => setSmartRouting((value) => !value)}
              className={`mt-3 flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${smartRouting ? "border-[var(--success)] bg-[rgb(15_118_85/7%)]" : "border-[var(--line)] bg-[var(--paper)]"}`}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl ${smartRouting ? "bg-[var(--success)] text-white" : "bg-[var(--surface)]"}`}
              >
                <Route size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">
                  Reach on a messaging app before SMS
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-[var(--muted-strong)]">
                  {channels.SMS
                    ? divertedToViber > 0
                      ? `${divertedToViber.toLocaleString()} of ${smsAudience.toLocaleString()} SMS recipients are reachable on Viber, saving ₱${routingSavings.toFixed(2)} on this send.`
                      : "No selected recipients are reachable on a messaging app right now."
                    : "Turn on SMS to see how many recipients can be reached more cheaply."}
                </span>
              </span>
              <span className="shrink-0 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted-strong)]">
                {smartRouting ? "On" : "Off"}
              </span>
            </button>
          </div>
          <label className="mt-6 grid gap-2 text-xs font-bold">
            Message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              maxLength={320}
              className="rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] p-4 text-sm leading-relaxed outline-none focus:border-[var(--accent-strong)]"
            />
            <span className="text-right text-[10px] font-semibold text-[var(--muted)]">
              {message.length}/320 · SMS may use {message.length > 160 ? 2 : 1}{" "}
              segment{message.length > 160 ? "s" : ""}
            </span>
          </label>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold">
              Send time
              <select
                value={sendTime}
                onChange={(event) => setSendTime(event.target.value)}
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm"
              >
                <option>Tuesday, 1:30 PM</option>
                <option>Now after preflight</option>
                <option>At each customer’s usual time</option>
              </select>
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Frequency policy
              <select
                value={frequencyPolicy}
                onChange={(event) => setFrequencyPolicy(event.target.value)}
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm"
              >
                <option>Respect 2 promos / week</option>
                <option>Service message only</option>
              </select>
            </label>
          </div>
        </section>
        <aside className="rounded-2xl bg-[var(--accent)] p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Campaign economics</Eyebrow>
            <CircleDollarSign size={20} />
          </div>
          <div className="mt-7 divide-y divide-[rgb(24_18_12/16%)] border-y border-[rgb(24_18_12/16%)]">
            {[
              ["Reachable with consent", reachable.toLocaleString()],
              ["Estimated delivery cost", peso(deliveryCost, { decimals: true })],
              ["Predicted visits", predictedVisits],
              [
                "Predicted visit revenue",
                peso(predictedRevenuePesos),
              ],
              [
                "Revenue / delivery cost",
                deliveryCost ? `${roi.toFixed(1)}×` : "No paid channel",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <span className="text-[var(--ink)]/75">{label}</span>
                <span className="font-extrabold">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-[var(--surface)] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-[var(--success)]"
              />
              <div>
                <p className="text-xs font-extrabold">Preflight guardrails</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-strong)]">
                  Purpose and consent checked per channel. Quiet hours,
                  complaint threshold, duplicate suppression, and a ₱1,000 SMS
                  ceiling apply.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button
              tone="quiet"
              onClick={() => notify("Test message preview opened.", "review")}
            >
              Send test
            </Button>
            <Button
              onClick={() => {
                if (selectedChannels.length === 0) {
                  notify("Choose at least one channel before scheduling.", "error");
                  return;
                }
                schedule.mutate(
                  {
                    name: campaignName.trim() || "Untitled campaign",
                    audience: `${audienceSegment} · ${audience.toLocaleString()} selected`,
                    channels: selectedChannels.map((channel) => channel.name),
                    sendTime,
                    frequencyPolicy,
                  },
                  { onError: (failure) => notify(failure.message, "error") },
                );
                notify(
                  `${campaignName.trim() || "Untitled campaign"} scheduled for ${sendTime.toLowerCase()} · ${reachable.toLocaleString()} reachable customers.`,
                );
              }}
              icon={<Send size={15} />}
            >
              Schedule
            </Button>
          </div>
        </aside>
      </div>
      <section className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
          <div>
            <Eyebrow>Campaign history</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">Revenue after delivery</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <tbody>
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-extrabold">{campaign.name}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      {campaign.audience}
                      {campaign.sendTime ? ` · ${campaign.sendTime}` : ""}
                      {campaign.frequencyPolicy ? ` · ${campaign.frequencyPolicy}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold">
                    {campaign.channels.join(" + ")}
                  </td>
                  <td className="px-4 py-4 text-xs">
                    {campaign.sent.toLocaleString()} sent
                  </td>
                  <td className="px-4 py-4 text-xs">
                    {campaign.visited} visits
                  </td>
                  <td className="px-4 py-4 text-sm font-extrabold">
                    {pesoFromCentavos(campaign.revenueCentavos)}
                  </td>
                  <td className="px-4 py-4">
                    <Pill
                      tone={
                        campaign.status === "Completed" ? "success" : "warning"
                      }
                    >
                      {campaign.status}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </ViewFrame>
  );
}
/** Derived so a channel that exists in the ledger is always filterable. */
const messageChannelsFrom = (rows: MessageRecord[]) => [
  "All",
  ...Array.from(new Set(rows.map((message) => message.channel))),
];
function MessageLogView({ notify }: { notify: Notify }) {
  const { runExport, busy: exporting } = useExport(notify);
  const { data: messages = [] } = useMessages();
  const messageChannels = useMemo(() => messageChannelsFrom(messages), [messages]);
  const [channel, setChannel] = useState("All");
  const [query, setQuery] = useState("");
  const rows = messages.filter(
    (message) =>
      (channel === "All" || message.channel === channel) &&
      `${message.campaign} ${message.customer} ${message.status}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <ViewFrame
      eyebrow="Delivery ledger"
      title="Message log"
      description="Inspect every customer communication across in-app, push, email, and SMS—including cost, consent outcomes, and downstream visits."
      action={
        <Button
          tone="quiet"
          icon={<Download size={16} />}
          disabled={exporting === "messages"}
          onClick={() => runExport("messages")}
        >
          {exporting === "messages" ? "Preparing…" : "Export log"}
        </Button>
      }
    >
      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {messageChannels.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setChannel(item)}
                className={`rounded-full px-3 py-2 text-xs font-bold ${channel === item ? "bg-[var(--ink)] text-[var(--paper)]" : "bg-[var(--paper)] text-[var(--muted-strong)]"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search message history"
              className="bg-transparent text-sm outline-none"
              placeholder="Search messages"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <th className="px-5 py-3">Campaign</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Sent</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((message) => (
                <tr
                  key={message.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  <td className="px-5 py-4 text-sm font-extrabold">
                    {message.campaign}
                  </td>
                  <td className="px-4 py-4 text-sm">{message.customer}</td>
                  <td className="px-4 py-4 text-xs font-bold">
                    {message.channel}
                  </td>
                  <td className="px-4 py-4">
                    <Pill
                      tone={
                        message.status === "Opted out" ? "warning" : "success"
                      }
                    >
                      {message.status}
                    </Pill>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs">
                    {message.costCentavos ? pesoFromCentavos(message.costCentavos) : "Included"}
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)]">
                    {message.sentAt}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm font-bold text-[var(--muted)]"
                  >
                    No messages match this channel and search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </ViewFrame>
  );
}
/**
 * Who the numbers above are about.
 *
 * Quintiles within this merchant's own base, not an industry benchmark: a
 * neighbourhood bakery's "frequent" is not a mall chain's, and scoring
 * against somebody else's distribution would put every small shop in the
 * bottom band.
 */
function SegmentBreakdown() {
  const { data: scored = [] } = useRfm();
  if (scored.length === 0) return null;

  const bySegment = new Map<string, typeof scored>();
  for (const member of scored) {
    bySegment.set(member.segment, [...(bySegment.get(member.segment) ?? []), member]);
  }
  const segments = [...bySegment.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <section className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <Eyebrow>Who returns</Eyebrow>
      <h2 className="mt-1 text-lg font-extrabold">
        {scored.length} scored member{scored.length === 1 ? "" : "s"}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
        Recency, frequency and spend, each scored one to five against your own
        customers rather than an industry average.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {segments.map(([segment, members]) => (
          <article
            key={segment}
            className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-extrabold">{segment}</p>
              <p className="text-lg font-extrabold">{members.length}</p>
            </div>
            <ul className="mt-3 space-y-1">
              {members.slice(0, 4).map((member) => (
                <li
                  key={member.customerId}
                  className="flex justify-between gap-2 text-[11px]"
                >
                  <span className="truncate">{member.name}</span>
                  <span className="shrink-0 font-mono text-[var(--muted-strong)]">
                    {member.recencyScore}
                    {member.frequencyScore}
                    {member.monetaryScore}
                  </span>
                </li>
              ))}
            </ul>
            {members.length > 4 && (
              <p className="mt-2 text-[10px] text-[var(--muted)]">
                and {members.length - 4} more
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * What customers actually said.
 *
 * Only a happy rating is invited to post publicly, which the API decides -
 * routing an unhappy customer to a review form turns a retention tool into a
 * reputation problem, and the merchant should see the unhappy ones first.
 */
function WhatTheySaid() {
  const { data: feedback = [] } = useFeedback();
  const answered = feedback.filter((entry) => entry.status === "answered");
  if (feedback.length === 0) return null;

  const average =
    answered.length === 0
      ? 0
      : answered.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) / answered.length;
  // Worst first: a four-star with no comment needs nobody's attention.
  const worstFirst = [...answered].sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));

  return (
    <section className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Eyebrow>What they said</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">
            {answered.length} of {feedback.length} answered
          </h2>
        </div>
        {answered.length > 0 && (
          <Pill tone={average >= 4 ? "success" : average >= 3 ? "warning" : "danger"}>
            {average.toFixed(1)} average
          </Pill>
        )}
      </div>
      {answered.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted-strong)]">
          Nobody has answered yet.
        </p>
      ) : (
        <ul className="mt-5 space-y-2">
          {worstFirst.slice(0, 6).map((entry) => (
            <li
              key={entry.id}
              className="flex items-start gap-3 rounded-xl border border-[var(--line)] p-3"
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${
                  (entry.rating ?? 0) >= 4
                    ? "bg-[rgb(15_118_85/12%)] text-[var(--success)]"
                    : "bg-[rgb(178_59_43/10%)] text-[var(--danger)]"
                }`}
              >
                {entry.rating}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-relaxed">
                  {entry.comment || <span className="text-[var(--muted)]">No comment</span>}
                </p>
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  {relativeTime(entry.answeredAt)}
                  {entry.reviewInvited ? " · invited to review publicly" : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AnalyticsView() {
  const { data: programs = [] } = usePrograms();
  // "Campaign-attributed" was hardcoded at ₱76.4k while the fixture's own
  // campaign revenue summed to ₱136.3k. Both now come from the same number.
  const { data: metrics = EMPTY_BUSINESS_METRICS } = useBusinessMetrics();
  const rewardIssued = programs.reduce(
    (sum, program) => sum + program.liabilityCentavos,
    0,
  );
  /*
   * These six numbers and the cohort grid under them were written by hand:
   * 100, 68, 54, 47, 44, 42, and four rows labelled May through August. They
   * were the same for every merchant and moved for none of them.
   *
   * The API measures both from the ledger, so a merchant reading "54% return
   * in week two" is reading their own customers.
   */
  const { data: retentionData } = useRetention();
  const { data: secondVisit } = useTimeToSecondVisit();
  const retention = retentionData?.weeks ?? [];
  const cohorts = retentionData?.cohorts ?? [];
  return (
    <ViewFrame
      eyebrow="Retention intelligence"
      title="Analytics"
      description="Measure the return visit, not vanity reach. Connect program behavior, campaign cost, reward liability, and member revenue."
    >
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow>Six-week retention</Eyebrow>
              <h2 className="mt-1 text-lg font-extrabold">Customers who return</h2>
            </div>
            {secondVisit && secondVisit.members > 0 ? (
              <Pill tone="success">
                {secondVisit.medianDays}d median to a second visit
              </Pill>
            ) : null}
          </div>
          <div className="mt-10 flex h-64 items-end gap-3">
            {retention.map((value, index) => (
              <div
                key={index}
                className="flex h-full flex-1 flex-col justify-end"
              >
                <span className="mb-2 text-center text-xs font-extrabold">
                  {value}%
                </span>
                <div
                  className={`rounded-t-xl ${index === 0 ? "bg-[var(--accent)]" : "bg-[var(--ink)]"}`}
                  style={{ height: `${value}%` }}
                />
                <span className="mt-2 text-center text-[10px] text-[var(--muted)]">
                  W{index}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
          <Eyebrow>Member economics</Eyebrow>
          <p className="mt-7 text-4xl font-extrabold tracking-[-0.03em]">
            {pesoCompactFromCentavos(metrics.memberRevenueCentavos)}
          </p>
          <p className="mt-1 text-xs text-white/55">
            member-attributed revenue this month
          </p>
          <div className="mt-8 divide-y divide-white/12 border-y border-white/12">
            {[
              ["Campaign-attributed", pesoCompactFromCentavos(metrics.campaignRevenueCentavos)],
              ["Outstanding reward liability", pesoCompactFromCentavos(rewardIssued)],
              [
                "Revenue / reward liability",
                `${(metrics.memberRevenueCentavos / rewardIssued).toFixed(1)}×`,
              ],
              ["Average member order", pesoFromCentavos(metrics.averageOrderCentavos)],
              ["Repeat visit rate", `${metrics.repeatRate}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <span className="text-white/55">{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <div className="flex items-end justify-between">
          <div>
            <Eyebrow>Cohort return matrix</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">
              First visit month → weeks retained
            </h2>
          </div>
          <p className="hidden text-xs text-[var(--muted)] sm:block">
            Darker cells mean more customers returned.
          </p>
        </div>
        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[660px]">
            <div className="grid grid-cols-[120px_repeat(6,1fr)] gap-1 text-center text-[10px] font-bold text-[var(--muted)]">
              <span />
              <span>W0</span>
              <span>W1</span>
              <span>W2</span>
              <span>W3</span>
              <span>W4</span>
              <span>W5</span>
            </div>
            {cohorts.length === 0 ? (
              <p className="mt-4 text-xs text-[var(--muted-strong)]">
                Not enough history yet. A cohort needs a few weeks of visits
                before it says anything.
              </p>
            ) : (
              <div className="mt-1 grid grid-cols-[120px_repeat(6,1fr)] gap-1">
                <span className="flex items-center text-xs font-bold">
                  Active members
                </span>
                {cohorts.map((cell) => {
                  // Shaded against the widest week, so the grid reads as a
                  // comparison rather than an absolute scale.
                  const peak = Math.max(...cohorts.map((item) => item.active), 1);
                  const share = Math.round((cell.active / peak) * 100);
                  return (
                    <span
                      key={cell.week}
                      className="grid min-h-12 place-items-center rounded-lg text-xs font-extrabold"
                      style={{
                        backgroundColor: cell.active
                          ? `rgb(232 163 61 / ${0.12 + share / 130})`
                          : "var(--surface-2)",
                        color: share > 55 ? "var(--ink)" : "var(--muted-strong)",
                      }}
                    >
                      {cell.active || "—"}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
      <SegmentBreakdown />
      <WhatTheySaid />
    </ViewFrame>
  );
}
const STAFF_ROLES = [
  ["Owner", "Everything, including billing and deletion"],
  ["Manager", "Programs, customers, campaigns, and staff"],
  ["Cashier", "Scan, earn, redeem, and reverse window"],
  ["Analyst", "Read-only customers and analytics"],
] as const;
function StaffView({ notify }: { notify: Notify }) {
  const { data: locations = [] } = useLocations();
  // "Invite staff" used to open /accept-invite — the recipient's screen. An
  // owner needs a composer, so this is one.
  const { data: staff = [] } = useStaff();
  const invite = useInviteStaff();
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
    // The invitation is a signed link sent by email, so there is no invite
    // without one. The composer used to collect a name and a role only.
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
        onError: (failure) => notify(failure.message, "error"),
      },
    );
  }
  return (
    <ViewFrame
      eyebrow="People & permissions"
      title="Staff access"
      description="Give each person only the counter, customer, campaign, analytics, or configuration actions their role needs."
      action={
        <Button
          icon={<UserPlus size={16} />}
          aria-expanded={composerOpen}
          aria-controls="staff-invite"
          onClick={() => setComposerOpen((open) => !open)}
        >
          Invite staff
        </Button>
      }
    >
      {composerOpen && (
        <section
          id="staff-invite"
          className="mb-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
        >
          <Eyebrow>New invitation</Eyebrow>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-xs font-bold">
              Name
              <input
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                placeholder="Who are you inviting?"
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent-strong)]"
              />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Email
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="Where should the invitation go?"
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent-strong)]"
              />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Role
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm"
              >
                {STAFF_ROLES.map(([role]) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Location
              <select
                value={inviteLocation}
                onChange={(event) => setInviteLocation(event.target.value)}
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm"
              >
                {locations.map((location) => (
                  <option key={location.id}>{location.name}</option>
                ))}
                <option>All locations</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted-strong)]">
            {STAFF_ROLES.find(([role]) => role === inviteRole)?.[1]}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button icon={<Send size={15} />} onClick={sendInvite}>
              Send invitation
            </Button>
            <Button tone="quiet" onClick={() => setComposerOpen(false)}>
              Cancel
            </Button>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[var(--muted)]">
            No email leaves the browser. The invited person would open{" "}
            <code className="font-mono">/accept-invite</code> to review the role
            before joining.
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
                <tr
                  key={person.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-[var(--surface-2)] text-[11px] font-extrabold">
                        {person.initials}
                      </span>
                      <span className="text-sm font-extrabold">{person.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Pill
                      tone={person.role === "Owner" ? "warning" : "neutral"}
                    >
                      {person.role}
                    </Pill>
                  </td>
                  <td className="px-4 py-4 text-xs">{person.location}</td>
                  <td className="px-4 py-4 text-xs text-[var(--muted)]">
                    {relativeTime(person.lastActiveAt)}
                  </td>
                  <td className="px-4 py-4">
                    <Pill
                      tone={person.status === "Active" ? "success" : "warning"}
                    >
                      {person.status}
                    </Pill>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      aria-label={`Edit ${person.name} access`}
                      onClick={() => setEditingStaff(person)}
                      className="grid size-9 place-items-center rounded-full hover:bg-[var(--surface-2)]"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STAFF_ROLES.map(([role, detail]) => (
          <article
            key={role}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
          >
            <p className="text-sm font-extrabold">{role}</p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
              {detail}
            </p>
          </article>
        ))}
      </div>
      {editingStaff && (
        <EditStaffDialog
          member={editingStaff}
          locations={locations}
          onClose={() => setEditingStaff(null)}
          notify={notify}
        />
      )}
    </ViewFrame>
  );
}
/** Preferences that write through `setSetting`, which previously had no
 *  callers at all. */
const BILLING_PREFERENCES = [
  [
    "autoTopUpSms",
    "Top up SMS credits automatically",
    "Buy 500 more whenever the balance drops under 200",
  ],
  [
    "invoiceEmails",
    "Email invoices to the owner",
    // Filled in from the profile at render; a module constant cannot know it.
    "",
  ],
] as const;
/**
 * Quiet hours and frequency caps.
 *
 * This protects the customer rather than the merchant, which is why it is on
 * every plan including the free one - and why leaving it unreachable meant a
 * bakery could message someone at 3am with nothing in the way.
 */
function MessagingPolicyCard({ notify }: { notify: Notify }) {
  const { data: policy } = useMessagingPolicy();
  const save = useSetMessagingPolicy();
  const [draft, setDraft] = useState<MessagingPolicy | null>(null);
  const shown = draft ?? policy;

  if (!shown) {
    return (
      <article className="h-64 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]" />
    );
  }

  const edit = (field: keyof MessagingPolicy, value: number) =>
    setDraft({ ...shown, [field]: value });

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex items-start gap-3">
        <ShieldCheck size={19} className="mt-0.5 text-[var(--accent-strong)]" />
        <div>
          <p className="text-sm font-extrabold">Messaging limits</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
            Nothing sends inside quiet hours, and nobody hears from you more
            often than these caps allow.
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {(
          [
            ["quietFromHour", "Quiet from", 23],
            ["quietToHour", "Quiet until", 23],
            ["maxPerDay", "Max per day", 50],
            ["maxPerWeek", "Max per week", 200],
          ] as const
        ).map(([field, label, max]) => (
          <label key={field} className="grid gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.11em] text-[var(--muted)]">
            {label}
            <input
              type="number"
              min={0}
              max={max}
              value={shown[field]}
              onChange={(event) => edit(field, Number(event.target.value))}
              className="min-h-10 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm font-bold text-[var(--ink)] outline-none focus:border-[var(--accent-strong)]"
            />
          </label>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-[var(--muted)]">
        Hours are 0-23 in {"your"} local time. A cap of zero means no cap.
      </p>
      <Button
        className="mt-5"
        disabled={!draft || save.isPending}
        onClick={() =>
          draft &&
          save.mutate(draft, {
            onSuccess: () => {
              setDraft(null);
              notify("Messaging limits saved.");
            },
            onError: (failure) => notify(failure.message, "review"),
          })
        }
      >
        {save.isPending ? "Saving…" : draft ? "Save limits" : "Saved"}
      </Button>
    </article>
  );
}

/**
 * The columns this shop keeps on a customer.
 *
 * A bakery tracks allergies, a salon tracks a preferred stylist. The create
 * endpoint existed with no screen behind it, so the set was frozen at
 * whatever the schema shipped with.
 */
function CustomFieldsCard({ notify }: { notify: Notify }) {
  const { data: fields = [] } = useCustomFields();
  const add = useAddCustomField();
  const [label, setLabel] = useState("");

  // The key is derived, not typed: it has to be an identifier, and asking a
  // merchant for one is asking them to debug a regex.
  const key = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^[^a-z]+/, "")
    .slice(0, 60);

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <p className="text-sm font-extrabold">Your own customer fields</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
        What this shop needs to remember about someone, beyond visits and
        spend. They appear on every customer record.
      </p>
      {fields.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {fields.map((field) => (
            <li
              key={field.key}
              className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-[10px] font-extrabold"
            >
              {field.label}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex gap-2">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Allergies"
          className="min-h-10 flex-1 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent-strong)]"
        />
        <Button
          tone="quiet"
          disabled={!key || add.isPending}
          onClick={() =>
            add.mutate(
              { key, label: label.trim() },
              {
                onSuccess: (field) => {
                  setLabel("");
                  notify(`${field.label} added to every customer record.`);
                },
                onError: (failure) => notify(failure.message, "error"),
              },
            )
          }
        >
          Add
        </Button>
      </div>
    </article>
  );
}

/**
 * Privileged actions waiting on a second pair of eyes.
 *
 * The API has the whole control - anyone may request, only settings:write
 * decides, and never their own request - and there was nowhere to decide.
 * Scale plan only, so a workspace below it gets an upgrade line rather than
 * an error.
 */
function ApprovalsCard({ notify }: { notify: Notify }) {
  const { data: approvals = [], error } = useApprovals();
  const decide = useDecideApproval();
  const pending = approvals.filter((request) => request.status === "pending");

  if (error) {
    return (
      <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <p className="text-sm font-extrabold">Four-eyes approvals</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
          {error instanceof ApiError && error.status === 402
            ? "On the Scale plan. Privileged actions wait for a second person before they happen."
            : error.message}
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <p className="text-sm font-extrabold">Four-eyes approvals</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
        {pending.length
          ? `${pending.length} waiting on a decision.`
          : "Nothing waiting. Privileged actions appear here before they happen."}
      </p>
      <ul className="mt-4 space-y-3">
        {pending.map((request) => (
          <li key={request.id} className="rounded-xl border border-[var(--line)] p-3">
            <p className="text-xs font-extrabold">{request.action}</p>
            <p className="mt-0.5 text-[10px] text-[var(--muted-strong)]">
              {request.target}
              {request.amountCentavos
                ? ` \u00b7 ${pesoFromCentavos(request.amountCentavos)}`
                : ""}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {([
                ["Reject", false],
                ["Approve", true],
              ] as const).map(([verb, approve]) => (
                <Button
                  key={verb}
                  tone={approve ? "accent" : "quiet"}
                  disabled={decide.isPending}
                  onClick={() =>
                    decide.mutate(
                      { id: request.id, approve },
                      {
                        onSuccess: () => notify(`${request.action} ${approve ? "approved" : "rejected"}.`),
                        // 403 here is the control working: the person who
                        // asked cannot be the person who decides.
                        onError: (failure) => notify(failure.message, "error"),
                      },
                    )
                  }
                >
                  {verb}
                </Button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

function SettingsView({ notify }: { notify: Notify }) {
  const { data: settings = {} } = useSettings();
  const setSetting = useSetSetting();
  const { data: integrations = [] } = useIntegrations();
  const { data: profile } = useBusinessProfile();
  const {
    data: billing,
    isPending: billingPending,
    error: billingError,
    refetch: refetchBilling,
  } = useBilling();
  const toggle = useToggleIntegration();
  const pay = useApiMutation<{ url: string }, string>(payInvoice, {
    invalidates: [keys.business.billing()],
  });
  const [changingPlan, setChangingPlan] = useState(false);

  const connected = useMemo(
    () =>
      Object.fromEntries(integrations.map((row) => [row.id, row.status === "Connected"])),
    [integrations],
  );

  // Every figure on this screen is a bill. There is no useful half of it to
  // draw, so it waits rather than showing zeroes that look like a free plan.
  if (!billing) {
    return (
      <ViewFrame
        eyebrow="Workspace settings"
        title="Channels & billing"
        description="Messaging providers, wallet passes, data controls, and the channel budget."
      >
        <QueryBoundary
          isPending={billingPending}
          error={billingError}
          onRetry={refetchBilling}
          label="billing"
          rows={5}
        >
          <p className="text-sm text-[var(--muted-strong)]">No billing record found.</p>
        </QueryBoundary>
      </ViewFrame>
    );
  }

  return (
    <ViewFrame
      eyebrow="Workspace settings"
      title="Channels & billing"
      description="Manage messaging providers, wallet passes, data controls, and the channel budget that protects your monthly spend. POS and API setup now lives in Integrations."
    >
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <Eyebrow>Channels & services</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">
              Connect the tools you already use
            </h2>
          </div>
          <div className="grid sm:grid-cols-2">
            {integrations
              .filter((integration) => integration.id !== "int_pos")
              .map((integration, index) => {
              const isConnected = connected[integration.id];
              // Planned integrations are blocked on an external approval, so the
              // switch stays inert rather than pretending it can be turned on.
              const isPlanned = integration.status === "Planned";
              return (
                <article
                  key={integration.id}
                  className={`p-5 ${index > 1 ? "border-t border-[var(--line)]" : ""} ${index % 2 === 1 ? "sm:border-l sm:border-[var(--line)]" : ""} ${index === 1 ? "border-t border-[var(--line)] sm:border-t-0" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-[var(--surface-2)]">
                      <PlugZap size={17} />
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-label={`Toggle ${integration.name}`}
                      aria-checked={isConnected}
                      disabled={isPlanned}
                      title={isPlanned ? "Not available yet" : undefined}
                      onClick={() =>
                        toggle.mutate(integration.id, {
                          onSuccess: (result) =>
                            notify(
                              `${integration.name} ${result.enabled ? "connected" : "disconnected"}.`,
                            ),
                          onError: (failure) => notify(failure.message, "error"),
                        })
                      }
                      className={`relative h-6 w-10 shrink-0 rounded-full before:absolute before:-inset-y-2.5 before:-inset-x-2 before:content-[''] ${isPlanned ? "cursor-not-allowed bg-[var(--line)] opacity-60" : isConnected ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
                    >
                      <span
                        className={`absolute top-1 size-4 rounded-full bg-white transition ${isConnected ? "left-5" : "left-1"}`}
                      />
                    </button>
                  </div>
                  <p className="mt-6 text-sm font-extrabold">{integration.name}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent-strong)]">
                    {integration.category}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted-strong)]">
                    {integration.detail}
                  </p>
                </article>
              );
              })}
          </div>
        </section>
        <aside className="space-y-3">
          <article className="rounded-2xl bg-[var(--ink)] p-6 text-[var(--paper)]">
            <div className="flex items-center justify-between">
              <Eyebrow>Current plan</Eyebrow>
              <Pill tone="success">Active</Pill>
            </div>
            <p className="mt-7 text-3xl font-extrabold">
              {billing.plan} · {peso(billing.monthlyCentavos)}
            </p>
            <p className="mt-1 text-xs text-white/55">
              {billing.cycle} billing{profile ? ` · renews ${longDate(profile.renewalOn)}` : ""}
            </p>
            <div className="mt-6 divide-y divide-white/12 border-y border-white/12">
              {billing.allowances.map((item) => {
                const pct = Math.min(100, Math.round((item.used / item.included) * 100));
                return (
                  <div key={item.label} className="py-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/55">{item.label}</span>
                      <strong>
                        {item.used.toLocaleString()} / {item.included.toLocaleString()}
                      </strong>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/12">
                      <div
                        className={`h-full rounded-full ${pct >= 90 ? "bg-[var(--danger)]" : "bg-[var(--accent)]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-white/55">
              Plus {billing.smsCreditBalance.toLocaleString()} prepaid SMS credits.
              Credits are bought separately from the monthly allowance and do not
              expire.
            </p>
            <Button
              tone="accent"
              className="mt-5"
              onClick={() => setChangingPlan(true)}
            >
              Manage plan
            </Button>
          </article>
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between">
              <Eyebrow>Billing</Eyebrow>
              <CreditCard size={18} className="text-[var(--accent-strong)]" />
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[var(--paper)] p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-2)]">
                <CreditCard size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">
                  {billing.method.brand} ending {billing.method.last4}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  Expires {billing.method.expiry} · next charge {longDate(billing.nextInvoiceOn)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => notify("Payment method editor opened.", "review")}
                className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--accent-strong)]"
              >
                Update
              </button>
            </div>
            <div className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {billing.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold">{invoice.period}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      Issued {longDate(invoice.issuedOn)}
                    </p>
                  </div>
                  <span className="text-xs font-bold">{peso(invoice.amountCentavos)}</span>
                  <Pill tone="success">{invoice.status}</Pill>
                  <button
                    type="button"
                    aria-label={
                      invoice.status === "Due"
                        ? `Pay the ${invoice.period} invoice`
                        : `The ${invoice.period} invoice is settled`
                    }
                    disabled={invoice.status !== "Due" || pay.isPending}
                    onClick={() =>
                      // A hosted payment page, so the merchant leaves to a
                      // provider rather than typing a card into this screen.
                      pay.mutate(invoice.id, {
                        onSuccess: ({ url }) => window.location.assign(url),
                        onError: (failure) => notify(failure.message, "error"),
                      })
                    }
                    className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-[var(--surface-2)]"
                  >
                    <Download size={15} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1">
              {BILLING_PREFERENCES.map(([key, label, detail]) => (
                <div key={key} className="flex items-start gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold">{label}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--muted)]">
                      {/* The invoice row names the recipient, which only the
                          profile knows. The constant leaves it blank. */}
                      {detail || (profile ? `Sent to ${profile.owner}` : "")}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(settings[key])}
                    aria-label={label}
                    disabled={setSetting.isPending}
                    onClick={() => {
                      const next = !settings[key];
                      setSetting.mutate(
                        { key, value: next },
                        {
                          onSuccess: () =>
                            notify(`${label} ${next ? "turned on" : "turned off"}.`),
                          onError: (failure) => notify(failure.message, "review"),
                        },
                      );
                    }}
                    className={`relative h-6 w-10 shrink-0 rounded-full ${settings[key] ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
                  >
                    <span
                      className={`absolute top-1 size-4 rounded-full bg-white transition ${settings[key] ? "left-5" : "left-1"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </article>
          <MessagingPolicyCard notify={notify} />
          <CustomFieldsCard notify={notify} />
          <ApprovalsCard notify={notify} />
        </aside>
      </div>
      {changingPlan && (
        <ChangePlanDialog
          current={billing.plan}
          onClose={() => setChangingPlan(false)}
          notify={notify}
        />
      )}
    </ViewFrame>
  );
}
export function BusinessViewContent({
  view,
  notify,
  onNavigate,
}: {
  view: BusinessView;
  notify: Notify;
  onNavigate: (view: BusinessView) => void;
}) {
  const views: Record<Exclude<BusinessView, "dashboard">, ReactNode> = {
    scan: <ScanView notify={notify} onNavigate={onNavigate} />,
    "join-code": <JoinCodeView notify={notify} />,
    customers: <CustomersView notify={notify} />,
    business: <BusinessProfileView notify={notify} />,
    programs: <ProgramsView notify={notify} />,
    "favorite-orders": (
      <FavoriteOrdersView notify={notify} onNavigate={onNavigate} />
    ),
    birthday: <BirthdayView notify={notify} />,
    redemptions: <RedemptionsView notify={notify} />,
    campaigns: <CampaignsView notify={notify} />,
    "message-log": <MessageLogView notify={notify} />,
    analytics: <AnalyticsView />,
    integrations: (
      <IntegrationsView notify={notify} onNavigate={onNavigate} />
    ),
    staff: <StaffView notify={notify} />,
    settings: <SettingsView notify={notify} />,
  };
  return view === "dashboard" ? null : views[view];
}
