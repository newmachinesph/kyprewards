import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kyprewards/api", "@kyprewards/ui", "@kyprewards/demo-data"],
  // Hostinger counts threads against the account's process limit (shared by every site), and sharp would otherwise
  // start half the server's cores worth of threads per process. Builds count too: every site rebuilds on the same push,
  // and each would otherwise start a worker per core.
  experimental: { imgOptConcurrency: 1, cpus: 2 },
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
