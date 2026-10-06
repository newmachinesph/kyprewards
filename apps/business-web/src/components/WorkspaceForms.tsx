"use client";

/**
 * The three workspace forms: a new program, a new branch, and the profile.
 *
 * Each was a `notify("… opened in demo mode")` with no dialog behind it. They
 * share one shape now — zod validates in the browser so a typo costs no round
 * trip, the API validates again because a client is not a trust boundary, and
 * `applyApiErrors` puts whatever the server refused back under the input that
 * caused it.
 *
 * `applyApiErrors` returns what it could not place. That is deliberate: a
 * field the server names but the form does not have is an error the user can
 * neither see nor fix, so it goes to the banner rather than nowhere.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  applyApiErrors,
  locationSchema,
  profileSchema,
  programSchema,
  zodResolver,
  LOCATION_STATUSES,
  PLAN_RANK,
  PROGRAM_TYPE_MIN_PLAN,
  PROGRAM_TYPES,
  STAFF_ROLES,
  type LocationInput,
  type ProfileInput,
  type ProgramInput,
} from "@kypstamping/api/forms";
import {
  createLocation,
  keys,
  updateStaff,
  useApiMutation,
  useBranding,
  useBusinessProfile,
  type BusinessLocation,
  type OpeningHours,
  type BusinessProfile,
  type StaffMember,
} from "@kypstamping/api";
import { ImageIcon } from "lucide-react";
import { splitRange, toDisplayTime } from "@kypstamping/ui/format";
import { BRAND_COLORS, Button, Dialog, FieldLabel, STAMP_ICONS, StampMark } from "@kypstamping/ui";
import { Field, Input, Select } from "@kypstamping/ui/form";
import {
  useCreateProgram,
  useSetBrandingColor,
  useSetStampIcon,
  useUpdateLocation,
  useUpdateProfile,
  useUploadBrandingImage,
  useUploadStampImage,
} from "@/components/mutations";

type Notify = (message: string, intent?: "info" | "review" | "error") => void;


/** The form-level message, for a refusal no single input owns. */
function Banner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl bg-[rgb(176_58_46/10%)] px-4 py-3 text-xs font-bold text-[var(--danger)]"
    >
      {message}
    </p>
  );
}

