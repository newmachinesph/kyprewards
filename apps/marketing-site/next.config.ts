import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kyprewards/api", "@kyprewards/ui"],
  // Hostinger counts threads against the account's process limit (shared by every site), and sharp would otherwise
  // start half the server's cores worth of threads per process.
  experimental: { imgOptConcurrency: 1 },
  // Indexed on its own domain only; the *.vercel.app and *.hostingersite.com aliases are duplicates.
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: ".*\.(vercel\.app|hostingersite\.com)" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
