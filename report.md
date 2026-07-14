# Hiffi Web — Engineering Report

This document summarizes the **Hiffi** web application (`hiffi_web`): its architecture, stability and scalability-oriented engineering, and the **features shipped** in this codebase. It is intended as a stakeholder-facing record of technical work and product surface area.

---

## 1. Executive summary

**Hiffi** is a **Next.js 16** application (App Router, React 19) that fronts a REST backend and **Cloudflare Workers**–backed object storage for video, thumbnails, and profile media. The client emphasizes **reliable playback**, **authenticated media access without leaking secrets to arbitrary URLs**, **SEO-friendly server rendering**, and **session-stable feeds** aligned with backend deterministic pagination.

Primary engineering themes:

- **Separation of concerns**: typed API client, centralized config, dedicated SEO/data-fetch layer, UI built on shared primitives (Radix + Tailwind).
- **Resilience**: token refresh via credential-backed retry, user-facing auth error mapping, video player fallbacks, graceful API/network errors.
- **Performance at scale**: infinite scroll with throttling and deduplication, virtualized long lists where needed, ISR on key pages, streaming proxies with Range support.
- **Operational control**: environment-based API/worker URLs, optional maintenance mode via middleware.

---

## 2. Technology stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router), TypeScript |
| UI | React 19, Tailwind CSS 4, Radix UI, shadcn-style components (`components/ui/*`) |
| Auth | Firebase Auth + backend JWT (`lib/firebase.ts`, `lib/auth-context.tsx`) |
| HTTP | Native `fetch` in `lib/api-client.ts` (primary); `lib/api.ts` axios instance exists for legacy/mock paths |
| Forms / validation | react-hook-form, Zod |
| Virtual lists | `@tanstack/react-virtual` (e.g. playlist picker) |
| Analytics | Vercel Analytics, GA tracker, Microsoft Clarity |

**Runtime**: Node `>=20.9.0` per `package.json`.

---

## 3. High-level architecture

```mermaid
flowchart TB
  subgraph browser [Browser]
    UI[App UI / RSC + Client]
    SW[Service Worker sw.js]
  end
  subgraph next [Next.js]
    RSC[Server Components + generateMetadata]
    MW[middleware.ts]
    PROXY_V[/proxy/video/stream]
    PROXY_I[/proxy/image/...]
    PROXY_PP[/proxy/profile-picture/...]
  end
  API[REST API api.hiffi.com]
  WRK[Workers object storage]

  UI --> API
  UI --> PROXY_V
  UI --> PROXY_I
  SW --> WRK
  PROXY_V --> WRK
  PROXY_I --> WRK
  RSC --> API
  MW --> UI
```

- **Server**: Prefetch public data for SEO (home feed, watch metadata) via `lib/seo/fetch-public.ts` using `API_BASE_URL` and React `cache()`.
- **Client**: Rich interactions (player, uploads, admin tables) use client components and shared providers in `app/layout.tsx`.
- **Media**: Workers URLs are normalized in `lib/storage.ts`; sensitive fetches go through **Next route handlers** that attach `x-api-key`, or through the **service worker** for direct Worker video requests with headers the page cannot set on cross-origin `<video>` alone.

---

## 4. Scalability and stability engineering

### 4.1 Centralized environment configuration

`lib/config.ts` maps **`NEXT_PUBLIC_ENV`** (`dev` | `beta` | `prod`) to:

- `API_BASE_URL` (override: `NEXT_PUBLIC_API_URL`)
- `WORKERS_BASE_URL` (override: `NEXT_PUBLIC_WORKERS_URL`)

This supports **promoting the same build** across environments with configuration only.

### 4.2 API client: auth, retries, and errors

`lib/api-client.ts` is the main integration surface to the backend:

- **JWT in `localStorage`** with optional **credential cookies** for **auto-login** on `401` (excluding login/register endpoints): single-flight refresh via `isRefreshing` / `refreshPromise` to avoid stampedes.
- **Structured `ApiError`** with status, parsed message fields (`message`, `error`, `detail`), and **network** detection (`TypeError` from `fetch`) with actionable copy.
- **Logging hygiene**: password/token redaction in logs; **403 disabled-account** responses logged at lower noise.
- **Large typed surface**: videos, users, comments, playlists, admin, uploads, etc., in one client for consistency.

### 4.3 Feed pagination and client state

