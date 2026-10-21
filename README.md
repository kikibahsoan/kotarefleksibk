# 🏛️ Kota Refleksi - Belajar & Refleksi Interaktif SMK

Aplikasi web refleksi pembelajaran interaktif untuk murid SMK (Informatika - Berpikir Komputasional, Kelas X DKV 1, 2, dan 3) dengan visualisasi kota 3D (Three.js), AI Mentor Kota, Ruang Guru, sinkronisasi Google Spreadsheet, dan siklus Siang & Malam.

---

## 🚀 1. Cara Deploy ke GitHub Pages

File konfigurasi GitHub Pages telah disiapkan lengkap:
- `vite.config.ts`: telah disetel dengan `base: './'` agar semua aset relatif berfungsi di `username.github.io/nama-repo/`.
- `.github/workflows/deploy.yml`: GitHub Actions otomatis untuk membangun dan mempublikasikan aplikasi saat push ke branch `main` atau `master`.
- `public/404.html`: Fallback SPA agar reload halaman di GitHub Pages tidak error 404.

### Langkah-langkah:
1. **Push kode ini ke repositori GitHub Anda**:
   ```bash
   git init
   git add .
   git commit -m "feat: Siap deploy GitHub Pages Kota Refleksi"
   git branch -M main
   git remote add origin https://github.com/<username>/<nama-repo>.git
   git push -u origin main
   ```
2. **Aktifkan GitHub Pages**:
   - Buka repositori Anda di GitHub.
   - Masuk ke tab **Settings** > **Pages** (di menu sebelah kiri).
   - Di bagian **Build and deployment > Source**, pilih **GitHub Actions**.
   - Alur kerja (workflow) akan otomatis berjalan pada tab **Actions**.
   - Setelah selesai (sekitar 1-2 menit), situs web Anda akan langsung aktif di:
     `https://<username>.github.io/<nama-repo>/`

---

## 📊 2. Integrasi Google Spreadsheet (Buku Induk Guru)

Data refleksi murid otomatis tersimpan ke Google Spreadsheet melalui Google Apps Script Web App:
- **URL Web App Saat Ini**:
  `https://script.google.com/macros/s/AKfycbwzHhVYKBfznA_k4dZlB1eGFevpeLoJDiSUbLKXJACQPgsKFxi0HfbNNbjUZBWa7finfw/exec`

### Format Data yang Tersimpan Rapi:
Google Apps Script otomatis membagi data menjadi kolom-kolom terpisah agar mudah dibaca oleh guru:
1. **Data Refleksi Siswa**:
   - `Waktu Catat`
   - `ID Refleksi`
   - `Nama Siswa`
   - `Kelas` (X DKV 1, 2, 3)
   - `No. Absen`
   - `Judul Materi`
   - `Skala Bintang (1-5)`
   - `Emoji Perasaan`
   - `Yang Sudah Dipahami`
   - `Yang Masih Sulit / Bingung`
   - `Rencana Aksi Siswa`
   - `Jawaban Khusus Modul`
   - `Apresiasi AI Mentor`
   - `Hal yang Sudah Dikuasai`
   - `Hal yang Perlu Diperkuat`
   - `Saran AI Mentor`
   - `Pertanyaan Pemantik AI`
   - `Rencana Belajar AI`
   - `Perlu Perhatian Guru (YA / Tidak)`
2. **Pesan Kantor Pos**:
   - Catatan pertanyaan murid ke guru dan balasan guru.

> **Catatan Penting Deployment Apps Script**:
> Saat membuat deployment Aplikasi Web di Google Apps Script:
> - **Jalankan sebagai**: *Saya (akun Google guru)*
> - **Siapa yang memiliki akses**: *Siapa saja (Anyone)*
> Hal ini wajib agar aplikasi murid dapat mengirim data ke Spreadsheet tanpa kendala login Google.

---

## 🔐 3. Akses Ruang Guru

- **Kata Sandi Guru**: `Kiki123!`
- Kata sandi telah disembunyikan sepenuhnya dari layar murid.
- Terdapat ikon mata untuk menampilkan/menyembunyikan kata sandi saat diketik oleh guru.

---

## ☀️🌙 4. Fitur Pergantian Siang dan Malam

- **Mode Siang (Day)**: Langit cerah, sinar matahari hangat, pepohonan hijau segar, dan permukaan air mancur yang memantulkan cahaya.
- **Mode Malam (Night)**: Langit biru pekat berbintang (450 bintang berkelip), sinar rembulan sejuk, 6 lampu lentera jalan yang menyala kuning temaram, dan jendela-jendela gedung yang memancarkan cahaya hangat keemasan.
- **Kontrol Fleksibel**: Tombol di bagian atas layar memungkinkan guru dan murid beralih seketika antara **☀️ Siang**, **🌙 Malam**, atau **🔄 Auto** (siklus halus otomatis setiap ~80 detik).
