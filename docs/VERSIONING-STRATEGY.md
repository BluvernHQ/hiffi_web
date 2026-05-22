# Hiffi Web — Versioning Strategy & Release Consolidation

> **Status:** Active  
> **Last updated:** 2026-05-22  
> **Related:** [RELEASES.md](./RELEASES.md) (deploy runbook) · [CHANGELOG.md](../CHANGELOG.md) (user-facing notes)

---

## 1. Purpose

This document explains **how we version the web app**, **what each number means**, and **how scattered development work is rolled into a single release**. It is written for engineers, release owners, and stakeholders who need a shared mental model—not step-by-step deploy commands (those live in `RELEASES.md`).

---

## 2. Two identifiers: release version vs build id

We deliberately separate **product releases** from **deploy artifacts**.

| Identifier | Source | Example | When it changes |
|------------|--------|---------|-----------------|
| **Release version** (semver) | `package.json` → `NEXT_PUBLIC_APP_VERSION` via `next.config.mjs` | `1.0.0`, `1.0.1`, `2.0.0` | Intentionally, at cut/release time |
| **Build id** | `NEXT_PUBLIC_APP_BUILD_ID` at build time, or `.next/BUILD_ID` | `b44b446`, full CI SHA | Every deploy/build |

**Why both exist**

- **Semver** answers: *“Which product baseline is live?”* — rollback, support, changelog, and “what features should be there.”
- **Build id** answers: *“Which exact bundle is running?”* — stale-tab detection (`DeployStaleGuard` polls `/api/version`), debugging prod vs dev, and CI traceability.

Live check:

```bash
curl -s https://<domain>/api/version
# { "version": "2.0.0", "buildId": "b44b446" }
```

Implementation:

- Semver: `lib/app-version.ts`, injected in `next.config.mjs`
- Build id: `app/api/version/route.ts`, set in CI (`NEXT_PUBLIC_APP_BUILD_ID: ${{ github.sha }}`) or on server (`git rev-parse --short HEAD`)

---

## 3. Versioning rules (semver)

We follow **semantic versioning** on the web app, with git tags prefixed by `web-`:

| Bump | When | Tag example |
|------|------|-------------|
| **MAJOR** (`X.0.0`) | Breaking UX/architecture shift, new product line, or intentional fork from prior baseline | `web-v2.0.0` |
| **MINOR** (`1.Y.0`) | Backward-compatible features on a frozen line (optional; we often ship features on the active dev line instead) | `web-v1.1.0` |
| **PATCH** (`1.0.Z`) | Bugfixes and small UX corrections on a **released** line without changing scope | `web-v1.0.1` |

**Tag format:** `web-vMAJOR.MINOR.PATCH` (annotated tags with a short release message).

**Branch ↔ version line mapping:**

| Branch | Version line | Role |
|--------|--------------|------|
| `hiffi_dev_v2` | **2.0.x** (active) | UI revamp and forward development |
| `release/1.0.0` | **1.0.x** (frozen) | Rollback baseline and 1.0 hotfixes |
| `new-main` | Tracks production | Prod deploys; merge from release tags when promoting |

**Source of truth for semver:** `package.json`. Prod and rollback deploys should checkout the matching **`web-v*`** tag (or `release/*` branch tip), not an arbitrary commit hash without a version bump.

---

## 4. How we consolidate work into a version

Releases are **not** “whatever landed on a branch this week.” Consolidation follows a deliberate pipeline:

```
  Daily commits (features, fixes, chores)
           │
           ▼
  Theme / milestone on dev branch  ──►  CHANGELOG section drafted
           │
           ▼
  Version bump in package.json  +  annotated git tag web-vX.Y.Z
           │
           ▼
  release/X.Y.Z branch (optional freeze)  ──►  promote to new-main when prod-ready
```

### 4.1 What gets bundled together

A **minor or major release** typically bundles:

1. **One primary user-facing initiative** (e.g. save-to-playlist redesign, UI revamp).
2. **Supporting infra** shipped in the same window (version endpoint, deploy stale guard, offline handling).
3. **Pre-release fixes** that block the initiative from shipping safely.

A **patch release** bundles only **regressions or defects** found on the **already-tagged** baseline—no new features.

### 4.2 What stays out of a version until tagged

