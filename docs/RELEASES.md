# Web releases

| Branch | Version line | Environment |
|--------|--------------|-------------|
| `hiffi_dev_v2` | **2.0.x** (active UI revamp) | Dev |
| `release/1.0.0` | **1.0.x** (frozen baseline) | Rollback / hotfixes |
| `new-main` | Production | Prod |

Version source: `package.json`. Prod and rollback deploys should use git tag `web-vX.Y.Z`.

## Version lines

| Tag / branch | When to use |
|--------------|-------------|
| `web-v1.0.0` + `release/1.0.0` | Roll back dev or prod to pre–UI-revamp (save-to-playlist, SEO, etc.) |
| `hiffi_dev_v2` (2.0.0+) | New UI revamp work |

## Roll back dev to 1.0.0 (no force-push)

On the dev server:

```bash
git fetch origin --tags
git checkout release/1.0.0
npm ci
export NEXT_PUBLIC_APP_BUILD_ID="$(git rev-parse --short HEAD)"
npm run build
# restart app
```

Or deploy exact tag:

```bash
git checkout web-v1.0.0
```

## Resume 2.0 UI work on dev

```bash
git checkout hiffi_dev_v2
git pull origin hiffi_dev_v2
```

## Cut 1.0.0 to production (when ready)

```bash
git checkout new-main && git pull
git merge web-v1.0.0 -m "release: web 1.0.0"
git push origin new-main
# Deploy from tag web-v1.0.0
```

## Cut 2.0.0 (after revamp QA)

```bash
git checkout hiffi_dev_v2 && git pull
# package.json should be 2.0.0
git tag -a web-v2.0.0 -m "Web release 2.0.0"
git push origin web-v2.0.0
git branch release/2.0.0 web-v2.0.0 && git push origin release/2.0.0
git checkout new-main && git merge web-v2.0.0 -m "release: web 2.0.0" && git push
```

## Hotfix on 1.0.x (while 2.0 develops)

```bash
git checkout release/1.0.0
git checkout -b hotfix/1.0.1
# fix, bump package.json to 1.0.1, commit
git tag -a web-v1.0.1 -m "Web hotfix 1.0.1"
git push origin web-v1.0.1 release/1.0.0
# merge to new-main and cherry-pick/merge to hiffi_dev_v2 if needed
```

## Verify live version

```bash
curl -s https://your-domain/api/version | jq
# { "version": "2.0.0", "buildId": "..." }
```
