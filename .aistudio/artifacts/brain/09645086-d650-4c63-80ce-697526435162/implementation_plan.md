# Rencana Implementasi: Sinkronisasi Multi-Device, Efek Siram Pohon Apel, & 4 Bangku Air Mancur

Peningkatan fitur interaktif dan visual pada Kota Refleksia SMK Negeri 2 Gorontalo, mencakup sinkronisasi pergerakan avatar online antarperangkat, visual efek siram pohon dan buah apel yang memudar otomatis, serta penambahan 4 bangku taman di sekeliling air mancur dengan posisi duduk yang presisi.

## User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan yang telah dikonfirmasi bersama pengguna:
> 1. **Siklus Apel Pohon**: Setelah disiram air dengan efek partikel percikan, buah apel merah ranum akan muncul di dahan pohon dan otomatis memudar perlahan (*fade-out*) setelah 8 detik hingga pohon kembali normal.
> 2. **Bangku Air Mancur**: Tersedia 4 bangku di sekeliling air mancur pusat (Utara, Selatan, Timur, Barat). Saat diklik, avatar akan berjalan mendekati bangku lalu duduk menghadap ke pusat air mancur dengan pose duduk yang pas dan rapi di atas bangku.

---

## 1. Overview & Core Concept

1. **Sinkronisasi Multi-Device yang Handal**:
   - Memastikan dua atau lebih pengguna yang membuka aplikasi di perangkat/tab berbeda dapat melihat avatar satu sama lain secara langsung di peta 15x15.
   - Avatar perangkat lain akan muncul (*spawn*) dari salah satu dari 4 sudut terluar peta dengan efek teleportasi portal, bergerak halus mengikuti arah dan koordinat tujuan, serta menghilang seketika saat perangkat lain ditutup/offline.
2. **Interaksi Siram Pohon & Apel**:
   - Saat avatar berada di dekat pohon dan memilih aksi siram: muncul semprotan partikel tetesan air melengkung ke mahkota pohon, diiringi audio air dan visual riak air di tanah.
   - Buah apel merah ranum muncul di dahan, bergoyang lembut, dan setelah 6-8 detik memudar secara halus (*opacity transition*) sebelum hilang.
3. **4 Bangku Taman di Sekeliling Air Mancur**:
   - Menambahkan 4 bangku kayu berbingkai besi elegan mengitari air mancur monumen warga di arah mata angin (Utara, Timur, Selatan, Barat).
   - Memperbaiki kalkulasi offset rendering avatar saat duduk (`isSitting`) agar tubuh avatar duduk tepat di atas kayu dudukan, dengan kaki terlipat wajar dan arah pandang menghadap ke air mancur.

---

## 2. User Experience & Visual Design

### A. Alur Interaksi Duduk di Bangku Air Mancur
```
[Klik Bangku Air Mancur] ──► [Avatar Berjalan ke Bangku] ──► [Duduk Sempurna Menghadap Air Mancur]
                                                                        │
[Klik Sembarang Tanah/Peta] ◄──────────────────────────────────────────┘
(Avatar Bangkit & Berjalan)
```
- **Bangku Air Mancur**:
  - **Bangku Utara** `(0.0, -1.35)`: Menghadap ke bawah/selatan (ke air mancur).
  - **Bangku Selatan** `(0.0, 1.35)`: Menghadap ke atas/utara (ke air mancur).
  - **Bangku Timur** `(1.35, 0.0)`: Menghadap ke kiri/barat (ke air mancur).
  - **Bangku Barat** `(-1.35, 0.0)`: Menghadap ke kanan/timur (ke air mancur).
- **Visual Duduk**: Kaki ditekuk ke bawah tanpa ayunan langkah, posisi pinggul dan torso bersandar tepat di atas bantalan kayu bangku.

### B. Alur Siram Pohon & Buah Apel
- **Detik 0 - 1.5**: Avatar menghadap pohon, partikel semprotan air berkilau (*water droplet arcs*) memancar dari tangan/alat siram ke dedaunan pohon, disertai efek tetesan air jatuh ke tanah.
- **Detik 1.5 - 6.0**: Pohon menjadi hijau segar bercahaya, 6 buah apel merah ranum muncul di ranting pohon dengan kilauan cahaya.
- **Detik 6.0 - 8.0**: Buah apel perlahan-lahan memudar (*fade-out alpha 1.0 -> 0.0*) hingga kembali ke kondisi pohon asri biasa.

