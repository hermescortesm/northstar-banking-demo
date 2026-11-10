import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this repo (silences the stray-lockfile warning).
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
