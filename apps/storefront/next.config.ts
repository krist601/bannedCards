import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keeps local development output separate from any production build output.
  distDir: ".next-dev"
};

export default nextConfig;
