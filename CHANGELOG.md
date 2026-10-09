# Changelog

All notable changes to the **MiruNova Live** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.8.0] - 2026-10-10

### Added
- **Rigging Inspector Stay & Windowed Modes:**
  - Pin mode (Stay) keeping the rigging inspector docked on the right side without an obstructive backdrop overlay, enabling simultaneous webcam tracking and live avatar manipulation.
  - Windowed mode toggle for high-precision inspection in expanded viewports.
- **Camera Tracking Anti-Flicker & Jitter Suppression Engine:**
  - Replaced step deadband with continuous linear-ramp deadzone (`applyContinuousDeadzone`), completely eliminating the 0.3°–0.5° snapping jump.
  - Quadratic micro-jitter noise attenuation floor in `ParameterSmoother` for ultra-steady tracking.
  - Dual-threshold eyelid hysteresis (closed lock <= 0.15, open lock >= 0.80) eliminating flutter and "kiyer-kiyer" half-open eyes.
  - Dropped-frame debounce (holds pose up to 6 lost frames) followed by smooth 30-frame decay towards neutral pose on tracking loss.
  - Fixed inverted smoothing slider mapping: higher values now provide rock-solid, smoother movement.
  - Webcam input device selector and resolution constraints (360p, 720p, 1080p).
- **Clear GUI & Screen Lock Mode:**
  - Quick-action Lock Screen button on the Control Dock and global hotkey **`L`** to instantly hide all chrome UI and freeze canvas dragging.
  - Floating translucent unlock pill for instant one-click restoration.
- **Zero Dummy Data & Live Hardware Telemetry:**
  - Replaced all static and mock values in Settings with live `$state` bindings persisted to `localStorage`.
  - Live hardware telemetry panel reporting actual FPS, frame render latency, WebGL unmasked GPU renderer, CPU concurrency, and active camera resolution.
  - Purged dummy Voice Changer tab from the settings modal UI.
- **Full Internationalization (i18n):**
  - Complete dictionary across Indonesian (`id`), English (`en`), and Japanese (`ja`) for Settings Modal, Rigging Inspector, Control Dock, and Shortcut Guide.
- **Vivian Live2D Model:**
  - Official Vivian Live2D Cubism model with full physics, expressions, eye tracking, and mouth phonemes.
  - Purged experimental static image assets.

---

## [0.7.0] - 2026-10-10

### Added
- **Hideable Menu Dock Panel:**
  - One-click collapse button on the Control Dock and global keyboard shortcut **`H`** to hide/show the dock.
  - Floating translucent pill button at the bottom center allowing quick restoration.
- **Comprehensive Keyboard Shortcuts Guide Modal:**
  - Dedicated interactive cheat sheet modal (`?` or `F1`, and dock Keyboard icon) detailing all studio shortcuts:
    - Vision Tracking (`Space`, `C`, `P`, `B`)
    - Studio Navigation (`H`, `M`, `T`, `R`, `,`, `?`, `Esc`)
    - Live Streaming & Presets (`O`, `S`, `1`–`4`)
- **2X Wider Models & Motions Catalog (`max-w-5xl`):**
  - Expanded modal layout to double width with a responsive 3-column avatar card grid.
  - Added dedicated visual preview illustrations & SVGs for every 2D Live2D and 3D avatar.
  - Feature tags (`Hand Sync`, `Lip Sync`, `Cubism 4`, `Parallax`, `3D WebGL`, etc.) and engine badges.
  - One-click **Reset Posisi Avatar** button to recenter avatar and reset scale.
  - In-modal Pose Looping Studio and built-in motion trigger playback.

### Optimized
- **Memory & Rendering Loop Performance (Anti-Slop Zero Allocation):**
  - Eliminated garbage collection pauses by reusing pre-allocated parameter state buffers (`activeParamsBuffer`, `avatarParamsBuffer`, `handDataBuffer`, and `blendshapesMap.clear()`).
  - Skipped 2D landmark mesh drawing when Camera PIP is hidden or minimized, freeing CPU cycles for the main render loop.
  - Upgraded test suite with 33 passing unit tests verifying visual preview assets and tags.

---

## [0.6.0] - 2026-10-10

### Added
- **Persistent Storage System (`localStorage`):**
  - Settings, chosen models (Live2D & 3D), UI themes, background modes, custom hex colors, sensitivity, smoothing, deadzone, hand tracking, pose loops, and calibration offsets automatically persist across page reloads.
  - JSON configuration export and import for seamless backup and cross-machine sharing.
  - One-click factory reset restoring default configurations.
- **Hardware Spec Detection & Benchmark Tier Bar:**
  - Real-time GPU vendor and renderer detection via WebGL (`WEBGL_debug_renderer_info`).
  - CPU core count detection (`navigator.hardwareConcurrency`).
  - 0–100 benchmark scoring displayed on a dynamic gradient progress bar ranging from *Tidak Lancar* (Red) to *Sangat Lancar / Ultra* (Emerald Green).
  - Dedicated hardware guide detailing why NVIDIA RTX GPUs (Tensor Cores + FP16 SIMD) accelerate MediaPipe vision inference to < 10ms with locked 60+ FPS.
