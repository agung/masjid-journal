import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  // Keep @react-pdf/renderer out of the webpack bundle — it's Node-only and
  // causes OOM during bundling if webpack tries to trace its dependencies.
  serverExternalPackages: ['@react-pdf/renderer'],

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
      {
        // Supabase Storage signed URLs
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

const isDev = process.env.NODE_ENV === 'development'
const isTurbopack = process.env.TURBOPACK === '1' || process.argv.includes('--turbo') || process.argv.includes('--turbopack')

export default (isDev || isTurbopack)
  ? nextConfig
  : withSerwistInit({
      swSrc: 'app/sw.ts',
      swDest: 'public/sw.js',
      disable: false,
    })(nextConfig)
