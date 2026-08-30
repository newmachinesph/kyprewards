"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  MapPin,
  Pencil,
  ShieldCheck,
  Stamp,
} from "lucide-react";
import {
  displayMobile,
  isCompleteMobile,
  isEmail,
  isMapsLink,
  normalizeMobile,
  usePartnerDraft,
  type PartnerDraft,
} from "./draft";
import { ChipGroup, Field, Remaining, inputClass, inputInvalidClass } from "./Fields";

/**
 * Partner intake.
 *
 * NOT WIRED. `submit()` below is where the POST goes; today it only moves to
 * the confirmation state so the flow can be reviewed end to end. Nothing
 * leaves the browser, and the confirmation says so.
 *
 * Three decisions worth keeping when it is wired:
 *
 * 1. The draft lives in localStorage, so a refresh mid-application costs
 *    nothing. See `draft.ts`.
 * 2. "How did you hear about us" is asked *after* submitting. It is our
 *    question, not the merchant's work, and asking it after the commitment
 *    costs them nothing and still answers it.
 * 3. Reward mechanic, branch nickname and username are not asked at all.
 *    Approval does not depend on any of them, and they are decisions a
 *    merchant makes better inside the dashboard than in front of a form.
 */

const CATEGORIES = [
  "Cafe or coffee shop",
  "Restaurant or carinderia",
  "Bakery",
  "Milk tea or dessert",
  "Salon or barbershop",
  "Spa or wellness",
  "Retail or convenience",
  "Laundry",
  "Pet services",
  "Fitness studio",
  "Other",
];

const STEPS = [
  { id: "shop", label: "Your shop", stamp: "01" },
  { id: "you", label: "How to reach you", stamp: "02" },
  { id: "counter", label: "Your counter", stamp: "03" },
  { id: "review", label: "Check and send", stamp: "04" },
] as const;

type Errors = Partial<Record<keyof PartnerDraft, string>>;

function validate(step: number, draft: PartnerDraft): Errors {
  const errors: Errors = {};
  if (step === 0) {
    if (draft.businessName.trim().length < 2)
      errors.businessName = "What do customers call your place?";
    if (!draft.category) errors.category = "Pick the closest one.";
    if (draft.address.trim().length < 8)
      errors.address = "Street, barangay, city — enough for us to find you.";
    if (!draft.notOnMaps && !draft.mapsLink.trim())
      errors.mapsLink = "Paste the link, or tick the box below if you are not listed.";
    else if (!draft.notOnMaps && !isMapsLink(draft.mapsLink))
      errors.mapsLink = "That does not look like a Google Maps link.";
  }
  if (step === 1) {
    if (draft.ownerName.trim().length < 2) errors.ownerName = "Who should we ask for?";
    if (!isCompleteMobile(draft.mobile))
      errors.mobile = "Ten digits starting with 9, the way you would text it.";
    if (!isEmail(draft.email)) errors.email = "We send the approval here, so it has to work.";
  }
  if (step === 2) {
    if (!draft.volume) errors.volume = "A rough count is fine.";
    if (!draft.existing) errors.existing = "Pick the closest one.";
  }
  return errors;
}

/** Required fields still empty, for an honest time estimate. */
function remainingCount(draft: PartnerDraft): number {
  return [0, 1, 2].reduce(
    (sum, step) => sum + Object.keys(validate(step, draft)).length,
    0,
  );
}

