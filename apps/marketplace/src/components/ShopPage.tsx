"use client";

import Link from "next/link";
import { isPreview, usePublicShop, type PublicBranch, type PublicShop } from "@kypstamping/api";
import { Pill, PreviewBadge, QueryBoundary, StampDots } from "@kypstamping/ui";
import { ArrowUpRight, Clock, MapPin, Navigation } from "lucide-react";
import { customerAppUrl, siteUrl } from "@/lib/site";
import { categoryPath, neighborhoodPath, shopPath } from "@/lib/routes";
import { OpenDot, whereLine } from "./ShopCard";
import { StructuredData } from "./StructuredData";

const joinUrl = (branch: Pick<PublicBranch, "slug">) =>
  `${customerAppUrl}/join/${encodeURIComponent(branch.slug)}`;

const walletUrl = `${customerAppUrl}/login`;

export function ShopPage({ slug, initial }: { slug: string; initial?: PublicShop }) {
  const shop = usePublicShop(slug, { initialData: initial });
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px] py-10 lg:py-14">
        <QueryBoundary
          isPending={shop.isPending}
          error={shop.error}
          onRetry={() => void shop.refetch()}
          label="the shop"
          rows={5}
        >
          {shop.data && <ShopBody shop={shop.data} />}
        </QueryBoundary>
      </div>
    </div>
  );
}

function ShopBody({ shop }: { shop: PublicShop }) {
  const firstBranch = shop.branches[0];
  const joinHref = joinUrl(firstBranch ?? { slug: shop.slug });
  const oneBranch = shop.branches.length <= 1;

  return (
    <article className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: shop.name,
          ...(shop.about ? { description: shop.about } : {}),
          url: `${siteUrl}${shopPath(shop.slug)}`,
          ...(shop.image ? { image: shop.image } : {}),
          address: {
            "@type": "PostalAddress",
            streetAddress: shop.address,
            addressLocality: shop.city,
            addressCountry: "PH",
          },
          openingHours: shop.hours.map((h) => `${h.days} ${h.time}`),
        }}
      />

      <div>
        <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-[var(--ink)]">
          {shop.image ? (
            // Out of flow, or the banner takes the photo's shape instead of
            // 16:7 - see the note in ShopCard.
            // eslint-disable-next-line @next/next/no-img-element -- the API names the host; next/image needs it configured
            <img src={shop.image} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span
              aria-hidden="true"
              className="font-display absolute inset-0 grid place-items-center text-7xl font-bold text-[var(--paper)]/30"
            >
              {shop.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href={categoryPath(shop.category)}
            className="focus-ring rounded-full bg-[var(--surface-2)] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted-strong)]"
          >
            {shop.category}
          </Link>
          {shop.featured && <Pill tone="warning">Featured</Pill>}
          {isPreview(shop) && <PreviewBadge />}
        </div>
        <h1 className="mt-3 text-4xl font-bold leading-[1.02] tracking-[-0.02em] sm:text-5xl">
          {shop.name}
        </h1>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--muted-strong)]">
          <OpenDot open={shop.open} />
          <span aria-hidden="true">·</span>
          <Link href={neighborhoodPath(shop.neighborhood)} className="focus-ring rounded-md underline-offset-2 hover:underline">
            {whereLine(shop)}
          </Link>
        </p>

        {/* A merchant who has not written their paragraph yet gets no heading
            at all. Every live shop's `about` is empty until they fill it in
            from Discover in the business app, and an "About" with nothing
            under it reads as a broken page rather than an empty field. */}
        {shop.about && (
          <section className="mt-8">
            <h2 className="text-lg font-bold tracking-[-0.01em]">About</h2>
            <p className="mt-2 max-w-[62ch] text-base leading-relaxed text-[var(--ink-soft)]">
              {shop.about}
            </p>
          </section>
        )}

        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.01em]">
            <Clock size={18} aria-hidden="true" /> Hours
          </h2>
          <dl className="mt-3 grid max-w-[420px] gap-1.5 text-sm">
            {shop.hours.map((h) => (
              <div key={h.days} className="flex justify-between gap-6">
                <dt className="text-[var(--muted-strong)]">{h.days}</dt>
                <dd className="font-semibold">{h.time}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.01em]">
            <MapPin size={18} aria-hidden="true" />
            {oneBranch ? "Where" : `${shop.branches.length} branches`}
          </h2>
          <ul className="mt-3 grid gap-3">
            {shop.branches.map((branch) => (
              <li
                key={branch.slug}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"
              >
                <div>
                  <p className="font-bold">{branch.name}</p>
                  <p className="mt-0.5 text-sm text-[var(--muted-strong)]">{branch.address}</p>
                  <p className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-[var(--muted-strong)]">
                    <OpenDot open={branch.open} />
                  </p>
                  {/* Only when the merchant pasted one. An address describes
                      where a shop is; this walks somebody to the door. */}
                  {branch.mapsLink && (
                    <a
                      href={branch.mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ring mt-2 inline-flex items-center gap-1.5 text-xs font-extrabold underline underline-offset-4"
                    >
                      <Navigation size={13} aria-hidden="true" /> Get directions
                    </a>
                  )}
                </div>
                <a
                  href={joinUrl(branch)}
                  className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--ink)] px-5 text-sm font-extrabold transition hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                >
                  Join here <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              </li>
            ))}
            {shop.branches.length === 0 && (
              <li className="text-sm text-[var(--muted-strong)]">{shop.address}</li>
            )}
          </ul>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-7">
          <p className="font-mono text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--muted)]">
            {shop.program ?? "Stamp card"}
          </p>
          <p className="mt-2 text-2xl font-bold leading-tight tracking-[-0.02em]">{shop.reward}</p>
          {/* A stamp card has a target; a points shop has none, and read
              "0 visits fills the card" over an empty row of dots. */}
          {shop.target > 0 ? (
            <>
              <div className="mt-5 overflow-x-auto pb-1">
                <StampDots
                  filled={0}
                  total={shop.target}
                  icon={shop.stampIcon}
                  imageUrl={shop.stampImageUrl}
                />
              </div>
              <p className="mt-3 text-sm text-[var(--muted-strong)]">
                {shop.target} {shop.target === 1 ? "visit" : "visits"} fills the card. Join from the
                poster at the counter; if the shop offers a welcome stamp, it lands marked pending and
                becomes real on your first visit.
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted-strong)]">
              Every visit earns toward the reward above. Join from the poster at the counter.
            </p>
          )}
          <div className="mt-6 grid gap-2">
            <a
              href={joinHref}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--accent)] bg-[var(--accent)] px-6 text-sm font-extrabold text-[var(--ink)] shadow-[0_2px_0_rgb(0_0_0/12%)] transition hover:-translate-y-0.5"
            >
              {oneBranch ? "Join this shop" : `Join at ${firstBranch?.name ?? shop.name}`}
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <a
              href={walletUrl}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--line-strong)] px-6 text-sm font-extrabold transition hover:border-[var(--ink)]"
            >
              Open my wallet <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
          {shop.memberCount > 0 && (
            <p className="mt-4 text-xs text-[var(--muted)]">
              {shop.memberCount.toLocaleString("en-PH")} {shop.memberCount === 1 ? "member" : "members"} so far.
            </p>
          )}
        </div>
      </aside>
    </article>
  );
}
