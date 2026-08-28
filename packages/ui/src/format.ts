/**
 * Formatting the four apps had been doing by hand, inconsistently.
 *
 * Peso amounts were written five ways, "Good morning" was hardcoded at any
 * hour in two apps, and the birthday list filtered a literal array of three
 * dates under a "next 30 days" heading. These are the single copies.
 */

/* ── Money ──────────────────────────────────────────────────────────
   The fixture stores whole pesos; the integration contract sends centavos.
   Both units exist in this product, so both get a named function and
   neither gets guessed at a call site. */

/** `8120` → `₱8,120`. Whole pesos, the unit the fixture uses. */
export function peso(amount: number, options: { decimals?: boolean } = {}) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: options.decimals ? 2 : 0,
    maximumFractionDigits: options.decimals ? 2 : 0,
  })}`;
}

/** `28600` → `₱286.00`. Centavos, the unit the API contract sends. */
export function pesoFromCentavos(centavos: number) {
  return peso(centavos / 100, { decimals: true });
}

/**
 * `482600` → `₱482.6k`. For headline stats where the full number is noise.
 *
 * One decimal, and a trailing `.0` is dropped — `318000` reads `₱318k`, not
 * `₱318.0k`.
 */
export function pesoCompact(amount: number) {
  if (Math.abs(amount) < 1000) return peso(amount);
  const thousands = Math.round((amount / 1000) * 10) / 10;
  return `₱${thousands.toLocaleString("en-PH", {
    maximumFractionDigits: 1,
  })}k`;
}

/* ── Time ───────────────────────────────────────────────────────── */

/** One "today" for every app, so a screen-share of all four agrees. */
export function todayLabel(date: Date = new Date()) {
  return date.toLocaleDateString("en-PH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** "Good morning" / "Good afternoon" / "Good evening", from the clock rather
 *  than from whichever one was typed into the JSX. */
export function greeting(date: Date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** ISO timestamp → "18 minutes ago" / "Yesterday" / "22 August". Relative
 *  strings in the fixture are display copy; this derives them instead so they
 *  do not age into a lie. */
export function relativeTime(iso: string, now: Date = new Date()) {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return iso;
  const minutes = Math.round((now.getTime() - then.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString("en-PH", { day: "numeric", month: "long" });
}

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/**
 * Is a `"8 September"`-style birthday inside the next `days` days?
 *
 * Birthdays carry no year, so the comparison rolls to next year when the date
 * has already passed. Returns the day count so callers can sort by it.
 */
export function daysUntilBirthday(
  birthday: string,
  days = 30,
  now: Date = new Date(),
): number | null {
  const match = /^(\d{1,2})\s+([A-Za-z]+)$/.exec(birthday.trim());
  if (!match) return null;
  const month = MONTHS.indexOf(match[2].toLowerCase());
  if (month < 0) return null;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(today.getFullYear(), month, Number(match[1]));
  if (next < today) next = new Date(today.getFullYear() + 1, month, Number(match[1]));

  const until = Math.round((next.getTime() - today.getTime()) / 86400000);
  return until <= days ? until : null;
}
