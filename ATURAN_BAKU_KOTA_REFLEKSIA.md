# ATURAN BAKU PENGEMBANGAN KOTA REFLEKSIA
**(Berlaku untuk SETIAP penambahan fasilitas, ide, materi, dan fitur baru)**

Dokumen ini merupakan konstitusi dan aturan baku pengembangan aplikasi **Kota Refleksia**. Setiap penambahan wilayah, gedung, fitur interaktif, materi pembelajaran, maupun integrasi database wajib mematuhi seluruh pasal di bawah ini.

---

## A. JANGAN MERUSAK YANG SUDAH ADA
1. **Pertahankan Fitur Lama 100%**: Jangan hapus, ganti nama, atau ubah perilaku fitur lama: login (Siswa, Guru, Tamu Kota), Ruang Guru, Teleport/Jalan (Menu Cepat 2D), obrolan kelas/warga, XP/koin, notifikasi, 10 bangunan lama, dan pemain online real-time.
2. **Prinsip Additive (Menambah)**: Perubahan bersifat menambah (*additive*). Jika harus mengubah kode lama, sebutkan alasannya dan bagian yang diubah sebelum/saat menuliskan kodenya.
3. **Keutuhan Struktur Spreadsheet**: Struktur sheet lama tidak boleh berubah. Kolom atau sheet baru (seperti `Data_Bangunan_Kota`) wajib ditambahkan di belakang tanpa merusak urutan kolom sheet lama.

---

## B. PETA DAN TATA LETAK
4. **Koordinat Jelas & Bebas Tumpang Tindih**: Setiap fasilitas baru menempati kotak yang jelas (koordinat `wx, wy`), tidak menimpa bangunan, jalan, pohon, atau sungai yang sudah ada.
5. **Konektivitas Jalan, Jembatan & Teleport**: Wilayah baru wajib terhubung ke kota lama lewat jalan atau jembatan dan bisa dijangkau melalui fitur Teleport (**Menu Cepat 2D / Kompas**).
6. **Konsistensi Visual Isometrik**: Gaya visual konsisten: proyeksi isometrik 2.5D, palet warna serasi (siang/sore/malam), ukuran bangunan proporsional, dan label nama mengambang (*overhead tag*) yang seragam.
7. **Responsif di HP & Laptop**: Tampilan harus tetap rapi, proporsional, dan nyaman dioperasikan baik di layar HP maupun laptop.

---

## C. SETIAP BANGUNAN/FASILITAS BARU WAJIB PUNYA
8. **Identitas & Tujuan Belajar**: Memiliki Nama, Ikon, Deskripsi Singkat, dan Tujuan Belajar (apa yang dipelajari siswa di sana).
9. **Menu Standar + Fitur Khas Relevan**: Memiliki menu standar: **Materi**, **Refleksi**, dan **Bertanya pada Guru**. Fitur tambahan (seperti Katalog Belanja Mall, Galeri Karya Museum, Panggung Presentasi, Boarding Pass Bandara, dll.) ditambahkan sesuai konteks gedung.
10. **Kapasitas & Aturan Masuk**: Memiliki informasi kapasitas maksimal warga, jam buka operasional, dan status akses (Terbuka / Terkunci oleh Guru).
11. **Hadiah XP & Batas Harian (Daily Cap)**: Memberikan hadiah XP/poin untuk menyelesaikan aktivitas belajar dengan **batas harian per gedung** agar poin tidak bisa dikuras secara berulang-ulang di hari yang sama.

---

## D. MATERI DAN PEMBELAJARAN BARU
12. **Penyimpanan Materi di Spreadsheet**: Materi disimpan dan disinkronkan dengan Spreadsheet (judul, mata pelajaran, kelas target, isi, tautan, status aktif/nonaktif) sehingga guru bisa menambah/mengelola tanpa harus mengubah kode.
13. **Komponen Wajib Materi**: Setiap materi wajib memiliki Tujuan Pembelajaran (TP), Aktivitas, dan Pertanyaan Refleksi.
14. **Filter & Visibilitas per Kelas**: Guru bisa menyembunyikan atau menampilkan materi untuk kelas tertentu (`X DKV 2`, `X DKV 3`, atau semua kelas).
15. **Bahasa & Etika Konten**: Menggunakan bahasa Indonesia yang sederhana, santun, dan sesuai usia siswa SMK. Bebas dari unsur SARA, kekerasan nyata, maupun iklan komersial.

---

## E. DATA DAN SPREADSHEET
16. **ID Unik & Timestamp**: Setiap baris data baru wajib memiliki ID unik dan kolom waktu pencatatan (`createdAt` / `timestamp`).
17. **Privasi Data Siswa**: Jawaban detail/kunci kuis, nilai evaluasi pribadi, dan data pribadi siswa tidak boleh bocor atau terbaca oleh siswa lain yang tidak berhak.
18. **Validasi Peran Guru**: Fitur khusus guru (seperti Bank Materi, kunci gedung, moderasi obrolan, dan pengaturan kota) wajib memeriksa peran akun (`isTeacher`), bukan sekadar menyembunyikan tombol di antarmuka.
19. **Rekomendasi Backup**: Sebelum melakukan perubahan besar pada struktur atau skrip Spreadsheet, guru disarankan membuat salinan (*File -> Make a copy*) pada Google Spreadsheet.

---

## F. PERFORMA
20. **Pembatasan Frekuensi Polling**: Batasi frekuensi permintaan sinkronisasi ke server/Spreadsheet (interval aman, tidak melakukan *spam request* terus-menerus setiap milidetik).
21. **Grafis & Animasi Ringan (Frustum Culling)**: Gambar dan animasi kanvas harus ringan (menggunakan *viewport frustum culling* sehingga objek di luar layar tidak dirender sia-sia) agar kota tetap lancar di HP biasa.

---

## G. KEAMANAN DAN ETIKA SISWA
22. **Filter Kata Kasar & Pencatatan**: Seluruh obrolan dan input teks siswa disaring dari kata kasar/tidak pantas secara otomatis dan terekam agar guru bisa memantau.
23. **Kontrol Moderasi Guru**: Guru memiliki kendali untuk mengunci obrolan publik, mengeluarkan/membatasi pemain yang melanggar aturan, atau menutup sementara suatu bangunan untuk kegiatan terfokus.
24. **Identitas Sekolah Aman**: Nama yang tampil di atas avatar dan papan peringkat menggunakan identitas sekolah (Nama Siswa & Kelas), bukan data pribadi sensitif (seperti NIK, alamat rumah, atau nomor telepon pribadi).

---

## H. HASIL KERJA AI (STANDAR DOKUMENTASI SETIAP PERUBAHAN)
25. Setiap kali menyelesaikan penambahan atau pembaruan fitur, wajib menuliskan laporan terstruktur yang mencakup:
    - **(a) Apa yang ditambahkan**
    - **(b) File/bagian kode yang berubah beserta alasannya**
    - **(c) Sheet/kolom baru yang harus dibuat di Google Spreadsheet**
    - **(d) Cara mengujinya**
    - **(e) Risiko yang mungkin terjadi pada fitur lama dan mitigasinya**
