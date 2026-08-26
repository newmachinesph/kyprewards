/**
 * Schema.org builders shared by every page.
 *
 * Three audiences, one graph:
 *  - search engines read the types they support (Breadcrumb, FAQ, Article…)
 *  - answer engines lift the Question/Answer and HowTo nodes directly
 *  - generative engines resolve the @id references into one KYPStamping entity
 *
 * Every node that describes the company points at `organizationId` rather than
 * restating the name, so the entity stays singular across ~25 pages.
 */

import { siteUrl } from "@/lib/site";

export const organizationId = `${siteUrl}/#organization`;
export const websiteId = `${siteUrl}/#website`;
export const softwareId = `${siteUrl}/#software`;

type Node = Record<string, unknown>;

const ctx = { "@context": "https://schema.org" } as const;

/** Trail for any page below the root. Search engines render it in results. */
export function breadcrumb(trail: { name: string; path: string }[]): Node {
  return {
    ...ctx,
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "" }, ...trail].map(
      (item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${siteUrl}${item.path}`,
      }),
    ),
  };
}

export function article({
  headline,
  description,
  path,
  section,
  published,
  modified,
}: {
  headline: string;
  description: string;
  path: string;
  section: string;
  published: string;
  modified: string;
}): Node {
  return {
    ...ctx,
    "@type": "Article",
    headline,
    description,
    articleSection: section,
    datePublished: published,
    dateModified: modified,
    inLanguage: "en-PH",
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}${path}` },
    author: { "@id": organizationId },
    publisher: { "@id": organizationId },
    isPartOf: { "@id": websiteId },
  };
}

export function service({
  name,
  description,
  path,
  audience,
}: {
  name: string;
  description: string;
  path: string;
  audience: string;
}): Node {
  return {
    ...ctx,
    "@type": "Service",
    name,
    description,
    serviceType: "Customer loyalty software",
    provider: { "@id": organizationId },
    areaServed: { "@type": "Country", name: "Philippines" },
    audience: { "@type": "BusinessAudience", name: audience },
    url: `${siteUrl}${path}`,
  };
}

/** Answer engines quote HowTo steps almost verbatim, so keep them imperative. */
export function howTo({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}): Node {
  return {
    ...ctx,
    "@type": "HowTo",
    name,
    description,
    inLanguage: "en-PH",
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

export function itemList({
  name,
  items,
}: {
  name: string;
  items: { name: string; path: string; description?: string }[];
}): Node {
  return {
    ...ctx,
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      description: item.description,
      url: `${siteUrl}${item.path}`,
    })),
  };
}

export function faqPage(
  entries: { question: string; answer: string }[],
): Node {
  return {
    ...ctx,
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

/**
 * Marks the passage a voice or answer engine should read aloud. Point it at
 * the page's lead answer, never at navigation.
 */
export function webPage({
  name,
  description,
  path,
  speakableSelectors = [".aeo-answer"],
}: {
  name: string;
  description: string;
  path: string;
  speakableSelectors?: string[];
}): Node {
  return {
    ...ctx,
    "@type": "WebPage",
    name,
    description,
    url: `${siteUrl}${path}`,
    inLanguage: "en-PH",
    isPartOf: { "@id": websiteId },
    about: { "@id": softwareId },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: speakableSelectors,
    },
  };
}
