/**
 * Hiffi 500 share cards — bind templates + PNG export (html-to-image).
 * Depends on helpers from app.js via window.HiffiTopArtistShare bridge.
 */
(function (global) {
  "use strict";

  const RISER_DELTA_THRESHOLD = 10;
  let htmlToImageMod = null;
  let shareFormat = "square";
  let shareTemplate = "global";
  let capturing = false;
  let previewTimer = 0;

  function bridge() {
    return global.HiffiTopArtistShare || {};
  }

  function $(sel, scope) {
    return (scope || document).querySelector(sel);
  }

  function $$(sel, scope) {
    return Array.from((scope || document).querySelectorAll(sel));
  }

  function scoreBandLabel(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return "Emerging Band";
    if (n >= 32) return "Elite Band";
    if (n >= 28) return "Strong Band";
    if (n >= 24) return "Building Band";
    return "Emerging Band";
  }

  function artistInitials(name) {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function artistSlug(username, name) {
    const raw = String(username || name || "artist")
      .trim()
      .toLowerCase()
      .replace(/^@+/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return raw || "artist";
  }

  function formatWeekDate(ts) {
    const d = ts ? new Date(ts) : new Date();
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatReleaseDate(ts) {
    const d = ts ? new Date(ts) : new Date();
    if (Number.isNaN(d.getTime())) return "";
    return `Released ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }

  function formatVerifiedDate(ts) {
    const d = ts ? new Date(ts) : new Date();
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  function proxyImageUrl(raw) {
    // Prefer direct Workers/CDN URLs from the ranking page bridge (no profile-picture proxy).
    const resolve = bridge().resolveArtistImageUrl || bridge().proxyProfilePictureUrl;
    if (typeof resolve === "function") return resolve(raw);
    if (!raw || typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    if (trimmed.startsWith("/proxy/")) return null;
    const base =
      (typeof global.__HIFFI_WORKERS_URL__ === "string" && global.__HIFFI_WORKERS_URL__.trim()) ||
      "https://prod.hiffi.workers.dev";
    const clean = trimmed.replace(/^\//, "");
    return clean ? `${base.replace(/\/$/, "")}/${clean}` : null;
  }

  function resolveShareCardTemplate(artist, chartState) {
    const mode = chartState?.mode || "overall";
    const location = String(chartState?.location || "").trim();
    const context = chartState?.shareContext || null;
    if (mode === "verified") return "verified";
    if (mode === "risers" || context === "riser") return "riser";
    if (location) return "city";
    const move = bridge().movementMeta?.(artist);
    const delta = move?.delta;
    if (artist?.isNewEntry) return "riser";
    if (typeof delta === "number" && delta >= RISER_DELTA_THRESHOLD && !move?.soft) return "riser";
    return "global";
  }

  function setField(card, name, value) {
    card.querySelectorAll(`[data-field="${name}"]`).forEach((el) => {
      if (name === "artist_photo_url") return;
      el.textContent = value == null ? "" : String(value);
    });
  }

  /** Long names must wrap/shrink — global .artist-name uses ellipsis for the ranking table. */
  function fitArtistName(card, name) {
    const len = String(name || "").replace(/\s+/g, "").length;
    card.querySelectorAll(".artist-name").forEach((el) => {
      el.style.fontSize = "";
      el.classList.remove("is-wrapped");
      el.classList.toggle("is-long", len > 14 && len <= 18);
      el.classList.toggle("is-xl", len > 18);
    });
  }

  function cityOnly(location) {
    const raw = String(location || "").trim();
    if (!raw) return "";
    return raw.split(",")[0].trim() || raw;
  }

  function fitRankDigits(card, rankValue) {
    const stack = card.querySelector(".share-card__rank");
    if (!stack) return;
    stack.style.fontSize = "";
    const digits = String(rankValue ?? "")
      .replace(/[^0-9]/g, "")
      .length;
    stack.classList.toggle("is-2digit", digits === 2);
    stack.classList.toggle("is-3digit", digits >= 3);
  }

  /** Binary-search font size so text never clips the card (preview + PNG capture). */
  function fitFontToWidth(el, { maxPx, minPx }) {
    if (!el) return;
    const limit = Math.max(1, el.clientWidth);
    el.style.whiteSpace = "nowrap";
    el.style.fontSize = `${maxPx}px`;
    if (el.scrollWidth <= limit + 1) {
      el.style.fontSize = `${Math.floor(maxPx)}px`;
      return Math.floor(maxPx);
    }
    let lo = minPx;
    let hi = maxPx;
    let best = minPx;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      el.style.fontSize = `${mid}px`;
      if (el.scrollWidth <= limit + 1) {
        best = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }
    const size = Math.max(minPx, Math.floor(best));
    el.style.fontSize = `${size}px`;
    return size;
  }

  function fitShareCardTypography(card) {
    if (!card) return;
    const isStory = card.classList.contains("format-story");

    const rank = card.querySelector(".share-card__rank");
    if (rank) {
      const styles = getComputedStyle(rank);
      const maxPx = parseFloat(styles.fontSize) || (isStory ? 220 : 190);
      fitFontToWidth(rank, {
        maxPx,
        minPx: isStory ? 100 : 84,
      });
    }

    const title = card.querySelector(".kicker__title-text:not([hidden])") || card.querySelector(".kicker__500");
    if (title && !card.querySelector(".kicker__title.is-brand")) {
      title.style.fontSize = "";
      const styles = getComputedStyle(title);
      const maxPx = parseFloat(styles.fontSize) || (isStory ? 64 : 52);
      fitFontToWidth(title, {
        maxPx,
        minPx: isStory ? 28 : 24,
      });
    } else if (card.querySelector(".kicker__title.is-brand")) {
      const brand = card.querySelector(".kicker__brand");
      const five = card.querySelector(".kicker__500");
      const logo = brand?.querySelector("img");
      if (five) five.style.fontSize = "";
      if (logo) logo.style.height = "";
      if (brand && five && brand.scrollWidth > brand.clientWidth + 1) {
        const maxPx = isStory ? 68 : 56;
        fitFontToWidth(five, { maxPx, minPx: isStory ? 32 : 28 });
        if (logo) {
          const scale = Math.max(0.55, (parseFloat(getComputedStyle(five).fontSize) || maxPx) / maxPx);
          logo.style.height = `${Math.round((isStory ? 62 : 52) * scale)}px`;
        }
      }
    }

    card.querySelectorAll(".artist-name").forEach((el) => {
      el.classList.remove("is-wrapped");
      el.style.fontSize = "";
      const styles = getComputedStyle(el);
      const maxPx = parseFloat(styles.fontSize) || (isStory ? 124 : 108);
      const minPx = isStory ? 40 : 36;
      fitFontToWidth(el, { maxPx, minPx });
      if (el.scrollWidth > el.clientWidth + 1) {
        el.classList.add("is-wrapped");
        el.style.fontSize = `${minPx}px`;
      }
    });
  }

  function buildMovementCaption(artist, move) {
    if (artist?.isNewEntry || move?.soft || move?.delta == null || move.delta === 0) {
      return "Debut";
    }
    const n = Math.abs(move.amount || move.delta || 0);
    if (move.direction === "down") return `▼ ${n} This Week`;
    return `▲ ${n} This Week`;
  }

  function shareSealAccent(accentHex) {
    const rgb = hexToRgb(accentHex);
    if (!rgb) return "#e31e24";
    const max = Math.max(rgb.r, rgb.g, rgb.b);
    const min = Math.min(rgb.r, rgb.g, rgb.b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const lum = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
    // Grey / washed accents read weak on the certificate — use brand crimson.
    if (sat < 0.28 || lum > 0.72 || lum < 0.12) return "#e31e24";
    return accentHex;
  }

  function setMonogram(card, artist) {
    const accent = shareSealAccent(artist?.accent);
    const initials = artistInitials(artist?.name || artist?.username);
    card.querySelectorAll('[data-field="monogram"]').forEach((el) => {
      el.textContent = initials;
    });
    card.querySelectorAll(".share-card__avatar, .monogram").forEach((el) => {
      // Keep tile in the Hiffi crimson family; artist accent only tints lightly via CSS mix.
      el.style.setProperty("--mono-accent", accent || "#e31e24");
    });
  }

  function setPhoto(card, artist, imageUrl) {
    const fallback = shareSealAccent(artist?.accent) || "#e31e24";
    applyCardAccent(card, fallback);

    card.querySelectorAll('[data-field="artist_photo_url"]').forEach((photo) => {
      const initials = photo.querySelector(".photo-initials");
      if (initials) initials.textContent = artistInitials(artist?.name || artist?.username);
      photo.style.setProperty("--mono-accent", fallback);
      photo.style.background = "";

      let img = photo.querySelector("img");
      if (imageUrl) {
        if (!img) {
          img = document.createElement("img");
          img.alt = "";
          img.decoding = "async";
          img.crossOrigin = "anonymous";
          photo.appendChild(img);
        }
        const onReady = () => {
          const sampled = extractAccentFromImage(img, fallback);
          const accent = shareSealAccent(sampled) || fallback;
          applyCardAccent(card, accent);
          photo.style.setProperty("--mono-accent", accent);
        };
        img.addEventListener("load", onReady, { once: true });
        if (img.complete && img.naturalWidth > 0) onReady();
        img.src = imageUrl;
        photo.classList.add("has-image");
      } else {
        if (img) img.remove();
        photo.classList.remove("has-image");
      }
    });
  }

  function setClaimCta(card, artist) {
    const unclaimed = artist?.claimStatus !== "claimed";
    card.querySelectorAll('[data-field="claim_cta"]').forEach((el) => {
      el.hidden = !unclaimed;
      el.textContent = unclaimed ? " · Claim your rank →" : "";
    });
  }

  function applyCardAccent(card, accentHex) {
    const base = hexToRgb(accentHex) || { r: 227, g: 30, b: 36 };
    const soft = mixRgb(base, { r: 10, g: 10, b: 12 }, 0.72);
    const mid = mixRgb(base, { r: 10, g: 10, b: 12 }, 0.35);
    card.style.setProperty("--sc-accent", rgbToHex(mid));
    card.style.setProperty("--sc-accent-soft", rgbToHex(soft));
    card.style.setProperty("--sc-mono-accent", accentHex || "#e31e24");
  }

  function hexToRgb(hex) {
    const h = String(hex || "").replace("#", "").trim();
    if (h.length !== 3 && h.length !== 6) return null;
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = Number.parseInt(full, 16);
    if (Number.isNaN(n)) return null;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex({ r, g, b }) {
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return `#${[clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")}`;
  }

  function mixRgb(a, b, t) {
    return {
      r: a.r + (b.r - a.r) * t,
      g: a.g + (b.g - a.g) * t,
      b: a.b + (b.b - a.b) * t,
    };
  }

  function extractAccentFromImage(img, fallbackHex) {
    try {
      if (!img || !img.naturalWidth) return fallbackHex;
      const canvas = document.createElement("canvas");
      const size = 32;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return fallbackHex;
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 16) {
        const rr = data[i];
        const gg = data[i + 1];
        const bb = data[i + 2];
        const a = data[i + 3];
        if (a < 180) continue;
        const max = Math.max(rr, gg, bb);
        const min = Math.min(rr, gg, bb);
        if (max < 36 || max > 245) continue;
        if (max - min < 12) continue;
        r += rr;
        g += gg;
        b += bb;
        n += 1;
      }
      if (!n) return fallbackHex;
      return rgbToHex({ r: r / n, g: g / n, b: b / n });
    } catch {
      return fallbackHex;
    }
  }

  async function resolveArtistImage(artist) {
    const fromBridge = bridge().artistPhotoUrl?.(artist);
    if (fromBridge) return fromBridge;
    const fromArtist = proxyImageUrl(artist?.image || artist?.bannerImage || "");
    if (fromArtist) return fromArtist;
    if (typeof bridge().lookupArtistPhotoUrl === "function" && artist?.username) {
      try {
        return (await bridge().lookupArtistPhotoUrl(artist.username)) || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  function waitForImages(card) {
    const imgs = Array.from(card.querySelectorAll("img"));
    if (!imgs.length) return Promise.resolve();
    return Promise.all(
      imgs.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", () => {
              img.remove();
              img.parentElement?.classList.remove("has-image");
              done();
            }, { once: true });
            window.setTimeout(done, 2500);
          }),
      ),
    );
  }

  function prestigeSubline(artist) {
    return cityOnly(artist?.location) || "";
  }

  function buildChartLabels(template, artist, chartState, cityShort, heroRank) {
    const isCity = Boolean(String(chartState?.location || "").trim()) || template === "city";
    const city = cityShort || "City";
    const rankNum = heroRank != null && heroRank !== "" ? String(heroRank) : "—";
    const ranked = "Ranked";

    if (template === "city") {
      return {
        eyebrow: "Official",
        title: `${city} Top 50`,
        useBrandTitle: false,
        sub: "City Rankings",
        stamp: "City Ranking",
        citation: ranked,
        rankDisplay: `#${rankNum}`,
      };
    }
    if (template === "riser") {
      const tag = artist?.isNewEntry ? "New Entry" : "Biggest Riser";
      const chartRank = artist?.rank ?? rankNum;
      if (isCity) {
        return {
          eyebrow: "Official",
          title: tag,
          useBrandTitle: false,
          sub: `${city} Top 50`,
          stamp: "City Ranking",
          citation: ranked,
          rankDisplay: `#${chartRank}`,
        };
      }
      return {
        eyebrow: "Official",
        title: tag,
        useBrandTitle: false,
        sub: "Hiffi 500 Global",
        stamp: "Global Ranking",
        citation: ranked,
        rankDisplay: `#${chartRank}`,
      };
    }
    if (template === "verified") {
      if (isCity) {
        return {
          eyebrow: "Official",
          title: "Hiffi 500",
          useBrandTitle: true,
          sub: `Verified · ${city}`,
          stamp: "Verified",
          citation: ranked,
          rankDisplay: `#${rankNum}`,
        };
      }
      return {
        eyebrow: "Official",
        title: "Hiffi 500",
        useBrandTitle: true,
        sub: "Verified Artist",
        stamp: "Verified",
        citation: ranked,
        rankDisplay: `#${rankNum}`,
      };
    }
    return {
      eyebrow: "Official",
      title: "Hiffi 500",
      useBrandTitle: true,
      sub: "Global Rankings",
      stamp: "Global Ranking",
      citation: ranked,
      rankDisplay: `#${rankNum}`,
    };
  }

  function applyAwardTitle(card, chartLabels) {
    const titleEls = card.querySelectorAll(".kicker__title");
    titleEls.forEach((wrap) => {
      const brand = wrap.querySelector(".kicker__brand");
      const text = wrap.querySelector(".kicker__title-text") || wrap.querySelector('[data-field="award_title"]');
      const useBrand = Boolean(chartLabels.useBrandTitle);
      wrap.classList.toggle("is-brand", useBrand);
      if (brand) brand.hidden = !useBrand;
      if (text) {
        text.hidden = useBrand;
        text.textContent = chartLabels.title || "";
      }
    });
  }

  function bindShareCard(artist, options = {}) {
    const chartState = options.chartState || bridge().getChartState?.() || {};
    const template = options.template || shareTemplate || resolveShareCardTemplate(artist, chartState);
    const format = options.format || shareFormat || "square";
    shareTemplate = template;
    shareFormat = format;

    const cards = $$(".share-card", $("#shareCardScaler") || document);
    cards.forEach((card) => {
      const id = card.getAttribute("data-template");
      card.classList.toggle("is-active", id === template);
      card.classList.toggle("format-square", format === "square");
      card.classList.toggle("format-story", format === "story");
    });

    const card = $(`.share-card[data-template="${template}"]`, $("#shareCardScaler"));
    if (!card || !artist) return { template, format, card: null };

    const api = bridge();
    const move = api.movementMeta?.(artist) || {
      delta: 0,
      direction: "flat",
      symbol: "→",
      amount: 0,
      soft: true,
    };
    const cityLabel = api.chartScopeLabel?.() || "City";
    const cityShort = api.cityChipLabel?.(chartState.location) || cityLabel;
    const citySlugVal = api.citySlug?.(chartState.location) || "city";
    const globalRank = api.resolveGlobalRank?.(artist) ?? artist.globalRank ?? artist.rank;
    const weekTs = api.getRankingTimestamp?.() || Date.now();
    const weekLabel = `Week of ${formatWeekDate(weekTs)}`.toUpperCase();
    const releaseLabel = formatReleaseDate(weekTs);
    const slug = artistSlug(artist.username, artist.name);
    const accent = artist.accent || "#e31e24";

    const heroRank =
      template === "city" ? artist.rank : globalRank ?? artist.rank;
    const chartLabels = buildChartLabels(template, artist, chartState, cityShort, heroRank);
    const movementCaption = buildMovementCaption(artist, move);
    const displayName = artist.name || artist.username || "Artist";

    setField(card, "global_rank", String(globalRank ?? artist.rank ?? "—"));
    setField(card, "artist_name", displayName);
    fitArtistName(card, displayName);
    setField(card, "subline", prestigeSubline(artist));
    setField(card, "week_date", weekLabel);
    setField(card, "award_eyebrow", chartLabels.eyebrow);
    applyAwardTitle(card, chartLabels);
    setField(card, "award_sub", chartLabels.sub);
    setField(card, "citation", chartLabels.citation);
    setField(card, "rank_display", chartLabels.rankDisplay);
    setField(card, "rank_stamp", chartLabels.stamp);
    setField(card, "movement_caption", movementCaption);
    setField(card, "site_host", "hiffi.com");
    setField(card, "artist_slug", slug);
    setField(card, "release_date", releaseLabel);
    setField(card, "score_band", scoreBandLabel(artist.score));

    setField(card, "city_name", cityLabel);
    setField(card, "city_name_short", cityShort);
    setField(card, "city_rank", String(artist.rank ?? "—"));
    setField(card, "city_tag", `${cityShort} Top 50`);
    setField(card, "city_slug", citySlugVal);

    const deltaAbs = move.soft ? 0 : Math.abs(move.delta || 0);
    const deltaSign = move.direction === "down" ? "−" : "+";
    setField(card, "delta", String(deltaAbs || "—"));
    setField(
      card,
      "delta_signed",
      deltaAbs ? `${deltaSign}${deltaAbs}` : artist.isNewEntry ? "NEW" : "—",
    );
    setField(card, "movement_tag", artist.isNewEntry ? "New Entry" : "Biggest Riser");
    setField(card, "artist_handle", String(artist.username || "").replace(/^@+/, ""));

    const moveEl = card.querySelector('[data-field="movement_caption"]');
    if (moveEl) {
      moveEl.classList.toggle("is-up", move.direction === "up" && !move.soft && move.delta !== 0);
      moveEl.classList.toggle("is-down", move.direction === "down" && !move.soft && move.delta !== 0);
    }

    setMonogram(card, artist);
    setClaimCta(card, artist);
    fitRankDigits(card, heroRank);
    applyCardAccent(card, accent);

    // Measure after layout — critical for preview/PNG parity.
    requestAnimationFrame(() => {
      fitShareCardTypography(card);
      updateScalerSize();
    });

    updateScalerSize();
    syncChrome();

    return { template, format, card };
  }

  async function ensureShareFonts() {
    await document.fonts?.ready;
    try {
      await Promise.all([
        document.fonts?.load?.('400 92px "Archivo Black"'),
        document.fonts?.load?.('400 420px "Archivo Black"'),
        document.fonts?.load?.('400 64px "Archivo Black"'),
        document.fonts?.load?.('700 16px "JetBrains Mono"'),
        document.fonts?.load?.('500 13px "JetBrains Mono"'),
      ]);
    } catch {
      /* ignore */
    }
  }

  async function bindShareCardWithPhoto(artist, options = {}) {
    const result = bindShareCard(artist, options);
    if (!result.card) return result;
    const imageUrl = await resolveArtistImage(artist);
    setPhoto(result.card, artist, imageUrl);
    await ensureShareFonts();
    await waitForImages(result.card);
    fitShareCardTypography(result.card);
    schedulePreviewResize();
    return result;
  }

  function updateScalerSize() {
    const scaler = $("#shareCardScaler");
    const preview = $(".drawer-share-card-preview");
    const panel = $("#drawerSharePanel");
    if (!scaler || !preview) return;
    const h = shareFormat === "story" ? 1920 : 1080;

    // Prefer viewport/panel bounds — an unscaled 1080 child can inflate clientWidth.
    const viewportCap = Math.max(160, window.innerWidth - 28);
    const panelBox = panel && !panel.hidden ? panel.getBoundingClientRect() : null;
    const previewBox = preview.getBoundingClientRect();
    const pw = Math.max(
      0,
      Math.min(
        previewBox.width || viewportCap,
        panelBox && panelBox.width > 0 ? panelBox.width - 28 : viewportCap,
        viewportCap,
      ),
    );
    if (pw < 40) {
      schedulePreviewResize();
      return;
    }

    const maxH =
      shareFormat === "story"
        ? Math.min(window.innerHeight * 0.52, 460)
        : Math.min(window.innerHeight * 0.42, 340);
    const maxW = Math.max(120, pw - 12);
    let scale = Math.min(maxW / 1080, maxH / h);
    scale = Math.max(0.1, Math.min(scale, 1));

    const layoutW = 1080 * scale;
    const layoutH = h * scale;
    scaler.style.width = "1080px";
    scaler.style.height = `${h}px`;
    scaler.style.transformOrigin = "top left";
    scaler.style.transform = `scale(${scale})`;
    scaler.style.marginLeft = "0";
    scaler.style.marginRight = `${layoutW - 1080}px`;
    scaler.style.marginBottom = `${layoutH - h}px`;
    preview.style.height = `${Math.ceil(layoutH + 16)}px`;
    preview.style.maxHeight = "none";
  }

  function schedulePreviewResize() {
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => {
      updateScalerSize();
      requestAnimationFrame(updateScalerSize);
    }, 16);
  }

  function syncChrome() {
    $$("[data-share-format]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-share-format") === shareFormat);
    });
  }

  async function loadHtmlToImage() {
    if (htmlToImageMod) return htmlToImageMod;
    htmlToImageMod = await import("https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm");
    return htmlToImageMod;
  }

  async function captureActiveCard() {
    const card = $(".share-card.is-active", $("#shareCardScaler"));
    if (!card) throw new Error("No share card");
    const h = shareFormat === "story" ? 1920 : 1080;
    const scaler = $("#shareCardScaler");
    const preview = $(".drawer-share-card-preview");
    const mount = $("#shareCardCaptureMount");
    if (!scaler || !preview || !mount) throw new Error("Share card mount missing");

    const placeholder = document.createComment("share-card-scaler");
    preview.insertBefore(placeholder, scaler);
    mount.appendChild(scaler);
    const prevTransform = scaler.style.transform;
    const prevMargin = scaler.style.marginBottom;
    const prevMarginRight = scaler.style.marginRight;
    const prevOrigin = scaler.style.transformOrigin;
    const prevMountOpacity = mount.style.opacity;
    const prevMountLeft = mount.style.left;
    scaler.style.transform = "none";
    scaler.style.marginBottom = "0";
    scaler.style.marginRight = "0";
    scaler.style.transformOrigin = "top left";
    scaler.style.width = "1080px";
    scaler.style.height = `${h}px`;
    // Host is normally opacity:0 off-screen; html-to-image needs a real paint.
    mount.style.opacity = "1";
    mount.style.left = "-10000px";

    try {
      await ensureShareFonts();
      await waitForImages(card);
      // Re-measure at full (unscaled) size so PNG matches the preview fit.
      fitShareCardTypography(card);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const mod = await loadHtmlToImage();
      const blob = await mod.toBlob(card, {
        width: 1080,
        height: h,
        pixelRatio: 1,
        cacheBust: true,
        style: {
          transform: "none",
          margin: "0",
          opacity: "1",
        },
      });
      if (!blob) throw new Error("Capture failed");
      return blob;
    } finally {
      scaler.style.transform = prevTransform;
      scaler.style.marginBottom = prevMargin;
      scaler.style.marginRight = prevMarginRight;
      scaler.style.transformOrigin = prevOrigin;
      mount.style.opacity = prevMountOpacity;
      mount.style.left = prevMountLeft;
      placeholder.parentNode?.insertBefore(scaler, placeholder);
      placeholder.remove();
      updateScalerSize();
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function canShareFiles() {
    try {
      return (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        (!navigator.canShare ||
          navigator.canShare({
            files: [new File([new Blob(["x"], { type: "image/png" })], "t.png", { type: "image/png" })],
          }))
      );
    } catch {
      return typeof navigator !== "undefined" && typeof navigator.share === "function";
    }
  }

  function isMobileShareContext() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || "");
  }

  let preparedCard = null;

  function getPreparedCard() {
    return preparedCard;
  }

  function clearPreparedCard() {
    if (preparedCard?.url) URL.revokeObjectURL(preparedCard.url);
    preparedCard = null;
    const thumb = $("#drawerShareSheetThumb");
    if (thumb) thumb.innerHTML = "";
  }

  async function prepareShareCard(artist) {
    const result = await exportShareCard(artist, "prepare");
    return result;
  }

  async function exportShareCard(artist, mode) {
    if (capturing || !artist) return null;
    capturing = true;
    setActionsDisabled(true);
    try {
      const chartState = bridge().getChartState?.() || {};
      shareTemplate = resolveShareCardTemplate(artist, chartState);
      await bindShareCardWithPhoto(artist, {
        template: shareTemplate,
        format: shareFormat,
        chartState,
      });
      const blob = await captureActiveCard();
      const slug = artistSlug(artist.username, artist.name);
      const filename = `hiffi-500-${slug}-${shareFormat}.png`;
      const file = new File([blob], filename, { type: "image/png" });
      const payload = bridge().buildSharePayload?.(artist);
      const caption = payload?.text || payload?.headline || "";

      if (mode === "download") {
        downloadBlob(blob, filename);
        bridge().setShareStatus?.("Card downloaded");
        return { blob, file, caption, filename };
      }

      if (mode === "prepare") {
        clearPreparedCard();
        const url = URL.createObjectURL(blob);
        preparedCard = { blob, file, caption, filename, url, payload };
        return preparedCard;
      }

      if (mode === "share" || mode === "instagram") {
        if (canShareFiles()) {
          try {
            await navigator.share({
              files: [file],
              title: payload?.headline || "Hiffi 500",
              text: caption,
            });
            bridge().setShareStatus?.("Shared");
            return { blob, file, caption, filename };
          } catch (err) {
            const name = err && typeof err === "object" && "name" in err ? err.name : "";
            if (name === "AbortError") return null;
          }
        }

        downloadBlob(blob, filename);
        if (payload?.text) await bridge().copyText?.(payload.text);
        if (mode === "instagram") {
          if (!isMobileShareContext()) {
            window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
          }
          bridge().setShareStatus?.("Saved — paste in Instagram");
        } else {
          bridge().setShareStatus?.("Downloaded + caption copied");
        }
        return { blob, file, caption, filename };
      }

      return { blob, file, caption, filename };
    } catch (err) {
      console.error("[share-cards]", err);
      bridge().setShareStatus?.("Could not create card");
      return null;
    } finally {
      capturing = false;
      setActionsDisabled(false);
    }
  }

  async function shareViaNavigator(file, caption, title) {
    if (!canShareFiles()) return false;
    try {
      await navigator.share({
        files: [file],
        title: title || "Hiffi 500",
        text: caption || "",
      });
      bridge().setShareStatus?.("Shared");
      return true;
    } catch (err) {
      const name = err && typeof err === "object" && "name" in err ? err.name : "";
      if (name === "AbortError") return true; // user cancelled — treat as handled
      return false;
    }
  }

  async function sharePreparedCard(action) {
    const prepared = preparedCard;
    if (!prepared?.file) return false;
    const payload = prepared.payload;
    const caption = prepared.caption || "";
    const title = payload?.headline || "Hiffi 500";

    // WhatsApp, Instagram, More: always try Web Share with the PNG first
    if (
      action === "whatsapp" ||
      action === "instagram" ||
      action === "native" ||
      action === "share"
    ) {
      const shared = await shareViaNavigator(prepared.file, caption, title);
      if (shared) return true;

      // Fallback when Web Share / file share is unavailable (typical desktop)
      downloadBlob(prepared.blob, prepared.filename);
      if (caption) await bridge().copyText?.(caption);

      if (action === "whatsapp") {
        const safeHeadline = String(caption || "")
          .split("\n")[0]
          .replace(/#(\d+)/g, "No. $1")
          .replace(/#/g, "");
        const message = `${safeHeadline}\n${payload?.url || ""}`.trim();
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
        bridge().setShareStatus?.("Saved image — paste in WhatsApp");
        return true;
      }

      if (action === "instagram") {
        if (!isMobileShareContext()) {
          window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
        }
        bridge().setShareStatus?.("Saved — paste in Instagram");
        return true;
      }

      bridge().setShareStatus?.("Downloaded + caption copied");
      return true;
    }

    if (action === "snapchat") {
      const shared = await shareViaNavigator(prepared.file, caption, title);
      if (shared) return true;
      downloadBlob(prepared.blob, prepared.filename);
      if (caption) await bridge().copyText?.(caption);
      window.open(
        `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(payload?.url || "")}`,
        "_blank",
        "noopener,noreferrer",
      );
      bridge().setShareStatus?.("Saved — paste in Snapchat");
      return true;
    }

    return false;
  }

  function setActionsDisabled(disabled) {
    $$("[data-share-action='download-card'], [data-share-action='share-card']").forEach((btn) => {
      btn.disabled = Boolean(disabled);
    });
  }

  async function syncShareCardPanel(artist) {
    if (!artist) return;
    const chartState = bridge().getChartState?.() || {};
    shareTemplate = resolveShareCardTemplate(artist, chartState);
    await bindShareCardWithPhoto(artist, {
      template: shareTemplate,
      format: shareFormat,
      chartState,
    });
  }

  function resetShareCardSelection(artist) {
    const chartState = bridge().getChartState?.() || {};
    shareTemplate = resolveShareCardTemplate(artist, chartState);
    shareFormat = "square";
    clearPreparedCard();
  }

  function onFormatClick(format) {
    shareFormat = format === "story" ? "story" : "square";
    clearPreparedCard();
    bridge().setShareSheetOpen?.(false);
    const artist = bridge().getSelectedArtist?.();
    if (artist) {
      shareTemplate = resolveShareCardTemplate(artist, bridge().getChartState?.() || {});
      void bindShareCardWithPhoto(artist, { template: shareTemplate, format: shareFormat });
    } else syncChrome();
  }

  function initShareCards() {
    window.addEventListener("resize", () => {
      schedulePreviewResize();
    });
    const preview = $(".drawer-share-card-preview");
    if (preview && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => schedulePreviewResize());
      ro.observe(preview);
    }
  }

  global.HiffiShareCards = {
    initShareCards,
    syncShareCardPanel,
    resetShareCardSelection,
    exportShareCard,
    prepareShareCard,
    sharePreparedCard,
    getPreparedCard,
    clearPreparedCard,
    onFormatClick,
    resolveShareCardTemplate,
    refreshPreviewSize: schedulePreviewResize,
    getFormat: () => shareFormat,
    getTemplate: () => shareTemplate,
  };
})(typeof window !== "undefined" ? window : globalThis);