- Work on `hiffi_dev_v2` after the **2.0.0** line starts is **2.0.x / unreleased** until tagged `web-v2.0.0`.
- Commits on `new-main` that are **ahead of** the last promoted tag are **not yet a named release** until merged and tagged.
- Uncommitted or unpushed work is invisible to versioning.

---

## 5. Release history — what each version contains

### 5.1 Pre-versioning baseline (implicit “0.x”)

Before `6e43c27` (*chore: start web versioning at 1.0.0*), the app had no formal semver or `web-v*` tags. The following shipped incrementally on the main development line and were **retroactively consolidated into 1.0.0** when versioning started:

| Theme | Representative work | Commits (examples) |
|-------|----------------------|-------------------|
| Admin | Activity log filters, pagination, referrals table, removed “goto” control | `f45932b` … `0bcf4dd`, pagination series |
| Reliability | Home feed caching fix, deploy stale guard, `/api/version` (build id only initially) | `7e01d6d`, `bd85a78` |
| Network / offline | `OfflineState`, connectivity detection across feeds, watch, search, player | `a64cb75` |
| Auth UX | Login/signup validation, required fields, password rules | `8929210` |
| Playlists / video UI | Save icon change, upload date removed from cards | `bd85a78` |
| Polish | Playlist title limits, duplicate names, feed empty-state suppression | `72b8f23`, `963b43f` |

These items are **documented under 1.0.0** in `CHANGELOG.md` as part of the first formal release narrative, even though some landed days before the version commit.

---

### 5.2 `web-v1.0.0` — first formal release (2026-05-16)

**Tag message:** *Web release 1.0.0 — save-to-playlist, SEO, versioning baseline*  
**Branch freeze:** `release/1.0.0` @ `2108384`  
**`package.json`:** `1.0.0`

| Layer | Consolidated into 1.0.0 |
|-------|-------------------------|
| **Versioning system** | `package.json` semver, `CHANGELOG.md`, `docs/RELEASES.md`, `lib/app-version.ts`, `/api/version` returns `{ version, buildId }`, CI injects build id |
| **Save to playlist** | Refactored dialog (pick / create / success views), desktop popover + mobile sheet, search, multi-select, bookmark state, scrolling fixes |
| **SEO** | Watch page meta (`lib/seo/watch-meta.ts`), schema, static/noscript SEO components, profile/watch layout improvements |
| **Creator** | Become-creator CTA and marketing split from apply flow |
| **Fixes** | Emoji picker portaled via Popover (`2108384`); items from pre-versioning week (caching, offline, auth, playlist chips) |

**Explicit release commits (after versioning chore):**

1. `6e43c27` — versioning scaffolding  
2. `23c0617` — save-to-playlist + SEO + creator (largest feature commit)  
3. `2108384` — emoji picker fix  
4. Tag `web-v1.0.0`

---

### 5.3 `web-v1.0.1` — patch on 1.0 line (2026-05-16)

**Tag message:** *Web release 1.0.1 — save-to-playlist Add button fix*  
**`package.json`:** `1.0.1` on `release/1.0.0`

| Fix | Issue addressed |
|-----|-----------------|
| Pending count after toggle | `3a66d94` — correct count when checking/unchecking playlists |
| Add button semantics | `81efcd5` — “Add” only counts **new** adds, not already-saved rows |
| Release chore | `54ec375` — bump `package.json` / lockfile |

**Consolidation rule demonstrated:** 1.0.0 shipped the feature; 1.0.1 shipped **only** save-to-playlist correctness fixes discovered immediately after freeze—no new surfaces.

---

### 5.4 `2.0.0` — active development line (unreleased)

**Branch:** `hiffi_dev_v2`  
**`package.json`:** `2.0.0` (since `7b4c2a3` *chore: start 2.0.0 UI revamp line*)  
**Tag:** not yet cut (`web-v2.0.0` planned after revamp QA)

| Status | Contents |
|--------|----------|
| **Declared in CHANGELOG** | UI revamp (in progress); guest conversion funnel |
| **On branch (`4eb921d`, post–`b44b446`)** | Guest conversion — local history/liked, passive nudges, pending like/follow replay (`lib/guest-conversion/`, `components/conversion/`) |
| **On branch (unreleased)** | Admin activity log From/To date range via `timestamp_after` / `timestamp_before` |
| **On branch (post–1.0.1 tag)** | Save-to-playlist fixes (uncheck removes, Save button label, Add-button count) — consolidates into **2.0.0** at cut |
| **Not in any tagged release** | All of the above until `web-v2.0.0` is cut |

