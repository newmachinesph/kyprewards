import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kyprewards/api", "@kyprewards/ui", "@kyprewards/demo-data"],
  // Hostinger counts threads against the account's process limit (shared by every site), and sharp would otherwise
  // start half the server's cores worth of threads per process.
  experimental: { imgOptConcurrency: 1 },
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
