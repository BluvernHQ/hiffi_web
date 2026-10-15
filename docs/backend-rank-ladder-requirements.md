# Backend requirements: Artist Index rank ladder

**Audience:** backend developer
**Frontend status:** Hiffi 500 rank plates are live for ranks 1–500. Everything below 500 is waiting on the backend changes in this doc.

---

## 1. Summary

We rank every artist in the Artist Index (about 17,000 profiles), but we only want to **show a rank publicly when it's something to be proud of**. Nobody should see "#14,873" on their public profile.

So we turn one global ranking into a ladder of positive signals:

| Global position | Public display | Example |
|---|---|---|
| 1–500 | Exact rank plus tier (live today) | "#60 · Rising" |
| 501 to top 5% | Band, no number | "Top 5%" |
| Top 5–10% | Band | "Top 10%" |
| Top 10–25% | Band | "Top 25%" |
| Bottom 75% | Nothing | none |
| Not enough data | Nothing | none |

On top of the global band, artists can earn:

- **A local or genre chip** when they're near the top of a meaningful group: "#3 in Memphis".
- **A movement chip** when they're climbing: "Up 340 spots this month".

The **owner** of a claimed profile sees everything privately: exact rank, city and genre rank, history, and how far they are from the next tier. That's a reason to claim, and later a base for paid insights.

The frontend only needs data. **All ranking, banding and selection logic lives on the backend**, so web, app and admin show the same thing.

---

## 2. Current state

| What | Today | Problem |
|---|---|---|
| `GET /inventory/top` | Ranks 1–500 with `rank`, `final_score`, momentum fields | Stops at 500 (`total_ranked: 500`) |
| `GET /inventory`, `GET /inventory/{username}` | `username`, `artist_name`, `bio`, `other_socials`, `location`, `claim_status`, timestamps | No rank data at all |
| `location` | Free text, 244 distinct values ("Atlanta, GA, US", "Atlanta", …) | Can't group artists by city |
| Genre | Not stored on inventory profiles | No genre charts possible |
| `GET /inventory/top/city?location=` | Exact-string filter over the top 500 | Misses spelling variants; no ranks outside the 500 |
| `GET /inventory/top/cities` | Returns only "United States" | Not usable as a city list |

---

## 3. Public ranking object

Add a `ranking` object to **every inventory profile** in `GET /inventory` (list items) and `GET /inventory/{username}` (detail).

```json
"ranking": {
  "status": "ranked",
  "band": "top_10",
  "global_rank": null,
  "highlight": {
    "kind": "city",
    "label": "Memphis",
    "rank": 3,
    "total": 64
  },
  "movement": {
    "spots_30d": 340,
    "streak_weeks": 3
  },
  "updated_at": "2026-09-28T00:00:00Z"
}
```

| Field | Type | Rules |
|---|---|---|
| `status` | enum | `ranked` or `not_ranked`. `not_ranked` = not enough data to score (see §5.1). |
| `band` | enum | `hiffi_500`, `top_5`, `top_10`, `top_25` or `none`. Always `none` when `status` is `not_ranked`. |
| `global_rank` | int or null | **Only set when `band` is `hiffi_500`.** Null otherwise. |
| `highlight` | object or null | The artist's best local or genre position, only if it qualifies (§5.4). |
| `highlight.kind` | enum | `city` or `genre`. |
| `highlight.label` | string | Display name of the city or genre, e.g. "Memphis", "Drill". |
| `highlight.rank` / `highlight.total` | int | Position within the group and the group size. |
| `movement` | object or null | Only positive movement (§5.5). Null when flat or dropping. |
| `movement.spots_30d` | int or null | Spots gained in global rank over 30 days. |
| `movement.streak_weeks` | int or null | Consecutive weekly snapshots where the rank improved. |
| `updated_at` | ISO timestamp | When this snapshot was computed. |

> **Privacy:** the public payload must never include the exact rank, percentile or raw score for artists outside the Hiffi 500. Anyone can read the JSON in their browser, so hiding it in the UI is not enough.

