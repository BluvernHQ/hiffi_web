# Universal SEO Checklist

A reusable checklist for any website — marketing site, SaaS, e-commerce, blog, marketplace, or app. Work top-to-bottom; skip sections that don’t apply (e.g. Local SEO if you have no physical location).

**How to use:** Copy this file per project, replace placeholders, and check items as you complete them. Re-run Critical + Monitoring quarterly.

---

## 0. Setup & ownership

- [ ] Primary domain decided (`www` vs apex); one preferred host only
- [ ] HTTPS on all pages; HTTP → HTTPS 301
- [ ] Preferred host redirect (e.g. `example.com` → `www.example.com` or reverse)
- [ ] Trailing-slash policy consistent (always with `/` or never); redirects for the other form
- [ ] Staging / preview sites blocked (`noindex` + robots disallow + auth if needed)
- [ ] Google Search Console property verified (URL-prefix or Domain)
- [ ] Bing Webmaster Tools property verified
- [ ] Analytics installed (GA4 or equivalent) with consent/cookie compliance where required
- [ ] Search Console ↔ Analytics linked (optional but useful)
- [ ] Who owns SEO ops documented (content, eng, marketing)

---

## 1. Crawl & indexability (Critical)

### robots.txt
- [ ] Live at `https://your-domain.com/robots.txt`
- [ ] Allows crawling of public content
- [ ] Disallows private / thin / duplicate paths (`/admin`, `/cart`, `/checkout`, `/account`, search-result URLs if needed, etc.)
- [ ] Does **not** block CSS/JS needed to render pages
- [ ] Declares sitemap URL(s)
- [ ] AI crawler policy intentional (allow citation bots if you want AI visibility; optionally restrict training bots)

### Sitemap
- [ ] XML sitemap(s) at a stable URL (e.g. `/sitemap.xml`)
- [ ] Only includes **canonical, indexable, 200** URLs
- [ ] Excludes noindex, redirected, and soft-404 pages
- [ ] Split into sitemap index if >50k URLs or >50MB
- [ ] `lastmod` accurate when you can maintain it
- [ ] Submitted in Google Search Console
- [ ] Submitted in Bing Webmaster Tools
- [ ] Image / video / news sitemaps added if those content types matter

### Indexation controls
- [ ] Every page has a clear index/noindex decision
- [ ] Private, user-generated junk, and thin filters use `noindex` or stay out of sitemap
- [ ] Canonical tag on every indexable page pointing to preferred URL
- [ ] Pagination, facets, and sort params handled (canonical, noindex, or `robots` rules — pick one strategy)
- [ ] Soft 404s return real 404/410 status (not 200 with “not found” copy)
- [ ] Important pages return 200; removed pages don’t soft-redirect forever to homepage

### Rendering
- [ ] Primary content available in HTML (or reliably rendered for crawlers)
- [ ] Critical text not locked behind login, tabs that never load, or infinite scroll only
- [ ] Mobile and desktop show the same indexable content (mobile-first indexing)
- [ ] “View source” / fetch-as-Google style check passes on key templates

**Quick checks**
```bash
curl -sL "https://your-domain.com/robots.txt"
curl -sL "https://your-domain.com/sitemap.xml" | head -80
# Google: site:your-domain.com
# Bing:   site:your-domain.com
```

---

## 2. URL architecture

- [ ] URLs short, readable, lowercase, hyphen-separated
- [ ] Stable URLs; changes use 301 redirects
- [ ] One content = one URL (no needless duplicates)
- [ ] Hierarchy reflects site topics (`/blog/topic/post`, `/products/category/item`)
- [ ] No session IDs or tracking params as the indexed URL
- [ ] Parameter handling documented (UTMs stripped via canonical)
- [ ] Orphan pages avoided — every important URL reachable via links

---

## 3. On-page SEO (every important template)

### Titles & descriptions
- [ ] Unique `<title>` per page (~50–60 characters visible; front-load primary intent)
- [ ] Unique meta description per page (~150–160 characters; clear benefit + CTA)
- [ ] Brand in title without stuffing (often at end via template)
- [ ] No duplicate titles across large URL sets
- [ ] SERP preview checked for key pages