export function NewProgramDialog({
  onClose,
  notify,
}: {
  onClose: () => void;
  notify: Notify;
}) {
  const create = useCreateProgram();
  const { data: profile } = useBusinessProfile();
  const held = Math.max(0, PLAN_RANK.indexOf(profile?.plan ?? "Launch"));
  const [banner, setBanner] = useState("");
  const form = useForm<ProgramInput>({
    resolver: zodResolver(programSchema),
    defaultValues: { type: "Stamps", name: "", rewardName: "", target: 8 },
  });

  return (
    <Dialog title="New program" eyebrow="Loyalty engine" onClose={onClose}>
      <form
        className="grid gap-5"
        onSubmit={form.handleSubmit((values) => {
          setBanner("");
          create.mutate(values, {
            onSuccess: (program) => {
              notify(`${program.name} created as a draft.`);
              onClose();
            },
            onError: (failure) => {
              const unplaced = applyApiErrors(failure, form.setError, values);
              setBanner(
                unplaced.length
                  ? unplaced.map((item) => item.message).join(". ")
                  : failure.message,
              );
            },
          });
        })}
      >
        <Banner message={banner} />
        <Field label="Program type" error={form.formState.errors.type?.message}>
          <Select {...form.register("type")}>
            {PROGRAM_TYPES.map((type) => {
              const needs = PROGRAM_TYPE_MIN_PLAN[type];
              const locked = PLAN_RANK.indexOf(needs) > held;
              return (
                // Labelled but selectable, so a free shop could create a
                // Points program, save it as a Draft, and only discover on
                // Publish that its plan would never allow it - leaving dead
                // drafts behind. The onboarding wizard already disables these.
                <option key={type} value={type} disabled={locked}>
                  {/* A native option cannot hold PlanTag; same words. */}
                  {locked ? `${type} — ${needs} feature` : type}
                </option>
              );
            })}
          </Select>
        </Field>
        <Field label="Name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Eight visits, pastry on us" />
        </Field>
        <Field label="What the customer earns" error={form.formState.errors.rewardName?.message}>
          <Input {...form.register("rewardName")} placeholder="Free pastry" />
        </Field>
        <Field label="Visits to earn it" error={form.formState.errors.target?.message}>
          <Input
            type="number"
            min={1}
            max={30}
            {...form.register("target", { valueAsNumber: true })}
          />
        </Field>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button tone="quiet" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create program"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/* ── Opening hours ──────────────────────────────────────────────────────
   Stored as display pairs - [{days, time}] - because the backend does not
   reason about a schedule; it prints what the shop wrote. That makes a free
   text box tempting and wrong: five branches typing "9am-6pm", "9:00 AM –
   6:00 PM" and "Mon-Sun 9-6" is a directory that looks abandoned.

   So the shape is chosen and the string is composed. Days come from a list,
   the two ends come from native time inputs, and the pair is written in the
   one format kyp.ph renders. */

const DAY_SPANS = [
  "Mon – Sun",
  "Mon – Fri",
  "Mon – Sat",
  "Sat – Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

type HourRow = { days: string; open: string; close: string };

const toRows = (hours: OpeningHours[]): HourRow[] =>
  hours.map((entry) => ({ days: entry.days, ...splitRange(entry.time) }));

/** Rows back to what the API stores. Incomplete rows are dropped rather than
 *  written as "9:00 AM – ", which would render as a broken listing. */
const toHours = (rows: HourRow[]): OpeningHours[] =>
  rows
    .filter((row) => row.days && row.open && row.close)
    .map((row) => ({
      days: row.days,
      time: `${toDisplayTime(row.open)} – ${toDisplayTime(row.close)}`,
    }));

function HoursEditor({
  rows,
  onChange,
}: {
  rows: HourRow[];
  onChange: (rows: HourRow[]) => void;
}) {
  const set = (index: number, patch: Partial<HourRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <fieldset className="grid gap-2 border-0 p-0">
      <legend className="mb-2 text-xs font-extrabold text-[var(--ink)]">
        Opening hours
      </legend>
      <p className="-mt-1 mb-1 text-[11px] leading-relaxed text-[var(--muted-strong)]">
        Shown on your listing and on the shop page. Add a row per span — weekdays
        and weekends can differ, and each branch keeps its own.
      </p>

      {rows.length === 0 && (
        <p className="rounded-xl border border-dashed border-[var(--line-strong)] p-3 text-[11px] text-[var(--muted-strong)]">
          No hours set. Your listing says so rather than guessing.
        </p>
      )}

      {rows.map((row, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center">
          <Select
            aria-label="Days"
            value={row.days}
            onChange={(event) => set(index, { days: event.target.value })}
          >
            <option value="">Pick days</option>
            {DAY_SPANS.map((span) => (
              <option key={span} value={span}>
                {span}
              </option>
            ))}
          </Select>
          <Input
            type="time"
            aria-label="Opens"
            value={row.open}
            onChange={(event) => set(index, { open: event.target.value })}
          />
          <Input
            type="time"
            aria-label="Closes"
            value={row.close}
            onChange={(event) => set(index, { close: event.target.value })}
          />
          <Button
            tone="danger"
            size="sm"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
            aria-label={`Remove ${row.days || "this"} hours`}
          >
            Remove
          </Button>
        </div>
      ))}

      <Button
        tone="quiet"
        className="mt-1 w-fit"
        onClick={() => onChange([...rows, { days: "", open: "09:00", close: "18:00" }])}
      >
        <span aria-hidden="true">+</span> Add hours
      </Button>
    </fieldset>
  );
}

export function NewLocationDialog({
  onClose,
  notify,
}: {
  onClose: () => void;
  notify: Notify;
}) {
  const create = useApiMutation(createLocation, {
    // A branch changes the location list and the count on the profile screen.
    invalidates: [keys.business.locations(), keys.business.profile()],
  });
  const [banner, setBanner] = useState("");
  const [hours, setHours] = useState<HourRow[]>([]);
  const form = useForm<LocationInput>({
    resolver: zodResolver(locationSchema),
    defaultValues: { name: "", address: "", city: "", mapsLink: "" },
  });

  return (
    <Dialog title="Add a location" eyebrow="Business profile" onClose={onClose}>
      <form
        className="grid gap-5"
        onSubmit={form.handleSubmit((values) => {
          setBanner("");
          create.mutate({ ...values, hours: toHours(hours) }, {
            onSuccess: (branch) => {
              notify(`${branch.name} added. Its join code is ready to print.`);
              onClose();
            },
            onError: (failure) => {
              const unplaced = applyApiErrors(failure, form.setError, values);
              setBanner(
                unplaced.length
                  ? unplaced.map((item) => item.message).join(". ")
                  : failure.message,
              );
            },
          });
        })}
      >
        <Banner message={banner} />
        <Field label="Branch name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Kapitolyo" />
        </Field>
        <Field label="Street address" error={form.formState.errors.address?.message}>
          <Input {...form.register("address")} placeholder="12 East Capitol Drive" />
        </Field>
        <Field label="City" error={form.formState.errors.city?.message}>
          <Input {...form.register("city")} placeholder="Pasig" />
        </Field>
        <Field
          label="Google Maps link"
          hint="Optional. Share → Copy link in Google Maps. Customers tap it for directions."
          error={form.formState.errors.mapsLink?.message}
        >
          <Input
            {...form.register("mapsLink")}
            placeholder="https://maps.app.goo.gl/…"
            inputMode="url"
          />
        </Field>
        <HoursEditor rows={hours} onChange={setHours} />
        <div className="grid gap-2 sm:grid-cols-2">
          <Button tone="quiet" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Adding…" : "Add location"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function EditProfileDialog({
  profile,
  onClose,
  notify,
}: {
  profile: BusinessProfile;
  onClose: () => void;
  notify: Notify;
}) {
  const update = useUpdateProfile();
  const uploadImage = useUploadBrandingImage();
  const { data: branding } = useBranding();
  const setColor = useSetBrandingColor();
  const setStamp = useSetStampIcon();
  const uploadStamp = useUploadStampImage();
  // Branding is a Core feature and the API enforces it, but this dialog
  // offered the swatches anyway. Picking one 402'd into the banner, and then
  // Save profile cleared that banner, saved the unrelated profile fields,
  // reported success and closed - so the whole sequence read as "I chose
  // amber, it said saved, nothing changed."
  const brandingLocked = profile.plan === "Launch";
  const [banner, setBanner] = useState("");
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    // Seeded from what the API returned, so saving without touching a field
    // sends back what was already there rather than blanking it.
    defaultValues: {
      name: profile.name,
      shortName: profile.shortName,
      category: profile.category,
      timezone: profile.timezone,
      currency: profile.currency,
    },
  });

  return (
    <Dialog title="Business profile" eyebrow="Workspace" onClose={onClose}>
      <form
        className="grid gap-5"
        onSubmit={form.handleSubmit((values) => {
          setBanner("");
          update.mutate(values, {
            onSuccess: (saved) => {
              notify(`${saved.name} saved.`);
              onClose();
            },
            onError: (failure) => {
              const unplaced = applyApiErrors(failure, form.setError, values);
              setBanner(
                unplaced.length
                  ? unplaced.map((item) => item.message).join(". ")
                  : failure.message,
              );
            },
          });
        })}
      >
        <Banner message={banner} />
        <Field label="Registered name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} />
        </Field>
        <Field
          label="Short name, shown to customers"
          error={form.formState.errors.shortName?.message}
        >
          <Input {...form.register("shortName")} />
        </Field>
        <Field label="Category" error={form.formState.errors.category?.message}>
          <Input {...form.register("category")} />
        </Field>
        {/* A fieldset rather than the Field wrapper, which renders a <label>:
            the control here is itself a label for a hidden input, and a label
            inside a label is neither valid nor clickable.

            The native control was left visible, so the row read "Choose File
            | No file chosen" in the browser's own font next to five styled
            inputs - and it said "no file chosen" even for a shop that already
            had a photo, because a file input cannot show what is stored. The
            thumbnail is what answers that question. */}
        <fieldset className="grid gap-2">
          <legend className="mb-2">
            <FieldLabel>Storefront photo</FieldLabel>
          </legend>
          <div className="flex items-center gap-3">
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--line-strong)] bg-[var(--surface-2)]">
              {branding?.imageUrl ? (
                // A presigned storage URL, re-signed on each read and on a
                // host the image optimiser is not configured for.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <ImageIcon size={18} className="text-[var(--muted)]" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <label
                className={`focus-within:ring-2 focus-within:ring-[var(--accent)] inline-flex min-h-9 cursor-pointer items-center rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-xs font-extrabold transition hover:border-[var(--ink)] ${
                  uploadImage.isPending ? "cursor-wait opacity-60" : ""
                }`}
              >
                {uploadImage.isPending
                  ? "Uploading…"
                  : branding?.imageUrl
                    ? "Replace photo"
                    : "Choose photo"}
                <input
                  type="file"
                  // The same list the API enforces. Restating it here only
                  // changes which files the picker offers - the check that
                  // matters is the content-type one on the server.
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={uploadImage.isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setBanner("");
                    uploadImage.mutate(file, {
                      onSuccess: () => notify("Storefront photo updated."),
                      onError: (failure) => setBanner(failure.message),
                    });
                    // Cleared so choosing the same file twice fires a change
                    // again - after a failed upload, picking it once more is
                    // exactly what a person does.
                    event.target.value = "";
                  }}
                />
              </label>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--muted-strong)]">
                Shown on your kyp.ph listing, on every plan. PNG, JPG or WebP, up to 2 MB.
              </p>
            </div>
          </div>
        </fieldset>
        {/* What a collected stamp shows. The presets are ours and free on
            every plan; a mark of the shop's own is Core's, under the same
            "your own branding on the card" as the colour below. */}
        <fieldset className="grid gap-2">
          <legend className="mb-2">
            <FieldLabel>Stamp mark</FieldLabel>
          </legend>
          <div className="flex flex-wrap items-center gap-2">
            {(branding?.stampIcons ?? Object.keys(STAMP_ICONS)).map((icon) => {
              const active = !branding?.stampImageUrl && (branding?.stampIcon ?? "check") === icon;
              return (
                <button
                  key={icon}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Stamp with a ${icon}`}
                  disabled={setStamp.isPending}
                  className={`grid size-11 place-items-center rounded-full bg-[var(--accent)] text-[var(--ink)] transition disabled:opacity-45 ${
                    active ? "ring-2 ring-[var(--ink)] ring-offset-2" : "opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => {
                    setBanner("");
                    setStamp.mutate(icon, {
                      onSuccess: () => notify(`Stamps now show a ${icon}.`),
                      onError: (failure) => setBanner(failure.message),
                    });
                  }}
                >
                  <StampMark icon={icon} size={18} />
                </button>
              );
            })}
            <label
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-xs font-extrabold transition hover:border-[var(--ink)] focus-within:ring-2 focus-within:ring-[var(--accent)] ${
                uploadStamp.isPending || brandingLocked ? "cursor-not-allowed opacity-60" : ""
              }`}
            >
              {branding?.stampImageUrl && (
                <span className="grid size-7 place-items-center overflow-hidden rounded-full bg-[var(--accent)] ring-2 ring-[var(--ink)] ring-offset-2">
                  <StampMark imageUrl={branding.stampImageUrl} />
                </span>
              )}
              {uploadStamp.isPending
                ? "Uploading…"
                : branding?.stampImageUrl
                  ? "Replace your own"
                  : "Upload your own"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={uploadStamp.isPending || brandingLocked}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setBanner("");
                  uploadStamp.mutate(file, {
                    onSuccess: () => notify("Stamps now show your own mark."),
                    onError: (failure) => setBanner(failure.message),
                  });
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--muted-strong)]">
            {brandingLocked
              ? "Pick any of ours on Launch. Your own mark, clipped to the circle, opens with Core."
              : "A square PNG with a plain shape reads best: it is drawn at 28 px, clipped to the circle."}
          </p>
        </fieldset>
        {/* The other half of "custom branding". The photo was the only part
            with a control, so the colour token the API stores and the wallet
            card reads could not be changed from anywhere in the product. */}
        {/* A fieldset, not the Field wrapper: that renders a <label>, and a
            label around several buttons hands its whole text to the first one
            as an accessible name ("Card colour Amber Green Paper"). */}
        <fieldset className="grid gap-2">
          <legend className="mb-2">
            <FieldLabel>Card colour</FieldLabel>
            {brandingLocked && (
              <p className="text-[11px] font-semibold text-[var(--muted-strong)]">
                Your card stays on the default until you move to Core.
              </p>
            )}
          </legend>
          <div className="flex flex-wrap gap-2">
            {Object.entries(BRAND_COLORS).map(([token, swatch]) => {
              const active = (branding?.color ?? "ink") === token;
              return (
                <button
                  key={token}
                  type="button"
                  aria-pressed={active}
                  disabled={setColor.isPending || brandingLocked}
                  title={swatch.label}
                  className={`min-h-11 rounded-xl border px-4 text-xs font-extrabold transition disabled:opacity-45 ${
                    active
                      ? "border-[var(--ink)] ring-2 ring-[var(--accent)] ring-offset-2"
                      : "border-[var(--line-strong)] hover:border-[var(--ink)]"
                  }`}
                  style={{ background: swatch.background, color: swatch.foreground }}
                  onClick={() => {
                    setBanner("");
                    setColor.mutate(token, {
                      onSuccess: () => notify(`Card colour set to ${swatch.label}.`),
                      onError: (failure) => setBanner(failure.message),
                    });
                  }}
                >
                  {swatch.label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button tone="quiet" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/**
 * A branch's name, address and whether it is trading.
 *
 * Status is the field that matters: a closed branch that still shows as Live
 * sends customers to a shuttered door, and the only way to change it was a
 * toast that said the settings had opened.
 */
export function EditLocationDialog({
  location,
  onClose,
  notify,
}: {
  location: BusinessLocation;
  onClose: () => void;
  notify: Notify;
}) {
  const update = useUpdateLocation();
  const [banner, setBanner] = useState("");
  const [status, setStatus] = useState(location.status);
  const [hours, setHours] = useState<HourRow[]>(() => toRows(location.hours));
  const form = useForm<LocationInput>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location.name,
      address: location.address,
      city: location.city,
      mapsLink: location.mapsLink,
    },
  });

  return (
    <Dialog title={location.name} eyebrow="Location" onClose={onClose}>
      <form
        className="grid gap-5"
        onSubmit={form.handleSubmit((values) => {
          setBanner("");
          update.mutate(
            { id: location.id, ...values, status, hours: toHours(hours) },
            {
              onSuccess: (saved) => {
                notify(`${saved.name} saved.`);
                onClose();
              },
              onError: (failure) => {
                const unplaced = applyApiErrors(failure, form.setError, values);
                setBanner(
                  unplaced.length
                    ? unplaced.map((item) => item.message).join(". ")
                    : failure.message,
                );
              },
            },
          );
        })}
      >
        <Banner message={banner} />
        <Field label="Branch name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} />
        </Field>
        <Field label="Street address" error={form.formState.errors.address?.message}>
          <Input {...form.register("address")} />
        </Field>
        <Field label="City" error={form.formState.errors.city?.message}>
          <Input {...form.register("city")} />
        </Field>
        <Field
          label="Google Maps link"
          hint="Optional. Share → Copy link in Google Maps. Customers tap it for directions."
          error={form.formState.errors.mapsLink?.message}
        >
          <Input
            {...form.register("mapsLink")}
            placeholder="https://maps.app.goo.gl/…"
            inputMode="url"
          />
        </Field>
        <HoursEditor rows={hours} onChange={setHours} />
        <Field label="Status">
          <Select
            value={status}
            onChange={(event) => setStatus(event.target.value as BusinessLocation["status"])}
          >
            {LOCATION_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button tone="quiet" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save location"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/**
 * A staff member's role, branch and standing.
 *
 * Suspension is the one that matters: the API checks a member's status on
 * every request, so suspending someone takes effect on their next action
 * rather than when their session happens to expire. The API also refuses to
 * remove the last owner, and that refusal lands in the banner.
 */
export function EditStaffDialog({
  member,
  locations,
  onClose,
  notify,
}: {
  member: StaffMember;
  locations: BusinessLocation[];
  onClose: () => void;
  notify: Notify;
}) {
  const update = useApiMutation(
    ({ id, patch }: { id: string; patch: { role?: string; location?: string; status?: string } }) =>
      updateStaff(id, patch),
    { invalidates: [keys.business.staff()] },
  );
  const [banner, setBanner] = useState("");
  const [role, setRole] = useState(member.role);
  const [location, setLocation] = useState(member.location);
  const suspended = member.status === "Suspended";

  function save(patch: { role?: string; location?: string; status?: string }) {
    setBanner("");
    update.mutate(
      { id: member.id, patch },
      {
        onSuccess: (saved) => {
          notify(`${saved.name} updated.`);
          onClose();
        },
        onError: (failure) => setBanner(failure.message),
      },
    );
  }

  return (
    <Dialog title={member.name} eyebrow="Staff & access" onClose={onClose}>
      <div className="grid gap-5">
        <Banner message={banner} />
        <Field label="Role">
          <Select value={role} onChange={(event) => setRole(event.target.value)}>
            {STAFF_ROLES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field label="Branch">
          <Select value={location} onChange={(event) => setLocation(event.target.value)}>
            <option>All locations</option>
            {locations.map((branch) => (
              <option key={branch.id}>{branch.name}</option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button tone="quiet" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={update.isPending}
            onClick={() => save({ role, location })}
          >
            {update.isPending ? "Saving…" : "Save access"}
          </Button>
        </div>

        <div className="border-t border-[var(--line)] pt-5">
          <p className="text-xs leading-relaxed text-[var(--muted-strong)]">
            {suspended
              ? "A suspended member cannot sign in or stamp. Restoring takes effect immediately."
              : "Suspending takes effect on their next request, not when their session expires."}
          </p>
          <Button
            tone="quiet"
            type="button"
            className="mt-3 w-full"
            disabled={update.isPending}
            onClick={() => save({ status: suspended ? "Active" : "Suspended" })}
          >
            {suspended ? "Restore access" : "Suspend this member"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** The four published plans, in the order they cost money. */
const PLANS = ["Launch", "Core", "Grow", "Scale"] as const;

/**
 * Upgrades only.
 *
 * The API refuses a downgrade rather than silently dropping allowances a
 * merchant is already using, so the plans below the current one are shown as
 * where they are rather than offered as a choice.
 */
export function ChangePlanDialog({
  current,
  onClose,
}: {
  current: string;
  onClose: () => void;
}) {
  const currentIndex = PLANS.indexOf(current as (typeof PLANS)[number]);

  return (
    <Dialog title="Manage plan" eyebrow="Billing" onClose={onClose}>
      <div className="grid gap-3">
        {PLANS.map((plan, index) => {
          const isCurrent = index === currentIndex;
          const isDowngrade = index < currentIndex;
          return (
            <div
              key={plan}
              className={`flex items-center gap-4 rounded-2xl border p-4 ${
                isCurrent ? "border-[var(--ink)]" : "border-[var(--line)]"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">{plan}</p>
                {/* The paid tiers are published so a merchant can see where
                    this goes - the pricing page marks them "Coming soon" -
                    and nothing can be bought yet. This said "Available now"
                    beside a working Upgrade button that changed the
                    subscription on the spot: one click, no price shown, no
                    payment taken, and the same on the way back down. */}
                <p className="mt-1 text-xs text-[var(--muted-strong)]">
                  {isCurrent
                    ? "Your plan"
                    : isDowngrade
                      ? "Below your plan"
                      : "Coming soon"}
                </p>
              </div>
            </div>
          );
        })}
        <p className="text-[11px] leading-relaxed text-[var(--muted-strong)]">
          The paid plans are not open for sign-up yet. We will email you before
          they are, and nothing about your workspace changes in the meantime.
        </p>
      </div>
    </Dialog>
  );
}
