import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // CI runs the full test/typecheck suite before deployment. Avoid repeating the
  // memory-heavy checks while compiling on the small production Lightsail VM.
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // A production build must not invalidate a development server that is already running.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next"
};

export default nextConfig;
