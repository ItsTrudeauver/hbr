import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ❌ DO NOT add 'eslint' here. It was removed in Next.js 16.
  // Next.js 16 does not lint during build by default, so you don't need to ignore it.

  // ✅ Keep this to ignore TypeScript errors during deployment
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;