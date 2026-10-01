# Hiffi Web — Release notes (v3.1.0)

**Version:** 3.1.0 (follows v3.0.0 from September 2, 2026)  
**Ship date:** TBD  
**Status:** Draft — pending promotion of `hiffi_dev_v2` → `hiffi_preprod` → `new-main`

Prior release: [v3.0.0 — September 2, 2026](./web-v3.0.0.md)

---

## In one sentence

The **Artist Index** and **Hip-Hop 500** get a premium redesign with public ranks, artists can **claim their profile and sign in straight away**, profiles and search get a refresh, admins get **role-based access** and **creator metrics**, and video now streams **directly from Cloudflare**.

---

## Why this release matters


| Goal                                    | What we ship                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| **Make the Artist Index a destination** | New hub, city and genre pages, artist detail pages, Hiffi 500 rank plates      |
| **Turn the chart into a product**       | Server-rendered `/top-artists` with podium, board, drawer, movers, share cards |
| **Grow claimed profiles**               | One-step claim with password and socials, instant sign-in, email confirmation  |
| **Better artist profiles**              | Edit page, banner and picture upload, owner rank card, gated email reveal      |
| **Safer admin access**                  | Custom roles with granular permissions                                         |
| **Faster playback and home**            | Video served from Cloudflare without the nginx proxy; hero paints sooner       |
| **Compliance and marketing**            | Cookie policy and consent banner; About, For Creators, For Fans pages          |


---



## For listeners & fans



### Hip-Hop 500 (`/top-artists`)

- Rebuilt as a **native, server-rendered chart** in a dark theme: podium, full board, artist drawer, movers and a how-it-works page.
- Shows **only Hiffi 500 artists**; city boards and risers are filtered to members. Scores and live ranks are hidden outside the 500.
- **7-day momentum** column and arrows on the board, drawer and movers.
- **Searchable city picker** replaces the native select.
- **Share cards** — square and story PNGs with a share sheet in the drawer (`/top-artists/share/[username]`).
- Removed the old `/hiffi-500` route family and its redirects; those URLs now return 404.
- Chart API responses are cached and loaded in parallel, so the chart and Artist Index open faster.



### Artist Index

- **New hub:** dark masthead with the weekly top 5, city scenes, portrait roster (12 per page) and a claim band.
- **City and genre landing pages** with a city chart, roster grid and more scenes. Clearing search keeps you on the city or genre page; genres with no artists are hidden.
- **Artist detail page:** full-bleed hero, standing, story, listen and scene sections. **Watch on Hiffi** is the primary action.
- **Hiffi 500 rank plates** with tiered metallic styling on cards, rows and the profile hero; city and genre rank shown as a second segment. The plate opens the chart on that artist's row.
- **Claimed** and **Under review** chips on roster cards.
- **Verified badge** tooltip on artist cards, the profile masthead and the chart.
- On mobile, cities are a swipe rail so the roster appears sooner.



### Navigation and search

- Artist Index, Top Artists and Hiffi 500 use the **main Hiffi navbar**, with an "Artist Index" or "Hip-Hop 500" label beside the logo.
- **Search results page** redesigned, with creator cards.



### Watching

- Video, images and profile pictures load **directly from Cloudflare** (no nginx proxy), so responses can be cached at the edge.
- The **home hero poster** is in the first HTML response, so home paints sooner.
- Player fixes; the cursor hides when inline or fullscreen playback is idle.



### New pages

- `/about`, `/for-creators`, `/for-fans`, `/book-walkthrough`.
- `/cookie-policy` and a **cookie consent banner**; third-party analytics respect the choice.
- Press kit and founder assets updated.

---



## For artists & creators



### Claim your profile in one step

- The claim form now collects **name, email, password**, optional **socials** (Instagram, YouTube, TikTok, Facebook), **city, sound, collaboration preference** and how you found Hiffi.
- **Sign in straight away** on submit — a short loading state, then a welcome hand-off to your profile or Studio.
- A **confirm your email** link is sent; `/claim/confirm` completes it. Until then, a banner reminds you without blocking anything.
- A **claim status banner** (under review, confirm email) shows across the site and in **Hiffi Studio**.
- Claims are remembered on the device; returning signed-out visitors are told they can sign in, with a **Sign in** button.
- If a login link targets a different account, you're asked whether to **switch accounts**.
- Approved claimants land on login with their **email prefilled**; forgot-password is prefilled too.



### Your profile

- New **profile edit page** (`/profile/[username]/edit`) with artist fields, **banner** and **profile picture** upload.
- **Owner rank card** — owners see their private standing.
- Owners see their **account email**; visitors can reveal it behind a Turnstile check.
- Referral is shown above the account email.



### Sessions

- If your session is revoked or expires, you're **signed out cleanly** with a short message instead of every request failing.
- Emails are lowercased at login.

---



## For admins

- **Role-based access control v2:** create custom roles with a permission picker and a permission catalog.
- **Creator metrics dashboard** including claimed creators, growth and Instagram metrics.
- **Traffic analytics** with a country map.
- **Claims:** approval email in the funnel, **resend approval email**, claim **email conflict** flags, and full claim details (socials, city, sound).
- Feature request display and form metadata improvements.

---



## Deploy checklist

- **Env:** set `INVENTORY_CLAIM_ACCOUNT_SETUP=true` only when the API build supports claim account setup and instant login. Leave it unset to keep the old claim flow.
- **Env (optional):** `NEXT_PUBLIC_CALENDLY_WALKTHROUGH_URL` overrides the walkthrough link.
- **Backend dependencies:**
  - Claim account setup and instant login — `docs/backend-claim-account-setup-requirements.md`, `docs/backend-claim-instant-login-requirements.md`
  - Granular admin permissions — `docs/admin-rbac-granular-permissions-backend-spec.md`. Until shipped, the frontend compresses granular selections into legacy umbrella keys on save.
  - Rank bands below 500 — `docs/backend-rank-ladder-requirements.md`. Ranks 1–500 work today; everything below waits on this.
- **Cloudflare:** confirm the Workers media routes serve and cache without `x-api-key` before deploy.
- `/top-artists` pages are **excluded from sitemaps**.

---



## Notes

- **Merge from** `hiffi_dev_v2` **into** `new-main` **must keep v3.0.0 features** that exist only on `new-main`: the personalized home feed (`/videos/recommend`, `lib/related-videos.ts`, `lib/home-feed-session.ts`) and instant signup. The biggest conflicts are in `lib/auth-context.tsx`, `app/(main)/home-feed-client.tsx`, `app/(main)/home-client.tsx`, `components/video/video-player.tsx` and `app/(main)/watch/[videoId]/watch-client.tsx`.
- The static `/top-artist` page and old favicon files on `new-main` are replaced by the native `/top-artists` chart and the app icon. Decide whether `/pitch` should stay before merging.
- Do not merge `.tmp-ff-resp/` (scratch screenshots).
- Bump `package.json` to `3.1.0` and cut the `web-v3.1.0` tag on the promoted commit.

