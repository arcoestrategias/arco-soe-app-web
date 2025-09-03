import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true }, // ⬅️ ignora ESLint en build
  typescript: { ignoreBuildErrors: true }, // ⬅️ opcional, ignora errores TS en build
};

export default nextConfig;