- **Voice Changer Integration Roadmap & Architecture:**
  - Integration guide for **W-Okada AI RVC (Realtime Voice Conversion)** with RTX CUDA acceleration via VB-Cable virtual audio routing (100% free and open-source).
  - In-browser Web Audio API pitch shifting and formant filtering roadmap.
- **Foldable Accordion Rigging Preview Panel:**
  - Re-architected inspector with 6 collapsible accordion cards: *Head Kinematics*, *Eyes & Eyebrows*, *Mouth & Phonemes*, *Body & Breathing*, *Hands & High-Five*, and *Discovered Parameters*.
  - Global "Buka Semua" (Expand All) and "Tutup Semua" (Collapse All) toggles.
  - Active numerical value badges and category indicators.
- **Screenshot & Instant PNG Download:**
  - Dedicated capture button on the Streamer Control Dock (`Aperture` icon) and Settings modal.
  - Extracts full-resolution canvas snapshots with transparency support for thumbnails and stream graphics.
  - Dual-engine compatibility across both Live2D Cubism and Three.js 3D avatars.
- **Comprehensive Settings Modal:**
  - Unified 4-tab control center: *Hardware & Performa*, *Tema & Tampilan*, *Voice Changer*, and *Penyimpanan & Backup*.
  - Built-in UI theme toggler with real-time preview (Cyber Dark, Midnight Blue, Synthwave Sunset, Monochrome Minimal).
- **Universal Modal Dismissal:**
  - Clicking outer dark backdrops now cleanly dismisses all modals (`SettingsModal`, `ThemeModal`, `ModelCatalogModal`, `ObsModal`, and the `RiggingPreviewPanel` drawer).
  - Global `Escape` keyboard shortcut closes any open modal or drawer instantly.
- **Sleek Custom Scrollbar:**
  - Replaced native Windows scrollbar with an ultra-thin 5px minimalist rounded scrollbar that matches active dark theme palettes.

### Changed
- **Head Pose Calibration Accuracy:**
  - Fixed calibration calculation by sampling raw webcam posture baseline (`lastRawYaw`, `lastRawPitch`, `lastRawRoll`) instead of repeatedly compounding offset live values.
  - Added visual floating toast notification on successful calibration.
- **Streamer Control Dock UX:**
  - Enlarged icon buttons with hover tooltips and streamlined aesthetic.
  - Added quick-access buttons for Screenshot and Settings.

---

## [0.5.0] - 2026-10-09

### Added
- **Hand Tracking & High-Five Recognition:**
  - Integrated MediaPipe HandLandmarker with 21 3D joint tracking.
  - Mapped wrist and finger elevations to Live2D arm parameters (`ParamArmLA`, `ParamArmRA`).
  - Real-time high-five gesture detection.
- **Accurate Mouth & Sad Expression Detection:**
  - Added mouth corner geometric curvature detection to reliably trigger sad frowns (`:(`) even with subtle camera angles.
- **Momose Aria Reactive 2D Avatar:**
  - Added reactive 2D illustration model support with real-time head rotation, breathing cycle, blinking, and emotion states.
- **OBS Studio Screen Mode:**
  - Dedicated distraction-free stream mode hiding all chrome UI.
  - Auto-hiding control pill with quick Alpha/Green background toggle.
  - Auto-detection for OBS browser source query params (`?obs=true&bg=chroma`).

---

## [0.4.0] - 2026-10-09

### Added
- **Three.js 3D Procedural Avatar Engine:**
  - Full procedural rigged 3D stylized anime cats (*Mochi*, *Kuro*, *Tora*).
  - Head rotation, ear twitching, eye blinking, mouth sync, paw waving, and tail sway driven by MediaPipe landmarks.
  - Custom `.glb` model uploader.
- **Square Mesh Background & Theme Studio:**
  - Added high-contrast square wireframe mesh grid (`mesh`).
  - Cosmic drifting nebula background (`cosmic`).
  - Custom image/photo upload for stream backgrounds.

---

## [0.3.0] - 2026-10-09

### Added
- **Multi-Language Internationalization (i18n):**
  - English, Bahasa Indonesia, and Japanese support.
- **Expanded Live2D Model Catalog:**
  - Integrated Haru Greeter, Hiyori Momose, Mao Pro, Shizuku, Wanko, and Rice models.
- **Camera Picture-in-Picture & Landmark Wireframes:**
  - Real-time canvas overlay rendering 478 face mesh points and 21 hand joints.

---

## [0.2.0] - 2026-10-09

### Added
- **Exponential Smoothing & Deadzone Filter:**
  - Dynamic lerp parameter filter eliminating webcam micro-jitter.
  - Configurable deadzone threshold for locked neutral posture.

---

## [0.1.0] - 2026-10-09

### Initial Release
- In-browser Live2D Cubism 3/4 runtime via Pixi.js v7.
- Google MediaPipe FaceMesh vision tracker with WASM acceleration.
- Live Rigging Preview and parameter inspection panel.
- 100% Client-side, zero-cost, zero cloud API architecture.
