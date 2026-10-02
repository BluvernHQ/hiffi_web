"use strict";

const ARTIST_NAMES = [
  "NBA YoungBoy", "Eminem", "Drake", "Kendrick Lamar", "Travis Scott", "Future", "Lil Baby", "Nicki Minaj", "J. Cole", "Kanye West",
  "21 Savage", "Doja Cat", "Juice WRLD", "XXXTentacion", "Lil Wayne", "Cardi B", "Megan Thee Stallion", "Central Cee", "Playboi Carti", "Post Malone",
  "Tyler, The Creator", "Metro Boomin", "Snoop Dogg", "50 Cent", "Ice Cube", "GloRilla", "Rod Wave", "Polo G", "Lil Durk", "Gunna",
  "Young Thug", "A$AP Rocky", "Dave", "Skepta", "Stormzy", "NF", "Logic", "Mac Miller", "Pop Smoke", "NLE Choppa",
  "Kodak Black", "Lil Uzi Vert", "DaBaby", "Latto", "Moneybagg Yo", "Don Toliver", "JID", "Denzel Curry", "Yeat", "Lil Tecca",
  "Baby Keem", "Offset", "Quavo", "Chief Keef", "Nas", "JAY-Z", "2Pac", "The Notorious B.I.G.", "DMX", "Missy Elliott",
  "Ludacris", "T.I.", "Rick Ross", "Wiz Khalifa", "Gucci Mane", "Busta Rhymes", "Wu-Tang Clan", "Outkast", "Migos", "Run-DMC",
  "Public Enemy", "Beastie Boys", "Cypress Hill", "The Game", "Big Sean", "Kid Cudi", "Joey Bada$$", "Chance the Rapper", "Lupe Fiasco", "Pusha T",
  "Vince Staples", "Cordae", "Jack Harlow", "Saweetie", "Ice Spice", "Coi Leray", "Rapsody", "Little Simz", "Lauryn Hill", "Queen Latifah",
  "Eve", "Trina", "Roddy Ricch", "6LACK", "A Boogie wit da Hoodie", "French Montana", "Schoolboy Q", "YG", "Kevin Gates", "Joyner Lucas",
  "Tech N9ne", "Freddie Gibbs", "Aminé", "EarthGang", "Tee Grizzley", "Rae Sremmurd", "Lil Yachty", "Lil Tjay", "Fivio Foreign", "Toosii",
  "Key Glock", "EST Gee", "Blxst", "Doechii", "Flo Milli", "BIA", "Tierra Whack", "D Smoke", "Mick Jenkins", "Boldy James"
];

const ACCENTS = ["#ff2b2b", "#f4f1ea", "#7e7e83", "#ff2b2b", "#b8b6b1"];
const UK_ARTISTS = new Set(["Central Cee", "Dave", "Skepta", "Stormzy", "Little Simz"]);
const CANADA_ARTISTS = new Set(["Drake", "Tory Lanez"]);
const GLOBAL_ARTISTS = new Set(["Post Malone", "Doja Cat", "Nicki Minaj", "Eminem"]);

const artists = ARTIST_NAMES.map((name, index) => {
  const rank = index + 1;
  const movement = ((index * 5) % 9) - 4;
  return {
    rank,
    name,
    region: UK_ARTISTS.has(name) ? "UK" : CANADA_ARTISTS.has(name) ? "Canada" : GLOBAL_ARTISTS.has(name) ? "Global" : "USA",
    subscribers: Number(Math.max(1.1, 46.5 * Math.pow(0.965, index) + ((index * 7) % 11) / 10).toFixed(1)),
    views: Number(Math.max(0.8, 31.2 * Math.pow(0.971, index) + ((index * 13) % 18) / 10).toFixed(1)),
    monthlyViews: Math.round(Math.max(8, 620 * Math.pow(0.969, index) + ((index * 19) % 72))),
    growth: Number((0.8 + ((index * 17) % 83) / 10).toFixed(1)),
    score: Number(Math.max(52, 99.2 - index * 0.37).toFixed(1)),
    previousRank: Math.max(1, rank + movement),
    accent: ACCENTS[index % ACCENTS.length]
  };
});

Object.assign(artists[0], { subscribers: 14.2, views: 17.9, monthlyViews: 612, growth: 8.4, score: 99.2, previousRank: 3 });
Object.assign(artists[1], { subscribers: 63.6, views: 34.1, monthlyViews: 486, growth: 3.2, score: 98.7, previousRank: 2 });
Object.assign(artists[2], { subscribers: 31.9, views: 19.1, monthlyViews: 455, growth: 4.8, score: 98.1, previousRank: 1, region: "Canada" });

const state = { query: "", region: "All", sort: "overall", visible: 16, selected: null };
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const formatBillions = value => `${value.toFixed(1)}B`;
const formatMillions = value => `${Math.round(value)}M`;
const formatSubscribers = value => `${value.toFixed(1)}M`;
const pad = (value, size) => String(value).padStart(size, "0");

function movementMeta(artist) {
  const delta = artist.previousRank - artist.rank;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const symbol = direction === "up" ? "↗" : direction === "down" ? "↘" : "→";
  const amount = Math.abs(delta);
  const label = delta === 0 ? "No rank change" : `${direction} ${amount} ${amount === 1 ? "place" : "places"}`;
  return { delta, direction, symbol, amount, label };
}

function movementHTML(artist, compact = false) {
  const move = movementMeta(artist);
  return `<span class="movement movement-${move.direction}" aria-label="${move.label}"><span aria-hidden="true">${move.symbol}</span>${!compact && move.delta !== 0 ? move.amount : ""}</span>`;
}

