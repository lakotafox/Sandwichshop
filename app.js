/*
 * The Government Is Corrupt — client for the Archive Genocide open API.
 * API guide and terms: https://archivegenocide.com/api-docs/
 *
 * Everything is fetched live in the visitor's browser; nothing is stored on
 * this site. Captions and links come from third parties, so all of them are
 * written to the page as text (never as HTML) and only http(s) links are used.
 */
(() => {
  "use strict";

  const API = "https://api.archivegenocide.com/v1";
  const GRID_PER_PAGE = 24;
  const MAP_PER_PAGE = 100;
  const DEEP_LIMIT = 10000; // the API reads a single search at most this deep
  const STORE = { gate: "tgic-cw-ack", unblur: "tgic-unblur" };

  const PRECISION = {
    1: "Town / area",
    2: "Neighbourhood",
    3: "Building",
  };
  const precisionLabel = (lvl) => (lvl >= 4 ? "Exact site" : PRECISION[lvl] || "Area");

  // ---------- small helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const el = (tag, props = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "dataset") Object.assign(node.dataset, v);
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children) if (c != null) node.append(c);
    return node;
  };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode etc. */ } },
  };
  const safeUrl = (u) => {
    if (typeof u !== "string" || !u) return null;
    try {
      const url = new URL(u);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch { return null; }
  };
  const nf = new Intl.NumberFormat("en-US");
  const df = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  // Dates are shown as the source posted them, in the source's own time zone.
  const fmtDate = (iso) => {
    if (typeof iso !== "string" || iso.length < 10) return "Unknown date";
    const d = new Date(iso.slice(0, 10) + "T00:00:00Z");
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
    const time = iso.length >= 16 ? " · " + iso.slice(11, 16) : "";
    return df.format(d) + time;
  };

  // ---------- state (mirrors the address bar so searches can be shared) ----------
  const FILTER_KEYS = ["q", "type", "from", "to", "archive", "has_geo", "sort"];
  const state = { page: 1, view: "grid" };

  function readUrl() {
    const p = new URLSearchParams(location.search);
    for (const k of FILTER_KEYS) state[k] = p.get(k) || "";
    state.page = Math.max(1, parseInt(p.get("page"), 10) || 1);
    state.view = p.get("view") === "map" ? "map" : "grid";
    state.clip = p.get("clip") || "";
  }

  function writeUrl(push) {
    const p = new URLSearchParams();
    for (const k of FILTER_KEYS) if (state[k]) p.set(k, state[k]);
    if (state.page > 1) p.set("page", state.page);
    if (state.view === "map") p.set("view", "map");
    if (state.clip) p.set("clip", state.clip);
    const qs = p.toString();
    const url = location.pathname + (qs ? "?" + qs : "") + location.hash;
    history[push ? "pushState" : "replaceState"](null, "", url);
  }

  function syncForm() {
    $("#q").value = state.q;
    $("#f-type").value = state.type;
    $("#f-from").value = state.from;
    $("#f-to").value = state.to;
    $("#f-archive").value = state.archive;
    $("#f-geo").value = state.has_geo;
    $("#f-sort").value = state.sort || "-date";
    if (state.type || state.from || state.to || state.archive || state.has_geo || state.sort) $("#filters").open = true;
    document.querySelectorAll(".segmented button").forEach((b) => {
      const on = b.dataset.view === state.view;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  function readForm() {
    state.q = $("#q").value.trim().slice(0, 200);
    state.type = $("#f-type").value;
    state.from = $("#f-from").value;
    state.to = $("#f-to").value;
    state.archive = $("#f-archive").value;
    state.has_geo = $("#f-geo").value;
    state.sort = $("#f-sort").value === "-date" ? "" : $("#f-sort").value;
  }

  // ---------- API ----------
  let inflight = null;

  async function api(path, params, signal) {
    const url = new URL(API + path);
    if (params) for (const [k, v] of Object.entries(params)) if (v !== "" && v != null) url.searchParams.set(k, v);
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    let body = null;
    try { body = await res.json(); } catch { /* non-JSON error */ }
    if (!res.ok) {
      const err = new Error((body && body.error) || `The archive answered ${res.status}.`);
      err.status = res.status;
      err.retryAfter = parseInt(res.headers.get("Retry-After"), 10) || null;
      throw err;
    }
    return body;
  }

  function friendlyError(err) {
    if (err.status === 429) {
      const s = err.retryAfter ? ` Please wait ${err.retryAfter} seconds and try again.` : " Please wait a moment and try again.";
      return "Too many searches in a short time." + s;
    }
    if (err.status === 503) return "The archive is busy right now. Please try again in a few seconds.";
    if (err.status === 410) return "This clip has been withdrawn from the archive.";
    if (err.status === 404) return "That clip could not be found.";
    if (err.status === 400) return err.message + " Try narrowing the search with a date range or more words.";
    if (err.name === "TypeError") return "Could not reach the archive. Check your connection and try again.";
    return err.message || "Something went wrong.";
  }

  // ---------- stats + source list ----------
  async function loadMeta() {
    try {
      const [meta, archives] = await Promise.all([api("/meta"), api("/archives")]);
      $("#stat-clips").textContent = nf.format(meta.clips);
      $("#stat-geo").textContent = nf.format(meta.clips_with_location);
      if (meta.built_utc) $("#stat-built").textContent = df.format(new Date(meta.built_utc));
      const list = (archives && archives.archives) || [];
      $("#stat-sources").textContent = nf.format(list.length);
      const sel = $("#f-archive");
      list
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((a) => sel.append(el("option", { value: a.name, text: `${a.name} (${nf.format(a.clips)})` })));
      if (state.archive) sel.value = state.archive;
    } catch {
      /* stats are decorative; the search still works without them */
    }
  }

  // ---------- results ----------
  const cache = new Map();

  function showSkeletons() {
    const grid = $("#results");
    grid.replaceChildren(...Array.from({ length: 8 }, () => el("div", { class: "skeleton", "aria-hidden": "true" })));
    grid.setAttribute("aria-busy", "true");
  }

  async function search({ push = false, scroll = false } = {}) {
    if (state.from && state.to && state.from > state.to) {
      showError("The “From” date is after the “To” date.");
      return;
    }
    writeUrl(push);
    if (inflight) inflight.abort();
    inflight = new AbortController();
    const { signal } = inflight;

    const isMap = state.view === "map";
    const perPage = isMap ? MAP_PER_PAGE : GRID_PER_PAGE;
    const maxPage = Math.ceil(DEEP_LIMIT / perPage);
    if (state.page > maxPage) state.page = maxPage;

    hide("#error"); hide("#empty");
    $("#result-count").textContent = "Searching…";
    if (!isMap) showSkeletons();

    try {
      const data = await api("/clips", {
        q: state.q,
        type: state.type,
        from: state.from,
        to: state.to,
        archive: state.archive,
        has_geo: isMap ? "1" : state.has_geo,
        sort: state.sort,
        page: state.page,
        per_page: perPage,
      }, signal);

      for (const c of data.results) cache.set(String(c.id), c);
      renderCount(data, isMap);
      if (isMap) renderMap(data.results); else renderGrid(data.results);
      renderPager(data, maxPage);
      if (!data.results.length) show("#empty");
      if (scroll) $("#search").scrollIntoView({ block: "start" });
    } catch (err) {
      if (err.name === "AbortError") return;
      $("#results").replaceChildren();
      hide("#pager");
      $("#result-count").textContent = "";
      showError(friendlyError(err));
    } finally {
      $("#results").setAttribute("aria-busy", "false");
    }
  }

  function renderCount(data, isMap) {
    const total = data.total_is_lower_bound ? nf.format(data.total) + "+" : nf.format(data.total);
    const noun = isMap ? "located clips" : "clips";
    let text = data.total === 0 ? "No clips found" : `${total} ${noun}`;
    if (state.q) text += ` matching “${state.q}”`;
    if (data.total_is_lower_bound) text += " · narrow by date to reach past the first 10,000";
    $("#result-count").textContent = text;
  }

  function renderGrid(results) {
    const grid = $("#results");
    grid.replaceChildren(...results.map(card));
  }

  function card(c) {
    const thumb = safeUrl(c.thumbnail_url);
    const badge = c.type === "video" ? `▶ ${c.duration || "Video"}` : "Photo";
    const meta = el("div", { class: "clip__meta" },
      el("span", { text: fmtDate(c.date) }),
      c.confidence ? el("span", { class: `pill pill--${c.confidence}`, text: c.confidence, title: "Archive review status" }) : null,
      c.geo ? el("span", { class: "pill pill--geo", text: "📍 " + precisionLabel(c.geo.precision_level) }) : null,
    );
    return el("button", {
      class: "clip", type: "button",
      "aria-label": `Open clip from ${fmtDate(c.date)}`,
      onclick: () => openClip(c),
    },
      el("div", { class: "thumb" },
        thumb
          ? el("img", { src: thumb, alt: "", loading: "lazy", decoding: "async", referrerpolicy: "no-referrer" })
          : el("div", { class: "thumb__noimg", text: "No preview" }),
        el("span", { class: "thumb__badge", text: badge }),
      ),
      el("div", { class: "clip__body" },
        meta,
        el("p", { class: "clip__caption", dir: "auto", text: (c.caption || "No caption").trim() }),
        el("div", { class: "clip__source", text: c.source_archive || "" }),
      ),
    );
  }

  function renderPager(data, maxPage) {
    const pages = Math.min(data.pages || 1, maxPage);
    if (pages <= 1) { hide("#pager"); return; }
    show("#pager");
    const newestFirst = !state.sort || state.sort === "-date";
    $("#prev").textContent = newestFirst ? "← Newer" : "← Earlier";
    $("#next").textContent = newestFirst ? "Older →" : "Later →";
    $("#prev").disabled = state.page <= 1;
    $("#next").disabled = state.page >= pages;
    $("#page-info").textContent = `Page ${nf.format(state.page)} of ${nf.format(pages)}${data.total_is_lower_bound ? "+" : ""}`;
  }

  function showError(msg) { const e = $("#error"); e.textContent = msg; show("#error"); }
  function show(sel) { $(sel).hidden = false; }
  function hide(sel) { $(sel).hidden = true; }

  // ---------- map ----------
  let map = null;
  let layer = null;

  function ensureMap() {
    if (map || !window.L) return map;
    map = L.map("map", { scrollWheelZoom: false, worldCopyJump: true }).setView([31.42, 34.38], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Records: <a href="https://archivegenocide.com/">Archive Genocide</a>',
    }).addTo(map);
    layer = L.layerGroup().addTo(map);
    return map;
  }

  function renderMap(results) {
    $("#results").replaceChildren();
    if (!ensureMap()) { showError("The map could not load. Try the grid view."); return; }
    layer.clearLayers();
    const pts = [];
    for (const c of results) {
      const g = c.geo;
      if (!g || typeof g.lat !== "number" || typeof g.lon !== "number") continue;
      const exact = g.exact === true;
      const marker = L.circleMarker([g.lat, g.lon], {
        radius: exact ? 7 : 6,
        color: exact ? "#ffffff" : "#c8102e",
        weight: exact ? 2 : 1,
        fillColor: "#c8102e",
        fillOpacity: exact ? .95 : .55,
      });
      const pop = el("div", {},
        el("strong", { text: fmtDate(c.date) }),
        el("div", { text: `${c.type === "video" ? "Video" : "Photo"} · ${precisionLabel(g.precision_level)}${exact ? "" : " (area)"}` }),
        el("div", { class: "popup__cap", dir: "auto", text: (c.caption || "").trim().slice(0, 280) }),
        el("button", { type: "button", text: "Open clip", onclick: () => openClip(c) }),
      );
      marker.bindPopup(pop, { maxWidth: 280 });
      marker.addTo(layer);
      pts.push([g.lat, g.lon]);
    }
    setTimeout(() => {
      map.invalidateSize();
      if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 14 });
    }, 0);
  }

  function setView(view) {
    if (state.view === view) return;
    state.view = view;
    state.page = 1;
    applyView();
    syncForm();
    search({ push: true });
  }

  function applyView() {
    const isMap = state.view === "map";
    $("#map").hidden = !isMap;
    $("#map-note").hidden = !isMap;
    $("#results").hidden = isMap;
  }

  // ---------- clip detail ----------
  const modal = $("#modal");

  function openClip(c) {
    if (window.L && map) map.closePopup();
    state.clip = String(c.id);
    writeUrl(false);
    fillModal(c);
    if (!modal.open) modal.showModal();
  }

  function closeClip() {
    const media = $("#modal-media");
    media.querySelectorAll("video").forEach((v) => v.pause());
    media.replaceChildren();
    if (modal.open) modal.close();
    if (state.clip) { state.clip = ""; writeUrl(false); }
  }

  function mediaNode(c) {
    const src = safeUrl(c.media_url);
    const poster = safeUrl(c.thumbnail_url);
    if (!src) return el("div", { class: "modal__reveal", text: "The footage is not available here. Use the archive link." });
    return c.type === "video"
      ? el("video", { src, poster: document.body.classList.contains("unblur") ? poster : null, controls: true, preload: "metadata", playsinline: true })
      : el("img", { src, alt: (c.caption || "").slice(0, 140), referrerpolicy: "no-referrer" });
  }

  function fillModal(c) {
    const media = $("#modal-media");
    if (document.body.classList.contains("unblur")) {
      media.replaceChildren(mediaNode(c));
    } else {
      media.replaceChildren(el("div", { class: "modal__reveal" },
        el("p", { text: c.type === "video" ? "Graphic video. It loads only when you choose." : "Graphic image. It loads only when you choose." }),
        el("button", { class: "btn btn--primary", type: "button", text: c.type === "video" ? "Show video" : "Show image",
          onclick: () => media.replaceChildren(mediaNode(c)) }),
      ));
    }

    $("#modal-meta").textContent = `${c.type === "video" ? "Video" : "Photo"}${c.duration ? " · " + c.duration : ""} · ${fmtDate(c.date)}`;
    $("#modal-caption").textContent = (c.caption || "No caption").trim();

    const orig = (c.caption_original || "").trim();
    const wrap = $("#modal-original-wrap");
    wrap.open = false;
    if (orig && orig !== (c.caption || "").trim()) {
      $("#modal-original").textContent = orig;
      wrap.hidden = false;
    } else {
      wrap.hidden = true;
    }

    const facts = [
      ["Posted", fmtDate(c.date)],
      ["Source", c.source_archive || "Unknown"],
      ["Review", c.confidence || "—"],
    ];
    if (c.geo) {
      facts.push(["Location", `${precisionLabel(c.geo.precision_level)}${c.geo.exact ? "" : " (approximate)"}`]);
      facts.push(["Coordinates", `${c.geo.lat.toFixed(5)}, ${c.geo.lon.toFixed(5)}`]);
    }
    if (c.duplicate_of) facts.push(["Duplicate of", `Clip ${c.duplicate_of}`]);
    facts.push(["Archive ID", String(c.id)]);
    $("#modal-facts").replaceChildren(...facts.flatMap(([k, v]) => [el("dt", { text: k }), el("dd", { text: v })]));

    const links = [];
    const page = safeUrl(c.page_url);
    const post = safeUrl(c.source_post);
    if (page) links.push(el("a", { class: "btn btn--primary btn--sm", href: page, target: "_blank", rel: "noopener", text: "View on Archive Genocide ↗" }));
    if (post) links.push(el("a", { class: "btn btn--ghost btn--sm", href: post, target: "_blank", rel: "noopener nofollow", text: "Original post ↗" }));
    if (c.geo) links.push(el("a", { class: "btn btn--ghost btn--sm", target: "_blank", rel: "noopener",
      href: `https://www.openstreetmap.org/?mlat=${c.geo.lat}&mlon=${c.geo.lon}#map=16/${c.geo.lat}/${c.geo.lon}`, text: "Open in map ↗" }));
    links.push(el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Copy link", onclick: (e) => copyLink(e.currentTarget) }));
    $("#modal-links").replaceChildren(...links);
  }

  async function copyLink(btn) {
    try {
      await navigator.clipboard.writeText(location.href);
      btn.textContent = "Copied";
    } catch {
      btn.textContent = "Copy failed";
    }
    setTimeout(() => { btn.textContent = "Copy link"; }, 1600);
  }

  async function openClipById(id) {
    if (!/^\d+$/.test(id)) return;
    if (cache.has(id)) { openClip(cache.get(id)); return; }
    try {
      const c = await api(`/clips/${id}`);
      cache.set(id, c);
      openClip(c);
    } catch (err) {
      state.clip = "";
      writeUrl(false);
      showError(friendlyError(err));
    }
  }

  // ---------- content warning + blur ----------
  function initGate() {
    const gate = $("#gate");
    if (store.get(STORE.gate) === "1") return;
    gate.hidden = false;
    document.body.classList.add("is-locked");
    $("#gate-continue").focus();
    $("#gate-continue").addEventListener("click", () => {
      store.set(STORE.gate, "1");
      gate.hidden = true;
      document.body.classList.remove("is-locked");
      $("#q").focus({ preventScroll: true });
    });
  }

  function initBlur() {
    const box = $("#unblur");
    const on = store.get(STORE.unblur) === "1";
    box.checked = on;
    document.body.classList.toggle("unblur", on);
    box.addEventListener("change", () => {
      document.body.classList.toggle("unblur", box.checked);
      store.set(STORE.unblur, box.checked ? "1" : "0");
    });
  }

  // ---------- wiring ----------
  function init() {
    readUrl();
    syncForm();
    applyView();
    initGate();
    initBlur();
    loadMeta();

    $("#search-form").addEventListener("submit", (e) => {
      e.preventDefault();
      readForm();
      state.page = 1;
      search({ push: true });
    });

    ["#f-type", "#f-from", "#f-to", "#f-archive", "#f-geo", "#f-sort"].forEach((sel) =>
      $(sel).addEventListener("change", () => { readForm(); state.page = 1; search({ push: true }); }));

    $("#f-reset").addEventListener("click", () => {
      ["#f-type", "#f-from", "#f-to", "#f-archive", "#f-geo"].forEach((s) => { $(s).value = ""; });
      $("#f-sort").value = "-date";
      readForm();
      state.page = 1;
      search({ push: true });
    });

    document.querySelectorAll(".segmented button").forEach((b) =>
      b.addEventListener("click", () => setView(b.dataset.view)));

    $("#prev").addEventListener("click", () => { state.page = Math.max(1, state.page - 1); search({ push: true, scroll: true }); });
    $("#next").addEventListener("click", () => { state.page += 1; search({ push: true, scroll: true }); });

    $("#modal-close").addEventListener("click", closeClip);
    modal.addEventListener("close", closeClip);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeClip(); });

    window.addEventListener("popstate", () => {
      const clip = new URLSearchParams(location.search).get("clip");
      readUrl();
      syncForm();
      applyView();
      if (modal.open && !clip) { modal.close(); }
      search();
    });

    search();
    if (state.clip) openClipById(state.clip);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