### C. Alur Sinkronisasi Multi-Device
```
[Perangkat A: Klik Tujuan]
       │
       ▼
[Broadcast Instan + POST /api/presence/heartbeat]
       │
       ▼
[Server Online State Map] ──► [Perangkat B: Heartbeat Update (1000ms / Broadcast 0ms)]
                                        │
                                        ▼
                  [Perangkat B Merender Avatar A Bergerak Real-Time]
```

---

## 3. Key Technical Decisions & Data Strategy

### A. Arsitektur Komponen & Sinkronisasi
```
┌────────────────────────────────────────────────────────┐
│                      server.ts                         │
│  - onlinePlayersMap: Map<id, ServerOnlinePlayer>       │
│  - POST /api/presence/heartbeat (Simpan & kirim others)│
│  - POST /api/presence/leave (Hapus saat unload)        │
│  - purgeInactivePlayers() interval 3s (timeout 10s)    │
└───────────────────────────▲────────────────────────────┘
                            │ HTTP & BroadcastChannel
┌───────────────────────────┴────────────────────────────┐
│               ThreeTownCanvas.tsx                      │
│  - playerRef: Avatar lokal pemain                      │
│  - remotePlayersRef: Map remote avatars                │
│  - MAP_CORNERS: 4 sudut spawn (ujung platform)         │
│  - FOUNTAIN_BENCHES: 4 bangku di sekeliling air mancur │
│  - wateredTrees: Map<treeIndex, { time, progress }>   │
│  - Render loop: Canvas 2D isometric depth sorting      │
└────────────────────────────────────────────────────────┘
```

### B. Perbaikan Khusus pada Sinkronisasi Multi-Device
1. **Pemisahan Sesi Unik**:
   - `clientDeviceId` dihasilkan secara persisten di `sessionStorage` (`kota_device_uuid`).
   - `mySessionId = ${role}_${handle}_${deviceId}` memastikan 2 perangkat atau 2 tab dengan akun yang sama/berbeda tidak pernah saling menimpa data di server.
2. **Pemberitahuan Posisi Instan**:
   - Selain timer 1000ms, setiap kali pemain mengeklik lokasi berjalan di kanvas, `sendHeartbeatRef.current?.()` langsung dieksekusi secara instan, menyiarkan koordinat target `targetWx, targetWy` melalui `BroadcastChannel` (0ms delay) dan backend API.
3. **Interpolasi Posisi Halus**:
   - Jika jarak pemain remote terhadap target kecil (< 4.5 tile), posisi diperbarui dengan interpolasi `speed * delta` sehingga terlihat animasi kaki berjalan dan menghadap arah tujuan.
   - Jika terjadi disconnect/teleportasi jauh (> 4.5 tile), koordinat di-snap agar tidak berjalan menembus dinding selamanya.

---

## 4. Langkah-Langkah Pengerjaan

1. **Bangku Air Mancur & Pose Duduk**:
   - Definisikan 4 bangku air mancur: `fountain_north`, `fountain_south`, `fountain_east`, `fountain_west` pada radius 1.35 dari pusat air mancur `(0, 0)`.
   - Update `drawItems` untuk merender ke-4 bangku dengan orientasi isometrik yang sesuai.
   - Sempurnakan logika pose duduk `isSitting`:
     - Hitung offset `avY` dan arah hadap (`facing`) avatar secara otomatis sesuai bangku yang diduduki sehingga menghadap ke pusat air mancur.
     - Sediakan interaksi klik bangku yang menggerakkan avatar ke titik bangku dan langsung mengaktifkan pose duduk.

2. **Efek Air Siram Pohon & Buah Apel 8 Detik**:
   - Tambahkan state `waterSprayEffects`: array animasi partikel tetesan air yang memancar ke pohon saat tombol siram ditekan.
   - Tambahkan state waktu penyiraman pohon `treeWateredAt: Record<number, number>`.
   - Di render loop pohon:
     - Jika pohon sedang dalam durasi 8 detik setelah disiram:
       - Render partikel air memancar pada detik 0 - 1.5.
       - Render buah apel merah ranum dengan transparansi dinamis (`alpha = 1.0` pada detik 0-6, dan `alpha = (8 - elapsed) / 2` pada detik 6-8).
     - Setelah lewat 8 detik, apel hilang secara bersih dan pohon kembali normal.

3. **Optimasi Sinkronisasi Multi-Device**:
   - Verifikasi endpoint `/api/presence/heartbeat` dan pembersihan offline di `server.ts`.
   - Pastikan setiap avatar remote memiliki lencana nama `@handle 🟢`, status gerak `walkFrame`, dan terhapus saat offline.
   - Uji kompilasi dengan `compile_applet` dan `lint_applet`.
