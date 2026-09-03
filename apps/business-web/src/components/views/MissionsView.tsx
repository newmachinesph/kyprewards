"use client";

import { useState } from "react";
import {
  createMission,
  isPreview,
  keys,
  updateMission,
  useApiMutation,
  useMissions,
  type Mission,
} from "@kypstamping/api";
import { Button, Eyebrow, Pill, PreviewNotice, QueryBoundary, ViewFrame } from "@kypstamping/ui";
import { longDate } from "@kypstamping/ui/format";
import { PlanTag } from "@kypstamping/ui/shell";
import { Target } from "lucide-react";
import { planFor, refusal, retryOnce, usePlanGate, writeBlock } from "@/lib/plan";
import { BlockedNote, Field, inputClass, isoDay, onlyDigits, type Notify } from "@/components/views/shared";

const GOALS: { value: Mission["goal"]; label: string; unit: string }[] = [
  { value: "visits", label: "Visit a number of times", unit: "visits" },
  { value: "items", label: "Try named items", unit: "items" },
  { value: "spend", label: "Spend an amount", unit: "pesos" },
];

const goalLabel = (mission: Mission) =>
  mission.goal === "items"
    ? `Try ${mission.targetCount}: ${mission.itemNames.join(", ")}`
    : `${mission.targetCount} ${mission.goal === "visits" ? "visits" : "pesos"}`;

export function MissionsView({ notify }: { notify: Notify }) {
  const gate = usePlanGate();
  const needed = planFor("Missions");
  const { data: missions = [], isPending, error, refetch } = useMissions();
  const preview = isPreview(missions);
  const blocked = writeBlock(gate, needed, preview);

  const create = useApiMutation(
    (body: Parameters<typeof createMission>[0]) => retryOnce(() => createMission(body)),
    { invalidates: [keys.levers.missions()] },
  );
  const end = useApiMutation(
    (id: string) => retryOnce(() => updateMission(id, { status: "ended" })),
    { invalidates: [keys.levers.missions()] },
  );

  const [name, setName] = useState("");
  const [goal, setGoal] = useState<Mission["goal"]>("visits");
  const [targetCount, setTargetCount] = useState("3");
  const [items, setItems] = useState("");
  const [startsOn, setStartsOn] = useState(isoDay(new Date()));
  const [endsOn, setEndsOn] = useState("");
  const [bonus, setBonus] = useState("");
  const [bonusUnits, setBonusUnits] = useState("1");
  const itemNames = items.split(",").map((item) => item.trim()).filter(Boolean);
  const ready =
    name.trim().length > 1 &&
    Number(targetCount) > 0 &&
    endsOn > startsOn &&
    bonus.trim() &&
    (goal !== "items" || itemNames.length >= Number(targetCount));

  return (
    <ViewFrame
      eyebrow="Earning more, on purpose"
      title="Missions"
      description="“Visit three times this month.” “Try the three new drinks.” A goal, a window and a bonus, with progress on the customer's card. The bonus arrives by itself."
      action={<PlanTag plan={needed} included={gate.covers(needed)} />}
    >
      {preview && <PreviewNotice feature="Missions" />}
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          <div className="border-b border-[var(--line)] p-5">
            <Eyebrow>Your missions</Eyebrow>
            <h2 className="mt-1 text-lg font-extrabold">Scheduled, live and ended</h2>
          </div>
          <QueryBoundary isPending={isPending} error={error} onRetry={refetch} label="missions">
            {missions.length === 0 ? (
              <p className="p-5 text-sm text-[var(--muted-strong)]">No missions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                      <th className="px-5 py-3">Mission</th>
                      <th className="px-4 py-3">Goal</th>
                      <th className="px-4 py-3">Window</th>
                      <th className="px-4 py-3">Bonus</th>
                      <th className="px-4 py-3">Progress</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {missions.map((mission) => (
                      <tr key={mission.id} className="border-b border-[var(--line)] last:border-0">
                        <td className="px-5 py-4">
                          <p className="text-sm font-extrabold">{mission.name}</p>
                          <div className="mt-1">
                            <Pill tone={mission.status === "live" ? "success" : mission.status === "scheduled" ? "warning" : "neutral"}>
                              {mission.status}
                            </Pill>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs">{goalLabel(mission)}</td>
                        <td className="px-4 py-4 text-xs text-[var(--muted-strong)]">
                          {longDate(mission.startsOn)} to {longDate(mission.endsOn)}
                        </td>
                        <td className="px-4 py-4 text-sm font-bold">{mission.bonus}</td>
                        <td className="px-4 py-4 text-xs">
                          {mission.completions} of {mission.participants} completed
                        </td>
                        <td className="px-4 py-4">
                          {mission.status !== "ended" && (
                            <Button
                              tone="quiet"
                              className="min-h-9 px-3 text-xs"
                              disabled={Boolean(blocked) || end.isPending}
                              title={blocked ?? undefined}
                              onClick={() =>
                                end.mutate(mission.id, {
                                  onSuccess: (saved) => notify(`${saved.name} ended. Earned bonuses stay.`),
                                  onError: (failure) => notify(refusal(failure, needed), "error"),
                                })
                              }
                            >
                              End early
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
          <h2 className="mt-1 text-lg font-extrabold">A new mission</h2>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (blocked || !ready) return;
              create.mutate(
                {
                  name: name.trim(),
                  goal,
                  targetCount: Number(targetCount),
                  itemNames: goal === "items" ? itemNames : [],
                  startsOn,
                  endsOn,
                  bonus: bonus.trim(),
                  bonusUnits: Number(bonusUnits) || 1,
                },
                {
                  onSuccess: (saved) => {
                    notify(`${saved.name} scheduled.`);
                    setName("");
                    setItems("");
                    setBonus("");
                  },
                  onError: (failure) => notify(refusal(failure, needed), "error"),
                },
              );
            }}
          >
            <Field label="Name">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Visit three times this month" className={inputClass} />
            </Field>
            <Field label="Goal">
              <select value={goal} onChange={(event) => setGoal(event.target.value as Mission["goal"])} className={inputClass}>
                {GOALS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
            <Field label={`Target, in ${GOALS.find((option) => option.value === goal)?.unit}`}>
              <input value={targetCount} onChange={(event) => setTargetCount(onlyDigits(event.target.value))} inputMode="numeric" className={inputClass} />
            </Field>
            {goal === "items" && (
              <Field label="Item names" hint="Comma separated, at least as many as the target.">
                <input value={items} onChange={(event) => setItems(event.target.value)} placeholder="Ube pandesal, Cheese ensaymada, Malunggay loaf" className={inputClass} />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts">
                <input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Ends">
                <input type="date" value={endsOn} min={startsOn} onChange={(event) => setEndsOn(event.target.value)} className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Field label="Bonus, in plain words">
                <input value={bonus} onChange={(event) => setBonus(event.target.value)} placeholder="+2 stamps" className={inputClass} />
              </Field>
              <Field label="Units">
                <input value={bonusUnits} onChange={(event) => setBonusUnits(onlyDigits(event.target.value))} inputMode="numeric" className={`${inputClass} w-20`} />
              </Field>
            </div>
            <Button type="submit" icon={<Target size={15} />} disabled={Boolean(blocked) || !ready || create.isPending} title={blocked ?? undefined}>
              {create.isPending ? "Saving…" : "Schedule mission"}
            </Button>
            <BlockedNote reason={blocked} />
          </form>
        </section>
      </div>
    </ViewFrame>
  );
}
