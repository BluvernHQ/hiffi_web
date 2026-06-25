/**
 * @deprecated Use `@/lib/feed-preview/preview-warmer` — fetch() range warmup raced <video src>.
 */
export {
  warmVideo as warmupPreviewStream,
  warmVideoWithMoov,
  prefetchViewportVideo,
  releaseViewportPrefetch,
  prefetchInitialVideos,
} from "./preview-warmer"
