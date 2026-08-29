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
  PROGRAM_TYPES,
  STAFF_ROLES,
  type LocationInput,
  type ProfileInput,
  type ProgramInput,
} from "@kypstamping/api/forms";
import {
  changePlan,
  createLocation,
  keys,
  updateStaff,
  useApiMutation,
  type Billing,
  type BusinessLocation,
  type BusinessProfile,
  type StaffMember,
} from "@kypstamping/api";
import { Button, Dialog, FieldLabel } from "@kypstamping/ui";
import {
  useCreateProgram,
  useUpdateProfile,
  useUploadBrandingImage,
} from "@/components/mutations";

type Notify = (message: string, intent?: "info" | "review" | "error") => void;

/** One input, its label, and the message under it when it is wrong. */
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      {children}
      {error ? (
        <span role="alert" className="text-[11px] font-bold text-[var(--danger)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}

const inputClass =
  "min-h-11 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent-strong)]";

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
          <select {...form.register("type")} className={inputClass}>
            {PROGRAM_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </Field>
        <Field label="Name" error={form.formState.errors.name?.message}>
          <input
            {...form.register("name")}
            placeholder="Eight visits, pastry on us"
            className={inputClass}
          />
        </Field>
        <Field label="What the customer earns" error={form.formState.errors.rewardName?.message}>
          <input {...form.register("rewardName")} placeholder="Free pastry" className={inputClass} />
        </Field>
        <Field label="Visits to earn it" error={form.formState.errors.target?.message}>
          <input
            type="number"
            min={1}
            max={30}
            {...form.register("target", { valueAsNumber: true })}
            className={inputClass}
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
  const form = useForm<LocationInput>({
    resolver: zodResolver(locationSchema),
    defaultValues: { name: "", address: "", city: "" },
  });

  return (
    <Dialog title="Add a location" eyebrow="Business profile" onClose={onClose}>
      <form
        className="grid gap-5"
        onSubmit={form.handleSubmit((values) => {
          setBanner("");
          create.mutate(values, {
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
          <input {...form.register("name")} placeholder="Kapitolyo" className={inputClass} />
        </Field>
        <Field label="Street address" error={form.formState.errors.address?.message}>
          <input
            {...form.register("address")}
            placeholder="12 East Capitol Drive"
            className={inputClass}
          />
        </Field>
        <Field label="City" error={form.formState.errors.city?.message}>
          <input {...form.register("city")} placeholder="Pasig" className={inputClass} />
        </Field>
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
          <input {...form.register("name")} className={inputClass} />
        </Field>
        <Field
          label="Short name, shown to customers"
          error={form.formState.errors.shortName?.message}
        >
          <input {...form.register("shortName")} className={inputClass} />
        </Field>
        <Field label="Category" error={form.formState.errors.category?.message}>
          <input {...form.register("category")} className={inputClass} />
        </Field>
        <Field label="Storefront photo">
          <input
            type="file"
            // The same list the API enforces. Restating it here only changes
            // which files the picker offers - the check that matters is the
            // content-type one on the server.
            accept="image/png,image/jpeg,image/webp"
            className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--ink)] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[var(--paper)]`}
            disabled={uploadImage.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setBanner("");
              uploadImage.mutate(file, {
                onSuccess: () => notify("Storefront photo updated."),
                onError: (failure) => setBanner(failure.message),
              });
            }}
          />
        </Field>
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
        <label className="grid gap-2">
          <FieldLabel>Role</FieldLabel>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className={inputClass}
          >
            {STAFF_ROLES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <FieldLabel>Branch</FieldLabel>
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className={inputClass}
          >
            <option>All locations</option>
            {locations.map((branch) => (
              <option key={branch.id}>{branch.name}</option>
            ))}
          </select>
        </label>

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
  notify,
}: {
  current: string;
  onClose: () => void;
  notify: Notify;
}) {
  const upgrade = useApiMutation<Billing, string>(changePlan, {
    invalidates: [keys.business.billing(), keys.business.profile()],
  });
  const [banner, setBanner] = useState("");
  const currentIndex = PLANS.indexOf(current as (typeof PLANS)[number]);

  return (
    <Dialog title="Manage plan" eyebrow="Billing" onClose={onClose}>
      <div className="grid gap-3">
        <Banner message={banner} />
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
                <p className="mt-1 text-xs text-[var(--muted-strong)]">
                  {isCurrent
                    ? "Your plan"
                    : isDowngrade
                      ? "Below your plan"
                      : "Available now"}
                </p>
              </div>
              {!isCurrent && !isDowngrade && (
                <Button
                  type="button"
                  disabled={upgrade.isPending}
                  onClick={() =>
                    upgrade.mutate(plan, {
                      onSuccess: (billing) => {
                        notify(`Moved to ${billing.plan}.`);
                        onClose();
                      },
                      onError: (failure) => setBanner(failure.message),
                    })
                  }
                >
                  Upgrade
                </Button>
              )}
            </div>
          );
        })}
        <p className="text-[11px] leading-relaxed text-[var(--muted-strong)]">
          Downgrades are handled by support, so an allowance you are already
          using is never removed underneath you.
        </p>
      </div>
    </Dialog>
  );
}
