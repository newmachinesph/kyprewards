"use client";

import { useState } from "react";
import {
  isPreview,
  keys,
  purchaseFeaturedPlacement,
  useApiMutation,
  useBilling,
  useBranding,
  useBusinessProfile,
  useFeaturedPlacement,
  useLocations,
  usePrograms,
  type QrPayment,
} from "@kypstamping/api";
import { brandColor, Button, Eyebrow, Pill, PreviewBadge, StampDots } from "@kypstamping/ui";
import { longDate, pesoFromCentavos } from "@kypstamping/ui/format";
import { PlanTag } from "@kypstamping/ui/shell";
import { Clock3, MapPin, Sparkles } from "lucide-react";
import { planFor, refusal, retryOnce, usePlanGate } from "@/lib/plan";
import { addOns } from "@/lib/plans";
import { PaymentSheet } from "@/components/views/PaymentSheet";
import { BlockedNote, type Notify } from "@/components/views/shared";

/**
 * The shop as Discover shows it, and the featured placement above the
 * distance ordering. Listing is on every plan; featured is Grow or an add-on.
 */
export function DiscoverPanel({ notify }: { notify: Notify }) {
  const gate = usePlanGate();
  const featuredPlan = planFor("Featured placement in Discover");
  const { data: profile } = useBusinessProfile();
  const { data: branding } = useBranding();
  const { data: locations = [] } = useLocations();
  const { data: programs = [] } = usePrograms();
  const { data: billing } = useBilling();
  const { data: featured } = useFeaturedPlacement();
  const [sheet, setSheet] = useState<QrPayment | null>(null);
  const buy = useApiMutation(() => retryOnce(() => purchaseFeaturedPlacement()), {
    invalidates: [keys.levers.featured(), keys.business.billing()],
  });

  const first = locations[0];
  const live = programs.find((program) => program.status === "Live");
  const preview = isPreview(featured);
  const included = gate.covers(featuredPlan);
  const addOn = addOns.find((entry) => entry.name === "Featured in Discover");
  const blocked = included
    ? "Included on your plan"
    : billing?.creditPurchasesOpen !== true || preview
      ? "Opens with billing"
      : null;
  const color = brandColor(branding?.color ?? "ink");

  return (
    <section className="mt-3 grid gap-3 lg:grid-cols-[0.75fr_1.25fr]">
      <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex items-center justify-between gap-2">
          <Eyebrow>Your shop in Discover</Eyebrow>
          <PlanTag plan="Launch" included />
        </div>
        <p className="mt-1 text-xs text-[var(--muted-strong)]">
          Every shop with a live program is findable in the customer app, by category and neighborhood, on every plan.
        </p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)]">
          <div className="grid h-28 place-items-center" style={{ background: color.background, color: color.foreground }}>
            {branding?.imageUrl ? (
              // A presigned storage URL on a host the image optimiser is not
              // configured for, and it changes every time it is signed.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.imageUrl} alt="" width={600} height={300} className="size-full object-cover" />
            ) : (
              <span className="text-xs font-bold opacity-70">{profile?.shortName ?? ""}</span>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold">{profile?.shortName ?? "Your shop"}</p>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {profile?.category ?? ""}
                  {first ? ` · ${first.city}` : ""}
                </p>
              </div>
              {featured?.active && <Pill tone="warning">Featured</Pill>}
            </div>
            <p className="mt-3 text-xs font-bold">
              {live ? `${live.target} ${live.target === 1 ? "visit" : "visits"} → ${live.rewardName}` : "No live program: not listed yet"}
            </p>
            {live && live.type === "Stamps" && (
              <div className="mt-2 overflow-x-auto">
                <StampDots filled={0} total={live.target} />
              </div>
            )}
            {/* One icon per line, and no line without content. A branch is
                provisioned with an empty address, so the pin used to sit
                beside nothing while the hours dropped to a second line with
                no icon of their own. Both are worth prompting for: they are
                what a shopper reads before deciding to walk over. */}
            {first && (
              <div className="mt-3 grid gap-1.5 text-[11px] text-[var(--muted-strong)]">
                {first.address ? (
                  <span className="flex items-start gap-2">
                    <MapPin size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {first.address}
                  </span>
                ) : (
                  <span className="flex items-start gap-2 text-[var(--muted)]">
                    <MapPin size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                    No street address yet — add one so shoppers can find the door.
                  </span>
                )}
                {first.hours.length > 0 ? (
                  <span className="flex items-start gap-2">
                    <Clock3 size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {first.hours.map((hours) => `${hours.days} ${hours.time}`).join(" · ")}
                  </span>
                ) : (
                  <span className="flex items-start gap-2 text-[var(--muted)]">
                    <Clock3 size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                    No opening hours yet — your listing cannot say whether you are open.
                  </span>
                )}
              </div>
            )}
            {locations.length > 1 && (
              <p className="mt-2 text-[10px] text-[var(--muted)]">and {locations.length - 1} more branch{locations.length - 1 === 1 ? "" : "es"}</p>
            )}
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-[var(--accent-strong)]" />
            <Eyebrow>Featured placement</Eyebrow>
          </div>
          <span className="flex items-center gap-2">
            {preview && <PreviewBadge />}
            <PlanTag plan={featuredPlan} included={included} />
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted-strong)]">
          {addOn?.detail}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Status", featured ? (featured.active ? "Active" : "Not featured") : "—"],
            ["How", featured?.source === "plan" ? "Included on your plan" : featured?.source === "addon" ? "Add-on" : "—"],
            ["Renews", featured?.renewsOn ? longDate(featured.renewsOn) : "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[var(--paper)] p-3">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted)]">{label}</p>
              <p className="mt-1 text-sm font-bold">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            disabled={Boolean(blocked) || buy.isPending}
            title={blocked ?? undefined}
            onClick={() =>
              buy.mutate(undefined, {
                onSuccess: setSheet,
                onError: (failure) => notify(refusal(failure), "error"),
              })
            }
          >
            {buy.isPending ? "Preparing…" : `Buy for ${addOn?.price ?? (featured ? pesoFromCentavos(featured.priceCentavos) : "")}`}
          </Button>
          <BlockedNote reason={blocked} />
        </div>
      </article>
      {sheet && <PaymentSheet intent={sheet} title="Featured in Discover" onClose={() => setSheet(null)} />}
    </section>
  );
}
