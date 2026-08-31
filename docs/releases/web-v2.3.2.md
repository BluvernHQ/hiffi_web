# Hiffi Web — Release notes (v2.3.2)

**Version:** 2.3.2 (follows v2.3.1 from August 15, 2026)  
**Ship date:** August 31, 2026  
**Status:** Shipped

Prior release: [v2.3.1 — August 15, 2026](./web-v2.3.1.md)

> **Do not announce:** Latest **`/top-artists`** (Hip-Hop 500) — still held for a dedicated ranking launch.

---

## In one sentence

Artist Index claim forms now capture how artists discovered Hiffi, and admins can see that answer in the claims queue.

---

## Why this release matters

| Goal | What we ship |
| ---- | ------------ |
| **Attribution** | Know which channels drive Artist Index claim submissions |
| **Ops clarity** | Admin claims table includes discovery source without opening each claim |

---

## What's included

| Item | What changes |
| ---- | ------------ |
| **Claim form** | Required **How did you find us?** dropdown (Search, Email, Instagram, ChatGPT, Other) with optional free-text when Other is selected |
| **API** | `discovery_source` validated and forwarded on claim submit |
| **Admin** | Inventory claims table shows discovery source label per row |

---

## For product & leadership

Small, low-risk release focused on claim attribution. Safe to ship alongside ongoing Artist Index work on `new-main`.

**Still not announced**

- Latest **`/top-artists`** / Hip-Hop 500 product
- Full multi-platform HPS ranking
