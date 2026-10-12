<div align="center">

![MiruNova Live Hero Banner](./static/hero.svg)

# MiruNova Live (見るNova)
**Next-Generation, Zero-Cost, In-Browser Live2D & 3D Real-Time Vision Tracker**

[![Creator](https://img.shields.io/badge/Created_by-Rifky_(@RifkyA911)-ec4899?style=flat-square&logo=github)](https://github.com/RifkyA911)
[![Repository](https://img.shields.io/badge/GitHub-RifkyA911%2Fmirunova--live-blue?style=flat-square&logo=github)](https://github.com/RifkyA911/mirunova-live)
[![Bun](https://img.shields.io/badge/Bun-1.3-fbf0df?style=flat-square&logo=bun)](https://bun.sh)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-3.0-ff3e00?style=flat-square&logo=svelte)](https://svelte.dev)
[![Svelte 5](https://img.shields.io/badge/Svelte-5.x-ff3e00?style=flat-square&logo=svelte)](https://svelte.dev)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Vision_WASM-06b6d4?style=flat-square&logo=google)](https://developers.google.com/mediapipe)
[![Live2D](https://img.shields.io/badge/Live2D-Cubism_3%2F4-8b5cf6?style=flat-square)](https://www.live2d.com)
[![Three.js](https://img.shields.io/badge/Three.js-0.186-049ef4?style=flat-square&logo=three.js)](https://threejs.org)
[![PWA Ready](https://img.shields.io/badge/PWA-Desktop_App_Ready-emerald?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](LICENSE)
[![Zero-Cost](https://img.shields.io/badge/100%25-Free_%26_Open_Source-emerald?style=flat-square)](#-zero-cost--privacy-mandate)

*Tags: `#live2d` `#vtuber` `#face-tracking` `#hand-tracking` `#mediapipe` `#threejs` `#svelte5` `#bun` `#pixijs` `#webgl` `#zero-cost` `#obs-studio` `#pwa`*

</div>

---

## 🌟 Overview & Creator Credits

**MiruNova Live** is an ultra-lightweight, 100% client-side web application for real-time Live2D & 3D avatar animation, facial tracking, and audio DSP processing. Designed and architected by **Rifky ([@RifkyA911](https://github.com/RifkyA911))**, MiruNova Live delivers studio-grade VTuber capabilities straight to your browser without heavyweight native desktop installations, watermarks, or paid cloud APIs.

* **GitHub Repository:** [https://github.com/RifkyA911/mirunova-live](https://github.com/RifkyA911/mirunova-live)
* **Lead Architect & Creator:** [Rifky (@RifkyA911)](https://github.com/RifkyA911)
* **Tech Stack:** Bun 1.3, SvelteKit 3 / Svelte 5 (Runes), Google MediaPipe Vision (WASM SIMD), Pixi.js v7 with Cubism SDK, Three.js 0.186, Web Audio API DSP, Tailwind CSS.

---

## 🔥 Keunggulan Utama (Pros vs. Software VTuber Konvensional)

MiruNova Live dibangun dari nol untuk mengatasi kelemahan mendasar software VTuber desktop konvensional (VTube Studio, Warudo, Animaze, 3Tene):

| Fitur / Parameter | MiruNova Live (Melihat Nova) 🌟 | Software Desktop Konvensional (VTS / Warudo) 📦 |
| :--- | :--- | :--- |
| **Ukuran Instalasi** | **0 MB (Instant Web / PWA Desktop)** | 1.5 GB – 5.0 GB installer berat di Steam / Windows |
| **Voice Changer** | **Bawaan Browser Real-Time (Web Audio DSP)** | Perlu software pihak ketiga terpisah (Clownfish, VoicemeMod, RVC) |
| **Kebutuhan Hardware** | **Webcam Biasa Laptop / USB (720p/1080p)** | Sering membutuhkan iPhone TrueDepth kamera ($500+) |
| **Collab Multi-Avatar** | **Hingga 3 Streamer dalam 1 Tab Browser** | Harus membuka multiple instance aplikasi (RAM boros) |
| **Multi-Camera Device Routing** | **Bebas pilih kamera per avatar (Host vs Tamu)** | Terkunci pada 1 device kamera global |
| **Impor Model BOOTH** | **Drag & Drop .ZIP langsung ekstrak di RAM (<200ms)** | Ekstrak manual folder dan copy-paste ke directory disk |
| **Privasi & Keamanan** | **100% Client-Side On-Device (Zero Telemetry)** | Beberapa memicu koneksi analitik server jarak jauh |
| **Biaya & Lisensi** | **100% Bebas & Gratis (MIT / Bebas Royalti)** | Berbayar, sistem langganan DLC, atau watermark pro |
| **Performa Render** | **60 FPS Real-Time dengan HUD Telemetry** | Beban background service native Windows tinggi |

### 💎 Ringkasan Keunggulan Kompetitif (Pros)
1. 🚀 **Nol Instalasi (Zero Friction):** Cukup buka URL di browser atau install sebagai PWA desktop via 1-klik. Tidak memerlukan akun Steam, registrasi akun, maupun download bergiga-giga.
2. 🎙️ **Voice Changer DSP Real-Time Terintegrasi:** Langsung ubah karakter suara streamer (Anime Girl, Ikemen, Robot, Walkie-Talkie, Reverb Echo) di dalam tab tanpa perlu Virtual Audio Cable (VAC) atau software berbayar.
3. ⚡ **Ultra-Smooth 60 FPS Telemetry:** Render canvas 60 FPS stabil dengan HUD counter FPS dan latensi milidetik (`ms`) di sudut kanan atas layar, didukung optimalisasi WebGL dan GPU Diskrit (NVIDIA/AMD).
4. 👥 **Studio Collab Hingga 3 Streamer Mandiri:** Buka kolaborasi siaran langsung hingga 3 avatar secara simultan dalam satu kanvas, masing-masing terhubung ke webcam mandiri.
5. 📂 **Pemasangan Model Instan (In-Memory ZIP Parser):** Unduh avatar dari BOOTH.pm lalu cukup drag-and-drop file `.zip` ke jendela aplikasi; sistem `fflate` mengekstrak langsung ke RAM tanpa mengotori penyimpanan lokal.
6. 🔒 **Privasi 100% Terjamin:** Pemrosesan visi MediaPipe dan audio DSP dieksekusi murni di mesin lokal Anda menggunakan WebAssembly (WASM). Rekaman kamera dan suara tidak pernah diunggah ke server manapun.

---

## ✨ Features

### 👁️ 1. Full-Body, Face & Hand Recognition
* **Head Pose Kinematics:** 3-axis Euler angle tracking (Yaw, Pitch, Roll) with raw posture baseline calibration.
* **Eye & Gaze Tracking (Independent Wink):** Independent left & right eye blink with asymmetric wink isolation (`ParamEyeLOpen`, `ParamEyeROpen`), anti-flutter eyelid hysteresis, and 2D iris gaze deflection (`ParamEyeBallX`, `ParamEyeBallY`).
  * **Wink Sebelah Mata (Independent Wink):** Asymmetric wink logic isolates single-eye winks cleanly (`blinkDiff >= 0.12`), locks the opposite eye wide open (`1.0`) to prevent drooping, triggers an anime-accurate wink smile (`ParamEyeSmile = 1.0`), and automatically pauses Cubism auto-blink during active tracking.
  * **Cermin Mata VTuber (Mirror Eyes):** Physical left eye winks the left eye of the avatar on screen for natural mirrored streaming.
* **Eyebrows & Expressions:** Dual-source brow tracking (`ParamBrowLY`, `ParamBrowRY`, `ParamBrowLAngle`, `ParamBrowLForm`), cheek puff (`ParamCheek`), smile/frown curve (`ParamMouthForm`), and sadness/frown recognition via geometric corner droop. Compatible with Vivian model specific eyebrow parameters (`Param`, `Param4`, `Param2`, `Param5`).
* **Mouth Tracking Sensitivity & Speech Boost:** Real-time jaw displacement (`ParamMouthOpenY`) and mouth skew (`ParamMouthX`) with adjustable sensitivity (0.5x–2.5x) and a dedicated **Speech Boost** mode (1.65x multiplier + geometric lip separation fallback) ensuring responsive lip-sync during fast speaking or whispering.
* **Hand Tracking & Gestures:** 21-keypoint MediaPipe hand landmark detection mapping arm angles (`ParamArmLA/RA`) and high-five gesture detection.

### 🎙️ 2. Real-Time In-Browser Voice Changer & Audio DSP Studio
MiruNova Live menghadirkan mesin pengubah suara digital (DSP) berbasis **Web Audio API** berlatensi nol yang berjalan sepenuhnya di browser:
* **8 Model Suara Karakter (DSP Presets):**
  1. 🎀 **Kawaii Anime Girl:** Menaikkan nada suara (+4.5 semitone) dengan penyesuaian formant resonansi vokal cerah, manis, dan jernih khas karakter anime moe.
  2. 🎙️ **Ikemen Deep Voice:** Menurunkan nada (-4.0 semitone) dengan penguatan chest resonance untuk karakter pria bersuara maskulin, berat, dan tenang.
  3. 🐿️ **Chipmunk Helium:** Pitch-shifter tinggi (+8.0 semitone) dengan kompresi frekuensi vokal jenaka ala kartun.
  4. 🤖 **Cyber Robot:** Modulasi frekuensi cincin (Ring Modulator), distorsi bitcrush, dan filter sisir (Comb Filter) untuk efek vokal robotik futuristik sci-fi.
  5. 📻 **Vintage Walkie-Talkie:** Bandpass filter radio komunikasi (300 Hz – 3.000 Hz) dengan simulasi distorsi tabung dan noise gate untuk atmosfer taktis / gaming milsim.
  6. 🏛️ **Concert Hall Echo:** Efek spatial reverb multi-tap stereo dengan delay umpan balik halus untuk suasana panggung konser megah.
  7. 🎧 **Studio Broadcast Vocal:** Pengolahan audio studio broadcast profesional dengan kompresi dinamis, presence boost kejelasan artikulasi, dan de-esser.
  8. 🎵 **Natural Passthrough:** Suara asli jernih transparan tanpa efek pewarnaan, lengkap dengan VU meter dan visualizer equalizer real-time.
* **Interactive Mic & Voice Conversion Test Widget:**
  * Rekam buffer suara 4 detik langsung di dalam Settings [F2] untuk menguji kejernihan mikrofon.
  * Preview perbandingan tombol **Raw Mic Voice** (suara asli) vs. **Converted DSP Voice** (hasil pengubah suara) secara instan **tanpa loop feedback** dan tanpa dengungan memekakkan telinga (zero audio screeching).
* **Integrasi Streaming OBS Studio:** Audio yang diproses dapat disalurkan langsung ke OBS Studio melalui Virtual Audio Cable (VB-Cable) atau ditangkap bersamaan via Window Audio Capture.

### ⚡ 3. Real-Time On-Screen 60 FPS Telemetry HUD
* **Live HUD FPS Badge:** Tampilan badge floating elegan di sudut kanan atas layar (`top-4 right-4`) tepat di samping judul studio, menampilkan perhitungan FPS rendering real-time dan interval latensi milidetik (`ms`).
* **Indikator Status Warna Adaptif:**
  * 🟢 **Emerald (>= 50 FPS):** Performa pipeline rendering prima dan responsif.
  * 🟡 **Amber (30 – 49 FPS):** Frame rate menengah dengan pelacakan stabil.
  * 🔴 **Rose (< 30 FPS):** Frame drop terdeteksi (sistem akan merekomendasikan penyesuaian resolusi webcam).
* **Sampling Rate 500ms Cerdas:** Menghitung rata-rata frame setiap 500ms untuk mencegah getaran angka (anti-thrashing) dengan akurasi matematis tinggi.
* **Dapat Dikonfigurasi di Pengaturan:** Streamer dapat mengaktifkan atau menyembunyikan HUD counter ini kapan saja via **Settings [F2] > Hardware & Telemetry > Indikator FPS Layar (HUD Telemetry)**.

### 🎮 4. Discrete GPU Acceleration (NVIDIA / AMD) & WebGL Optimization
* **High-Performance Context Request:** WebGL contexts explicitly request `powerPreference: 'high-performance'` to ensure modern graphics engines prefer dedicated hardware over integrated graphics.
* **Dual-GPU Routing Guide:** Comprehensive guidance for dual-GPU laptops (Intel + NVIDIA / AMD + NVIDIA) where Windows/browsers may default to integrated GPUs for power savings.
  * **Windows Graphics Settings:** Set browser (`chrome.exe` / `msedge.exe` / `brave.exe`) to *High Performance (NVIDIA GPU)* in Windows Settings > System > Display > Graphics.
  * **NVIDIA Control Panel:** Assign "High-performance NVIDIA processor" in Manage 3D Settings > Program Settings.
* **Live Hardware Telemetry:** Dynamic 0–100 benchmark scoring, actual rendering FPS, millisecond frame latency, WebGL unmasked GPU renderer info, and CPU thread concurrency.

### 🌸 5. Fluid Animated Loading Screen & Procedural Audio Chimes
* **Fluid Anime Loading Card:** Replaces generic spinners with a glowing, bouncy anime orb card with floating sparkle stars, pulsing audio equalizer bars, and dynamic status messages.
* **Satisfying Fluffy Sound Effects:** Synthesized mathematically via Web Audio API:
  * `loadingStart`: Dreamy harmonic ascending arpeggio on model load initialization.
  * `loadingSuccess`: Crystalline sparkle chime upon complete texture binding and canvas attachment.

### 🔔 6. Zero-Latency Procedural UI Sound Effects (SFX)
* **Web Audio Synthesis:** Zero external audio files required; all sound effects are synthesized mathematically in real-time via Web Audio API oscillators, bandpass filters, and exponential gain ramps.
* **Studio Audio Feedback:** Responsive sounds for button clicks, camera activation, neutral calibration, modal open/close, theme switching, model loading, and screenshot shutter.
* **Configurable:** Dedicated toggle and volume slider in Studio Settings.

### 📱 7. Progressive Web App (PWA) Desktop Installation
* **Standalone Desktop Mode:** Install MiruNova Live directly to your desktop or taskbar with a single click, launching in a dedicated window without browser address bars.
* **Full PWA Suite:** Valid `manifest.webmanifest`, vector `favicon.svg`, and service worker caching core assets for ultra-fast startup.

### 🎨 8. Theme & Stage Background Visual Studio
* **☀️ 4 Daylight Themes:**
  * **Sakura Light Pink (Evanescia):** Soft cherry blossom daylight with HoYoverse Evanescia coral pink `#FA7FC2`, pale sakura `#F5B7CE`, and pure white daylight surfaces.
  * **Matcha Light Green:** Soothing Japanese green tea daylight with botanical green `#16a34a`, soft mint borders `#bbf7d0`, and crisp daylight card surfaces.
  * **Light Cyan Sea:** Radiant tropical cyan ocean breeze daylight with aqua highlights.
  * **Light Crisp:** Modern minimalist daylight interface with electric sky accents.
* **🌙 8 Dark & Neon Themes:**
  * **Cyber Dark** (Default obsidian & cyan), **Neo Cyan** (Tron aqua), **Sakura Pink** (Kawaii magenta), **Matcha Green** (Zen forest), **Midnight Blue** (Navy calm), **Synthwave** (80s sunset violet), **Monochrome** (OLED black & silver), **Sakura Sweet** (Evanescia Dark).
* **🎨 Custom Theme Studio:** Interactive color palette builder with 5 color pickers (`bg`, `surface`, `accent`, `border`, `text`) and 6 Instant Presets.
* **🖼️ Interactive Visual Thumbnail Cards for Stage Backgrounds:**
  * Interactive thumbnail preview cards in Settings & Theme Studio for: Solid Color (live hex swatch), Cyber Mesh Grid (wireframe), Studio Blueprint (grid), Dot Matrix (dots), Cosmic Space Flow (nebula), Transparent Alpha (checkerboard for OBS), Chroma Key Green (#00FF00), and Custom Local Wallpaper.

### 🎭 9. Reorganized Multi-Engine Model Catalog & BOOTH.pm Studio
* **2D Live2D Tab:**
  * **Model Cubism 4 Siap Pakai:** Haru Greeter (Full hand tracking & arm gestures), Hiyori Momose, Mao, Mark, Ren.
  * **Sampel Gratis Live2D Inc. (Official Samples):** Shizuku (Idol), Chitose (Schoolgirl), Koharu (SD Chibi), Epsilon (Sci-Fi Mech), Tororo (Cute Pet Mascot), Hibiki (Active Boy).
  * **AI VTuber Legend Tribute:** Neuro-sama (Vedal987 / Anny AI VTuber Tribute).
* **BOOTH.pm Tab (Categorized & Curated):**
  * **Model Siap Pakai (Pre-Installed BOOTH Models):** Mihari (`Mihari_V1`), Vivian (`薇薇安`).
  * **Showcase Terkurasi (10 Models with 1-Click "Pasang Model Ini" Installer & Creator Credits):**
    * Belle / Rin (リン - ZZZ) © pbsddy & shinan ([BOOTH #5399636](https://booth.pm/en/items/5399636))
    * Changli (长离 - 鳴潮) © shibutani ([BOOTH #7483530](https://shibutani.booth.pm/items/7483530))
    * Fugue / Tingyun (帰忘の流離人) © shibutani ([BOOTH #6360847](https://shibutani.booth.pm/items/6360847))
    * Camellya (椿 - 鳴潮) © shibutani ([BOOTH #6313490](https://shibutani.booth.pm/items/6313490))
    * Villhaze (ヴィルヘイズ) © koiyume ([BOOTH #5408293](https://booth.pm/en/items/5408293))
    * Roxy (ロキシー) © koiyume ([BOOTH #5411426](https://booth.pm/en/items/5411426))
    * Ice Girl (氷の少女) © TianYeLuLu ([BOOTH #5975192](https://booth.pm/en/items/5975192))
    * Tsukimi Yachiyo (月見ヤチヨ) © SnowBear Project ([BOOTH #8034348](https://booth.pm/en/items/8034348))
    * Hoshino Nya (星乃にゃ) © skiyoshi & サッカウキツ ([BOOTH #3988142](https://booth.pm/en/items/3988142))
    * KE (Live2D Free Model) © Sennyu ([BOOTH #7654174](https://booth.pm/en/items/7654174))
* **Universal In-Memory Folder & Multi-File Local Model Installer:**
  * Clicking "Pasang Model Ini" opens an in-memory directory / multi-file picker (`webkitdirectory` / `multiple`).
  * Resolves all relative textures, physics, poses, and moc3 files into browser blob URLs, eliminating all missing texture 404 errors.
* **3D Avatar Engine (Three.js & FBXLoader):**
  * **Model 3D Humanoid Neuro-sama (Vedal's Version):** Model 3D resmi karya Vedal987 dengan full-body humanoid skeleton rig (172 bones), tekstur 4K, MediaPipe face recognition tracking, dan VRChat morph targets (Starry Eyes, Blush, Lip-Sync).
  * **Procedural Rigged Anime Cats:** Mochi, Kuro, Tora dengan reactive ears, head rotation, eye blinks, paw gestures, dan tail sway.
  * **3D Quick-Action Studio HUD Toolbar (Tombol Bergambar):**
    * 🧍 **Framing Kamera Bergambar:** Full Body (Kepala ke kaki), Half Body (Pinggang ke atas), Close-Up Face (Wajah detail).
    * ⭐ **Ekspresi Wajah Bergambar:** Star Eyes (Mata Bintang), Senyum (Smile), Pipi Merona (Blush), Kedipan (Wink), Terkejut (Oh), Netral.
    * 👋 **Full Body Pose Bergambar:** Lambaian Tangan (Wave), Pose V (Peace Sign), Pose Hati (Heart), Gerak Santai (Idle Sway), Pose Tegak (Rest Pose).

### 🔍 10. Apple iPhone AssistiveTouch Edge-Docked Assist Button & Zoom Slider
* **Docked Circular Button with 20% Off-Screen Peeking:** Strictly circular floating button docked against the right screen edge (`fixed right-0 top-1/2 -translate-y-1/2`). Idle state stays partially hidden (~20% off-screen) and slides 100% into view smoothly on hover or click.
* **Anchored Assistive Popover Menu:**
  * **Continuous Zoom Range Slider:** Smooth slider (`30%` to `250%`) with live percentage display, plus quick `-`, `100%`, `+` step buttons.
  * **Framing Presets:** Close-Up (`closeup`), Waist-Up (`half`), and Full Body (`full`).
  * **Instant Avatar Centering:** Dead-center reset (`[0]`) with zero spatial drift.
  * **Quick Pose Calibration:** Instant face baseline calibration (`[C]`).
  * **Live Expression Chips:** Trigger model expressions directly from the assist dock.
  * **Pin & Dismiss:** Pin to stay open during streams or close cleanly on click-outside.

### ✨ 11. Dynamic Live2D Expression Selector
* **Model Expressions in Menubar:** Dynamic variation selector button in the bottom Control Dock reading all expression definitions from the active Live2D model.
* **Floating Expression Popover:** One-click activation with visual active states, neutral reset button, procedural sound feedback, and global keyboard hotkey `E` to cycle expressions.

### 🎥 12. OBS Studio Integration
* **One-Click Screen Mode:** Hides all application UI leaving only the avatar stage.
* **URL Parameter Integration:** Add `?obs=true&bg=transparent` or `?obs=true&bg=chroma` directly to OBS Browser Source for zero-configuration integration.

### 🖼️ 13. Photoshop-Style Layer Manager & Stage Studio
* **5-Tier Stackable Photoshop Layers:**
  1. **Shader FX & Filters:** Vignette, Scanlines, CRT phosphor glow, Blur overlays.
  2. **Accessories & Props:** VTuber wearable props layer.
  3. **Collab Partner Avatar:** Guest streamer model.
  4. **Host Avatar:** Primary Live2D or 3D tracked avatar.
  5. **Stage Background:** Solid, Cosmic, Mesh Grid, Alpha, Chroma.
* **Sticky Sidebar vs Windowed Floating:** Toggle between full-height pinned right sidebar and floating windowed panel with butter-smooth RAF-throttled titlebar dragging and corner resizing.
* **Stage-Wide Lock & Hide Integration:** Hiding a layer instantly toggles visibility and alpha on the active 2D / 3D canvas stage. Locking a layer strictly freezes canvas mouse dragging, panning, and wheel zooming to protect your stage layout.
* **Persistent Settings:** Layer order, visibility, opacity, and locked states are automatically preserved in `localStorage`.
* **Interactive Live Thumbnail Previews:** Every layer card renders real-time miniature thumbnail previews showing active background colors, model names, active accessory counts, and screen shaders.
* **Layer Z-Index Reordering:** Click `Up` or `Down` or drag-and-drop rows to alter the rendering hierarchy; PixiJS WebGL automatically sorts children by `zIndex` in real-time.
* **Global Hotkey:** Press `P` anytime or click the `Layers` button in the Control Dock / Assist Menu to open the manager.

### 🎀 14. VTuber Accessories & Props Attach System
* **10 Customizable Wearable Props:**
  * **Sunglasses (Thug Life Shades)** (`🕶️`), **Nekomimi Cat Ears** (`🐱`), **RGB Gaming Headset** (`🎧`), **Magician Top Hat** (`🎩`), **Sakura Hairpin** (`🌸`), **Royalty Golden Crown** (`👑`), **Studio Broadcast Mic** (`🎙️`), **Gentleman Mustache** (`🥸`), **Angel Golden Halo** (`😇`), **Floating Heart Aura** (`💖`).
* **Real-Time Head Tracking Anchoring:** Props are anchored to the avatar's coordinates and respond to MediaPipe head tilt (`ParamAngleZ`), turning (`ParamAngleX`), and nod (`ParamAngleY`) with smooth rotation and translation.
* **Fine-Tuning Controls:** Adjust item scale (0.5x–2.0x), horizontal offset X (-200px to +200px), and vertical offset Y (-350px to +200px) directly in the Layer Manager.

### 👯 15. Mode Collab Streamer (Dual Avatar In-Browser Streaming)
* **Zero-Setup Multi-Avatar Streaming:** Host two Live2D models simultaneously in the same browser window for collaborative streaming without running dual heavy desktop apps.
* **Flexible Layout Presets:** Place guest avatar Side-by-Side (Left), Side-by-Side (Right), or Picture-in-Picture (PiP corner).
* **Synchronized or Autonomous Tracking:** Choose between synchronized tracking (both avatars mirror streamer's face) or independent natural breathing and subtle sway loops for the guest avatar.
* **Independent Transform & Opacity:** Fine-tune partner scale, position offsets, and individual opacity.

### ⚡ 16. In-Memory ZIP Unpacking (`fflate`) & 1-Click BOOTH Installer
* **1-Click Official & Neuro-sama Mounting:** Direct URL models mount immediately in 1 click without prompting any file picker.
* **Instant Client-Side ZIP Unpack:** Built-in `fflate` engine unzips downloaded BOOTH `.zip` archives directly in RAM in <200ms, parses `.model3.json`, and converts textures to internal blob URLs with zero disk overhead.
* **Drag-and-Drop ZIP Support:** Drop any `.zip` Live2D model package directly onto the Model Catalog window to mount it instantly.

### 🛡️ 17. Resilient Windows Webcam Hardware Fallback
* **Eliminates Hardware Camera Dropouts:** Solves `"Perangkat kamera (webcam) yang dipilih tidak ditemukan atau telah terputus"` errors when switching to dedicated discrete GPU (NVIDIA GeForce GTX 1650 Ti / RTX series).
* **4-Tier Graceful Acquisition:** Automatically falls back from ideal constraints through device-id matching down to universal `{ video: true }` and exhaustive hardware sweeps, guaranteeing camera startup on 100% of Windows laptop drivers.

---

## 🚀 Quickstart

### Prerequisites
* [Bun](https://bun.sh) (v1.2+ or v1.3+) installed.
* Modern Web Browser with WebGL support (Google Chrome, Microsoft Edge, Brave).
* Standard webcam (720p 30fps recommended) or smartphone camera via Iriun Webcam / DroidCam.

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/RifkyA911/mirunova-live.git
cd mirunova-live

# Install dependencies with Bun
bun install

# Start development server
bun run dev --open
```

Open **`http://localhost:5173/`** in your browser.

> ⚠️ **Note on Webcam Permissions:** Browsers enforce webcam access only on **Secure Contexts** (`http://localhost` or `https://`). If accessing over your local network IP (e.g. `http://192.168.x.x`), camera access will be blocked by default browser security policies.

---

## ⌨️ Streamer Hotkeys

| Hotkey | Category | Action | Description |
| :--- | :--- | :--- | :--- |
| **`Space`** | Tracking | Toggle Webcam Tracking | Mulai atau hentikan vision tracking webcam |
| **`V`** | Audio | Toggle Microphone Engine | Aktifkan atau matikan input mikrofon & DSP |
| **`C`** | Tracking | Calibrate Head Pose | Reset head yaw, pitch, and roll to neutral center |
| **`P`** | Tracking | Toggle PIP Camera | Sembunyikan / tampilkan preview webcam PIP |
| **`B`** | Tracking | Toggle Eye Blink Sync | Sinkronisasi kedipan mata kiri dan kanan |
| **`+` / `=`** | Zoom | Zoom In Avatar | Perbesar skala avatar di panggung |
| **`-` / `_`** | Zoom | Zoom Out Avatar | Perkecil skala avatar di panggung |
| **`Z`** | Zoom | Reset Zoom & Center | Kembalikan avatar ke ukuran 100% dan posisi tengah |
| **`H`** | Navigation | Toggle Menu Dock | Sembunyikan / Tampilkan panel dock bawah |
| **`M`** | Navigation | Open Models Catalog | Buka katalog avatar 2D Live2D & 3D Cats |
| **`T`** | Navigation | Open Themes & Backgrounds | Buka menu kustomisasi tema, grid mesh & latar |
| **`R`** | Navigation | Toggle Rigging Panel | Buka / tutup drawer inspeksi parameter rigging |
| **`,` / `F2`** | Navigation | Open Studio Settings | Buka menu spesifikasi sistem & benchmark |
| **`?` / `F1`** | Navigation | Shortcut Guide Cheatsheet | Tampilkan panduan lengkap seluruh tombol shortcut |
| **`L`** | Streaming | Clear GUI & Lock Screen | Kunci layar dan sembunyikan semua UI untuk panggung bersih |
| **`O`** | Streaming | Toggle OBS Screen Mode | Switch between studio controls and clean streamer view |
| **`S`** | Streaming | Screenshot Avatar | Tangkap avatar langsung dan unduh file PNG |
| **`1` – `9`, `0`** | Streaming | Switch UI Themes | Ganti tema cepat (13 preset tema) |
| **`Escape`** | Global | Close Modals / Exit OBS | Dismiss open modals, drawers, or exit OBS view |

---

## 🧪 Testing

MiruNova Live includes native unit tests utilizing Bun's built-in test runner (`bun:test`):

```bash
# Run all unit tests
bun test

# Run tests in watch mode
bun test --watch

# Verify TypeScript and Svelte diagnostics
bun run check

# Production build test
bun run build
```

---

## 🏗️ Architecture

```
[Webcam Stream] ─────────────► [Audio Microphone Stream]
       │                                     │
       ▼                                     ▼
[MediaPipe Vision (WASM SIMD)]       [Web Audio API DSP Engine]
       │                             (Gain, EQ, VU, Models, Test Buffer)
       ▼                                     │
[Rigging Solver & Speech Boost]              ▼
(Yaw/Pitch/Roll, Eyes, Mouth, Hands)  [Audio Volume & Lip-Sync]
       │                                     │
       ▼                                     ▼
[Lerp Smoother & Deadzone Filter] ◄──────────┘
       │
       ▼
[Rigging Multiplexer] ◄── Manual Sliders Override
       │
       ▼
┌─────────────────────────────────┴─────────────────────────────────┐
│                                                                   │
▼                                                                   ▼
[Pixi.js v7 Cubism Canvas]                              [Three.js 3D WebGL Canvas]
(Live2D Models & Reactive 2D)                          (3D Cats & Custom GLB Files)
```

---

## 🔒 Zero-Cost & Privacy Mandate

* **100% Free & Open Source:** Zero subscription fees, zero watermark charges, zero cloud API tokens.
* **Local On-Device Execution:** All computer vision and audio calculations execute entirely in your client browser via WebAssembly and WebGL. No video frames, biometric data, or audio packets ever leave your computer.
* **Commercial Rights:** Free for commercial live streaming across YouTube, Twitch, Kick, Bilibili, and TikTok.

---

## 👨‍💻 Credits & Creator

* **Lead Architect & Creator:** [Rifky (@RifkyA911)](https://github.com/RifkyA911)
* **Repository:** [https://github.com/RifkyA911/mirunova-live](https://github.com/RifkyA911/mirunova-live)

---

## 📜 License

This project is licensed under the **MIT License**. Live2D sample models and Cubism Core runtime are copyright of Live2D Inc. and used under non-commercial developer evaluation terms.
