# Master Creator Studio — Drag & Drop City, Facility & NPC Builder (Khusus Mode Master `kikybahsoan`)

Fitur pembangunan dan tata kelola kota secara visual (*No-Code Drag & Drop City & NPC Studio*) khusus bagi akun Master `kikybahsoan` untuk:
1. Menambahkan **Fasilitas Kota, Fitur Kota, Papan Ide, dan Arena Games** baru dari stok katalog model bangunan,
2. Menggeser dan mengubah posisi **bangunan utama serta fasilitas publik yang sudah ada saat ini**,
3. Mengatur posisi, perilaku, dan rute pergerakan **NPC yang sudah ada saat ini**, serta **menambahkan NPC baru** lengkap dengan dialog dan pola jalannya,
4. Menyimpan seluruh perubahan dengan satu tombol **Simpan ke Kota** agar otomatis ter-update dan langsung dirasakan oleh seluruh warga Kota Refleksia.

## User Review & Critical Decisions

> [!IMPORTANT]
> Berikut adalah cakupan lengkap yang telah diperbarui sesuai arahan tambahan Anda dan siap diimplementasikan begitu Anda menekan tombol **Proceed**:

- **Katalog Model Bangunan Baru (Confirmed)**: Pustaka stok model 3D isometrik low-poly dalam 3 kategori utama:
  1. **Gedung Modern, Sekolah, Laboratorium & Kantor** (Menara Kaca, Lab Inovasi, Gedung Riset, Studio Kreatif, Pusat Karier).
  2. **Arena Games, Taman Hiburan & Panggung Acara** (Arcade Arena, Panggung Konser/Teater, Wahana Bianglala Mini, Arena Kompetisi E-Sports).
  3. **Fasilitas Publik, Kafe, Taman & Dekorasi Kota** (Kafe Terbuka, Paviliun Taman Baca, Air Mancur Mini, Pos Informasi, Taman Sakura).
- **Relokasi Bangunan & Fasilitas Publik Eksisting (Updated)**: Seluruh gedung asli kota (Balai Kota, Studio ON AIR, Perpustakaan, Pasar Prestasi, Kantor Pos, Pusat Refleksi, Lab DKV, Masjid Al-Hikmah, Bank Materi, Pencakar Langit, Bandara) dan fasilitas publik (Lapak Refleksia, Pohon Beringin Jurnal, Sudut Literasi, Api Unggun, Papan Pengumuman, Papan Peraturan, Wisma) dapat diklik lalu digeser (*drag-and-drop*) ke posisi baru di peta, disertai tombol **Reset ke Posisi Awal**.
- **Pengaturan Pergerakan NPC Eksisting & Penambahan NPC Baru (Updated)**:
  - **Edit NPC Saat Ini**: Mengubah posisi berjaga, kecepatan jalan, kalimat dialog, dan mode pergerakan NPC yang sudah ada (`Surya`, `Malik`, `Ma Uba`, `Patra`, `Pak Sufri`, `Wali Kota Sony`, dan `Komandan Nawa`).
  - **Tambah NPC Baru**: Menambahkan karakter NPC baru dengan kustomisasi tampilan (nama, jabatan/peran, gender, warna pakaian), daftar kalimat sapaan saat diklik warga, serta pola pergerakan (**Diam Berjaga**, **Keliling Area / Wander Radius**, atau **Rute Patroli Waypoint** di mana titik-titik rutenya bisa diklik langsung di peta).
- **Template Fungsi Interaktif & Drag Presisi (Confirmed)**: Mendukung **Snap ke Grid** maupun **Posisi Bebas**, serta 4 template fungsi siap pakai (**Arena Games/Kuis**, **Kotak Ide & Voting Warga**, **Informasi Fasilitas**, dan **Misi Komunitas**).

---

## 1. Overview & Core Concept

