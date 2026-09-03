"use client";

import { useState } from "react";
import {
  createBonusWindow,
  isPreview,
  keys,
  updateBonusWindow,
  useApiMutation,
  useBonusWindows,
  useLocations,
  usePrograms,
  type BonusWindow,
} from "@kypstamping/api";
import { Button, Eyebrow, Pill, PreviewNotice, QueryBoundary, ViewFrame } from "@kypstamping/ui";
import { longDate, pesoFromCentavos } from "@kypstamping/ui/format";
import { PlanTag } from "@kypstamping/ui/shell";
import { Plus } from "lucide-react";
import { planFor, refusal, retryOnce, usePlanGate, writeBlock } from "@/lib/plan";
import {
  BlockedNote,
  Field,
  inputClass,
  isoDay,
  onlyDigits,
  type Notify,
} from "@/components/views/shared";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const HOURS = Array.from({ length: 25 }, (_, hour) => hour);

const hourLabel = (hour: number) => {
  if (hour === 24) return "midnight";
  const suffix = hour < 12 ? "AM" : "PM";
  return `${hour % 12 === 0 ? 12 : hour % 12} ${suffix}`;
};

const scheduleOf = (window: BonusWindow) =>
  `${window.days.length ? window.days.join(", ") : "Every day"} · ${hourLabel(window.fromHour)}–${hourLabel(window.toHour)}`;

const statusTone = (status: BonusWindow["status"]) =>
  status === "live" ? "success" : status === "scheduled" ? "warning" : "neutral";

