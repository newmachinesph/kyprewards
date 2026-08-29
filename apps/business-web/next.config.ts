import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kypstamping/api", "@kypstamping/ui", "@kypstamping/demo-data"],
};

export default nextConfig;
