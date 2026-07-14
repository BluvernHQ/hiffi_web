# Hiffi Web — Release Notes


| Field                    | Value                                                                   |
| ------------------------ | ----------------------------------------------------------------------- |
| **Release date**         | 22 June 2026                                                            |
| **Web version**          | `2.1.0` (`web-v2.1.0`)                                                  |
| **Mobile version**       | Not included — this release is **web only**. Mobile apps are unchanged. |
| **Previous web version** | `2.0.2` (`web-v2.0.2`)                                                  |


---

## Summary

Hiffi Web **2.1.0** is a creator- and discovery-focused release. Creators get a dedicated **Hiffi Studio** to upload videos and request YouTube content migration. Fans and partners get clearer ways to learn about Hiffi, explore hip-hop by mood, and reach the team for advertising or brand partnerships. Site-wide copy and landing pages now reflect Hiffi’s hip-hop-first positioning, making it easier to find artists, subgenres, and official information about the platform.

**Who benefits most**

- **Creators** — Studio hub, drag-and-drop upload, YouTube migration requests
- **Fans** — Hip-hop hub, mood pages, improved discoverability in search and sharing
- **Brands & press** — Advertising page, collaboration form, press kit
- **Admins** — Role-based dashboard access and new operational views (internal)

---

## New features

### Hiffi Studio (creators)

