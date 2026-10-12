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

/** `15000` → `₱150`, `15050` → `₱150.50`. Held balances and offers, where
 *  ".00" on a whole peso is noise but a real centavo still shows. */
export function pesoShortFromCentavos(centavos: number) {
  return centavos % 100 === 0 ? peso(centavos / 100) : pesoFromCentavos(centavos);
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
  // A future instant - a run's end date, an add-on's renewal, a pending
  // stamp's expiry - used to read "Just now". It is "in 3 days".
  if (minutes <= -1) {
    const ahead = -minutes;
    if (ahead < 60) return `in ${ahead} minute${ahead === 1 ? "" : "s"}`;
    const hours = Math.round(ahead / 60);
    if (hours < 24) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
    const days = Math.round(hours / 24);
    if (days === 1) return "Tomorrow";
    if (days < 7) return `in ${days} days`;
    return then.toLocaleDateString("en-PH", { day: "numeric", month: "long" });
  }
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

/**
 * `2974 0128 0548 0` - the member code, grouped the way a card is read.
 *
 * Stored and sent bare. Grouping is presentation, and a stored copy carrying
 * spaces is a second format that eventually fails to match the first - the
 * counter normalizes whatever it is given back to digits before looking it up.
 *
 * Fours because that is how every card number a person has ever held is
 * printed, and thirteen digits divides into 4-4-4-1 rather than evenly. The
 * odd last group is the check digit standing on its own, which is fine: it is
 * the digit nobody needs to read aloud carefully.
 */
export function formatMemberCode(code: string | null | undefined): string {
  if (!code) return "";
  const digits = code.replace(/\D/g, "");
  // Anything that is not the thirteen-digit format goes back untouched rather
  // than being chopped into fours - a legacy code or a typo should look wrong,
  // not look formatted.
  if (digits.length !== 13) return code;
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/**
 * Which of the three things the counter field accepts was typed.
 *
 * The field says "Member code, mobile number, or email" and a hardware
 * scanner types the code straight into it. Everything that was not an email
 * used to be sent as a phone number, so a scanned card came back "Enter a
 * valid Philippine mobile number" while the cashier was holding it.
 *
 * Thirteen digits is the whole rule. A Philippine mobile has eleven of them,
 * or twelve with the country code - never thirteen - and a leading `+` means
 * somebody is typing a country code rather than reading a card, so that goes
 * to the phone branch and gets the phone error. The API validates the check
 * digit; this only picks the field to send it in.
 */
export function looksLikeMemberCode(typed: string): boolean {
  const trimmed = typed.trim();
  if (trimmed.startsWith("+")) return false;
  return trimmed.replace(/\D/g, "").length === 13;
}

/* ── Philippine mobile numbers ──────────────────────────────────────────
   Shared by every form that asks for one, so the marketing site's partner
   intake and the wallet's sign-in agree about what a number looks like.
   These moved here from the intake form when the wallet needed them too. */

/**
 * Any way a Filipino writes their own number, into the ten national digits.
 *
 * `0917…`, `+63917…`, `63917…`, and the same with spaces or dashes all mean
 * the same person. Rejecting nine of those ten spellings is a form blaming
 * somebody for its own narrowness.
 */
export function normalizeMobile(typed: string): string {
  const digits = typed.replace(/\D/g, "");
  if (digits.startsWith("63")) return digits.slice(2, 12);
  if (digits.startsWith("0")) return digits.slice(1, 11);
  return digits.slice(0, 10);
}

/** `917 555 0182` — grouped the way it is read aloud. */
export function displayMobile(national: string): string {
  const [, a = "", b = "", c = ""] = /^(\d{0,3})(\d{0,3})(\d{0,4})$/.exec(national) ?? [];
  return [a, b, c].filter(Boolean).join(" ");
}

/** Ten digits starting with 9. The carrier prefix is the API's business. */
export const isCompleteMobile = (national: string) => /^9\d{9}$/.test(national);

/** The ten national digits as the API wants them. `""` while incomplete. */
export const toE164 = (national: string) =>
  isCompleteMobile(national) ? `+63${national}` : "";

/* ── Opening hours ─────────────────────────────────────────────────────
   A branch stores its hours as display pairs the listing prints verbatim,
   so the merchant form composes the string rather than accepting one. The
   pair of converters below is the whole of that, and it shipped once with
   its backslashes eaten by a shell heredoc - `d` as `d` - which parsed
   nothing, loaded every saved row as blank, and would have dropped a
   shop's hours the next time they pressed save. Hence the tests. */

/** "18:00" from a time input, to "6:00 PM" as a listing shows it. */
export function toDisplayTime(value: string): string {
  const [h, m] = value.split(":").map(Number);
  // `isFinite`, not `isNaN`: an empty value splits to one part, so the
  // minutes are `undefined` rather than NaN, `Number.isNaN(undefined)` is
  // false, and an empty input formatted as "12:undefined AM".
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** The inverse, for reading a saved row back into a time input. */
export function toInputTime(display: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(display.trim());
  if (!match) return "";
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

/** "9:00 AM – 6:00 PM" back into the two ends, as time inputs want them.
 *  An en dash is what this app writes; a hyphen is what a person pastes. */
export function splitRange(time: string): { open: string; close: string } {
  const [open = "", close = ""] = time.split(/\s*[–-]\s*/);
  return { open: toInputTime(open), close: toInputTime(close) };
}

/**
 * A points program's earn rule as a shopper reads it: "1 point for every
 * ₱100", "2 points every visit", "2% back". `rateBps` is in ten-thousandths
 * (see `Earning` in @kyprewards/api); null when there is no rule to show.
 */
export function earningLine(
  earning: { mode: "visit" | "peso" | "item" | "cashback"; rateBps: number } | null | undefined,
): string | null {
  if (!earning || earning.rateBps <= 0) return null;
  const { mode, rateBps } = earning;
  const points = (n: number) => `${trimNumber(n)} ${n === 1 ? "point" : "points"}`;
  if (mode === "cashback") return `${trimNumber(rateBps / 100)}% back`;
  if (mode === "visit") return `${points(rateBps / 10_000)} every visit`;
  if (mode === "item") return `${points(rateBps / 10_000)} per item`;
  // Per peso: one point for every ₱N when that is a whole number of pesos,
  // otherwise the points a ₱100 spend earns.
  const pesosPerPoint = 10_000 / rateBps;
  if (Number.isInteger(pesosPerPoint)) {
    return pesosPerPoint === 1 ? "1 point per ₱1" : `1 point for every ₱${peso(pesosPerPoint).replace("₱", "")}`;
  }
  if (rateBps > 10_000) return `${points(rateBps / 10_000)} per ₱1`;
  return `${points(rateBps / 100)} for every ₱100`;
}

function trimNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
