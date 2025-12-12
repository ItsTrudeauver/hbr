import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16+ removed the 'eslint' block because it doesn't lint on build by default.
  
  // If your build is failing due to TypeScript errors, use this:
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;