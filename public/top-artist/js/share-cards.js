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
    if (!raw || typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("/proxy/")) return trimmed;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      // External absolute URLs risk tainting canvas — skip unless same-origin proxy path.
      try {
        const u = new URL(trimmed, window.location.origin);
        if (u.origin === window.location.origin && u.pathname.startsWith("/proxy/")) {
          return u.pathname + u.search;
        }
      } catch {
        /* ignore */
      }
      return null;
    }
    const clean = trimmed.replace(/^\//, "");
    return `/proxy/profile-picture/${clean}`;
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
      el.classList.toggle("is-long", len > 14 && len <= 18);
      el.classList.toggle("is-xl", len > 18);
    });
  }

  function setPhoto(card, artist, imageUrl) {
    card.querySelectorAll('[data-field="artist_photo_url"]').forEach((photo) => {
      const initials = photo.querySelector(".photo-initials");
      if (initials) initials.textContent = artistInitials(artist.name);
      const accent = artist.accent || "#e31e24";
      photo.style.background = `linear-gradient(160deg, ${accent}88, #141215)`;

      let img = photo.querySelector("img");
      if (imageUrl) {
        if (!img) {
          img = document.createElement("img");
          img.alt = "";
          img.decoding = "async";
          img.crossOrigin = "anonymous";
          photo.appendChild(img);
        }
        img.src = imageUrl;
        photo.classList.add("has-image");
      } else {
        if (img) img.remove();
        photo.classList.remove("has-image");
      }
    });
  }

  async function resolveArtistImage(artist) {
    const fromArtist = proxyImageUrl(artist?.image || artist?.bannerImage || "");
    if (fromArtist) return fromArtist;
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
    const weekLabel = `Week of ${formatWeekDate(weekTs)}`;
    const releaseLabel = formatReleaseDate(weekTs);
    const slug = artistSlug(artist.username, artist.name);

    const movementText =
      move.soft || move.delta === 0
        ? "—"
        : `${move.symbol} ${move.amount}`;

    setField(card, "global_rank", String(globalRank ?? artist.rank ?? "—"));
    const displayName = artist.name || artist.username || "Artist";
    setField(card, "artist_name", displayName);
    fitArtistName(card, displayName);
    setField(card, "movement_7d", movementText);
    setField(card, "week_date", weekLabel);
    setField(card, "score_band", scoreBandLabel(artist.score));
    setField(card, "artist_slug", slug);
    setField(card, "release_date", releaseLabel);

    setField(card, "city_name", cityLabel);
    setField(card, "city_name_short", cityShort);
    setField(card, "city_rank", String(artist.rank ?? "—"));
    setField(card, "city_tag", `${cityShort} Top 50`);
    setField(card, "city_slug", citySlugVal);

    const fromRank =
      artist.previousRank != null
        ? artist.previousRank
        : move.delta != null && !move.soft
          ? artist.rank + move.delta
          : null;
    const deltaAbs = move.soft ? 0 : Math.abs(move.delta || 0);
    setField(
      card,
      "movement_eyebrow",
      artist.isNewEntry ? "Hiffi 500 · New Entry" : "Hiffi 500 · Biggest Risers",
    );
    setField(card, "delta", String(deltaAbs || "—"));
    setField(card, "movement_tag", artist.isNewEntry ? "New Entry" : "Biggest Riser");
    setField(card, "rank_from", fromRank != null ? `#${fromRank}` : "—");
    setField(card, "rank_to", `#${artist.rank}`);

    setField(card, "artist_handle", String(artist.username || "").replace(/^@+/, ""));
    setField(card, "verified_date", formatVerifiedDate(weekTs));
    const rankContext = chartState.location
      ? `Global #${globalRank ?? "—"} · ${cityShort} #${artist.rank}`
      : `Global #${globalRank ?? artist.rank}`;
    setField(card, "rank_context", rankContext);

    const deltaWrap = card.querySelector(".arrow-big .delta");
    if (deltaWrap) {
      const sign = move.direction === "down" ? "−" : "+";
      deltaWrap.innerHTML = `${sign}<span data-field="delta">${deltaAbs || "—"}</span>`;
      deltaWrap.style.color = move.direction === "down" ? "#ff5b60" : "#4cd97b";
    }
    const rankTo = card.querySelector('[data-field="rank_to"]');
    if (rankTo) {
      rankTo.classList.toggle("up", move.direction === "up" || artist.isNewEntry);
      rankTo.classList.toggle("down", move.direction === "down");
    }

    updateScalerSize();
    syncChrome();

    return { template, format, card };
  }

  async function bindShareCardWithPhoto(artist, options = {}) {
    const result = bindShareCard(artist, options);
    if (!result.card) return result;
    const imageUrl = await resolveArtistImage(artist);
    setPhoto(result.card, artist, imageUrl);
    await waitForImages(result.card);
    await document.fonts?.ready;
    schedulePreviewResize();
    return result;
  }

  function updateScalerSize() {
    const scaler = $("#shareCardScaler");
    const preview = $(".drawer-share-card-preview");
    if (!scaler || !preview) return;
    const h = shareFormat === "story" ? 1920 : 1080;
    const pw = preview.clientWidth;
    const ph = preview.clientHeight;
    // Hidden / not laid out yet — retry after paint
    if (pw < 40) {
      schedulePreviewResize();
      return;
    }
    // Square: fill preview width. Story: also fit height so it stays inside max-height.
    const maxW = Math.max(120, pw - 20);
    let scale = maxW / 1080;
    if (shareFormat === "story" && ph > 40) {
      scale = Math.min(scale, Math.max(120, ph - 16) / h);
    }
    scaler.style.width = "1080px";
    scaler.style.height = `${h}px`;
    scaler.style.transform = `scale(${scale})`;
    scaler.style.marginBottom = `${h * scale - h}px`;
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
    const prevMountOpacity = mount.style.opacity;
    const prevMountLeft = mount.style.left;
    scaler.style.transform = "none";
    scaler.style.marginBottom = "0";
    scaler.style.width = "1080px";
    scaler.style.height = `${h}px`;
    // Host is normally opacity:0 off-screen; html-to-image needs a real paint.
    mount.style.opacity = "1";
    mount.style.left = "-10000px";

    try {
      await document.fonts?.ready;
      try {
        await document.fonts?.load?.('900 64px Anton');
        await document.fonts?.load?.('700 18px "Space Mono"');
      } catch {
        /* ignore font load errors */
      }
      await waitForImages(card);
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
