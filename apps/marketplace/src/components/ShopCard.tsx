import Link from "next/link";
import type { PublicShop } from "@kypstamping/api";
import { Pill } from "@kypstamping/ui";
import { formatDistance } from "@kypstamping/ui/format";
import { shopPath } from "@/lib/routes";

/** The one line every card ends with; "1.2 km away" means it. */
export function whereLine(shop: Pick<PublicShop, "neighborhood" | "city" | "distanceMetres">) {
  const distance = formatDistance(shop.distanceMetres);
  return distance ? `${shop.neighborhood} · ${distance} away` : `${shop.neighborhood}, ${shop.city}`;
}

export function OpenDot({ open }: { open: boolean }) {
  return (
    <>
      <span
        className={`size-2 rounded-full ${open ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
        aria-hidden="true"
      />
      {open ? "Open now" : "Closed now"}
    </>
  );
}

export function ShopCard({ shop }: { shop: PublicShop }) {
  return (
    <li className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] transition hover:-translate-y-0.5 hover:border-[var(--line-strong)]">
      <div className="relative aspect-[5/3] bg-[var(--surface-2)]">
        {shop.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- the API names the host; next/image needs it configured
          <img src={shop.image} alt="" className="size-full object-cover" loading="lazy" />
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
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{shop.reward}</p>
        <p className="mt-auto flex items-center gap-2 pt-4 text-xs font-semibold text-[var(--muted-strong)]">
          <OpenDot open={shop.open} />
          <span aria-hidden="true">·</span>
          {whereLine(shop)}
        </p>
      </div>
    </li>
  );
}
