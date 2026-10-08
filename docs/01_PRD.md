# 01. Product Requirements Document (PRD) — MiruNova Live

## 1. Project Overview & Problem Statement
**MiruNova Live** adalah aplikasi web VTuber & Live2D avatar real-time berbasis pelacakan wajah (*face tracking*), dibangun menggunakan **Bun** dan **SvelteKit**.

### Problem Statement
Aplikasi pelacak avatar Live2D tradisional (seperti VTube Studio atau PrprLive) umumnya:
1. Membutuhkan instalasi software native desktop yang berat.
2. Memerlukan lisensi berbayar untuk menghilangkan watermark atau batasan fitur.
3. Sulit dijalankan di perangkat berspesifikasi rendah atau Chromebook/Mac/Linux secara seragam.
4. Kurang memiliki fitur pengujian/inspeksi *rigging* mandiri yang cepat di browser tanpa repot membuka Cubism Viewer yang berbayar/berat.

### Solution
**MiruNova Live** menyediakan solusi:
* **100% Free & Open-Source**: Tanpa lisensi berbayar, tanpa biaya langganan, tanpa cloud API berbayar.
* **Client-Side Processing**: Pelacakan wajah dijalankan langsung di browser menggunakan Google MediaPipe Vision (WASM/WebGL) tanpa mengirim data video ke server manapun (privasi terjamin).
* **Ringan & Cepat**: Ditenagai Bun untuk instalasi kilat dan SvelteKit 5 untuk performa render reaktif tanpa overhead Virtual-DOM.
* **Fitur Rigging Preview & Parameter Inspector**: Menyediakan mode preview dan slider manual untuk menguji rentang rigging model Live2D langsung di browser, bahkan tanpa menyalakan webcam.

---

## 2. Target Users & Use Cases
* **Streamer / Content Creator Pemula:** Menjalankan avatar di browser dan langsung memasukkannya ke OBS Studio via Browser Source (latar transparan).
* **Live2D Rigger / Modeler:** Menguji batas gerak parameter model (.moc3), deformasi ekspresi, kedipan mata, dan sinkronisasi mulut secara instan tanpa perlu build engine.
* **Developer Web3 / Interactive Media:** Menggunakan avatar interaktif yang merespons pengguna secara real-time di platform web mereka.

---

## 3. Product Scope & Functional Requirements

### 3.1 Core Features (MVP)
1. **Camera & Face Tracking**
   * Akses webcam via WebRTC `navigator.mediaDevices.getUserMedia`.
   * Deteksi 468/478 facial landmarks dan 52 facial blendshapes secara real-time via `@mediapipe/tasks-vision`.
   * Smoothing nilai (Lerp / Exponential Moving Average) untuk mencegah jitter gerak wajah.
2. **Live2D Rendering**
   * Render model Cubism 3 / 4 (.moc3) menggunakan WebGL via Pixi.js & `pixi-live2d-display`.
   * Kontrol interaktif: Zoom in/out (scroll), drag/pan model di canvas.
   * Mode background: Transparan penuh (default OBS), Chroma Key Green (#00FF00), atau Dark Minimalist.
3. **Rigging Preview & Parameter Inspector (Crucial Feature)**
   * **Mode A: Live Tracking Monitor** — Menampilkan visual meter/slider real-time dari seluruh parameter Live2D aktif (`ParamAngleX/Y/Z`, `ParamEyeLOpen`, `ParamMouthOpenY`, dll.) yang merespons gerak wajah pengguna.
   * **Mode B: Manual Rigging Test (Override Mode)** — Memungkinkan pengguna mematikan webcam dan menggeser slider secara manual untuk memvalidasi rigging model, range parameter, dan deformasi mesh.
   * **Mode C: Landmark Mesh Preview** — Menampilkan overlay jaring kawat (wireframe mesh) wajah pada video webcam mini untuk memantau akurasi landmark.
4. **Model Management**
   * Dilengkapi model sampel gratis bawaan.
   * Mendukung pemuatan model custom (.zip atau pilih folder model yang berisi `.model3.json`, `.moc3`, dan textures).

---

## 4. Non-Functional Requirements
* **Performa:** Minimal 30–60 FPS stabil pada laptop dengan integrated GPU (Intel Iris Xe / AMD Radeon Vega).
* **Zero Cost:** Tidak ada dependencies atau service yang memerlukan API key berbayar, credit card, atau sistem trial.
* **Privasi:** Pemrosesan video 100% lokal di browser (tidak ada rekaman atau frame yang diunggah).

---

## 5. Success Metrics
* Latensi dari pergerakan wajah ke respons model < 50ms.
* Waktu inisialisasi awal (load model + load model AI) < 3 detik pada koneksi internet standar.
* 0 dropped frames yang disebabkan oleh Garbage Collection di rendering loop.
