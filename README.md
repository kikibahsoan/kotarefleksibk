# 🏛️ Kota Refleksi - Belajar & Refleksi Interaktif SMK

Aplikasi web refleksi pembelajaran interaktif untuk murid SMK (Informatika - Berpikir Komputasional, Kelas X DKV 1, 2, dan 3) dengan visualisasi kota 3D (Three.js), AI Mentor Kota, Ruang Guru, sinkronisasi Google Spreadsheet, dan siklus Siang & Malam.

---

## 🚀 1. Cara Deploy ke GitHub Pages (Bebas Blank Putih)

Aplikasi telah dilengkapi file build produksi dan konfigurasi khusus GitHub Pages agar tidak terjadi layar kosong (*blank putih*):

### Opsi A (Paling Mudah: "Deploy from a branch" ke folder `/docs`)
Jika Anda memilih **Deploy from a branch** di GitHub Pages:
1. Jalankan `npm run build` (secara otomatis mengompilasi aplikasi ke folder `docs/` beserta file `.nojekyll` dan `404.html`).
2. Push seluruh file dan folder `docs/` ke repositori GitHub:
   ```bash
   git add .
   git commit -m "build: Siapkan folder docs untuk GitHub Pages"
   git push origin main
   ```
3. Di repositori GitHub Anda:
   - Masuk ke menu **Settings** > **Pages** (di sidebar kiri).
   - Di bagian **Build and deployment > Source**: pilih **Deploy from a branch**.
   - Pada pilihan **Branch**: pilih `main` (atau branch utama Anda).
   - **PENTING**: Pada dropdown folder di sebelahnya (yang biasanya berisi `/(root)`), ganti menjadi **`/docs`**.
   - Klik **Save**.
4. Dalam 1–2 menit, GitHub Pages selesai dan saat link diklik aplikasi akan langsung terbuka sempurna tanpa layar putih!

> **Mengapa sebelumnya Blank Putih?**
> Jika memilih folder `/(root)`, GitHub Pages hanya menyajikan kode sumber `index.html` mentah yang belum dikompilasi oleh Vite, sehingga browser tidak dapat menjalankan file TypeScript/React secara langsung. Dengan memilih folder **`/docs`**, GitHub Pages menyajikan hasil kompilasi JavaScript yang siap dijalankan oleh browser mana pun.

---

### Opsi B (Otomatis dengan `npm run deploy` ke branch `gh-pages`)
1. Jalankan perintah di terminal:
   ```bash
   npm run deploy
   ```
2. Di GitHub **Settings** > **Pages**:
   - **Source**: Deploy from a branch
   - **Branch**: pilih `gh-pages` dan folder **`/(root)`**.
   - Klik **Save**.

---

### Opsi C (Otomatis via GitHub Actions)
- Di GitHub **Settings** > **Pages**:
- **Source**: pilih **GitHub Actions**.
- File alur kerja `.github/workflows/deploy.yml` yang telah disediakan akan otomatis mengompilasi dan mendeploy setiap kali Anda melakukan `git push`.

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
