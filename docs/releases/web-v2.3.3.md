# Hiffi Web — Release notes (v2.3.3)

**Version:** 2.3.3 (follows v2.3.2 from August 31, 2026)  
**Ship date:** September 1, 2026  
**Status:** Shipped

Prior release: [v2.3.2 — August 31, 2026](./web-v2.3.2.md)

> **Do not announce:** Latest **`/top-artists`** (Hip-Hop 500) — still held for a dedicated ranking launch.

---

## In one sentence

Watch Next/Up Next works reliably through multiple videos, and local development login is unblocked when Turnstile keys are configured.

---

## Why this release matters

| Goal | What we ship |
| ---- | ------------ |
| **Continuous viewing** | Users can chain Next through the queue without getting stuck on the same recommendation |
| **Player stability** | Fewer Video.js console errors when swapping sources in-place |
| **Local dev** | Login/signup on localhost without Turnstile blocking the form |

---

## What's included

| Item | What changes |
| ---- | ------------ |
| **Player Next** | Skips current + already-watched videos; fresh recommendations per advance |
| **Up Next sidebar** | List updates when the watch page changes video in-place |
| **Autoplay at end** | Uses the same in-place handoff as the Next button (fullscreen preserved) |
| **Video.js** | Safer source switching; no spurious unsupported-source errors during transitions |
| **Feed hover** | Removes React `flushSync` warning from card preview teardown |
| **Auth (local)** | Turnstile hidden on localhost so dev login/signup work with production keys in `.env` |

---

## For product & leadership

Patch release focused on watch-session quality and developer ergonomics. Low risk; no new user-facing features beyond reliability fixes.

**Still not announced**

- Latest **`/top-artists`** / Hip-Hop 500 product
- Full multi-platform HPS ranking
