import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kypstamping/api", "@kypstamping/ui"],
};

export default nextConfig;
