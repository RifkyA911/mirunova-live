# 02. Design System — MiruNova Live

## 1. Design Philosophy
* **Streamer-Centric & Overlay-Ready:** Antarmuka dirancang agar tidak mengganggu fokus utama (model avatar). Mode canvas dapat dijadikan transparan penuh untuk OBS Browser Source.
* **Cyber-Minimalist Dark Mode:** Menggunakan palet gelap (Zinc/Slate) dengan aksen Cyan/Violet futuristik untuk kesan rapi dan modern.
* **Anti-Slop Cleanliness:** Tidak ada animasi berlebihan, tidak ada dekorasi visual palsu. Setiap tombol memiliki fungsi langsung dan jelas.

---

## 2. Color Palette & Design Tokens

### Tailwind CSS Tokens
```css
:root {
  /* Backgrounds */
  --bg-canvas: transparent;
  --bg-surface: #09090b;          /* Zinc 950 */
  --bg-surface-elevated: #18181b; /* Zinc 900 */
  --bg-surface-glass: rgba(24, 24, 27, 0.85);

  /* Borders & Dividers */
  --border-muted: #27272a;        /* Zinc 800 */
  --border-active: #3f3f46;       /* Zinc 700 */

  /* Text */
  --text-primary: #fafafa;        /* Zinc 50 */
  --text-secondary: #a1a1aa;      /* Zinc 400 */
  --text-muted: #71717a;          /* Zinc 500 */

  /* Brand Accents */
  --accent-cyan: #06b6d4;         /* Cyan 500 - Active state & brand */
  --accent-violet: #8b5cf6;       /* Violet 500 - Rigging & Secondary */
  --accent-emerald: #10b981;      /* Emerald 500 - Online/Tracking Active */
  --accent-amber: #f59e0b;        /* Amber 500 - Warning / Damping alert */
  --accent-rose: #f43f5e;         /* Rose 500 - Camera Inactive / Danger */

  /* Chroma Key */
  --chroma-green: #00ff00;
  --chroma-blue: #0000ff;
  --chroma-magenta: #ff00ff;
}
```

---

## 3. Typography & Spacing
* **Font UI:** Inter / System UI Sans.
* **Font Numbers & Parameters:** JetBrains Mono / monospace (untuk keselarasan angka parameter real-time).
* **Grid Spacing:** Menggunakan kelipatan 4px (`gap-1`, `gap-2`, `gap-4`, `p-3`, `p-4`).

---

## 4. UI Components

### 4.1 Live2D Stage Canvas (Full Viewport)
* Wadah canvas WebGL responsif 100vw x 100vh.
* Interaksi gestur:
  * Mouse wheel: Zoom in/out model.
  * Drag klik kiri / tengah: Pindahkan posisi avatar (Pan).
  * Double click: Reset transformasi ke posisi default.

### 4.2 Floating Control Dock (Bottom Center)
* Dock bergaya *glassmorphism* melayang di bagian bawah layar.
* Berisi tombol aksi cepat:
  * Toggle Camera (Mulai / Hentikan Pelacakan)
  * Recalibrate Center (Atur ulang sudut netral wajah)
  * Rigging Preview / Inspector Drawer Toggle
  * Background Mode (Transparan, Gelap, Chroma Green)
  * Load Custom Model Button

### 4.3 Rigging Preview & Inspector Panel (Slide-out Right Drawer)
* Komponen khusus untuk inspeksi dan validasi model:
  * **Header:** Status model (`name`, `version`, `parameter count`), Mode switcher (`Live Tracking` vs `Manual Rigging Test`).
  * **Parameter Categories (Accordion/Tabs):**
    * *Head / Angle:* `ParamAngleX`, `ParamAngleY`, `ParamAngleZ`.
    * *Eyes:* `ParamEyeLOpen`, `ParamEyeROpen`, `ParamEyeBallX`, `ParamEyeBallY`, `ParamEyeLSmile`, `ParamEyeRSmile`.
    * *Mouth / Lips:* `ParamMouthOpenY`, `ParamMouthForm`.
    * *Body:* `ParamBodyAngleX`, `ParamBodyAngleZ`, `ParamBreath`.
  * **Slider Item Control:**
    * Label nama parameter (contoh: `ParamAngleX`).
    * Nilai numerik saat ini (-30.0 s/d 30.0).
    * Dual-mode slider:
      * Saat *Live Tracking*: Slider bertindak sebagai *real-time gauge* (read-only meter responsif).
      * Saat *Manual Test*: Slider interaktif dapat digeser bebas untuk menguji deformasi mesh Live2D.
  * **Quick Expression Tester:** Tombol cepat untuk memicu ekspresi bawaan model (Blink, Surprise, Smile, Reset).

### 4.4 Camera & Landmark PIP (Picture-in-Picture - Top Left)
* Preview mini video webcam (160x120 atau 240x180).
* Toggle layer canvas 2D transparan yang menggambar garis titik jaring wajah (MediaPipe 468 mesh).
* Indikator FPS tracking (misal: `Tracking: 60 FPS | 16ms`).
* Tombol collapse/minimize agar tidak menghalangi saat streaming.