- **Studio home** at [hiffi.com/studio](https://www.hiffi.com/studio) — one place to upload and manage your presence.
- **Drag-and-drop upload** on the Studio home screen; drop a video file to start the upload flow.
- **Upload** moved to [hiffi.com/studio/tools/upload](https://www.hiffi.com/studio/tools/upload) with the same upload experience as before.
- **YouTube migration** at [hiffi.com/studio/tools/migrate](https://www.hiffi.com/studio/tools/migrate) — verify channel ownership with Google and submit a request to bring music videos or audio to Hiffi; track status from Studio.
- **Navbar** — signed-in creators see **Hiffi Studio** in the account menu.

### Discovery & hip-hop positioning

- **Hip-hop hub** at [hiffi.com/hip-hop](https://www.hiffi.com/hip-hop) — genre landing page with FAQs, subgenre links, and mood browsing.
- **Seven mood pages** (e.g. On Sight, Soul Search, Money Talk) at `/hip-hop/mood/[slug]` — browse drill, trap, conscious rap, lo-fi, and more by vibe.
- **Homepage & search** — titles and descriptions updated so discovery surfaces read as hip-hop-first.
- **Watch page sharing** — social preview cards can show video thumbnail, title, and artist when links are shared.
- **Footer** — new **Discover**, **About us**, **Business**, and **Creators** sections with links to key pages.

### Information & trust pages

New or expanded pages (minimal layout, easy to read):


| Page                 | URL                                                                 |
| -------------------- | ------------------------------------------------------------------- |
| About                | [/about](https://www.hiffi.com/about)                               |
| What is Hiffi?       | [/what-is-hiffi](https://www.hiffi.com/what-is-hiffi)               |
| How it works         | [/how-it-works](https://www.hiffi.com/how-it-works)                 |
| Hiffi Artists        | [/artists](https://www.hiffi.com/artists)                           |
| Creator Playbook     | [/creator-playbook](https://www.hiffi.com/creator-playbook)         |
| Creators for Change  | [/creators-for-change](https://www.hiffi.com/creators-for-change)   |
| Hiffi Advertising    | [/advertising](https://www.hiffi.com/advertising)                   |
| Brand collaboration  | [/collaborate](https://www.hiffi.com/collaborate)                   |
| Press kit            | [/press](https://www.hiffi.com/press)                               |
| Copyright & DMCA     | [/copyright](https://www.hiffi.com/copyright)                       |
| Community guidelines | [/community-guidelines](https://www.hiffi.com/community-guidelines) |


- **Brand collaboration form** at [/collaborate](https://www.hiffi.com/collaborate) — brands can submit partnership details; the team is notified by email.
- **FAQ** — new hip-hop-focused questions (subgenres, underground artists, comparison to general video platforms).
- **App download page** at [/app](https://www.hiffi.com/app) — refreshed copy for iOS and Android store links.

### Admin 

- **Role-based access** — admin sidebar and sections respect user role; unauthorized sections are hidden.
- **New dashboard sections** — Followers, Searches, and Migration Requests for platform operations.
- **Admin login** — refreshes account role on load so permission changes apply without a manual sign-out.

---

## Fixes & improvements

These are user-visible corrections or polish, not new product areas.

- **Upload links** — visiting `/upload` or `/upload/migrate` automatically sends you to the correct Studio URL (see Breaking changes).
- **Creator apply & FAQ** — copy updated to describe hip-hop focus and current creator flows.
- **Profile pages** — default description when a creator has no bio now describes them in a hip-hop context (better link previews).

*No dedicated regression-fix section was shipped separately in this batch; most work is new capability and content.*

---

## Breaking changes


| Change                         | What you need to do                                                                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Upload URL**                 | `/upload` permanently redirects to `/studio`. Update bookmarks, docs, and emails to [hiffi.com/studio](https://www.hiffi.com/studio) or [hiffi.com/studio/tools/upload](https://www.hiffi.com/studio/tools/upload). Old links still work via redirect. |
| **Migration URL**              | `/upload/migrate` redirects to `/studio/tools/migrate`. Update any saved links.                                                                                                                                                                        |
| **Studio & admin not indexed** | `/studio` and admin routes are excluded from search engines by design.                                                                                                                                                                                 |


No API contract changes for third-party integrators are part of this web release.

---

## How to update

### Fans & signed-in users

1. Open [hiffi.com](https://www.hiffi.com) (or your usual environment URL).
2. **Hard refresh** if the site looks stale: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux).

### Creators

1. Use **Hiffi Studio** from the account menu or go to [/studio](https://www.hiffi.com/studio).
2. Replace old `/upload` bookmarks with Studio URLs (redirects will work short term).
3. For YouTube migration, use [/studio/tools/migrate](https://www.hiffi.com/studio/tools/migrate).

### Verify version (optional)

```bash
curl -s https://www.hiffi.com/api/version
# Expect: { "version": "2.1.0", "buildId": "<git-sha>" }
```

Preprod / dev: use the same path on `preprod.hiffi.com` or `dev.hiffi.com` as appropriate.

### Admins

- Sign in at [/admin](https://www.hiffi.com/admin). If your role was recently changed, reload the page or sign in again to pick up access.

---

## Security & compliance updates

- **Copyright policy** published at [/copyright](https://www.hiffi.com/copyright) — how to report infringement and counter-notices.
- **Community guidelines** at [/community-guidelines](https://www.hiffi.com/community-guidelines) — expectations for respectful participation and enforcement.
- **Admin RBAC** — admin UI visibility is gated by role (backend still enforces API authorization).
- **Analytics on admin** — third-party analytics scripts do not load on `/admin` routes.
- **Brand collaboration** — form submissions validated server-side; sensitive errors direct users to [ads@hiffi.com](mailto:ads@hiffi.com).

No change to end-user password policy, payment flows, or privacy terms is introduced in this release beyond the new/linked policy pages above. See [/privacy-policy](https://www.hiffi.com/privacy-policy) and [/terms-of-use](https://www.hiffi.com/terms-of-use) for existing terms.

---

## Deprecations & removals


| Item                  | Status                                                        |
| --------------------- | ------------------------------------------------------------- |
| `**/upload` page**    | Removed as a standalone route; **301 redirect** to `/studio`. |
| `**/upload/migrate`** | Removed; **301 redirect** to `/studio/tools/migrate`.         |


No user-facing features (playlists, moods, guest history, etc.) are removed in this release.

---

## Documentation & support links


| Resource                 | Link                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FAQ                      | [hiffi.com/faq](https://www.hiffi.com/faq)                                                                                                                    |
| Support                  | [hiffi.com/support](https://www.hiffi.com/support)                                                                                                            |
| Email support            | [care@hiffi.com](mailto:care@hiffi.com)                                                                                                                       |
| Brand / ads              | [hiffi.com/advertise](https://www.hiffi.com/advertising) · [hiffi.com/collaborate](https://www.hiffi.com/collaborate) · [ads@hiffi.com](mailto:ads@hiffi.com) |
| Become a creator         | [hiffi.com/creator/apply](https://www.hiffi.com/creator/apply)                                                                                                |
| Creator Playbook         | [hiffi.com/creator-playbook](https://www.hiffi.com/creator-playbook)                                                                                          |
| Download mobile app      | [hiffi.com/app](https://www.hiffi.com/app)                                                                                                                    |
| Press                    | [hiffi.com/press](https://www.hiffi.com/press)                                                                                                                |
| Privacy Policy           | [hiffi.com/privacy-policy](https://www.hiffi.com/privacy-policy)                                                                                              |
| Terms of Use             | [hiffi.com/terms-of-use](https://www.hiffi.com/terms-of-use)                                                                                                  |
| Payment Terms            | [hiffi.com/payment-terms](https://www.hiffi.com/payment-terms)                                                                                                |
| Copyright                | [hiffi.com/copyright](https://www.hiffi.com/copyright)                                                                                                        |
| Community guidelines     | [hiffi.com/community-guidelines](https://www.hiffi.com/community-guidelines)                                                                                  |
| Engineering changelog    | `CHANGELOG.md` (repo)                                                                                                                                         |
| Release runbook          | `RELEASES.md` (repo)                                                                                                                                          |
| SEO implementation notes | `SEO_GEO_IMPLEMENTATION.md` (repo, internal)                                                                                                                  |


---

*Web release only. For mobile app release notes, use the mobile repository changelog.*