### Headings & body
- [ ] One clear H1 that matches page intent
- [ ] Logical H2 → H3 hierarchy (no skipping for decoration)
- [ ] Primary topic covered early (answer-first for informational pages)
- [ ] Content matches search intent (informational / commercial / transactional / navigational)
- [ ] Enough depth to be useful; not thin doorway pages
- [ ] Lists, tables, and short paragraphs where they aid scanning
- [ ] Outdated claims reviewed on a schedule

### Media
- [ ] Descriptive `alt` on meaningful images; decorative images empty `alt=""`
- [ ] Images compressed; modern formats (WebP/AVIF) where supported
- [ ] Width/height (or aspect-ratio) set to reduce CLS
- [ ] Lazy-load below-the-fold images; **not** the LCP image
- [ ] Video pages have transcripts or substantial text where possible
- [ ] Filenames descriptive (`blue-running-shoes.webp` not `IMG_1234.jpg`)

### Links
- [ ] Descriptive anchor text (avoid “click here” as the only cue)
- [ ] Internal links to related money/hub pages
- [ ] Important pages linked from nav, footer, or hub pages
- [ ] Broken links fixed (internal and critical external)
- [ ] External links to trusted sources where claims need support
- [ ] `rel="noopener"` (and `noreferrer` if needed) on `target="_blank"`

### Social / share metadata
- [ ] Open Graph: `og:title`, `og:description`, `og:url`, `og:type`, `og:image`
- [ ] OG image ~1200×630, under platform size limits
- [ ] Twitter/X card (`summary_large_image` when you have a strong image)
- [ ] Share previews tested (Facebook Sharing Debugger, Twitter/X Card Validator, LinkedIn Post Inspector)

---

## 4. Structured data (JSON-LD)

Use only types that match **visible** content. Invalid or mismatched schema can be ignored or worsen trust.

### Sitewide / common
- [ ] `Organization` or `LocalBusiness` (as applicable) with name, URL, logo
- [ ] `WebSite` with `SearchAction` if you have site search
- [ ] `BreadcrumbList` on deep pages
- [ ] Social profiles in `sameAs` when accurate

### By page type (use what fits)
- [ ] Article / BlogPosting — posts
- [ ] Product (+ Offer, AggregateRating only if real) — product pages
- [ ] FAQPage — only if FAQs are visible on the page
- [ ] HowTo — only for real step-by-step guides
- [ ] Event — events with real dates/locations
- [ ] JobPosting — real open roles
- [ ] SoftwareApplication — apps/tools
- [ ] VideoObject — video pages
- [ ] Review / AggregateRating — only with genuine reviews

### Validation
- [ ] Rich Results Test / Schema Markup Validator pass on samples of each template
- [ ] Search Console Enhancements / rich result reports monitored after launch

---

## 5. Performance & Core Web Vitals

Field data (CrUX / Search Console) beats lab-only scores. Targets at 75th percentile:

| Metric | Good |
|--------|------|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |

- [ ] LCP element identified and optimized (image/font/server TTFB)
- [ ] INP: heavy JS deferred; main-thread work reduced; inputs feel snappy
- [ ] CLS: reserved space for ads, embeds, fonts, images
- [ ] Mobile CWV checked separately from desktop
- [ ] TTFB reasonable (CDN, caching, origin health)
- [ ] Third-party scripts audited (tags, chat, A/B tools)
- [ ] Fonts: `font-display`, subsetting, no invisible text flash that shifts layout
- [ ] Caching / CDN configured for static assets
- [ ] PageSpeed Insights + Search Console CWV report reviewed on key URL groups

---

## 6. Mobile, accessibility, UX (ranking-adjacent)

- [ ] Responsive layout; no horizontal scroll on common devices
- [ ] Tap targets usable; text readable without zoom hacks
- [ ] Same primary content on mobile as desktop
- [ ] Intrusive interstitials avoided (especially on entry)
- [ ] Accessibility basics: contrast, focus states, semantic HTML, form labels
- [ ] Language set via `<html lang="...">`