The Hiffi 500 tier names (Global Velocity 1–10, Hot 50 11–50, Rising 51–150, Charting 151–500) are derived by the frontend from `global_rank`. No field is needed.

---

## 4. Owner-only ranking endpoint

`GET /inventory/me/ranking`

- **Auth required.** The signed-in user must own a claimed inventory profile. Otherwise return `404`.
- Returns exact numbers the public payload hides.

```json
{
  "username": "nova",
  "status": "ranked",
  "global_rank": 1873,
  "total_ranked": 16420,
  "percentile": 11.4,
  "band": "top_25",
  "next_band": {
    "band": "top_10",
    "rank_needed": 1642,
    "spots_away": 231
  },
  "city": { "id": "memphis-tn-us", "label": "Memphis", "rank": 3, "total": 64 },
  "genre": { "id": "drill", "label": "Drill", "rank": 41, "total": 910 },
  "change": { "d7": -12, "d30": 340 },
  "history": [
    { "week": "2026-09-21", "global_rank": 1861 },
    { "week": "2026-09-14", "global_rank": 2013 }
  ],
  "drivers": {
    "youtube_score": 62,
    "instagram_score": 48,
    "momentum_30d": 0.18
  },
  "updated_at": "2026-09-28T00:00:00Z"
}
```

| Field | Rules |
|---|---|
| `percentile` | Share of ranked artists at or above this rank, 0–100. Lower is better (11.4 = top 11.4%). |
| `next_band` | The next band up and how many spots away it is. Null when already `hiffi_500` #1. For `top_5`, the next band is `hiffi_500` with `rank_needed: 500`. |
| `city` / `genre` | Null when the artist has no normalized city or genre. Always returned for the owner, even if too low for a public highlight. |
| `change` | Signed values (negative = dropped). Owners see drops; the public never does. |
| `history` | Up to 12 weekly snapshots, newest first. |
| `drivers` | Sub-scores on a 0–100 scale so we can show "what moves your rank". Exact formula stays private. |

For unclaimed profiles we only show a teaser based on the public `band` ("Ranked in the top 25% — claim to see your exact position"). No extra endpoint needed.

---

## 5. Rules

### 5.1 Eligibility

- An artist is `ranked` only when they have enough data for a fair score. Please propose the threshold (for example: a linked YouTube channel with at least 2 weekly snapshots).
- `not_ranked` artists are **excluded** from `total_ranked` and from percentile maths. They are never shown as "last".

### 5.2 Snapshots

- Recompute once a week (for example Monday 00:00 UTC) and store the snapshot.
- Public values only change when a new snapshot lands, so ranks don't jitter day to day.
- `/inventory/top` should read from the same snapshot, so the Hiffi 500 and the index always agree.

### 5.3 Bands

Computed from global rank in the weekly snapshot:

| Band | Condition |
|---|---|
| `hiffi_500` | rank ≤ 500 |
| `top_5` | rank > 500 and rank ≤ ceil(5% × total_ranked) |
| `top_10` | rank ≤ ceil(10% × total_ranked), not in a higher band |
| `top_25` | rank ≤ ceil(25% × total_ranked), not in a higher band |
| `none` | everyone else |

If 5% of the ranked total is below 500, the `top_5` band is simply empty. Please keep the cut-offs in config so we can tune them without a deploy.

**Ties:** use a deterministic tie-break (for example higher `youtube_subscriber_count`, then `username`) so ranks are stable between requests.

### 5.4 Highlight (local or genre chip)

Candidates are the artist's city group and genre group. A candidate qualifies when:

- the group has **at least 20 ranked artists**, and
- the artist's rank in the group is **≤ 25**.

Pick the qualifying candidate with the best (lowest) rank. On a tie, prefer `city`. If nothing qualifies, `highlight` is null. The group rank is the artist's position among ranked artists in that group, using the same global score.

### 5.5 Movement

