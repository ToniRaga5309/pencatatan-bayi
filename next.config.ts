import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Server external packages untuk driver adapter di Vercel
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "xlsx", "bcryptjs"],
};

export default nextConfig;
