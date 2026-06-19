import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hiffi — Hip-Hop Streaming",
    short_name: "Hiffi",
    description:
      "Hip-hop-first music and video streaming for independent rap artists and fans. Discover drill, trap, conscious rap, boom bap, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    categories: ["music", "entertainment"],
    icons: [
      { src: "/hiffi_logo.png", sizes: "192x192", type: "image/png" },
      { src: "/hiffi_logo.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
