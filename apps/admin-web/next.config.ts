import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@stampr/ui", "@stampr/demo-data"],
};

export default nextConfig;
