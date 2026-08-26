import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * `*` already allows every crawler; the named agents make the position on
 * generative engines a deliberate, reviewable choice rather than a default.
 * KYPStamping wants to be quotable, so training and answer crawlers are in.
 */
const answerEngines = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: answerEngines, allow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
