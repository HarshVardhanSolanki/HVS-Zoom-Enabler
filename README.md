<div align="center">

<!-- ═══════════════════════════════════════════════════════════════ BANNER -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0e1a,50:0d2a1f,100:0a1628&height=220&section=header&text=YouTube%20Zoom%20Enabler&fontSize=48&fontColor=a9ffd8&fontAlignY=38&desc=by%20HVS%20%E2%80%94%20Desktop%20Zoom%20Control&descAlignY=58&descSize=20&descColor=7ec8ff&animation=fadeIn" alt="YouTube Zoom Enabler by HVS"/>

<!-- ═══════════════════════════════════════════════════════════════ BADGES -->
<p>
  <img src="https://img.shields.io/badge/Manifest-V3-a9ffd8?style=for-the-badge&logo=googlechrome&logoColor=0a0e1a&labelColor=0a0e1a" alt="Manifest V3"/>
  <img src="https://img.shields.io/badge/Version-1.4.0-7ec8ff?style=for-the-badge&logo=github&logoColor=0a0e1a&labelColor=0a0e1a" alt="Version"/>
  <img src="https://img.shields.io/badge/YouTube-Zoom-ff4444?style=for-the-badge&logo=youtube&logoColor=white&labelColor=1a0000" alt="YouTube"/>
  <img src="https://img.shields.io/badge/License-MIT-ffe06a?style=for-the-badge&logoColor=0a0e1a&labelColor=0a0e1a" alt="License"/>
  <img src="https://img.shields.io/badge/PRs-Welcome-50dca0?style=for-the-badge&logoColor=0a0e1a&labelColor=0a0e1a" alt="PRs Welcome"/>
</p>

<!-- ═══════════════════════════════════════════════════════════════ ICON LOGO -->
<br/>

```
  ╭─────────────────────────────────────────────╮
  │                                             │
  │      ┌──────────────────────────────┐       │
  │      │   ⊙ ─────── HVS ZOOM ─────  │       │
  │      │        ◉  2.50×             │       │
  │      │   ████████░░░░░░░░░░░░░░░   │       │
  │      │   U Zoom In   Y Zoom Out    │       │
  │      └──────────────────────────────┘       │
  │                                             │
  ╰─────────────────────────────────────────────╯
```

<br/>

**The zoom feature YouTube desktop forgot to build — now yours.**

<br/>

</div>

---

<!-- ═══════════════════════════════════════════════════════════════ NAV -->
<div align="center">
  <a href="#-what-is-this"><kbd> 🔍 What is this </kbd></a> &nbsp;
  <a href="#-features"><kbd> ⚡ Features </kbd></a> &nbsp;
  <a href="#-installation"><kbd> 📦 Install </kbd></a> &nbsp;
  <a href="#️-controls"><kbd> 🕹️ Controls </kbd></a> &nbsp;
  <a href="#-how-it-works"><kbd> 🔬 How It Works </kbd></a> &nbsp;
  <a href="#-screenshots"><kbd> 🖼️ Screenshots </kbd></a> &nbsp;
  <a href="#-faq"><kbd> ❓ FAQ </kbd></a>
</div>

---

## 🔍 What is this?

> **YouTube Zoom Enabler** is a Chrome extension that brings mobile-style pinch-to-zoom to YouTube on desktop — using simple keyboard shortcuts and smooth mouse-driven pan.

Mobile YouTube has had pinch-to-zoom forever. Desktop? Nothing. Whether you're watching a coding tutorial and need to read the terminal, following a chess match, studying a documentary map, or just want to focus on a speaker's face — this extension gives you that control, instantly, on any video or Short.

<br/>

<div align="center">

| Before | After |
|:------:|:-----:|
| 🖥️ Fixed 1× viewport | 🔍 Up to **9× zoom** on videos |
| 🤏 No pinch-to-zoom | ⌨️ **U** / **Y** keyboard control |
| 📺 Can't focus on detail | 🖱️ **Ctrl+Drag** to pan anywhere |
| 📱 Mobile-only feature | 💻 Full desktop support |

