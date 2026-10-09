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
  poweredByHeader: false,
  images: { minimumCacheTTL: 604800, imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 420] },
  async headers() {
    const cache = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];
    return [{ source: "/brand/:path*", headers: cache }, { source: "/demo/:path*", headers: cache }];
  },
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next"
};

export default nextConfig;
