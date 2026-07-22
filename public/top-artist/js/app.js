"use strict";

const PAGE_SIZE = 100;
const INITIAL_VISIBLE = 20;
const LOAD_MORE_STEP = 20;
const ACCENTS = ["#ff2b2b", "#f4f1ea", "#7e7e83", "#ff2b2b", "#b8b6b1"];
/** Ranking payload cache — localStorage/sessionStorage (cookies can't hold ~500 artists). */
const CACHE_KEY_PREFIX = "hiffi-top-artist-cache-v3";
const UI_KEY = "hiffi-top-artist-ui-v2";
/** How old cache can be before we prefer a background refresh (stale cache still paints instantly). */
const REVALIDATE_MS = 60 * 60 * 1000;
const LOCATION_FILTERS = ["", "USA", "Atlanta"];

/** @type {ReturnType<typeof mapArtist>[]} */
let artists = [];
let totalRanked = 0;
/** Bumps when the active location changes so stale in-flight pages are ignored. */
let loadGeneration = 0;

const state = {
  query: "",
  location: "",
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
  const youtube = item.other_socials?.youtube || null;
  return {
    rank: item.rank,
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
    other_socials: youtube ? { youtube } : undefined,
    previous_rank: item.previous_rank ?? null,
    rank_delta_7d: item.rank_delta_7d ?? null,
    rank_delta_30d: item.rank_delta_30d ?? null,
    is_new_entry: Boolean(item.is_new_entry),
  };
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

function restoreUiState() {
  const saved = readUiState();
  if (!saved) return;
  if (typeof saved.query === "string") state.query = saved.query;
  if (typeof saved.location === "string" && LOCATION_FILTERS.includes(saved.location)) {
    state.location = saved.location;
  } else if (saved.region === "USA") {
    // Migrate old UI key shape.
    state.location = "USA";
  } else if (saved.region === "All") {
    state.location = "";
  }
  if (saved.sort === "overall" || saved.sort === "views" || saved.sort === "subscribers") {
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
  artists = items.map(mapArtist);
  totalRanked = ranked;
  state.loading = false;
  state.error = null;
  renderHeroStats();
  renderTopThree();
  renderRanking();
  renderMovers();
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

function artistIndexHref(username) {
  return `/artist-index/${encodeURIComponent(username)}`;
}

function artistClaimHref(username) {
  return `${artistIndexHref(username)}/claim`;
}

/** @param {{ claimStatus?: string, username?: string }} artist */
function claimAction(artist) {
  if (!artist.username || artist.claimStatus === "claimed") return null;
  if (artist.claimStatus === "pending") {
    return {
      href: artistClaimHref(artist.username),
      label: "Request ownership",
      note: "Ownership under review. If this is your profile, you can still request ownership.",
    };
  }
  return {
    href: artistClaimHref(artist.username),
    label: "Claim this profile",
    note: "Is this your profile? Claim it to verify links, upload videos, and get discovered.",
  };
}

function mapArtist(item, index) {
  const name = item.artist_name || item.username || "Unknown";
  const location = item.location || "";
  return {
    rank: item.rank,
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
    youtubeUrl: item.other_socials?.youtube || null,
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

async function fetchTopPage(limit, offset, location = state.location) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    enrich: "0",
  });
  const trimmed = String(location || "").trim();
  if (trimmed) params.set("location", trimmed);
  const res = await fetch(`/proxy/inventory/top?${params}`, {
    headers: { Accept: "application/json" },
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error || `Failed to load ranking (${res.status})`);
  }
  return body.data;
}

async function loadAllArtists(onPage, location = state.location) {
  const items = [];
  let offset = 0;
  let hasMore = true;
  let ranked = 0;
  const generation = loadGeneration;

  while (hasMore && items.length < 500) {
    if (generation !== loadGeneration) {
      return { items, totalRanked: ranked || items.length, aborted: true };
    }
    const page = await fetchTopPage(PAGE_SIZE, offset, location);
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
  return artists
    .filter(
      (artist) =>
        !query ||
        artist.name.toLowerCase().includes(query) ||
        artist.username.toLowerCase().includes(query),
    )
    .sort((a, b) => {
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

      if (state.sort === "views") return cmpNullLast(a.recentAvgViews ?? a.views, b.recentAvgViews ?? b.views);
      if (state.sort === "subscribers") return cmpNullLast(a.subscribers, b.subscribers);
      return byRank();
    });
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
  const trackedEl = document.querySelector(".hero-stats div:first-child b");
  if (trackedEl) trackedEl.textContent = String(tracked || "—");
  const terminalNumber = document.querySelector(".terminal-number");
  if (terminalNumber) terminalNumber.textContent = String(tracked || "500");
  const terminalLabel = document.querySelector(".terminal-label span");
  if (terminalLabel) terminalLabel.textContent = `USA / ${tracked || 0} RANKED CHANNELS`;
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
      <span class="artist-identity"><b>${pad(artist.rank, 3)}</b><i style="background:${artist.accent}">${artist.name.slice(0, 2).toUpperCase()}</i><strong>${artist.name}<small>${artist.location || artist.username}</small></strong></span>
      <span data-label="Region">${artist.location || "—"}</span>
      <span data-label="Subscribers">${formatCount(artist.subscribers)}</span>
      <span data-label="Lifetime views">${formatCount(artist.views)}</span>
      <span data-label="Recent avg">${formatCount(artist.recentAvgViews)}</span>
      <span data-label="Score"><em>${formatScore(artist.score)}</em></span>
      ${movementHTML(artist)}
    </button>`,
        )
        .join("")
    : `<div class="empty-state"><b>No artist found.</b><span>Try another name or region.</span></div>`;

  $("#resultsCount").textContent = `Showing ${Math.min(state.visible, filtered.length)} of ${filtered.length} ranked artists${
    totalRanked ? ` · ${totalRanked} total` : ""
  }${state.location ? ` · ${state.location}` : ""}`;
  $("#loadMore").hidden = state.visible >= filtered.length;
}

function renderMovers() {
  const chart = [32, 58, 46, 72, 60, 94, 78, 100];
  const movers = [...artists]
    .filter((a) => a.recentAvgViews != null || a.subscribers != null)
    .sort((a, b) => (b.recentAvgViews ?? b.subscribers ?? 0) - (a.recentAvgViews ?? a.subscribers ?? 0))
    .slice(0, 3);

  const fallback = movers.length ? movers : artists.slice(0, 3);

  $("#moverGrid").innerHTML = fallback
    .map((artist, index) => {
      const growthLabel = formatScore(artist.score);
      const detail = [
        artist.subscribers != null ? `${formatCount(artist.subscribers)} subs` : null,
        artist.recentAvgViews != null ? `${formatCount(artist.recentAvgViews)} recent avg` : null,
        artist.uploadVelocity != null ? formatVelocity(artist.uploadVelocity) : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return `
    <button type="button" class="mover-card" data-artist-rank="${artist.rank}">
      <div class="mover-card-top"><span>0${index + 1}</span><b>↗</b></div>
      <div class="mini-bars" aria-hidden="true">${chart.map((height) => `<i style="height:${Math.max(12, height - index * 8)}%"></i>`).join("")}</div>
      <h3>${artist.name}</h3><p><strong>${growthLabel}</strong> index score${detail ? `<br>${detail}` : ""}</p>
    </button>`;
    })
    .join("");
}

let lastFocused = null;
function openDrawer(rank) {
  const artist = artists.find((item) => item.rank === Number(rank));
  if (!artist) return;
  state.selected = artist;
  lastFocused = document.activeElement;
  $("#drawerRank").textContent = `#${pad(artist.rank, 3)}`;
  $("#drawerArtistName").textContent = artist.name;
  $("#drawerScore").textContent = formatScore(artist.score);
  $("#drawerSubscribers").textContent = formatCount(artist.subscribers);
  $("#drawerViews").textContent = formatCount(artist.views);
  $("#drawerRecentAvg").textContent = formatCount(artist.recentAvgViews);
  $("#drawerVideos").textContent = formatCount(artist.videoCount);
  $("#drawerVelocity").textContent = formatVelocity(artist.uploadVelocity);
  $("#drawerLocation").textContent = artist.location || "—";

  const profile = $("#drawerProfile");
  if (artist.username) {
    profile.hidden = false;
    profile.href = artistIndexHref(artist.username);
  } else {
    profile.hidden = true;
    profile.removeAttribute("href");
  }

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
  const bars = [48, 56, 52, 63, 59, 76, 72, 91].map((h) => Math.max(18, h - artist.rank / 4));
  $("#drawerChart").innerHTML = bars.map((height) => `<i style="height:${height}%"></i>`).join("");
  $("#drawerBackdrop").hidden = false;
  document.body.style.overflow = "hidden";
  $("#drawerClose").focus();
}

function closeDrawer() {
  state.selected = null;
  $("#drawerBackdrop").hidden = true;
  document.body.style.overflow = "";
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
    syncLocationFilterButtons();
    writeUiState();
    void loadRanking({ restoreScroll: false });
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
    const artistButton = event.target.closest("[data-artist-rank]");
    if (artistButton) openDrawer(artistButton.dataset.artistRank);
    const scrollButton = event.target.closest("[data-scroll-target]");
    if (scrollButton) document.getElementById(scrollButton.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth" });
  });
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", (event) => {
    if (event.target === $("#drawerBackdrop")) closeDrawer();
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
      if (!$("#drawerBackdrop").hidden) closeDrawer();
      $("#primaryNav").classList.remove("is-open");
      $("#menuToggle").setAttribute("aria-expanded", "false");
    }
  });
}

