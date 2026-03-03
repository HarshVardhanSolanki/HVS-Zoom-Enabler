(() => {
  'use strict';

  // ── Context guard ──────────────────────────────────────────────────────────
  function alive() {
    try { return !!chrome.runtime?.id; } catch (_) { return false; }
  }
  function sGet(k, cb) { if (alive()) try { chrome.storage.local.get(k, cb); } catch (_) {} }
  function sSet(o)     { if (alive()) try { chrome.storage.local.set(o);     } catch (_) {} }

  // ── Page type ──────────────────────────────────────────────────────────────
  function onShorts() { return location.pathname.startsWith('/shorts'); }
  function maxZoom()  { return onShorts() ? 4.0 : 9.0; }

  // ── Find the <video> element ───────────────────────────────────────────────
  function getVideo() {
    return (
      document.querySelector('ytd-shorts video') ||
      document.querySelector('#shorts-player video') ||
      document.querySelector('ytd-reel-video-renderer video') ||
      document.querySelector('video.html5-main-video') ||
      document.querySelector('video.video-stream') ||
      document.querySelector('#movie_player video') ||
      Array.from(document.querySelectorAll('video')).find(v => v.src || v.currentSrc) ||
      null
    );
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let targetZoom  = 1.0, currentZoom = 1.0;
  let panX = 0, panY = 0;
  let zoomRafId   = null;
  let panRafPend  = false, pendingDX = 0, pendingDY = 0;
  let hideTimer   = null;
  let initialized = false, destroyed = false;
  let lastPath    = location.pathname;
  let overlay     = null, lastHUDVal = -1, lastVideo = null;
  let isCtrlHeld  = false;
  let isPanning   = false;
  let lastMouseX  = 0, lastMouseY = 0;
  let videoElement = null;

  const STEP = 0.25, LERP = 0.10;
  const PAN_SENSITIVITY = 1.5; // Adjust this for faster/slower panning

  // ── Destroy ────────────────────────────────────────────────────────────────
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (zoomRafId) { cancelAnimationFrame(zoomRafId); zoomRafId = null; }
    clearTimeout(hideTimer);
    if (moTimer) { clearTimeout(moTimer); moTimer = null; }
    document.removeEventListener('keydown',   onKeyDown,   true);
    document.removeEventListener('keyup',     onKeyUp,     true);
    document.removeEventListener('mousemove', onMouseMove, true);
    window.removeEventListener('blur',        onBlur);
    window.removeEventListener('beforeunload', onUnload);
    if (mo) { try { mo.disconnect(); } catch (_) {} }
    resetVideo();
    removeHUD();
    try { document.body.style.cursor = ''; document.body.style.userSelect = ''; } catch (_) {}
  }

  function resetVideo() {
    const v = lastVideo || getVideo();
    if (v) {
      try {
        v.style.transform = '';
        v.style.transformOrigin = '';
        v.style.willChange = '';
        v.style.transition = '';
        v.style.cursor = '';
      } catch (_) {}
    }
    lastVideo = null;
    videoElement = null;
  }

  function removeHUD() {
    try { const h = document.getElementById('hvs-zoom-hud'); if (h) h.remove(); } catch (_) {}
    overlay = null; lastHUDVal = -1;
  }

  // ── Update video cursor ────────────────────────────────────────────────────
  function updateVideoCursor() {
    const v = videoElement || getVideo();
    if (!v) return;
    
    if (isPanning) {
      v.style.cursor = 'grabbing';
      document.body.style.cursor = 'grabbing';
    } else if (isCtrlHeld && currentZoom > 1.005) {
      v.style.cursor = 'grab';
      document.body.style.cursor = 'grab';
    } else {
      v.style.cursor = '';
      document.body.style.cursor = '';
    }
  }

  // ── Transform (video element only) ────────────────────────────────────────
  function commitTransform(scale) {
    if (destroyed) return;
    try {
      const v = getVideo();
      if (!v) return;
      lastVideo = v;
      videoElement = v;
      const vw = v.offsetWidth  || 640;
      const vh = v.offsetHeight || 360;
      const mx = (vw * (scale - 1)) / 2;
      const my = (vh * (scale - 1)) / 2;
      panX = Math.max(-mx, Math.min(mx, panX));
      panY = Math.max(-my, Math.min(my, panY));
      v.style.transition      = 'none';
      v.style.transformOrigin = 'center center';
      v.style.willChange      = scale !== 1 ? 'transform' : 'auto';
      v.style.transform = (scale === 1 && panX === 0 && panY === 0)
        ? '' : `scale(${scale}) translate(${panX / scale}px, ${panY / scale}px)`;
      updateVideoCursor();
    } catch (_) {}
  }

  // ── Zoom RAF lerp ──────────────────────────────────────────────────────────
  function tickZoom() {
    if (destroyed || !alive()) { destroy(); return; }
    const diff = targetZoom - currentZoom;
    if (Math.abs(diff) < 0.0008) {
      currentZoom = targetZoom;
      commitTransform(currentZoom);
      updateHUD(currentZoom);
      zoomRafId = null;
      return;
    }
    currentZoom += diff * LERP;
    commitTransform(currentZoom);
    updateHUD(currentZoom);
    zoomRafId = requestAnimationFrame(tickZoom);
  }

  function kickZoom() {
    if (destroyed) return;
    if (zoomRafId) cancelAnimationFrame(zoomRafId);
    zoomRafId = requestAnimationFrame(tickZoom);
  }

  // ── Pan RAF (batched — never >1 rAF queued) ───────────────────────────────
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
  function clampZ(v) { return Math.max(1.0, Math.min(maxZoom(), v)); }

  function zoomIn() {
    if (destroyed) return;
    targetZoom = clampZ(+(targetZoom + STEP).toFixed(4));
    kickZoom(); flashHUD(); pulseArrow('up');
  }

  function zoomOut() {
    if (destroyed) return;
    targetZoom = clampZ(+(targetZoom - STEP).toFixed(4));
    if (targetZoom <= 1.0) { targetZoom = 1.0; panX = 0; panY = 0; }
    kickZoom(); flashHUD(); pulseArrow('down');
  }

  // ── Keyboard ───────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (destroyed) return;
    
    // Track Ctrl/Meta key for pan mode
    if ((e.key === 'Control' || e.key === 'Meta') && !isCtrlHeld) {
      isCtrlHeld = true;
      isPanning = false; // Reset panning state
      updateVideoCursor();
      return;
    }
    
    // Zoom controls (don't trigger when Ctrl is held)
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (e.key === 'u' || e.key === 'U') { e.preventDefault(); zoomIn();  }
    if (e.key === 'y' || e.key === 'Y') { e.preventDefault(); zoomOut(); }
  }

  function onKeyUp(e) {
    if (destroyed) return;
    // Release Ctrl/Meta key
    if ((e.key === 'Control' || e.key === 'Meta') && isCtrlHeld) {
      isCtrlHeld = false;
      isPanning = false;
      updateVideoCursor();
    }
  }

  // ── Mouse move pan (when Ctrl is held, just moving mouse pans) ────────────
  function onMouseMove(e) {
    if (destroyed) return;
    
    // Check if we're over the video element
    const v = videoElement || getVideo();
    if (!v) return;
    
    const r = v.getBoundingClientRect();
    const isOverVideo = (
      e.clientX >= r.left && e.clientX <= r.right &&
      e.clientY >= r.top  && e.clientY <= r.bottom
    );
    
    // If Ctrl is held, we're zoomed in, and mouse is over video
    if (isCtrlHeld && currentZoom > 1.005 && isOverVideo) {
      
      // If this is the first move with Ctrl held, just record position
      if (!isPanning) {
        isPanning = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        updateVideoCursor();
        return;
      }
      
      // Calculate mouse movement delta
      const dx = (e.clientX - lastMouseX) * PAN_SENSITIVITY;
      const dy = (e.clientY - lastMouseY) * PAN_SENSITIVITY;
      
      // Update last position
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      
      // Apply panning with bounds checking
      const vw = v.offsetWidth  || 640;
      const vh = v.offsetHeight || 360;
      const mx = (vw * (currentZoom - 1)) / 2;
      const my = (vh * (currentZoom - 1)) / 2;
      
      const newPanX = Math.max(-mx, Math.min(mx, panX + dx));
      const newPanY = Math.max(-my, Math.min(my, panY + dy));
      
      const actualDX = newPanX - panX;
      const actualDY = newPanY - panY;
      
      if (Math.abs(actualDX) > 0.05 || Math.abs(actualDY) > 0.05) {
        schedulePan(actualDX, actualDY);
      }
    } else if (isPanning) {
      // Mouse left the video or Ctrl released
      isPanning = false;
      updateVideoCursor();
    }
  }

  function onBlur() {
    isPanning = false;
    isCtrlHeld = false;
    updateVideoCursor();
    try { 
      document.body.style.userSelect = ''; 
      document.body.style.cursor = '';
    } catch (_) {}
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('hvs-zoom-css')) return;
    const s = document.createElement('style');
    s.id = 'hvs-zoom-css';
    s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
#hvs-zoom-hud{position:fixed;top:84px;right:20px;z-index:2147483647;pointer-events:none;opacity:0;transform:translateX(14px) scale(0.93);transition:opacity .26s cubic-bezier(.34,1.2,.64,1),transform .26s cubic-bezier(.34,1.2,.64,1);font-family:'Space Mono',monospace}
#hvs-zoom-hud.hvs-show{opacity:1;transform:translateX(0) scale(1)}
#hvs-zoom-hud.hvs-fade{opacity:0;transform:translateX(10px) scale(.96);transition:opacity .44s ease,transform .44s ease}
.hvs-g{background:rgba(6,8,18,.80);backdrop-filter:blur(28px) saturate(200%);-webkit-backdrop-filter:blur(28px) saturate(200%);border:1px solid rgba(255,255,255,.075);border-radius:22px;padding:14px 18px 13px;min-width:220px;box-shadow:0 0 0 1px rgba(80,220,160,.10),0 12px 40px rgba(0,0,0,.72),0 2px 0 rgba(255,255,255,.05) inset;position:relative;overflow:hidden}
.hvs-g::before{content:'';position:absolute;top:0;left:16px;right:16px;height:1px;background:linear-gradient(90deg,transparent,rgba(100,255,180,.38),transparent)}
.hvs-top{display:flex;align-items:center;gap:7px;margin-bottom:10px}
.hvs-hex{font-size:13px;color:#50dca0;animation:hvs-rot 8s linear infinite;display:inline-block}
@keyframes hvs-rot{to{transform:rotate(360deg)}}
.hvs-brand{font-family:'Syne',sans-serif;font-weight:800;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.35)}
.hvs-row{display:flex;align-items:center;justify-content:space-between;margin:2px 0 10px}
.hvs-val{font-family:'Syne',sans-serif;font-weight:800;font-size:36px;line-height:1;color:#a9ffd8;letter-spacing:-.025em;text-align:center;text-shadow:0 0 28px rgba(80,220,160,.45);transition:color .35s}
.hvs-arr{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.25);transition:background .15s,color .15s,box-shadow .15s}
.hvs-arr svg{width:14px;height:14px}
.hvs-arr.hvs-pulse{background:rgba(80,220,160,.18);color:#a9ffd8;box-shadow:0 0 12px rgba(80,220,160,.4)}
.hvs-bar-wrap{margin-bottom:3px}
.hvs-bar-bg{position:relative;height:5px;background:rgba(255,255,255,.07);border-radius:99px;overflow:hidden}
.hvs-bar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#50dca0,#7effd4);transition:width .06s linear,background .3s,box-shadow .3s;min-width:4px}
.hvs-ticks{display:flex;justify-content:space-between;font-size:8px;color:rgba(255,255,255,.2);margin:3px 0 11px;letter-spacing:.04em}
.hvs-ticks span:nth-child(2){color:rgba(255,255,255,.4);font-weight:700}
.hvs-chips{display:flex;gap:6px;flex-wrap:wrap;padding-top:10px;border-top:1px solid rgba(255,255,255,.055)}
.hvs-chip{display:flex;align-items:center;gap:4px;font-size:9px;color:rgba(255,255,255,.38);letter-spacing:.04em}
.hvs-chip kbd{font-family:'Space Mono',monospace;font-size:9px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.13);border-bottom:2px solid rgba(0,0,0,.3);border-radius:5px;padding:1px 6px;color:rgba(255,255,255,.6);line-height:1.4}
.hvs-blue{color:rgba(110,185,255,.55)!important;margin-left:auto}
.hvs-blue kbd{background:rgba(80,140,255,.12)!important;border-color:rgba(80,140,255,.22)!important;color:rgba(140,190,255,.75)!important}`;
    document.head.appendChild(s);
  }

  function createHUD() {
    if (destroyed || document.getElementById('hvs-zoom-hud')) return;
    overlay = document.createElement('div');
    overlay.id = 'hvs-zoom-hud';
    const shorts = onShorts();
    overlay.innerHTML = `<div class="hvs-g">
      <div class="hvs-top"><span class="hvs-hex">⬡</span><span class="hvs-brand">HVS Zoom${shorts ? ' · Shorts' : ''}</span></div>
      <div class="hvs-row">
        <div class="hvs-arr" id="hvs-dn"><svg viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div class="hvs-val" id="hvs-val">1.00×</div>
        <div class="hvs-arr" id="hvs-up"><svg viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      </div>
      <div class="hvs-bar-wrap"><div class="hvs-bar-bg"><div class="hvs-bar-fill" id="hvs-fill"></div></div></div>
      <div class="hvs-ticks"><span>1×</span><span id="hvs-cur">—</span><span>${shorts ? '4×' : '9×'}</span></div>
      <div class="hvs-chips">
        <span class="hvs-chip"><kbd>U</kbd> In</span>
        <span class="hvs-chip"><kbd>Y</kbd> Out</span>
        <span class="hvs-chip hvs-blue"><kbd>Ctrl</kbd>+Move Pan</span>
      </div></div>`;
    document.body.appendChild(overlay);
    updateHUD(currentZoom);
  }

  function updateHUD(scale) {
    if (destroyed) return;
    if (Math.abs(scale - lastHUDVal) < 0.003) return;
    lastHUDVal = scale;
    try {
      const ve = document.getElementById('hvs-val');
      const fe = document.getElementById('hvs-fill');
      const ce = document.getElementById('hvs-cur');
      if (!ve || !fe) return;
      ve.textContent = scale.toFixed(2) + '×';
      if (ce) ce.textContent = scale.toFixed(2) + '×';
      const pct = ((scale - 1) / (maxZoom() - 1)) * 100;
      fe.style.width = Math.max(1, pct) + '%';
      const t = (scale - 1) / (maxZoom() - 1);
      const hue = Math.round(158 - t * 148);
      fe.style.background = `linear-gradient(90deg,hsl(${hue},88%,52%),hsl(${hue+28},100%,68%))`;
      fe.style.boxShadow  = `0 0 8px hsl(${hue},100%,55%)`;
      ve.style.color = t > 0.7 ? '#ff7070' : t > 0.4 ? '#ffb347' : t > 0.1 ? '#ffe06a' : '#a9ffd8';
    } catch (_) {}
  }

  function flashHUD() {
    if (destroyed || !overlay) return;
    overlay.classList.add('hvs-show');
    overlay.classList.remove('hvs-fade');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!overlay) return;
      overlay.classList.add('hvs-fade');
      setTimeout(() => { try { if (overlay) overlay.classList.remove('hvs-show', 'hvs-fade'); } catch (_) {} }, 440);
    }, 2600);
  }

  function pulseArrow(dir) {
    try {
      const el = document.getElementById(dir === 'up' ? 'hvs-up' : 'hvs-dn');
      if (!el) return;
      el.classList.add('hvs-pulse');
      setTimeout(() => el.classList.remove('hvs-pulse'), 280);
    } catch (_) {}
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  function onUnload() { sSet({ hvs_zoom: currentZoom }); }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    if (initialized || destroyed || !alive()) return;
    if (!getVideo()) return;
    initialized = true;
    injectCSS();
    createHUD();
    document.addEventListener('keydown',   onKeyDown,   true);
    document.addEventListener('keyup',     onKeyUp,     true);
    document.addEventListener('mousemove', onMouseMove, true);
    window.addEventListener('blur',        onBlur);
    window.addEventListener('beforeunload', onUnload);
    sGet(['hvs_zoom'], res => {
      if (destroyed) return;
      if (res?.hvs_zoom) {
        const v = Math.max(1, Math.min(maxZoom(), +res.hvs_zoom));
        targetZoom = currentZoom = v;
        commitTransform(v);
      }
    });
    const wd = setInterval(() => { if (!alive()) { clearInterval(wd); destroy(); } }, 3000);
    console.log(`[HVS Zoom v1.5] Ready on ${onShorts() ? 'Shorts' : 'Watch'} — max ${maxZoom()}×`);
  }

  // ── Navigation reset ───────────────────────────────────────────────────────
  function resetForNav() {
    if (zoomRafId) { cancelAnimationFrame(zoomRafId); zoomRafId = null; }
    clearTimeout(hideTimer);
    panRafPend = false; pendingDX = 0; pendingDY = 0;
    isPanning = false; isCtrlHeld = false;
    resetVideo(); removeHUD();
    targetZoom = currentZoom = 1.0;
    panX = panY = 0;
    initialized = false;
  }

  // ── MutationObserver — DEBOUNCED ───────────────────────────────────────────
  let moTimer = null;

  function scheduleCheck() {
    if (moTimer || destroyed) return;
    moTimer = setTimeout(() => {
      moTimer = null;
      if (destroyed) return;
      const cur = location.pathname;
      if (cur !== lastPath) { lastPath = cur; resetForNav(); }
      if (!initialized && getVideo()) { init(); return; }
      if (initialized && !document.getElementById('hvs-zoom-hud')) {
        overlay = null; lastHUDVal = -1; createHUD(); updateHUD(currentZoom);
      }
    }, 400);
  }

  let mo;
  try {
    mo = new MutationObserver(scheduleCheck);
    mo.observe(document.body, { childList: true });
  } catch (_) {}

  // ── Retry init loop ────────────────────────────────────────────────────────
  function tryInit(n) {
    if (initialized || destroyed) return;
    if (getVideo()) { init(); return; }
    if (n > 0) setTimeout(() => tryInit(n - 1), 500);
  }

  if (document.readyState !== 'loading') tryInit(12);
  else window.addEventListener('DOMContentLoaded', () => tryInit(12));

})();