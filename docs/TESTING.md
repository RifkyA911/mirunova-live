# 🧪 Testing Guide — MiruNova Live

MiruNova Live menggunakan test runner bawaan **Bun** (`bun:test`) yang 100% native, ultra-cepat, dan bebas dependensi pihak ketiga (*zero overhead*).

---

## 1. Menjalankan Unit Tests & Validasi Tipe

Jalankan perintah berikut di root folder project:

```bash
# Menjalankan seluruh test suite (44 tests, 347 assertions)
bun test

# Menjalankan test dalam mode watch (otomatis re-run saat file diedit)
bun test --watch

# Memverifikasi Svelte diagnostics dan TypeScript type safety (0 errors)
bun run check

# Menjalankan production build test
bun run build
```

---

## 2. Cakupan 9 Test Suites Unit Test

### A. Mathematical Solver (`tests/solver.test.ts`)
Menguji konversi landmark 3D dan ekspresi wajah MediaPipe ke parameter rotasi dan blendshape Live2D:
* **Pose Netral Wajah:** Memverifikasi bahwa wajah yang menghadap tepat ke depan menghasilkan sudut rotasi (`yaw`, `pitch`, `roll`) mendekati 0.
* **Rotasi Kepala (Yaw / Clamping):** Memastikan pergerakan kepala kiri-kanan dipetakan dengan benar dan dibatasi aman pada rentang $[-30, 30]$ derajat.
* **Kedipan Mata & Bukaan Mulut:** Memverifikasi nilai blendshape `eyeBlinkLeft/Right` dan `jawOpen` diubah ke format Live2D ($1.0 = \text{terbuka}, 0.0 = \text{tertutup}$).
* **Isolasi Kedipan Asimetris & Winking:** Menjamin kemampuan mengedipkan satu mata secara independen tanpa jitter pada mata sebelahnya.
* **Mouth Speech Boost & Sensitivity:** Memverifikasi pengganda bukaan mulut 1.65x dan fallback pemisahan bibir geometris saat mode `high` aktif dengan slider 0.5x–2.5x.
* **Deteksi Gestur Tangan:** Memvalidasi elevasi tangan ke sudut lengan `ParamArmLA/RA` dan pemicu high-five.
* **Invert Pitch & Yaw:** Memastikan opsi pembalikan sumbu rotasi bekerja akurat sesuai preferensi orientasi kamera streamer.

### B. Parameter Smoother & Damping (`tests/smoother.test.ts`)
Menguji algoritma *Linear Interpolation (Lerp)* untuk eliminasi *jitter*:
* **Inisialisasi Frame Pertama:** Nilai awal langsung dikembalikan tanpa lag.
* **Konvergensi Halus (Damping):** Perubahan mendadak pada parameter diperhalus secara bertahap antar frame.
* **Fungsi Reset:** Memastikan riwayat frame terhapus saat berpindah model atau kalibrasi ulang.
* **Continuous Deadzone:** Transisi mulus tanpa loncatan sudut diskontinu.
* **Tracking Loss Decay:** Reduksi bertahap ke pose netral saat wajah hilang dari kamera.

### C. Dynamic Background Computation (`tests/background.test.ts`)
* Validasi 13 varian palet tema warna (Daylight Sakura Pink, Matcha, Light Cyan Sea, Dark Cyber, Custom Studio, dll.).
* Mode chroma green (`#00FF00`) dan chroma blue (`#0000FF`) untuk streaming capture.
* Mode transparansi penuh untuk OBS Browser Source.

### D. GUI Lock & Screen Clear (`tests/guiLock.test.ts`)
* State toggle kunci layar mode bersih.
* Penutupan otomatis semua drawer dan modal terbuka saat penguncian stage diaktifkan.

### E. Hardware Benchmark & Telemetry (`tests/hardware.test.ts`)
* Deteksi unmasked WebGL GPU renderer dan CPU core concurrency.
* Kalkulasi skor benchmark dinamis (0–100) dan penentuan tier performa sistem.

### F. Model Catalog Validation (`tests/models.test.ts`)
* Validasi integritas file model Live2D Cubism 3/4 (Haru Greeter, Mihari, Vivian, Hiyori, Mao, Shizuku, Wanko).
* Verifikasi thumbnail preview visual SVG/PNG untuk seluruh avatar 2D dan 3D.

### G. OBS Screen Mode Integration (`tests/obsMode.test.ts`)
* Validasi transisi state masuk dan keluar mode OBS screen view.
* Parsing query parameter URL OBS (`?obs=true&bg=transparent`).

### H. Persistent Storage (`tests/storage.test.ts`)
* Penyimpanan dan pemulihan otomatis preferensi pengguna ke `localStorage`.
* Fitur export backup `.json` dan import restore config.

### I. Three.js Procedural 3D Stage (`tests/threeStage.test.ts`)
* Inisialisasi prosedural kucing 3D (Mochi, Kuro, Tora) dengan canvas WebGL `powerPreference: 'high-performance'`.
* Penanganan parameter rotasi, kedipan mata, telinga reaktif, dan gestur cakar tanpa runtime exception.

---

## 3. Panduan Pengujian Izin & Webcam (Security Contexts)

Fitur webcam (`getUserMedia`) tunduk pada aturan browser modern:
1. **Secure Context Obligation:** Browser **hanya** mengizinkan webcam pada `http://localhost`, `http://127.0.0.1`, atau koneksi terenkripsi `https://`. Jika diakses melalui IP lokal (misal: `http://192.168.x.x:5173`), browser otomatis memblokir objek `navigator.mediaDevices`.
2. **Error Guarding:** MiruNova Live telah dilengkapi deteksi kontekstual otomatis untuk mengidentifikasi apakah error berasal dari:
   * Penolakan izin oleh pengguna (`NotAllowedError`).
   * Konflik webcam dengan aplikasi lain (`NotReadableError`).
   * Akses melalui IP non-secure.
