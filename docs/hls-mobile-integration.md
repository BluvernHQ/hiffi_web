# HLS playback for the iOS and Android apps

The backend now adds two optional fields to every video object it returns (`GET /videos/{id}`,
`/videos/list`, `/videos/recommend`, history, liked, playlists):

```json
{
  "video_id": "...",
  "video_url": "videos/{id}/original.mp4",
  "original_profile": "720p",
  "profiles": ["240p"],
  "hls_status": "ready",
  "hls_url": "https://prod.hiffi.workers.dev/t/1761066000.Qm9.../videos/{id}/hls/v1/master.m3u8"
}
```

- `hls_url` is present only when the video has HLS and the server-side rollout includes it. When it
  is missing, play MP4 exactly as today. Old app versions ignore both fields.
- `video_url`, `profiles` and `original_profile` keep their current meaning (MP4 files).
- The URL is signed and expires (6 h, rounded up to the hour). Do not cache it across app sessions;
  use the one from the latest API response. No `x-api-key` or other header is needed for HLS.
- Format: HLS v7, fMP4 segments, H.264 High + AAC-LC, 240p-1080p ladder.

## iOS (AVPlayer)

```swift
func makeItem(for video: Video) -> AVPlayerItem {
    if let hls = video.hlsURL, let url = URL(string: hls) {
        return AVPlayerItem(url: url)
    }
    return AVPlayerItem(url: mp4URL(for: video))   // existing logic
}

// Fall back once per video if HLS fails.
statusObservation = item.observe(\.status) { item, _ in
    guard item.status == .failed, usingHLS else { return }
    let resumeAt = player.currentTime()
    usingHLS = false
    let mp4 = AVPlayerItem(url: mp4URL(for: video))
    player.replaceCurrentItem(with: mp4)
    player.seek(to: resumeAt)
}
```

Also handle `AVPlayerItemFailedToPlayToEndTime` the same way. AVPlayer chooses the quality
automatically; to cap it (e.g. on cellular) use `preferredPeakBitRate` /
`preferredMaximumResolution`.

## Android (Media3 / ExoPlayer)

```kotlin
// build.gradle: implementation("androidx.media3:media3-exoplayer-hls:<same version as media3-exoplayer>")

fun mediaSourceFor(video: Video, factory: DataSource.Factory): MediaSource =
    video.hlsUrl?.let {
        HlsMediaSource.Factory(factory).createMediaSource(MediaItem.fromUri(it))
    } ?: ProgressiveMediaSource.Factory(factory)
        .createMediaSource(MediaItem.fromUri(mp4Url(video)))   // existing logic

player.addListener(object : Player.Listener {
    override fun onPlayerError(error: PlaybackException) {
        if (!usingHls) return
        usingHls = false
        val position = player.currentPosition
        player.setMediaSource(
            ProgressiveMediaSource.Factory(factory).createMediaSource(MediaItem.fromUri(mp4Url(video))),
            position,
        )
        player.prepare()
        player.play()
    }
})
```

Quality selection uses `TrackSelectionParameters` (e.g. `setMaxVideoSize`), with "Auto" as the
default.

## Telemetry

Send `player = "ios-avplayer-hls"` / `"android-exoplayer-hls"` in `POST /signals/watchhours` when
playing HLS (keep the existing values for MP4) so HLS and MP4 sessions can be compared, and log a
fallback event when HLS fails.

## Testing

On dev, the backend returns `hls_url` for a single request when the call has `?hls_qa=1`
(`GET /videos/{id}?hls_qa=1`), even before the rollout percentage includes the video.
