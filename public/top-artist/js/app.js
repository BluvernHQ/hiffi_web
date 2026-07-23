"use strict";

const PAGE_SIZE = 100;
const CITY_PAGE_SIZE = 50;
const INITIAL_VISIBLE = 20;
const LOAD_MORE_STEP = 20;
const ACCENTS = ["#ff2b2b", "#f4f1ea", "#7e7e83", "#ff2b2b", "#b8b6b1"];
/** Ranking payload cache — localStorage/sessionStorage (cookies can't hold ~500 artists). */
const CACHE_KEY_PREFIX = "hiffi-top-artist-cache-v7";
const CITIES_CACHE_KEY = "hiffi-top-artist-cities-v1";
const UI_KEY = "hiffi-top-artist-ui-v4";
/** How old cache can be before we prefer a background refresh (stale cache still paints instantly). */
const REVALIDATE_MS = 60 * 60 * 1000;
const CITIES_TTL_MS = 60 * 60 * 1000;

/** @type {ReturnType<typeof mapArtist>[]} */
let artists = [];
let totalRanked = 0;
/** @type {{ location: string, artist_count: number }[]} */
let bannerCities = [];
/** Bumps when the active location changes so stale in-flight pages are ignored. */
let loadGeneration = 0;

const state = {
  query: "",
  location: "",
  mode: "overall",
  sort: "overall",
  visible: INITIAL_VISIBLE,
  selected: null,
  loading: true,
  error: null,
};
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const pad = (value, size) => String(value).padStart(size, "0");

/** Skip persisting scroll while we programmatically move it. */
let suppressScrollSave = false;

function cacheKeyForLocation(location) {
  const key = String(location || "").trim().toLowerCase() || "all";
  return `${CACHE_KEY_PREFIX}:${key}`;
}

function storageGet(key) {
  try {
    const local = localStorage.getItem(key);
    if (local != null) return local;
  } catch {
    /* private mode */
  }
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, raw) {
  try {
    localStorage.setItem(key, raw);
    return true;
  } catch {
    /* quota / private mode */
  }
  try {
    sessionStorage.setItem(key, raw);
    return true;
  } catch {
    return false;
  }
}