export function PartnerIntake() {
  const { draft, patch, clear } = usePartnerDraft();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [source, setSource] = useState("");
  const headingRef = useRef<HTMLParagraphElement>(null);

  // Move the reading position with the form. Without this a screen reader
  // stays where the button was and a keyboard user tabs from the top of the
  // page again on every step.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step, sent]);

  function advance() {
    const found = validate(step, draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function submit() {
    // Where the POST goes once this is wired. Everything above stays.
    setSent(true);
    clear();
  }

  if (sent) {
    return <Submitted source={source} onSource={setSource} />;
  }

  const left = remainingCount(draft);

  return (
    <div className="mx-auto max-w-[760px]">
      <Progress step={step} />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (step === STEPS.length - 1) submit();
          else advance();
        }}
        noValidate
        className="receipt-paper mt-6 rounded-[var(--radius-card)] border border-[var(--line)] p-6 shadow-diffuse sm:p-9"
      >
        {/* Focused on every step change so a screen reader moves with the
            form. No visible ring: it is not a control, and outlining a
            heading only tells a sighted user something is wrong. */}
        <p
          ref={headingRef}
          tabIndex={-1}
          className="flex items-baseline gap-3 text-[11px] font-extrabold uppercase tracking-[0.17em] text-[var(--accent-strong)] outline-none"
        >
          <span className="tabular-nums">{STEPS[step].stamp}</span>
          <span className="text-[var(--muted)]">{STEPS[step].label}</span>
        </p>

        <div className="perforated mt-4 h-px" />

        <div className="mt-7 grid gap-6">
          {step === 0 && <ShopStep draft={draft} patch={patch} errors={errors} />}
          {step === 1 && <YouStep draft={draft} patch={patch} errors={errors} />}
          {step === 2 && <CounterStep draft={draft} patch={patch} errors={errors} />}
          {step === 3 && <ReviewStep draft={draft} onEdit={setStep} />}
        </div>

        <div className="perforated mt-9 h-px" />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((current) => current - 1)}
              className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--line-strong)] px-5 text-sm font-extrabold transition hover:-translate-y-0.5 hover:border-[var(--ink)]"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <p className="max-w-[30ch] text-xs leading-relaxed text-[var(--muted-strong)]">
              Your answers are kept on this device as you type. A refresh will
              not lose them.
            </p>
          )}

          <button
            type="submit"
            className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--ink)] bg-[var(--ink)] px-6 text-sm font-extrabold text-[var(--surface)] shadow-[0_2px_0_rgb(24_18_12/18%)] transition hover:-translate-y-0.5 hover:bg-[var(--ink-soft)]"
          >
            {step === STEPS.length - 1 ? (
              <>
                <Stamp size={16} /> Send application
              </>
            ) : (
              <>
                Continue <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      <p className="mt-5 text-center text-xs text-[var(--muted-strong)]">
        {left === 0
          ? "Everything we need is filled in."
          : `${left} question${left === 1 ? "" : "s"} left — about ${Math.max(1, Math.ceil(left / 3))} minute${left > 3 ? "s" : ""}.`}
      </p>
    </div>
  );
}

/**
 * Four ink stamps rather than four numbered circles.
 *
 * The product is a stamp card. A progress bar that looks like every other
 * SaaS wizard would be the one part of this page that could belong to
 * anybody.
 */
