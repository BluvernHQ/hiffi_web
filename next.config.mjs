import { readFileSync } from "node:fs"
import { execSync } from "node:child_process"

/** @type {import('next').NextConfig} */

function resolveBuildId() {
  if (process.env.NEXT_PUBLIC_APP_BUILD_ID) {
    return process.env.NEXT_PUBLIC_APP_BUILD_ID.slice(0, 7)
  }
  const ciSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA
  if (ciSha) return ciSha.slice(0, 7)
  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["pipe", "pipe", "ignore"],
    })
      .toString()
      .trim()
  } catch {
    return "dev"
  }
}

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
)

const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_APP_BUILD_ID: resolveBuildId(),
  },
  async redirects() {
    return [
      {
        source: "/artistindex",
        destination: "/artist-index",
        permanent: true,
      },
      {
        source: "/artistindex/:path*",
        destination: "/artist-index/:path*",
        permanent: true,
      },
      {
        source: "/upload/migrate",
        destination: "/studio/tools/migrate",
        permanent: true,
      },
      // Legacy singular path → canonical /top-artists
      {
        source: "/top-artist",
        destination: "/top-artists",
        permanent: true,
      },
      {
        source: "/top-artist/",
        destination: "/top-artists",
        permanent: true,
      },
      {
        source: "/top-artist/:path*",
        destination: "/top-artists/:path*",
        permanent: true,
      },
      {
        source: "/top-artists/how-it-works",
        destination: "/top-artists",
        permanent: false,
      },
      {
        source: "/top-artists/how-it-works/",
        destination: "/top-artists",
        permanent: false,
      },
      // Retired Next.js Hiffi 500 UI → Hip-Hop 500 preview
      {
        source: "/hiffi-500",
        destination: "/top-artists",
        permanent: true,
      },
      {
        source: "/hiffi-500/:path*",
        destination: "/top-artists",
        permanent: true,
      },
      // Pitch deck entry: avoid /pitch (no trailing slash) resolving relative links to /
      {
        source: "/pitch",
        destination: "/pitch/slide-1.html",
        permanent: false,
      },
      {
        source: "/pitch/",
        destination: "/pitch/slide-1.html",
        permanent: false,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/sitemaps/:id.xml",
        destination: "/sitemaps/:id",
      },
      // Legacy Next generateSitemaps URLs → new chunk routes
      {
        source: "/sitemap/:id.xml",
        destination: "/sitemaps/:id",
      },
      {
        source: "/top-artists",
        destination: "/top-artists/index.html",
      },
      {
        source: "/top-artists/",
        destination: "/top-artists/index.html",
      },
      {
        source: "/:path*.md",
        destination: "/llms-md/:path*",
      },
    ]
  },
}

export default nextConfig
