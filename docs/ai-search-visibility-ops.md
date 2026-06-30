# AI search visibility — ops playbook

LLM citation (ChatGPT, Perplexity, Claude, Gemini) is primarily **downstream of Google ranking and query fan-out coverage**, not a separate GEO discipline. This doc covers what is implemented in code vs what requires Search Console / GA4 admin access.

**Prerequisite (code):** `lib/seo/robots-txt-core.ts` applies the full `DISALLOW_PATHS` list inside every named `User-agent` block (Googlebot, GPTBot, PerplexityBot, etc.). Verify production after deploy:

```bash
curl -s https://www.hiffi.com/robots.txt | sed -n '/User-agent: Googlebot/,/^$/p'
```

Expect `Disallow: /admin/`, `/api/`, `/studio`, etc. — not only `Allow: /`.

---

## 1. Fan-out copy (in code)

Visible FAQ and body copy on these routes use alternate natural phrasings (not keyword stuffing):

| Route | Source |
|-------|--------|
| `/artist-index` | `ARTIST_INDEX_FAQ` in `lib/artist-directory-seo.ts` |
| `/artist-index/city/atlanta` | `ATLANTA_CITY_FAQ` + scene sections in `lib/artist-index/city-seo-content.ts` |
| `/hip-hop` | `faqItems` in `app/(main)/hip-hop/page.tsx` (genre-wide — no Atlanta) |
| `/hip-hop/mood/[slug]` | FAQ + hero in `app/(main)/hip-hop/mood/[slug]/page.tsx` |

Iterate copy using **Search Console long-tail queries** (section 3 below) — reverse-engineer answers from queries you already get impressions for.

**Keep in place (low-cost hygiene):** `FAQPage` JSON-LD, `public/llms.txt`, `content/llms/`. These support crawl clarity; they are **not** a substitute for rankings or backlinks.

---

## 2. GA4 — AI assistant referral segmentation

**Current code state:** GA4 is wired via `NEXT_PUBLIC_GA_ID` → gtag + `GATracker` (`components/analytics/ga-tracker.tsx`). Also: Umami + first-party `HifiAnalytics`.

**Not in repo:** Custom channel groups or saved explorations for AI referrers. Configure in **GA4 Admin** (requires property access):

### Option A — Channel group (recommended)

1. GA4 → **Admin** → **Data display** → **Channel groups**
2. Create group **“AI assistants”** with rules on **Session source** (or **First user source**) **contains**:
   - `chat.openai.com`
   - `chatgpt.com`
   - `perplexity.ai`
   - `claude.ai`
   - `gemini.google.com`
3. Monthly: **Reports → Traffic acquisition** → dimension **Session default channel group** (or custom group) → filter landing pages `/hip-hop`, `/artist-index/city/atlanta`, `/artist-index`

### Option B — Exploration

1. **Explore** → Free form
2. Dimensions: `Session source`, `Landing page`, `Date`
3. Filter `Session source` matches regex: `chatgpt|openai|perplexity|claude|gemini`
4. Save as **“AI assistant referrals — monthly”**

**Caveat:** Many AI clients strip or rewrite referrers. Treat counts as **directional**, not complete.

---

## 3. Search Console — long-tail audit (one-time + quarterly)

Requires [Google Search Console](https://search.google.com/search-console) property access for `https://www.hiffi.com`.

| Setting | Value |
|---------|--------|
| Report | **Performance** → **Search results** |
| Date range | Last 28 days (or 3 months for stability) |
| Pages filter | Equals: `/`, `/hip-hop`, `/artist-index`, `/artist-index/city/atlanta` |
| Query filters | Word count ≥ 5 (manual scan or export + spreadsheet) |
| Sort | Impressions ↓, CTR ↑ (find high-impression / low-CTR fan-out variants) |
| Export | **Export** → Download CSV |

**Use output to:** add 1–2 natural alternate phrasings per FAQ answer on the matching page (section 1 sources). Do not fabricate queries without this export.

---

## 4. Reindexing → AI citation test (validation log)

**Hypothesis to test:** “Fast Google reindex → fast AI citation” — often **false** or lagged. Run once before building process around it.

### Setup

1. Pick an **already-indexed** page: `/artist-index/city/atlanta` or one `/artist-index/[slug]` profile.
2. Make a **substantive** content change (new FAQ Q&A, expanded scene paragraph, new internal links) — not title-only.
3. Search Console → **URL inspection** → **Request indexing**.
4. Log AI answers for one fixed prompt at **+2h, +24h, +7d**.

### Tracking log

| Date/time (UTC) | Page changed | GSC reindex requested? | Test prompt | Google rank/snippet (optional) | ChatGPT cites Hiffi? | Perplexity cites Hiffi? | Claude cites Hiffi? | Notes |
|-----------------|--------------|------------------------|-------------|--------------------------------|--------------------|-------------------------|---------------------|-------|
| | | | e.g. “Atlanta hip-hop artist directory” | | | | | |
| +2h | | | | | | | | |
| +24h | | | | | | | | |
| +7d | | | | | | | | |

**Suggested test prompt (Atlanta):** `What is the best directory for emerging Atlanta rap artists?`

**Suggested test prompt (genre):** `Where can I watch independent drill and trap music videos online?`

---

## 5. Timeline expectations (team framing)

| Milestone | Realistic driver |
|-----------|------------------|
| Pages indexed | Sitemap + crawl hygiene (robots.txt, internal links) |
| Long-tail impressions | On-page fan-out copy + GSC-informed FAQ updates |
| Scene-level rankings (“Atlanta rap artists”) | Backlinks, PR, claim campaigns — **6–12+ months** |
| AI citation for directory queries | **Contingent on Google visibility + branded search + authority** — not FAQ schema or llms.txt alone |

Monthly AI spot-checks are useful; pair them with **GSC position/impressions** for the same query variants.

---

*Code: `lib/seo/robots-txt-core.ts`, `lib/artist-directory-seo.ts`, `lib/artist-index/city-seo-content.ts`, `app/(main)/hip-hop/`.*