</div>

---

## ⚡ Features

<table>
<tr>
<td width="50%">

### 🎬 Video Zoom
- **`U`** — Zoom in `+0.25×` per press
- **`Y`** — Zoom out `−0.25×` per press
- Range: **1× → 9×** on regular videos
- Range: **1× → 4×** on YouTube Shorts
- Smooth **60fps** lerp animation — zero lag

</td>
<td width="50%">

### 🖱️ Pan & Navigate
- Hold **`Ctrl`** + drag to pan the zoomed frame
- Without Ctrl — click works as **play/pause** normally
- Pan is clamped to video bounds — no blank edges
- Direct 1:1 cursor-to-frame tracking

</td>
</tr>
<tr>
<td width="50%">

### 🎯 Precision Targeting
- Transforms **only the `<video>` element**
- Seekbar, controls, captions — all **untouched**
- Works on both `/watch` and `/shorts` URLs
- Survives YouTube's SPA navigation

</td>
<td width="50%">

### 🧠 Smart HUD
- Glassmorphic overlay with **live zoom readout**
- Colour-coded meter: mint → yellow → red
- Auto-hides after **2.6 seconds**
- Keyboard hint reminders built-in

</td>
</tr>
<tr>
<td width="50%">

### 🔒 Privacy First
- **Zero** data collection
- **Zero** analytics or telemetry
- **Zero** ads or third-party scripts
- Only stores your zoom preference — locally

</td>
<td width="50%">

### ⚙️ Robust Engineering
- MutationObserver for SPA navigation detection
- Extension context invalidation protection
- 10-attempt retry init for slow page loads
- Full cleanup on extension reload/disable

</td>
</tr>
</table>

---

## 📦 Installation

### Option A — Load Unpacked (Developer Mode)

```bash
# 1. Download and extract the ZIP
# 2. Open Chrome and go to:
chrome://extensions

# 3. Enable Developer Mode (top-right toggle)
# 4. Click "Load unpacked"
# 5. Select the extracted hvs-zoom-ext/ folder
```

> ✅ The **HVS Zoom** icon will appear in your toolbar — you're ready.

### Option B — Chrome Web Store *(coming soon)*

<div align="center">
  <img src="https://img.shields.io/badge/Chrome%20Web%20Store-Coming%20Soon-a9ffd8?style=for-the-badge&logo=googlechrome&logoColor=0a0e1a&labelColor=0a0e1a" alt="Chrome Web Store"/>
</div>

---

## 🕹️ Controls

<div align="center">

### Keyboard Shortcuts

| Key | Action | Step | Limit |
|:---:|--------|:----:|:-----:|
| <kbd>U</kbd> | Zoom In | `+0.25×` | Max `9.0×` (video) / `4.0×` (Shorts) |
| <kbd>Y</kbd> | Zoom Out | `−0.25×` | Min `1.0×` |

<br/>

### Mouse Controls

| Gesture | Action |
|:-------:|--------|
| <kbd>Ctrl</kbd> + `Drag` | Pan around the zoomed frame |
| `Click` (no Ctrl) | Play / Pause (works at any zoom) |

</div>

<br/>

> ⚠️ **Important:** The extension **never** intercepts `Ctrl+R`, `Ctrl+Shift+R`, or any other modifier-key combos. Your browser shortcuts are always safe.

---

## 🔬 How It Works

### Architecture Overview

```
YouTube Page DOM
│
├── #movie_player                    ← NOT scaled (controls stay intact)
│   ├── .ytp-chrome-bottom          ← NOT scaled (seekbar untouched)
│   ├── .ytp-gradient-bottom        ← NOT scaled
│   └── video.html5-main-video  ◄── ✅ ONLY THIS IS SCALED
│       └── [blob: src]
│
└── #hvs-zoom-hud                   ← HUD overlay (injected by extension)
    └── .hvs-glass
```

