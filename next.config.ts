import type { NextConfig } from "next";

// Fungsi untuk mendapatkan URL yang valid
const getValidNextAuthUrl = (): string => {
  const nextauthUrl = process.env.NEXTAUTH_URL
  const vercelUrl = process.env.VERCEL_URL
  
  // Cek apakah NEXTAUTH_URL adalah placeholder
  const isPlaceholder = (url: string | undefined): boolean => {
    if (!url) return true
    return (
      url.includes('[') ||
      url.includes(']') ||
      url.includes('nama-aplikasi') ||
      url.includes('your-domain') ||
      url.includes('placeholder') ||
      !url.startsWith('http')
    )
  }
  
  if (nextauthUrl && !isPlaceholder(nextauthUrl)) {
    return nextauthUrl
  }
  
  if (vercelUrl) {
    return `https://${vercelUrl}`
  }
  
  return "http://localhost:3000"
}

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  env: {
    NEXTAUTH_URL: getValidNextAuthUrl(),
  },
};

export default nextConfig;
