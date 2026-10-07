import type { WalletCard } from "@kyprewards/api";
import { longDate, pesoFromCentavos, timeOfDay } from "@kyprewards/ui/format";

/**
 * Everything a stamp card says about its own state and terms.
 *
 * Ported line for line from the web wallet's `cards.tsx`, minus the JSX.
 * Nothing here computes a rule: each line is a sentence built from a field
 * the API put on the card, and a card without the field gets no sentence.
 */

/** Stamps that count. A pending welcome stamp sits inside `progress` but has
 *  not been earned, so it is never drawn as a filled dot. */
export function earnedStamps(card: WalletCard): number {
  return card.state === "pending"
    ? Math.max(0, card.progress - 1)
    : card.progress;
}

/** Progress toward the target, or null when a card has no target. */
export function percentOf(card: WalletCard): number | null {
  if (card.target <= 0) return null;
  return Math.min(100, Math.round((earnedStamps(card) / card.target) * 100));
}

const DAY_MINUTES = 1440;

export function cooldownLabel(minutes: number): string {
  if (minutes <= 0) return "no cooldown";
  if (minutes === DAY_MINUTES) return "once a day";
  if (minutes % DAY_MINUTES === 0)
    return `once every ${minutes / DAY_MINUTES} days`;
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `once every ${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `once every ${minutes} minutes`;
}

/** "at 6:00 AM", "tomorrow at 6:00 AM", or "on 12 October 2026". */
export function untilLabel(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  const today = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(at, today)) return `at ${timeOfDay(iso)}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (sameDay(at, tomorrow)) return `tomorrow at ${timeOfDay(iso)}`;
  return `on ${longDate(iso.slice(0, 10))}`;
}

/** The one sentence about where this card stands, or null for a plain active card. */
export function cardStateLine(card: WalletCard): string | null {
  switch (card.state) {
    case "pending":
      return card.pendingStamp
        ? `Pending until your first visit · expires ${longDate(card.pendingStamp.expiresAt.slice(0, 10))}`
        : "Pending until your first visit";
    case "completed":
      return card.rules && card.rules.maxCompletions > 0
        ? `Completed · ${card.completions ?? 0} of ${card.rules.maxCompletions} this run`
        : "Completed";
    case "closed":
      if (card.closeOutcome === "expired")
        return "This run closed. Unfinished stamps expired.";
      if (card.closeOutcome === "carriedOver")
        return `This run closed. Unfinished stamps moved to ${card.successorProgram ?? "the next card"}.`;
      return "This run closed.";
    default:
      return card.nextStampAt
        ? `Next stamp available ${untilLabel(card.nextStampAt)}`
        : null;
  }
}

/** The headline a card leads with. */
export function cardHeadline(card: WalletCard): string {
  const remaining =
    card.target > 0 ? Math.max(0, card.target - card.progress) : null;
  if (card.state === "pending")
    return "Your welcome stamp lands on your first visit.";
  if (card.state === "closed") {
    return card.rewardsAvailable > 0
      ? `${card.reward} is held for you.`
      : "This run has closed.";
  }
  if (remaining === null) return card.balance;
  if (card.rewardsAvailable > 0) return `${card.reward} is ready.`;
  if (remaining === 0) return `${card.reward} on your next visit.`;
  return `${remaining} more ${remaining === 1 ? "visit" : "visits"}, then ${card.reward.toLowerCase()}.`;
}

/** "5 of 8 · 1 pending" or the balance the API wrote. */
export function balanceLine(card: WalletCard): string {
  return card.state === "pending"
    ? `${earnedStamps(card)} of ${card.target} · 1 pending`
    : card.balance;
}

/** The merchant's settings in plain language. Only the fields the card carries. */
export function cardTerms(card: WalletCard): [string, string][] {
  const rules = card.rules;
  const rows: [string, string][] = [];
  if (card.target > 0) rows.push(["Target", `${card.target} stamps`]);
  rows.push(["Reward", card.reward]);
  if (!rules) return rows;
  rows.push(["Cooldown", cooldownLabel(rules.cooldownMinutes)]);
  rows.push([
    "Minimum spend",
    rules.minSpendCentavos > 0
      ? `${pesoFromCentavos(rules.minSpendCentavos)} per stamp`
      : "none",
  ]);
  rows.push([
    "Expiry",
    rules.expiryDays > 0
      ? `${rules.expiryDays} days for unclaimed stamps and earned rewards`
      : "stamps and rewards do not expire",
  ]);
  rows.push([
    "Welcome stamp",
    rules.welcomeStamp ? "on, pending until your first visit" : "off",
  ]);
  if (rules.startsAt || rules.endsAt) {
    const from = rules.startsAt ? longDate(rules.startsAt.slice(0, 10)) : "now";
    const to = rules.endsAt
      ? longDate(rules.endsAt.slice(0, 10))
      : "no end date";
    rows.push(["Run dates", `${from} to ${to}`]);
    rows.push([
      "After the run",
      rules.onClose === "carryOver"
        ? `unfinished stamps move to ${card.successorProgram ?? "the next card"}`
        : "unfinished stamps expire",
    ]);
    if (rules.rewardGraceDays > 0) {
      rows.push([
        "Held rewards",
        `redeemable for ${rules.rewardGraceDays} days after the run ends`,
      ]);
    }
  }
  if (rules.maxCompletions > 0) {
    rows.push([
      "Completions",
      `up to ${rules.maxCompletions} per member this run`,
    ]);
  }
  return rows;
}

/** The card the customer is furthest along on; a held reward outranks progress. */
export function closestReward(cards: WalletCard[]): WalletCard | undefined {
  return cards.reduce<WalletCard | undefined>((leader, card) => {
    if (leader && leader.rewardsAvailable > 0 && card.rewardsAvailable === 0)
      return leader;
    if (card.rewardsAvailable > 0 && (!leader || leader.rewardsAvailable === 0))
      return card;
    const share = percentOf(card);
    if (share === null) return leader;
    const leading = leader ? percentOf(leader) : null;
    return leading === null || share > leading ? card : leader;
  }, undefined);
}

/** Chips from the data, deduped on a folded key so "Café" and "cafe" are one chip. */
export function categoriesFrom(labels: string[]): string[] {
  const seen = new Map<string, string>();
  for (const label of labels) {
    const key = label
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim()
      .toLowerCase();
    if (key && !seen.has(key)) seen.set(key, label);
  }
  return ["All", ...seen.values()];
}
