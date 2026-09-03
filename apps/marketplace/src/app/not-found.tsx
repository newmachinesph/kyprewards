import { ActionLink, PageIntro } from "@/components/Ui";

export default function NotFound() {
  return (
    <>
      <meta name="robots" content="noindex" />
      <PageIntro
        eyebrow="Not found"
        title="That page is not here"
        description="The link may be old or mistyped. Every shop with a live card is in Discover."
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