- `spots_30d`: set only when the artist gained **at least 25 spots** over 30 days. Otherwise null.
- `streak_weeks`: set only when the rank improved in **2 or more** consecutive weekly snapshots. Otherwise null.
- If both are null, `movement` is null.

### 5.6 Scores stay private

Don't add raw scores to the public inventory payload. The public sees ranks, bands and chips, never the composite score.

---

## 6. City and genre normalization

City and genre groups need clean data. Free text can't be grouped.

### 6.1 City

- Add a canonical city to each inventory profile: `city_id` (e.g. `memphis-tn-us`), `city_name`, `region`, `country`.
- Map the existing 244 free-text `location` values to canonical cities. Anything that doesn't resolve stays null, and that artist gets no city chart.
- Keep the original `location` text for display.
- When a claim is approved, normalize the `location` the artist entered in the claim form the same way.

### 6.2 Genre

- Inventory profiles don't have a genre today. Add `primary_genre` from a fixed list:
  `hip-hop`, `rap`, `trap`, `drill`, `melodic rap`, `alternative hip-hop`, `boom bap`, `r&b`.
  These match the options in the claim form.
- Claimed artists already send `primary_genre` with their claim. Copy it onto the profile on approval.

### 6.3 City endpoints

- Change `GET /inventory/top/city` to take `city_id` instead of an exact `location` string, and return ranks within the city (not just the global top 500 filtered).
- Change `GET /inventory/top/cities` to return canonical cities with their ranked counts:

```json
{ "items": [ { "id": "atlanta-ga-us", "label": "Atlanta", "ranked_count": 412 } ] }
```

---

## 7. Listing and filtering

Add to `GET /inventory`:

| Param | Values | Use |
|---|---|---|
| `sort=rank` | — | "Sort by rank" in the index. Ranked artists first by global rank, then `not_ranked`. |
| `band` | `hiffi_500`, `top_5`, `top_10`, `top_25` | "Ranked only" filters, and brand discovery later. |
| `city_id` | canonical id | City pages. |

---

## 8. Suggested phasing

| Phase | Backend | Frontend unlocks |
|---|---|---|
| 1 | Rank every eligible artist in the weekly snapshot. `ranking.status`, `band`, `global_rank`, `updated_at`. `GET /inventory/me/ranking` without city, genre and history. `sort=rank`, `band` filter. | Percentile chips on cards and profiles, owner rank card, claim teaser, sort by rank |
| 2 | Weekly history, `movement`, owner `change` and `history` | Movement chips, owner rank chart |
| 3 | City and genre normalization, `highlight`, owner `city` and `genre`, new city endpoints | "#3 in Memphis" chips, city charts |

Phase 1 is the priority. It's what turns ranking into a claim-conversion tool.

---

## 9. Acceptance checks

1. A Hiffi 500 artist's profile returns `band: "hiffi_500"` and a `global_rank` that matches `/inventory/top`.
2. An artist at rank ~1,800 of ~16,000 returns `band: "top_25"` and `global_rank: null`.
3. The public payload for a non-500 artist contains **no** exact rank, percentile or score anywhere.
4. A `not_ranked` artist returns `band: "none"` and isn't counted in `total_ranked`.
5. `GET /inventory/me/ranking` returns `404` for a signed-in user who doesn't own a claimed profile, and exact numbers for one who does.
6. Ranks don't change between two requests on the same day (same snapshot).
7. `highlight` is never set for a group with fewer than 20 ranked artists.
8. `movement` is null for an artist whose rank dropped.

---

## 10. Open questions

1. What's the minimum data for an artist to be ranked?
2. Are 5 / 10 / 25% the right cut-offs for today's ~17,000 profiles, or do you want to model the distribution first?
3. Which weekday and time should the weekly snapshot run?
4. Can the city normalization be automated (geocoding), or do we need an admin mapping table for the long tail?
5. Where does genre for unclaimed inventory profiles come from: admin tagging, YouTube metadata, or a model?
