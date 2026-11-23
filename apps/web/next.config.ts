import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@cwg/api",
    "@cwg/shared",
    "@cwg/types",
    "@cwg/ui",
    "@cwg/validation",
  ],
};

export default nextConfig;
