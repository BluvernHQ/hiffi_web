# Hiffi Web — Release Runbook

This runbook implements the versioning model in the Hiffi Web Versioning spec.

## Identifiers

| Identifier | Source | Example | When it changes |
|------------|--------|---------|-----------------|
| **Release version** (semver) | `package.json` → `NEXT_PUBLIC_APP_VERSION` | `2.0.1` | Intentionally at cut/release time |
| **Build ID** | `NEXT_PUBLIC_APP_BUILD_ID` at build time | `19d0b1f` | Every deploy/build |

Verify what is live:

```bash
curl -s https://dev.hiffi.com/api/version
# { "version": "2.0.1", "buildId": "19d0b1f" }
```

## Promotion pipeline

Work flows in one direction through three environments:

```
hiffi_dev_v2  →  hiffi_preprod  →  new-main
   (dev)         (preprod)         (production)
```

| Step | Branch | Environment | What happens |
|------|--------|-------------|--------------|
| 1 | `hiffi_dev_v2` | Dev | Daily feature work on the active `2.0.x` line |
| 2 | `hiffi_preprod` | Preprod | Merge dev when a milestone is ready; QA / soak testing |
| 3 | `new-main` | Production | Merge preprod when validated; deploy matches a `web-v*` tag |

**Rules**

- Promote **dev → preprod** when a batch is ready for staging (not every commit).
- Promote **preprod → new-main** only after preprod sign-off — never skip preprod for production.
- Bump semver + cut `web-v*` tag on the commit you promote to `new-main` (or on `hiffi_preprod` if that is the release tip).
- `release/1.0.0` stays a separate frozen rollback line for `1.0.x` hotfixes only.

> **Note:** The older `dev` branch is not part of this pipeline. Active development lives on `hiffi_dev_v2`.

## Branch ↔ version line

| Branch | Version line | Role |
|--------|--------------|------|
| `hiffi_dev_v2` | `2.0.x` (active) | UI revamp and forward development |
| `hiffi_preprod` | `2.0.x` (candidate) | Pre-production validation before prod |
| `new-main` | Matches last promoted tag | Production deploys |
| `release/1.0.0` | `1.0.x` (frozen) | Rollback baseline — hotfixes only |

**Source of truth for semver:** `package.json`.

Production and rollback deploys should check out the matching `web-v*` tag (or `release/*` branch tip) — not an arbitrary commit without a version bump.

## Git tags

Tags are prefixed with `web-` to namespace from backend/mobile:

| Bump | Tag example | When |
|------|-------------|------|
| MAJOR | `web-v2.0.0` | Breaking UX/architecture shift or new product line |
| MINOR | `web-v1.1.0` | Backward-compatible features on a frozen line (rare) |
| PATCH | `web-v1.0.1` | Bugfixes on an already-released line — no new scope |

Existing tags: `web-v1.0.0`, `web-v1.0.1`.

## Consolidation pipeline

1. **Daily development** — commit on `hiffi_dev_v2`.
2. **Promote to preprod** — merge `hiffi_dev_v2` → `hiffi_preprod` when staging-ready.
3. **Theme / milestone** — group work under a user-facing initiative; draft a `CHANGELOG.md` section.
4. **Version bump + tag** — on the preprod-validated commit, before or as part of prod promotion:

   ```bash
   # PATCH example (2.0.1 → 2.0.2)
   npm version patch --no-git-tag-version
   git add package.json CHANGELOG.md
   git commit -m "chore(release): web v2.0.2"
   git tag -a web-v2.0.2 -m "web v2.0.2 — <short summary>"
   git push origin HEAD web-v2.0.2
   ```

5. **Promote to production** — merge `hiffi_preprod` → `new-main` (tagged commit only).
6. **Branch freeze (optional)** — create `release/X.Y.Z` for long-lived hotfix lines.

## What belongs in each release type

**Major / minor (active line)**

- One primary user-facing initiative
- Supporting infra shipped in the same window (version endpoint, stale guard, etc.)
- Pre-release fixes that block safe shipping

**Patch (frozen line)**

- Regressions on an already-tagged baseline only
- No new features or scope creep

**Unversioned until tagged**

- Work after a major line starts but before `web-vX.Y.Z` is cut → stays under `[Unreleased]` in `CHANGELOG.md`
- Commits on `new-main` ahead of the last promoted tag
- Unpushed / uncommitted work

## Deploy notes

- `NEXT_PUBLIC_APP_VERSION` is injected from `package.json` at build time (`next.config.mjs`).
- `NEXT_PUBLIC_APP_BUILD_ID` defaults to the short git SHA (`GITHUB_SHA` / `VERCEL_GIT_COMMIT_SHA` in CI).
- `DeployStaleGuard` polls `/api/version` and prompts users to refresh when the live build ID differs from their tab.

## Support triage

1. Ask user for environment URL.
2. Run `curl -s <origin>/api/version`.
3. Match `version` to `CHANGELOG.md` / git tag; use `buildId` to find the exact CI commit.