/**
 * Paint from cache (if any), then refresh from GET /inventory/top?location=…
 * @param {{ restoreScroll?: boolean }} [options]
 */
async function loadRanking(options = {}) {
  const restoreScroll = Boolean(options.restoreScroll);
  const location = state.location;
  const generation = ++loadGeneration;

  const cached = readRankingCache(location);
  let paintedFromCache = false;
  if (cached) {
    applyDataset(cached.items, cached.totalRanked);
    if (restoreScroll) restoreScrollPosition();
    paintedFromCache = true;
  } else {
    renderLoading();
  }

  try {
    let paintedProgressively = false;
    const result = await loadAllArtists((partialItems, partialRanked) => {
      if (generation !== loadGeneration) return;
      if (!paintedFromCache && partialItems.length) {
        applyDataset(partialItems, partialRanked);
        paintedProgressively = true;
      }
    }, location);
    if (generation !== loadGeneration || result.aborted) return;
    writeRankingCache(result.items, result.totalRanked, location);
    if (paintedFromCache) {
      withPreservedScroll(() => applyDataset(result.items, result.totalRanked));
    } else if (!paintedProgressively || result.items.length) {
      applyDataset(result.items, result.totalRanked);
    }
  } catch (error) {
    if (generation !== loadGeneration) return;
    state.loading = false;
    state.error = error instanceof Error ? error.message : "Unknown error";
    if (!paintedFromCache) renderError(state.error);
  }
}

async function init() {
  bindEvents();
  restoreUiState();

  // Free quota from previous cache formats.
  try {
    localStorage.removeItem("hiffi-top-artist-cache-v1");
    localStorage.removeItem("hiffi-top-artist-cache-v2");
  } catch {
    /* ignore */
  }

  await loadRanking({ restoreScroll: true });
}

init();