function readJsonStorage(key) {
  try {
    const raw = storageGet(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJsonStorage(key, value) {
  try {
    return storageSet(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

/** Keep only fields the ranking UI needs so storage stays under quota. */
function slimInventoryItem(item) {
  if (!item || typeof item !== "object") return null;
  const socials = slimSocials(item.other_socials);
  return {
    rank: item.rank,
    global_rank: item.global_rank ?? null,
    username: item.username,
    artist_name: item.artist_name,
    location: item.location || "",
    claim_status: item.claim_status,
    youtube_subscriber_count: item.youtube_subscriber_count ?? null,
    youtube_view_count: item.youtube_view_count ?? null,
    youtube_video_count: item.youtube_video_count ?? null,
    youtube_recent_avg_views: item.youtube_recent_avg_views ?? null,
    youtube_upload_velocity: item.youtube_upload_velocity ?? null,
    youtube_score: item.youtube_score ?? null,
    youtube_momentum_7d: item.youtube_momentum_7d ?? null,
    youtube_momentum_30d: item.youtube_momentum_30d ?? null,
    youtube_momentum_90d: item.youtube_momentum_90d ?? null,
    other_socials: socials,
    previous_rank: item.previous_rank ?? null,
    rank_delta_7d: item.rank_delta_7d ?? null,
    rank_delta_30d: item.rank_delta_30d ?? null,
    is_new_entry: Boolean(item.is_new_entry),
  };
}

function slimSocials(socials) {
  if (!socials || typeof socials !== "object") return undefined;
  const out = {};
  for (const key of ["instagram", "youtube", "tiktok", "facebook", "twitter", "x", "snapchat"]) {
    const value = typeof socials[key] === "string" ? socials[key].trim() : "";
    if (value) out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

function slimInventoryItems(items) {
  return (Array.isArray(items) ? items : []).map(slimInventoryItem).filter(Boolean);
}

/**
 * Always return stored ranking for instant paint — never discard for age.
 * @returns {{ items: unknown[], totalRanked: number, savedAt: number, needsRevalidate: boolean } | null}
 */
function readRankingCache(location = state.location) {
  const cached = readJsonStorage(cacheKeyForLocation(location));
  if (!cached || !Array.isArray(cached.items) || cached.items.length === 0) return null;
  const savedAt = typeof cached.savedAt === "number" ? cached.savedAt : 0;
  return {
    items: cached.items,
    totalRanked: Number(cached.totalRanked) || cached.items.length,
    savedAt,
    needsRevalidate: !savedAt || Date.now() - savedAt > REVALIDATE_MS,
  };
}

function writeRankingCache(items, ranked, location = state.location) {
  const slim = slimInventoryItems(items);
  if (!slim.length) return false;
  return writeJsonStorage(cacheKeyForLocation(location), {
    items: slim,
    totalRanked: ranked,
    location: location || undefined,
    savedAt: Date.now(),
  });
}

function readUiState() {
  const saved = readJsonStorage(UI_KEY);
  if (!saved || typeof saved !== "object") return null;
  return saved;
}

function writeUiState() {
  writeJsonStorage(UI_KEY, {
    query: state.query,
    location: state.location,
    mode: state.mode,
    sort: state.sort,
    visible: state.visible,
    scrollY: suppressScrollSave ? readUiState()?.scrollY ?? window.scrollY : window.scrollY,
  });
}

function syncLocationFilterButtons() {
  $$("button[data-location]", $("#locationFilters")).forEach((item) => {
    const value = item.getAttribute("data-location") ?? "";
    item.classList.toggle("active", value === state.location);
  });
}

function syncModeFilterButtons() {
  $$("button[data-mode]", $("#modeFilters")).forEach((item) => {
    const value = item.getAttribute("data-mode") ?? "overall";
    item.classList.toggle("active", value === state.mode);
  });
  const kicker = $("#modeKicker");
  if (!kicker) return;
  kicker.textContent = modeKickerCopy(state.mode);
}

function modeLabel(mode = state.mode) {
  if (mode === "breakout") return "Breakout 100";
  if (mode === "heat") return "Underground Heat";
  if (mode === "verified") return "Verified ranking";
  return "Overall";
}

function modeKickerCopy(mode = state.mode) {
  if (mode === "breakout") return "Ranks 51–150 · emerging signal preview";
  if (mode === "heat") return "Momentum heat · outside the absolute top 10";
  if (mode === "verified") return "Claimed Artist Index profiles only";
  return "Full Hip-Hop 500 · scale and momentum";
}

function isValidMode(mode) {
  return mode === "overall" || mode === "breakout" || mode === "heat" || mode === "verified";
}

function cityChipLabel(location) {
  const text = String(location || "").trim();
  if (!text) return "All";
  const short = text.split(",")[0].trim();
  return short || text;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderLocationFilters() {
  const root = $("#locationFilters");
  if (!root) return;
  const cityButtons = bannerCities
    .map((city) => {
      const label = cityChipLabel(city.location);
      const count = Number(city.artist_count) || 0;
      return `<button type="button" data-location="${escapeAttr(city.location)}" title="${escapeAttr(
        `${city.location} · ${count} ranked`,
      )}">${escapeAttr(label)}</button>`;
    })
    .join("");
  root.innerHTML = `<button type="button" data-location="">All</button>${cityButtons}`;
  syncLocationFilterButtons();
}

function restoreUiState() {
  const saved = readUiState();
  if (!saved) return;
  if (typeof saved.query === "string") state.query = saved.query;
  if (typeof saved.location === "string") state.location = saved.location;
  if (isValidMode(saved.mode)) state.mode = saved.mode;
  if (
    saved.sort === "overall" ||
    saved.sort === "views" ||
    saved.sort === "subscribers" ||
    saved.sort === "momentum7d" ||
    saved.sort === "momentum30d" ||
    saved.sort === "momentum90d"
  ) {
    state.sort = saved.sort;
  }
  if (typeof saved.visible === "number" && saved.visible >= INITIAL_VISIBLE) {
    state.visible = saved.visible;
  }

  const search = $("#artistSearch");
  if (search) search.value = state.query;
  const sort = $("#rankingSort");
  if (sort) sort.value = state.sort;
  syncLocationFilterButtons();
  syncModeFilterButtons();
}

function scrollToY(y) {
  suppressScrollSave = true;
  const target = Math.max(0, Number(y) || 0);
  const settle = () => {
    window.scrollTo(0, target);
    requestAnimationFrame(() => {
      window.scrollTo(0, target);
      suppressScrollSave = false;
    });
  };
  requestAnimationFrame(settle);
}

/** Restore scroll only on the initial cached paint (return visit). */
function restoreScrollPosition() {
  const saved = readUiState();
  if (!saved || typeof saved.scrollY !== "number") return;
  scrollToY(saved.scrollY);
}

/** Keep the live viewport still across a background re-render. */
function withPreservedScroll(fn) {
  const y = window.scrollY;
  suppressScrollSave = true;
  fn();
  scrollToY(y);
}

function applyDataset(items, ranked) {
  const globalLookup = buildGlobalRankLookup();
  artists = items.map((item, index) => {
    const mapped = mapArtist(item, index);
    if (mapped.globalRank == null && mapped.username && globalLookup.has(mapped.username.toLowerCase())) {
      mapped.globalRank = globalLookup.get(mapped.username.toLowerCase());
    }
    return mapped;
  });
  totalRanked = ranked;
  state.loading = false;
  state.error = null;
  renderHeroStats();
  renderTopThree();
  renderRanking();
  renderMovers();
}

function buildGlobalRankLookup() {
  /** @type {Map<string, number>} */
  const lookup = new Map();
  if (!state.location) return lookup;
  const cached = readRankingCache("");
  if (!cached) return lookup;
  for (const item of cached.items) {
    const username = String(item.username || "").toLowerCase();
    const rank = item.global_rank ?? item.rank;
    if (username && rank != null && !Number.isNaN(Number(rank))) {
      lookup.set(username, Number(rank));
    }
  }
  return lookup;
}

function formatCount(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

function formatScore(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(1);
}

function formatVelocity(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toFixed(1)}/30d`;
}

/** Fractional growth → percent label (e.g. 0.031 → +3.1%). */
function formatMomentum(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const pct = Number(value) * 100;
  const sign = pct > 0 ? "+" : "";
  const abs = Math.abs(pct);
  const digits = abs >= 10 ? 1 : 2;
  return `${sign}${pct.toFixed(digits)}%`;
}

function momentumTone(value) {
  if (value == null || Number.isNaN(Number(value)) || Number(value) === 0) return "flat";
  return Number(value) > 0 ? "up" : "down";
}

function momentumHTML(value, label) {
  const tone = momentumTone(value);
  return `<span class="momentum momentum-${tone}" data-label="${label}" aria-label="${label}: ${formatMomentum(value)}">${formatMomentum(value)}</span>`;
}

function artistIndexHref(username) {
  return `/artist-index/${encodeURIComponent(username)}`;
}

/** @param {{ claimStatus?: string, username?: string }} artist */
function claimAction(artist) {
  if (!artist.username || artist.claimStatus === "claimed") return null;
  if (artist.claimStatus === "pending") {
    return {
      href: artistIndexHref(artist.username),
      label: "Request ownership",
      note: "Ownership under review. Open the Artist Index profile to request ownership.",
    };
  }
  return {
    href: artistIndexHref(artist.username),
    label: "Claim this profile",
    note: "Is this your profile? Open it on Artist Index to claim, verify links, and get discovered.",
  };
}

function mapArtist(item, index) {
  const name = item.artist_name || item.username || "Unknown";
  const location = item.location || "";
  const socials = slimSocials(item.other_socials) || {};
  const globalRank =
    item.global_rank != null && !Number.isNaN(Number(item.global_rank))
      ? Number(item.global_rank)
      : null;
  return {
    rank: item.rank,
    globalRank,
    username: item.username,
    name,
    location,
    claimStatus: item.claim_status,
    subscribers: item.youtube_subscriber_count ?? null,
    views: item.youtube_view_count ?? null,
    videoCount: item.youtube_video_count ?? null,
    recentAvgViews: item.youtube_recent_avg_views ?? null,
    uploadVelocity: item.youtube_upload_velocity ?? null,
    score: item.youtube_score ?? null,
    momentum7d: item.youtube_momentum_7d ?? null,
    momentum30d: item.youtube_momentum_30d ?? null,
    momentum90d: item.youtube_momentum_90d ?? null,
    socials,
    youtubeUrl: socials.youtube || null,
    previousRank: item.previous_rank ?? null,
    rankDelta7d: item.rank_delta_7d ?? null,
    rankDelta30d: item.rank_delta_30d ?? null,
    isNewEntry: Boolean(item.is_new_entry),
    accent: ACCENTS[index % ACCENTS.length],
  };
}

function movementMeta(artist) {
  let delta = null;
  if (artist.rankDelta7d != null) delta = artist.rankDelta7d;
  else if (artist.previousRank != null) delta = artist.previousRank - artist.rank;

  if (delta == null) {
    return { delta: 0, direction: "flat", symbol: "→", amount: 0, label: "No movement data", soft: true };
  }

  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const symbol = direction === "up" ? "↗" : direction === "down" ? "↘" : "→";
  const amount = Math.abs(delta);
  const label =
    delta === 0 ? "No rank change" : `${direction} ${amount} ${amount === 1 ? "place" : "places"}`;
  return { delta, direction, symbol, amount, label, soft: false };
}

function movementHTML(artist, compact = false) {
  const move = movementMeta(artist);
  const amountHtml = !compact && !move.soft && move.delta !== 0 ? move.amount : "";
  return `<span class="movement movement-${move.direction}" aria-label="${move.label}"><span aria-hidden="true">${move.symbol}</span>${amountHtml}</span>`;
}

async function fetchTopPage(limit, offset) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    enrich: "0",
  });
  const res = await fetch(`/proxy/inventory/top?${params}`, {
    headers: { Accept: "application/json" },
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error || `Failed to load ranking (${res.status})`);
  }
  return body.data;
}

async function fetchCityPage(limit, offset, location) {
  const params = new URLSearchParams({
    location: String(location || "").trim(),
    limit: String(Math.min(limit, CITY_PAGE_SIZE)),
    offset: String(offset),
    enrich: "0",
  });
  const res = await fetch(`/proxy/inventory/top/city?${params}`, {
    headers: { Accept: "application/json" },
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error || `Failed to load city ranking (${res.status})`);
  }
  return body.data;
}

async function fetchBannerCities() {
  const cached = readJsonStorage(CITIES_CACHE_KEY);
  const hasCache = cached && Array.isArray(cached.items) && cached.items.length > 0;
  if (hasCache) {
    bannerCities = cached.items;
    renderLocationFilters();
  }

  const savedAt = typeof cached?.savedAt === "number" ? cached.savedAt : 0;
  const isFresh = hasCache && savedAt && Date.now() - savedAt < CITIES_TTL_MS;
  if (isFresh) return bannerCities;

  const res = await fetch(`/proxy/inventory/top/cities`, {
    headers: { Accept: "application/json" },
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    if (hasCache) return bannerCities;
    throw new Error(body.error || `Failed to load cities (${res.status})`);
  }
  bannerCities = Array.isArray(body.data?.items) ? body.data.items : [];
  writeJsonStorage(CITIES_CACHE_KEY, { items: bannerCities, savedAt: Date.now() });

  if (state.location && !bannerCities.some((city) => city.location === state.location)) {
    state.location = "";
    writeUiState();
  }
  renderLocationFilters();
  return bannerCities;
}

async function loadAllArtists(onPage, location = state.location) {
  const items = [];
  let offset = 0;
  let hasMore = true;
  let ranked = 0;
  const generation = loadGeneration;
  const isCity = Boolean(String(location || "").trim());
  const maxItems = isCity ? CITY_PAGE_SIZE : 500;
  const pageSize = isCity ? CITY_PAGE_SIZE : PAGE_SIZE;

  while (hasMore && items.length < maxItems) {
    if (generation !== loadGeneration) {
      return { items, totalRanked: ranked || items.length, aborted: true };
    }
    const limit = Math.min(pageSize, maxItems - items.length);
    const page = isCity
      ? await fetchCityPage(limit, offset, location)
      : await fetchTopPage(limit, offset);
    if (generation !== loadGeneration) {
      return { items, totalRanked: ranked || items.length, aborted: true };
    }
    const batch = Array.isArray(page.items) ? page.items : [];
    items.push(...batch);
    ranked = page.total_ranked ?? ranked;
    hasMore = Boolean(page.has_more) && batch.length > 0;
    offset += batch.length;
    // Persist after every page so leaving mid-load still leaves a usable cache.
    writeRankingCache(items, ranked || items.length, location);
    if (typeof onPage === "function") onPage(items, ranked || items.length);
    if (batch.length === 0) break;
  }

  return { items, totalRanked: ranked || items.length, aborted: false };
}

function filteredArtists() {
  const query = state.query.trim().toLowerCase();
  const list = filterByMode(artists).filter(
    (artist) =>
      !query ||
      artist.name.toLowerCase().includes(query) ||
      artist.username.toLowerCase().includes(query),
  );

  if (state.mode === "heat" && state.sort === "overall") {
    return list.sort((a, b) => {
      const am = heatMomentum(a) ?? Number.NEGATIVE_INFINITY;
      const bm = heatMomentum(b) ?? Number.NEGATIVE_INFINITY;
      if (bm !== am) return bm - am;
      return a.rank - b.rank;
    });
  }

  return list.sort((a, b) => {
    const byRank = () => a.rank - b.rank;
    const cmpNullLast = (av, bv) => {
      const aMissing = av == null || Number.isNaN(Number(av));
      const bMissing = bv == null || Number.isNaN(Number(bv));
      if (aMissing && bMissing) return byRank();
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (Number(bv) !== Number(av)) return Number(bv) - Number(av);
      return byRank();
    };

    if (state.sort === "momentum7d") return cmpNullLast(a.momentum7d, b.momentum7d);
    if (state.sort === "momentum30d") return cmpNullLast(a.momentum30d, b.momentum30d);
    if (state.sort === "momentum90d") return cmpNullLast(a.momentum90d, b.momentum90d);
    if (state.sort === "views") return cmpNullLast(a.recentAvgViews ?? a.views, b.recentAvgViews ?? b.views);
    if (state.sort === "subscribers") return cmpNullLast(a.subscribers, b.subscribers);
    return byRank();
  });
}

function chartGlobalRank(artist) {
  if (!artist) return null;
  if (artist.globalRank != null) return artist.globalRank;
  if (!state.location) return artist.rank;
  return null;
}

function heatMomentum(artist) {
  const value = artist.momentum7d ?? artist.momentum30d ?? artist.momentum90d;
  if (value == null || Number.isNaN(Number(value))) return null;
  return Number(value);
}

/** Mode filters on the current chart payload (city chips still apply via loaded dataset). */
function filterByMode(list) {
  if (state.mode === "breakout") {
    return list
      .filter((artist) => {
        const rank = chartGlobalRank(artist);
        return rank != null && rank >= 51 && rank <= 150;
      })
      .slice(0, 100);
  }
  if (state.mode === "heat") {
    return list.filter((artist) => {
      const rank = chartGlobalRank(artist) ?? artist.rank;
      return rank > 10 && heatMomentum(artist) != null;
    });
  }
  if (state.mode === "verified") {
    return list.filter((artist) => artist.claimStatus === "claimed");
  }
  return list;
}

function emptyRankingHTML() {
  if (state.query.trim()) {
    return `<div class="empty-state"><b>No artist found.</b><span>Try another name or region.</span></div>`;
  }
  if (state.mode === "breakout") {
    return `<div class="empty-state"><b>No breakout artists in this chart yet.</b><span>Breakout 100 watches global ranks 51–150.</span></div>`;
  }
  if (state.mode === "heat") {
    return `<div class="empty-state"><b>Heat signals loading — check back soon.</b><span>Underground Heat needs momentum outside the absolute top 10.</span></div>`;
  }
  if (state.mode === "verified") {
    return `<div class="empty-state"><b>No verified profiles here yet.</b><span>Only claimed Artist Index profiles appear in this mode.</span><a class="empty-state-link" href="/artist-index/claim">Claim your profile <span aria-hidden="true">↗</span></a></div>`;
  }
  return `<div class="empty-state"><b>No artist found.</b><span>Try another name or region.</span></div>`;
}

function renderLoading() {
  $("#artistList").innerHTML = `<div class="empty-state"><b>Loading live ranking…</b><span>Fetching YouTube-ranked artists.</span></div>`;
  $("#resultsCount").textContent = "Loading…";
  $("#loadMore").hidden = true;
  $("#topThree").innerHTML = "";
  $("#moverGrid").innerHTML = "";
}

function renderError(message) {
  $("#artistList").innerHTML = `<div class="empty-state"><b>Couldn’t load ranking.</b><span>${message}</span></div>`;
  $("#resultsCount").textContent = "Failed to load";
  $("#loadMore").hidden = true;
}

function renderHeroStats() {
  const tracked = totalRanked || artists.length;
  const scope = state.location ? cityChipLabel(state.location).toUpperCase() : "GLOBAL";
  const trackedEl = document.querySelector(".hero-stats div:first-child b");
  if (trackedEl) trackedEl.textContent = String(tracked || "—");
  const terminalNumber = document.querySelector(".terminal-number");
  if (terminalNumber) terminalNumber.textContent = String(tracked || (state.location ? "50" : "500"));
  const terminalLabel = $("#terminalScope") || document.querySelector(".terminal-label span");
  if (terminalLabel) {
    terminalLabel.textContent = state.location
      ? `${scope} / CITY TOP ${Math.min(tracked || 0, CITY_PAGE_SIZE)}`
      : `${scope} / ${tracked || 0} RANKED CHANNELS`;
  }
  const kicker = $("#rankingKicker");
  if (kicker) {
    const base = state.location
      ? `Updated weekly · ${cityChipLabel(state.location)} top 50`
      : "Updated weekly · Global";
    kicker.textContent = state.mode === "overall" ? base : `${base} · ${modeLabel()}`;
  }
}

function renderTopThree() {
  const top = artists.slice(0, 3);
  $("#topThree").innerHTML = top.length
    ? top
        .map(
          (artist) => `
    <button type="button" class="top-row" data-artist-rank="${artist.rank}">
      <b>${pad(artist.rank, 2)}</b><span>${artist.name}</span>${movementHTML(artist, true)}
    </button>`,
        )
        .join("")
    : "";
}

function renderRanking() {
  const filtered = filteredArtists();
  const shown = filtered.slice(0, state.visible);
  $("#artistList").innerHTML = shown.length
    ? shown
        .map(
          (artist, index) => `
    <button type="button" class="artist-row" data-artist-rank="${artist.rank}" style="--delay:${Math.min(index, 12) * 28}ms">
      <span class="artist-identity"><b>${pad(artist.rank, 3)}</b><i style="background:${artist.accent}">${artist.name.slice(0, 2).toUpperCase()}</i><strong><span class="artist-name">${artist.name}</span>${
        artist.username
          ? `<a class="artist-profile-link" href="${artistIndexHref(artist.username)}">Open profile <span aria-hidden="true">↗</span></a>`
          : ""
      }</strong></span>
      <span data-label="Region">${artist.location || "—"}</span>
      <span data-label="Subscribers">${formatCount(artist.subscribers)}</span>
      ${momentumHTML(artist.momentum7d, "7d mom")}
      ${momentumHTML(artist.momentum30d, "30d mom")}
      ${momentumHTML(artist.momentum90d, "90d mom")}
      <span data-label="Score"><em>${formatScore(artist.score)}</em></span>
      ${movementHTML(artist)}
    </button>`,
        )
        .join("")
    : emptyRankingHTML();

  const locationNote = state.location ? ` · ${cityChipLabel(state.location)} top 50` : "";
  const modeNote = state.mode !== "overall" ? ` · ${modeLabel()}` : "";
  $("#resultsCount").textContent = `Showing ${Math.min(state.visible, filtered.length)} of ${filtered.length} ranked artists${
    totalRanked ? ` · ${totalRanked} total` : ""
  }${locationNote}${modeNote}`;
  $("#loadMore").hidden = state.visible >= filtered.length;
}

function renderMovers() {
  const chart = [32, 58, 46, 72, 60, 94, 78, 100];
  const momentumValue = (a) => a.momentum7d ?? a.momentum30d ?? a.momentum90d;
  const movers = [...artists]
    .filter((a) => momentumValue(a) != null)
    .sort((a, b) => {
      const av = momentumValue(a) ?? Number.NEGATIVE_INFINITY;
      const bv = momentumValue(b) ?? Number.NEGATIVE_INFINITY;
      return bv - av;
    })
    .slice(0, 3);

  const fallback = movers.length ? movers : artists.slice(0, 3);

  $("#moverGrid").innerHTML = fallback
    .map((artist, index) => {
      const mom7 = formatMomentum(artist.momentum7d);
      const mom30 = formatMomentum(artist.momentum30d);
      const mom90 = formatMomentum(artist.momentum90d);
      const growthLabel =
        artist.momentum7d != null
          ? mom7
          : artist.momentum30d != null
            ? mom30
            : artist.momentum90d != null
              ? mom90
              : formatScore(artist.score);
      const growthUnit =
        artist.momentum7d != null
          ? "7d momentum"
          : artist.momentum30d != null
            ? "30d momentum"
            : artist.momentum90d != null
              ? "90d momentum"
              : "index score";
      const detail = [
        artist.momentum30d != null ? `30d ${mom30}` : null,
        artist.momentum90d != null ? `90d ${mom90}` : null,
        artist.subscribers != null ? `${formatCount(artist.subscribers)} subs` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return `
    <button type="button" class="mover-card" data-artist-rank="${artist.rank}">
      <div class="mover-card-top"><span>0${index + 1}</span><b>↗</b></div>
      <div class="mini-bars" aria-hidden="true">${chart.map((height) => `<i style="height:${Math.max(12, height - index * 8)}%"></i>`).join("")}</div>
      <h3>${artist.name}</h3><p><strong>${growthLabel}</strong> ${growthUnit}${detail ? `<br>${detail}` : ""}</p>
    </button>`;
    })
    .join("");
}

let lastFocused = null;
let shareStatusTimer = 0;

function chartScopeLabel(location = state.location) {
  const text = String(location || "").trim();
  if (!text) return "Global";
  return cityChipLabel(text);
}

function resolveGlobalRank(artist) {
  if (!artist) return null;
  if (!state.location) return artist.rank;
  if (artist.globalRank != null) return artist.globalRank;
  const cached = readRankingCache("");
  if (!cached || !artist.username) return null;
  const match = cached.items.find(
    (item) => String(item.username || "").toLowerCase() === String(artist.username).toLowerCase(),
  );
  const rank = match?.rank ?? match?.global_rank;
  return rank != null && !Number.isNaN(Number(rank)) ? Number(rank) : null;
}

function buildSharePayload(artist) {
  const cityLabel = chartScopeLabel();
  const isCity = Boolean(state.location);
  const cityRank = artist.rank;
  const globalRank = resolveGlobalRank(artist);
  const place =
    isCity && globalRank != null
      ? `#${cityRank} in ${cityLabel} (#${globalRank} globally)`
      : isCity
        ? `#${cityRank} in ${cityLabel}`
        : `#${globalRank ?? cityRank}`;
  const board =
    state.mode === "overall"
      ? isCity
        ? "the Hiffi Hip-Hop chart"
        : "the Hiffi Hip-Hop 500"
      : modeLabel();
  const headline = `${artist.name} is ${place} on ${board}`;
  const path = buildRankingPath({
    artist: artist.username,
    location: state.location,
  });
  const url = `${window.location.origin}${path}`;
  return { headline, text: `${headline}\n\n${url}`, url, path };
}

/** Short city token for clean URLs: "Atlanta, GA" → "atlanta". */
function citySlug(location) {
  return cityChipLabel(location)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "");
}

/** Canonical ranking URL: /top-artist?mode=breakout&city=atlanta&artist=migos */
function buildRankingPath({ artist = null, location = state.location, mode = state.mode } = {}) {
  const params = new URLSearchParams();
  if (isValidMode(mode) && mode !== "overall") params.set("mode", mode);
  const loc = String(location || "").trim();
  if (loc) params.set("city", citySlug(loc));
  const handle = normalizeUsername(artist);
  if (handle) params.set("artist", handle);
  const query = params.toString();
  return `/top-artist${query ? `?${query}` : ""}`;
}

function syncBrowserUrl({ artist = undefined, replace = true } = {}) {
  const handle = artist === undefined ? state.selected?.username || null : artist;
  const path = buildRankingPath({
    artist: handle,
    location: state.location,
    mode: state.mode,
  });
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === path) return;
  try {
    if (replace) history.replaceState({ topArtist: true }, "", path);
    else history.pushState({ topArtist: true }, "", path);
  } catch {
    /* ignore */
  }
}

/** Read ?artist=&city=&mode= (and legacy ?location=) deep-link from the current URL. */
function readShareDeepLink() {
  try {
    const params = new URLSearchParams(window.location.search);
    const artist = normalizeUsername(params.get("artist") || "");
    const cityRaw = params.get("city");
    const locationRaw = params.get("location");
    const scopeRaw = cityRaw != null ? cityRaw : locationRaw;
    const modeRaw = params.get("mode");
    const mode = isValidMode(modeRaw) ? modeRaw : null;
    if (!artist && scopeRaw == null && !mode) return null;
    return {
      artist: artist || null,
      location: scopeRaw != null ? String(scopeRaw).trim() : null,
      hasLocationParam: scopeRaw != null,
      mode,
    };
  } catch {
    return null;
  }
}

/** Map a shared city/location token onto an exact banner-city location when possible. */
function resolveLocationFromParam(value) {
  const needle = String(value || "").trim();
  if (!needle) return "";
  const lower = needle.toLowerCase();
  const slug = citySlug(needle);
  const exact = bannerCities.find((city) => city.location.toLowerCase() === lower);
  if (exact) return exact.location;
  const bySlug = bannerCities.find((city) => citySlug(city.location) === slug);
  if (bySlug) return bySlug.location;
  const startsWith = bannerCities.find((city) => city.location.toLowerCase().startsWith(`${lower},`));
  if (startsWith) return startsWith.location;
  const byLabel = bannerCities.find((city) => cityChipLabel(city.location).toLowerCase() === lower);
  if (byLabel) return byLabel.location;
  const includes = bannerCities.find((city) => city.location.toLowerCase().includes(lower));
  return includes?.location || needle;
}

function findArtistByUsername(username) {
  const needle = normalizeUsername(username);
  if (!needle) return null;
  return artists.find((item) => normalizeUsername(item.username) === needle) || null;
}

function clearSharedRowHighlight() {
  $$(".artist-row.is-shared-target").forEach((row) => row.classList.remove("is-shared-target"));
}

/** Expand list, scroll ranking to the artist row, highlight, then open detail. */
function focusArtistInRanking(artist, { openDrawerAfter = true } = {}) {
  if (!artist) return false;
  const sorted = filteredArtists();
  const index = sorted.findIndex((item) => item.rank === artist.rank);
  if (index < 0) return false;

  if (index + 1 > state.visible) {
    state.visible = index + 1;
  }
  renderRanking();

  const row = document.querySelector(`.artist-list .artist-row[data-artist-rank="${artist.rank}"]`);
  if (!row) return false;

  clearSharedRowHighlight();
  row.classList.add("is-shared-target");

  const rankingShell = document.querySelector(".ranking-shell") || document.getElementById("leaderboard");
  suppressScrollSave = true;
  const headerOffset = 88;
  if (rankingShell && rankingShell.getBoundingClientRect().top > window.innerHeight * 0.35) {
    rankingShell.scrollIntoView({ behavior: "auto", block: "start" });
  }
  const rowTop = row.getBoundingClientRect().top + window.scrollY;
  const targetY = Math.max(0, rowTop - headerOffset - Math.min(72, window.innerHeight * 0.12));
  window.scrollTo({ top: targetY, behavior: "auto" });
  suppressScrollSave = false;
  writeUiState();
  if (openDrawerAfter) openDrawer(artist.rank);
  return true;
}

let sharedArtistOpenedFor = null;

function tryOpenDeepLinkArtist(username) {
  const handle = normalizeUsername(username);
  if (!handle || sharedArtistOpenedFor === handle) return Boolean(sharedArtistOpenedFor);
  const artist = findArtistByUsername(handle);
  if (!artist) return false;
  sharedArtistOpenedFor = handle;
  syncBrowserUrl({ artist: artist.username, replace: true });
  return focusArtistInRanking(artist, { openDrawerAfter: true });
}

function openSharedArtist(username) {
  return tryOpenDeepLinkArtist(username);
}

const SHARE_ICONS = {
  x: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm8.75 2.25a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>`,
  snapchat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/></svg>`,
  telegram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"/></svg>`,
  native: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 18 7.91c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L7.96 9.81A2.99 2.99 0 0 0 6 9.09c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.15c-.05.21-.08.43-.08.66 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>`,
};

function shareIcon(name) {
  return SHARE_ICONS[name] || SHARE_ICONS.native;
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

function setShareStatus(message) {
  const status = $("#drawerShareStatus");
  if (!status) return;
  window.clearTimeout(shareStatusTimer);
  if (!message) {
    status.hidden = true;
    status.textContent = "";
    return;
  }
  status.hidden = false;
  status.textContent = message;
  shareStatusTimer = window.setTimeout(() => {
    status.hidden = true;
    status.textContent = "";
  }, 2200);
}

function shareAppButtons(payload) {
  const encodedUrl = encodeURIComponent(payload.url);
  const encodedText = encodeURIComponent(payload.headline);
  return [
    {
      id: "x",
      label: "X",
      href: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: "x",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      action: "whatsapp",
      icon: "whatsapp",
    },
    {
      id: "instagram",
      label: "Instagram",
      action: "instagram",
      icon: "instagram",
    },
    {
      id: "snapchat",
      label: "Snapchat",
      action: "snapchat",
      icon: "snapchat",
    },
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: "facebook",
    },
    {
      id: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      icon: "telegram",
    },
    {
      id: "copy",
      label: "Copy",
      action: "copy",
      icon: "copy",
    },
    {
      id: "native",
      label: "More",
      action: "native",
      icon: "native",
    },
  ];
}

function renderShareApps(payload) {
  const root = $("#drawerShareApps");
  if (!root) return;
  root.innerHTML = shareAppButtons(payload)
    .map((app) => {
      const body = `${shareIcon(app.icon)}<span>${app.label}</span>`;
      if (app.href) {
        return `<a class="drawer-share-app" href="${escapeAttr(app.href)}" target="_blank" rel="noopener noreferrer" data-share-app="${app.id}" title="Share on ${escapeAttr(app.label)}">${body}</a>`;
      }
      return `<button class="drawer-share-app" type="button" data-share-action="${app.action}" data-share-app="${app.id}" title="${escapeAttr(app.label)}">${body}</button>`;
    })
    .join("");
}

function setSharePanelOpen(open) {
  const panel = $("#drawerSharePanel");
  const toggle = $("#drawerShareToggle");
  if (!panel || !toggle) return;
  panel.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));
  if (!open) setShareStatus("");
}

function syncSharePanel(artist) {
  if (!artist) return;
  const payload = buildSharePayload(artist);
  $("#drawerSharePreview").textContent = `${payload.headline}\n\n${payload.url}`;
  renderShareApps(payload);
}

async function handleShareAction(action, artist) {
  if (!artist) return;
  const payload = buildSharePayload(artist);
  if (action === "copy") {
    const ok = await copyText(payload.text);
    setShareStatus(ok ? "Copied ranking + link" : "Could not copy — try again");
    return;
  }
  if (action === "whatsapp") {
    // WhatsApp Web drops custom copy when `#` appears in the draft (treats it like a fragment).
    // Avoid `#rank` and open via wa.me with a fully encoded text payload.
    const safeHeadline = String(payload.headline || "").replace(/#(\d+)/g, "No. $1").replace(/#/g, "");
    const message = `${safeHeadline}\n${payload.url}`;
    const href = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(href, "_blank", "noopener,noreferrer");
    setShareStatus("Opening WhatsApp…");
    return;
  }
  if (action === "instagram") {
    const ok = await copyText(payload.text);
    setShareStatus(ok ? "Copied — paste in Instagram" : "Could not copy");
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    return;
  }
  if (action === "snapchat") {
    const ok = await copyText(payload.text);
    setShareStatus(ok ? "Copied — paste in Snapchat" : "Could not copy");
    window.open(
      `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(payload.url)}`,
      "_blank",
      "noopener,noreferrer",
    );
    return;
  }
  if (action === "native") {
    if (navigator.share) {
      try {
        await navigator.share({
          title: payload.headline,
          text: payload.headline,
          url: payload.url,
        });
        setShareStatus("Shared");
        return;
      } catch (err) {
        const name = err && typeof err === "object" && "name" in err ? err.name : "";
        if (name === "AbortError") return;
      }
    }
    const ok = await copyText(payload.text);
    setShareStatus(ok ? "Copied ranking + link" : "Could not share");
  }
}

function openDrawer(rank) {
  const artist = artists.find((item) => item.rank === Number(rank));
  if (!artist) return;
  state.selected = artist;
  lastFocused = document.activeElement;
  const globalRank = resolveGlobalRank(artist);
  const isCity = Boolean(state.location);
  $("#drawerRank").textContent = isCity
    ? `${chartScopeLabel()} #${pad(artist.rank, 2)}`
    : `#${pad(artist.rank, 3)}`;
  const rankMeta = $("#drawerRankMeta");
  if (isCity && globalRank != null) {
    rankMeta.hidden = false;
    rankMeta.textContent = `Global #${pad(globalRank, 3)} · Hiffi Hip-Hop 500`;
  } else if (isCity) {
    rankMeta.hidden = false;
    rankMeta.textContent = `${chartScopeLabel()} chart · city ranking`;
  } else {
    rankMeta.hidden = true;
    rankMeta.textContent = "";
  }
  $("#drawerArtistName").textContent = artist.name;
  $("#drawerScore").textContent = formatScore(artist.score);
  $("#drawerSubscribers").textContent = formatCount(artist.subscribers);
  $("#drawerViews").textContent = formatCount(artist.views);
  $("#drawerRecentAvg").textContent = formatCount(artist.recentAvgViews);
  $("#drawerVideos").textContent = formatCount(artist.videoCount);
  $("#drawerVelocity").textContent = formatVelocity(artist.uploadVelocity);
  $("#drawerLocation").textContent = artist.location || "—";
  const mom7 = $("#drawerMomentum7d");
  const mom30 = $("#drawerMomentum30d");
  mom7.textContent = formatMomentum(artist.momentum7d);
  mom30.textContent = formatMomentum(artist.momentum30d);
  const mom90 = $("#drawerMomentum90d");
  mom90.textContent = formatMomentum(artist.momentum90d);
  mom7.className = `momentum momentum-${momentumTone(artist.momentum7d)}`;
  mom30.className = `momentum momentum-${momentumTone(artist.momentum30d)}`;
  mom90.className = `momentum momentum-${momentumTone(artist.momentum90d)}`;

  const claim = claimAction(artist);
  const claimLink = $("#drawerClaim");
  const claimNote = $("#drawerClaimNote");
  if (claim) {
    claimLink.hidden = false;
    claimLink.href = claim.href;
    claimLink.innerHTML = `${claim.label} <span>↗</span>`;
    claimNote.hidden = false;
    claimNote.textContent = claim.note;
  } else {
    claimLink.hidden = true;
    claimLink.removeAttribute("href");
    claimNote.hidden = false;
    claimNote.textContent = artist.claimStatus === "claimed"
      ? "This Artist Index profile is claimed."
      : "";
    if (!claimNote.textContent) claimNote.hidden = true;
  }

  const yt = $("#drawerYoutube");
  if (artist.youtubeUrl) {
    yt.href = artist.youtubeUrl;
    yt.innerHTML = `Open YouTube channel <span>↗</span>`;
  } else {
    yt.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist.name} official`)}`;
    yt.innerHTML = `Find official channel <span>↗</span>`;
  }
  syncSharePanel(artist);
  setSharePanelOpen(false);
  const bars = [48, 56, 52, 63, 59, 76, 72, 91].map((h) => Math.max(18, h - artist.rank / 4));
  $("#drawerChart").innerHTML = bars.map((height) => `<i style="height:${height}%"></i>`).join("");
  $("#drawerBackdrop").hidden = false;
  document.body.style.overflow = "hidden";
  syncBrowserUrl({ artist: artist.username, replace: true });
  $("#drawerClose").focus();
}

function closeDrawer() {
  state.selected = null;
  setSharePanelOpen(false);
  $("#drawerBackdrop").hidden = true;
  document.body.style.overflow = "";
  syncBrowserUrl({ artist: null, replace: true });
  if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
}

function bindEvents() {
  $("#artistSearch").addEventListener("input", (event) => {
    state.query = event.target.value;
    state.visible = INITIAL_VISIBLE;
    renderRanking();
    writeUiState();
  });
  $("#rankingSort").addEventListener("change", (event) => {
    state.sort = event.target.value;
    state.visible = INITIAL_VISIBLE;
    renderRanking();
    writeUiState();
  });
  $("#locationFilters").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-location]");
    if (!button) return;
    const next = button.getAttribute("data-location") ?? "";
    if (next === state.location) return;
    state.location = next;
    state.visible = INITIAL_VISIBLE;
    state.selected = null;
    clearSharedRowHighlight();
    syncLocationFilterButtons();
    syncBrowserUrl({ artist: null, replace: true });
    writeUiState();
    void loadRanking({ restoreScroll: false });
  });
  $("#modeFilters").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mode]");
    if (!button) return;
    const next = button.getAttribute("data-mode") ?? "overall";
    if (!isValidMode(next) || next === state.mode) return;
    state.mode = next;
    state.visible = INITIAL_VISIBLE;
    syncModeFilterButtons();
    syncBrowserUrl({ artist: state.selected?.username || null, replace: true });
    renderHeroStats();
    renderRanking();
    writeUiState();
  });
  $("#loadMore").addEventListener("click", () => {
    state.visible += LOAD_MORE_STEP;
    renderRanking();
    writeUiState();
  });
  let scrollSaveTimer = 0;
  window.addEventListener(
    "scroll",
    () => {
      if (suppressScrollSave) return;
      window.clearTimeout(scrollSaveTimer);
      scrollSaveTimer = window.setTimeout(writeUiState, 150);
    },
    { passive: true },
  );
  window.addEventListener("pagehide", writeUiState);
  document.addEventListener("click", (event) => {
    if (event.target.closest(".artist-profile-link")) return;
    const artistButton = event.target.closest("[data-artist-rank]");
    if (artistButton) openDrawer(artistButton.dataset.artistRank);
    const scrollButton = event.target.closest("[data-scroll-target]");
    if (scrollButton) document.getElementById(scrollButton.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth" });
  });
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", (event) => {
    if (event.target === $("#drawerBackdrop")) closeDrawer();
  });
  $("#drawerShareToggle").addEventListener("click", (event) => {
    event.stopPropagation();
    const panel = $("#drawerSharePanel");
    if (!panel || !state.selected) return;
    const nextOpen = panel.hidden;
    if (nextOpen) syncSharePanel(state.selected);
    setSharePanelOpen(nextOpen);
  });
  $("#drawerSharePanel").addEventListener("click", (event) => {
    event.stopPropagation();
    const actionButton = event.target.closest("[data-share-action]");
    if (!actionButton || !state.selected) return;
    event.preventDefault();
    void handleShareAction(actionButton.getAttribute("data-share-action"), state.selected);
  });
  document.addEventListener("click", (event) => {
    const panel = $("#drawerSharePanel");
    if (!panel || panel.hidden) return;
    if (event.target.closest(".drawer-share-wrap")) return;
    setSharePanelOpen(false);
  });
  $("#menuToggle").addEventListener("click", () => {
    const open = $("#primaryNav").classList.toggle("is-open");
    $("#menuToggle").setAttribute("aria-expanded", String(open));
  });
  $$("#primaryNav a").forEach((link) =>
    link.addEventListener("click", () => {
      $("#primaryNav").classList.remove("is-open");
      $("#menuToggle").setAttribute("aria-expanded", "false");
    }),
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const sharePanel = $("#drawerSharePanel");
      if (sharePanel && !sharePanel.hidden) {
        setSharePanelOpen(false);
        return;
      }
      if (!$("#drawerBackdrop").hidden) closeDrawer();
      $("#primaryNav").classList.remove("is-open");
      $("#menuToggle").setAttribute("aria-expanded", "false");
    }
  });
}