---

## 7. Content quality & E-E-A-T

- [ ] Clear purpose for each page; no duplicate near-copies for keyword variants
- [ ] Who wrote/updated content shown where trust matters (authors, bios, dates)
- [ ] About, Contact, and policy pages easy to find
- [ ] Claims backed by sources, data, or first-hand experience
- [ ] YMYL topics (health, finance, legal) held to higher accuracy/credential standards
- [ ] Thin tag/category/archive pages noindexed or improved
- [ ] User-generated content moderated (spam, scraped copy)
- [ ] Content refresh cadence for pages that earn traffic or conversions

### Topical authority
- [ ] Keyword / topic map (pillars + supporting articles)
- [ ] Hub pages that link out to cluster content
- [ ] Internal linking reinforces topic clusters
- [ ] Gaps vs competitors listed and prioritized

---

## 8. International & multilingual (if applicable)

- [ ] One URL strategy chosen (ccTLDs, subdomains, or subfolders) and applied consistently
- [ ] `hreflang` annotations bidirectional and self-referencing
- [ ] `x-default` set where appropriate
- [ ] Correct language/region in content and metadata (not just translated nav)
- [ ] Localized sitemaps or hreflang in sitemap
- [ ] Currency, date, and legal differences handled per market

---

## 9. Local SEO (if applicable)

- [ ] Google Business Profile claimed and complete
- [ ] NAP (name, address, phone) consistent across site and directories
- [ ] `LocalBusiness` schema matches GBP data
- [ ] Location landing pages unique (not doorway spam)
- [ ] Local links/citations from relevant directories when useful
- [ ] Reviews strategy ethical (no fake reviews)

---

## 10. E-commerce specifics (if applicable)

- [ ] Unique product titles and descriptions (not only manufacturer boilerplate)
- [ ] Product schema with price, availability, currency
- [ ] Canonical strategy for variants/facets
- [ ] Out-of-stock handling (keep indexed with clarity vs noindex — decide by business)
- [ ] Category pages have real editorial content where thin
- [ ] Reviews genuine if marked up
- [ ] Checkout / cart / account noindexed

---

## 11. Off-page & digital PR

- [ ] Brand mentions and backlinks monitored (Ahrefs, Semrush, Majestic, or similar)
- [ ] Toxic / spammy links disavowed only when clearly harmful and after review
- [ ] Earn links via useful assets (research, tools, guides), not PBNs
- [ ] Partner, press, and directory links use consistent brand/URL
- [ ] Social profiles exist and link to the canonical site

---

## 12. GEO / AI search visibility

AI engines cite sources; they don’t “rank” like classic blue links. Optimize for being quotable and crawlable.

- [ ] robots.txt allows the AI bots you care about (e.g. OAI-SearchBot, PerplexityBot, Claude-SearchBot, Bingbot) — decide training bots (GPTBot, Google-Extended, CCBot) separately
- [ ] Clear entity definition: who you are, what you do, who for
- [ ] Answer-first sections, FAQs, definitions, comparison tables
- [ ] Statistics, citations, and expert quotes where credible
- [ ] FAQ / HowTo content visible on-page (not schema-only)
- [ ] Authoritative tone without keyword stuffing
- [ ] Freshness signals (update dates when content actually changes)
- [ ] Brand consistency across Wikipedia/Wikidata, LinkedIn, Crunchbase, app stores if relevant
- [ ] Monitor AI answers for your head terms and fix factual gaps on-site

---

## 13. Search Console & Bing — post-key / post-verify

After verifying properties (and after generating a Bing API key, if you use the API):

### Google Search Console
- [ ] Sitemap submitted; status “Success”
- [ ] Coverage / Pages report: fix “Excluded” reasons that matter
- [ ] URL Inspection on homepage + key templates; request indexing for critical new URLs
- [ ] Experience / CWV report reviewed
- [ ] Manual actions & security issues: clean
- [ ] Links report glanced for odd patterns
- [ ] Removals used only for true emergencies

