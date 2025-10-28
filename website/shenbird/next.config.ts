import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: '**.shopify.com',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development', // Disable optimization in dev for faster builds
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase limit for catalog file uploads
    },
  },
};

export default nextConfig;
