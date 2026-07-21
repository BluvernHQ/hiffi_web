"use strict";

const PAGE_SIZE = 100;
const INITIAL_VISIBLE = 20;
const LOAD_MORE_STEP = 20;
const ACCENTS = ["#ff2b2b", "#f4f1ea", "#7e7e83", "#ff2b2b", "#b8b6b1"];

const US_STATE_RE =
  /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY|DC|USA|United States)\b/i;

/** @type {ReturnType<typeof mapArtist>[]} */
let artists = [];
let totalRanked = 0;

const state = { query: "", region: "All", sort: "overall", visible: INITIAL_VISIBLE, selected: null, loading: true, error: null };
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const pad = (value, size) => String(value).padStart(size, "0");

function deriveRegion(location) {
  const text = String(location || "").trim();
  if (!text) return "USA";
  if (US_STATE_RE.test(text)) return "USA";
  return "USA";
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

function mapArtist(item, index) {
  const name = item.artist_name || item.username || "Unknown";
  const location = item.location || "";
  return {
    rank: item.rank,
    username: item.username,
    name,
    location,
    region: deriveRegion(location),
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

async function loadAllArtists() {
  const items = [];
  let offset = 0;
  let hasMore = true;
  let ranked = 0;

  while (hasMore && items.length < 500) {
    const page = await fetchTopPage(PAGE_SIZE, offset);
    const batch = Array.isArray(page.items) ? page.items : [];
    items.push(...batch);
    ranked = page.total_ranked ?? ranked;
    hasMore = Boolean(page.has_more) && batch.length > 0;
    offset += batch.length;
    if (batch.length === 0) break;
  }

  return { items, totalRanked: ranked || items.length };
}

function filteredArtists() {
  const query = state.query.trim().toLowerCase();
  return artists
    .filter(
      (artist) =>
        (!query || artist.name.toLowerCase().includes(query) || artist.username.toLowerCase().includes(query)) &&
        (state.region === "All" || artist.region === state.region),
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
      <span data-label="Region">${artist.location || artist.region || "—"}</span>
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
  }`;
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
  });
  $("#rankingSort").addEventListener("change", (event) => {
    state.sort = event.target.value;
    state.visible = INITIAL_VISIBLE;
    renderRanking();
  });
  $("#regionFilters").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-region]");
    if (!button) return;
    state.region = button.dataset.region;
    state.visible = INITIAL_VISIBLE;
    $$("button[data-region]", $("#regionFilters")).forEach((item) => item.classList.toggle("active", item === button));
    renderRanking();
  });
  $("#loadMore").addEventListener("click", () => {
    state.visible += LOAD_MORE_STEP;
    renderRanking();
  });
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

async function init() {
  bindEvents();
  renderLoading();
  try {
    const { items, totalRanked: ranked } = await loadAllArtists();
    artists = items.map(mapArtist);
    totalRanked = ranked;
    state.loading = false;
    renderHeroStats();
    renderTopThree();
    renderRanking();
    renderMovers();
  } catch (error) {
    state.loading = false;
    state.error = error instanceof Error ? error.message : "Unknown error";
    renderError(state.error);
  }
}

init();