**Consolidation plan for 2.0.0:**

1. Complete UI revamp scope on `hiffi_dev_v2`.  
2. Update `CHANGELOG.md` **## [2.0.0]** with Added/Changed/Fixed.  
3. Tag `web-v2.0.0`, create `release/2.0.0`, merge to `new-main` per `RELEASES.md`.

---

## 6. Branch and environment strategy

```
                    ┌─────────────────┐
                    │   hiffi_dev_v2   │  2.0.x — active development
                    └────────┬────────┘
                             │ merge when ready
                    ┌────────▼────────┐
                    │    new-main      │  production
                    └────────┬────────┘
                             │ deploy from web-v* tag
                    ┌────────▼────────┐
                    │  live /api/version │
                    └───────────────────┘

        ┌─────────────────┐
        │ release/1.0.0   │  1.0.x — rollback & hotfixes only
        └─────────────────┘
              ▲
              │ tag web-v1.0.x
```

| Environment | Typical branch / tag | Version shown |
|-------------|---------------------|---------------|
| Dev (revamp) | `hiffi_dev_v2` | `2.0.0` + dev build id |
| Dev/prod rollback | `release/1.0.0` or `web-v1.0.0` | `1.0.0` |
| Production | `new-main` deploy from promoted `web-v*` | Matches promoted tag |

---

## 7. Operational checklist (release owner)

When cutting any `web-vX.Y.Z`:

- [ ] All bundled work is listed in `CHANGELOG.md` under the correct version heading  
- [ ] `package.json` version matches the tag  
- [ ] Annotated tag: `git tag -a web-vX.Y.Z -m "Web release X.Y.Z — <one-line summary>"`  
- [ ] `release/X.Y.Z` branch created/updated if the line is frozen  
- [ ] Build uses `NEXT_PUBLIC_APP_BUILD_ID` (CI SHA or `git rev-parse --short HEAD`)  
- [ ] Verify: `curl /api/version` shows expected `version` and `buildId`  
- [ ] Promote to `new-main` only when prod-ready (`RELEASES.md`)

**Patch release (1.0.x while 2.0 develops):** branch from `release/1.0.0`, fix, bump patch in `package.json`, tag, push branch + tag; cherry-pick to `hiffi_dev_v2` only if the fix applies there too.

---

## 8. Analytics and support

- PostHog / GA use `NEXT_PUBLIC_APP_VERSION` (from `package.json`) as `appVersion` in `app/layout.tsx` and tracking docs.  
- Support should ask for **`/api/version`** output (semver + build id), not only “latest deploy.”  
- `DeployStaleGuard` uses **build id only**—users can stay on old JS until reload; semver does not trigger auto-reload.

---

## 9. Glossary

| Term | Meaning |
|------|---------|
| `web-v1.0.0` | Git annotated tag; immutable pointer to a release commit |
| `release/1.0.0` | Branch tracking the 1.0.x line for hotfixes and rollback |
| `buildId` | Per-deploy artifact id; changes every build |
| `version` | Semver from `package.json`; changes at release cuts |
| Consolidation | Grouping commits + changelog narrative under one tagged release |

---

## 10. Open decisions (draft)

| Question | Current leaning |
|----------|-----------------|
| When to promote 1.0.x to `new-main` vs wait for 2.0.0 | Documented in `RELEASES.md`; prod cut uses `web-v1.0.0` when pre-revamp baseline is desired |
| Minor vs patch for small features on 1.0 line | Prefer **patch** for fixes; **minor** only if extending 1.0 without revamp |
| Guest conversion / other WIP | Ship under **2.0.0** changelog section when tagged; do not backport to 1.0 without explicit decision |

---

## Appendix A — Commit → version quick reference

| Version | Tag | Tip commit | Primary consolidation |
|---------|-----|------------|------------------------|
| 1.0.0 | `web-v1.0.0` | `2108384` | Versioning + save-to-playlist + SEO + pre-week reliability/auth/offline |
| 1.0.1 | `web-v1.0.1` | `81efcd5` | Save-to-playlist pending count / Add button fixes |
| 2.0.0 | *(pending)* | `hiffi_dev_v2` HEAD | UI revamp + post-1.0.1 playlist fixes (+ future WIP) |

---

*For deploy commands, rollback, and hotfix git recipes, see [RELEASES.md](./RELEASES.md).*