- **What It Does**: Menghadirkan mode **Creator Studio** eksklusif pada HUD Master `kikybahsoan`. Saat aktif, seluruh elemen di atas peta Kota Refleksia menjadi kanvas interaktif yang dapat diedit: Master dapat menaruh gedung baru dari katalog, memindahkan gedung atau fasilitas publik yang sudah ada, mengatur rute jalan NPC lama, maupun menerjunkan NPC baru ke kota.
- **Target Audience / Persona**:
  - **Master / Creator (`kikybahsoan`)**: Arsitek utama Kota Refleksia yang merancang tata ruang, menyusun alur keramaian NPC, dan meluncurkan fasilitas/permainan baru secara langsung di atas peta.
  - **Seluruh Warga Kota (Siswa, Guru, Tamu)**: Menikmati tata kota terbaru, bertegur sapa dengan NPC baru atau NPC yang berpatroli di rute baru, serta berinteraksi di fasilitas/gedung baru yang ditambahkan Master.
- **Key Value**: Memberikan kendali penuh (*full sandbox control*) atas seluruh bangunan, fasilitas, dan kehidupan NPC di Kota Refleksia secara visual tanpa perlu menulis ulang kode.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Aktivasi Creator Studio & Mode Edit**:
     - Master menekan tombol **Creator Studio** di bilah atas.
     - Tersedia 4 Tab Mode di dalam dock Creator Studio:
       - **Tab 1: Katalog Bangunan Baru** (Drag & drop stok model Gedung, Lab, Arena Games, Kafe, Taman).
       - **Tab 2: Tata Letak Kota Eksisting** (Pilih atau klik langsung gedung/fasilitas publik yang sudah ada di peta untuk digeser posisinya, diubah namanya/ikonnya, atau di-reset ke posisi bawaan).
       - **Tab 3: Kelola & Tambah NPC** (Pilih NPC yang sudah ada seperti *Sony, Surya, Malik, Ma Uba, Patra, Pak Sufri, Nawa* atau klik **+ Tambah NPC Baru**; atur posisi, mode jalan, kecepatan, rute patroli, dan dialognya).
       - **Tab 4: Inspector Kegunaan & Template** (Mengatur isi kuis/mini-game, papan ide warga, atau informasi fasilitas pada bangunan yang dipilih).
  2. **Drag & Drop Langsung di Peta (Snap Grid & Posisi Bebas)**:
     - Ketika mode Creator aktif, mengklik dan menahan (*pointer down & drag*) pada bangunan baru, bangunan eksisting, fasilitas publik, maupun NPC di atas kanvas akan langsung menggeser posisinya mengikuti kursor.
     - Tersedia tombol pengalih **Snap Grid (0.5 petak)** untuk penataan sejajar yang rapi atau **Posisi Bebas** untuk penempatan organik.
  3. **Editor Pergerakan & Rute Patroli NPC**:
     - Saat sebuah NPC (baik NPC asli maupun NPC baru) dipilih, Master dapat memilih 1 dari 3 mode gerak:
       - **Diam di Tempat (Statis)**: NPC berdiri di koordinat `(wx, wy)` dengan pilihan arah hadap (*kiri-depan, kanan-depan, kiri-belakang, kanan-belakang*).
       - **Keliling Area (Wander Radius)**: NPC berjalan santai secara acak di sekitar titik jangkar (*anchor*) dengan slider **Radius Area (`0.5m – 6.0m`)** dan **Kecepatan Jalan**.
       - **Rute Patroli (Waypoints)**: Master dapat menekan tombol **Rekam Titik Rute di Peta**, lalu mengklik beberapa titik di jalan raya/jembatan/taman. Garis putus-putus rute patroli akan tampil di atas peta, dan NPC akan berjalan menyusuri titik-titik tersebut secara berurutan.
  4. **Simpan & Publikasi Otomatis ke Seluruh Warga**:
     - Menekan tombol **Simpan ke Kota** akan menyimpan seluruh perubahan (gedung baru, posisi gedung/fasilitas lama, serta konfigurasi NPC lama & baru) dan menyiarkannya secara *real-time* ke seluruh warga.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Studio arsitektur & sutradara kota isometrik berbalut *deep obsidian glass* (`#0f172a/90`) yang elegan dan tidak menghalangi pandangan ke kanvas peta.
  - *Color Palette & Mood*: Aksen *Electric Cyan* (`#06b6d4`) untuk seleksi bangunan, *Amber Gold* (`#f59e0b`) untuk jalur patroli dan seleksi NPC, serta *Emerald Green* (`#10b981`) untuk indikator penyimpanan dan posisi valid.
  - *Typography & Hierarchy*: `Plus Jakarta Sans` untuk navigasi panel dan formulir template; `JetBrains Mono` (`tabular-nums`) untuk pembacaan koordinat `(wx, wy)`, radius gerak, dan kecepatan NPC.
  - *Component Styling & Layout*: *Floating Creator Dock* di sisi kiri/kanan yang dapat disembunyikan (*minimize*) menjadi bilah mini saat Master ingin melihat peta secara penuh.