- **Home** (`app/(main)/home-feed-client.tsx`): Paginates with `getSeed()` from `lib/seed-manager.ts`, matching backend **deterministic random** ordering; **deduplicates** by video id on append; **sessionStorage** restores list + scroll when seed and TTL align (reduces refetch churn during navigation).
- **Video grid** (`components/video/video-grid.tsx`): **IntersectionObserver** with **rootMargin** prefetch and **throttled** `onLoadMore` to limit API pressure.

### 4.4 Video playback and media pipeline

- **`lib/video-resolver.ts`**: In-memory **session cache** of resolved MP4 URLs; handles API paths that are already file URLs vs. directory-style paths.
- **`components/video/video-player.tsx`**: On Video.js **decode / not-supported** errors, attempts **MP4 fallback** from resolved `baseUrl` before surfacing a hard error.
- **`app/proxy/video/stream/route.ts`**: **Range passthrough** for seeking; **allowlist** of `WORKERS_BASE_URL` on the `url` query param; streams response body with **206/200** and **CORS** headers for player compatibility.
- **`public/sw.js` + `lib/service-worker.ts`**: Injects **`x-api-key`** and optional **`Authorization`** on Worker `/videos/*` fetches; syncs headers on **focus**, **visibility**, and **storage** events for token changes.

### 4.5 Images without client memory leaks

`components/video/authenticated-image.tsx` routes Worker images through **`/proxy/image/...`** so the browser can use **normal caching** and avoid **`createObjectURL`** lifecycles. Profile pictures have a dedicated proxy route under `app/proxy/profile-picture/`.

### 4.6 Background uploads

`lib/video-upload-queue-context.tsx` implements a **multi-job upload queue** with global UI: prepare → PUT video → thumbnail → ack; **cancel** aborts in-flight work; surfaces completion with link to the new watch URL (`bridge_id`). This keeps the UI responsive under large files or slow networks.

### 4.7 Navigation safety

`lib/upload-navigation-guard.ts` lets the upload page register a guard so **unsaved draft** navigations can be intercepted (paired with upload UX).

### 4.8 SEO and discoverability

- **`lib/seo/fetch-public.ts`**: Normalizes multiple API response shapes; uses `next: { revalidate: 300 }` for **cached public fetches**.
- **Home** (`app/(main)/page.tsx`): `revalidate = 300`, server-fetched first page, **ItemList** JSON-LD.
- **Watch** (`app/(main)/watch/[videoId]/layout.tsx`): `generateMetadata` + **Video** / **BreadcrumbList** JSON-LD from `lib/seo/schema.ts`.
- **Site-wide** `app/layout.tsx`: **@graph** JSON-LD (`WebSite`, `Organization` with valid `ImageObject` logo, `SearchAction`).
- **`app/sitemap.ts`**, **`app/robots.ts`**: Crawler-oriented routes.

### 4.9 Operations

- **`middleware.ts`**: When `NEXT_PUBLIC_MAINTENANCE_MODE=true`, rewrites to `/maintenance` while allowing static assets and `/api` (if used) through.

### 4.10 Global UX primitives

- **`lib/auth-context.tsx`**: User payload **cached in localStorage** for 5 minutes to cut redundant `/users/{username}` traffic; coordinates logout and token clearing on **401/404**.
- **`lib/video-context.tsx`**: **Persistent player**: mini player when leaving `/watch/*`, expanded on watch route; avoids restarting the same video id.
- **`components/video/global-persistent-player.tsx`**: Integrates with **processing** state (`lib/video-utils.ts`) before navigation expand.

---

## 5. Feature inventory (by product area)

### 5.1 Authentication and account

- Login, signup, OTP verification, forgot password (`app/login`, `app/signup`, `app/forgot-password`).
- **`lib/auth-errors.ts`**: Firebase codes mapped to user-safe messages.
- **`components/auth/auth-dialog.tsx`**: Reusable auth entry.

### 5.2 Discovery and playback

- **Home / Discover** with SSR first page + client infinite scroll (`app/(main)/page.tsx`, `home-feed-client.tsx`).
- **Watch** page with client orchestration (`watch-client.tsx`, `page.tsx`), **comment section**, share dialog, delete (owner), **next-up** overlay, **HLS test** page for diagnostics (`app/(main)/test-hls`).
- **Search** (`app/(main)/search/page.tsx`, `components/search/search-overlay.tsx`).
- **History** and **Liked** feeds (`app/(main)/history`, `liked`).
- **Following** feed and empty states (`app/(main)/following`).

