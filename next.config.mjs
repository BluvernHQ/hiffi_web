/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Fix Turbopack root directory issue
  experimental: {
    turbopack: {
      resolveAlias: {
        // Ensure Next.js resolves correctly
      },
    },
  },
}

export default nextConfig
