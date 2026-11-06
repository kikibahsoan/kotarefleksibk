# Arena Cerdas Cermat Balai Kota (Refleksia Grand Quiz Battle)

Fitur permainan kelompok interaktif realtime di Balai Kota dan Alun-alun Pusat Refleksia City yang mempertemukan tim siswa dalam kuis serentak bertema Desain Komunikasi Visual (DKV), dipandu langsung oleh Guru atau otomatis oleh Wali Kota @Sony.

### User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan jawaban klarifikasi yang telah dikonfirmasi, permainan kelompok dirancang dengan ketentuan utama:
> - **Jenis Permainan**: Cerdas Cermat Tim seputar kompetensi dan kreativitas DKV.
> - **Sistem Bermain**: Realtime serentak yang dapat dipandu langsung oleh Guru (Host/Juri) atau berjalan otomatis oleh Wali Kota @Sony.
> - **Arena Pusat**: Balai Kota dan Panggung Alun-alun Utama.

- **Keputusan Terkonfirmasi 1**: Sistem Tim berbasis Kelas (Tim X DKV 2 vs Tim X DKV 3) atau Pemilihan Kubu Tim Bebas (Tim Cyan vs Tim Amber) saat sesi dibuka di Balai Kota.
- **Keputusan Terkonfirmasi 2**: Peran Tamu Kota (Wartawan) adalah sebagai Penonton & Peliput Berita Resmi (dapat melihat jalannya kuis dan papan skor tanpa mengganggu jalannya perlombaan).
- **Rekomendasi Default**: Guru memiliki kontrol penuh (Mulai Ronde, Jeda, Verifikasi Jawaban, Beri Poin Bonus), namun kuis juga dilengkapi Mode Otomatis jika Guru sedang tidak memimpin sesi.

---

### 1. Overview & Core Concept

- **Apa yang Dibangun**: Sebuah modul arena kompetisi cerdas cermat kelompok *"Refleksia Grand Quiz Battle"* yang terintegrasi di Balai Kota dan Alun-alun Pusat. Siswa bergabung ke dalam tim, menekan tombol bel (buzzer) secara realtime, dan menjawab soal-soal DKV dalam batas waktu serentak.
- **Target Pengguna**: Siswa SMK jurusan DKV (sebagai kontestan tim), Guru DKV / Master kikybahsoan (sebagai Host / Pemandu Kuis), dan Tamu / Wartawan (sebagai penonton dan peliput skor).
- **Nilai Utama**: Membangun kolaborasi dan antusiasme belajar siswa dalam suasana kota virtual yang hidup, meriah, dan kompetitif secara sehat.

---

### 2. User Experience & Visual Design

- **Alur Pengguna**:
  1. **Akses Masuk**: Siswa atau Guru mendekati Balai Kota atau mengklik podium panggung Alun-alun untuk membuka antarmuka arena Cerdas Cermat.
  2. **Lobi Pembagian Tim**: Siswa memilih tim (Tim Cyan / Tim Amber atau DKV 2 / DKV 3) dan siap di podium masing-masing.
  3. **Mulai Pertandingan**: Guru (atau sistem otomatis dipandu Wali Kota @Sony) membunyikan bel tanda babak dimulai.
  4. **Babak Pertandingan**:
     - *Babak 1 (Pilihan Ganda Cepat)*: Semua tim menjawab serentak dalam waktu 20 detik.
     - *Babak 2 (Rebutan Buzzer)*: Tim yang menekan bel tercepat mendapat hak menjawab pertama.
     - *Babak 3 (Tebak Istilah DKV & Estafet)*: Pertanyaan poin ganda untuk penentuan juara.
  5. **Selebrasi & Penganugerahan XP**: Pengumuman tim pemenang dengan efek confetti meriah, piala virtual, dan pembagian reward poin XP otomatis.

- **Identitas Visual & Tema**:
  - *Gaya Desain*: Panggung kuis megah berlatar arsitektur Balai Kota Refleksia dengan aksen emas (`#F59E0B`), biru langit (`#0284C7`), dan emerald (`#10B981`).
  - *Tipografi*: Display elegan dan tegas menggunakan font sans tebal dengan angka tabular (`tabular-nums`) untuk timer hitung mundur dan skor tim.
  - *Pencahayaan & Efek*: Efek sorot lampu podium kuis, tombol buzzer bersinar saat ditekan, serta animasi ticker papan skor di Alun-alun.

- **Umpan Balik Interaktif**:
  - Efek suara bel kuis (*chime buzzer*), efek detak timer detik-detik terakhir, dan suara perayaan kemenangan.
  - Indikator visual jelas ketika tim sedang menekan bel atau waktu habis.

---

