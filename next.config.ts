import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

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
        // Google Drive shared file previews
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        // Google Drive direct content links
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

export default withSerwist(nextConfig)
