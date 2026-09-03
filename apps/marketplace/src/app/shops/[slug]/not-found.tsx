import { ActionLink, PageIntro } from "@/components/Ui";

export default function ShopNotFound() {
  return (
    <>
      <meta name="robots" content="noindex" />
      <PageIntro
        eyebrow="Not found"
        title="No shop at that address"
        description="The link may be old, or the shop may have paused its program. Every shop with a live card is in Discover."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ActionLink href="/discover">Browse shops</ActionLink>
          <ActionLink href="/" tone="outline" arrow={false}>
            Home
          </ActionLink>
        </div>
      </PageIntro>
    </>
  );
}
