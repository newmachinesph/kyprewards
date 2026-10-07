import Link from "next/link";
import type { PublicShop } from "@kyprewards/api";
import { Pill } from "@kyprewards/ui";
import { formatDistance } from "@kyprewards/ui/format";
import { shopPath } from "@/lib/routes";

/** The one line every card ends with; "1.2 km away" means it. */
export function whereLine(shop: Pick<PublicShop, "neighborhood" | "city" | "distanceMetres">) {
  const distance = formatDistance(shop.distanceMetres);
  return distance ? `${shop.neighborhood} · ${distance} away` : `${shop.neighborhood}, ${shop.city}`;
}

export function OpenDot({ open }: { open: boolean }) {
  return (
    // One unbreakable unit: squeezed by a long address, the label used to
    // wrap to two lines and the dot shrank into an oval.
    <span className="inline-flex min-w-max shrink-0 items-center gap-2 whitespace-nowrap">
      <span
        className={`size-2 shrink-0 rounded-full ${open ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
        aria-hidden="true"
      />
      {open ? "Open now" : "Closed now"}
    </span>
  );
}

export function ShopCard({ shop }: { shop: PublicShop }) {
  return (
    <li className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] transition hover:-translate-y-0.5 hover:border-[var(--line-strong)]">
      <div className="relative aspect-[5/3] overflow-hidden bg-[var(--surface-2)]">
        {shop.image ? (
          // Positioned out of flow, which is what makes the 5:3 hold. An
          // in-flow `size-full` image resolves its height against a parent
          // whose own height is still auto, so the percentage is indefinite,
          // the image falls back to its natural size, and the box grows to
          // fit it - aspect-ratio only sizes a box the content has not
          // already sized. Every card took the shape of whatever the shop
          // uploaded: a 4:3 photo made a 4:3 card, a phone portrait made a
          // card twice as tall as the one beside it.
          // eslint-disable-next-line @next/next/no-img-element -- the API names the host; next/image needs it configured
          <img
            src={shop.image}
            alt=""
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
        ) : (
          <span
            aria-hidden="true"
            className="font-display absolute inset-0 grid place-items-center text-5xl font-bold text-[var(--line-strong)]"
          >
            {shop.name.charAt(0)}
          </span>
        )}
        {shop.featured && (
          <span className="absolute left-3 top-3">
            <Pill tone="warning">Featured</Pill>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
          {shop.category}
        </p>
        <h3 className="mt-1.5 text-lg font-bold leading-snug tracking-[-0.01em]">
          <Link href={shopPath(shop.slug)} className="focus-ring rounded-md after:absolute after:inset-0">
            {shop.name}
          </Link>
        </h3>
        {/* The reward is the reason to tap, so it is never truncated away -
            but a long one used to stretch its card and leave the row ragged,
            because grid rows take the height of the tallest item. Two lines
            each: enough for "8 visits → Free 12-inch pizza", capped so no
            shop's wording sets the height of the row. */}
        <p className="mt-2 line-clamp-2 text-sm text-[var(--ink-soft)]">{shop.reward}</p>
        {shop.about && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-[var(--muted-strong)]">
            {shop.about}
          </p>
        )}
        <p className="mt-auto flex items-start gap-2 pt-4 text-xs font-semibold text-[var(--muted-strong)]">
          <OpenDot open={shop.open} />
          <span aria-hidden="true">·</span>
          <span className="min-w-0">{whereLine(shop)}</span>
        </p>
      </div>
    </li>
  );
}