### 5.3 Playlists

- Owner playlist CRUD and ordering surfaced through **`lib/api-client.ts`** (`listMyPlaylists`, `getPlaylist`, `createPlaylist`, reorder/add/remove helpers as implemented).
- **`lib/playlist-session.ts`**: Persists **playlist playback session** (ids, index, autoplay) in `sessionStorage` for watch continuity.
- **`app/(main)/playlists/page.tsx`**: Full playlists UX (large client module: list management, drag/reorder patterns if present, integration with add-to-playlist).
- **`components/video/add-to-playlist-dialog.tsx`**: **Virtualized** list for scale when many playlists exist.

### 5.4 Profiles and social

- **Profile** pages (`app/(main)/profile/[username]/`) with `profile-client.tsx` (tabs, videos grid, follow, edit profile, picture editor dialogs).
- **Creator apply** flow (`app/(main)/creator/apply`).

### 5.5 Upload

- **`app/upload/page.tsx`**: Creator upload flow integrated with **`VideoUploadQueueProvider`**.
- **`lib/upload-pending-video.ts`**: Supporting utilities for pending upload lifecycle (used by upload UX).

### 5.6 Admin

- **Admin dashboard** (`app/admin/dashboard/page.tsx`) with analytics overview, **videos**, **users**, **comments**, **replies** tables (`components/admin/*`), filters, skeletons, sortable headers.

### 5.7 Legal, support, and marketing surfaces

- Terms of use, privacy policy, payment terms, support (`app/(main)/terms-of-use`, `privacy-policy`, `payment-terms`, `support`).

### 5.8 Analytics

- **`components/analytics/ga-tracker.tsx`**, **`clarity-tracker.tsx`**, `@vercel/analytics`.

### 5.9 App shell

- **Navbar**, **sidebar**, **app layout** (`components/layout/*`, `app/(main)/layout.tsx`), theme provider (`components/theme-provider.tsx`), toasts, route history helper (`lib/route-history.tsx`).

---

## 6. Notable code references (for deep dives)

| Topic | Location |
|-------|----------|
| API + auth retry | `lib/api-client.ts` |
| Env config | `lib/config.ts` |
| Workers URL builders | `lib/storage.ts` |
| Video URL resolution + cache | `lib/video-resolver.ts` |
| Streaming proxy (Range) | `app/proxy/video/stream/route.ts` |
| Image proxy | `app/proxy/image/[...path]/route.ts` |
| ISR + JSON-LD home | `app/(main)/page.tsx` |
| Watch SEO layout | `app/(main)/watch/[videoId]/layout.tsx` |
| Public SEO fetch + cache | `lib/seo/fetch-public.ts` |
| Feed state + scroll restore | `app/(main)/home-feed-client.tsx` |
| Feed seed session | `lib/seed-manager.ts` |
| Upload queue | `lib/video-upload-queue-context.tsx` |
| Mini / persistent player | `lib/video-context.tsx`, `components/video/global-persistent-player.tsx` |
| Maintenance gate | `middleware.ts` |
| Service worker | `public/sw.js`, `lib/service-worker.ts` |

---

## 7. Documentation assets in-repo

- **`lib/VIDEOS_API.md`**: Backend video API behavior including **deterministic random pagination**, upload flow, and error contracts — useful when reasoning about **feed stability** and **upload reliability**.

---

## 8. Gaps and follow-ups (engineering honesty)

- **`lib/api.ts`** enables **`MOCK_MODE`** when `typeof window !== 'undefined'`; the production app path relies on **`apiClient`** in `lib/api-client.ts`. Any cleanup would align on a single HTTP layer for clarity.
- **Service worker** (`public/sw.js`) contains **hardcoded Worker host hints** in comments and a default key placeholder; production should ensure **`SET_AUTH_HEADERS`** messaging from `lib/service-worker.ts` always matches deployment secrets and worker domains.

---

## 9. Conclusion

This codebase delivers a **full creator streaming product**: discovery, watch, playlists, profiles, uploads, admin, and SEO. Scalability and stability are addressed through **environment-aware configuration**, a **robust authenticated API client**, **efficient feed and list patterns**, **streaming-aware proxies**, **service worker–assisted media auth**, **background uploads**, and **server-driven metadata** for search and sharing — forming a coherent architecture suitable for growth on top of the existing REST and Workers infrastructure.
