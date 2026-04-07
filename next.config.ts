import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Server external packages untuk driver adapter di Vercel
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "xlsx", "bcryptjs"],
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  // Optimize font loading
  optimizeFonts: {
    display: 'swap',
  },
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