- **Interactive Feedback & Motion**:
  - Indikator cincin sorot (*selection ring*) di bawah bangunan, fasilitas, atau kaki NPC yang sedang diedit.
  - Visualisasi lingkaran radius gerak (*wander radius circle*) atau garis penghubung titik patroli (*waypoint path lines*) di atas tanah saat mengedit pergerakan NPC.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Sistem Override Non-Destruktif untuk Bangunan, Fasilitas & NPC Eksisting**
  - *Chosen Approach*: Menyimpan perubahan posisi bangunan/fasilitas asli dan perubahan pergerakan NPC asli sebagai lapisan konfigurasi dinamis (*override map*) di atas data bawaan kota.
  - *Why*: Memungkinkan seluruh gedung, fasilitas publik (kafe, pohon beringin, sudut literasi, api unggun, papan pengumuman), dan ke-7 NPC utama dipindahkan atau diubah perilakunya secara bebas tanpa merusak fungsi khusus masing-masing (misalnya *Pak Sufri* tetap melayani tiket hutan & jual ikan di posisi barunya, *Komandan Nawa* tetap mencatat buku tamu gerbang, dan *Balai Kota* tetap membuka modal Balai Kota di lokasi barunya), serta mendukung fitur **Reset ke Default** kapan saja.
- **Decision 2: Mesin Perilaku NPC Terpadu (Static, Wander, & Multi-Waypoint Patrol)**
  - *Chosen Approach*: Memperbarui siklus pembaruan gerak NPC di kanvas agar membaca konfigurasi *real-time* dari Creator Studio (mendukung penambahan NPC baru secara langsung ke dalam *array* `npcsRef` tanpa perlu *reload* halaman) lengkap dengan logika penyeberangan jembatan sungai otomatis jika rute NPC melintasi Refleksia Timur.
  - *Why*: Agar Master `kikybahsoan` dapat langsung melihat NPC berjalan mengikuti rute atau kecepatan baru detik itu juga saat diedit.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        HUD Mode Master (kikybahsoan)                         │
│  [🚶 Jalan | ⚡ Teleport]   [🏗️ Creator Studio Toggle]   [💾 Simpan ke Kota] │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
     ┌─────────────────────────────────┼─────────────────────────────────┐
     ▼                                 ▼                                 ▼
