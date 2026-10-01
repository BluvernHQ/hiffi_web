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
        source: "/top-artist/how-it-works",
        destination: "/top-artists/how-it-works",
        permanent: true,
      },
      {
        source: "/top-artist/how-it-works/",
        destination: "/top-artists/how-it-works",
        permanent: true,
      },
      {
        source: "/top-artist/share/:path*",
        destination: "/top-artists/share/:path*",
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
      {
        source: "/slide-:n(\\d+)\\.html",
        destination: "/pitch/slide-:n.html",
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
        source: "/:path*.md",
        destination: "/llms-md/:path*",
      },
    ]
  },
}

export default nextConfig
