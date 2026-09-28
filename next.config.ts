import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (local embedded Postgres) ships WebAssembly files that must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