┌─────────────────────────┐ ┌───────────────────────────┐ ┌─────────────────────────┐
│ 1. Bangunan & Katalog   │ │ 2. Relokasi Kota Eksisting│ │ 3. Studio NPC & Rute    │
│ ─────────────────────── │ │ ───────────────────────── │ │ ─────────────────────── │
│ • Stok Model 3 Kategori │ │ • Geser Gedung Utama      │ │ • Edit 7 NPC Utama Kota │
│ • Drag & Drop ke Peta   │ │ • Geser Fasilitas Publik  │ │ • + Tambah NPC Baru     │
│ • Template: Games/Kuis, │ │   (Kafe, Beringin, Api    │ │ • Mode: Diam, Wander    │
│   Ide Warga, Fasilitas, │ │   Unggun, Literasi, Papan)│ │   Radius, Rute Patroli  │
│   & Misi Komunitas      │ │ • Tombol Reset Default    │ │ • Edit Dialog & Kostum  │
└────────────┬────────────┘ └─────────────┬─────────────┘ └────────────┬────────────┘
             │                            │                            │
             └────────────────────────────┼────────────────────────────┘
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                   Isometric World Canvas & Simulation Loop                   │
│ ──────────────────────────────────────────────────────────────────────────── │
│ • Unified Raycaster: Deteksi klik & drag pada Gedung Baru, Gedung Lama,      │
│   Fasilitas Publik, dan NPC saat Creator Mode aktif                          │
│ • Visual Gizmos: Lingkaran Radius NPC, Garis Rute Waypoint, & Grid Snap      │
│ • Dynamic Collision & Proximity: Pintu masuk gedung & kolisi otomatis ikut   │
│   berpindah mengikuti koordinat gedung yang digeser                          │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│             Multi-Layer Persistence (Local + Broadcast + Cloud)              │
│ ──────────────────────────────────────────────────────────────────────────── │
│ • Menyimpan state terpadu `CityCreatorState`:                                │
│   - `customBuildings[]` (Gedung, Games, Ide & Fasilitas baru)                │
│   - `existingOverrides{}` (Koordinat baru Gedung & Fasilitas Publik asli)    │
│   - `npcOverrides{}` & `customNpcs[]` (Posisi, rute, speed & dialog NPC)     │
│ • Disinkronkan ke semua warga via BroadcastChannel & Cloud Spreadsheet Sync  │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `CityCreatorState`:
    1. `customBuildings: CreatorBuildingItem[]` — Bangunan baru dari katalog beserta konfigurasi template interaksinya (`games`, `ideas`, `facility_info`, `community_mission`) dan daftar kiriman ide/skor warga.
    2. `buildingOverrides: Record<string, { wx: number; wy: number; name?: string; tagline?: string; icon?: string }>` — Menyimpan perubahan posisi dan label untuk gedung-gedung utama (`BUILDINGS_INFO`) serta fasilitas publik (`cafe`, `beringin`, `literacy_corner`, `campfire`, `announcement_board`, `rules_board`, dan unit `wisma`).
    3. `npcConfigs: CreatorNpcConfig[]` — Mencakup *override* untuk ke-7 NPC bawaan (`surya`, `malik`, `ma_uba`, `patra`, `sufri`, `sony`, `nawa`) serta daftar NPC baru buatan Master, berisi `id`, `name`, `handle`, `roleLabel`, `roleStyle`, `gender`, `shirtColor`, `pantsColor`, `hairColor`, `wx`, `wy`, `moveMode` (`'static'` | `'wander'` | `'patrol'`), `wanderRadius`, `patrolWaypoints`, `speed`, `facing`, dan `speeches[]`.
- **Interactive Component & State Mapping**:
  - **Pemindahan Gedung & Fasilitas Eksisting**:
    - Ketika gedung atau fasilitas asli digeser di peta, fungsi perenderan, deteksi klik, batas kolisi (`SOLID_BUILDING_OBSTACLES`), dan titik berhentinya avatar secara dinamis menghitung selisih perpindahan `(\Delta wx, \Delta wy)` dari posisi awal gedung tersebut.
  - **Editor Rute Patroli NPC di Atas Peta**:
    - Ketika Master memilih mode **Rute Patroli** pada sebuah NPC dan mengaktifkan tombol **+ Titik Rute di Peta**, setiap klik di atas tanah kanvas akan menambahkan koordinat `[wx, wy]` ke dalam `patrolWaypoints` NPC tersebut dan menggambar garis rute bernomor `1 → 2 → 3` secara visual di atas peta.
