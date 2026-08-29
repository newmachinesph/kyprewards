import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@stampr/api", "@stampr/ui"],
};

export default nextConfig;
