# HLS migration runbook

MP4 stays the primary format. HLS is added alongside it and served only when the backend returns
`hls_url` for a video. Every step below can be undone without touching MP4 playback.

## Components and where the code lives

| Piece | Repo / path | Branch |
|---|---|---|
| Media Worker (serves R2) | `hiffi-media-worker/` (new local repo) | `master` |
| HLS packager + worker | `hiffi-encoding/hiffi_encoding/hls`, `cmd/hls-worker` | `feat/hls-worker` (from `enc_new_format`) |
| API: schema, endpoints, flags, backfill | `hiffi-backend` | `feat/hls` |
| Web player | `web/` | current branch |
| Embedding service | `hiffi-embedding` | no change (keeps reading `original.mp4`) |

The MP4 encoder (`video_upload` queue, `enc_new_format` binary) is not modified. The HLS queue is
a RabbitMQ priority queue (`x-max-priority: 10`), declared identically by the backend and the
worker: new uploads 9, stale-job sweep 5, backfill 0.

## HLS v1 format

- Layout: `videos/{id}/hls/v1/master.m3u8`, `{rung}/index.m3u8`, `{rung}/init.mp4`,
  `{rung}/seg_00000.m4s`, plus `hls.json` (metadata). Never written anywhere else.
- CMAF/fMP4, 6 s segments, keyframe forced at every segment boundary (all rungs GOP-aligned).
- H.264 High, yuv420p (10-bit sources are converted), CRF 21 capped by `-maxrate`; AAC-LC 128k
  stereo 48 kHz muxed. Silent sources get no audio track.
- Ladder by short side, never upscaled, max 1080: 240p/400k, 360p/800k, 480p/1400k,
  720p/2800k, 1080p/5000k. Portrait and rotated phone videos keep their orientation; no stretching.
- Master lists BANDWIDTH (measured peak), AVERAGE-BANDWIDTH, RESOLUTION, FRAME-RATE and CODECS read
  from the encoded output. The 480p (or nearest lower) rung is listed first as the start variant.
- Every rendition is verified before upload: VOD playlist complete, all segments present,
  duration within 0.5 s + 0.5 % of the source, codec/pixel format/size as planned.
- Files upload first, `master.m3u8` last; the backend only marks a video ready after it sees the
  master playlist in R2.

## Environment variables

### hiffi-backend

| Variable | Default | Purpose |
|---|---|---|
| `RABBITMQ_HLS_QUEUE` | unset | e.g. `video_hls`. Unset = HLS jobs disabled, backend behaves as before |
| `RABBITMQ_HLS_DLQ_QUEUE` | unset | e.g. `video_hls_dlq` |
| `HLS_PLAYBACK_ENABLED` | `false` | Global kill switch. `false` = no response contains `hls_url` |
| `HLS_PLAYBACK_PERCENT` | `100` | Share of videos (stable hash of `video_id`) that get `hls_url` when enabled |
| `HLS_ENQUEUE_NEW_UPLOADS` | `false` | New uploads: queue an HLS job (priority 9) and stop producing `240p.mp4`; only `original.mp4` is kept as MP4 |
| `MEDIA_SIGNING_SECRET` | unset | Must equal the Worker secret. Unset = `hls_url` never emitted |
| `HLS_TOKEN_TTL_SECONDS` | `21600` | Token lifetime (rounded up to the hour) |

`?hls_qa=1` on any video endpoint returns `hls_url` for that request even when
`HLS_PLAYBACK_PERCENT` excludes the video (still requires `HLS_PLAYBACK_ENABLED=true`). The web app
sends it when the page URL has `?playback=hls`.

### hls-worker

See `hiffi-encoding/hiffi_encoding/cmd/hls-worker/env.example`. Queue names must match the backend.

### Media Worker

`MEDIA_SIGNING_SECRET` (secret), `REQUIRE_HLS_TOKEN` (`"false"`).

### Web

`NEXT_PUBLIC_HLS_PLAYBACK=off` removes HLS from a build. `?playback=mp4` forces MP4 for one page
view and `?playback=hls` requests the QA override.

## Rollout

Each gate must pass before the next step.

### 0. Before anything (needs server access)