### 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Integrasi dengan Bank Soal DKV yang Sudah Ada**
  - *Pendekatan*: Memanfaatkan bank materi dan kuis DKV yang telah dihasilkan Guru di Bengkel Latihan dan Bank Materi AI, ditambah paket soal cerdas cermat khusus.
  - *Alasan*: Materi selalu relevan dengan kurikulum SMK DKV dan tidak memerlukan input soal ulang yang memberatkan Guru.

- **Keputusan 2: Arsitektur Realtime Hybrid (WebSocket Mesh + Server Authority)**
  - *Pendekatan*: Sinkronisasi status bel buzzer, timer, dan skor menggunakan jaringan *Realtime Presence Mesh* yang sudah berjalan di Refleksia City, dengan Express API sebagai penyimpan riwayat pertandingan.
  - *Alasan*: Latensi sangat rendah (<50ms) antar perangkat laptop, tablet, dan HP tanpa memerlukan infrastruktur server eksternal tambahan.

- **Keputusan 3: Penanganan Khusus untuk Mode Tamu (Wartawan)**
  - *Pendekatan*: Tamu tetap memiliki status *View Only*—dapat menyaksikan jalannya pertandingan langsung di Balai Kota dan melihat papan skor tanpa tombol menjawab soal.
  - *Alasan*: Menjaga integritas kompetisi siswa sekaligus konsisten dengan peran jurnalis tamu yang telah ditetapkan.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BALAI KOTA & ALUN-ALUN                          │
│                                                                        │
│  ┌──────────────────┐    ┌────────────────────┐    ┌────────────────┐  │
│  │   Podium Tim A   │    │  Panggung Host /   │    │  Podium Tim B  │  │
│  │   (Buzzer & UI)  │    │  Juri (@Sony/Guru) │    │  (Buzzer & UI) │  │
│  └────────┬─────────┘    └─────────┬──────────┘    └────────┬───────┘  │
│           │                        │                        │          │
└───────────┼────────────────────────┼────────────────────────┼──────────┘
            │                        │                        │           
            ▼                        ▼                        ▼           
┌────────────────────────────────────────────────────────────────────────┐
│                 CERDAS CERMAT REALTIME CONTROLLER                      │
│                                                                        │
│   • State Mesin: LOBBY ──► QUESTION_ACTIVE ──► BUZZER_LOCKED           │
│                  ▲                                  │                  │
│                  └─────── ROUND_RESULT ◄────────────┘                  │
│   • Timer Countdown Engine (15s / 20s)                                 │
│   • Buzzer Lockout Arbiter (Penentu tim pertama menekan bel)           │
│   • Auto-Score Calculator & XP Distributor                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │                                     
                   ┌────────────────┴────────────────┐                    
                   ▼                                 ▼                    
┌─────────────────────────────────────┐  ┌───────────────────────────────┐
│       REALTIME PRESENCE MESH        │  │       STORAGE & SPREADSHEET   │
│  • WSS MQTT Event Broadcast         │  │  • Riwayat Juara Balai Kota   │
│  • Local BroadcastChannel           │  │  • Poin XP Siswa & Leaderboard│
│  • Express SSE Stream Fallback      │  │  • Sinkronisasi GAS           │
└─────────────────────────────────────┘  └───────────────────────────────┘
```

- **Entitas Data Utama**:
  - `QuizBattleRoom`: ID ruangan, status ronde, daftar peserta per tim, soal aktif, sisa waktu timer.
  - `TeamScore`: Akumulasi poin tim, waktu respons rata-rata, riwayat jawaban benar.
  - `BuzzerEvent`: Timestamp milidetik tim yang menekan bel pertama untuk hak menjawab.

---

### 5. Tahapan Eksekusi Pembangunan

1. **Pembuatan Komponen Arena Cerdas Cermat**:
   - Merancang modal dan antarmuka panggung kuis interaktif di Balai Kota (`CerdasCermatModal.tsx`).
   - Menyediakan tampilan podium untuk Tim A, Tim B, dan Panggung Juri Guru/Wali Kota Sony.
2. **Implementasi Logika Buzzer & Timer Realtime**:
   - Menghubungkan event bel kuis serentak dengan jaminan penentu tercepat (*lockout arbiter*).
   - Sinkronisasi timer mundur serentak untuk semua pemain di perangkat masing-masing.
3. **Panel Kontrol Pemandu Guru**:
   - Tombol kontrol kuis untuk Guru: Mulai Ronde, Lanjut Soal, Beri Poin Bonus Tim, atau Mode Panduan Otomatis Wali Kota Sony.
4. **Pemberian Reward & Papan Juara Alun-alun**:
   - Integrasi perolehan poin XP tim ke profil siswa yang menang.
   - Papan rekapitulasi juara cerdas cermat di Balai Kota.
5. **Verifikasi & Pengujian Antar Perangkat**:
   - Memastikan responsivitas dan ringannya rendering di Laptop, Tablet, dan HP.
