import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadShop } from "@/lib/public-data";
import { shopPath } from "@/lib/routes";
import { ShopPage } from "@/components/ShopPage";

type Params = Promise<{ slug: string }>;

// Each shop renders at most once per ten minutes however often crawlers come;
// a slug never seen before still renders on its first request. The empty
// list is what makes that work: no shop is built ahead, and without it the
// route stays fully dynamic and `revalidate` does nothing.
export const revalidate = 600;

export function generateStaticParams(): { slug: string }[] {
  return [];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const lookup = await loadShop(slug);
  // Only a shop the API does not know is noindex. A timeout or a 5xx while a
  // crawler happened by used to deindex a real, listed shop.
  if (lookup.status === "missing") {
    return { title: "Shop", robots: { index: false, follow: false } };
  }
  if (lookup.status !== "found") return { title: "Shop" };
  const { shop } = lookup;
  const description = `${shop.reward} at ${shop.name}, ${shop.neighborhood}. ${shop.about}`.slice(0, 200);
  return {
    title: shop.name,
    description,
    alternates: { canonical: shopPath(shop.slug) },
    openGraph: {
      title: `${shop.name} · KYP`,
      description,
      type: "website",
      ...(shop.image ? { images: [shop.image] } : {}),
    },
  };
}

export default async function Shop({ params }: { params: Params }) {
  const { slug } = await params;
  // A slug the API does not know answers 404 with `noindex`; a network
  // failure does not, because the page can still load in the browser. A
  // found shop is handed to the client as its first data, so the server
  // renders the whole body and the browser does not fetch it a second time.
  const lookup = await loadShop(slug);
  if (lookup.status === "missing") notFound();
  return <ShopPage slug={slug} initial={lookup.status === "found" ? lookup.shop : undefined} />;
}
