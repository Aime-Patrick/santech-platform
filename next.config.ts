import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* The repo root contains a stray npm lockfile from project scaffolding.
   * Pin the real workspace root so Next.js stops inferring it from lockfiles. */
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
