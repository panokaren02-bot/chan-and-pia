import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a test build go to a separate folder (NEXT_DIST_DIR=.next-verify) without touching a running `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