### Bing Webmaster Tools
- [ ] Site verified
- [ ] Sitemap submitted
- [ ] API key stored in secrets manager / env (never in git or chat)
- [ ] Optional: use Bing API for programmatic URL submit / sitemap push if you automate SEO ops
- [ ] Import GSC data if offered (speeds setup)
- [ ] Index Explorer / URL inspection used for problem URLs

### Indexing hygiene
- [ ] `site:` query shows expected volume (rough check only)
- [ ] No accidental indexing of staging, query-param duplicates, or private PDFs
- [ ] Important new pages appear in sitemap and earn internal links the same day

---

## 14. Analytics & measurement

- [ ] Primary conversions defined (signup, purchase, lead, etc.)
- [ ] Landing page and organic traffic reports saved
- [ ] Search queries tracked (GSC + optional site search in GA4)
- [ ] Rank / visibility tracked for priority keywords (manual or tool)
- [ ] Before/after baseline when shipping SEO changes
- [ ] Alerts for traffic drops, coverage spikes, CWV regressions

---

## 15. Security & trust signals

- [ ] Valid TLS; no mixed content
- [ ] Malware / phishing clean (Search Console security reports)
- [ ] Privacy policy, terms, refund/shipping (as applicable) linked in footer
- [ ] Contact method real and working
- [ ] No cloaking, sneaky redirects, or hidden text

---

## 16. Ongoing cadence

### Weekly
- [ ] GSC Coverage / Pages anomalies
- [ ] New content indexed; crawl errors on new launches

### Monthly
- [ ] Top landing pages: titles, CTR, CWV
- [ ] Broken links / 404s from logs or crawler
- [ ] Competitor SERP changes on money keywords
- [ ] Content refresh candidates

### Quarterly
- [ ] Full crawl (Screaming Frog, Sitebulb, or similar)
- [ ] Schema re-validation on templates
- [ ] Keyword map vs actual rankings
- [ ] Backlink profile review
- [ ] robots/sitemap/AI-bot policy review

---

## Priority order (when time is limited)

1. **Indexable & canonical** — HTTPS, robots, sitemap, no accidental noindex  
2. **Titles + intent-matched content** on money pages  
3. **Internal links + clear IA**  
4. **CWV on templates that get traffic**  
5. **Structured data that matches visible content**  
6. **GSC + Bing monitoring loop**  
7. **GEO polish** (answer-first, FAQs, citations, bot access)  
8. **Off-page / PR**

---

## Audit toolkit

| Tool | Use |
|------|-----|
| Google Search Console | Indexing, queries, CWV field data |
| Bing Webmaster Tools | Bing/Copilot discovery, sitemap, API |
| PageSpeed Insights | Lab + field CWV |
| Rich Results Test / schema.org validator | Structured data |
| Chrome DevTools | Mobile layout, network, LCP element |
| Screaming Frog / Sitebulb | Full-site crawl |
| Ahrefs / Semrush / Similarweb | Keywords, competitors, links |
| Facebook / LinkedIn / X debuggers | Share previews |

---

## Red flags (fix immediately)

1. Entire site or key sections `noindex` / blocked in robots in production  
2. Homepage soft-404 or redirect chain  
3. Duplicate titles/descriptions at scale  
4. Canonical pointing at the wrong host or HTTP  
5. “Discovered – currently not indexed” / “Crawled – currently not indexed” on money URLs with no internal links  
6. LCP > 4s or CLS > 0.25 on mobile for key templates  
7. Schema that doesn’t match on-page content  
8. Staging site indexed  
9. Mixed www/non-www or HTTP/HTTPS duplicates with no redirect  
10. Thin doorway pages built only for keyword variants  

---

## Sign-off template

| Area | Owner | Status | Last checked |
|------|-------|--------|--------------|
| Crawl / index | | ☐ | |
| On-page templates | | ☐ | |
| CWV | | ☐ | |
| Schema | | ☐ | |
| GSC + Bing | | ☐ | |
| Content / E-E-A-T | | ☐ | |
| GEO / AI bots | | ☐ | |
| Analytics | | ☐ | |

**Site:** _______________________  
**Date:** _______________________  
**Notes:** _______________________
