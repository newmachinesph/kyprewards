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

/** `48260000` → `₱482.6k`. The compact form of the unit the API sends. */
export function pesoCompactFromCentavos(centavos: number) {
  return pesoCompact(centavos / 100);
}

/* ── Distance ─────────────────────────────────────────────────────── */

/**
 * `450` → `"450 m"`, `1200` → `"1.2 km"`.
 *
 * The API used to send this already formatted, which cost the wallet its
 * sort order and inverted the discover screen's "nearby" filter — parseFloat
 * on "1.2 km" gives 1.2 and on "450 m" gives 450, so the nearer place was the
 * one excluded. It sends `distanceMetres` now; this is the last step before
 * the number reaches a screen.
 *
 * Empty for null, which is what an unknown position means: the customer
 * refused location, or the branch has no pin. Not "0 m", which reads as
 * "you are here".
 */
export function formatDistance(metres: number | null | undefined) {
  if (metres === null || metres === undefined) return "";
  // Rounded to the nearest ten under a kilometre: a wallet card claiming
  // "437 m" implies a precision that phone GPS does not have.
  if (metres < 1000) return `${Math.round(metres / 10) * 10} m`;
  return `${(metres / 1000).toFixed(1)} km`;
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
export function relativeTime(iso: string | null | undefined, now: Date = new Date()) {
  if (!iso) return "Never";
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

/**
 * `"2026-09-15"` → `"15 September 2026"`.
 *
 * The API sends one date field where the fixture used to send a display
 * string beside an ISO twin. This is the half that was living in the JSON.
 *
 * A bare `YYYY-MM-DD` is parsed as UTC midnight by `new Date`, so formatting
 * it in Manila - or any zone behind UTC - printed the day before. The date
 * parts are read literally instead, which is what a calendar date means:
 * a renewal on the 15th is the 15th wherever you are standing.
 */
export function longDate(value: string) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!parts) return value;
  const [, year, month, day] = parts;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return value;
  // en-GB, not en-PH: the Philippine locale renders "September 15, 2026" and
  // this product writes dates day-first everywhere it writes them.
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * ISO instant → `"9:42 AM"`, in the merchant's timezone rather than the
 * viewer's. A branch manager in another zone reading "2:42 AM" for a morning
 * visit is a support ticket.
 */
export function timeOfDay(iso: string, timeZone = "Asia/Manila") {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  return at.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
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
  birthday: string | null | undefined,
  days = 30,
  now: Date = new Date(),
): number | null {
  // Most customers never give one. "No birthday" is an answer, not an error.
  if (!birthday) return null;
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
