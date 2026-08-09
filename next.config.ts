import type { NextConfig } from "next";

const distDir = process.env.NEXT_DIST_DIR || ".next";

const nextConfig: NextConfig = {
  distDir,
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
