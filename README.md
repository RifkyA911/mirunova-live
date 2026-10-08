<div align="center">

![MiruNova Live Hero Banner](./static/hero.svg)

# MiruNova Live (見るNova)
**Next-Generation, Zero-Cost, In-Browser Live2D & Real-Time Vision Tracker**

[![Bun](https://img.shields.io/badge/Bun-1.3-fbf0df?style=flat-square&logo=bun)](https://bun.sh)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-3.0-ff3e00?style=flat-square&logo=svelte)](https://svelte.dev)
[![Svelte 5](https://img.shields.io/badge/Svelte-5.x-ff3e00?style=flat-square&logo=svelte)](https://svelte.dev)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Vision_WASM-06b6d4?style=flat-square&logo=google)](https://developers.google.com/mediapipe)
[![Live2D](https://img.shields.io/badge/Live2D-Cubism_3%2F4-8b5cf6?style=flat-square)](https://www.live2d.com)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](LICENSE)
[![Zero-Cost](https://img.shields.io/badge/100%25-Free_%26_Open_Source-emerald?style=flat-square)](#zero-cost--privacy-mandate)

*Tags: `#live2d` `#vtuber` `#face-tracking` `#mediapipe` `#svelte5` `#bun` `#pixijs` `#webgl` `#zero-cost` `#obs-studio`*

</div>

---

## 🌟 Overview

**MiruNova Live** is an ultra-lightweight, 100% client-side web application for real-time Live2D avatar animation and vision tracking. Powered by **Bun**, **SvelteKit 5**, and **Google MediaPipe Vision**, it brings professional VTuber studio capabilities straight to your browser without heavyweight native installations, watermark restrictions, or paid cloud APIs.

---

## ✨ Features

### 👁️ 1. Full-Body & Expression Vision Recognition
* **Head Pose Kinematics:** Precise 3-axis Euler angle tracking (Yaw, Pitch, Roll) with automatic neutral calibration.
* **Eye & Gaze Tracking:** Independent left/right eye blink (`ParamEyeLOpen`, `ParamEyeROpen`) and iris gaze deflection (`ParamEyeBallX`, `ParamEyeBallY`).
* **Eyebrows & Expressions:** Brow elevation/furrowing (`ParamBrowLY`, `ParamBrowRY`), cheek puff (`ParamCheek`), and smile/frown curve (`ParamMouthForm`).
* **Lip-Sync & Speech:** Real-time jaw displacement (`ParamMouthOpenY`) mirroring your spoken cadence.
* **Kinematic Body & Arms:** Subtle reactive shoulder/torso tilt (`ParamBodyAngleX/Y/Z`) and arm gestures (`ParamArmLA/RA`).

### 🛠️ 2. Rigging Preview & Parameter Inspector
* **Live Tracking Mode:** Responsive visual gauges illustrating active parameter values directly driven by your face.
* **Manual Override Test Mode:** Disable webcam and interactively manipulate individual parameter sliders to inspect mesh deformation limits and verify model rigging.
* **One-Click Expression Presets:** Test `Blink`, `Open Mouth`, `Smile`, `Head Tilt`, `Angry`, and `Shock` instantly.

### 🎨 3. Theme & Background Studio
* **Styles:** Transparent (OBS Studio ready), Solid Color, Tech Mesh (Radial Dots), Tech Grid (Cyber Wireframe), Cosmic Animated (Floating Space Nebula), Polka Dots, Deep Gradient, Chroma Green/Blue (#00FF00 / #0000FF), and Custom Photo Upload.
* **Custom Hex Color Picker:** Select any `#rrggbb` color or choose from high-contrast studio presets.
* **Screen Overlays:** Vignette, Retro Scanlines, CRT Bloom, and Subtle Blur.
* **UI Themes:** Cyber Dark, Midnight Navy, Synthwave Sunset, and Minimal Monochrome.

### 🎭 4. Model Catalog (2D Live2D & 3D Three.js)
* **2D Live2D Models:**
  * **Haru Greeter** (Cubism 3/4)
  * **Hiyori Momose** (Cubism 3/4)
  * **Mao Pro** (Cubism 3/4)
  * **Shizuku** (Cubism 2)
  * **Wanko & Rice** (Cute Mascots)
  * **Custom Live2D Loader:** Load external `.model3.json` URLs.
* **3D Avatar Engine (Three.js):**
  * **Mochi The Cat (3D Rigged):** Full procedural 3D stylized anime cat with reactive rotation, ear twitches, eye blinks, mouth sync, paw gestures, and swaying tail.
  * **Fox 3D (GLB):** Skeletal animated low-poly 3D animal model.
  * **Custom 3D Uploader:** Load any external `.glb` or `.gltf` model straight from Blender.
* **Pose Looping Engine:** Configurable loops: Breathing cycle (`idle-breath`), gentle side-to-side sway (`gentle-sway`), and head nodding (`head-nod`) with adjustable speed multipliers.
* **Built-in Motion Triggering:** Execute animations defined within the model with a single click.

### 🌐 5. Internationalization (i18n)
* Native multi-language support:
  * 🇬🇧 **English** (Default)
  * 🇮🇩 **Bahasa Indonesia**
  * 🇯🇵 **日本語 (Japanese)**

---

## 🚀 Quickstart

### Prerequisites
* [Bun](https://bun.sh) (v1.2+ or v1.3+) installed.
* Modern Web Browser with WebGL support (Google Chrome, Microsoft Edge, Brave).
* A standard webcam (720p 30fps recommended).

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/your-username/mirunova-live.git
cd mirunova-live

# Install dependencies with Bun
bun install

# Start development server
bun run dev --open
```

Open **`http://localhost:5173/`** in your browser.

> ⚠️ **Note on Webcam Permissions:** Browsers enforce webcam access only on **Secure Contexts** (`http://localhost` or `https://`). If accessing over your local network IP (e.g. `http://192.168.x.x`), camera access will be blocked by default browser security policies.

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
```

---

## 🏗️ Architecture

```
[Webcam Stream]
       │
       ▼
[MediaPipe Vision (WASM/WebGL)] ───► 478 3D Landmarks & 52 Blendshapes
       │
       ▼
[Mathematical Solver]           ───► Yaw/Pitch/Roll, Eye Gaze, Brow, Mouth, Cheek
       │
       ▼
[Lerp Smoother & Damping]       ───► Jitter Elimination Filter
       │
       ▼
[Rigging Multiplexer]           ◄─── Manual Sliders Override
       │
       ▼
[Pixi.js v7 WebGL Canvas]       ───► Live2D Cubism Core Runtime
```

---

## 🔒 Zero-Cost & Privacy Mandate

* **100% Free & Open Source:** Zero subscription fees, zero watermark charges, zero cloud API tokens.
* **Local On-Device Execution:** All computer vision calculations execute entirely in your client browser via WebAssembly. No video frames or biometric data ever leave your computer.

---

## 📜 License

This project is licensed under the **MIT License**. Live2D sample models and Cubism Core runtime are copyright of Live2D Inc. and used under non-commercial developer evaluation terms.