function Progress({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((item, index) => {
        const done = index < step;
        const active = index === step;
        return (
          <li key={item.id} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden="true"
                className={`ink-stamp grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-extrabold transition ${
                  done
                    ? "rotate-[-7deg] text-[var(--success)]"
                    : active
                      ? "rotate-[-7deg] text-[var(--accent-strong)]"
                      : "rotate-0 text-[var(--line-strong)]"
                }`}
              >
                {done ? <Check size={15} strokeWidth={3.5} /> : item.stamp}
              </span>
              <span
                className={`hidden truncate text-xs font-extrabold sm:block ${
                  active ? "text-[var(--ink)]" : "text-[var(--muted)]"
                }`}
              >
                {item.label}
              </span>
              <span className="sr-only">
                {item.label}
                {active ? " (current step)" : done ? " (done)" : ""}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`h-px flex-1 ${done ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Steps ─────────────────────────────────────────────────────────── */

type StepProps = {
  draft: PartnerDraft;
  patch: (changes: Partial<PartnerDraft>) => void;
  errors: Errors;
};

function ShopStep({ draft, patch, errors }: StepProps) {
  return (
    <>
      <Field label="Business name" htmlFor="businessName" error={errors.businessName}>
        <input
          id="businessName"
          value={draft.businessName}
          onChange={(event) => patch({ businessName: event.target.value.slice(0, 120) })}
          autoComplete="organization"
          placeholder="Aling Nena's Carinderia"
          className={errors.businessName ? inputInvalidClass : inputClass}
        />
        <Remaining value={draft.businessName} limit={120} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-[1.6fr_1fr]">
        <Field label="What kind of place is it?" htmlFor="category" error={errors.category}>
          <select
            id="category"
            value={draft.category}
            onChange={(event) => patch({ category: event.target.value })}
            className={`${errors.category ? inputInvalidClass : inputClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236f6359%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat pr-12`}
          >
            <option value="">Choose one</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Branches"
          hint="Counting this one."
          htmlFor="branches"
        >
          <input
            id="branches"
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            value={draft.branches}
            onChange={(event) => patch({ branches: event.target.value })}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label="Where are you?"
        hint="Street, barangay, city, province."
        htmlFor="address"
        error={errors.address}
      >
        <textarea
          id="address"
          rows={2}
          value={draft.address}
          onChange={(event) => patch({ address: event.target.value.slice(0, 500) })}
          autoComplete="street-address"
          placeholder="12 East Capitol Drive, Kapitolyo, Pasig, Metro Manila"
          className={`${errors.address ? inputInvalidClass : inputClass} min-h-24 py-3 leading-relaxed`}
        />
        <Remaining value={draft.address} limit={500} />
      </Field>

      <Field
        label="Google Maps link"
        hint="Open your shop in Maps, tap Share, paste it here. Any Google link works."
        htmlFor="mapsLink"
        error={errors.mapsLink}
      >
        <input
          id="mapsLink"
          value={draft.mapsLink}
          onChange={(event) => patch({ mapsLink: event.target.value })}
          disabled={draft.notOnMaps}
          inputMode="url"
          placeholder="https://maps.app.goo.gl/…"
          className={`${errors.mapsLink ? inputInvalidClass : inputClass} disabled:cursor-not-allowed disabled:bg-[var(--surface-2)] disabled:text-[var(--muted)]`}
        />
        <label className="mt-1 inline-flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={draft.notOnMaps}
            onChange={(event) =>
              patch({ notOnMaps: event.target.checked, mapsLink: "" })
            }
            className="focus-ring mt-0.5 size-4 rounded border-[var(--line-strong)] accent-[var(--ink)]"
          />
          <span className="text-[var(--muted-strong)]">
            We are not on Google Maps yet.
            <span className="block text-xs">
              Fine — we will help you get listed, it brings in walk-ins on its own.
            </span>
          </span>
        </label>
      </Field>
    </>
  );
}

function YouStep({ draft, patch, errors }: StepProps) {
  return (
    <>
      <Field label="Your name" htmlFor="ownerName" error={errors.ownerName}>
        <input
          id="ownerName"
          value={draft.ownerName}
          onChange={(event) => patch({ ownerName: event.target.value.slice(0, 120) })}
          autoComplete="name"
          placeholder="Mara Santos"
          className={errors.ownerName ? inputInvalidClass : inputClass}
        />
      </Field>

      <Field
        label="Mobile number"
        hint="However you normally write it — 0917, +63, spaces, we will sort it out."
        htmlFor="mobile"
        error={errors.mobile}
      >
        <div
          className={`flex items-stretch overflow-hidden rounded-2xl border ${
            errors.mobile
              ? "border-2 border-[var(--danger)]"
              : "border-[var(--line-strong)] focus-within:border-[var(--accent-strong)]"
          } bg-[var(--paper)]`}
        >
          <span className="grid place-items-center border-r border-[var(--line-strong)] bg-[var(--surface-2)] px-4 text-sm font-extrabold text-[var(--muted-strong)]">
            +63
          </span>
          <input
            id="mobile"
            value={displayMobile(draft.mobile)}
            onChange={(event) => patch({ mobile: normalizeMobile(event.target.value) })}
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="917 123 4567"
            className="focus-ring min-h-12 flex-1 bg-transparent px-4 text-[15px] outline-none placeholder:text-[var(--muted)]"
          />
        </div>
      </Field>

      <Field
        label="Email"
        hint="Where the approval and your first sign-in will arrive."
        htmlFor="email"
        error={errors.email}
      >
        <input
          id="email"
          type="email"
          value={draft.email}
          onChange={(event) => patch({ email: event.target.value.slice(0, 255) })}
          autoComplete="email"
          placeholder="you@yourshop.ph"
          className={errors.email ? inputInvalidClass : inputClass}
        />
      </Field>

      <Field
        label="Facebook page"
        hint="Speeds up verification — most Filipino shops are easiest to confirm here."
        htmlFor="facebook"
        optional
      >
        <input
          id="facebook"
          value={draft.facebook}
          onChange={(event) => patch({ facebook: event.target.value })}
          inputMode="url"
          placeholder="facebook.com/yourshop"
          className={inputClass}
        />
      </Field>
    </>
  );
}

function CounterStep({ draft, patch, errors }: StepProps) {
  return (
    <>
      <ChipGroup
        legend="Customers on a normal day"
        hint="A rough count. It only shapes what we suggest, not what you pay."
        value={draft.volume}
        onChange={(volume) => patch({ volume })}
        error={errors.volume}
        options={[
          { value: "1-9", label: "Under 10" },
          { value: "10-19", label: "10 – 19" },
          { value: "20-49", label: "20 – 49" },
          { value: "50-149", label: "50 – 149" },
          { value: "150+", label: "150 or more" },
        ]}
      />

      <ChipGroup
        legend="How do you reward regulars today?"
        value={draft.existing}
        onChange={(existing) => patch({ existing })}
        error={errors.existing}
        columns="two"
        options={[
          {
            value: "none",
            label: "Nothing formal",
            detail: "We just remember the regulars.",
          },
          {
            value: "paper",
            label: "Paper punch cards",
            detail: "Stamps, a puncher, the works.",
          },
          {
            value: "app",
            label: "An app or POS feature",
            detail: "Something digital already running.",
          },
          {
            value: "other",
            label: "Something else",
            detail: "Discounts for regulars, a notebook, a group chat.",
          },
        ]}
      />

      <ChipGroup
        legend="Which fits your counter better?"
        hint="You can change this later, and we will talk it through before you launch."
        value={draft.mechanic}
        onChange={(mechanic) => patch({ mechanic })}
        columns="two"
        options={[
          {
            value: "stamps",
            label: "A stamp per visit",
            detail: "Ten coffees, one free. Best when what people buy is similar.",
          },
          {
            value: "points",
            label: "Points per peso",
            detail: "Rewards scale with the bill. Best when orders vary a lot.",
          },
          {
            value: "unsure",
            label: "Not sure yet",
            detail: "Tell us about the shop and we will recommend one.",
          },
        ]}
      />
    </>
  );
}

/**
 * The application as a receipt.
 *
 * A merchant about to hand over their contact details should see exactly
 * what is on the slip. Every line jumps back to the step that owns it, so
 * fixing a typo costs one click rather than a walk back through the form.
 */
function ReviewStep({
  draft,
  onEdit,
}: {
  draft: PartnerDraft;
  onEdit: (step: number) => void;
}) {
  const lines: { label: string; value: string; step: number }[] = [
    { label: "Business", value: draft.businessName, step: 0 },
    { label: "Type", value: draft.category, step: 0 },
    {
      label: "Branches",
      value: `${draft.branches || "1"} ${Number(draft.branches) === 1 ? "branch" : "branches"}`,
      step: 0,
    },
    { label: "Address", value: draft.address, step: 0 },
    {
      label: "Google Maps",
      value: draft.notOnMaps ? "Not listed yet — we will help" : draft.mapsLink,
      step: 0,
    },
    { label: "Owner", value: draft.ownerName, step: 1 },
    { label: "Mobile", value: `+63 ${displayMobile(draft.mobile)}`, step: 1 },
    { label: "Email", value: draft.email, step: 1 },
    ...(draft.facebook
      ? [{ label: "Facebook", value: draft.facebook, step: 1 }]
      : []),
    {
      label: "Customers a day",
      value:
        {
          "1-9": "Under 10",
          "10-19": "10 to 19",
          "20-49": "20 to 49",
          "50-149": "50 to 149",
          "150+": "150 or more",
        }[draft.volume] ?? draft.volume,
      step: 2,
    },
    {
      label: "Today",
      value:
        {
          none: "Nothing formal",
          paper: "Paper punch cards",
          app: "An app or POS feature",
          other: "Something else",
        }[draft.existing] ?? draft.existing,
      step: 2,
    },
    {
      label: "Leaning towards",
      value:
        {
          stamps: "A stamp per visit",
          points: "Points per peso",
          unsure: "Undecided — we will advise",
        }[draft.mechanic] ?? "Undecided — we will advise",
      step: 2,
    },
  ];

  return (
    <>
      {/* Laid out like the receipt the product prints: label, a dotted run,
          the value. Not decoration - it is the same object the merchant will
          hand a customer, which is the whole promise of the product. */}
      <dl className="grid gap-0.5">
        {lines.map((line) => (
          <div
            key={line.label}
            className="grid grid-cols-[auto_1fr_auto] items-baseline gap-2 rounded-lg px-1 py-1.5 transition hover:bg-[var(--paper)]"
          >
            <dt className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-[var(--muted)]">
              {line.label}
            </dt>
            <span aria-hidden="true" className="leader h-4 min-w-6" />
            <dd className="flex min-w-0 items-baseline gap-2">
              <span className="min-w-0 break-words text-right text-sm font-bold tabular-nums">
                {line.value || <span className="text-[var(--muted)]">not given</span>}
              </span>
              <button
                type="button"
                onClick={() => onEdit(line.step)}
                className="focus-ring shrink-0 rounded-md p-1 text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
              >
                <Pencil size={12} />
                <span className="sr-only">Edit {line.label.toLowerCase()}</span>
              </button>
            </dd>
          </div>
        ))}
      </dl>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
        <p className="flex items-center gap-2 text-sm font-extrabold">
          <ShieldCheck size={17} className="text-[var(--accent-strong)]" /> What
          happens after you send this
        </p>
        <ol className="mt-4 grid gap-3">
          {[
            ["We read it", "A person, usually the same working day."],
            [
              "We confirm the shop is yours",
              "Google Maps or your Facebook page — no documents to chase.",
            ],
            [
              "You get your sign-in",
              "By email, with your first program already set up to your answers.",
            ],
          ].map(([title, detail], index) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-[11px] font-extrabold">
                {index + 1}
              </span>
              <span className="text-sm">
                <strong className="font-extrabold">{title}.</strong>{" "}
                <span className="text-[var(--muted-strong)]">{detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-xs leading-relaxed text-[var(--muted-strong)]">
        Sending this does not commit you to anything, and there is no card to
        enter. By continuing you agree to our{" "}
        <a href="/terms" className="font-bold text-[var(--accent-strong)] underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="font-bold text-[var(--accent-strong)] underline">
          Privacy Policy
        </a>
        .
      </p>
    </>
  );
}

/**
 * After the send — and only now, the question that is ours rather than theirs.
 *
 * Asking "how did you hear about us" inside the form spends the merchant's
 * patience on our marketing. Asking it here, once the work is done, gets the
 * same answer for free.
 */
function Submitted({
  source,
  onSource,
}: {
  source: string;
  onSource: (value: string) => void;
}) {
  const [thanked, setThanked] = useState(false);

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="receipt-paper rounded-[var(--radius-card)] border border-[var(--line)] p-8 text-center shadow-diffuse sm:p-12">
        <span className="ink-stamp mx-auto grid size-16 rotate-[-7deg] place-items-center rounded-full text-[var(--success)] stamp-arrive">
          <Check size={28} strokeWidth={3.5} />
        </span>
        <h2 className="mt-8 text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl">
          Application sent.
        </h2>
        <p className="mx-auto mt-4 max-w-[40ch] text-[15px] leading-relaxed text-[var(--muted-strong)]">
          We read every one ourselves. Expect an email from a person, usually
          the same working day.
        </p>

        <div className="perforated mt-9 h-px" />

        <div className="mt-8 flex flex-wrap justify-center gap-6 text-left">
          {[
            [Clock3, "Usually same day", "Weekdays, Manila time."],
            [MapPin, "No documents", "We verify from your Maps or Facebook page."],
          ].map(([Icon, title, detail]) => {
            const Glyph = Icon as typeof Clock3;
            return (
              <p key={title as string} className="flex items-start gap-2.5">
                <Glyph size={17} className="mt-0.5 shrink-0 text-[var(--accent-strong)]" />
                <span className="text-sm">
                  <strong className="block font-extrabold">{title as string}</strong>
                  <span className="text-[var(--muted-strong)]">{detail as string}</span>
                </span>
              </p>
            );
          })}
        </div>
      </div>

      {!thanked ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-6">
          <p className="text-sm font-extrabold">
            One last thing, and it is for us rather than you.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
            How did you come across KYPStamping? It tells us where to keep
            showing up. Skip it freely.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Facebook or Instagram",
              "TikTok",
              "A friend or another owner",
              "Google",
              "Saw it in a shop",
              "Somewhere else",
            ].map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={source === option}
                onClick={() => {
                  onSource(option);
                  setThanked(true);
                }}
                className={`focus-ring rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                  source === option
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]"
                    : "border-[var(--line-strong)] bg-[var(--paper)] hover:-translate-y-0.5 hover:border-[var(--ink)]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p
          aria-live="polite"
          className="mt-6 rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-6 text-sm font-bold"
        >
          Noted — thank you. That genuinely helps.
        </p>
      )}

      {/* Visible because it is true. Remove this line when the POST is wired. */}
      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        Preview only — this form is not connected yet, so nothing was sent.
      </p>
    </div>
  );
}