### The Zoom Engine

```javascript
// RAF lerp loop — no CSS transitions, pure 60fps animation
function tickZoom() {
  const diff = targetZoom - currentZoom;
  if (Math.abs(diff) < 0.0005) { /* done */ return; }
  
  currentZoom += diff * 0.11;  // ease-out curve
  video.style.transform = `scale(${currentZoom}) translate(${panX}px, ${panY}px)`;
  
  requestAnimationFrame(tickZoom);
}
```

### Why Only The `<video>` Element?

Most zoom implementations target the player container — which scales the seekbar, controls, and overlays along with the video, making them unusable. This extension targets `video.video-stream.html5-main-video` directly, leaving every control at native 1× size and full interactivity.

### SPA Navigation Handling

YouTube never does a full page reload. A `MutationObserver` on `document.documentElement` detects URL changes and triggers a full state reset — zoom returns to `1×`, pan resets, and the extension re-initialises with the correct limits for the new page type (`9×` for `/watch`, `4×` for `/shorts`).

---

## 🖼️ Screenshots

<div align="center">

### HUD Overlay — Live Zoom Feedback

```
  ╭────────────────────────╮
  │ ⬡  HVS Zoom           │
  │                        │
  │  ▼  2.50×  ▲          │
  │  ████████░░░░░░░░      │
  │  1×   2.50×   9×       │
  │                        │
  │  [U] In [Y] Out        │
  │         [Ctrl] Drag    │
  ╰────────────────────────╯
```

*The HUD appears on zoom activation and fades after 2.6 seconds*

<br/>

### Zoom Range Comparison

| Mode | Min | Max | Step | Best For |
|------|:---:|:---:|:----:|----------|
| 🎬 YouTube Watch | 1× | **9×** | 0.25× | Lectures, tutorials, sports |
| 📱 YouTube Shorts | 1× | **4×** | 0.25× | Portrait content, close-ups |

</div>

---

## 📁 Project Structure

```
hvs-zoom-ext/
│
├── 📄 manifest.json          — Extension config (Manifest V3)
├── 📜 content.js             — Core zoom engine, pan logic, HUD
├── 🎨 overlay.css            — HUD glassmorphic styles
├── 🌐 popup.html             — Extension popup UI
│
└── 🖼️  icons/
    ├── icon16.png            — Toolbar icon (16×16)
    ├── icon48.png            — Extension management (48×48)
    └── icon128.png           — Chrome Web Store (128×128)
```

---

## 🔐 Permissions

<div align="center">

| Permission | Why It's Needed | What It Does NOT Do |
|------------|----------------|---------------------|
| `activeTab` | Inject zoom logic into the YouTube tab | Cannot access any other site |
| `storage` | Save your zoom preference locally | Never syncs, never uploads data |

</div>

**That's it. Just 2 permissions.** No `tabs`, no `history`, no `cookies`, no `webRequest`, no `<all_urls>`.

---

## 🗺️ Roadmap

- [x] Keyboard zoom (U / Y keys)
- [x] Smooth RAF animation engine
- [x] Video-only targeting (seekbar untouched)
- [x] Ctrl+Drag pan
- [x] YouTube Shorts support (4× limit)
- [x] Live HUD feedback overlay
- [x] SPA navigation handling
- [x] Context invalidation protection
- [ ] Scroll-wheel zoom support
- [ ] Configurable zoom step size
- [ ] Minimap for high-zoom navigation
- [ ] Firefox port
- [ ] Chrome Web Store release

---

## ❓ FAQ

<details>
<summary><b>Does this work on YouTube Shorts?</b></summary>

Yes! The extension detects Shorts URLs automatically and applies a 1×–4× zoom range (instead of 9×) suited to the portrait format.
</details>

