"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PreviewBadge, QueryBoundary, Skeleton } from "@kypstamping/ui";
import {
  useBilling,
  useBusinessCustomers,
  useBusinessMetrics,
  useBranding,
  useBusinessProfile,
  useDiscountQuote,
  useGiftCard,
  useGiftCardEntries,
  useReferrals,
  useTransactions,
  useHeldPrograms,
  useStoreCredit,
  type BusinessLocation,
  type RedemptionResult,
  type VisitOutcome,
  useAudience,
  useAutomations,
  useCampaignAttribution,
  useCampaigns,
  useFavoriteOrders,
  useLocations,
  useMessages,
  usePrograms,
  useRedemptions,
  useCustomerBalance,
  lookupCustomer,
  idempotencyKey,
  isPreview,
  ApiError,
  keys,
  spendStoreCredit,
  useApiMutation,
  useQueryClient,
  type Allowance,
  EMPTY_BUSINESS_METRICS,
  type MessageRecord,
  type VisitResult,
} from "@kypstamping/api";
import { useCounterStore } from "@kypstamping/api/stores";
import {
  EditProfileDialog,
  EditLocationDialog,
  NewLocationDialog,
} from "@/components/WorkspaceForms";
import { useOfflineQueue, type SyncOutcome } from "@/components/useOfflineQueue";
import {
  useCreateCampaign,
  useRecordVisit,
  useCancelRedemption,
  useCreateCustomer,
  useRedeemCoupon,
  useRequestFeedback,
  useSendCampaignTest,
  useRedeemGiftCard,
  useCancelMembership,
  useRefundVisit,
  useClaimReferral,
  useTransferGiftCard,
  useUseBenefit,
  useUseMultipass,
  usePurchaseMultipass,
  useSubscribeMembership,
  useCommitRedemption,
  useReserveRedemption,
  useToggleAutomation,
  useVoidVisit,
} from "@/components/mutations";
import {
  brandColor,
  Button,
  Eyebrow,
  Pill,
  StampDots,
  ViewFrame,
} from "@kypstamping/ui";
import {
  daysUntilBirthday,
  longDate,
  formatMemberCode,
  looksLikeMemberCode,
  peso,
  pesoFromCentavos,
  relativeTime,
  timeOfDay,
} from "@kypstamping/ui/format";
import { PlanTag } from "@kypstamping/ui/shell";
import {
  Ban,
  BadgeCheck,
  BellRing,
  CakeSlice,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  Gift,
  HandCoins,
  Heart,
  Mail,
  MessageCircle,
  MessageSquareText,
  Pencil,
  Phone,
  PlugZap,
  Plus,
  QrCode,
  Search,
  Send,
  Route,
  ShieldCheck,
  Store,
  TicketCheck,
  Undo2,
  WifiOff,
} from "lucide-react";
import type { BusinessView } from "@/components/BusinessShell";
import { IntegrationsView } from "@/components/IntegrationsView";
import { overageRates, channelRates } from "@/lib/plans";
import { planFor, refusal, usePlanGate, writeBlock } from "@/lib/plan";
import {
  BlockedNote,
  NothingYet,
  initialsOf,
  useExport,
  type Notify,
} from "@/components/views/shared";
import { creditBalanceOf } from "@/components/views/StoreCreditView";
import { DiscoverPanel } from "@/components/views/DiscoverPanel";
import { AnalyticsView } from "@/components/views/AnalyticsView";
import { FeedbackView } from "@/components/views/FeedbackView";
import { BillingView } from "@/components/views/BillingView";
import { BonusWindowsView } from "@/components/views/BonusWindowsView";
import { CustomersView } from "@/components/views/CustomersView";
import { GiftsView } from "@/components/views/GiftsView";
import { JoinCodeView } from "@/components/views/JoinCodeView";
import { MissionsView } from "@/components/views/MissionsView";
import { ProgramsView } from "@/components/views/ProgramsView";
import { PromoCodesView } from "@/components/views/PromoCodesView";
import { SettingsView } from "@/components/views/SettingsView";
import { StaffView } from "@/components/views/StaffView";
import { StoreCreditView } from "@/components/views/StoreCreditView";
import { SukiTiersView } from "@/components/views/SukiTiersView";

/**
 * What the counter says after a stamp, once the API carries the outcome
 * fields. A refusal is worded as one and shown on screen as well as toasted.
 */