/**
 * Paint from cache (if any), then refresh from global `/top` or city `/top/city`.
 * @param {{ restoreScroll?: boolean, deepLinkArtist?: string|null }} [options]
 */
async function loadRanking(options = {}) {
  const restoreScroll = Boolean(options.restoreScroll);
  const deepLinkArtist = options.deepLinkArtist ? normalizeUsername(options.deepLinkArtist) : null;
  const location = state.location;
  const generation = ++loadGeneration;

  const cached = readRankingCache(location);
  let paintedFromCache = false;
  if (cached) {
    applyDataset(cached.items, cached.totalRanked);
    if (restoreScroll) restoreScrollPosition();
    paintedFromCache = true;
    if (deepLinkArtist) tryOpenDeepLinkArtist(deepLinkArtist);
  } else {
    renderLoading();
  }

  try {
    let paintedProgressively = false;
    const result = await loadAllArtists((partialItems, partialRanked) => {
      if (generation !== loadGeneration) return;
      const needsArtist =
        deepLinkArtist && sharedArtistOpenedFor !== deepLinkArtist;
      const artistInPartial =
        needsArtist &&
        partialItems.some((item) => normalizeUsername(item.username) === deepLinkArtist);

      if (!paintedFromCache || artistInPartial) {
        applyDataset(partialItems, partialRanked);
        paintedProgressively = true;
      }
      if (deepLinkArtist) tryOpenDeepLinkArtist(deepLinkArtist);
    }, location);
    if (generation !== loadGeneration || result.aborted) return;
    writeRankingCache(result.items, result.totalRanked, location);
    if (paintedFromCache && !paintedProgressively) {
      withPreservedScroll(() => applyDataset(result.items, result.totalRanked));
    } else if (!paintedFromCache || result.items.length) {
      applyDataset(result.items, result.totalRanked);
    }
    if (deepLinkArtist) tryOpenDeepLinkArtist(deepLinkArtist);
  } catch (error) {
    if (generation !== loadGeneration) return;
    state.loading = false;
    state.error = error instanceof Error ? error.message : "Unknown error";
    if (!paintedFromCache) renderError(state.error);
  }
}

