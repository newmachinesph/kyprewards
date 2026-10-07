import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kyprewards/api", "@kyprewards/ui"],
  // Indexed on its own domain only; the *.vercel.app alias is a duplicate.
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: ".*\.vercel\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
