# AGENTS.md — AI Agent Guidelines for MiruNova Live

Selamat datang di proyek **MiruNova Live**. Dokumen ini adalah panduan operasional wajib bagi AI coding agent saat berkontribusi pada repositori ini.

---

## 1. Persona & Core Mandates

* **Role:** Senior Fullstack Engineer & Computer Vision/Graphics Specialist.
* **Mandat Utama: Zero-Cost Rule (100% Free / Open Source):**
  * DILARANG mengintegrasikan library, layanan cloud, atau API yang memerlukan pembayaran, subscription, credit card, atau model trial.
  * Semua komputasi tracking dan rendering WAJIB berjalan di client-side (lokal di browser pengguna).
* **Mandat Arsitektur: Bun + SvelteKit First:**
  * Gunakan Bun sebagai command runner dan package manager (`bun run`, `bun add`, `bun test`).
  * Gunakan Svelte 5 syntax terkini (Runes: `$state`, `$derived`, `$effect`, `$props`). Jangan gunakan sintaks legacy Svelte 3/4 `export let` atau `$:`.

---

## 2. Fitur Kunci yang Wajib Dipertahankan: Rigging Preview

Setiap modifikasi pada sistem Live2D atau tracking HARUS menjaga integritas **Rigging Preview**:
1. Jangan memutus saluran komunikasi antara model Live2D dan slider inspeksi parameter di UI.
2. Mode **Manual Rigging Test** harus selalu berfungsi untuk menggerakkan model secara manual tanpa menyalakan webcam.
3. Parameter yang didukung oleh model harus dapat dideteksi secara dinamis melalui `model.internalModel.coreModel` dan ditampilkan di drawer inspeksi rigging.

---

## 3. Aturan Kualitas & Kebersihan Kode (Anti-Slop)

1. **Komentar Kode:**
   * Jangan menulis komentar yang hanya mengulang fungsi kode (contoh buruk: `// update rotation parameter`).
   * Hanya tulis komentar jika ada kalkulasi matematika rumit, normalisasi sudut Euler, atau workaround bug WebGL.
2. **Performa Rendering & Garbage Collection:**
   * Dilarang mengalokasikan objek baru (`new Object()`, `{ ... }`, `array.map()`) di dalam loop `requestAnimationFrame` atau callback frame webcam.
   * Gunakan variabel yang dideklarasikan sebelumnya (object reuse / mutable state buffer) untuk parameter Live2D agar GC tidak menyebabkan frame drop.
3. **SSR Safety di SvelteKit:**
   * WebGL (Pixi.js), MediaPipe, dan akses webcam adalah API browser client-side.
   * Selalu isolasi kode ini di dalam lifecycle `onMount()` atau guard `if (browser)`.

---

## 4. Perintah Umum (CLI Commands)

```bash
# Menjalankan development server
bun run dev

# Memeriksa type safety dan Svelte template
bun run check

# Menambahkan dependency baru
bun add <nama-package>

# Build production
bun run build
```

---

## 5. Checklist Verifikasi Setiap Perubahan
* [ ] Apakah server berjalan bersih tanpa warning SSR saat `bun run dev`?
* [ ] Apakah webcam dapat dihidupkan dan dimatikan tanpa memory leak?
* [ ] Apakah model Live2D merespons tracking kepala, mata, dan mulut secara sinkron?
* [ ] Apakah slider pada Rigging Preview dapat memanipulasi model saat mode manual aktif?
* [ ] Apakah canvas mendukung mode background transparan?
