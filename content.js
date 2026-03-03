(() => {
  'use strict';

  // ── Context guard ──────────────────────────────────────────────────────────
  function isContextAlive() {
    try { return !!chrome.runtime?.id; } catch (_) { return false; }
  }
  function storageGet(keys, cb) {
    if (!isContextAlive()) return;
    try { chrome.storage.local.get(keys, cb); } catch (_) {}
  }
  function storageSet(obj) {
    if (!isContextAlive()) return;
    try { chrome.storage.local.set(obj); } catch (_) {}
  }

  // ── Page helpers ───────────────────────────────────────────────────────────
  function isShorts() { return location.pathname.startsWith('/shorts'); }
  function getMaxZoom() { return isShorts() ? 4.0 : 9.0; }

  // Both shorts AND watch use: video.video-stream.html5-main-video
  // We just grab whichever one has a src right now.
  function getVideoEl() {
    // Exact class match first — covers both pages per the provided HTML
    const exact = document.querySelector('video.video-stream.html5-main-video');
    if (exact) return exact;
    // Fallback: any playing video
    const all = Array.from(document.querySelectorAll('video'));
    return all.find(v => v.src || v.currentSrc) || all[0] || null;
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let targetZoom  = 1.0;
  let currentZoom = 1.0;
  let panX = 0, panY = 0;
  let hideTimer   = null;
  let initialized = false;
  let destroyed   = false;
  let zoomRafId   = null;
  let panRafPend  = false;
  let pendingDX = 0, pendingDY = 0;
  let isDragging  = false;
  let dragStartX = 0, dragStartY = 0, panStartX = 0, panStartY = 0;

  const STEP = 0.25;
  const LERP = 0.11;

  // ── Destroy ────────────────────────────────────────────────────────────────
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (zoomRafId) { cancelAnimationFrame(zoomRafId); zoomRafId = null; }
    clearTimeout(hideTimer);
    document.removeEventListener('keydown',   onKeyDown,   true);
    document.removeEventListener('mousedown', onMouseDown, true);
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('mouseup',   onMouseUp,   true);
    window.removeEventListener('blur', onMouseUp);
    window.removeEventListener('beforeunload', onUnload);
    if (mo) { try { mo.disconnect(); } catch (_) {} }
    try { const h = document.getElementById('hvs-zoom-hud'); if (h) h.remove(); } catch (_) {}
    try {
      const v = getVideoEl();
      if (v) { v.style.transform = ''; v.style.transformOrigin = ''; v.style.willChange = ''; }
    } catch (_) {}
    try { document.body.style.cursor = ''; document.body.style.userSelect = ''; } catch (_) {}
  }

  // ── Transform — applied directly to <video> only ──────────────────────────
  function commitTransform(scale) {
    if (destroyed) return;
    try {
      const v = getVideoEl();
      if (!v) return;
      const vw = v.offsetWidth  || v.clientWidth  || 640;
      const vh = v.offsetHeight || v.clientHeight || 360;
      const maxX = (vw * (scale - 1)) / 2;
      const maxY = (vh * (scale - 1)) / 2;
      panX = Math.max(-maxX, Math.min(maxX, panX));
      panY = Math.max(-maxY, Math.min(maxY, panY));
      v.style.transition      = 'none';
      v.style.transformOrigin = 'center center';
      v.style.transform       = (scale === 1 && panX === 0 && panY === 0)
        ? '' : `scale(${scale}) translate(${panX / scale}px, ${panY / scale}px)`;
      v.style.willChange = scale !== 1 ? 'transform' : '';
      syncHUD(scale);
    } catch (_) {}
  }

  // ── Zoom lerp RAF ──────────────────────────────────────────────────────────
  function tickZoom() {
    if (destroyed || !isContextAlive()) { destroy(); return; }
    const diff = targetZoom - currentZoom;
    if (Math.abs(diff) < 0.0005) {
      currentZoom = targetZoom;
      commitTransform(currentZoom);
      zoomRafId = null;
      return;
    }
    currentZoom += diff * LERP;
    commitTransform(currentZoom);
    zoomRafId = requestAnimationFrame(tickZoom);
  }

  function kickZoom() {
    if (destroyed) return;
    if (zoomRafId) cancelAnimationFrame(zoomRafId);
    zoomRafId = requestAnimationFrame(tickZoom);
  }

  // ── Pan RAF ────────────────────────────────────────────────────────────────
  function flushPan() {
    if (destroyed) return;
    panRafPend = false;
    panX += pendingDX; panY += pendingDY;
    pendingDX = 0; pendingDY = 0;
    commitTransform(currentZoom);
  }

  function schedulePan(dx, dy) {
    if (destroyed) return;
    pendingDX += dx; pendingDY += dy;
    if (!panRafPend) { panRafPend = true; requestAnimationFrame(flushPan); }
  }

  // ── Zoom actions ───────────────────────────────────────────────────────────
  function clamp(v) { return Math.max(1.0, Math.min(getMaxZoom(), v)); }

  function zoomIn() {
    if (destroyed) return;
    targetZoom = clamp(parseFloat((targetZoom + STEP).toFixed(4)));
    kickZoom(); flashHUD(); pulseStep('up');
  }

  function zoomOut() {
    if (destroyed) return;
    targetZoom = clamp(parseFloat((targetZoom - STEP).toFixed(4)));
    if (targetZoom <= 1.0) { targetZoom = 1.0; panX = 0; panY = 0; }
    kickZoom(); flashHUD(); pulseStep('down');
  }

  // ── Keyboard ───────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (destroyed) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (['input','textarea','select'].includes(tag)) return;
    if (e.key === 'u' || e.key === 'U') { e.preventDefault(); zoomIn();  }
    if (e.key === 'y' || e.key === 'Y') { e.preventDefault(); zoomOut(); }
  }

  // ── Ctrl+drag pan ─────────────────────────────────────────────────────────
  function onMouseDown(e) {
    if (destroyed || !e.ctrlKey || currentZoom <= 1.005 || e.button !== 0) return;
    const v = getVideoEl();
    if (!v) return;
    const rect = v.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top  || e.clientY > rect.bottom) return;
    isDragging = true;
    dragStartX = e.clientX; dragStartY = e.clientY;
    panStartX  = panX;      panStartY  = panY;
    pendingDX  = 0;         pendingDY  = 0;
    e.preventDefault();
    e.stopPropagation();
    try { document.body.style.cursor = 'grabbing'; document.body.style.userSelect = 'none'; } catch (_) {}
  }

  function onMouseMove(e) {
    if (destroyed || !isDragging) return;
    const v   = getVideoEl();
    const vw  = v ? (v.offsetWidth  || 640) : 640;
    const vh  = v ? (v.offsetHeight || 360) : 360;
    const maxX = (vw * (currentZoom - 1)) / 2;
    const maxY = (vh * (currentZoom - 1)) / 2;
    const cx = Math.max(-maxX, Math.min(maxX, panStartX + (e.clientX - dragStartX)));
    const cy = Math.max(-maxY, Math.min(maxY, panStartY + (e.clientY - dragStartY)));
    const dx = cx - panX, dy = cy - panY;
    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) schedulePan(dx, dy);
  }

  function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    try { document.body.style.cursor = ''; document.body.style.userSelect = ''; } catch (_) {}
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  let overlay = null;

  function createHUD() {
    if (destroyed) return;
    try {
      if (document.getElementById('hvs-zoom-hud')) return;
      overlay = document.createElement('div');
      overlay.id = 'hvs-zoom-hud';
      const shorts = isShorts();
      overlay.innerHTML = `
        <div class="hvs-glass">
          <div class="hvs-header">
            <span class="hvs-hex">⬡</span>
            <span class="hvs-brand">HVS Zoom${shorts ? ' · Shorts' : ''}</span>
          </div>
          <div class="hvs-value-row">
            <div class="hvs-arrow" id="hvs-btn-down">
              <svg viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="hvs-value" id="hvs-zoom-val">1.00×</div>
            <div class="hvs-arrow" id="hvs-btn-up">
              <svg viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
          <div class="hvs-bar-wrap">
            <div class="hvs-bar-track">
              <div class="hvs-bar-fill" id="hvs-fill"></div>
            </div>
          </div>
          <div class="hvs-bar-labels">
            <span>1×</span>
            <span id="hvs-bar-cur">1.00×</span>
            <span>${shorts ? '4×' : '9×'}</span>
          </div>
          <div class="hvs-chips">
            <div class="hvs-chip"><kbd>U</kbd><span>In</span></div>
            <div class="hvs-chip"><kbd>Y</kbd><span>Out</span></div>
            <div class="hvs-chip hvs-pan-chip"><kbd>Ctrl</kbd><span>+Drag Pan</span></div>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      syncHUD(currentZoom);
    } catch (_) {}
  }

  let lastHUD = -1;
  function syncHUD(scale) {
    if (destroyed) return;
    try {
      if (Math.abs(scale - lastHUD) < 0.004) return;
      lastHUD = scale;
      const valEl  = document.getElementById('hvs-zoom-val');
      const fillEl = document.getElementById('hvs-fill');
      const curEl  = document.getElementById('hvs-bar-cur');
      if (!valEl || !fillEl) return;
      valEl.textContent = `${scale.toFixed(2)}×`;
      if (curEl) curEl.textContent = `${scale.toFixed(2)}×`;
      const pct = ((scale - 1) / (getMaxZoom() - 1)) * 100;
      fillEl.style.width = `${Math.max(1, pct)}%`;
      const t   = (scale - 1) / (getMaxZoom() - 1);
      const hue = Math.round(158 - t * 148);
      fillEl.style.background = `linear-gradient(90deg,hsl(${hue},90%,52%),hsl(${hue+28},100%,68%))`;
      fillEl.style.boxShadow  = `0 0 8px hsl(${hue},100%,55%)`;
      valEl.style.color = t > 0.7 ? '#ff7070' : t > 0.4 ? '#ffb347' : t > 0.1 ? '#ffe06a' : '#a9ffd8';
    } catch (_) {}
  }

  function flashHUD() {
    if (destroyed || !overlay) return;
    try {
      overlay.classList.add('hvs-show');
      overlay.classList.remove('hvs-fade');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (destroyed || !overlay) return;
        overlay.classList.add('hvs-fade');
        setTimeout(() => { try { if (overlay) overlay.classList.remove('hvs-show','hvs-fade'); } catch(_){} }, 450);
      }, 2600);
    } catch (_) {}
  }

  function pulseStep(dir) {
    if (destroyed) return;
    try {
      const el = document.getElementById(dir === 'up' ? 'hvs-btn-up' : 'hvs-btn-down');
      if (!el) return;
      el.classList.add('hvs-pulse');
      setTimeout(() => { try { el.classList.remove('hvs-pulse'); } catch(_){} }, 300);
    } catch (_) {}
  }

  function onUnload() { storageSet({ hvs_zoom: currentZoom }); }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    if (initialized || destroyed) return;
    if (!isContextAlive()) return;
    // Both pages use video.video-stream.html5-main-video — wait for it
    if (!getVideoEl()) return;

    initialized = true;
    createHUD();

    document.addEventListener('keydown',   onKeyDown,   true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('mousemove', onMouseMove, { passive: true, capture: true });
    document.addEventListener('mouseup',   onMouseUp,   true);
    window.addEventListener('blur', onMouseUp);
    window.addEventListener('beforeunload', onUnload);

    storageGet(['hvs_zoom'], (res) => {
      if (destroyed) return;
      if (res?.hvs_zoom) {
        const v2 = Math.max(1, Math.min(getMaxZoom(), +res.hvs_zoom));
        targetZoom = currentZoom = v2;
        commitTransform(v2);
      }
    });

    // Context-death watchdog
    const wd = setInterval(() => {
      if (!isContextAlive()) { clearInterval(wd); destroy(); }
    }, 2000);

    console.log('[HVS Zoom v1.4] Ready on', isShorts() ? 'Shorts' : 'Watch', '| max:', getMaxZoom());
  }

  // ── SPA navigation — YouTube navigates without full reload ────────────────
  let lastPath = location.pathname;
  let mo;

  function resetState() {
    // Cancel animations
    if (zoomRafId) { cancelAnimationFrame(zoomRafId); zoomRafId = null; }
    clearTimeout(hideTimer);
    // Reset video transform
    try { const v = getVideoEl(); if (v) { v.style.transform = ''; v.style.willChange = ''; } } catch(_){}
    // Remove old HUD
    try { const h = document.getElementById('hvs-zoom-hud'); if (h) h.remove(); } catch(_){}
    overlay = null; lastHUD = -1;
    targetZoom = currentZoom = 1.0;
    panX = panY = 0;
    initialized = false;
  }

  try {
    mo = new MutationObserver(() => {
      if (destroyed) { try { mo.disconnect(); } catch(_){} return; }

      // Detect SPA navigation
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        resetState();
      }

      // Try to init (will bail early if video not ready yet)
      if (!initialized) {
        if (getVideoEl()) setTimeout(init, 300);
        return;
      }

      // Re-create HUD if YouTube's re-render nuked it
      if (!document.getElementById('hvs-zoom-hud')) {
        overlay = null; createHUD();
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch (_) {}

  // Initial load — try multiple times in case video isn't ready yet
  function tryInit(attempts) {
    if (initialized || destroyed) return;
    if (getVideoEl()) { init(); return; }
    if (attempts > 0) setTimeout(() => tryInit(attempts - 1), 500);
  }

  if (document.readyState !== 'loading') tryInit(10);
  else window.addEventListener('DOMContentLoaded', () => tryInit(10));

})();