<details>
<summary><b>Will this break the seekbar or video controls?</b></summary>

No. The extension scales only the raw `<video>` element, never the player container. The seekbar, volume, captions, settings, and all other controls remain at normal size and are fully interactive at every zoom level.
</details>

<details>
<summary><b>Can I still click to play/pause when zoomed in?</b></summary>

Yes. Clicking the video without holding `Ctrl` passes the click through to YouTube's native player — play/pause works normally at any zoom level.
</details>

<details>
<summary><b>Does it work after navigating between videos?</b></summary>

Yes. YouTube is a single-page app that never fully reloads. The extension detects URL changes via MutationObserver and resets state automatically for each new video.
</details>

<details>
<summary><b>I see "Extension context invalidated" — what happened?</b></summary>

This happens when you reload the extension from `chrome://extensions` while YouTube is open. In v1.4+, the extension detects this automatically, runs full cleanup, and stops gracefully. Just reload the YouTube tab to get zoom back.
</details>

<details>
<summary><b>Does it collect any data?</b></summary>

Zero. No analytics, no telemetry, no tracking. The only thing stored is your zoom level preference — in your own browser's local storage, never transmitted anywhere.
</details>

<details>
<summary><b>Why U and Y keys?</b></summary>

They sit side by side on QWERTY keyboards, are easy to reach one-handed, and don't conflict with any common browser shortcuts. The extension never responds to any key combination involving Ctrl, Alt, Meta, or Shift.
</details>

---

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/hvs/youtube-zoom-enabler.git

# Navigate into the extension folder
cd youtube-zoom-enabler/hvs-zoom-ext

# Load in Chrome
# → chrome://extensions → Developer Mode → Load unpacked → select this folder

# Watch for changes (no build step needed — pure vanilla JS/CSS)
```

### Tech Stack

<div align="center">
  <img src="https://img.shields.io/badge/JavaScript-ES2022-ffe06a?style=flat-square&logo=javascript&logoColor=0a0e1a&labelColor=0a0e1a"/>
  <img src="https://img.shields.io/badge/CSS3-Glassmorphism-7ec8ff?style=flat-square&logo=css3&logoColor=0a0e1a&labelColor=0a0e1a"/>
  <img src="https://img.shields.io/badge/HTML5-Popup%20UI-ff7070?style=flat-square&logo=html5&logoColor=0a0e1a&labelColor=0a0e1a"/>
  <img src="https://img.shields.io/badge/Chrome-Manifest%20V3-a9ffd8?style=flat-square&logo=googlechrome&logoColor=0a0e1a&labelColor=0a0e1a"/>
</div>

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/scroll-wheel-zoom`
3. **Commit** your changes: `git commit -m 'feat: add scroll wheel zoom support'`
4. **Push** to the branch: `git push origin feature/scroll-wheel-zoom`
5. **Open** a Pull Request

Please keep PRs focused — one feature per PR. Include a description of what changes and why.

---

## 📄 License

```
MIT License — Copyright (c) 2025 HVS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, subject to the above copyright notice and
this permission notice appearing in all copies.
```

---

<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0a1628,50:0d2a1f,100:0a0e1a&height=120&section=footer&animation=fadeIn" alt="footer"/>

<br/>

**Built with 💚 by HVS**

*If this project saved you from squinting at a YouTube video, consider giving it a ⭐*

<br/>

<img src="https://img.shields.io/badge/Made%20by-HVS-a9ffd8?style=for-the-badge&labelColor=0a0e1a" alt="Made by HVS"/>
&nbsp;
<img src="https://img.shields.io/badge/For-YouTube%20Desktop-ff4444?style=for-the-badge&logo=youtube&labelColor=1a0000" alt="For YouTube"/>
&nbsp;
<img src="https://img.shields.io/badge/Zero-Data%20Collected-50dca0?style=for-the-badge&labelColor=0a0e1a" alt="Zero Data"/>

</div>
