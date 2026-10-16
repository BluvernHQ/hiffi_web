# Hiffi Web — Release notes (v3.2.0)

**Version:** 3.2.0 (follows the v3.1.0 draft on `hiffi_dev_v2`, and v3.1.1 already on `new-main`)  
**Ship date:** October 15, 2026  
**Status:** Draft — pending promotion of `hiffi_dev_v2` → `hiffi_preprod` → `new-main`

Prior notes on this branch: [v3.1.0 draft](./web-v3.1.0.md)  
Production notes already on `new-main`: [v3.1.1 — October 10, 2026](./web-v3.1.1.md) (that file lives on `new-main`; it is not in this branch yet)

---

## In one sentence

Marketing pages get a new layout and search markup, listeners can sign in with Google or Apple when an admin turns it on, and a Top 5% / 10% / 25% plate on a profile opens that artist’s Artist Index page.

---

## Why this release matters

| Goal | What we ship |
| --- | --- |
| **Explain Hiffi on its own pages** | Redesigned Advertising, Artists, Atlanta, Creator Playbook, Creators for Change, How it works, Press, and What is Hiffi |
| **Let people sign in with an account they already have** | Google and Apple on the login page, with an admin switch for each |
| **Send rank badges to the right place** | Top 5% / 10% / 25% plates on a profile open `/artist-index/{username}` |
| **Search the chart on the server** | `/top-artists` search uses `GET /search/top-artists/{query}` |

---

## For listeners and fans

### Marketing pages

- New layouts and photography on Advertising, Artists, Atlanta, Creator Playbook, Creators for Change, How it works, Press, and What is Hiffi.
- Those pages now carry their own titles, share images, FAQ copy, and structured data so search and link previews match the page.

### Sign in

- Login still accepts email or username and a password.
- **Google** and **Apple** appear under the form only when that provider is configured and an admin has switched it on.
- If Better Auth or the bridge to the Hiffi API is down, password login falls back to the existing Hiffi sign-in.

### Profiles and the chart

- On a profile, the **Top 5%**, **Top 10%**, and **Top 25%** plates open that artist’s Artist Index profile.
- A city or genre rank plate that is shown on its own uses the same link.
- The **Hiffi 500** plate is unchanged: it still opens the chart on that artist’s row.
- Searching the Hip-Hop 500 asks the search API instead of scanning rows already loaded. Results are not limited to the selected city.
- While that search is running, the board shows loading rows. “No one by that name” appears only after the search finishes empty.

### Navigation

- Artist Index and Hip-Hop 500 are no longer entries in the main sidebar. They stay reachable from the navbar labels and in-page links.

---

## For admins

- The admin dashboard has **login provider** switches for Google and Apple.
- A switch does nothing useful until that provider’s client id and secret are set in the server environment. The login page hides a provider that is off or not configured.

---

## Deploy checklist

- **Env (required for Better Auth):** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL` (same Postgres as the Go API), `AUTH_BRIDGE_SECRET` (must match the Go backend).
- **Env (optional social):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`, `APPLE_APP_BUNDLE_IDENTIFIER`.
- Run `npm install` on any machine that pulled this branch. `better-auth` and `pg` are new dependencies.
- Load the server env before the Better Auth process starts (standalone start script does this).
- Chart search needs `GET /search/top-artists/{query}?limit&offset` on the API. Do not send `location` unless a city filter is explicitly applied.

---

## Notes

- This does not replace the v3.1.0 draft (Artist Index, Hip-Hop 500, claims, admin roles). That work is still documented in [web-v3.1.0.md](./web-v3.1.0.md).
- `new-main` is already at **v3.1.1** (`package.json` `3.1.1`, [web-v3.1.1.md](./web-v3.1.1.md) on that branch): dynamic Artist Index share cards, claim-page fixes, and Artist Index / Top Artists SEO. This branch’s changelog did not have that entry. Do not reuse `3.1.1` for this release.
- `package.json` on `hiffi_dev_v2` is still `3.0.0`. Bump it to `3.2.0` and cut `web-v3.2.0` on the commit you promote.