function outcomeMessage(visit: VisitResult & VisitOutcome): {
  heading: string;
  text: string;
  refused: boolean;
} {
  if (visit.earned === false) {
    const when = visit.nextStampAt
      ? ` Next stamp ${timeOfDay(visit.nextStampAt)}, ${longDate(visit.nextStampAt)}.`
      : "";
    return {
      heading: "No stamp this visit.",
      text: `${visit.reason ? `${visit.reason}.` : "The cooldown or minimum spend was not met."}${when} The visit is recorded.`,
      refused: true,
    };
  }
  if (visit.cardState === "closed") {
    return {
      heading: "This card is closed.",
      text: `${visit.customerName} keeps any held reward; nothing more can be earned on it.`,
      refused: true,
    };
  }
  if (visit.welcomeStampConfirmed) {
    return {
      heading: "Welcome stamp confirmed.",
      text: `${visit.customerName}'s card reads ${visit.stampsAfter}.`,
      refused: false,
    };
  }
  if (visit.completed) {
    return {
      heading: "Card completed.",
      text: visit.rewardEarned
        ? `${visit.rewardEarned.name} is held until ${visit.customerName} approves it on their phone.`
        : `${visit.customerName} has finished this card.`,
      refused: false,
    };
  }
  return {
    heading: visit.rewardEarned ? "Reward earned." : "Stamp added.",
    text: visit.rewardEarned
      ? `${visit.customerName} earned ${visit.rewardEarned.name}. It is held until they approve it on their phone.`
      : `${visit.customerName} now has ${visit.stampsAfter} of ${visit.target} stamps.`,
    refused: false,
  };
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
  customerName,
  amountCentavos,
  notify,
}: {
  customerId: string;
  customerName: string;
  amountCentavos: number;
  notify: Notify;
}) {
  const { data: programs = [] } = usePrograms();
  const live = (type: string) =>
    programs.find(
      (program) => program.type === type && program.status === "Live",
    );

  const coupon = useRedeemCoupon();
  const giftCard = useRedeemGiftCard();
  const pass = useUseMultipass();
  const benefit = useUseBenefit();
  const cancelMembership = useCancelMembership();
  const buyPass = usePurchaseMultipass();
  const subscribe = useSubscribeMembership();
  const { data: held = [] } = useHeldPrograms(customerId);
  const transfer = useTransferGiftCard();
  const claim = useClaimReferral();
  const { data: referrals = [] } = useReferrals();
  const [couponCode, setCouponCode] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  /**
   * The code a cashier asked about, not the one they are typing.
   *
   * Looking up on every keystroke would fire a request per character and 404
   * on all but the last, so the read waits to be asked for.
   */
  const [lookupCode, setLookupCode] = useState("");
  const { data: card, error: cardError } = useGiftCard(lookupCode);
  const { data: cardEntries = [] } = useGiftCardEntries(card ? lookupCode : "");

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
    live("Gift card") ||
    referrals.some((referral) => referral.status === "pending");
  if (!anything) return null;

  return (
    <div className="mt-5 space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <Eyebrow>Also on this counter</Eyebrow>

      {discount && quote && amountCentavos > 0 && (
        <p className="text-xs font-bold">
          {quote.tier ? `${quote.tier} tier: ` : ""}
          {(quote.rateBps / 100).toFixed(quote.rateBps % 100 ? 2 : 0)}% off
          &middot; member pays{" "}
          <span className="font-extrabold text-[var(--success)]">
            {pesoFromCentavos(quote.netCentavos)}
          </span>
        </p>
      )}

      {live("Coupon") && (
        <div className="flex gap-2">
          <input
            value={couponCode}
            onChange={(event) =>
              setCouponCode(event.target.value.toUpperCase())
            }
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
            disabled={
              !cardCode.trim() || amountCentavos <= 0 || giftCard.isPending
            }
            onClick={() =>
              giftCard.mutate(
                {
                  code: cardCode.trim(),
                  amountCentavos,
                  reason: "Paid at the counter",
                },
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
            {amountCentavos > 0
              ? `Pay ${pesoFromCentavos(amountCentavos)}`
              : "Enter an amount"}
          </Button>
          <Button
            tone="quiet"
            disabled={!cardCode.trim()}
            onClick={() => setLookupCode(cardCode.trim())}
          >
            Check
          </Button>
        </div>
      )}

      {/* What is actually on the card, before it is charged. The till used to
          take a code and a peso amount and find out from the error. */}
      {lookupCode && (cardError || card) && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
          {cardError ? (
            <p className="text-xs font-bold text-[var(--danger,var(--accent-strong))]">
              No gift card with code {lookupCode}.
            </p>
          ) : (
            card && (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-xs font-bold">
                    {card.code}
                  </span>
                  <span className="text-sm font-extrabold">
                    {pesoFromCentavos(card.balanceCentavos)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--muted-strong)]">
                  {card.issuedToName} &middot; {card.status}
                  {card.expiresOn
                    ? ` · expires ${longDate(card.expiresOn)}`
                    : ""}
                </p>
                {cardEntries.length > 0 && (
                  <ul className="mt-2 space-y-1 border-t border-[var(--line)] pt-2">
                    {cardEntries
                      .slice(-3)
                      .reverse()
                      .map((entry) => (
                        <li
                          key={entry.id}
                          className="flex justify-between gap-3 text-[11px]"
                        >
                          <span className="min-w-0 truncate text-[var(--muted-strong)]">
                            {entry.reason || entry.kind}
                          </span>
                          <span className="shrink-0 font-semibold">
                            {pesoFromCentavos(entry.amountCentavos)}
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
                {card.status === "active" &&
                  card.holderAccountId !== customerId && (
                    <Button
                      tone="quiet"
                      className="mt-3 w-full"
                      disabled={transfer.isPending}
                      onClick={() =>
                        transfer.mutate(
                          {
                            code: card.code,
                            toAccountId: customerId,
                            toName: customerName,
                          },
                          {
                            onSuccess: () =>
                              notify(
                                `Card ${card.code} is now ${customerName}'s.`,
                              ),
                            onError: (failure) =>
                              notify(failure.message, "error"),
                          },
                        )
                      }
                    >
                      Transfer to {customerName}
                    </Button>
                  )}
              </>
            )
          )}
        </div>
      )}

      {/* A friend arriving with somebody's code. Issuing one was wired and
          claiming one was not, so the second half of every referral was
          unreachable from the product. */}
      {referrals.some((referral) => referral.status === "pending") && (
        <div className="flex gap-2">
          <input
            value={referralCode}
            onChange={(event) =>
              setReferralCode(event.target.value.toUpperCase())
            }
            placeholder="Referral code"
            className="min-h-10 flex-1 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm font-mono outline-none focus:border-[var(--accent-strong)]"
          />
          <Button
            tone="quiet"
            disabled={!referralCode.trim() || claim.isPending}
            onClick={() =>
              claim.mutate(
                { code: referralCode.trim(), customerId },
                {
                  onSuccess: () => {
                    setReferralCode("");
                    notify(
                      "Referral claimed. Both sides pay on the qualifying visit.",
                    );
                  },
                  onError: (failure) => notify(failure.message, "error"),
                },
              )
            }
          >
            Claim
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
                        notify(
                          `Pass used. ${left.remaining} left on the bundle.`,
                        ),
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
                      onSuccess: (bought) =>
                        notify(`Bundle sold. ${bought.remaining} passes.`),
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
                    notify(
                      `Benefit used. ${left.remaining} of ${left.included} left.`,
                    ),
                  onError: (failure) => notify(failure.message, "error"),
                })
              }
            >
              Use a benefit
            </Button>
            {/* A member asking to stop asks the counter, not an app: the API
                wants a staff capability for this, so there was nowhere in the
                product it could be done. */}
            {item.status === "active" && (
              <Button
                tone="quiet"
                icon={<Ban size={14} />}
                disabled={cancelMembership.isPending}
                onClick={() =>
                  cancelMembership.mutate(item.subscriptionId, {
                    onSuccess: () => notify(`${item.programName} cancelled.`),
                    onError: (failure) => notify(failure.message, "error"),
                  })
                }
              >
                Cancel
              </Button>
            )}
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
  /** The API's answer, member code included - the till scans it next. */
  onAdded: (customer: { id: string; name: string; memberCode: string }) => void;
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
                ...(looksLikeEmail
                  ? { email: identifier }
                  : { mobile: identifier }),
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
  const { data: branding } = useBranding();
  const [held, setHeld] = useState<RedemptionResult | null>(null);
  // Polled while the customer is approving on their phone, so the counter
  // learns the moment it may hand over - and only until the ledger row says
  // they have. Keyed on `held` alone it polled for ever, because this tab's
  // copy of the reservation never leaves "awaiting_customer".
  const { data: redemptions = [] } = useRedemptions({
    refetchInterval: (query) => {
      if (!held) return false;
      const row = query.state.data?.find((entry) => entry.id === held.id);
      return !row || row.status === "Awaiting customer" ? 4000 : false;
    },
  });
  // The header named the demo fixture's branch, which is not this shop's.
  const { data: locations = [] } = useLocations();
  const { scanned, amount, idempotencyReference, scan, setAmount, reset } =
    useCounterStore();
  const record = useRecordVisit();

  /**
   * Which shop this till is standing in.
   *
   * The counter never asked and never sent one, so every sale and every
   * handover rung up through the product recorded a blank branch - on a
   * product whose paid tiers sell per-branch reporting. A till does not move
   * between shops, so it is remembered on the device rather than asked once
   * per sale, and it defaults to the shop's first branch.
   */
  const [tillBranch, setTillBranch] = useState("");
  useEffect(() => {
    if (tillBranch || locations.length === 0) return;
    let stored = "";
    try {
      stored = window.localStorage.getItem(TILL_BRANCH_KEY) ?? "";
    } catch {
      stored = "";
    }
    const known = locations.some((branch) => branch.id === stored);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTillBranch(known ? stored : locations[0].id);
  }, [locations, tillBranch]);

  function chooseTillBranch(id: string) {
    setTillBranch(id);
    try {
      window.localStorage.setItem(TILL_BRANCH_KEY, id);
    } catch {
      // A locked-down browser. The branch still applies for this session.
    }
  }

  const [identifier, setIdentifier] = useState("");
  const [notFound, setNotFound] = useState("");
  const [newName, setNewName] = useState("");
  const [looking, setLooking] = useState(false);
  const [done, setDone] = useState<VisitResult | null>(null);
  // A refusal stays on the screen, not only in the toast: the cashier reads
  // the page, and the toast may already have gone.
  const [refusalText, setRefusalText] = useState("");
  const gate = usePlanGate();
  const creditPlan = planFor("Store credit");
  const feedbackPlan = planFor("Private feedback and review requests");
  const { data: creditEntries = [] } = useStoreCredit(scanned?.id, {
    enabled: Boolean(scanned),
  });
  const creditBalance = scanned
    ? creditBalanceOf(creditEntries, scanned.id)
    : 0;
  const creditBlocked = writeBlock(gate, creditPlan, isPreview(creditEntries));
  const spendCredit = useApiMutation(
    ({ amountCentavos, key }: { amountCentavos: number; key: string }) =>
      spendStoreCredit({ customerId: scanned?.id ?? "", amountCentavos }, key),
    { invalidates: [keys.levers.all] },
  );
  const undo = useVoidVisit();
  const askFeedback = useRequestFeedback();
  const queryClient = useQueryClient();
  const { queue, online, enqueue } = useOfflineQueue(
    useCallback(
      ({ settled, refused }: SyncOutcome) => {
        if (refused.length > 0) {
          notify(
            `${settled} held ${settled === 1 ? "sale" : "sales"} synced. Needs a look: ${refused.join("; ")}`,
            "error",
          );
        } else {
          notify(`${settled} held ${settled === 1 ? "stamp" : "stamps"} synced.`);
        }
        void queryClient.invalidateQueries({ queryKey: keys.business.all });
      },
      [notify, queryClient],
    ),
  );
  const reserve = useReserveRedemption();
  const handOver = useCommitRedemption();
  const giveBack = useCancelRedemption();
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
  // Either this tab's hold, or one the server already knows about - reserved
  // by a colleague on the other till, or by this one before it was reloaded.
  // Held only in React state, a refresh mid-handover showed a full card with
  // no reward and no way to finish it.
  const activeHold =
    held ??
    (balance?.heldRedemptionId
      ? { id: balance.heldRedemptionId, rewardName: balance.heldRewardName }
      : null);
  // The customer approves on their phone before staff may hand over. The
  // ledger row is the truth once it is loaded; this tab's own copy of the
  // reservation only until then. Read the other way round, the counter kept
  // waiting after the customer had approved and "Handed over" never appeared.
  const heldRow = redemptions.find((row) => row.id === activeHold?.id);
  const awaiting = heldRow
    ? heldRow.status === "Awaiting customer"
    : held?.status === "awaiting_customer";

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
    setRefusalText("");
    try {
      const found = await lookupCustomer(
        typed.includes("@")
          ? { email: typed }
          : looksLikeMemberCode(typed)
            ? { memberCode: typed }
            : { phone: typed },
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
      const text =
        failure instanceof ApiError
          ? failure.message
          : "Could not look that up.";
      setRefusalText(text);
      notify(text, "error");
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
        branchId: tillBranch || undefined,
      });
      notify(`Held for ${scanned.name}. It will sync when the signal is back.`);
      startOver();
      return;
    }

    record.mutate(
      {
        customerId: scanned.id,
        // Which shop rang it up. Blank on every counter sale until now, which
        // left branch reporting with nothing to report on.
        branchId: tillBranch || undefined,
        // Centavos on the wire, always. The cashier types pesos.
        amountCentavos,
        // Stable until this visit settles, so a cashier who presses again
        // after a timeout replays the first one rather than stamping twice.
        idempotencyKey: idempotencyKey("visit", idempotencyReference),
      },
      {
        onSuccess: (visit) => {
          setDone(visit);
          const outcome = outcomeMessage(visit);
          notify(
            `${outcome.heading} ${outcome.text}`,
            outcome.refused ? "error" : "info",
          );
        },
        onError: (failure) => {
          // A cooldown or a closed card is a 409 with the reason in it.
          setRefusalText(failure.message);
          notify(failure.message, "error");
        },
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
    setRefusalText("");
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
        <Pill
          tone={online ? (queue.length ? "warning" : "success") : "warning"}
        >
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
          <Eyebrow>Secure scanner</Eyebrow>

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
                  <span className="text-[10px] font-semibold text-white/55">
                    A hardware scanner types here and presses Enter.
                  </span>
                </label>
                <Button
                  type="submit"
                  tone="accent"
                  className="mt-4 w-full"
                  disabled={looking}
                >
                  {looking ? "Looking up\u2026" : "Find customer"}
                </Button>
              </form>
              {refusalText && !notFound && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-[var(--danger)] bg-[rgb(178_59_43/12%)] p-3 text-xs font-bold text-[var(--paper)]"
                >
                  {refusalText}
                </p>
              )}
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
                      memberCode: created.memberCode,
                      isMember: true,
                    });
                  }}
                  notify={notify}
                />
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
                      {formatMemberCode(scanned.memberCode)}
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
                      <p className="mt-1 font-extrabold">
                        {balance.programName}
                      </p>
                      <div className="mt-4 overflow-x-auto">
                        <StampDots
                          filled={balance.balance}
                          total={balance.target}
                          icon={branding?.stampIcon}
                          imageUrl={branding?.stampImageUrl}
                        />
                      </div>
                      {balance.rewardsAvailable > 0 && !activeHold && (
                        <>
                          <p className="mt-3 text-xs font-extrabold text-[var(--success)]">
                            {balance.rewardsAvailable} reward
                            {balance.rewardsAvailable === 1 ? "" : "s"} ready to
                            redeem
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
                                  // The shop that actually handed it over.
                                  branchId: tillBranch || undefined,
                                  idempotencyKey: idempotencyKey(
                                    "redeem",
                                    `${scanned.id}_${idempotencyReference}_${redeemAttempt}`,
                                  ),
                                },
                                {
                                  onSuccess: setHeld,
                                  onError: (failure) =>
                                    notify(failure.message, "error"),
                                },
                              )
                            }
                          >
                            {reserve.isPending ? "Holding…" : "Redeem a reward"}
                          </Button>
                        </>
                      )}
                      {activeHold && (
                        /* Reserved, not spent. The balance only moves when the
                           cashier confirms the customer actually has it. */
                        <div className="mt-3 rounded-xl border border-[var(--success)] bg-[rgb(15_118_85/8%)] p-3">
                          <p className="text-xs font-extrabold text-[var(--success)]">
                            {awaiting
                              ? `${activeHold.rewardName} is on hold. Awaiting the customer's approval on their phone.`
                              : `${activeHold.rewardName} is on hold. Hand it over, then confirm.`}
                          </p>
                          {awaiting && (
                            <p
                              className="mt-2 text-[11px] font-bold text-[var(--muted-strong)]"
                              role="status"
                            >
                              Waiting… the card updates the moment they approve.
                              Nothing is spent yet.
                            </p>
                          )}
                          <div
                            className={`mt-3 grid gap-2 ${awaiting ? "grid-cols-1" : "grid-cols-2"}`}
                          >
                            <Button
                              tone="quiet"
                              disabled={
                                giveBack.isPending || handOver.isPending
                              }
                              onClick={() =>
                                giveBack.mutate(activeHold.id, {
                                  onSuccess: () => {
                                    setHeld(null);
                                    setRedeemAttempt((n) => n + 1);
                                    notify(
                                      "Reward put back. Nothing was spent.",
                                    );
                                  },
                                  onError: (failure) =>
                                    notify(failure.message, "error"),
                                })
                              }
                            >
                              Put it back
                            </Button>
                            {!awaiting && (
                              <Button
                                disabled={
                                  handOver.isPending || giveBack.isPending
                                }
                                onClick={() =>
                                  handOver.mutate(
                                    {
                                      id: activeHold.id,
                                      idempotencyKey: idempotencyKey(
                                        "commit",
                                        activeHold.id,
                                      ),
                                    },
                                    {
                                      onSuccess: (committed) => {
                                        setHeld(null);
                                        setRedeemAttempt((n) => n + 1);
                                        notify(
                                          `${committed.rewardName} redeemed.`,
                                        );
                                      },
                                      onError: (failure) =>
                                        notify(failure.message, "error"),
                                    },
                                  )
                                }
                              >
                                {handOver.isPending
                                  ? "Confirming…"
                                  : "Handed over"}
                              </Button>
                            )}
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
                  customerName={scanned.name}
                  amountCentavos={
                    Number.isFinite(Number.parseFloat(amount))
                      ? Math.round(Number.parseFloat(amount) * 100)
                      : 0
                  }
                  notify={notify}
                />

                {creditBalance > 0 && (
                  <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Eyebrow>Store credit</Eyebrow>
                      <span className="flex items-center gap-2">
                        {isPreview(creditEntries) && <PreviewBadge />}
                        <PlanTag
                          plan={creditPlan}
                          included={gate.covers(creditPlan)}
                        />
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-extrabold">
                      {pesoFromCentavos(creditBalance)} on {scanned.name}
                      &rsquo;s account
                    </p>
                    {(() => {
                      const typedCentavos = Number.isFinite(
                        Number.parseFloat(amount),
                      )
                        ? Math.round(Number.parseFloat(amount) * 100)
                        : 0;
                      const spend = Math.min(creditBalance, typedCentavos);
                      return (
                        <Button
                          tone="quiet"
                          className="mt-3 w-full"
                          icon={<HandCoins size={14} />}
                          disabled={
                            Boolean(creditBlocked) ||
                            spend <= 0 ||
                            spendCredit.isPending
                          }
                          title={creditBlocked ?? undefined}
                          onClick={() =>
                            spendCredit.mutate(
                              {
                                amountCentavos: spend,
                                key: idempotencyKey(
                                  "credit-spend",
                                  `${scanned.id}_${idempotencyReference}`,
                                ),
                              },
                              {
                                onSuccess: (entry) =>
                                  notify(
                                    `${pesoFromCentavos(spend)} paid from credit. ${pesoFromCentavos(entry.balanceAfterCentavos)} left.`,
                                  ),
                                onError: (failure) =>
                                  notify(refusal(failure, creditPlan), "error"),
                              },
                            )
                          }
                        >
                          {spend > 0
                            ? `Pay ${pesoFromCentavos(spend)} from credit`
                            : "Enter an amount to pay from credit"}
                        </Button>
                      );
                    })()}
                    <BlockedNote reason={creditBlocked} />
                  </div>
                )}

                {refusalText && (
                  <p
                    role="alert"
                    className="mt-5 rounded-xl border border-[var(--danger)] bg-[rgb(178_59_43/8%)] p-3 text-xs font-bold text-[var(--danger)]"
                  >
                    {refusalText}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button
                    tone="quiet"
                    onClick={startOver}
                    disabled={record.isPending}
                  >
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
                {(() => {
                  const outcome = outcomeMessage(done);
                  return (
                    <>
                      <span
                        className={`mx-auto grid size-20 place-items-center rounded-full ${outcome.refused ? "bg-[var(--accent)] text-[var(--ink)]" : "bg-[var(--success)]"}`}
                      >
                        {outcome.refused ? (
                          <Ban size={36} strokeWidth={3} />
                        ) : (
                          <Check size={36} strokeWidth={3} />
                        )}
                      </span>
                      <h2 className="mt-6 text-3xl font-extrabold tracking-[-0.02em]">
                        {outcome.heading}
                      </h2>
                      <p
                        role={outcome.refused ? "alert" : undefined}
                        className="mx-auto mt-3 max-w-[36ch] text-sm leading-relaxed text-white/65"
                      >
                        {outcome.text}
                        {done.amountCentavos
                          ? ` Recorded with a ${pesoFromCentavos(done.amountCentavos)} purchase.`
                          : ""}
                      </p>
                    </>
                  );
                })()}
                <p className="mt-4 font-mono text-[10px] text-white/55">
                  {done.id}
                </p>
                <Button tone="accent" className="mt-7" onClick={startOver}>
                  Scan the next customer
                </Button>
                {/* Hidden rather than disabled below Grow, which is the one
                    place this app breaks its own rule of showing every
                    feature. A feature screen can afford to advertise the tier
                    it needs; the counter cannot. This sits between "scan the
                    next customer" and the undo, in front of a queue, and a
                    free shop pressing it only ever got "Feedback needs the
                    Grow plan or above" - an upsell in the way of the till. */}
                {gate.covers(feedbackPlan) && (
                  <button
                    type="button"
                    disabled={askFeedback.isPending}
                    onClick={() =>
                      askFeedback.mutate(
                        { customerId: done.customerId },
                        {
                          onSuccess: () =>
                            notify(`Asked ${done.customerName} how it went.`),
                          onError: (failure) =>
                            notify(failure.message, "error"),
                        },
                      )
                    }
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/20 text-xs font-extrabold text-white/70 transition hover:bg-white/5 disabled:opacity-50"
                  >
                    <MessageCircle size={14} />
                    {askFeedback.isPending ? "Sending…" : "Ask how it went"}
                  </button>
                )}
                {/* Right here, because this is where a wrong scan is
                    noticed - one customer back, before the queue moves on. */}
                <button
                  type="button"
                  disabled={undo.isPending}
                  onClick={() =>
                    undo.mutate(
                      {
                        id: done.id,
                        idempotencyKey: idempotencyKey("void", done.id),
                      },
                      {
                        onSuccess: () => {
                          notify(`Stamp reversed for ${done.customerName}.`);
                          startOver();
                        },
                        onError: (failure) => notify(failure.message, "error"),
                      },
                    )
                  }
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 text-xs font-extrabold text-white/55 transition hover:text-white disabled:opacity-50"
                >
                  <Undo2 size={14} />{" "}
                  {undo.isPending
                    ? "Reversing…"
                    : "That was a mistake, undo it"}
                </button>
              </div>
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <Eyebrow>Recent counter activity</Eyebrow>
              {/* Named locations[0] whatever branch the till was standing in,
                  so a Manila counter filed its own sales under "Today at
                  BGC". It is the picker now, and what it says is what every
                  sale below is recorded against. */}
              {locations.length > 1 ? (
                <label className="mt-1 flex items-center gap-2 text-lg font-extrabold">
                  <span className="sr-only">This till is at</span>
                  <select
                    value={tillBranch}
                    onChange={(event) => chooseTillBranch(event.target.value)}
                    className="rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-2 py-1 text-lg font-extrabold outline-none focus:border-[var(--accent-strong)]"
                  >
                    {locations.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <h2 className="mt-1 text-lg font-extrabold">
                  {locations[0]
                    ? `Today at ${locations[0].name}`
                    : "Today at the counter"}
                </h2>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigate("redemptions")}
              className="text-xs font-bold text-[var(--accent-strong)]"
            >
              View ledger
            </button>
          </div>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {redemptions.length === 0 && (
              <NothingYet>
                No rewards handed over here yet. Stamps show on the dashboard;
                this list fills the first time somebody redeems one.
              </NothingYet>
            )}
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
        </section>
      </div>
    </ViewFrame>
  );
}
/**
 * Where a printed poster points: the wallet, not the marketing site.
 *
 * The promise is that the stamp appears on scan. Landing on a marketing page
 * with a "continue to join" button is the interstitial this whole flow
 * exists to remove.
 */
/** The branch this till is standing in, remembered per device. */
const TILL_BRANCH_KEY = "kypstamping-till-branch";
function BusinessProfileView({ notify }: { notify: Notify }) {
  const gate = usePlanGate();
  const brandingPlan = planFor("Your own branding on the card");
  const { data: locations = [] } = useLocations();
  const { data: profile, isPending, error, refetch } = useBusinessProfile();
  const { data: branding } = useBranding();
  const [editingLocation, setEditingLocation] =
    useState<BusinessLocation | null>(null);
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
          <p className="text-sm text-[var(--muted-strong)]">
            No profile found.
          </p>
        </QueryBoundary>
      </ViewFrame>
    );
  }

  return (
    <ViewFrame
      eyebrow="Business profile"
      title="Locations & identity"
      description="Profile, branches (unlimited, never charged for), hours and neighborhood as Discover shows them, and your own branding on the card from Core."
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
              <span className="text-xs font-semibold text-white/55">
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
              {/* Shown here so the picker in the dialog has somewhere to land:
                the token is stored and editable, and the wallet card that
                will paint with it is still on one fixed dark ground. */}
              <div className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-white/55">
                  Card colour{" "}
                  <PlanTag
                    plan={brandingPlan}
                    included={gate.covers(brandingPlan)}
                  />
                </span>
                <span className="flex items-center gap-2 font-bold">
                  {brandColor(branding?.color ?? "ink").label}
                  <span
                    aria-hidden="true"
                    className="size-4 rounded-full border border-white/25"
                    style={{
                      background: brandColor(branding?.color ?? "ink")
                        .background,
                    }}
                  />
                </span>
              </div>
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
                  member{location.members === 1 ? "" : "s"}
                  {location.hours.length
                    ? ` · ${location.hours.map((hours) => `${hours.days} ${hours.time}`).join(", ")}`
                    : " · hours not set"}
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
      <DiscoverPanel notify={notify} />
      {addingLocation && (
        <NewLocationDialog
          onClose={() => setAddingLocation(false)}
          notify={notify}
        />
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
            {favoriteOrders.length === 0 && (
              <NothingYet>
                Nothing to rank yet. This fills once orders arrive from a
                connected POS or an import.
              </NothingYet>
            )}
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
                  Audience · {top.regulars} customer
                  {top.regulars === 1 ? "" : "s"}
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
  // The journey is a paid lever, and this screen alone offered its primary
  // action ungated - every sibling shows what it needs. Its editor was also
  // prefilled with another merchant's copy: "Visit any Sweet Crumbs branch
  // this week and choose a pastry on us", one press away from sending a
  // competitor's name to this shop's customers.
  const gate = usePlanGate();
  const needed = planFor("Birthday and anniversary journeys");
  const blocked = writeBlock(gate, needed, false);
  // The pill asserted "Automation live" whatever the automation was actually
  // doing, and "Save journey" reported "Birthday journey saved with channel
  // guardrails" while saving nothing at all - this screen has no editable
  // state to save. The automation behind it is real and already toggleable,
  // so the button switches that instead of announcing a fiction.
  const { data: automationRows = [] } = useAutomations();
  const birthday = automationRows.find((row) => row.id === "auto_birthday");
  const live = birthday?.status === "Live";
  const toggle = useToggleAutomation();
  // Was a literal list of three dates under a "next 30 days" heading, so it
  // was only ever correct on the day it was written.
  const upcoming = customers
    .map((customer) => ({
      customer,
      inDays: daysUntilBirthday(customer.birthday),
    }))
    .filter(
      (entry): entry is { customer: typeof entry.customer; inDays: number } =>
        entry.inDays !== null && entry.inDays <= 30,
    )
    .sort((a, b) => a.inDays - b.inDays);
  return (
    <ViewFrame
      eyebrow="Birthday moments"
      title="Birthday offers"
      description="Build one thoughtful birthday journey with explicit eligibility, a budget ceiling, and channel-specific consent."
      action={
        <Pill tone={live ? "success" : "warning"}>
          {birthday
            ? live
              ? "Automation live"
              : "Automation paused"
            : "No automation yet"}
        </Pill>
      }
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
                      {inDays === 0
                        ? "today"
                        : `in ${inDays} day${inDays === 1 ? "" : "s"}`}{" "}
                      · {customer.favorite}
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
          {/* Timing, reward, message and channel pickers stood here and none
              of them was saved. The automation is the real thing; this
              switches it. */}
          <Eyebrow>Birthday journey</Eyebrow>
          <p className="mt-4 text-sm leading-relaxed text-white/75">
            Sends an email at 9 in the morning on the birthday, to members who gave one.
          </p>
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
            title={blocked ?? undefined}
            disabled={!birthday || toggle.isPending || Boolean(blocked)}
            onClick={() =>
              birthday &&
              toggle.mutate(birthday.id, {
                onSuccess: (result) =>
                  notify(
                    result.enabled
                      ? "Birthday journey is live. It emails members at 9 in the morning on the day."
                      : "Birthday journey paused. Nothing will send until you switch it back on.",
                  ),
                onError: (failure) => notify(failure.message, "error"),
              })
            }
          >
            {toggle.isPending
              ? "Saving…"
              : live
                ? "Pause this journey"
                : "Switch this journey on"}
          </Button>
          <div className="mt-3">
            <BlockedNote reason={blocked} />
          </div>
        </section>
      </div>
    </ViewFrame>
  );
}
function RedemptionsView({ notify }: { notify: Notify }) {
  const { runExport, busy: exporting } = useExport(notify);
  const { data: redemptions = [] } = useRedemptions();
  const { data: programs = [] } = usePrograms();
  const commit = useCommitRedemption();
  const cancel = useCancelRedemption();
  // These were three hardcoded figures, one of which quoted the stamp-card
  // liability under a "reward value" label. All three now say what they count.
  const approved = redemptions.filter((item) => item.status === "Approved");
  const reversals = redemptions.length - approved.length;
  const rewardValue = approved.reduce(
    (sum, item) => sum + item.valueCentavos,
    0,
  );
  const approvalRate = redemptions.length
    ? (approved.length / redemptions.length) * 100
    : null;
  const stampLiability =
    programs.find((program) => program.type === "Stamps")?.liabilityCentavos ??
    0;
  return (
    <ViewFrame
      eyebrow="Value ledger"
      title="Redemptions"
      description="Every reward event, with its value, status and reversal path. Branch and approver are shown where the sale recorded them."
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
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody>
              {redemptions.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <NothingYet>
                      Nothing redeemed yet. A reward appears here the moment a
                      customer approves handing it over at the counter.
                    </NothingYet>
                  </td>
                </tr>
              )}
              {redemptions.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  <td className="px-5 py-4 text-sm font-extrabold">
                    {item.customer}
                  </td>
                  <td className="px-4 py-4 text-sm">{item.reward}</td>
                  {/* Empty cells read as a broken table under headers that
                      promise a value. Analytics already calls the same case
                      Unattributed. */}
                  <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                    {item.branch || "—"}
                  </td>
                  <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                    {item.staff || "Unattributed"}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold">
                    {item.valueCentavos
                      ? pesoFromCentavos(item.valueCentavos)
                      : "—"}
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
                  {/* A reservation staff cannot resolve is a reward nobody can
                      hand over and nobody can put back. The counter offers
                      these two buttons on the screen where the reward was
                      reserved, and loses them the moment anything else is
                      served - so the row sat here reading RESERVED with no
                      action column at all, and only a raw API call could
                      move it. */}
                  <td className="px-4 py-4">
                    {item.status === "Awaiting customer" && (
                      <span className="flex flex-wrap items-center gap-2">
                        <Pill tone="warning">Waiting…</Pill>
                        <span className="text-[11px] font-bold text-[var(--muted-strong)]">
                          Awaiting the customer&rsquo;s approval on their phone
                        </span>
                        <Button
                          tone="quiet"
                          disabled={commit.isPending || cancel.isPending}
                          onClick={() =>
                            cancel.mutate(item.id, {
                              onSuccess: () =>
                                notify(
                                  `Put ${item.reward} back on ${item.customer}'s card.`,
                                ),
                              onError: (failure) =>
                                notify(refusal(failure), "error"),
                            })
                          }
                        >
                          Put it back
                        </Button>
                      </span>
                    )}
                    {item.status === "Reserved" && (
                      <span className="flex flex-wrap gap-2">
                        <Button
                          tone="quiet"
                          disabled={commit.isPending || cancel.isPending}
                          onClick={() =>
                            commit.mutate(
                              {
                                id: item.id,
                                idempotencyKey: idempotencyKey(
                                  "commit",
                                  item.id,
                                ),
                              },
                              {
                                onSuccess: () =>
                                  notify(
                                    `Handed ${item.reward} to ${item.customer}.`,
                                  ),
                                onError: (failure) =>
                                  notify(failure.message, "error"),
                              },
                            )
                          }
                        >
                          Handed over
                        </Button>
                        <Button
                          tone="quiet"
                          disabled={commit.isPending || cancel.isPending}
                          onClick={() =>
                            cancel.mutate(item.id, {
                              onSuccess: () =>
                                notify(
                                  `Put ${item.reward} back on ${item.customer}'s card.`,
                                ),
                              onError: (failure) =>
                                notify(failure.message, "error"),
                            })
                          }
                        >
                          Put it back
                        </Button>
                      </span>
                    )}
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
            // peso() takes pesos; these are centavos. Both tiles read 100x
            // high - a ledger of 900 pesos announced itself as 90,000.
            pesoFromCentavos(rewardValue),
            `${approved.length} approved redemption${approved.length === 1 ? "" : "s"}`,
          ],
          [
            "Approval rate",
            approvalRate === null ? "--" : `${approvalRate.toFixed(1)}%`,
            `${reversals} reversal${reversals === 1 ? "" : "s"}`,
          ],
          [
            "Outstanding stamp-card liability",
            pesoFromCentavos(stampLiability),
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
      <SalesLedger notify={notify} />
    </ViewFrame>
  );
}

/**
 * Recorded sales, and the only place a settled one can be given back.
 *
 * The counter can void the stamp it has just taken; an hour later that path
 * is gone, and `POST /transactions/{id}/refund` could only be reached by a
 * POS holding a machine credential. This is the screen that names a
 * transaction, so a merchant can too.
 */
function SalesLedger({ notify }: { notify: Notify }) {
  const {
    data: transactions = [],
    isPending,
    error,
    refetch,
  } = useTransactions();
  const refund = useRefundVisit();

  return (
    <section className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
        <Eyebrow>Recorded sales</Eyebrow>
        <span className="text-xs text-[var(--muted-strong)]">
          A settled sale can be refunded; a reversed one keeps its row.
        </span>
      </div>
      <QueryBoundary
        isPending={isPending}
        error={error}
        onRetry={refetch}
        label="the sales ledger"
        rows={3}
      >
        {transactions.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[var(--muted-strong)]">
            No sales recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-4 py-4">Location</th>
                  <th className="px-4 py-4">Taken by</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Time</th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-5 py-4 text-sm font-extrabold">
                      {item.customer}
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                      {item.branch}
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                      {item.staff || "Unattributed"}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">
                      {item.amountCentavos
                        ? pesoFromCentavos(item.amountCentavos)
                        : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <Pill
                        tone={
                          item.status === "recorded" ? "success" : "warning"
                        }
                      >
                        {item.status}
                      </Pill>
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--muted)]">
                      {relativeTime(item.occurredAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {item.status === "recorded" && (
                        <Button
                          tone="quiet"
                          icon={<Undo2 size={14} />}
                          disabled={refund.isPending}
                          onClick={() =>
                            refund.mutate(
                              {
                                id: item.id,
                                // Stable per transaction: a second tap on a
                                // slow connection replays the first refund
                                // rather than taking the money back twice.
                                idempotencyKey: idempotencyKey(
                                  "refund",
                                  item.id,
                                ),
                              },
                              {
                                onSuccess: () =>
                                  notify(`Refunded ${item.customer}'s sale.`),
                                onError: (failure) =>
                                  notify(failure.message, "error"),
                              },
                            )
                          }
                        >
                          Refund
                        </Button>
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
  );
}

/** Default spend ceilings, editable per campaign. Pesos. */
const DEFAULT_CAMPAIGN_CEILING = 1000;
const DEFAULT_MONTHLY_CEILING = 5000;
/** `"From ₱0.42 per message"` → 0.42, from plans.ts. */
const messagingAppRate = Number(
  /₱([\d.]+)/.exec(
    channelRates.find((row) => row.channel === "Messaging apps")?.overage ?? "",
  )?.[1] ?? 0,
);
/**
 * What is left of this month's plan allowance, per channel.
 *
 * Email was billed at the overage rate from the first message while its own
 * label read "Uses allowance". A channel with allowance left costs nothing
 * until that allowance runs out.
 */
const allowanceRemainingFrom = (
  allowances: Allowance[],
): Record<string, number> =>
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
type ChannelStatus = "ready" | "connecting";
/**
 * The channels, their prices, and how each maps to what the API can count.
 *
 * `eligible` used to live here as a constant per channel - 1,280 in-app,
 * 1,120 push, 1,060 email - so a workspace with no customers at all was shown
 * an audience of 1,280, given a cost and a predicted-visits figure derived
 * from it, and allowed to schedule the send. Reach is measured now.
 *
 * `status` must agree with what `CampaignCreate` accepts on the API. A
 * channel marked ready that the API refuses is a 422 the merchant only sees
 * after composing the whole campaign - which is what Viber and Email did.
 * Email is gone entirely: our relay is transactional and its terms forbid
 * marketing on the account that carries every sign-in code.
 */
const channelConfig: {
  name: string;
  icon: typeof BellRing;
  /** Key in GET /business/audience, or null where nothing can send yet. */
  audienceKey: string | null;
  unit: number;
  note: string;
  status: ChannelStatus;
  /** The tier that carries this channel; every plan when absent. */
  plan?: "Core" | "Grow" | "Scale";
}[] = [
  {
    name: "In-app",
    audienceKey: "in-app",
    icon: MessageSquareText,
    unit: 0,
    note: "Included on every plan",
    status: "ready",
  },
  {
    name: "Push",
    audienceKey: "push",
    icon: BellRing,
    unit: 0,
    note: "Allowance on every plan · web push to the wallet, push notification to the app, where the customer turned it on",
    status: "ready",
  },
  {
    name: "SMS",
    audienceKey: "sms",
    icon: Phone,
    unit: overageRates.smsPerSegment,
    note: `₱${overageRates.smsPerSegment.toFixed(2)} / segment, from your credits`,
    status: "ready",
  },
  {
    // A paid-tier channel. The API refuses it until a campaign sender
    // separate from the transactional one exists; that refusal is shown.
    name: "Email",
    audienceKey: "email",
    icon: Mail,
    unit: 0,
    note: "Monthly allowance on the paid tiers",
    status: "ready",
    plan: "Core",
  },
  {
    name: "Viber",
    audienceKey: null,
    icon: MessageCircle,
    unit: messagingAppRate,
    note: "Connecting",
    status: "connecting",
  },
  {
    name: "WhatsApp",
    audienceKey: null,
    icon: Send,
    unit: messagingAppRate,
    note: "Connecting",
    status: "connecting",
  },
];
function CampaignsView({ notify }: { notify: Notify }) {
  const gate = usePlanGate();
  const testSend = useSendCampaignTest();
  const [campaignCeiling, setCampaignCeiling] = useState(
    String(DEFAULT_CAMPAIGN_CEILING),
  );
  const [monthlyCeiling, setMonthlyCeiling] = useState(
    String(DEFAULT_MONTHLY_CEILING),
  );
  const { data: metrics = EMPTY_BUSINESS_METRICS } = useBusinessMetrics();
  const { data: campaigns = [] } = useCampaigns();
  const { data: attribution = [] } = useCampaignAttribution();
  const schedule = useCreateCampaign();
  const { data: billing } = useBilling();
  const allowanceRemaining = useMemo(
    () => allowanceRemainingFrom(billing?.allowances ?? []),
    [billing],
  );
  const { data: audienceRows = [] } = useAudience();
  // The most any selected channel can reach. The slider used to start at 1,280
  // with a floor of 100, so a shop with three customers could not express its
  // own audience and was shown someone else's.
  const widestReach = Math.max(...audienceRows.map((row) => row.reachable), 0);
  const [campaignName, setCampaignName] = useState("");
  const [audience, setAudience] = useState<number | null>(null);
  // These three were uncontrolled selects, so the composer showed choices that
  // never reached the scheduled campaign.
  const [audienceSegment, setAudienceSegment] = useState("All members");
  // A real instant, not prose. The three options here were display strings -
  // "Tuesday, 1:30 PM", "Now after preflight", "At each customer's usual
  // time" - and nothing downstream could act on any of them. The last was a
  // per-recipient feature that does not exist at all.
  const [sendNow, setSendNow] = useState(true);
  const [sendAt, setSendAt] = useState("");
  const scheduledFor = sendNow
    ? new Date().toISOString()
    : sendAt
      ? new Date(sendAt).toISOString()
      : "";
  const sendTime = sendNow
    ? "As soon as it is scheduled"
    : sendAt
      ? new Date(sendAt).toLocaleString("en-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "";
  const [frequencyPolicy, setFrequencyPolicy] = useState(
    "Respect 2 promos / week",
  );
  const [channels, setChannels] = useState<Record<string, boolean>>({
    "In-app": true,
    Push: true,
    Email: false,
    Viber: false,
    SMS: false,
  });
  const creditsOpen = billing?.creditPurchasesOpen === true;
  const channelBlocked = (channel: {
    plan?: "Core" | "Grow" | "Scale";
    status: ChannelStatus;
  }) =>
    channel.status === "connecting"
      ? "Connecting; not selectable yet"
      : channel.plan && !gate.covers(channel.plan)
        ? `Opens with ${channel.plan}`
        : null;
  const [smartRouting, setSmartRouting] = useState(true);
  // Blank. This was pre-filled with the seeded demo bakery's advert, so a new
  // shop's composer opened holding another business's promotion, ready to
  // schedule.
  const [message, setMessage] = useState("");
  // Measured reach per channel. A channel with no transport yet (Viber,
  // WhatsApp) has no audience key and so reaches nobody, rather
  // than borrowing a number from a fixture.
  // Null means "not touched", so the slider follows the real audience as it
  // grows instead of pinning itself to whatever it was on first render.
  const audienceSize = audience ?? widestReach;
  const reachOf = (channel: { audienceKey: string | null }) =>
    channel.audienceKey
      ? (audienceRows.find((row) => row.channel === channel.audienceKey)
          ?.reachable ?? 0)
      : 0;
  const selectedChannels = channelConfig.filter(
    (channel) => !channelBlocked(channel) && channels[channel.name],
  );
  const ceilingPerCampaign = Number(campaignCeiling) || 0;
  const ceilingPerMonth = Number(monthlyCeiling) || 0;
  const smsChannel = channelConfig.find((channel) => channel.name === "SMS");
  const viberChannel = channelConfig.find(
    (channel) => channel.name === "Viber",
  );
  // ponytail: routing only ever diverts SMS to the cheaper messaging app. One
  // subtraction beats modelling a full per-recipient channel waterfall.
  const smsAudience =
    smsChannel && channels.SMS
      ? Math.min(audienceSize, reachOf(smsChannel))
      : 0;
  const divertedToViber =
    smartRouting && viberChannel
      ? Math.min(smsAudience, reachOf(viberChannel))
      : 0;
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
          Math.min(audienceSize, reachOf(channel)),
          allowanceRemaining,
        ),
      0,
    ) - routingSavings,
  );
  const reachable = Math.min(
    audienceSize,
    Math.max(...selectedChannels.map(reachOf), 0),
  );
  // The shop's own past campaigns: visits over sends. A fixed 11.8% stood
  // here for every shop; with no history there is no prediction.
  const pastSent = attribution.reduce((sum, row) => sum + row.sent, 0);
  const pastRate = pastSent
    ? attribution.reduce((sum, row) => sum + row.visited, 0) / pastSent
    : null;
  const predictedVisits =
    pastRate === null ? null : Math.round(reachable * pastRate);
  // deliveryCost is pesos, from the published channel rates in plans.ts; the
  // API sends the average order in centavos. Both are named for their unit
  // because dividing one by the other silently put the ROI out by 100x.
  const predictedRevenuePesos =
    predictedVisits === null
      ? null
      : (predictedVisits * metrics.averageOrderCentavos) / 100;
  return (
    <ViewFrame
      eyebrow="Campaign studio"
      title="Campaigns"
      description="Audience, channel, estimated cost, predicted visits, break-even and a spend ceiling, shown before sending. In-app and push on every plan; email on the paid tiers; SMS from credits with the cost shown first; Viber and WhatsApp connecting."
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
            if (message.length > 320)
              problems.push("the message is over 320 characters");
            if (ceilingPerCampaign > 0 && deliveryCost > ceilingPerCampaign) {
              problems.push(
                `estimated cost ${peso(deliveryCost, { decimals: true })} is over the ${peso(ceilingPerCampaign)} campaign ceiling`,
              );
            }
            if (ceilingPerMonth > 0 && deliveryCost > ceilingPerMonth) {
              problems.push(
                `estimated cost ${peso(deliveryCost, { decimals: true })} is over the ${peso(ceilingPerMonth)} monthly ceiling`,
              );
            }
            if (reachable === 0)
              problems.push("no reachable customers with consent");
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
                {/* The audiences the API can resolve to people. "Custom segment"
                    had nothing behind it, and every campaign went to everyone. */}
                <option>All members</option>
                <option>Almost regulars</option>
                <option>At-risk regulars</option>
                <option>One action from reward</option>
              </select>
            </label>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <label htmlFor="audience-size" className="text-xs font-bold">
                Audience size
              </label>
              <span className="text-sm font-extrabold">
                {audienceSize.toLocaleString()}
              </span>
            </div>
            <input
              id="audience-size"
              type="range"
              min="0"
              max={widestReach}
              step="1"
              value={audienceSize}
              onChange={(event) => setAudience(Number(event.target.value))}
              className="mt-3 w-full accent-[var(--accent-strong)]"
            />
          </div>
          <div className="mt-6">
            <p className="text-xs font-bold">Channels</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {channelConfig.map((channel) => {
                const Icon = channel.icon;
                const blocked = channelBlocked(channel);
                const planned = Boolean(blocked);
                const active = !planned && channels[channel.name];
                return (
                  <button
                    type="button"
                    key={channel.name}
                    aria-pressed={planned ? undefined : active}
                    disabled={planned}
                    title={blocked ?? undefined}
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
                        <span className="text-sm font-extrabold">
                          {channel.name}
                        </span>
                        {channel.status === "connecting" && (
                          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted-strong)]">
                            Connecting
                          </span>
                        )}
                        {channel.plan && (
                          <PlanTag
                            plan={channel.plan}
                            included={gate.covers(channel.plan)}
                          />
                        )}
                      </span>
                      <span
                        className={`mt-0.5 block text-[10px] ${active ? "text-white/60" : "text-[var(--muted)]"}`}
                      >
                        {reachOf(channel).toLocaleString()} reachable ·{" "}
                        {allowanceRemaining[channel.name]
                          ? `${allowanceRemaining[channel.name].toLocaleString()} left in plan, then ${channel.note.toLowerCase()}`
                          : channel.note}
                        {channel.name === "SMS" &&
                        !creditsOpen &&
                        !allowanceRemaining.SMS
                          ? " · SMS credits open with billing"
                          : ""}
                        {channel.name === "Email" && !blocked
                          ? " · not sending until the API accepts the channel"
                          : ""}
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
                value={sendNow ? "now" : "later"}
                onChange={(event) => setSendNow(event.target.value === "now")}
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm"
              >
                <option value="now">Send as soon as I schedule it</option>
                <option value="later">Send at a time I pick</option>
              </select>
              {!sendNow && (
                <input
                  type="datetime-local"
                  value={sendAt}
                  onChange={(event) => setSendAt(event.target.value)}
                  className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm"
                />
              )}
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Spend ceiling per campaign, pesos
              <input
                value={campaignCeiling}
                onChange={(event) =>
                  setCampaignCeiling(event.target.value.replace(/[^0-9]/g, ""))
                }
                inputMode="numeric"
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent-strong)]"
              />
            </label>
            <label className="grid gap-2 text-xs font-bold">
              Spend ceiling per month, pesos
              <input
                value={monthlyCeiling}
                onChange={(event) =>
                  setMonthlyCeiling(event.target.value.replace(/[^0-9]/g, ""))
                }
                inputMode="numeric"
                className="min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent-strong)]"
              />
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
              [
                "Estimated delivery cost",
                peso(deliveryCost, { decimals: true }),
              ],
              [
                "Predicted visits",
                predictedVisits ?? "No past campaigns yet",
              ],
              [
                "Predicted visit revenue",
                predictedRevenuePesos === null
                  ? "—"
                  : peso(predictedRevenuePesos),
              ],
              [
                "Revenue / delivery cost",
                !deliveryCost
                  ? "No paid channel"
                  : predictedRevenuePesos === null
                    ? "—"
                    : `${(predictedRevenuePesos / deliveryCost).toFixed(1)}×`,
              ],
              [
                "Break-even visits",
                deliveryCost && metrics.averageOrderCentavos
                  ? String(
                      Math.ceil(
                        (deliveryCost * 100) / metrics.averageOrderCentavos,
                      ),
                    )
                  : "—",
              ],
              [
                "Spend ceiling",
                `${peso(ceilingPerCampaign)} per campaign · ${peso(ceilingPerMonth)} a month`,
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
                  complaint threshold, duplicate suppression, and your spend
                  ceilings apply. Messaging apps are used ahead of SMS when a
                  customer is reachable there.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button
              tone="quiet"
              disabled={testSend.isPending || !message.trim()}
              onClick={() =>
                // The merchant's own copy, which is the entire point of a
                // test. This sent a fixed sentence - "This is how your next
                // campaign will look when it arrives" - so the one feature
                // whose job is to show you your message never showed it.
                testSend.mutate(
                  {
                    subject: campaignName.trim() || "Campaign preview",
                    body: message.trim(),
                  },
                  {
                    // Never to a customer: the API sends it to whoever is
                    // signed in, so there is no address to get wrong.
                    onSuccess: () => notify("Test sent to your own inbox."),
                    onError: (failure) => notify(failure.message, "error"),
                  },
                )
              }
            >
              {testSend.isPending ? "Sending\u2026" : "Send test"}
            </Button>
            <Button
              onClick={() => {
                if (selectedChannels.length === 0) {
                  notify(
                    "Choose at least one channel before scheduling.",
                    "error",
                  );
                  return;
                }
                // Nobody to send to is a reason not to send. The composer
                // showed a fixed audience of 1,280 and would happily schedule
                // against it on a workspace with no customers at all.
                if (reachable === 0) {
                  notify(
                    "Nobody on your list has agreed to this channel yet, so there is no one to send to.",
                    "error",
                  );
                  return;
                }
                if (!message.trim()) {
                  notify("Write the message before scheduling it.", "error");
                  return;
                }
                if (!scheduledFor) {
                  notify("Pick when this should send.", "error");
                  return;
                }
                if (
                  ceilingPerCampaign > 0 &&
                  deliveryCost > ceilingPerCampaign
                ) {
                  notify(
                    `Estimated cost ${peso(deliveryCost, { decimals: true })} is over your ${peso(ceilingPerCampaign)} campaign ceiling.`,
                    "error",
                  );
                  return;
                }
                schedule.mutate(
                  {
                    name: campaignName.trim() || "Untitled campaign",
                    audience: `${audienceSegment} · ${reachable.toLocaleString()} selected`,
                    channels: selectedChannels.map((channel) => channel.name),
                    sendTime,
                    scheduledFor,
                    frequencyPolicy,
                  },
                  {
                    // A refused channel, an exhausted allowance or a missing
                    // credit balance is the API's answer, and it is shown.
                    onError: (failure) =>
                      notify(refusal(failure, "Core"), "error"),
                    // Was fired outside the mutation, so the screen said
                    // "scheduled" whether or not the request succeeded.
                    onSuccess: () =>
                      notify(
                        `${campaignName.trim() || "Untitled campaign"} scheduled for ${sendTime.toLowerCase()} · ${reachable.toLocaleString()} reachable customers.`,
                      ),
                  },
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
            <h2 className="mt-1 text-lg font-extrabold">
              Revenue after delivery
            </h2>
          </div>
        </div>
        {campaigns.length === 0 && (
          <NothingYet>
            No campaign has been sent from this workspace yet. Once one goes
            out, its reach, cost and the revenue after it land here.
          </NothingYet>
        )}
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
                      {campaign.frequencyPolicy
                        ? ` · ${campaign.frequencyPolicy}`
                        : ""}
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
  const messageChannels = useMemo(
    () => messageChannelsFrom(messages),
    [messages],
  );
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
      description="Every customer communication across in-app, push, email and SMS, with cost, consent outcome and downstream visits. Push reaches the wallet by web push and the app by push notification, where the customer turned it on."
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
                    {message.costCentavos
                      ? pesoFromCentavos(message.costCentavos)
                      : "Included"}
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
    "bonus-windows": <BonusWindowsView notify={notify} />,
    "promo-codes": <PromoCodesView notify={notify} />,
    "store-credit": <StoreCreditView notify={notify} />,
    "suki-tiers": <SukiTiersView notify={notify} />,
    missions: <MissionsView notify={notify} />,
    gifts: <GiftsView />,
    "favorite-orders": (
      <FavoriteOrdersView notify={notify} onNavigate={onNavigate} />
    ),
    birthday: <BirthdayView notify={notify} />,
    redemptions: <RedemptionsView notify={notify} />,
    campaigns: <CampaignsView notify={notify} />,
    "message-log": <MessageLogView notify={notify} />,
    feedback: <FeedbackView />,
    analytics: <AnalyticsView />,
    integrations: <IntegrationsView notify={notify} onNavigate={onNavigate} />,
    staff: <StaffView notify={notify} />,
    billing: <BillingView notify={notify} />,
    settings: <SettingsView notify={notify} />,
  };
  return view === "dashboard" ? null : views[view];
}