export function BonusWindowsView({ notify }: { notify: Notify }) {
  const gate = usePlanGate();
  const needed = planFor("Bonus windows");
  const { data: windows = [], isPending, error, refetch } = useBonusWindows();
  const { data: programs = [] } = usePrograms();
  const { data: locations = [] } = useLocations();
  const preview = isPreview(windows);
  const blocked = writeBlock(gate, needed, preview);
  const stampCard = programs.find((program) => program.type === "Stamps" && program.status === "Live");

  const create = useApiMutation(
    (body: Parameters<typeof createBonusWindow>[0]) => retryOnce(() => createBonusWindow(body)),
    { invalidates: [keys.levers.bonusWindows()] },
  );
  const update = useApiMutation(
    ({ id, ...body }: { id: string } & Partial<BonusWindow>) =>
      retryOnce(() => updateBonusWindow(id, body)),
    { invalidates: [keys.levers.bonusWindows()] },
  );

  const [name, setName] = useState("");
  const [multiplier, setMultiplier] = useState(2);
  const [customMultiplier, setCustomMultiplier] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [fromHour, setFromHour] = useState(14);
  const [toHour, setToHour] = useState(16);
  const [startsOn, setStartsOn] = useState(isoDay(new Date()));
  const [endsOn, setEndsOn] = useState("");
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [expectedStamps, setExpectedStamps] = useState("");

  const effectiveMultiplier =
    multiplier === 0 ? Number.parseFloat(customMultiplier) || 0 : multiplier;
  // ponytail: the estimate is the extra stamps the window grants, priced at
  // the reward's value spread over the target. Labelled an estimate on screen.
  const stamps = Number(expectedStamps) || 0;
  const bonusStamps = Math.round(stamps * Math.max(0, effectiveMultiplier - 1));
  const estimateCentavos =
    stampCard && stampCard.target > 0
      ? Math.round((bonusStamps * stampCard.rewardValueCentavos) / stampCard.target)
      : 0;
  const ready = name.trim().length > 1 && effectiveMultiplier > 1 && startsOn && fromHour < toHour;

  return (
    <ViewFrame
      eyebrow="Earning more, on purpose"
      title="Bonus windows"
      description="Double stamps from 2 to 4 on a Tuesday, triple through the Ber months, extra on a slow branch. A schedule, a multiplier and an end date; the customer sees it on their card before they queue."
      action={<PlanTag plan={needed} included={gate.covers(needed)} />}
    >
      {preview && <PreviewNotice feature="Bonus windows" />}
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <Eyebrow>Your windows</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">Scheduled, live and ended</h2>
          </div>
          <QueryBoundary isPending={isPending} error={error} onRetry={refetch} label="bonus windows">
            {windows.length === 0 ? (
              <p className="p-5 text-sm text-[var(--muted-strong)]">
                No bonus windows yet. Compose one and it shows on every card before it starts.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      <th className="px-5 py-3">Window</th>
                      <th className="px-4 py-3">Schedule</th>
                      <th className="px-4 py-3">Multiplier</th>
                      <th className="px-4 py-3">Branches</th>
                      <th className="px-4 py-3">Stamps granted</th>
                      <th className="px-4 py-3">Estimated cost</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {windows.map((window) => (
                      <tr key={window.id} className="border-b border-[var(--line)] last:border-0">
                        <td className="px-5 py-4">
                          <p className="text-sm font-extrabold">{window.name}</p>
                          <div className="mt-1">
                            <Pill tone={statusTone(window.status)}>{window.status}</Pill>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                          {scheduleOf(window)}
                          <br />
                          {longDate(window.startsOn)}
                          {window.endsOn ? ` to ${longDate(window.endsOn)}` : ", no end date"}
                        </td>
                        <td className="px-4 py-4 text-sm font-extrabold">{window.multiplier}×</td>
                        <td className="px-4 py-4 text-xs">
                          {window.branchIds
                            ? window.branchIds
                                .map((id) => locations.find((branch) => branch.id === id)?.name ?? id)
                                .join(", ")
                            : "Every branch"}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold">{window.stampsGranted}</td>
                        <td className="px-4 py-4 text-sm font-bold">
                          {pesoFromCentavos(window.estimatedCostCentavos)}
                        </td>
                        <td className="px-4 py-4">
                          {window.status !== "ended" && (
                            <Button
                              tone="quiet"
                              className="min-h-9 px-3 text-xs"
                              disabled={Boolean(blocked) || update.isPending}
                              title={blocked ?? undefined}
                              onClick={() =>
                                update.mutate(
                                  {
                                    id: window.id,
                                    status: window.status === "paused" ? "live" : "paused",
                                  },
                                  {
                                    onSuccess: (saved) => notify(`${saved.name} is ${saved.status}.`),
                                    onError: (failure) => notify(refusal(failure, needed), "error"),
                                  },
                                )
                              }
                            >
                              {window.status === "paused" ? "Resume" : "Pause"}
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

        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <Eyebrow>Composer</Eyebrow>
          <h2 className="mt-1 text-lg font-extrabold">A new window</h2>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (blocked || !ready) return;
              create.mutate(
                {
                  name: name.trim(),
                  multiplier: effectiveMultiplier,
                  days,
                  fromHour,
                  toHour,
                  startsOn,
                  endsOn: endsOn || null,
                  branchIds: branchIds.length ? branchIds : null,
                },
                {
                  onSuccess: (saved) => {
                    notify(`${saved.name} scheduled.`);
                    setName("");
                    setExpectedStamps("");
                  },
                  onError: (failure) => notify(refusal(failure, needed), "error"),
                },
              );
            }}
          >
            <Field label="Name">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Double stamps, slow afternoons"
                className={inputClass}
              />
            </Field>
            <fieldset>
              <legend className="text-xs font-bold">Multiplier</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {[2, 3, 0].map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={multiplier === option}
                    onClick={() => setMultiplier(option)}
                    className={`min-h-10 rounded-full px-4 text-xs font-bold ${multiplier === option ? "bg-[var(--ink)] text-[var(--paper)]" : "border border-[var(--line-strong)]"}`}
                  >
                    {option === 0 ? "Custom" : `${option}× stamps`}
                  </button>
                ))}
                {multiplier === 0 && (
                  <input
                    aria-label="Custom multiplier"
                    value={customMultiplier}
                    onChange={(event) => setCustomMultiplier(event.target.value.replace(/[^0-9.]/g, ""))}
                    inputMode="decimal"
                    placeholder="1.5"
                    className={`${inputClass} max-w-24`}
                  />
                )}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-xs font-bold">Days</legend>
              <p className="mt-1 text-[10px] font-semibold text-[var(--muted)]">
                None selected means every day.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DAYS.map((day) => {
                  const on = days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setDays((current) =>
                          on ? current.filter((entry) => entry !== day) : [...current, day],
                        )
                      }
                      className={`min-h-9 rounded-full px-3 text-xs font-bold ${on ? "bg-[var(--accent)] text-[var(--ink)]" : "border border-[var(--line-strong)]"}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <select value={fromHour} onChange={(event) => setFromHour(Number(event.target.value))} className={inputClass}>
                  {HOURS.slice(0, 24).map((hour) => (
                    <option key={hour} value={hour}>{hourLabel(hour)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Until">
                <select value={toHour} onChange={(event) => setToHour(Number(event.target.value))} className={inputClass}>
                  {HOURS.slice(1).map((hour) => (
                    <option key={hour} value={hour}>{hourLabel(hour)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Starts">
                <input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Ends" hint="Leave empty for no end date.">
                <input type="date" value={endsOn} min={startsOn} onChange={(event) => setEndsOn(event.target.value)} className={inputClass} />
              </Field>
            </div>
            {locations.length > 1 && (
              <fieldset>
                <legend className="text-xs font-bold">Branches</legend>
                <p className="mt-1 text-[10px] font-semibold text-[var(--muted)]">
                  None selected means every branch.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {locations.map((branch) => {
                    const on = branchIds.includes(branch.id);
                    return (
                      <button
                        key={branch.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          setBranchIds((current) =>
                            on ? current.filter((id) => id !== branch.id) : [...current, branch.id],
                          )
                        }
                        className={`min-h-9 rounded-full px-3 text-xs font-bold ${on ? "bg-[var(--accent)] text-[var(--ink)]" : "border border-[var(--line-strong)]"}`}
                      >
                        {branch.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
            <Field
              label="Stamps you expect inside the window"
              hint="Your guess; the estimate below follows it."
            >
              <input
                value={expectedStamps}
                onChange={(event) => setExpectedStamps(onlyDigits(event.target.value))}
                inputMode="numeric"
                placeholder="120"
                className={inputClass}
              />
            </Field>
            <div className="rounded-2xl bg-[var(--paper)] p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
                Cost preview · estimate
              </p>
              {stampCard ? (
                <>
                  <p className="mt-2 text-2xl font-extrabold">{pesoFromCentavos(estimateCentavos)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--muted-strong)]">
                    {bonusStamps} extra stamp{bonusStamps === 1 ? "" : "s"} × {pesoFromCentavos(stampCard.rewardValueCentavos)} reward ÷ {stampCard.target} to earn it, on {stampCard.name}. An estimate, not a bill.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs text-[var(--muted-strong)]">
                  A live stamp card is needed to price a window.
                </p>
              )}
            </div>
            <Button
              type="submit"
              icon={<Plus size={15} />}
              disabled={Boolean(blocked) || !ready || create.isPending}
              title={blocked ?? undefined}
            >
              {create.isPending ? "Scheduling…" : "Switch it on"}
            </Button>
            <BlockedNote reason={blocked} />
          </form>
        </section>
      </div>
    </ViewFrame>
  );
}
