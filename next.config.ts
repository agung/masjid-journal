import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable experimental features for server actions
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // allow proof image uploads
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