function filteredArtists() {
  const query = state.query.trim().toLowerCase();
  return artists
    .filter(artist => (!query || artist.name.toLowerCase().includes(query)) && (state.region === "All" || artist.region === state.region))
    .sort((a, b) => state.sort === "rising" ? b.growth - a.growth : state.sort === "views" ? b.monthlyViews - a.monthlyViews : a.rank - b.rank);
}

function renderTopThree() {
  $("#topThree").innerHTML = artists.slice(0, 3).map(artist => `
    <button type="button" class="top-row" data-artist-rank="${artist.rank}">
      <b>${pad(artist.rank, 2)}</b><span>${artist.name}</span>${movementHTML(artist, true)}
    </button>`).join("");
}

function renderRanking() {
  const filtered = filteredArtists();
  const shown = filtered.slice(0, state.visible);
  $("#artistList").innerHTML = shown.length ? shown.map((artist, index) => `
    <button type="button" class="artist-row" data-artist-rank="${artist.rank}" style="--delay:${Math.min(index, 12) * 28}ms">
      <span class="artist-identity"><b>${pad(artist.rank, 3)}</b><i style="background:${artist.accent}">${artist.name.slice(0, 2).toUpperCase()}</i><strong>${artist.name}<small>Open profile ↗</small></strong></span>
      <span data-label="Region">${artist.region}</span>
      <span data-label="Subscribers">${formatSubscribers(artist.subscribers)}</span>
      <span data-label="Lifetime views">${formatBillions(artist.views)}</span>
      <span data-label="30D views">${formatMillions(artist.monthlyViews)}</span>
      <span data-label="Index score"><em>${artist.score}</em></span>
      ${movementHTML(artist)}
    </button>`).join("") : `<div class="empty-state"><b>No artist found.</b><span>Try another name or region.</span></div>`;

  $("#resultsCount").textContent = `Showing ${Math.min(state.visible, filtered.length)} of ${filtered.length} preview profiles`;
  $("#loadMore").hidden = state.visible >= filtered.length;
}

function renderMovers() {
  const chart = [32, 58, 46, 72, 60, 94, 78, 100];
  $("#moverGrid").innerHTML = [...artists].sort((a, b) => b.growth - a.growth).slice(0, 3).map((artist, index) => `
    <button type="button" class="mover-card" data-artist-rank="${artist.rank}">
      <div class="mover-card-top"><span>0${index + 1}</span><b>↗</b></div>
      <div class="mini-bars" aria-hidden="true">${chart.map(height => `<i style="height:${Math.max(12, height - index * 8)}%"></i>`).join("")}</div>
      <h3>${artist.name}</h3><p><strong>+${artist.growth}%</strong> 30-day audience growth</p>
    </button>`).join("");
}

let lastFocused = null;
function openDrawer(rank) {
  const artist = artists.find(item => item.rank === Number(rank));
  if (!artist) return;
  state.selected = artist;
  lastFocused = document.activeElement;
  $("#drawerRank").textContent = `#${pad(artist.rank, 3)}`;
  $("#drawerArtistName").textContent = artist.name;
  $("#drawerScore").textContent = artist.score;
  $("#drawerSubscribers").textContent = formatSubscribers(artist.subscribers);
  $("#drawerViews").textContent = formatBillions(artist.views);
  $("#drawerMonthly").textContent = formatMillions(artist.monthlyViews);
  $("#drawerGrowth").textContent = `+${artist.growth}%`;
  $("#drawerYoutube").href = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist.name} official`)}`;
  $("#drawerChart").innerHTML = [48, 56, 52, 63, 59, 76, 72, 91, 84, 100].map(height => `<i style="height:${Math.max(18, height - artist.rank / 4)}%"></i>`).join("");
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
  $("#artistSearch").addEventListener("input", event => { state.query = event.target.value; state.visible = 16; renderRanking(); });
  $("#rankingSort").addEventListener("change", event => { state.sort = event.target.value; state.visible = 16; renderRanking(); });
  $("#regionFilters").addEventListener("click", event => {
    const button = event.target.closest("button[data-region]");
    if (!button) return;
    state.region = button.dataset.region;
    state.visible = 16;
    $$("button[data-region]", $("#regionFilters")).forEach(item => item.classList.toggle("active", item === button));
    renderRanking();
  });
  $("#loadMore").addEventListener("click", () => { state.visible += 16; renderRanking(); });
  document.addEventListener("click", event => {
    const artistButton = event.target.closest("[data-artist-rank]");
    if (artistButton) openDrawer(artistButton.dataset.artistRank);
    const scrollButton = event.target.closest("[data-scroll-target]");
    if (scrollButton) document.getElementById(scrollButton.dataset.scrollTarget)?.scrollIntoView({ behavior: "smooth" });
  });
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", event => { if (event.target === $("#drawerBackdrop")) closeDrawer(); });
  $("#menuToggle").addEventListener("click", () => {
    const open = $("#primaryNav").classList.toggle("is-open");
    $("#menuToggle").setAttribute("aria-expanded", String(open));
  });
  $$("#primaryNav a").forEach(link => link.addEventListener("click", () => { $("#primaryNav").classList.remove("is-open"); $("#menuToggle").setAttribute("aria-expanded", "false"); }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (!$("#drawerBackdrop").hidden) closeDrawer();
      $("#primaryNav").classList.remove("is-open");
      $("#menuToggle").setAttribute("aria-expanded", "false");
    }
  });
}

renderTopThree();
renderRanking();
renderMovers();
bindEvents();
