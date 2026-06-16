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
}

export default nextConfig
