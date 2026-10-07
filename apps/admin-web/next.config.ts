import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kyprewards/api", "@kyprewards/ui", "@kyprewards/demo-data"],
  // A signed-in app, never a search result or a training source. The header
  // covers what the page's robots meta cannot: files, redirects, errors.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