function hydrateBannerCitiesFromCache() {
  const cached = readJsonStorage(CITIES_CACHE_KEY);
  if (!cached || !Array.isArray(cached.items) || !cached.items.length) return false;
  bannerCities = cached.items;
  renderLocationFilters();
  return true;
}

async function init() {
  bindEvents();
  sharedArtistOpenedFor = null;
  const deepLink = readShareDeepLink();
  restoreUiState();

  // Shared links win over saved UI state for chart scope + search + mode.
  if (deepLink?.hasLocationParam) {
    state.location = deepLink.location || "";
  }
  if (deepLink?.mode) {
    state.mode = deepLink.mode;
  }
  if (deepLink?.artist) {
    state.query = "";
    state.visible = Math.max(state.visible, INITIAL_VISIBLE);
    const search = $("#artistSearch");
    if (search) search.value = "";
  }
  syncModeFilterButtons();

  renderLocationFilters();
  // Use any cached cities immediately so city deep-links don't wait on network.
  hydrateBannerCitiesFromCache();

  // Free quota from previous cache formats.
  try {
    localStorage.removeItem("hiffi-top-artist-cache-v1");
    localStorage.removeItem("hiffi-top-artist-cache-v2");
    localStorage.removeItem("hiffi-top-artist-cache-v3");
    localStorage.removeItem("hiffi-top-artist-cache-v4");
    localStorage.removeItem("hiffi-top-artist-cache-v5");
  } catch {
    /* ignore */
  }

  if (deepLink?.hasLocationParam) {
    state.location = resolveLocationFromParam(deepLink.location || "");
    syncLocationFilterButtons();
    writeUiState();
  }

  // If we still can't resolve a city slug, wait once for cities API.
  if (deepLink?.hasLocationParam && !state.location) {
    try {
      await fetchBannerCities();
    } catch {
      renderLocationFilters();
    }
    state.location = resolveLocationFromParam(deepLink.location || "");
    syncLocationFilterButtons();
    writeUiState();
  } else {
    // Refresh cities in the background; don't block the ranking paint.
    void fetchBannerCities().catch(() => {
      renderLocationFilters();
    });
  }

  syncBrowserUrl({
    artist: deepLink?.artist || null,
    replace: true,
  });

  await loadRanking({
    restoreScroll: !deepLink?.artist,
    deepLinkArtist: deepLink?.artist || null,
  });

  if (deepLink?.artist && sharedArtistOpenedFor !== normalizeUsername(deepLink.artist) && state.location) {
    // City charts are capped; if the artist isn't there, fall back to global.
    state.location = "";
    syncLocationFilterButtons();
    syncBrowserUrl({ artist: deepLink.artist, replace: true });
    writeUiState();
    sharedArtistOpenedFor = null;
    await loadRanking({
      restoreScroll: false,
      deepLinkArtist: deepLink.artist,
    });
  }
}

init();
