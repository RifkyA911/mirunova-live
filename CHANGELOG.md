# Changelog

All notable changes to the **MiruNova Live** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.21.0-beta] - 2026-10-14

- **Futuristic 3D Cube Model Loader Overhaul (`CubeLoader.svelte`, `+page.svelte`, `CanvasStage.svelte`, `ModelCatalogModal.svelte`):**
  - Integrated 3D spinning Cube Loader inspired by Daiwiik Harihar (`@daiwiikharihar/components/cube-loader` on 21st.dev).
  - Built with pure CSS 3D transforms (`perspective: 1200px`, `transform-style: preserve-3d`) featuring infinite multi-axis spin (`cubeSpin`), breathing translucent face panels (Cyan, Purple, Indigo), a hyper-luminous white core with pulsing aura, and ambient floor breathing shadows.
  - Added futuristic microcopy with subtle glitch effect, dynamic avatar model title with engine badge (`2D Live2D` / `3D`), and real-time audio rhythm equalizer bars.
  - Unified across the stage root (`+page.svelte`), providing seamless visual feedback when loading or switching both 2D and 3D avatars.
- **Camera PiP Rig Mode & Clean Landmark Points (`CameraPip.svelte`, `tracker.ts`):**
  - Simplified preview tab label to "Rig" with cyan indicator.
  - Restored clean landmark point density with step-4 stride (`i += 4`) and vibrant cyan/sky-blue dots (`#06b6d4` / `#38bdf8`), eliminating landmark point clutter while maintaining precise tracking visual feedback.
- **Expressions Studio Overhaul with Poses, Motions & Resizable Frosted Glass (`ControlDock.svelte`):**
  - Expanded expression popup into a comprehensive 3-tab studio:
    - **Tab 1 (Ekspresi):** 16 universal facial expressions with intensity slider and dynamic blendshape presets.
    - **Tab 2 (Pose & Loop):** 5 procedural animated pose loops (Pernapasan Alami, Ayunan Santai, Anggukan Kepala, Lambaian Tangan, Off) with speed multiplier slider (`0.2x` - `2.5x`), plus 5 3D full-body pose triggers (Siaga Normal, Melambai, Peace V-Sign, Love Heart, Berdiri Tegak).
    - **Tab 3 (Motions):** Model-specific trigger motions (`availableMotions`) with procedural fallback gestures (Lambaian Tangan, Membungkuk, Sorak Hore, Mengangguk, Menggeleng, Kedip Beruntun).
  - Redesigned with frosted glassmorphism (`backdrop-blur-3xl bg-zinc-950/75 border border-white/20`) and responsive resizability (`resize overflow-auto`) with a corner grip handle.
- **Dedicated 3D Stage Environment Dock Menu (`ControlDock.svelte`, `+page.svelte`):**
  - Added dedicated Stage Environment button (`Compass` icon) on the main bottom dock.
  - Interactive selection between Cyber Grid, 3D Studio Room, Open Field, and Void Minimal stages, along with turntable spin toggle.
  - Added keyboard shortcut `[B]` to quickly cycle 3D stage environments.
- **5 Popular Hoyoverse & Kuro Games Community Model Installations (`models.ts`, `static/models/`):**
  - **Tingyun / 停云 (Honkai: Star Rail):** Installed from `tingyun.rar` into `static/models/tingyun/` with 4K textures, dynamic Foxian ear & tail physics, and 4 expressions (`tail`, `heart`, `blush`, `dark`).
  - **Jane Doe / 简·杜 (Zenless Zone Zero):** Installed from `简__1_.rar` into `static/models/jian/` with 8K ultra HD textures, 10 custom expressions, and dynamic hair & jacket physics.
  - **Changli / 长离 (Wuthering Waves / 鸣潮):** Installed from `长离带水印.zip` into `static/models/changli/` with four 4K textures, 7 expressions (`jacket`, `heart`, `angry`, `eyeroll`, `eyepatch`, `blush`, `dark`), and preview icon.
  - **Camellya / 椿 (Wuthering Waves):** Installed from `11月椿.zip` into `static/models/chun/` with three 4K textures, idle motion loop (`motions/idle.motion3.json`), 5 emotional expressions (`cry`, `heart`, `darkeyes`, `blush`, `dark`), and preview icon.
  - **Ruan Mei / 阮·梅 (Honkai: Star Rail):** Installed from `阮梅_Ruan_Mei__2_.zip` into `static/models/ruan-mei/` with four 8K ultra HD textures, custom stage scenery, traditional ruan instrument, and silk dress physics.
  - All 5 models are verified and registered in `MODEL_CATALOG` with local high-resolution preview images (`static/models/previews/`).
