import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A production build must not invalidate a development server that is already running.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next"
};

export default nextConfig;
