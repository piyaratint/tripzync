import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Produces a self-contained server in .next/standalone/ — no node_modules needed at runtime.
  // Required for deploying to any non-Vercel server (Jelastic, VPS, Docker, etc.)
  output: 'standalone',
}

export default nextConfig