- **Core Architecture Bottleneck Audit & Optimizations (`solver.ts`, `tracker.ts`, `CanvasStage.svelte`, `riggingStore.svelte.ts`):**
  - **Eliminated Duplicate Landmark Solving:** In `tracker.ts`, eliminated the redundant second pass of `solveFaceLandmarks` by returning raw uncalibrated Euler angles (`rawYaw`, `rawPitch`, `rawRoll`) in a single pass, cutting landmark Math/CPU solve overhead by 50% on every tracking frame.
  - **GPU VRAM Texture Leak Purge:** High-resolution models with 4K/8K textures (such as Ruan Mei's 4x 8K textures taking > 1GB VRAM) now trigger full recursive baseTexture disposal (`model.destroy({ children: true, texture: true, baseTexture: true })`) and `PIXI.utils.clearTextureCache()` on avatar change, eliminating WebGL Context Loss and memory bloat.
  - **Debounced Main-Thread Persistence:** Added a 200ms debounce buffer to `rigging.persist()` to eliminate synchronous `localStorage.setItem` main-thread blocking during rapid slider interactions, backed by a `beforeunload` emergency flush.
- **Comprehensive Mobile UI/UX Responsiveness Overhaul (`ControlDock.svelte`, `AssistButton.svelte`, `CameraPip.svelte`, `LayerManagerModal.svelte`, `+page.svelte`):**
  - **Bottom Dock Bar:** Added horizontal touch panning (`overflow-x-auto touch-pan-x scrollbar-none`) with bounded max-width (`max-w-[calc(100vw-1rem)] sm:max-w-max`). Each dock item is safeguarded with `shrink-0`, 40px+ touch target hitboxes (`min-w-[40px] min-h-[40px]`), and hover tooltips hidden on touch viewports (`hidden sm:block`) to prevent persistent tooltip artifacts.
  - **Adaptive Popovers & Menus:** Upgraded all dock flyout menus (Device Selector, Cursor Tools, 3D Stage Environment, and Unified Expressions Studio) to switch seamlessly between `fixed` on mobile viewports (`bottom-20 left-1/2 -translate-x-1/2 w-[calc(100vw-1rem)] max-h-[78dvh] overflow-y-auto`) and `absolute` on desktop viewports, avoiding clipping issues when parent containers use overflow scroll.
  - **Unified Expressions Popover:** Added responsive horizontal pill scroll (`overflow-x-auto scrollbar-none flex-nowrap`) for category tabs and adaptive stacking for header status badges.
  - **Apple AssistiveTouch FAB & Menu:** Scaled button for mobile screens (`w-12 h-12 sm:w-14 sm:h-14`) and positioned menu card dynamically (`w-[calc(100vw-1.5rem)] sm:w-96 max-h-[85dvh] overflow-y-auto right-3 sm:right-16`) to guarantee zero horizontal clipping on narrow phone displays (360px-430px).
  - **Camera PiP Card:** Configured automatic minimization on mobile viewports (< 640px) on initial mount to keep the avatar stage unobstructed, and bounded expanded width to `w-[calc(100vw-1.5rem)] sm:w-80`.
  - **Header & Telemetry Badges:** Responsive text truncation and compact padding (`max-w-[calc(100vw-6rem)]`) to prevent overlap between telemetry badges and avatar watermark on mobile screens.

---

### Added & Enhanced
- **3D Humanoid Model Installation & Neuro-sama (Vedal's Version) (`models.ts`, `threeStage.ts`, `ThreeCanvasStage.svelte`):**
  - Integrated full 3D humanoid model `neuro-sama.fbx` from Vedal's VRChat release into `static/models/neurosama/` with 5 high-resolution textures (`body`, `clothes`, `secondary_clothes`, `neuro_hair`, `neuroexpresions`).
  - Added Three.js `FBXLoader` support and registered `neuro-sama` in `MODEL_3D_CATALOG` with dedicated SVG preview badge.
  - Configured 172-bone humanoid skeleton tracking (head, neck, eyes, torso, spine, hips, shoulders, arms, hands, dynamic hair & skirt flutter).
- **Face Recognition & Full Body Humanoid Rigging (`threeStage.ts`):**
  - Mapped real-time MediaPipe face recognition tracking: Head Yaw/Pitch/Roll, neck rotation, eye gaze pupils (`EyeL`/`EyeR`), and blendshapes.
  - Linked native VRChat morph targets (`vrc.blink`, `vrc.aa` mouth open, `vrc.ee` smile, `vrc.oh` surprised, `stars` star eyes, `blush` cheek glow).
  - Configured full-body breathing expansion and natural torso sway physics.
- **3D Quick-Action Studio HUD Toolbar with Pictorial Buttons (`ThreeCanvasStage.svelte`):**
  - Floating glassmorphism 3D HUD bar with pictorial buttons:
    - **Framing Kamera (3 Tombol Bergambar):** 🧍 `Full Body` (Kepala hingga sepatu), 🥋 `Half Body` (Pinggang ke atas), 👤 `Close-Up Face` (Fokus wajah ekspresi).
    - **Ekspresi Wajah (6 Tombol Bergambar):** ⭐ `Star Eyes`, 😊 `Senyum`, 😳 `Blush`, 😉 `Kedip`, 😮 `Terkejut`, 😐 `Netral`.
    - **Full Body Pose (5 Tombol Bergambar):** 👋 `Wave Hand`, ✌️ `Peace Sign`, 💖 `Heart Pose`, 💃 `Idle Sway`, 🧘 `Rest Pose`.
    - Collapse/expand minimize pill button ensuring zero interference with live stream overlay.
- **Real-Time On-Screen 60 FPS Telemetry HUD (`+page.svelte`, `CanvasStage.svelte`, `ThreeCanvasStage.svelte`):**
  - Relocated live FPS badge to top-right persistent header adjacent to the MiruNova Live badge, eliminating obstruction by the camera picture-in-picture window.
  - Added color-coded health status (Emerald $\ge$ 50 FPS, Amber $\ge$ 30 FPS, Rose < 30 FPS) and latency calculation `(Xms)`.
  - Unified 60 FPS calculation across both 2D Live2D and 3D Cat Three.js rendering loops with 500ms rolling window averaging.
- **README.md Overhaul & Competitive Pros Matrix (`README.md`):**
  - Added comprehensive comparison table ("🔥 Keunggulan Utama (Pros vs. Software VTuber Konvensional)") comparing MiruNova Live with VTube Studio, Warudo, and Animaze.
  - Spotlights zero-install lightweight browser access, 100% on-device privacy, built-in Web Audio DSP voice changer, multi-camera collab studio, and MIT open-source licensing.
- **Voice Changer & Audio DSP Studio Prominence (`README.md`):**
  - Elevated and detailed the real-time in-browser voice changer with 8 vocal presets, 4-second zero-feedback mic test buffer, live VU meter, and OBS Virtual Cable routing guide.
- **Runtime Error Resolution & Clean Event Handlers (`ControlDock.svelte`, `SettingsModal.svelte`):**
  - Tailed dev logs and resolved runtime `ReferenceError: isLangMenuOpen is not defined` across dock button click handlers.
  - Resolved `ReferenceError: Tv is not defined` in `SettingsModal.svelte`.
- **Comprehensive Facial Expression Engine (`CanvasStage.svelte`, `tracking.ts`, `riggingStore.svelte.ts`):**
  - Fixed Live2D expression discovery supporting both Cubism 3/4 (`def.Name`, `def.File`) and Cubism 2 (`def.name`, `def.file`) definitions.
  - Added index-based expression triggering (`currentModel.expression(idx)`) to ensure robust dispatching regardless of filename casing differences.
  - Implemented `setParam` helper supporting both Cubism 3/4 `core.setParameterValueById` and Cubism 2 `core.setParamFloat`.
  - Added alias mapping for universal expression presets (`smile`, `wink`, `surprise`/`surprised`, `pout`, `sad`/`cry`, `blush`, `angry`) with Vivian model triggers (`Param149` blush, `Param144` tears).
  - Expression preset overrides are applied in `beforeModelUpdate` after motion evaluation, preventing the 60 FPS tracking loop or idle motions from wiping facial expressions.
- **Full-Width Cards in Settings Modal (`SettingsModal.svelte`):**
  - Removed restrictive `max-w-4xl` and `max-w-2xl` constraints on Hardware & Perf, Storage & Backup, and About tabs, allowing cards to utilize the full width of the widescreen modal (`max-w-6xl xl:max-w-7xl`).
  - Added full light/dark theme-aware styling to the Storage & Backup configuration card.
- **Layer Manager Rich Sub-Metadata & High-Contrast Buttons (`LayerManagerModal.svelte`):**
  - Enriched layer rows with detailed sub-metadata: Cubism version, author attribution, stage coordinates `(X, Y)`, scale factor, bound camera device label, sync tracking status, and active props summary.
  - Redesigned amber (`+ Upload / Pasang Prop`) and purple (`Collab Studio`) toolbar buttons with solid, vibrant, WCAG AAA high-contrast styling for instant visibility in all themes.
- **Unified Flat Layer Manager & Far-Right Aligned Controls (`LayerManagerModal.svelte`):**
  - Unification of all scene elements (Host Avatar, Collab Guest 1, Collab Guest 2, Props, Shaders, Background) into a cohesive single layer stack with clear identifying names, thumbnails, and badges.
  - All action controls (Opacity slider, Eye visibility, Lock toggle, Reorder Up/Down, and Delete button) are pinned strictly flush to the far right edge.
  - Sticky mode renders full-height (`100vh`) docked to the right edge with spacious width (`w-[540px] max-w-[95vw]`).
- **Unrestricted Custom Prop Upload & Body Attachment (`LayerManagerModal.svelte`, `tracking.ts`, `riggingStore.svelte.ts`, `CanvasStage.svelte`):**
  - Added support for uploading custom image props (PNG, WebP, SVG, GIF, JPEG) without size limits.
  - Added body attachment system (`head` - follows head rotation & pitch, `body` - follows chest tilt & breath, `screen` - fixed floating HUD on stage).
  - Added on-canvas HUD for `select-layer` cursor mode with "✓ Terapkan" (Apply) and "✕ Batal" (Cancel) buttons.
- **Dual-Source Eyebrow Tracking & Live2D Parameter Preservation (`solver.ts`, `CanvasStage.svelte`):**
  - Enhanced eyebrow solver combining blendshapes and normalized geometric displacement with sensitivity scaling.
  - Added Vivian model linked eyebrow parameters (`Param`, `Param4`, `Param2`, `Param5`) to live update loop.
- **Theme-Aware High-Contrast Toast Notifications (`+page.svelte`):**
  - Updated toast notifications to dynamically adapt to light vs. dark themes with high-contrast background and glowing status indicator.
- **Beta Versioning:**
  - Standardized project version to `0.20.1-beta` across `package.json` and application UI badges.

---

## [0.20.0] - 2026-10-11

### Added & Enhanced
- **Multi-Camera Collab Studio for Up to 3 Streamers (`riggingStore.svelte.ts` & `CanvasStage.svelte`):**
  - Expanded Collab streaming engine to support up to 3 live avatars simultaneously (Host + Guest 1 + Guest 2).
  - Multi-camera device routing: Host, Guest 1, and Guest 2 can each bind to separate physical or virtual webcams (USB cam, integrated webcam, OBS Virtual Camera, DroidCam).
  - Added dedicated Guest 2 Live2D model instance with reactive transforms (left, center, right, pip), scale, custom offset X/Y, visibility, and alpha opacity controls.
  - Independent model selection and synchronized tracking toggles for all participants.
- **Flat Photoshop-Style Layer Manager & Widened Sticky Sidebar (`LayerManagerModal.svelte`):**
  - Completely flattened layer structure by eliminating nested sub-lists; all scene elements (host avatar, collab partners, active wearable props, background, shaders) are now treated as top-level first-class layers.
  - Added instant Delete button (`Trash2`) on every deletable layer row (collab partners and individual active accessories).
  - Widened sticky dock from 384px to 520px (`min(520px, 95vw)`) with full viewport height (`100vh`) for spacious, unconstrained slider control and hardware device names.
  - Direct opacity binding: range sliders reliably control element transparency across Pixi avatar alpha, CSS style opacity, and background layers.
- **Broadcast-Grade OBS Studio Command Center (`ObsModal.svelte`):**
  - Complete architectural overhaul into a professional streaming command center.
  - 5 resolution & streaming profiles: 1080p60 FHD, 1440p60 QHD, 4K60 UHD, Vertical 9:16 TikTok Live, 720p60 HD.
  - Live Browser Source URL generator with 1-click copy and sound feedback.
  - Pipeline toggle between native transparent alpha and chroma key green (#00FF00).
  - 1-click Custom CSS snippet generator for OBS Studio browser source setup.
  - Illustrated 4-step OBS setup walkthrough and real-time studio diagnostics HUD.
- **Model Catalog Thumbnail Quality & Modal Expansion (`ModelCatalogModal.svelte`):**
  - Enlarged thumbnail previews across all 6 catalog sections from `w-16`/`w-20` to `w-24 h-24 sm:w-28 sm:h-28 rounded-2xl` with contrast-optimized crisp rendering (`image-rendering: -webkit-optimize-contrast`).
  - Widened catalog dialog container to `max-w-6xl xl:max-w-7xl` for high-resolution visual previews.
- **Dual-Source Eyebrow Tracking (`solver.ts` & `tracker.ts`):**
  - Upgraded eyebrow solver to dual-source estimation: combines MediaPipe blendshape signals with geometric eye-to-eyebrow vertical displacement normalized by inter-pupillary distance.
  - Enabled expressive sorrow and anger eyebrow deformation via `browFormL` and `browFormR`.
- **High-Contrast Toast Notifications (`+page.svelte`):**
  - Upgraded floating toast styling to high-contrast opaque `bg-zinc-950 border-2 border-cyan-400 text-white shadow-[0_12px_40px_rgba(0,0,0,0.95)]` with bold typography and glowing status indicator.

---

## [0.19.0] - 2026-10-11

### Fixed & Enhanced
- **Camera Device Lock & Auto-Revert Prevention (`tracker.ts`):**
  - Resolved issue where switching camera device repeatedly reverted or fell back to virtual/default webcams (such as Poco F7).
  - Enforced `{ exact: deviceId }` constraint on preferred hardware selection; guarded internal track settings listener to prevent overriding explicitly selected camera devices.
  - Synchronized immediate camera label resolution upon selection.
- **Layer Manager Sticky Full-Height Dock & Windowed Corner Resizer (`LayerManagerModal.svelte`):**
  - When in `sticky` mode: Now renders full-height (`h-screen`) docked flush to the right edge (`top-0 right-0`) with clean border integration.
  - When in `windowed` mode: Features interactive pointer drag resizing handle on bottom-right corner (`rigging.layerWindowWidth`, `rigging.layerWindowHeight`).
  - Solved Drag-and-Drop vs Slider conflict: Isolated HTML5 `draggable` attribute strictly to the `GripVertical` icon, preventing range slider thumbs (opacity & accessory offsets) from triggering drag-and-drop.
- **Facial Expressions 60 FPS Tracking Injection (`CanvasStage.svelte`):**
  - Fixed expression variations (Smile, Wink, Surprise, Pout, Sad, Blush, Angry) being overwritten by 0 values in the 60 FPS tracking loop.
  - Injected `EXPRESSION_PRESETS` parameter overrides into `applyModelTracking()` before `core.setParameterValueById()`.
  - Added native fallback handling for `blush` and `angry` expression parameters.
- **1-Click Auto-Download & Web Model Auto-Installer (`ModelCatalogModal.svelte` & `models.ts`):**
  - Mapped valid `modelUrl` configurations to all 10 items in `BOOTH_SHOWCASE_CATALOG`.
  - Added in-memory `downloadAndInstallFromUrl()` using `fetch` and `fflate` to unpack and mount Live2D models directly from web links without opening manual file pickers.
  - Added 1-click Web URL auto-installer bar with real-time download and extraction progress banner.

---

## [0.18.0] - 2026-10-11

### Added & Enhanced
- **Floating Windowed & Sticky Layer Manager Studio (Non-Modal UX):**
  - Removed full-screen backdrop overlay completely, allowing streamers to manipulate layers, accessories, and collab models live with an unobstructed canvas stage.
  - Dual view modes: freely draggable floating card (`windowed`) with pointer capture header dragging, and docked right-sidebar panel (`sticky`).
  - Header controls for minimize/expand (`rigging.isLayerMinimized`) and sticky/windowed toggle (`rigging.toggleLayerManagerViewMode()`).
  - Native HTML5 drag-and-drop layer reordering with `GripVertical` handle and drop target highlighting.
  - Layer row selection (`rigging.selectLayerElement(id)`) synchronized with canvas interactions.
- **Cursor Tool Mode Selector in Control Dock:**
  - Replaced static hand tracking toggle with a 3-mode tool selector (`pan`, `select-layer`, `hand-tracking`).
  - **Mode Pan (`pan`):** Smooth canvas stage and avatar panning with center-anchored scroll zoom.
  - **Mode Move Layer & Props (`select-layer`):** Click and drag any element directly on the canvas—Host avatar, Collab partner (`collabOffsetX`/`collabOffsetY`), or Wearable Accessories (`offsetX`/`offsetY`).
  - **Mode Hand Tracking (`hand-tracking`):** MediaPipe AI gesture and arm tracking.
  - Floating canvas HUD banner displaying the currently selected active element.
- **Assist Button Geometry Tuning (30% Body Peek & 8px Margin):**
  - Adjusted idle peeking geometry to show exactly 30% of the button body (`translate-x-[70%]`).
  - Set margin right on hover/active to 8px (`hover:-translate-x-2` / `-translate-x-2`).
- **Smooth Menu Hiding & Restoring Transitions:**
  - Applied Svelte transition animations (`transition:fly` and `transition:fade` with `cubicOut` easing) for dock hiding (`H`), restore pill expansion, assist popovers, and tool menus.
- **Test Suite Expansion:**
  - Added unit tests for drag-and-drop layer reordering, cursor tool mode switching, element selection, and view mode toggling in `tests/layers.test.ts` (56/56 tests passing across 11 files).

---

## [0.17.0] - 2026-10-11

### Added & Enhanced
- **Resilient Windows Discrete GPU Camera Hardware Fallback (`tracker.ts`):**
  - Resolved `"Perangkat kamera (webcam) yang dipilih tidak ditemukan atau telah terputus"` errors occurring when switching to dedicated discrete GPU mode (NVIDIA GeForce GTX 1650 Ti / RTX series).
  - Removed strict mobile-only `facingMode: 'user'` constraint which caused Windows camera driver crashes.
  - Implemented 4-tier graceful fallback: Tier 1 Ideal constraints $\to$ Tier 2 deviceId only without constraints $\to$ Tier 3 Universal `{ video: true, audio: false }` $\to$ Tier 4 exhaustive hardware sweep of all enumerated video devices.
  - Added automatic stale camera deviceId cleanup in browser storage on device disconnection.
- **In-Memory ZIP Decompression (`fflate`) & 1-Click BOOTH Model Installer (`ModelCatalogModal.svelte`):**
  - Integrated ultra-fast `fflate` engine to unpack downloaded BOOTH Live2D `.zip` archives directly in browser RAM in $<200$ms with zero disk I/O.
  - Automatically parses `.model3.json` inside the archive, maps all relative textures, moc3, physics, and pose files to memory blob URLs, and mounts the model instantly.
  - 1-Click direct mounting for all models with direct URLs (Live2D official samples & Neuro-sama) without opening any file dialogs.
  - Added native drag-and-drop support for `.zip` files anywhere onto the Model Catalog modal.
- **Photoshop-Style Layer Manager & Stage Studio (`LayerManagerModal.svelte` & `+page.svelte`):**
  - Complete Photoshop-style layer stack containing 5 customizable layers:
    1. **Efek & Filter Layar (Shader FX)** (Vignette, Scanlines, CRT phosphor glow, Blur).
    2. **Aksesoris & Props Avatar** (Wearable VTuber props).
    3. **Avatar Collab (Partner Guest)** (Guest streamer model).
    4. **Avatar Utama (Host)** (Tracked primary Live2D / 3D model).
    5. **Latar Belakang Panggung** (Background styling).
  - Interactive live miniature thumbnail previews showing active background colors/swatches, model avatars, active accessory counts, and screen shaders.
  - Layer reordering (Up / Down) that directly controls WebGL (`app.stage.sortableChildren`) and DOM Z-index stacking.
  - Independent layer visibility toggles (`Eye` / `EyeOff`) and smooth 0%–100% opacity sliders.
  - Layer lock toggle (`Lock` / `Unlock`) preventing accidental changes.
  - Accessible via global hotkey `P`, Control Dock button, and Assist Menu shortcut.
- **VTuber Accessories & Props Attach System (`CanvasStage.svelte`):**
  - 10 interactive wearable accessories:
    - **Sunglasses (Thug Life Shades)** (`🕶️`), **Nekomimi Cat Ears** (`🐱`), **RGB Gaming Headset** (`🎧`), **Magician Top Hat** (`🎩`), **Sakura Hairpin** (`🌸`), **Royalty Golden Crown** (`👑`), **Studio Broadcast Mic** (`🎙️`), **Gentleman Mustache** (`🥸`), **Angel Golden Halo** (`😇`), **Floating Heart Aura** (`💖`).
  - Anchored directly to avatar coordinates with dynamic scaling and rotation driven by MediaPipe head tilt (`ParamAngleZ`), turning (`ParamAngleX`), and nod (`ParamAngleY`).
  - Fine-tuning controls for item scale (0.5x–2.0x), horizontal offset X (-200px to +200px), and vertical offset Y (-350px to +200px).
- **Mode Collab Streamer (Dual Avatar In-Browser Streaming):**
  - Multi-avatar streaming engine rendering two Live2D models simultaneously in the same browser window with zero additional software.
  - Layout presets: Side-by-Side Left, Side-by-Side Right, and Picture-in-Picture (PiP).
  - Synchronized face tracking toggle or autonomous natural breathing and head sway loops for the partner avatar.
  - Independent partner scale, position offsets, and individual opacity controls.
- **Apple iPhone AssistiveTouch Assist Button UI/UX Overhaul (`AssistButton.svelte`):**
  - Strictly circular geometry (`w-12 h-12 rounded-full overflow-hidden aspect-square`) with concentric rings, eliminating rectangular backdrop-blur filter artifacts.
  - Idle state peeks only 10% body off the right screen edge (`translate-x-[90%]`), sliding smoothly to 100% visible with a 16px right margin gap (`hover:-translate-x-4` / `-translate-x-4`).
  - Added one-click launcher for Photoshop Layer Manager & Collab Mode inside the Assist Menu.
- **Automated Regression Test Suite:**
  - Added `tests/layers.test.ts` covering layer stacking order, reordering, visibility, opacity clamping, accessories toggling, and Collab mode configuration (53/53 tests passing across 11 test suites).
  - Clean `svelte-check` validation with 0 errors and 0 warnings.

---

## [0.16.0] - 2026-10-11

### Added & Enhanced
- **Independent Eye Wink Tracking Engine (`Wink Sebelah Mata`):**
  - Resolved eyelid conflict where MediaPipe ML blendshapes were being overridden by geometric EAR calculations.
  - Implemented asymmetric wink isolation (`blinkDiff >= 0.12 && blinkL >= 0.28` or `blinkL >= 0.45 && blinkR <= 0.35`) in `solver.ts`.
  - Enforced wide-open clamp (`1.0`) on the opposite eye to prevent squinting/drooping during single-eye winks.
  - Added cute anime wink smile activation (`ParamEyeSmile = 1.0`) when winking.
  - Automatically suppresses internal Cubism auto-blink generator during active webcam tracking in `CanvasStage.svelte`.
  - Added toggle switches for **Wink Sebelah Mata (Kedip Mandiri)** and **Cermin Mata VTuber (Mirror Eyes)** in Settings > Tracking.
- **On-Screen Live FPS & Frame Latency HUD:**
  - Added real-time smoothed FPS & frame time (`ms`) pill counter floating in the top-right corner of `CanvasStage.svelte`.
  - Color-coded indicator: Emerald (>= 55 FPS), Amber (30–54 FPS), Rose (< 30 FPS).
  - Wired into `riggingStore.showFpsCounter` with persistent localStorage support and toggle switch in Settings > Hardware & Telemetry.
- **Fluid Bouncy Anime Loading Screen & Fluffy Web Audio SFX:**
  - Replaced generic circular spinner with a fluid anime orb loading card featuring floating sparkle stars, pulsing audio equalizer waves, and glowing borders.
  - Synthesized fluffy procedural Web Audio sound effects:
    - `'loadingStart'`: Dreamy rising sine wave arpeggio on model load initialization.
    - `'loadingSuccess'`: Crystalline sparkle chime upon complete texture attachment.
- **Official Live2D Inc. Free Samples & Neuro-sama AI VTuber:**
  - Added official free sample models from `https://www.live2d.com/en/learn/sample/`:
    - **Shizuku (しずく)** — Live2D Inc. Classic Idol.
    - **Chitose (千歳)** — Live2D Inc. Schoolgirl.
    - **Koharu (こはる)** — Live2D Inc. SD Chibi Character.
    - **Epsilon (イプシロン)** — Live2D Inc. Sci-Fi Mech Android.
    - **Tororo (トロロ)** — Live2D Inc. Cute Animal Mascot.
    - **Hibiki (ヒビキ)** — Live2D Inc. Energetic Boy.
  - Added **Neuro-sama (ネウロ様)**: AI VTuber tribute honoring Vedal987 & Anny.
  - Created high-quality SVG vector preview cards in `static/models/previews/`.
- **BOOTH.pm Tab Reorganization & Universal Local Folder Installer:**
  - Moved pre-installed BOOTH models (`Mihari`, `Vivian`) from "2D Live2D" to a dedicated "Model Siap Pakai" section in the BOOTH.pm tab.
  - Solved "Pasang Model Ini" 404 texture bug by implementing an in-memory directory & multi-file picker (`webkitdirectory` / `multiple`) that parses `.model3.json` and remaps all relative moc, texture, physics, and pose files to memory blob URLs with zero missing texture errors.
- **Visual Thumbnail Cards for Background Styles:**
  - Upgraded background style selectors in both `SettingsModal.svelte` and `ThemeModal.svelte` into visual preview cards showing CSS patterns for Solid (live hex swatch), Cyber Mesh, Studio Blueprint, Dot Matrix, Cosmic Space Flow, Alpha Transparent (OBS checkerboard), Chroma Green, and Custom Wallpaper.

---

## [0.15.0] - 2026-10-11

### Fixed
- **Live2D Face Tracking Event Hook Restoration:**
  - Fixed an issue where Live2D face tracking appeared stopped after updating model loop handlers.
  - Restored `model.internalModel.on('beforeModelUpdate', applyModelTracking)` in `CanvasStage.svelte`. In the Cubism 4 runtime, parameters must be injected before `coreModel.update()` computes vertex transforms, ensuring seamless, zero-lag facial tracking.

### Added & Enhanced
- **Categorized BOOTH.pm Model Catalog & Direct Installer Integration:**
  - Grouped the 10 curated BOOTH models in `ModelCatalogModal.svelte` into distinct category clusters:
    - **HoYoverse & Kuro Games Fanmade:** Belle / Rin (ZZZ), Changli (Wuthering Waves), Fugue / Tingyun SP (Honkai: Star Rail), Camellya (Wuthering Waves).
    - **Original Anime & Kawaii Girls:** Villhaze, Roxy, Ice Girl, Tsukimi Yachiyo.
    - **VTube Studio Community Favorites:** Hoshino Nya, KE.
  - Added filter pills for instant category filtering.
  - Added direct **"Pasang Model Ini"** button on every card, guiding users to select their extracted `.model3.json` file with full character metadata preservation and active slot indication.
- **Apple iPhone AssistiveTouch Peeking & Interactive Continuous Zoom Slider:**
  - Redesigned `AssistButton.svelte` to feature authentic edge-docking:
    - Anchored against the right screen edge with ~20% of its circular body peeking off-screen when idle (`translate-x-[20%]`), sliding smoothly into full view on hover (`hover:translate-x-0`).
    - Strictly circular geometry (`rounded-full aspect-square w-12 h-12`) with concentric AssistiveTouch rings and no boxy artifacts.
    - Added an interactive continuous zoom range slider (`30%` to `250%`) with live percentage readout, plus quick `-`, `100%`, `+` step buttons.
- **SettingsModal Tab Separation & Modern Theme UI/UX Revamp:**
  - Separated **Theme (`tab_theme`)** and **Stage (`tab_stage`)** into distinct tabs in `SettingsModal.svelte`.
  - Removed duplicate icons across all tabs and header sections.
  - Completely revamped the Theme Selector UI/UX:
    - Realistic mini UI mockups for all 13 color palettes showing real-time background, surface cards, accent stars, active toggles, and dock strips.
    - Full contrast adaptation for light and dark modes with high-legibility typography.
    - Palette swatches with hex readouts for Background, Surface, Accent, Border, and Text.
    - Dedicated Custom Studio with 6 one-click presets (🌸 Sakura Bloom, 🍵 Matcha Zen, ⚡ Cyber Neon, 🌌 Cosmic Violet, 🍊 Sunset Amber, 💎 Arctic Ice) and live color pickers.
  - Enhanced Stage tab with background style selection, solid color picker, shader screen effects, camera framing, square framing, studio SFX volume, and language selector.

---

## [0.14.0] - 2026-10-11

### Added
- **BOOTH.pm Curated Showcase Gallery (10 Models with Full Creator Credits):**
  - Added dedicated BOOTH.pm gallery tab in `ModelCatalogModal.svelte` featuring 10 popular community models:
    - **Villhaze (ヴィルヘイズ)** by **koiyume** (BOOTH #5408293)
    - **Roxy (ロキシー)** by **koiyume** (BOOTH #5411426)
    - **Ice Girl (氷の少女)** by **TianYeLuLu** (BOOTH #5975192, commercial streaming permitted with credit)
    - **Belle / Rin (リン - ZZZ)** rigged by **pbsddy**, art by **shinan** (BOOTH #5399636)
    - **Tsukimi Yachiyo (月見ヤチヨ)** by **SnowBear Project** (BOOTH #8034348)
    - **KE (Live2D Free Model)** by **Sennyu** (BOOTH #7654174)
    - **Hoshino Nya (星乃にゃ)** rigged by **skiyoshi**, art by **サッカウキツ** (BOOTH #3988142)
    - **Changli (长离 - 鳴潮)** by **shibutani** (BOOTH #7483530)
    - **Fugue / Tingyun (帰忘の流離人 - 崩壊：スターレイル)** by **shibutani** (BOOTH #6360847)
    - **Camellya (椿 - 鳴潮)** by **shibutani** (BOOTH #6313490)
  - Full author attribution, licensing/copyright guidelines, high-res pximg previews, and 1-click external BOOTH jump links.
  - Added unit test validation suite in `tests/models.test.ts`.

### Changed
- **Apple iPhone AssistiveTouch Floating Assist Button (Right Edge):**
  - Redesigned the Assist Button to match the iconic Apple iOS AssistiveTouch ergonomics:
    - Positioned as a floating circular button on the **right** screen edge (`fixed right-4 top-1/2 -translate-y-1/2`).
    - Compact, translucent resting state (`opacity-75`) with frosted glass backdrop blur and concentric indicator rings.
    - Expanding popover anchored directly beside the button provides quick stage zoom controls (+, -, 100%), framing presets (Close-Up, Half-Body, Full-Body), center avatar reset, and instant face tracking calibration.
    - Click-outside auto-dismiss and pin toggle to keep open during streaming.

### Optimized & Fixed
- **Tracker Latency Calculation Throttling (Eliminated 45x Re-render Storm/sec):**
  - Fixed a critical throttling bug in `src/lib/core/tracker.ts` where `latencyMs` recalculation stayed active on every frame for 750ms consecutive per second.
  - Separated `lastLatencyCalcTime` from `lastFpsCalcTime`, ensuring `latencyMs` updates cleanly at 250ms intervals without thrashing Svelte reactive dependencies.
- **Resilient Camera Device ID Resolution & GPU Switching Fallback:**
  - Resolved "Perangkat kamera (webcam) yang dipilih tidak ditemukan atau telah terputus" error when users switch between integrated and discrete NVIDIA GPUs.
  - Validates stored `cameraDeviceId` against currently enumerated hardware devices on startup; if a deviceId hash becomes stale after GPU or browser profile switches, it seamlessly recovers using label matching or default camera fallback.
  - Automatically updates `cameraDeviceId` to the active hardware track's real deviceId upon successful stream initialization.
- **Live2D Single-Pass Tracking Optimization:**
  - Streamlined `applyModelTracking` in `CanvasStage.svelte` to run exclusively on `afterModelUpdate`, eliminating 50% duplicate parameter calculation and Cubism core API calls per frame.
  - Cached `hiddenPartIds` checks to eliminate redundant loop overhead and garbage collection pressure.
- **Audio VU Meter Reactive Throttling:**
  - Throttled microphone volume metering updates in `src/lib/core/audio.ts` from 60 FPS down to 60ms (~16 FPS), reducing Svelte 5 reactive effect flushes by 75% when mic is active.
- **Eliminated CSS Layout Thrashing in Rigging Inspector:**
  - Removed `transition-all duration-75` from live parameter slider progress bars in `RiggingPreviewPanel.svelte`, preventing browser CSS transition animations from fighting against 60 FPS real-time tracking data.

---

## [0.13.0] - 2026-10-11

### Added
- **Full Internationalization (i18n) Parity & Locales:**
  - Added full translation key parity across English (`en`), Indonesian (`id`), and Japanese (`ja`) for all keyboard shortcut titles (`shortcut_title_*`), category badges (`badge_*`), Assist Button controls (`assist_*`), and Expression selector labels (`expressions_*`).
  - Added dedicated test suite `tests/i18n.test.ts` verifying 100% dictionary key coverage and translation resolution across all supported locales (123 test assertions).
- **Universal Daylight (Light) Theme Adaptation Across All Studio Modals & Drawers:**
  - Integrated dynamic `$derived(isLightTheme)` theming across all remaining dialogs and panels:
    - `ShortcutGuideModal.svelte` — daylight card surfaces, light keyboard cap keys (`kbd`), and high-contrast typography.
    - `SettingsModal.svelte` — daylight container shell, tabs, headers, and form controls.
    - `ModelCatalogModal.svelte` — daylight dialog shell, tabs, BOOTH showcase banner, and model selection cards.
    - `ObsModal.svelte` — daylight transparency picker, direct URL bar, and OBS setup instructions card.
    - `RiggingPreviewPanel.svelte` — daylight drawer and windowed mode headers, borders, and parameter cards.
    - `AssistButton.svelte` — daylight slide-out dock, zoom buttons, framing presets, and peeking tab handle.
    - `CameraPip.svelte` — daylight picture-in-picture stream header, camera switcher dropdown, and FPS/latency metrics footer.
    - `ControlDock.svelte` — daylight dock bar, dividers, and floating popover menus.

### Fixed
- **Popover Stacking & Hover Tooltip Obscuring Bug in Control Dock:**
  - Resolved menu obscuring bug where button hover tooltips at `-top-10` rendered on top of open dropdown menus (Language Switcher, Device Selector, Expression Selector).
  - Hover tooltips now immediately hide (`opacity-0`) whenever their corresponding popovers are active.
  - Raised popover dropdown z-index to `z-[85]` and clamped widths to `max-w-[calc(100vw-1.5rem)]` with `z-[80]` backdrop click-closers to prevent off-screen clipping.

---

## [0.12.0] - 2026-10-11

### Added
- **Studio Assist Button (Slide-Out Left Screen Edge):**
  - Consolidated zoom controls into an elegant, floating **Assist Button** anchored on the left screen edge (`-translate-x-[calc(100%-28px)]`).
  - 10% peeking tab with glowing cyan indicator and vertical `ASSIST` text peeks out when idle, sliding out smoothly on hover.
  - Complete stage control palette: Zoom In (+), Zoom Out (-), 100% Reset, Reset Center [0], Framing presets (Close-Up Face, Half-Body, Full-Body), Center Pose Calibration [C], and Quick Expression chips.
- **Dynamic Live2D Model Expression Selector:**
  - Added Expression Variation Selector button to the main Control Dock displaying active expression badge and total variation count (`✨ {n} Variasi`).
  - Dynamic discovery of expression files from Live2D `.model3.json` (`expressionManager.definitions` or `settings.expressions`) with fallback to anime presets (Smile, Wink, Shock, Pout, Sad).
  - Floating expression popover with instant trigger, reset button, and global hotkey `E` to cycle expressions during live streams.
- **Instant Winking Engine & Mirror Eyes (`mirrorEyes`):**
  - Re-tuned asymmetric wink threshold (`blinkDiff >= 0.12 && blinkL >= 0.28`) snapping directly to 0.0 with 0-lag alpha in parameter smoother.
  - Automatic `ParamEyeSmile = 1.0` anime wink expression trigger.
  - VTuber mirror eye tracking mode (`mirrorEyes = true`) mapping camera-left eye to avatar viewer-left eye for natural webcam mirroring.
  - Dual hook on `beforeModelUpdate` AND `afterModelUpdate` in `CanvasStage.svelte` guaranteeing tracking values override internal Live2D idle motion curves and auto-blink controllers.
- **Overhauled Theme Selector UI/UX (ThemeModal):**
  - Studio-grade theme selector with realistic **Mini-UI Preview Mockups** for all 13 themes rendering actual background, surface, accent, and button styling.
  - 5-color complete palette strip showing exact hex codes for Background, Surface, Accent, Border, and Text.
  - Categorized filter tabs: "Semua Tema (13)", "Daylight / Terang (4)", "Dark & Cyber (8)", and "Custom Studio (PRO)".
  - Custom Theme Studio with live interactive card preview and 6 curated one-click presets (🌸 Sakura Bloom, 🍵 Matcha Zen, ⚡ Cyber Neon, 🌌 Cosmic Violet, 🍊 Sunset Amber, 💎 Arctic Ice).
- **High-Contrast Theme Adaptability in Modals & Scoped CSS:**
  - Scoped button hover rules in `layout.css`, removing destructive blanket `!important` text and badge overrides that caused illegible text on light themes.
  - Overhauled `AboutModal.svelte` and `TosModal.svelte` to dynamically adapt to daylight and dark themes with crisp high-contrast cards and typography.
  - Prominent creator spotlight for **Rifky (@RifkyA911)**, repository star link, and desktop PWA status.
- **Procedural Web Audio SFX Engine Polish:**
  - Added procedural `hover` micro-blip (520-640Hz) and expression chime.
  - Auto-resuming AudioContext on user interaction with boosted master gain (0.75x).

---

## [0.11.0] - 2026-10-11

### Added
- **Dedicated About & Terms of Service (ToS) Modals:**
  - Created standalone, high-end studio modal `AboutModal.svelte` prominently crediting lead architect & creator **Rifky (@RifkyA911)**, linking directly to GitHub repository (`https://github.com/RifkyA911/mirunova-live`), and offering PWA desktop installation.
  - Created `TosModal.svelte` formalizing the **100% Client-Side Privacy Guarantee** (zero cloud telemetry, 100% local RAM/WebGL/WASM processing) and **Commercial VTuber Live Streaming Freedom** (100% royalty-free broadcast rights on YouTube, Twitch, Kick, Bilibili, TikTok).
  - Dedicated access buttons on the Control Dock and Settings Modal.
- **Discrete GPU WebGL Acceleration & Hardware Routing Guide:**
  - Configured WebGL contexts in Three.js and Pixi.js stages with `powerPreference: 'high-performance'`.
  - Added comprehensive step-by-step Windows Graphics Settings & NVIDIA Control Panel assignment cards in Settings Modal explaining dual-GPU routing for laptops/desktops.
- **Mouth Tracking Sensitivity & Speech Boost Mode:**
  - High sensitivity speech boost mode with 1.65x multiplier and geometric lip separation fallback to ensure responsive mouth movement during fast speech or whisper phonemes.
  - Granular mouth sensitivity slider (0.5x to 2.5x) persisted in `RiggingStore` and `localStorage`.
- **Interactive Microphone & DSP Voice Conversion Test:**
  - 4-second audio recorder widget in Settings Modal allowing streamers to record voice samples.
  - Zero-feedback-loop playback for "Raw Mic Voice" (hardware test) and "Converted DSP Voice" (active voice changer preview).
- **Procedural UI Sound Effects (SFX) Engine:**
  - Built zero-latency synthesized procedural Web Audio effects in `src/lib/core/sfx.ts` (clicks, camera toggle, neutral calibration, modal open/close, theme switch, shutter).
  - Added SFX toggle and volume slider in Settings Modal Tab 4 with persistent configuration.
- **Progressive Web App (PWA) Desktop Ready:**
  - Added `static/favicon.svg` with cute anime cat visor motif.
  - Enriched `manifest.webmanifest` and service worker `sw.js` for desktop app install prompts and standalone window operation.

---

## [0.10.0] - 2026-10-10

### Added
- **Live Camera & Microphone Input Hardware Selectors:**
  - Dynamic hardware device enumeration with fallback permission handshake to retrieve accurate device names (OBS Virtual Camera, Logitech C920, USB Mics, etc.).
  - Real-time device switching without page reloads across 3 locations:
    - **Settings Modal (`Device` Tab):** Full configuration with resolution profiles (1080p, 720p, 480p), mic volume gain, monitor toggle, and DSP presets.
    - **Camera PIP Viewer:** Integrated compact dropdown and rescan button right on the floating camera window.
    - **Control Dock Quick Popover:** Accessible via the dock slider icon with live audio VU meter and immediate hot-swapping.
  - Automatic peripheral re-scan with native `devicechange` listener when USB cameras/microphones are plugged in or disconnected.
  - Global hotkey `V` to quickly toggle microphone mute/active state.
- **Full Visual UI Color Theme System:**
  - Fixed theme application bug where themes were not altering Tailwind component classes.
  - Added comprehensive CSS theme overrides for `.theme-cyber`, `.theme-midnight`, `.theme-synthwave`, and `.theme-monochrome` transforming navigation bars, control docks, modals, cards, borders, buttons, and glowing accents.
  - Connected canvas backdrop color dynamically to the selected UI theme palette.
  - Hotkeys `1`–`4` for instant theme cycling with persistent storage.

---

## [0.9.0] - 2026-10-10

### Added
- **Mihari Official Live2D Model (`Mihari_V1`):**
  - High-tier Live2D Cubism model with dynamic physics hair ribbons, ponytails, multi-layer eyes, mouth phonemes, and full motion set.
  - Sanitized model JSON file references (stripped legacy leading whitespace).
  - Designed custom preview SVG card representation for instant visual identification.
- **Avatar Framing Presets & Body Parts Inspector:**
  - One-click framing presets: Full Body, Half Body (Bust-Up), and Close-Up for instant streaming framing.
  - Model Parts Visibility Inspector: Dynamically queries Live2D `_partIds` to allow toggling visibility and opacity for individual avatar layers.
- **Streamer Square Frame with Organic Overflow Edge Fade:**
  - 1:1 Square Frame Box layout option for clean, framed stream avatars.
  - Smooth top/left/right/bottom organic edge fading gradient mask (`square-frame-fade`) to prevent harsh square boundary cutoffs.
- **Inverted Pitch (Y) & Inverted Yaw (X) Camera Calibration:**
  - Toggle inversion for vertical look tilt (fixing down/up inverted tilt / "ndiluk") and horizontal yaw.
  - Quick-preset tracking calibrations: Responsive (low-end 30fps webcam), Balanced (default), and Ultra Smooth (cinematic).
- **Real Web Audio API DSP Voice Engine:**
  - Native browser `AudioContext` microphone engine with live input selector, volume gain slider, and real-time VU meter.
  - Local DSP voice filters (Natural, Anime Treble, Radio Broadcaster, Walkie-Talkie, Warm Podcast).
  - External Neural AI Voice Guide: Architectural blueprint for W-Okada AI Voice Changer (RVC v2 + CUDA) paired with VB-Cable virtual audio routing.
- **Draggable & Resizable Windowed Rigging Inspector:**
  - Topbar pointer-captured dragging clamped smoothly within viewport boundaries.
  - Native resizable width and height with enforced min/max limits (`min-w-[320px]`, `max-w-[750px]`, `min-h-[380px]`, `max-h-[850px]`).
- **2X Wider Dialog Modals:**
  - Expanded all dialog modals (`SettingsModal`, `ModelCatalogModal`, `ShortcutGuideModal`, `ThemeModal`, `ObsModal`) to `max-w-5xl` / `xl:max-w-6xl` with responsive multi-column layouts.
- **PWA & Mobile Viewport Readiness:**
  - Added `manifest.webmanifest`, standalone service worker (`sw.js`), mobile touch viewport rules, and horizontal scrolling dock for mobile streamers.
- **About & Terms of Service (ToS) Legal Declaration:**
  - 100% Free & Open Source Software under MIT/Apache 2.0 license.
  - Zero telemetry, zero cloud tracking, and 100% local client-side processing guarantee.

### Changed & Fixed
- **Purged Gimmick Claims & Slop:**
  - Removed all misleading marketing claims about WebGL utilizing "Tensor Cores". Replaced with factual WebGL GPU driver reporting and OS scheduling guides.
  - Removed "PRO" badges and tier-list labels; all features remain 100% free and open-source.
- **Repositioned Screen Lock Button:**
  - Moved the floating unlock screen pill from top center to the discreet bottom-left corner (`bottom-4 left-4`) with hover-only tooltip.
- **Reactive Autosave:**
  - Integrated Svelte 5 `$effect` watcher on `RiggingStore` ensuring all theme, tracking, inversion, and audio configurations automatically persist to `localStorage`.
- **Complete i18n Dictionary:**
  - Zero missing keys across Indonesian (`id`), English (`en`), and Japanese (`ja`).

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
