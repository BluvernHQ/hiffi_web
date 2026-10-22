# Hiffi Web — Release notes (v3.1.2)

**Version:** 3.1.2 (follows v3.1.1)  
**Ship date:** October 22, 2026  
**Status:** Ready to ship

Prior release: [v3.1.1](./web-v3.1.1.md)

---

## In one sentence

The Artist Index shows a rank **band** instead of an exact place, and a claimed artist sees their real number only on their own profile.

---

## Why this release matters

| Goal | What we ship |
| --- | --- |
| **Make the index browsable by tier** | All, Top 1,000, Top 5,000, and Top 10,000 on every Artist Index roster. The Hiffi 500 stays on `/top-artists`. |
| **Create a reason to claim** | Public cards and profiles show Top 5%, Top 10%, Top 25%, or a numbered bucket. They do not show `#515`. |
| **Give claimed artists their number** | A private **Your ranking** card on their own profile, loaded from `GET /inventory/me/ranking`. |

---

## For listeners and fans

### Artist Index

- The roster opens on **All** (newly claimed and verified artists, as before).
- **Top 1,000**, **Top 5,000**, and **Top 10,000** filter that same roster. The links are on the hub, search, city pages, and genre pages.
- Each filter is the next slice, not another copy of #1. Top 1,000 is global 501–1,000. Top 5,000 is 1,001–5,000. Top 10,000 is 5,001–10,000.
- Switching a filter does not jump the page back to the top.
- A portrait shows **one** hint, on the photo: **Top 5%**, **Top 10%**, or **Top 25%** when the weekly band is a percent. Otherwise **Top 100**, **Top 500**, **Top 1,000**, **Top 5,000**, or **Top 10,000**.
- The six faces under **Top of the index** still show **#1** through **#6**.

### Public profiles

- The rank plate uses that same single hint. Someone at global 515 reads **Top 5%**, not `#515 Charting`.
- The exact place is not on the public page. Claiming the profile is how the artist sees it.

---

## For artists

### Your ranking

- On `/profile/{username}`, signed in as that artist, a claimed profile shows **Your ranking**. The card says only they can see it.
- The number is the API’s `global_rank`. The site does not recalculate it.
- The card shows the exact place, how many artists are ranked, the percentile, movement this week and this month, spots to the next band, city and genre ranks, YouTube and Instagram standings, and a weekly sparkline.
- If they are not ranked yet, the card says rankings refresh every Monday and they need about a week of healthy YouTube or Instagram data.
- The card stays hidden when they are signed out, the profile is not claimed, or the ranking request fails.

---

## Notes

- Chart slices use `GET /inventory/top?top=1000|5000|10000`. Do not use `GET /inventory/top/city` for these filters.
- The private card calls `GET /inventory/me/ranking` through `/proxy/inventory/me/ranking` with the artist’s token.
- `package.json` on this branch is still `3.0.0`. Bump it to `3.1.2` on the commit you promote.
