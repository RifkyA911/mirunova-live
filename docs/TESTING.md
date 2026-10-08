# 🧪 Testing Guide — MiruNova Live

MiruNova Live menggunakan test runner bawaan **Bun** (`bun:test`) yang 100% native, ultra-cepat, dan bebas dependensi pihak ketiga (*zero overhead*).

---

## 1. Menjalankan Unit Tests

Jalankan perintah berikut di root folder project:

```bash
# Menjalankan seluruh test suite
bun test

# Menjalankan test dalam mode watch (otomatis re-run saat file diedit)
bun test --watch
```

---

## 2. Cakupan Unit Test

### A. Mathematical Solver (`tests/solver.test.ts`)
Menguji konversi landmark 3D dan ekspresi wajah MediaPipe ke parameter rotasi dan blendshape Live2D:
* **Pose Netral Wajah:** Memverifikasi bahwa wajah yang menghadap tepat ke depan menghasilkan sudut rotasi (`yaw`, `pitch`, `roll`) mendekati 0.
* **Rotasi Kepala (Yaw / Clamping):** Memastikan pergerakan kepala kiri-kanan dipetakan dengan benar dan dibatasi aman pada rentang $[-30, 30]$ derajat.
* **Kedipan Mata & Bukaan Mulut:** Memverifikasi nilai blendshape `eyeBlinkLeft/Right` dan `jawOpen` diubah ke format Live2D ($1.0 = \text{terbuka}, 0.0 = \text{tertutup}$).

### B. Parameter Smoother & Damping (`tests/smoother.test.ts`)
Menguji algoritma *Linear Interpolation (Lerp)* untuk eliminasi *jitter*:
* **Inisialisasi Frame Pertama:** Nilai awal langsung dikembalikan tanpa lag.
* **Konvergensi Halus (Damping):** Perubahan mendadak pada parameter diperhalus secara bertahap antar frame.
* **Fungsi Reset:** Memastikan riwayat frame terhapus saat berpindah model atau kalibrasi ulang.

---

## 3. Panduan Pengujian Izin & Webcam (Security Contexts)

Fitur webcam (`getUserMedia`) tunduk pada aturan browser modern:
1. **Secure Context Obligation:** Browser **hanya** mengizinkan webcam pada `http://localhost`, `http://127.0.0.1`, atau koneksi terenkripsi `https://`. Jika diakses melalui IP lokal (misal: `http://192.168.x.x:5173`), browser otomatis memblokir objek `navigator.mediaDevices`.
2. **Error Guarding:** MiruNova Live telah dilengkapi deteksi kontekstual otomatis untuk mengidentifikasi apakah error berasal dari:
   * Penolakan izin oleh pengguna (`NotAllowedError`).
   * Konflik webcam dengan aplikasi lain (`NotReadableError`).
   * Akses melalui IP non-secure.
