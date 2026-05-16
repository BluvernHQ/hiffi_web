# Web releases

| Branch | Environment |
|--------|-------------|
| `hiffi_dev_v2` | Dev |
| `new-main` | Production |

Version source: `package.json`. Prod deploys should use git tag `web-vX.Y.Z`.

## Cut a release

```bash
git checkout hiffi_dev_v2 && git pull

# Version already bumped in package.json for this release
git tag -a web-v1.0.0 -m "Web release 1.0.0"
git push origin web-v1.0.0

git branch release/1.0.0 web-v1.0.0   # optional, for hotfixes
git push origin release/1.0.0

git checkout new-main && git pull
git merge web-v1.0.0 -m "release: web 1.0.0"
git push origin new-main

# Deploy production from tag web-v1.0.0
```

Set build id at deploy time (recommended for stale-tab guard):

```bash
export NEXT_PUBLIC_APP_BUILD_ID="${GIT_SHA:-$(git rev-parse --short HEAD)}"
npm run build
```

## Hotfix (example 1.0.1)

```bash
git checkout release/1.0.0
git checkout -b hotfix/1.0.1
# fix, bump package.json to 1.0.1, commit
git tag -a web-v1.0.1 -m "Web hotfix 1.0.1"
git push origin web-v1.0.1
git checkout new-main && git merge web-v1.0.1 && git push
git checkout hiffi_dev_v2 && git merge web-v1.0.1 && git push
```

## Rollback

Redeploy a previous tag, e.g. `git checkout web-v1.0.0` and run your prod build/deploy pipeline.

## Verify live version

```bash
curl -s https://your-domain/api/version | jq
# { "version": "1.0.0", "buildId": "..." }
```
