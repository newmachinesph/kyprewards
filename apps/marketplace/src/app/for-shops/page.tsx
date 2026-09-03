import type { Metadata } from "next";
import { merchantSiteUrl } from "@/lib/site";
import { ActionLink, PageIntro } from "@/components/Ui";

export const metadata: Metadata = {
  title: "For shops",
  description:
    "Run a shop? Every shop with a live rewards program is listed on KYP, on every plan. Set yours up on KYP Stamping.",
  alternates: { canonical: "/for-shops" },
};

export default function ForShops() {
  return (
    <PageIntro
      eyebrow="For shops"
      title="Your shop, in Discover"
      description={
        <>
          Every shop running a live program is listed here, on every plan including the free one.
          Each listing carries your category, neighborhood, hours and the reward in plain words, and
          leads straight to your join code. Setting up the card, the counter and the poster happens
          on KYP Stamping, the merchant side of KYP.
        </>
      }
    >
      <div className="mt-8 flex flex-wrap gap-3">
        <ActionLink href={`${merchantSiteUrl}/partners`}>Go to KYP Stamping</ActionLink>
        <ActionLink href="/discover" tone="outline">
          See the directory
        </ActionLink>
      </div>
    </PageIntro>
  );
}