- [ ] Confirm the binary PM2/systemd runs for the MP4 encoder and the production queue names
      (`RABBITMQ_UPLOAD_QUEUE` etc. in the API server's `.env`).
- [x] **Cloudflare Bot Fight Mode challenges server-to-server callbacks** from the encoding
      server (144.76.226.190, Hetzner). Bot Fight Mode must stay on and cannot be skipped by WAF
      rules on the Free plan, so since 2026-10-22 the encoding server bypasses Cloudflare for API
      calls via `/etc/hosts`:
      `138.197.44.215 api.hiffi.com` (prod origin, Let's Encrypt cert, verified) and
      `178.104.200.35 api.dev.hiffi.com` (dev origin). **If either API server moves, update
      `/etc/hosts` on the encoding server** (the IPs are the A records in Cloudflare DNS).
      The 6 production uploads stuck between 2026-10-06 and 2026-10-15 were re-published.
- [x] `hiffi-ack-retry.timer` on the encoding server re-sends any failed encoder publish callback
      every 5 minutes (log: `/var/log/hiffi-ack-retry.log`; source: `hiffi-encoding/ops/`).
- [ ] Take a DigitalOcean managed Postgres backup.
- [ ] Rotate the credentials that were committed to hiffi-backend's git history before `0407599f`
      (Postgres, R2, RabbitMQ).
- [ ] Note the R2 inventory baseline (2026-10-21, `prod-hiffi`): 9,913 video folders,
      7,550 with `original.mp4` (273.6 GB), 2,363 folders holding only a leftover `240p.mp4` from
      deleted videos, 0 HLS objects.

### 1. Backend, dark

1. Deploy `feat/hls` with `RUN_MIGRATIONS=true` once (migration `080_add_hls_to_videos.sql` is
   idempotent and only adds columns with defaults).
2. Leave `HLS_PLAYBACK_ENABLED`, `HLS_ENQUEUE_NEW_UPLOADS` unset.
3. Gate: `GET /videos/{id}` and `/videos/list` responses are unchanged (no `hls_*` keys);
   `go run ./scripts/hls_backfill status` shows every video as `none`.

### 2. Media Worker

1. `npx wrangler secret put MEDIA_SIGNING_SECRET` (dev), `npm test`, `npm run deploy:dev`.
2. Gate on dev: an existing MP4 and thumbnail still load; `curl -I` of an `.mp4` with
   `Range: bytes=0-1` returns 206.
3. Repeat for prod with `--env production`; keep `npm run rollback:prod` ready.

### 3. HLS worker on dev

1. Set `RABBITMQ_HLS_QUEUE`/`RABBITMQ_HLS_DLQ_QUEUE` and `MEDIA_SIGNING_SECRET` on the dev API.
2. Run the worker (`docker build -f cmd/hls-worker/Dockerfile -t hiffi-hls-worker .` from
   `hiffi_encoding/`, then `docker run --env-file .env hiffi-hls-worker`, or the Linux binary under
   PM2 as `hiffi-hls-worker`). Prefer a separate VM from the MP4 encoder.
3. `go run ./scripts/hls_backfill enqueue --limit 20 --execute` on dev, including portrait,
   4:3, silent, HEVC/10-bit iPhone, long (60 min+) and very short uploads.
4. Gate: `status` shows them `ready`; `verify` reports `missing=0`; with
   `HLS_PLAYBACK_ENABLED=true`, `?playback=hls` plays on Chrome, Firefox, Safari macOS, iPhone
   Safari and Android Chrome; seeking, quality menu (Auto + rungs) and the HLS->MP4 fallback work
   (block `*.m4s` in devtools to trigger it).

### 4. Production backfill canary

```bash
go run ./scripts/hls_backfill enqueue --limit 10            # dry run, review the list
go run ./scripts/hls_backfill enqueue --limit 10 --execute
go run ./scripts/hls_backfill status
go run ./scripts/hls_backfill verify --limit 10
```

Then `--limit 100 --execute`, then the rest in batches (`--limit 500 --rate 2`). Watch the
`video_hls_dlq` queue, `status` failures, worker disk and CPU, and R2 storage. Expect roughly
+60-80 % of the originals' size in HLS output. `sweep --stale-hours 6 --execute` re-queues
anything a crashed worker left behind (dry run first).

### 5. Web player

Ship the web changes. With `HLS_PLAYBACK_ENABLED` still `false` nothing changes for users.
Then set `HLS_PLAYBACK_ENABLED=true` and `HLS_PLAYBACK_PERCENT=0`: only `?playback=hls` requests
get HLS. QA on production.

### 6. Gradual playback rollout

`HLS_PLAYBACK_PERCENT` 5 -> 25 -> 50 -> 100, at least a day each. Compare:

- watch-hours rows with `player = 'web-videojs-hls'` vs `'web-videojs'`;
- `conversion_play_started` by `source_type`;
- `playback_hls_fallback` events (should stay well below 1 % of HLS plays);
- `stream_quality_issue` reports.

### 7. New uploads: HLS only (no more 240p.mp4)

Set `HLS_ENQUEUE_NEW_UPLOADS=true` (with the HLS queue configured). From then on, for every new
upload:

1. The MP4 encoder is asked for no renditions, so it only normalises the uploaded
   `original.mp4` (faststart; re-encoded to H.264/AAC only when needed). `240p.mp4` is no longer
   produced. `profiles` for these videos is `["original"]`.
2. The video goes live as soon as that finishes, exactly as today.
3. An HLS job is queued at priority 9, ahead of backfill jobs (priority 0), and `hls_url` appears a
   few minutes later.

`original.mp4` is the only MP4 kept. It remains the source for the embedding service, Google
`contentUrl`/`og:video`/video sitemap, feed and hero previews, and the fallback when HLS fails or
`HLS_PLAYBACK_ENABLED` is switched off. Previews of new videos use `original.mp4` (no 240p), so
they load more bytes than before.

Turning `HLS_ENQUEUE_NEW_UPLOADS` off (or removing the HLS queue) restores `240p.mp4` for new
uploads automatically. Run the worker with enough capacity that new uploads are not delayed:
one process handles one job at a time, about 1 minute of CPU per 2 minutes of 1080p video with
`HLS_X264_PRESET=fast`.

### 8. Later (separate decision)

Making HLS the default, setting `REQUIRE_HLS_TOKEN=true`, and deleting the existing `240p.mp4`
files of videos that have HLS.

## Rollback

| Problem | Action | Effect |
|---|---|---|
| Any playback issue | `HLS_PLAYBACK_ENABLED=false` (restart API) | All clients back on MP4 at next API call |
| Bad HLS output | stop the worker; `UPDATE videos SET hls_status='none' WHERE ...`; delete `videos/{id}/hls/` | Those videos play MP4 |
| Worker change broke MP4 | `npm run rollback:prod` in hiffi-media-worker | Previous Worker version |
| Web regression | `NEXT_PUBLIC_HLS_PLAYBACK=off` build, or revert | Web on MP4 |
| Migration | none needed; columns are additive and ignored when flags are off | |

## Deletion

User delete, admin delete and account deletion now remove the whole `videos/{id}/` prefix
(original, 240p and HLS) plus the thumbnail. The 2,363 orphaned `240p.mp4` folders that already
exist are not cleaned up automatically.
