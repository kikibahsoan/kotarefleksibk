import { ReflectionEntry, Reflection, MentorFeedback } from '../types/index.ts';

// ============================================================================
// 1. ARSIP JURNAL 4F PERPUSTAKAAN KAMPUS (30 SISWA: 15 X DKV 2 + 15 X DKV 3)
// Mata Pelajaran: Informatika (Berpikir Komputasional)
// ============================================================================
export const LIBRARY_4F_ARCHIVE_SEEDS: ReflectionEntry[] = [
  // --- 15 SISWA ACAK DARI KELAS X DKV 2 ---
  {
    id: 'j4f-bk-dkv2-01',
    studentId: 'std-dkv2-02',
    studentName: 'DZAKY ALMIER JAMAIL HARUN',
    className: 'X DKV 2',
    title: 'Buku 1: Model Input-Process-Output (IPO) pada Arsitektur Von Neumann',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari cara kerja arsitektur Von Neumann yang membagi sistem komputasi menjadi Input, Process (CPU & RAM), serta Output saat merancang poster digital di studio DKV.',
    feelings:
      'Sangat antusias karena baru memahami bahwa goresan pen tablet adalah Input dan layer aktif di Adobe Illustrator ditampung sementara di RAM.',
    findings:
      'Semakin banyak layer beresolusi tinggi yang dibuka bersamaan, semakin besar kapasitas meja kerja (RAM) yang dibutuhkan agar proses rendering tidak mengalami lag.',
    future:
      'Saya akan merapikan struktur layer desain, menutup aplikasi latar belakang yang tidak dipakai, dan rutin menekan Ctrl+S.',
    date: '14 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-02',
    studentId: 'std-dkv2-03',
    studentName: 'MOH. FADEL R. TILAMEO',
    className: 'X DKV 2',
    title: 'Buku 2: Peran Sistem Operasi dalam Mengelola Proses IPO',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari fungsi Sistem Operasi dalam mengatur giliran pemakaian CPU, RAM, dan printer menggunakan algoritma penjadwalan FIFO dan Shortest Job First (SJF).',
    feelings:
      'Tertantang saat membandingkan antrean cetak banner di bengkel Tefa DKV menggunakan metode FIFO vs SJF.',
    findings:
      'Metode FIFO dapat menimbulkan Convoy Effect apabila ada satu file render video berdurasi panjang di urutan pertama yang menahan puluhan tugas cetak poster ringan di belakangnya.',
    future:
      'Menerapkan prinsip Shortest Job First (SJF) saat kerja kelompok dengan menyelesaikan ekspor aset ikon kecil terlebih dahulu.',
    date: '14 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-03',
    studentId: 'std-dkv2-04',
    studentName: 'MOH. FITRAH LAWANI',
    className: 'X DKV 2',
    title: 'Buku 3: Tahapan Proses Komputasi Data & Data-Driven Design',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari 4 tahapan komputasi data (Pengumpulan, Data Cleaning, Pengolahan, dan Visualisasi) untuk merancang desain kemasan UMKM lokal Gorontalo.',
    feelings:
      'Senang karena menyadari bahwa keputusan memilih warna dan font desain menjadi jauh lebih tepat sasaran jika didukung data riset audiens.',
    findings:
      'Tahap Data Cleaning wajib dilakukan untuk membuang kuesioner ganda atau kosong agar analisis desain tidak terjebak prinsip Garbage In, Garbage Out.',
    future:
      'Melakukan survei singkat dan membersihkan data responden sebelum menentukan palet warna poster kegiatan sekolah.',
    date: '14 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-04',
    studentId: 'std-dkv2-06',
    studentName: 'MOH. REYHAN MANSYUR',
    className: 'X DKV 2',
    title: 'Buku 4: Struktur Data Dasar (Array, Stack, Queue) & Algoritma Standar',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari struktur data Array pada Color Swatches, Stack (LIFO) pada fitur Undo (Ctrl+Z) dan Layer, serta Queue (FIFO) pada antrean Render.',
    feelings:
      'Kagum mengetahui bahwa tombol Undo yang saya gunakan setiap hari di Photoshop bekerja menggunakan prinsip Stack (Last In, First Out).',
    findings:
      'Goresan kuas atau aksi terakhir yang masuk ke memori Stack adalah aksi pertama yang dibatalkan ketika menekan Ctrl+Z.',
    future:
      'Menata tumpukan layer secara berurutan dari elemen teratas (Headline) hingga terbawah (Background) sesuai logika Stack.',
    date: '14 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-05',
    studentId: 'std-dkv2-07',
    studentName: 'MOHAMAD AZAN DAUD',
    className: 'X DKV 2',
    title: 'Buku 5: Efisiensi & Keakuratan Algoritma Pencarian & Pengurutan',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Membandingkan efisiensi algoritma Linear Search dan Binary Search saat mencari 1 file aset desain di antara 1.024 koleksi font dan vektor.',
    feelings:
      'Takjub melihat Binary Search hanya membutuhkan maksimal 10 langkah pembelahan dibanding Linear Search yang bisa memeriksa hingga 1.024 kali.',
    findings:
      'Syarat mutlak agar algoritma Binary Search dapat dijalankan adalah seluruh data atau nama file wajib diurutkan (Sorting) terlebih dahulu.',
    future:
      'Merapikan penamaan seluruh folder proyek DKV menggunakan format Tahun_Bulan_NamaProyek agar selalu terurut otomatis.',
    date: '13 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-06',
    studentId: 'std-dkv2-09',
    studentName: 'MOH. RASYA BADOE',
    className: 'X DKV 2',
    title: 'Buku 1: Model Input-Process-Output (IPO) pada Arsitektur Von Neumann',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Menganalisis kualitas bahan mentah pada tahap Input (foto RAW, brief klien, font) dan pengaruhnya terhadap hasil akhir Output cetak maupun digital.',
    feelings:
      'Puas karena berhasil menemukan penyebab poster cetak A3 sebelumnya tampak pecah, yaitu resolusi file foto pada tahap Input terlalu rendah.',
    findings:
      'Jika kualitas data pada tahap Input buruk (di bawah 72 dpi), maka pengolahan sehebat apa pun di tahap Process tidak akan menghasilkan Output cetak yang tajam.',
    future:
      'Membuat checklist pengecekan resolusi gambar (minimal 300 dpi untuk cetak) pada tahap Input sebelum mulai mendesain.',
    date: '13 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-07',
    studentId: 'std-dkv2-10',
    studentName: 'MUHAMAD FAREL KAMUMU',
    className: 'X DKV 2',
    title: 'Buku 2: Peran Sistem Operasi dalam Mengelola Proses IPO',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari bagaimana Sistem Operasi mencegah terjadinya Deadlock ketika beberapa aplikasi desain berat berjalan secara bersamaan.',
    feelings:
      'Merasa tercerahkan karena mengerti alasan komputer bisa macet total (hang/deadlock) saat CorelDRAW, Photoshop, dan render video berebut RAM.',
    findings:
      'Manajemen memori yang baik oleh Sistem Operasi dan disiplin pengguna menutup tab aplikasi yang tidak aktif sangat menjaga kelancaran proses kerja.',
    future:
      'Membagi tahapan kerja desain secara bertahap dan tidak membuka semua software grafis berat dalam waktu bersamaan.',
    date: '13 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-08',
    studentId: 'std-dkv2-11',
    studentName: 'MUHAMAD RIFAI PADJA',
    className: 'X DKV 2',
    title: 'Buku 3: Tahapan Proses Komputasi Data & Data-Driven Design',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempraktikkan pengolahan data hasil angket siswa menjadi visualisasi grafik batang (Bar Chart) dan diagram lingkaran (Pie Chart).',
    feelings:
      'Bersemangat karena grafik visual membuat laporan riset desain kemasan terlihat jauh lebih meyakinkan dan mudah dibaca.',
    findings:
      'Diagram batang sangat efektif untuk membandingkan jumlah pemilih tiap kategori warna, sedangkan diagram lingkaran tepat untuk menampilkan proporsi persentase.',
    future:
      'Menambahkan infografis berbasis data bersih pada proyek poster kampanye literasi digital sekolah.',
    date: '13 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-09',
    studentId: 'std-dkv2-12',
    studentName: 'KELVIANUS P. DASSI',
    className: 'X DKV 2',
    title: 'Buku 4: Struktur Data Dasar (Array, Stack, Queue) & Algoritma Standar',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari tiga pola dasar algoritma pemrograman kreatif: Sequential (berurutan), Branching (percabangan IF-ELSE), dan Looping (perulangan).',
    feelings:
      'Senang karena pola Looping mempermudah saya menggandakan ornamen bingkai Karawo di tepi poster secara presisi dalam hitungan detik.',
    findings:
      'Logika Branching sangat berguna dalam alur kerja DKV: JIKA desain untuk dicetak spanduk MAKA gunakan mode warna CMYK, JIKA untuk media sosial gunakan RGB.',
    future:
      'Menyusun flowchart Sequential dan Branching sederhana sebelum mengekspor karya desain akhir di Lab DKV.',
    date: '12 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-10',
    studentId: 'std-dkv2-13',
    studentName: 'RAIHAN RIZKI WAHID DUNDA',
    className: 'X DKV 2',
    title: 'Buku 5: Efisiensi & Keakuratan Algoritma Pencarian & Pengurutan',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Menguji langkah pencarian file aset menggunakan metode bagi dua (Binary Search) pada folder berisi 256 foto produk yang sudah diurutkan A–Z.',
    feelings:
      'Bangga karena berhasil menghitung dengan tepat bahwa 256 file terurut hanya membutuhkan maksimal 8 langkah pemeriksaan (2^8 = 256).',
    findings:
      'Pengurutan data (Sorting) di awal memang membutuhkan sedikit ketelitian, namun menghemat waktu pencarian aset ratusan kali lipat saat produksi.',
    future:
      'Menata seluruh koleksi font dan ikon vektor di komputer lab ke dalam subfolder terurut berdasarkan abjad dan kategori.',
    date: '12 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-11',
    studentId: 'std-dkv2-14',
    studentName: 'SYAFRIN ANTUNGO',
    className: 'X DKV 2',
    title: 'Buku 1: Model Input-Process-Output (IPO) pada Arsitektur Von Neumann',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari perbedaan fungsi penyimpanan sementara (RAM yang bersifat volatile) dan penyimpanan permanen (SSD/Harddisk) dalam arsitektur Von Neumann.',
    feelings:
      'Lega setelah memahami mengapa file desain yang belum di-save bisa hilang saat listrik padam karena masih berada di memori RAM.',
    findings:
      'CPU bekerja mengolah kurva vektor dan efek warna, RAM menampung pekerjaan yang sedang aktif dibuka, sedangkan SSD menyimpan file proyek secara permanen.',
    future:
      'Mengaktifkan fitur Auto-Save setiap 5 menit dan membiasakan shortcut Ctrl+S setiap selesai menambahkan elemen penting.',
    date: '12 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-12',
    studentId: 'std-dkv2-17',
    studentName: 'AHWIDNA AHYAR',
    className: 'X DKV 2',
    title: 'Buku 2: Peran Sistem Operasi dalam Mengelola Proses IPO',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mengkaji peran Sistem Operasi sebagai pengatur lalu lintas sumber daya perangkat keras dan simulasi penjadwalan proses di laboratorium.',
    feelings:
      'Senang karena analogi antrean kasir kantin dan antrean mesin cetak membuat konsep FIFO dan SJF sangat mudah dipahami.',
    findings:
      'Algoritma SJF meminimalkan rata-rata waktu tunggu seluruh pengguna dengan mendahulukan pekerjaan yang waktu eksekusinya paling singkat.',
    future:
      'Menerapkan manajemen waktu ala SJF saat mengerjakan daftar revisi desain dari guru pembimbing.',
    date: '12 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-13',
    studentId: 'std-dkv2-18',
    studentName: 'AISYAH MOHAMAD',
    className: 'X DKV 2',
    title: 'Buku 3: Tahapan Proses Komputasi Data & Data-Driven Design',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari studi kasus kegagalan kemasan keripik pisang yang dirancang tanpa riset data serta cara memperbaikinya dengan 4 tahapan komputasi data.',
    feelings:
      'Tertarik sekali karena belajar bahwa desainer profesional merancang karya berdasarkan data kebutuhan audiens, bukan sekadar tebakan pribadi.',
    findings:
      'Pengumpulan data survei yang diikuti pembersihan data (Data Cleaning) menghasilkan informasi akurat mengenai preferensi warna dan keterbacaan tipografi konsumen.',
    future:
      'Menggunakan kuesioner digital singkat sebelum merancang identitas visual atau poster acara sekolah.',
    date: '11 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-14',
    studentId: 'std-dkv2-19',
    studentName: 'ERLINA DWI DARYANTI',
    className: 'X DKV 2',
    title: 'Buku 4: Struktur Data Dasar (Array, Stack, Queue) & Algoritma Standar',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari bagaimana deretan palet warna (Color Swatches) dan frame timeline animasi disimpan secara terindeks menggunakan struktur data Array.',
    feelings:
      'Gembira karena istilah struktur data Array, Stack, dan Queue yang tadinya terdengar rumit ternyata ada di semua fitur aplikasi desain.',
    findings:
      'Array memudahkan akses cepat ke elemen warna berdasarkan indeks urutan (0, 1, 2, dst.), sedangkan Queue menjaga antrean ekspor video di Media Encoder tetap tertib.',
    future:
      'Menyusun palet warna terindeks (Array Swatches) terlebih dahulu sebelum mewarnai ilustrasi dan poster di Lab DKV.',
    date: '11 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv2-15',
    studentId: 'std-dkv2-22',
    studentName: 'NAYSILA OKTAVIANI YUNUS',
    className: 'X DKV 2',
    title: 'Buku 5: Efisiensi & Keakuratan Algoritma Pencarian & Pengurutan',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari budaya kerja rapi di studio DKV melalui penerapan algoritma pengurutan (Sorting) dan pencarian cepat (Binary Search).',
    feelings:
      'Termotivasi untuk merapikan file tugas karena sadar betapa banyak waktu yang terbuang jika mencari file secara acak (Linear Search).',
    findings:
      'Penamaan file dan layer yang konsisten serta terurut memungkinkan kita maupun rekan satu tim menemukan aset yang dibutuhkan hanya dalam hitungan detik.',
    future:
      'Menggunakan standar penamaan berurut (01_Header, 02_Subjudul, 03_Ilustrasi, 04_Footer) pada seluruh layer desain poster.',
    date: '11 Nov 2026',
    xpEarned: 2,
  },

  // --- 15 SISWA ACAK DARI KELAS X DKV 3 ---
  {
    id: 'j4f-bk-dkv3-01',
    studentId: 'std-dkv3-01',
    studentName: 'ABDUL KADIR YUSUF',
    className: 'X DKV 3',
    title: 'Buku 1: Model Input-Process-Output (IPO) pada Arsitektur Von Neumann',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari alur kerja sistem komputasi Input-Process-Output (IPO) pada arsitektur Von Neumann dan penerapannya di studio Desain Komunikasi Visual.',
    feelings:
      'Senang dan bangga karena dapat memetakan perangkat studio DKV seperti kamera DSLR dan scanner sebagai perangkat Input serta monitor kalibrasi dan printer sebagai Output.',
    findings:
      'Proses manipulasi kurva vektor dan color grading dihitung oleh CPU/GPU sementara seluruh layer yang sedang diedit ditampung di dalam RAM.',
    future:
      'Menyiapkan seluruh bahan Input (brief, sketsa, font, foto) dalam satu folder khusus sebelum memulai tahap Process di komputer lab.',
    date: '14 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-02',
    studentId: 'std-dkv3-02',
    studentName: 'ABDURRAHMAN KASMAN',
    className: 'X DKV 3',
    title: 'Buku 2: Peran Sistem Operasi dalam Mengelola Proses IPO',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari cara Sistem Operasi mengelola antrean proses kerja menggunakan algoritma FIFO (First In First Out) dan SJF (Shortest Job First).',
    feelings:
      'Tertantang ketika melakukan simulasi perbandingan waktu tunggu antrean rendering grafis di kelas X DKV 3.',
    findings:
      'Mendahulukan pekerjaan berdurasi singkat (SJF) seperti ekspor 5 logo vektor ukuran kecil membuat antrean produksi jauh lebih lancar daripada menunggu render animasi 3D.',
    future:
      'Mengatur jadwal kerja kelompok proyek DKV dengan menyelesaikan tugas-tugas berdurasi pendek terlebih dahulu agar tidak terjadi penumpukan.',
    date: '14 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-03',
    studentId: 'std-dkv3-04',
    studentName: 'AULIA R. AJUBA',
    className: 'X DKV 3',
    title: 'Buku 3: Tahapan Proses Komputasi Data & Data-Driven Design',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari 4 tahapan komputasi data untuk mendukung perancangan desain berbasis bukti riset audiens (Data-Driven Design).',
    feelings:
      'Antusias karena belajar cara menyaring data kuesioner yang rusak pada tahap Data Cleaning sebelum diolah menjadi grafik.',
    findings:
      'Data yang bersih dan disajikan dalam bentuk diagram visual memudahkan klien maupun guru memahami alasan pemilihan konsep desain dalam waktu singkat.',
    future:
      'Selalu menyertakan grafik hasil survei target audiens pada lembar presentasi konsep karya poster di kelas.',
    date: '14 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-04',
    studentId: 'std-dkv3-05',
    studentName: 'KATLA ALFIANI ABDULLAH',
    className: 'X DKV 3',
    title: 'Buku 4: Struktur Data Dasar (Array, Stack, Queue) & Algoritma Standar',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari perbedaan struktur data Array, Stack (LIFO), dan Queue (FIFO) beserta contoh nyatanya pada perangkat lunak desain grafis.',
    feelings:
      'Senang sekali karena memahami mengapa fitur Undo dan tumpukan Layer menggunakan struktur data Stack sedangkan antrean cetak menggunakan Queue.',
    findings:
      'Kombinasi algoritma Sequential, Branching, dan Looping membantu desainer mengotomatiskan pekerjaan berulang dengan hasil yang tetap konsisten.',
    future:
      'Memanfaatkan pola Looping (duplikasi terukur) saat membuat pola grid dan ornamen dekoratif pada tugas poster publikasi.',
    date: '14 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-05',
    studentId: 'std-dkv3-06',
    studentName: 'M. WAHYUDIN USMAN',
    className: 'X DKV 3',
    title: 'Buku 5: Efisiensi & Keakuratan Algoritma Pencarian & Pengurutan',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari algoritma Sorting (pengurutan) dan membandingkan kecepatan Linear Search vs Binary Search pada manajemen aset digital.',
    feelings:
      'Terkesima karena untuk mencari 1 file di antara 1.024 file yang sudah terurut, Binary Search hanya memerlukan maksimal 10 kali pengecekan.',
    findings:
      'Tanpa proses Sorting terlebih dahulu, komputer terpaksa melakukan pencarian satu per satu (Linear Search) yang memakan waktu lama.',
    future:
      'Mengurutkan dan menamai ulang seluruh file aset fotografi dan tipografi di folder kerja X DKV 3 secara konsisten.',
    date: '13 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-06',
    studentId: 'std-dkv3-08',
    studentName: 'MOH AQZA AKBAR LAKORO',
    className: 'X DKV 3',
    title: 'Buku 1: Model Input-Process-Output (IPO) pada Arsitektur Von Neumann',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Membedah alur Input, Process, dan Output pada kegiatan memotret produk UMKM dan mengolahnya menjadi poster katalog digital.',
    feelings:
      'Bersemangat karena dapat menghubungkan langsung pelajaran arsitektur komputer dengan praktik fotografi dan desain grafis di bengkel DKV.',
    findings:
      'Pencahayaan foto produk yang baik saat tahap Input mempercepat proses pengeditan warna di CPU/RAM pada tahap Process dan menghasilkan Output yang jernih.',
    future:
      'Memastikan kualitas foto mentah dan kelengkapan teks informasi sejak tahap Input sebelum membuka aplikasi desain.',
    date: '13 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-07',
    studentId: 'std-dkv3-09',
    studentName: 'MOH. ALREZKY GOBEL',
    className: 'X DKV 3',
    title: 'Buku 2: Peran Sistem Operasi dalam Mengelola Proses IPO',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari manajemen sumber daya oleh Sistem Operasi serta cara menghindari kemacetan proses (Deadlock dan Convoy Effect).',
    feelings:
      'Senang karena sekarang tahu solusi teknis saat komputer mulai melambat ketika merender desain poster beresolusi tinggi.',
    findings:
      'Mengatur urutan eksekusi pekerjaan dari yang paling ringan (Shortest Job First) menjaga responsivitas sistem dan mempercepat penyelesaian proyek tim.',
    future:
      'Membuat daftar prioritas kerja berdasarkan estimasi durasi tercepat saat mengerjakan proyek kolaborasi di Lab DKV.',
    date: '13 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-08',
    studentId: 'std-dkv3-10',
    studentName: 'MOH. EKA PUTRA S. MASSO',
    className: 'X DKV 3',
    title: 'Buku 3: Tahapan Proses Komputasi Data & Data-Driven Design',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari tahapan Pengumpulan Data, Data Cleaning, Pengolahan Data, dan Visualisasi Data dalam perancangan komunikasi visual.',
    feelings:
      'Puas melihat bagaimana tabel angka hasil survei kelas dapat diubah menjadi diagram visual yang rapi dan komunikatif.',
    findings:
      'Mendesain berdasarkan data riset audiens mengurangi revisi berulang karena warna dan gaya tipografi sudah sesuai dengan kebutuhan target pembaca.',
    future:
      'Menerapkan 4 tahapan komputasi data sebelum membuat desain poster edukasi maupun kemasan produk di sekolah.',
    date: '13 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-09',
    studentId: 'std-dkv3-11',
    studentName: 'MOHAMAD CHECEN ANUGRAH POTABUGA',
    className: 'X DKV 3',
    title: 'Buku 4: Struktur Data Dasar (Array, Stack, Queue) & Algoritma Standar',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari cara kerja struktur data Stack (LIFO) dan Queue (FIFO) serta tiga pola algoritma dasar pada alur kerja desain.',
    feelings:
      'Antusias saat mempraktikkan pola algoritma Sequential dan Branching untuk memeriksa kesiapan file cetak vs file publikasi layar.',
    findings:
      'Penyusunan langkah kerja secara Sequential (runtut) mencegah ada tahapan desain seperti pengecekan margin dan resolusi yang terlewat.',
    future:
      'Menggunakan grup layer terstruktur (Stack) dan alur pemeriksaan Branching CMYK/RGB pada setiap tugas praktik DKV.',
    date: '12 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-10',
    studentId: 'std-dkv3-13',
    studentName: 'MOHAMAD FERDIANSYAH PUTRA NASARU',
    className: 'X DKV 3',
    title: 'Buku 5: Efisiensi & Keakuratan Algoritma Pencarian & Pengurutan',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari prinsip pencarian bagi dua (Binary Search) dan pentingnya pengurutan data (Sorting) pada ribuan file aset studio.',
    feelings:
      'Senang karena menemukan cara praktis agar tidak lagi kebingungan mencari file font atau logo di komputer laboratorium.',
    findings:
      'Binary Search memotong setengah ruang pencarian di setiap langkah sehingga jauh lebih efisien dibandingkan memeriksa file satu demi satu (Linear Search).',
    future:
      'Menata folder kerja dengan awalan nomor urut dan kategori yang jelas agar selalu siap dicari dengan cepat.',
    date: '12 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-11',
    studentId: 'std-dkv3-14',
    studentName: 'MOHAMAD NAZRIL LAURIS',
    className: 'X DKV 3',
    title: 'Buku 1: Model Input-Process-Output (IPO) pada Arsitektur Von Neumann',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari hubungan antara perangkat Input, pemrosesan CPU & memori RAM, serta perangkat Output dalam menghasilkan karya grafis.',
    feelings:
      'Tertarik sekali karena analogi membuat es teh manis di Buku 1 membuat konsep Input-Process-Output langsung terbayang dengan jelas.',
    findings:
      'Jika salah satu komponen Input (seperti font utama atau palet warna brand) terlewat, maka hasil akhir Output poster tidak akan sesuai brief.',
    future:
      'Memeriksa kelengkapan seluruh aset Input menggunakan daftar periksa sebelum mulai mengolah tata letak di tahap Process.',
    date: '12 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-12',
    studentId: 'std-dkv3-15',
    studentName: 'MOHAMAD OXAL HUSAIN',
    className: 'X DKV 3',
    title: 'Buku 2: Peran Sistem Operasi dalam Mengelola Proses IPO',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari bagaimana Sistem Operasi mengatur penjadwalan proses menggunakan metode FIFO dan Shortest Job First (SJF).',
    feelings:
      'Bangga karena dapat menjelaskan ke teman sekelompok mengapa proses render video berat sebaiknya tidak ditaruh di urutan paling awal antrean.',
    findings:
      'Menjalankan tugas-tugas desain yang cepat selesai terlebih dahulu (SJF) menghindarkan tim dari kemacetan antrean (Convoy Effect).',
    future:
      'Menerapkan pembagian antrean kerja berbasis SJF saat menyiapkan aset publikasi pameran karya SMK.',
    date: '12 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-13',
    studentId: 'std-dkv3-18',
    studentName: 'NURAINI LEBANG',
    className: 'X DKV 3',
    title: 'Buku 3: Tahapan Proses Komputasi Data & Data-Driven Design',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari 4 tahapan komputasi data dan pentingnya menyaring data rusak (Data Cleaning) sebelum membuat keputusan desain visual.',
    feelings:
      'Senang karena belajar bahwa riset data membuat karya desain kita tidak hanya indah dilihat, tetapi juga tepat sasaran bagi pembaca.',
    findings:
      'Visualisasi data menggunakan grafik batang dengan warna kontras membantu audiens menangkap informasi utama dalam 3 detik pertama.',
    future:
      'Mengolah data hasil survei kelas menjadi infografis yang bersih dan proporsional pada tugas poster berikutnya.',
    date: '11 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-14',
    studentId: 'std-dkv3-20',
    studentName: 'RADITYA THAIB',
    className: 'X DKV 3',
    title: 'Buku 4: Struktur Data Dasar (Array, Stack, Queue) & Algoritma Standar',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari struktur data Array, Stack, dan Queue serta penerapan pola algoritma Sequential, Branching, dan Looping di studio DKV.',
    feelings:
      'Kagum karena menyadari bahwa seluruh fitur di Adobe Illustrator dan Figma dibangun di atas fondasi struktur data dan algoritma yang rapi.',
    findings:
      'Penggunaan struktur Stack pada manajemen Layer dan pola Looping pada pembuatan grid membantu desainer bekerja jauh lebih presisi.',
    future:
      'Mengelompokkan dan mengurutkan layer secara disiplin serta menerapkan pola Looping saat membuat tata letak katalog produk.',
    date: '11 Nov 2026',
    xpEarned: 2,
  },
  {
    id: 'j4f-bk-dkv3-15',
    studentId: 'std-dkv3-26',
    studentName: 'TRI RAFIANA HALID',
    className: 'X DKV 3',
    title: 'Buku 5: Efisiensi & Keakuratan Algoritma Pencarian & Pengurutan',
    subject: 'Informatika (Berpikir Komputasional)',
    facts:
      'Mempelajari perbandingan algoritma Linear Search dan Binary Search beserta syarat mutlak pengurutan data (Sorting) pada pengarsipan aset.',
    feelings:
      'Sangat terbantu karena sekarang memiliki sistem penataan folder yang membuat pencarian aset desain menjadi jauh lebih cepat.',
    findings:
      'Data aset yang sudah di-sorting memungkinkan pencarian Binary Search menemukan 1 file di antara ribuan file hanya dalam beberapa langkah.',
    future:
      'Menjaga kerapian penamaan file dan layer pada setiap tugas individu maupun kelompok di kelas X DKV 3.',
    date: '11 Nov 2026',
    xpEarned: 2,
  },
];

// ============================================================================
// 2. ARSIP REFLEKSI PADA PUSAT REFLEKSI (20 SISWA: 5 X DKV 2 + 15 X DKV 3)
// Lengkap dengan Skala Bintang, Mood Emoji, Jawaban Siswa & Umpan Balik AI Mentor
// ============================================================================
export const PUSAT_REFLEKSI_ARCHIVE_REFLECTIONS: Reflection[] = [
  // --- 5 SISWA ACAK DARI KELAS X DKV 2 ---
  {
    id: 'ref-pusat-dkv2-01',
    studentId: 'std-dkv2-15',
    studentName: 'REVAN PUTRA KARAMA',
    studentNumber: '15',
    className: 'X DKV 2 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-01',
    materiTitle: 'Buku 1: Model Input-Process-Output (IPO) pada Arsitektur Von Neumann',
    scale: 5,
    moodEmoji: '😊',
    answers: {
      understood:
        'Saya sudah memahami alur kerja Input-Process-Output (IPO) pada komputer serta peran RAM sebagai meja kerja sementara saat mengolah banyak layer desain poster.',
      difficult:
        'Mengatur ukuran resolusi foto mentah saat tahap Input agar komputer tidak melambat ketika diberikan banyak efek visual pada tahap Process.',
      actionPlan:
        'Memeriksa dimensi dan ukuran file foto terlebih dahulu sebelum diimpor ke kanvas kerja serta menggabungkan layer yang sudah selesai.',
      findings:
        'Menghubungkan konsep kapasitas RAM dengan kelancaran pengolahan layer di Adobe Illustrator dan Photoshop.',
      customAnswers: {
        'Dari kegiatan desain yang kamu lakukan, tahap mana (Input, Process, atau Output) yang paling sering gagal atau error? Mengapa?':
          'Tahap Process paling sering melambat jika file foto yang dimasukkan pada tahap Input berukuran terlalu besar dan belum dikompresi.',
      },
    },
    createdAt: '14 Nov 2026, 08.20',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv2-02',
    studentId: 'std-dkv2-16',
    studentName: 'MOH. AQZA SETIAWAN YUNUS',
    studentNumber: '16',
    className: 'X DKV 2 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-02',
    materiTitle: 'Buku 2: Peran Sistem Operasi dalam Mengelola Proses IPO',
    scale: 4,
    moodEmoji: '🚀',
    answers: {
      understood:
        'Saya memahami cara Sistem Operasi mengatur antrean kerja CPU dan printer menggunakan metode FIFO (First In First Out) dan SJF (Shortest Job First).',
      difficult:
        'Memperkirakan waktu render setiap file desain ketika harus mengatur urutan antrean cetak bersama teman sekelompok.',
      actionPlan:
        'Mengelompokkan file desain yang berukuran ringan (seperti ekspor logo dan ikon) untuk diproses lebih dulu sesuai prinsip Shortest Job First.',
      findings:
        'Memahami bagaimana algoritma SJF mencegah terjadinya kemacetan antrean (Convoy Effect) di studio DKV.',
      customAnswers: {
        'Apakah metode antrean FIFO selalu adil? Berikan contoh situasi di mana FIFO justru terasa tidak adil bagi pengguna!':
          'FIFO terasa kurang efisien ketika saya hanya ingin mencetak 1 lembar sketsa 10 detik tetapi harus menunggu antrean render video 30 menit di depan saya.',
      },
    },
    createdAt: '14 Nov 2026, 08.35',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv2-03',
    studentId: 'std-dkv2-20',
    studentName: 'JULIA RAHMA HARUN',
    studentNumber: '20',
    className: 'X DKV 2 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-03',
    materiTitle: 'Buku 3: Tahapan Proses Komputasi Data & Data-Driven Design',
    scale: 5,
    moodEmoji: '💡',
    answers: {
      understood:
        'Saya memahami 4 tahapan komputasi data (Pengumpulan, Data Cleaning, Pengolahan, dan Visualisasi) untuk merancang desain berbasis riset audiens.',
      difficult:
        'Menyederhanakan tabel hasil angket siswa agar saat diubah menjadi grafik di dalam poster tetap terlihat rapi dan estetis.',
      actionPlan:
        'Merangkum hasil survei ke dalam 3 kategori utama dan menggunakan diagram batang dengan kontras warna yang tegas.',
      findings:
        'Data Cleaning sangat penting agar kuesioner yang ganda atau kosong tidak menyesatkan keputusan pemilihan warna kemasan.',
      customAnswers: {
        'Apa yang terjadi jika desainer langsung mengambil kesimpulan tanpa melakukan Data Cleaning (membersihkan data rusak)?':
          'Keputusan desain akan meleset dari selera audiens karena terpengaruh data duplikat atau jawaban asal-asalan (Garbage In, Garbage Out).',
      },
    },
    createdAt: '14 Nov 2026, 08.50',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv2-04',
    studentId: 'std-dkv2-21',
    studentName: 'MESYA DJAFAR',
    studentNumber: '21',
    className: 'X DKV 2 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-04',
    materiTitle: 'Buku 4: Struktur Data Dasar (Array, Stack, Queue) & Algoritma Standar',
    scale: 4,
    moodEmoji: '😊',
    answers: {
      understood:
        'Saya memahami cara kerja struktur data Stack (LIFO) pada fitur Undo (Ctrl+Z) dan urutan Layer, serta pola Looping untuk menduplikasi ornamen desain.',
      difficult:
        'Menjaga kerapian tumpukan Layer ketika jumlah objek ilustrasi dan teks di dalam kanvas poster sudah lebih dari 25 layer.',
      actionPlan:
        'Mengelompokkan layer ke dalam folder (Group) berdasarkan urutan elemen dari atas ke bawah: Headline, Subjudul, Ilustrasi, dan Background.',
      findings:
        'Menggunakan pola algoritma Branching membantu memastikan pemilihan mode warna CMYK untuk cetak dan RGB untuk layar.',
      customAnswers: {
        'Mengapa fitur "Undo" pada software desain grafis menggunakan struktur data Stack, bukan Queue?':
          'Karena saat menekan Undo, kita selalu ingin membatalkan goresan atau langkah paling terakhir yang baru saja dibuat (Last In, First Out).',
      },
    },
    createdAt: '14 Nov 2026, 09.05',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv2-05',
    studentId: 'std-dkv2-23',
    studentName: 'SINDI ANGGRIANI HATIBIE',
    studentNumber: '23',
    className: 'X DKV 2 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-05',
    materiTitle: 'Buku 5: Efisiensi & Keakuratan Algoritma Pencarian & Pengurutan',
    scale: 5,
    moodEmoji: '😊',
    answers: {
      understood:
        'Saya memahami mengapa pengurutan data (Sorting) menjadi syarat wajib agar algoritma Binary Search dapat mencari file aset dengan sangat cepat.',
      difficult:
        'Mempertahankan konsistensi penamaan file foto dan font ketika sedang terburu-buru menyelesaikan tugas kelompok.',
      actionPlan:
        'Membuat format penamaan baku (Nomor_Kategori_NamaAset) bersama teman kelompok sebelum mulai mengunduh bahan desain.',
      findings:
        'Binary Search mampu menemukan 1 file di antara 1.024 file terurut hanya dalam maksimal 10 langkah pemeriksaan.',
      customAnswers: {
        'Mengapa algoritma Binary Search tidak bisa langsung diterapkan pada data aset desain yang belum diurutkan (sorting)?':
          'Karena Binary Search membelah data di titik tengah dan membandingkan urutan; jika datanya acak, komputer tidak tahu arah paruh mana yang harus dipilih.',
      },
    },
    createdAt: '14 Nov 2026, 09.18',
    status: 'reviewed',
  },

  // --- 15 SISWA ACAK DARI KELAS X DKV 3 ---
  {
    id: 'ref-pusat-dkv3-01',
    studentId: 'std-dkv3-03',
    studentName: 'AIRA MUSTAPA',
    studentNumber: '03',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-01',
    materiTitle: 'Buku 1: Model Input-Process-Output (IPO) pada Arsitektur Von Neumann',
    scale: 5,
    moodEmoji: '💡',
    answers: {
      understood:
        'Saya memahami cara kerja model Input-Process-Output (IPO) pada arsitektur Von Neumann serta perbedaan fungsi CPU, RAM, dan penyimpanan SSD saat mengolah grafis.',
      difficult:
        'Menjaga agar pemakaian memori RAM tetap stabil ketika membuka file proyek desain poster yang memiliki banyak foto beresolusi tinggi.',
      actionPlan:
        'Menyeleksi dan menyesuaikan ukuran aset foto pada tahap Input sebelum memasukkannya ke kanvas kerja pada tahap Process.',
      findings:
        'Kualitas hasil akhir (Output) karya desain sangat ditentukan oleh ketelitian menyiapkan bahan mentah (Input) dan kapasitas ruang kerja sementara (RAM).',
      customAnswers: {
        'Bagaimana model IPO membantu kalian bekerja lebih rapi saat membuat karya poster atau ilustrasi DKV?':
          'Model IPO membuat alur kerja saya jauh lebih terstruktur mulai dari mengumpulkan aset di folder Input, mengolah layout di Process, hingga mengekspor file final di Output.',
      },
    },
    createdAt: '14 Nov 2026, 09.30',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-02',
    studentId: 'std-dkv3-07',
    studentName: 'MAZYA GUSTI D. JANI',
    studentNumber: '07',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-03',
    materiTitle: 'Buku 3: Tahapan Proses Komputasi Data & Data-Driven Design',
    scale: 4,
    moodEmoji: '😊',
    answers: {
      understood:
        'Saya memahami pentingnya riset data audiens (Data-Driven Design) dan tahapan pembersihan data sebelum merancang kemasan maupun poster.',
      difficult:
        'Mengelompokkan hasil kuesioner terbuka yang jawabannya beragam ke dalam tabel frekuensi yang ringkas.',
      actionPlan:
        'Menggunakan pilihan kategori yang terukur pada angket survei dan menyajikannya dalam bentuk diagram batang minimalis.',
      findings:
        'Visualisasi data membantu desainer menjelaskan alasan pemilihan konsep warna secara objektif kepada guru dan klien.',
      customAnswers: {
        'Mengapa visualisasi grafik jauh lebih efektif dipahami klien dibanding deretan angka mentah?':
          'Karena mata manusia jauh lebih cepat menangkap perbandingan tinggi batang dan proporsi warna daripada menghitung deretan angka di tabel.',
      },
    },
    createdAt: '14 Nov 2026, 09.42',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-03',
    studentId: 'std-dkv3-12',
    studentName: 'MOHAMAD FAZRIL HALA',
    studentNumber: '12',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-05',
    materiTitle: 'Buku 5: Efisiensi & Keakuratan Algoritma Pencarian & Pengurutan',
    scale: 4,
    moodEmoji: '🚀',
    answers: {
      understood:
        'Saya memahami perbedaan kecepatan Linear Search dan Binary Search serta manfaat mengurutkan (Sorting) folder aset desain di komputer.',
      difficult:
        'Menata ulang ratusan file latihan lama di folder unduhan yang sebelumnya belum memiliki format penamaan teratur.',
      actionPlan:
        'Membuat 4 folder induk berangka (01_Font, 02_Foto, 03_Vektor, 04_Export) dan merapikan nama file setiap selesai praktik.',
      findings:
        'Folder yang diurutkan dengan awalan angka membuat pencarian aset saat kerja kelompok menjadi berkali-kali lipat lebih cepat.',
      customAnswers: {
        'Bagaimana kebiasaan menata folder dan layer secara berurutan meningkatkan efisiensi kerjamu sebagai calon desainer grafis?':
          'Saya dan rekan satu tim tidak lagi membuang waktu belasan menit hanya untuk mencari satu file logo atau layer yang terselip.',
      },
    },
    createdAt: '14 Nov 2026, 09.55',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-04',
    studentId: 'std-dkv3-16',
    studentName: 'MOHAMMAD FAJRI ABDULLAH',
    studentNumber: '16',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-01',
    materiTitle: 'Buku 1: Model Input-Process-Output (IPO) pada Arsitektur Von Neumann',
    scale: 5,
    moodEmoji: '😊',
    answers: {
      understood:
        'Saya memahami alur Input-Process-Output pada arsitektur Von Neumann serta pembagian tugas antara CPU, RAM, dan penyimpanan SSD.',
      difficult:
        'Menyesuaikan kemiripan warna antara tampilan Output di layar monitor (RGB) dengan hasil Output saat dicetak di mesin printer (CMYK).',
      actionPlan:
        'Mengaktifkan mode Proof Colors (CMYK Preview) sejak tahap Process saat mendesain poster yang akan dicetak.',
      findings:
        'Memastikan kelengkapan dan kualitas aset pada tahap Input adalah kunci utama agar tahap Process dan Output berjalan lancar.',
      customAnswers: {
        'Bagaimana model IPO membantu kalian bekerja lebih rapi saat membuat karya poster atau ilustrasi DKV?':
          'Model IPO membuat saya disiplin menyiapkan seluruh bahan Input terlebih dahulu sebelum mulai mengolah layout di tahap Process.',
      },
    },
    createdAt: '14 Nov 2026, 10.08',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-05',
    studentId: 'std-dkv3-17',
    studentName: 'NUR AIN MOLI',
    studentNumber: '17',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-02',
    materiTitle: 'Buku 2: Peran Sistem Operasi dalam Mengelola Proses IPO',
    scale: 5,
    moodEmoji: '💡',
    answers: {
      understood:
        'Saya memahami peran Sistem Operasi dalam mengatur antrean eksekusi CPU dengan algoritma FIFO dan Shortest Job First (SJF) serta mencegah terjadinya Deadlock.',
      difficult:
        'Menentukan prioritas tugas mana yang harus dikerjakan komputer lebih dulu ketika harus mengekspor aset vektor sekaligus merender pratinjau poster.',
      actionPlan:
        'Menyelesaikan ekspor aset-aset ringan seperti ikon dan logo terlebih dahulu (prinsip SJF) sebelum menjalankan proses rendering file utama yang berukuran besar.',
      findings:
        'Penerapan logika penjadwalan Shortest Job First (SJF) membuat antrean kerja kelompok di laboratorium DKV selesai jauh lebih cepat tanpa macet.',
      customAnswers: {
        'Jika kamu menjadi "OS" untuk kelompok kerja desain DKV, aturan giliran seperti apa yang kamu terapkan agar proyek selesai tepat waktu?':
          'Saya menerapkan strategi SJF dengan mendahulukan tugas desain yang durasinya singkat seperti penyusunan teks dan ikon agar langsung siap digabungkan ke layout utama.',
      },
    },
    createdAt: '14 Nov 2026, 10.20',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-06',
    studentId: 'std-dkv3-19',
    studentName: 'PUTRI CILINAYA DAUD',
    studentNumber: '19',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-04',
    materiTitle: 'Buku 4: Struktur Data Dasar (Array, Stack, Queue) & Algoritma Standar',
    scale: 4,
    moodEmoji: '😊',
    answers: {
      understood:
        'Saya memahami konsep struktur data Array, Stack (LIFO), dan Queue (FIFO) serta penerapannya pada tumpukan Layer dan antrean ekspor desain.',
      difficult:
        'Menemukan objek kecil yang tidak sengaja tertutup oleh layer latar belakang saat jumlah layer di kanvas sudah sangat banyak.',
      actionPlan:
        'Mengunci (Lock) layer background dan memberi nama serta warna label pada setiap folder Group Layer.',
      findings:
        'Urutan tumpukan Layer bekerja persis seperti Stack: layer yang berada di urutan paling atas akan tampil paling depan di layar.',
      customAnswers: {
        'Bagaimana penerapan pola Sequential, Branching, dan Looping mempermudah alur kerja pembuatan mockup kemasan?':
          'Sequential menjaga langkah kerja tetap urut, Branching membantu memilih profil warna cetak/digital, dan Looping mempercepat duplikasi pola motif.',
      },
    },
    createdAt: '14 Nov 2026, 10.32',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-07',
    studentId: 'std-dkv3-21',
    studentName: 'RAHMAT ABUBAKAR',
    studentNumber: '21',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-05',
    materiTitle: 'Buku 5: Efisiensi & Keakuratan Algoritma Pencarian & Pengurutan',
    scale: 2,
    moodEmoji: '🤔',
    answers: {
      understood:
        'Saya sudah mengerti bahwa Linear Search mencari file satu per satu dari urutan awal sampai akhir.',
      difficult:
        'Saya masih bingung menentukan langkah pembelahan titik tengah pada Binary Search dan masih kesulitan mengatur kontras warna judul poster.',
      actionPlan:
        'Meminta bimbingan Pak Guru Abdul Rahman Bahsoan dan berlatih simulasi Binary Search bersama teman tutor sebaya di kelas X DKV 3.',
      findings:
        'Saya perlu mengurutkan data terlebih dahulu sebelum mencoba membelah titik tengah pada pencarian Binary Search.',
      customAnswers: {
        'Mengapa algoritma Binary Search tidak bisa langsung diterapkan pada data aset desain yang belum diurutkan (sorting)?':
          'Karena saya masih sering tertukar antara langkah mengurutkan data dengan langkah membagi dua daftar file.',
      },
    },
    createdAt: '14 Nov 2026, 10.45',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-08',
    studentId: 'std-dkv3-22',
    studentName: 'RAUF A. MUSA',
    studentNumber: '22',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-02',
    materiTitle: 'Buku 2: Peran Sistem Operasi dalam Mengelola Proses IPO',
    scale: 4,
    moodEmoji: '🚀',
    answers: {
      understood:
        'Saya memahami peran Sistem Operasi sebagai pengatur sumber daya CPU dan RAM serta perbedaan algoritma penjadwalan FIFO dan SJF.',
      difficult:
        'Mengatur pembagian beban kerja komputer saat melakukan pengeditan ilustrasi vektor sambil membuka banyak tab referensi.',
      actionPlan:
        'Menyimpan gambar referensi ke folder lokal terlebih dahulu dan menutup tab browser yang berat sebelum mulai merender desain.',
      findings:
        'Menutup aplikasi latar belakang yang tidak terpakai sangat efektif mencegah terjadinya Deadlock dan lag pada komputer lab.',
      customAnswers: {
        'Aplikasi desain apa di perangkatmu yang paling banyak "berebut" memori dan baterai? Bagaimana caramu menyiasatinya?':
          'Photoshop dan browser dengan banyak tab; cara saya menyiasatinya adalah mengunduh aset referensi dulu lalu menutup browser saat mendesain.',
      },
    },
    createdAt: '14 Nov 2026, 10.58',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-09',
    studentId: 'std-dkv3-23',
    studentName: 'RYU ZUI',
    studentNumber: '23',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-03',
    materiTitle: 'Buku 3: Tahapan Proses Komputasi Data & Data-Driven Design',
    scale: 5,
    moodEmoji: '😊',
    answers: {
      understood:
        'Saya memahami 4 tahapan komputasi data (Pengumpulan, Data Cleaning, Pengolahan, dan Visualisasi) untuk mendukung perancangan desain berbasis bukti (Data-Driven Design).',
      difficult:
        'Membersihkan data hasil survei preferensi audiens yang masih memiliki jawaban ganda atau tidak lengkap pada tahap Data Cleaning.',
      actionPlan:
        'Mengecek dan menyaring tabel hasil kuesioner secara teliti sebelum mengolahnya menjadi grafik persentase untuk acuan pemilihan tema poster.',
      findings:
        'Prinsip Garbage In, Garbage Out membuktikan bahwa data survei yang bersih dan valid menghasilkan keputusan konsep visual yang jauh lebih tepat sasaran.',
      customAnswers: {
        'Mengapa visualisasi grafik jauh lebih efektif dipahami klien dibanding deretan angka mentah?':
          'Karena grafik menyajikan perbandingan pola dan tren data secara visual dalam hitungan detik sehingga audiens langsung menangkap pesan utamanya.',
      },
    },
    createdAt: '14 Nov 2026, 11.10',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-10',
    studentId: 'std-dkv3-24',
    studentName: 'SIFA',
    studentNumber: '24',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-04',
    materiTitle: 'Buku 4: Struktur Data Dasar (Array, Stack, Queue) & Algoritma Standar',
    scale: 5,
    moodEmoji: '😊',
    answers: {
      understood:
        'Saya memahami struktur data Array, Stack (LIFO), dan Queue (FIFO) serta penerapan pola algoritma Sequential, Branching, dan Looping pada produksi desain grafis.',
      difficult:
        'Menjaga kerapian urutan tumpukan Layer (Stack) ketika kanvas poster memiliki puluhan objek ilustrasi, tipografi, dan efek pencahayaan.',
      actionPlan:
        'Mengelompokkan layer ke dalam folder bernomor urut (01_Headline, 02_Ilustrasi, 03_Background) dan memanfaatkan algoritma Looping untuk membuat pola ornamen.',
      findings:
        'Fitur Undo (Ctrl+Z) dan susunan Layer di aplikasi desain bekerja menggunakan logika Stack (Last-In First-Out) sehingga aksi terakhir selalu diproses paling atas.',
      customAnswers: {
        'Mengapa fitur "Undo" pada software desain grafis menggunakan struktur data Stack, bukan Queue?':
          'Karena desainer selalu ingin membatalkan goresan atau perubahan paling baru yang berada di urutan teratas tumpukan riwayat (Last-In First-Out).',
      },
    },
    createdAt: '14 Nov 2026, 11.22',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-11',
    studentId: 'std-dkv3-25',
    studentName: 'SRI ATIKA MATADULA',
    studentNumber: '25',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-03',
    materiTitle: 'Buku 3: Tahapan Proses Komputasi Data & Data-Driven Design',
    scale: 4,
    moodEmoji: '💡',
    answers: {
      understood:
        'Saya memahami tahapan Pengumpulan Data, Pembersihan Data (Data Cleaning), Pengolahan, hingga Visualisasi Data untuk riset desain.',
      difficult:
        'Menentukan jenis grafik yang paling pas ketika ingin menampilkan perbandingan persentase sekaligus jumlah pemilih.',
      actionPlan:
        'Menggunakan diagram batang horizontal yang dilengkapi label angka dan persentase langsung di ujung setiap batang.',
      findings:
        'Riset data audiens membuat proses penentuan palet warna kemasan produk UMKM menjadi jauh lebih cepat dan terarah.',
      customAnswers: {
        'Ceritakan satu keputusan desain yang pernah kamu buat hanya berdasarkan tebakan/perasaan, apa yang berbeda jika kamu punya data riset terlebih dahulu?':
          'Dulu saya memilih warna gelap hanya karena suka, padahal dengan data riset saya tahu bahwa audiens lebih menyukai warna cerah yang menggugah selera.',
      },
    },
    createdAt: '14 Nov 2026, 11.35',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-12',
    studentId: 'std-dkv3-27',
    studentName: 'WILDA L MANDAILI',
    studentNumber: '27',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-01',
    materiTitle: 'Buku 1: Model Input-Process-Output (IPO) pada Arsitektur Von Neumann',
    scale: 5,
    moodEmoji: '😊',
    answers: {
      understood:
        'Saya memahami konsep dasar Input, Process (CPU & RAM), dan Output serta bagaimana ketiganya bekerja pada alur produksi karya DKV.',
      difficult:
        'Memilih pengaturan kompresi saat tahap Output agar file poster tetap tajam ketika dikirim melalui media sosial.',
      actionPlan:
        'Mengekspor karya poster digital menggunakan format PNG-24 dengan lebar minimal 1080 piksel dan profil warna sRGB.',
      findings:
        'Memisahkan folder kerja menjadi folder Input, Process, dan Output membuat manajemen proyek desain di laboratorium sangat tertib.',
      customAnswers: {
        'Menurutmu, apa yang terjadi pada sebuah kios jika meja kerjanya (RAM) terlalu kecil untuk menampung banyak pesanan sekaligus?':
          'Pekerjaan akan menumpuk, berantakan, dan pelayanannya melambat drastis—sama seperti komputer yang RAM-nya penuh saat membuka banyak layer.',
      },
    },
    createdAt: '14 Nov 2026, 11.48',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-13',
    studentId: 'std-dkv3-01',
    studentName: 'ABDUL KADIR YUSUF',
    studentNumber: '01',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-04',
    materiTitle: 'Buku 4: Struktur Data Dasar (Array, Stack, Queue) & Algoritma Standar',
    scale: 5,
    moodEmoji: '🚀',
    answers: {
      understood:
        'Saya memahami struktur data Array pada palet warna, Stack (LIFO) pada Undo dan Layer, serta Queue (FIFO) pada antrean rendering.',
      difficult:
        'Mengatur perulangan (Looping) jarak antar-elemen motif ketika ukuran kanvas poster diubah dari ukuran A3 ke format spanduk.',
      actionPlan:
        'Menggunakan fitur Transform Again dan Smart Guides di Adobe Illustrator agar jarak perulangan motif selalu presisi.',
      findings:
        'Pola algoritma Sequential, Branching, dan Looping membuat langkah pembuatan desain kemasan dan poster menjadi jauh lebih efisien.',
      customAnswers: {
        'Mengapa fitur "Undo" pada software desain grafis menggunakan struktur data Stack, bukan Queue?':
          'Karena Stack bersifat Last In First Out, sehingga kesalahan goresan terakhir yang baru kita buat bisa langsung dibatalkan lebih dulu.',
      },
    },
    createdAt: '14 Nov 2026, 12.02',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-14',
    studentId: 'std-dkv3-05',
    studentName: 'KATLA ALFIANI ABDULLAH',
    studentNumber: '05',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-05',
    materiTitle: 'Buku 5: Efisiensi & Keakuratan Algoritma Pencarian & Pengurutan',
    scale: 5,
    moodEmoji: '💡',
    answers: {
      understood:
        'Saya memahami cara kerja pembelahan titik tengah pada Binary Search dan alasan mengapa data wajib diurutkan (Sorting) terlebih dahulu.',
      difficult:
        'Menyeragamkan format penamaan file aset ketika menggabungkan bahan desain dari beberapa anggota kelompok.',
      actionPlan:
        'Menyepakati standar penamaan file bersama seluruh anggota kelompok di awal proyek sebelum mengumpulkan aset ke satu folder.',
      findings:
        'Pada 1.024 file aset yang sudah terurut rapi, Binary Search hanya membutuhkan maksimal 10 langkah untuk menemukan file target.',
      customAnswers: {
        'Bagaimana kebiasaan menata folder dan layer secara berurutan meningkatkan efisiensi kerjamu sebagai calon desainer grafis?':
          'Seluruh aset font, ilustrasi, dan foto langsung mudah ditemukan dalam hitungan detik sehingga waktu kerja bisa fokus pada kualitas kreatif.',
      },
    },
    createdAt: '14 Nov 2026, 12.15',
    status: 'reviewed',
  },
  {
    id: 'ref-pusat-dkv3-15',
    studentId: 'std-dkv3-09',
    studentName: 'MOH. ALREZKY GOBEL',
    studentNumber: '09',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    materiId: 'materi-bk-02',
    materiTitle: 'Buku 2: Peran Sistem Operasi dalam Mengelola Proses IPO',
    scale: 4,
    moodEmoji: '😊',
    answers: {
      understood:
        'Saya memahami bagaimana Sistem Operasi mengelola antrean proses dengan algoritma FIFO dan SJF serta mencegah terjadinya Deadlock.',
      difficult:
        'Membagi giliran pemakaian satu unit printer warna di laboratorium ketika beberapa kelompok selesai mendesain pada waktu bersamaan.',
      actionPlan:
        'Menerapkan antrean Shortest Job First (SJF) dengan mendahulukan cetak uji warna 1 lembar sebelum mencetak poster ukuran besar.',
      findings:
        'Manajemen antrean yang tepat seperti pada Sistem Operasi membuat alur kerja di bengkel Tefa DKV menjadi tertib dan bebas macet.',
      customAnswers: {
        'Jika kamu menjadi "OS" untuk kelompok kerja desain DKV, aturan giliran seperti apa yang kamu terapkan agar proyek selesai tepat waktu?':
          'Saya mendahulukan tugas-tugas ringan yang cepat selesai (SJF) seperti penyusunan teks dan ikon sambil menyiapkan layout utama secara paralel.',
      },
    },
    createdAt: '14 Nov 2026, 12.28',
    status: 'reviewed',
  },
];

export const PUSAT_REFLEKSI_ARCHIVE_FEEDBACKS: MentorFeedback[] = [
  // --- 5 FEEDBACK AI MENTOR UNTUK SISWA X DKV 2 ---
  {
    id: 'fb-pusat-dkv2-01',
    reflectionId: 'ref-pusat-dkv2-01',
    studentId: 'std-dkv2-15',
    apresiasi:
      'Luar biasa Revan! Kamu berhasil menghubungkan konsep arsitektur Von Neumann (IPO & RAM) langsung dengan manajemen ukuran aset foto dan layer di studio DKV.',
    sudah_dikuasai: [
      'Pemahaman alur Input-Process-Output (IPO) pada produksi desain grafis',
      'Peran RAM sebagai memori kerja sementara untuk menampung layer aktif',
    ],
    perlu_diperkuat: [
      'Teknik optimasi ukuran dan kompresi foto mentah (Input) sebelum diolah di kanvas',
    ],
    saran: [
      'Sesuaikan dimensi foto mentah ke ukuran bidang cetak sebelum dimasukkan ke layer utama',
      'Gunakan fitur Merge/Flatten pada grup layer background yang sudah final agar RAM lebih lega',
    ],
    pertanyaan_pemantik:
      'Bagaimana caramu mengatur alur Input dan Process jika klien meminta revisi cepat pada poster yang memiliki lebih dari 30 layer?',
    rencana_belajar: [
      'Mengecek resolusi foto mentah sebelum import ke kanvas',
      'Merapikan dan menggabungkan layer background yang sudah selesai',
      'Melakukan uji kecepatan ekspor PDF/PNG di Lab DKV',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, false],
  },
  {
    id: 'fb-pusat-dkv2-02',
    reflectionId: 'ref-pusat-dkv2-02',
    studentId: 'std-dkv2-16',
    apresiasi:
      'Hebat sekali Aqza! Analisismu mengenai antrean cetak sketsa vs render video menunjukkan pemahaman yang sangat matang terhadap algoritma FIFO dan Shortest Job First (SJF).',
    sudah_dikuasai: [
      'Perbandingan algoritma penjadwalan FIFO dan Shortest Job First (SJF)',
      'Identifikasi penyebab kemacetan antrean (Convoy Effect) di studio cetak',
    ],
    perlu_diperkuat: [
      'Estimasi durasi rendering berdasarkan kompleksitas efek vektor dan resolusi bitmap',
    ],
    saran: [
      'Pisahkan antrean ekspor aset ringan (ikon/tipografi) dari antrean rendering file berukuran besar',
      'Buat papan estimasi waktu render singkat bersama kelompok sebelum mencetak di Tefa DKV',
    ],
    pertanyaan_pemantik:
      'Jika ada pekerjaan desain berdurasi panjang namun sangat mendesak, bagaimana cara menggabungkan prinsip prioritas dengan algoritma SJF?',
    rencana_belajar: [
      'Menyusun daftar antrean ekspor aset dari yang paling cepat selesai',
      'Mencatat perbandingan waktu ekspor PNG vs PDF cetak',
      'Membagikan strategi antrean SJF kepada rekan satu kelompok',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, false, false],
  },
  {
    id: 'fb-pusat-dkv2-03',
    reflectionId: 'ref-pusat-dkv2-03',
    studentId: 'std-dkv2-20',
    apresiasi:
      'Kerja bagus Julia! Pemahamanmu tentang Data Cleaning dan pencegahan prinsip Garbage In, Garbage Out akan membuat setiap keputusan desainmu punya landasan riset yang kuat.',
    sudah_dikuasai: [
      '4 tahapan komputasi data untuk perancangan berbasis bukti (Data-Driven Design)',
      'Pentingnya menyaring data kuesioner ganda/kosong pada tahap Data Cleaning',
    ],
    perlu_diperkuat: [
      'Penyederhanaan tabel data menjadi elemen infografis minimalis di dalam poster',
    ],
    saran: [
      'Kelompokkan hasil angket ke dalam maksimal 3-4 batang grafik dengan warna aksen pada nilai tertinggi',
      'Cantumkan angka persentase langsung di ujung batang grafik agar terbaca dalam 3 detik',
    ],
    pertanyaan_pemantik:
      'Grafik jenis apa yang paling efektif kamu gunakan jika ingin memperlihatkan perbandingan porsi 3 pilihan palet warna kemasan kepada klien UMKM?',
    rencana_belajar: [
      'Membersihkan data responden survei warna poster kelas X DKV 2',
      'Merancang 1 diagram batang minimalis dengan warna kontras',
      'Menguji keterbacaan infografis dengan rumus Tes 3 Detik',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, true],
  },
  {
    id: 'fb-pusat-dkv2-04',
    reflectionId: 'ref-pusat-dkv2-04',
    studentId: 'std-dkv2-21',
    apresiasi:
      'Tepat sekali Mesya! Penjelasanmu bahwa Undo menggunakan struktur data Stack (LIFO) karena membatalkan langkah terakhir lebih dulu sangat akurat dan mudah dipahami.',
    sudah_dikuasai: [
      'Logika struktur data Stack (LIFO) pada histori Undo dan tumpukan Layer',
      'Penerapan algoritma Looping dan Branching pada alur kerja desain',
    ],
    perlu_diperkuat: [
      'Manajemen pengelompokan folder layer (Layer Grouping) pada kanvas yang kompleks',
    ],
    saran: [
      'Gunakan maksimal 4 folder Group Layer utama: 01_Headline, 02_Subjudul_Isi, 03_Ilustrasi, dan 04_Background',
      'Kunci (Lock) grup layer yang sudah selesai diedit agar tidak bergeser secara tidak sengaja',
    ],
    pertanyaan_pemantik:
      'Bagaimana struktur data Array membantu desainer saat menyimpan dan memanggil kembali deretan palet warna (Color Swatches) secara konsisten?',
    rencana_belajar: [
      'Merapikan 25+ layer proyek poster ke dalam 4 folder Group utama',
      'Mengunci layer background dan garis bantu Grid',
      'Mengecek mode warna CMYK/RGB dengan logika percabangan Branching',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, false],
  },
  {
    id: 'fb-pusat-dkv2-05',
    reflectionId: 'ref-pusat-dkv2-05',
    studentId: 'std-dkv2-23',
    apresiasi:
      'Luar biasa Sindi! Kamu memahami inti dari efisiensi algoritma bahwa kecepatan Binary Search (10 langkah untuk 1.024 file) berawal dari kedisiplinan melakukan Sorting.',
    sudah_dikuasai: [
      'Prinsip pencarian bagi dua pada algoritma Binary Search',
      'Hubungan mutlak antara pengurutan data (Sorting) dan kecepatan temu kembali aset',
    ],
    perlu_diperkuat: [
      'Konsistensi penamaan file aset secara cepat saat bekerja dalam tenggat waktu singkat',
    ],
    saran: [
      'Gunakan fitur Batch Rename di komputer untuk memberi awalan nomor dan kategori pada banyak file sekaligus',
      'Buat template folder proyek kosong yang sudah bernomor urut sehingga siap disalin kapan saja',
    ],
    pertanyaan_pemantik:
      'Berapa maksimal langkah pencarian yang dibutuhkan Binary Search jika koleksi font dan vektor di studio DKV-mu bertambah menjadi 2.048 file terurut?',
    rencana_belajar: [
      'Membuat template folder proyek bernomor urut (01 s.d. 04)',
      'Merapikan penamaan file aset pada tugas poster minggu ini',
      'Mempraktikkan fitur Batch Rename bersama teman sekelompok',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, false, false],
  },

  // --- 15 FEEDBACK AI MENTOR UNTUK SISWA X DKV 3 ---
  {
    id: 'fb-pusat-dkv3-01',
    reflectionId: 'ref-pusat-dkv3-01',
    studentId: 'std-dkv3-03',
    apresiasi:
      'Sangat menginspirasi Aira! Kebiasaanmu menyeleksi dan mengoptimasi ukuran aset foto sejak tahap Input membuktikan penguasaan model IPO pada arsitektur Von Neumann yang matang.',
    sudah_dikuasai: [
      'Pemahaman alur Input-Process-Output (IPO) pada arsitektur komputer Von Neumann',
      'Pembagian peran antara CPU, memori RAM, dan penyimpanan SSD saat mengolah desain',
    ],
    perlu_diperkuat: [
      'Manajemen efisiensi memori RAM saat bekerja dengan banyak layer beresolusi tinggi',
    ],
    saran: [
      'Gunakan fitur Smart Object / Linked File untuk foto berukuran besar agar ukuran file kerja utama tetap ringan di RAM',
      'Pisahkan folder kerja proyek menjadi 01_Input, 02_Process, dan 03_Output di komputer laboratorium',
    ],
    pertanyaan_pemantik:
      'Mengapa menyimpan file kerja pada SSD membuat waktu pembukaan proyek desain jauh lebih cepat dibandingkan harddisk magnetik (HDD)?',
    rencana_belajar: [
      'Menyeleksi resolusi foto mentah pada tahap Input sebelum masuk ke kanvas',
      'Merapikan pengelompokan layer pada tahap Process agar RAM tetap stabil',
      'Mengekspor karya akhir sesuai standar format Output cetak dan digital',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, true],
  },
  {
    id: 'fb-pusat-dkv3-02',
    reflectionId: 'ref-pusat-dkv3-02',
    studentId: 'std-dkv3-07',
    apresiasi:
      'Bagus sekali Mazya! Kemampuanmu menerjemahkan data hasil survei menjadi visualisasi grafik yang bersih membuat karya desainmu punya alasan yang kuat.',
    sudah_dikuasai: [
      'Konsep Data-Driven Design dan tahapan pembersihan data (Data Cleaning)',
      'Pemanfaatan visualisasi grafik untuk mempercepat pemahaman audiens',
    ],
    perlu_diperkuat: [
      'Pengelompokan jawaban kuesioner terbuka menjadi kategori frekuensi yang ringkas',
    ],
    saran: [
      'Gunakan maksimal 4 kategori pilihan pada kuesioner agar hasil olahan datanya fokus dan tajam',
      'Tambahkan ikon vektor sederhana di samping setiap label batang grafik agar selaras dengan gaya poster DKV',
    ],
    pertanyaan_pemantik:
      'Mengapa menampilkan terlalu banyak irisan kecil pada diagram lingkaran (Pie Chart) justru menyulitkan pembaca menangkap pesan utama?',
    rencana_belajar: [
      'Merangkum tabel hasil survei kelas menjadi 3 kategori utama',
      'Membuat grafik batang dengan penekanan warna pada data tertinggi',
      'Mempresentasikan konsep poster berbasis data di depan kelas',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, false],
  },
  {
    id: 'fb-pusat-dkv3-03',
    reflectionId: 'ref-pusat-dkv3-03',
    studentId: 'std-dkv3-12',
    apresiasi:
      'Langkah nyata yang sangat hebat Fazril! Membagi struktur direktori menjadi 4 folder induk berangka adalah penerapan langsung algoritma Sorting di dunia kerja kreatif.',
    sudah_dikuasai: [
      'Perbandingan efisiensi Linear Search dan Binary Search pada manajemen file',
      'Penerapan pengurutan (Sorting) menggunakan sistem penomoran folder induk',
    ],
    perlu_diperkuat: [
      'Penataan arsip file latihan lama agar terkelompok sesuai jenis asetnya',
    ],
    saran: [
      'Urutkan file berdasarkan tipe ekstensi (.ttf/.otf ke 01_Font, .jpg/.png ke 02_Foto, .ai/.svg ke 03_Vektor) agar proses pemindahan cepat selesai',
      'Terapkan penamaan serupa pada urutan layer di dalam file kerja desainmu',
    ],
    pertanyaan_pemantik:
      'Bagaimana struktur folder dan layer yang sudah terurut membantu rekan satu tim yang harus melanjutkan proyek desainmu?',
    rencana_belajar: [
      'Menata folder aset dengan awalan nomor 01 sampai 04',
      'Memberi nama yang jelas pada seluruh layer poster',
      'Menguji kecepatan pencarian aset bersama teman semeja',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, false, false],
  },
  {
    id: 'fb-pusat-dkv3-04',
    reflectionId: 'ref-pusat-dkv3-04',
    studentId: 'std-dkv3-16',
    apresiasi:
      'Mantap sekali Mohammad Fajri! Kesadaranmu mengaktifkan fitur Proof Colors (CMYK Preview) sejak tahap Process adalah kebiasaan standar desainer percetakan profesional.',
    sudah_dikuasai: [
      'Pemetaan alur Input-Process-Output (IPO) beserta peran CPU, RAM, dan SSD',
      'Identifikasi perbedaan ruang warna layar (RGB) dan ruang warna cetak (CMYK)',
    ],
    perlu_diperkuat: [
      'Kalibrasi kecerahan dan kontras warna saat konversi dari profil RGB ke CMYK',
    ],
    saran: [
      'Hindari penggunaan warna neon RGB ekstrem jika tujuan akhir desain adalah dicetak di atas kertas (Output CMYK)',
      'Ekspor file siap cetak menggunakan preset PDF High Quality Print dengan tambahan tanda potong (crop marks)',
    ],
    pertanyaan_pemantik:
      'Apa langkah yang harus kamu lakukan pada tahap Process jika aset logo dari klien pada tahap Input masih berupa gambar bitmap beresolusi rendah?',
    rencana_belajar: [
      'Mengaktifkan Proof Colors CMYK saat merancang poster cetak',
      'Melakukan vektorisasi (tracing) pada logo yang beresolusi rendah',
      'Menyusun daftar periksa pra-cetak (Pre-flight) di Lab DKV',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, false],
  },
  {
    id: 'fb-pusat-dkv3-05',
    reflectionId: 'ref-pusat-dkv3-05',
    studentId: 'std-dkv3-17',
    apresiasi:
      'Keren sekali Nur Ain! Strategimu mendahulukan ekspor aset ringan seperti ikon dan logo sebelum rendering utama adalah penerapan cerdas algoritma Shortest Job First (SJF).',
    sudah_dikuasai: [
      'Peran Sistem Operasi dalam mengatur penjadwalan proses CPU (FIFO dan SJF)',
      'Pencegahan kondisi Deadlock dan kemacetan antrean kerja di laboratorium DKV',
    ],
    perlu_diperkuat: [
      'Penentuan skala prioritas antrean ketika beberapa anggota tim mengekspor desain bersamaan',
    ],
    saran: [
      'Susun daftar cek aset ringan yang bisa diekspor dalam hitungan detik sebelum menjalankan rendering poster ukuran penuh',
      'Tutup aplikasi yang tidak digunakan agar alokasi memori Sistem Operasi fokus pada proses rendering utama',
    ],
    pertanyaan_pemantik:
      'Bagaimana cara mencegah Convoy Effect apabila satu komputer studio harus melayani antrean cetak poster dan ekspor ikon secara bergantian?',
    rencana_belajar: [
      'Menerapkan prinsip SJF dengan mengekspor aset vektor ringan terlebih dahulu',
      'Memantau penggunaan CPU dan RAM melalui Task Manager saat praktik',
      'Mendiskusikan pembagian jadwal render bersama kelompok X DKV 3',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, true],
  },
  {
    id: 'fb-pusat-dkv3-06',
    reflectionId: 'ref-pusat-dkv3-06',
    studentId: 'std-dkv3-19',
    apresiasi:
      'Penjelasan yang sangat jernih Putri Cilinaya! Mengunci layer background dan memberi label warna pada folder Group Layer adalah solusi cerdas mengelola struktur Stack.',
    sudah_dikuasai: [
      'Konsep struktur data Array, Stack (LIFO), dan Queue (FIFO) pada aplikasi grafis',
      'Penerapan pola algoritma Sequential, Branching, dan Looping dalam produksi desain',
    ],
    perlu_diperkuat: [
      'Pengorganisasian tumpukan layer (Layer Stack) pada proyek ilustrasi yang memiliki puluhan objek',
    ],
    saran: [
      'Gunakan shortcut Ctrl+] dan Ctrl+[ untuk menaikkan atau menurunkan posisi tumpukan objek di dalam Stack dengan cepat',
      'Beri warna label Merah untuk grup layer Teks Utama dan Hijau untuk grup layer Latar Belakang',
    ],
    pertanyaan_pemantik:
      'Apa yang terjadi pada keterbacaan poster jika grup layer Teks Judul berada di urutan bawah grup layer Ilustrasi pada tumpukan Stack?',
    rencana_belajar: [
      'Mengelompokkan layer desain ke dalam folder Group berwarna',
      'Mengunci layer latar belakang sebelum menata tipografi',
      'Menggunakan pola Looping untuk merapikan deretan ikon informasi',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, false],
  },
  {
    id: 'fb-pusat-dkv3-07',
    reflectionId: 'ref-pusat-dkv3-07',
    studentId: 'std-dkv3-21',
    apresiasi:
      '[PERLU PERHATIAN GURU] Terima kasih atas kejujuranmu, Rahmat! Mengakui bagian yang masih membingungkan adalah langkah awal yang hebat. Pak Guru Abdul Rahman Bahsoan dan teman tutor sebaya siap mendampingimu.',
    sudah_dikuasai: [
      'Pemahaman konsep dasar pencarian beruntun (Linear Search)',
      'Keberanian mengidentifikasi kesulitan belajar dan meminta bimbingan guru',
    ],
    perlu_diperkuat: [
      'Simulasi bertahap pembelahan titik tengah pada algoritma Binary Search',
      'Pemilihan kombinasi warna kontras tinggi antara teks judul dan latar belakang poster',
    ],
    saran: [
      'Bayangkan Binary Search seperti membuka kamus tepat di halaman tengah lalu mengecek apakah kata yang dicari berada di separuh kiri atau separuh kanan',
      'Untuk poster berlatar biru tua/gelap, gunakan warna teks Putih Bersih atau Kuning Cerah agar judul langsung terbaca jelas',
      'Ikuti sesi pendampingan 10 menit bersama Pak Guru di Lab DKV',
    ],
    pertanyaan_pemantik:
      'Jika kamu mencari nomor absen 15 dari daftar absen 1 sampai 20 yang sudah berurutan, saat membuka titik tengah di nomor 10, apakah kamu akan lanjut mencari ke arah 1–9 atau 11–20?',
    rencana_belajar: [
      'Berlatih simulasi tebak angka 1-20 bersama teman sebangku',
      'Mengubah warna Headline poster menjadi putih/kuning cerah di atas latar gelap',
      'Berkonsultasi langsung dengan Pak Guru Abdul Rahman Bahsoan di Lab DKV',
    ],
    perlu_perhatian_guru: true,
    completedSteps: [true, false, false],
  },
  {
    id: 'fb-pusat-dkv3-08',
    reflectionId: 'ref-pusat-dkv3-08',
    studentId: 'std-dkv3-22',
    apresiasi:
      'Strategi yang sangat tepat Rauf! Mengunduh aset referensi terlebih dahulu lalu menutup tab browser yang berat membuktikan kamu paham cara kerja manajemen memori Sistem Operasi.',
    sudah_dikuasai: [
      'Peran Sistem Operasi dalam mengatur alokasi CPU dan memori RAM',
      'Penerapan kebiasaan hemat memori untuk mencegah terjadinya Deadlock/lag',
    ],
    perlu_diperkuat: [
      'Pengaturan antrean proses ekspor (Render Queue) saat bekerja dengan banyak file',
    ],
    saran: [
      'Bersihkan Scratch Disk / Cache aplikasi desain secara berkala agar ruang kerja sementara tetap optimal',
      'Gunakan metode Shortest Job First (SJF) saat mengekspor beberapa ukuran desain untuk media sosial dan cetak',
    ],
    pertanyaan_pemantik:
      'Mengapa menyimpan file secara berkala (Ctrl+S) ke SSD sangat penting ketika RAM sedang bekerja keras mengolah efek grafis?',
    rencana_belajar: [
      'Mengunduh seluruh aset referensi ke folder lokal sebelum mendesain',
      'Menutup aplikasi latar belakang saat proses rendering akhir',
      'Menyelesaikan tantangan kuis Sistem Operasi di Lab DKV',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, false],
  },
  {
    id: 'fb-pusat-dkv3-09',
    reflectionId: 'ref-pusat-dkv3-09',
    studentId: 'std-dkv3-23',
    apresiasi:
      'Bagus sekali Ryu Zui! Ketelitianmu menyaring data ganda pada tahap Data Cleaning memastikan riset desainmu terhindar dari jebakan Garbage In, Garbage Out.',
    sudah_dikuasai: [
      'Penguasaan 4 tahapan komputasi data (Pengumpulan, Pembersihan, Pengolahan, Visualisasi)',
      'Penerapan prinsip Data-Driven Design dalam menentukan konsep visual poster',
    ],
    perlu_diperkuat: [
      'Teknik penyaringan otomatis (Filtering) untuk mendeteksi data duplikat pada tabel survei',
    ],
    saran: [
      'Gunakan fitur Remove Duplicates atau pengurutan nama responden pada lembar kerja sebelum menghitung persentase grafik',
      'Pilih jenis grafik batang atau donat dengan palet warna kontras agar kesimpulan riset langsung terbaca',
    ],
    pertanyaan_pemantik:
      'Apa dampaknya terhadap keputusan pemilihan warna kemasan produk jika 30% data survei yang diolah ternyata merupakan data duplikat yang belum dibersihkan?',
    rencana_belajar: [
      'Memeriksa dan membersihkan data hasil kuesioner audiens (Data Cleaning)',
      'Mengolah tabel frekuensi menjadi grafik visual yang ringkas',
      'Menggunakan hasil visualisasi data sebagai dasar penentuan konsep poster',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, true],
  },
  {
    id: 'fb-pusat-dkv3-10',
    reflectionId: 'ref-pusat-dkv3-10',
    studentId: 'std-dkv3-24',
    apresiasi:
      'Kemajuan yang luar biasa Sifa! Cara kamu menata folder Group Layer bernomor urut dan menghubungkan fitur Undo dengan struktur data Stack (LIFO) menunjukkan logika komputasional yang sangat kuat.',
    sudah_dikuasai: [
      'Pemahaman struktur data Array, Stack (LIFO), dan Queue (FIFO) pada perangkat lunak grafis',
      'Penerapan pola algoritma Sequential, Branching, dan Looping saat mendesain',
    ],
    perlu_diperkuat: [
      'Konsistensi pengorganisasian tumpukan Layer (Stack) pada proyek kolaborasi kelompok',
    ],
    saran: [
      'Tetapkan standar 3 grup layer utama (01_Teks_Utama, 02_Objek_Visual, 03_Background) agar struktur Stack selalu rapi',
      'Manfaatkan perulangan (Looping) fitur Duplikasi/Transform saat menyusun elemen motif geometris',
    ],
    pertanyaan_pemantik:
      'Bagaimana perbedaan urutan pemrosesan antara riwayat Undo yang menggunakan Stack (LIFO) dan antrean cetak printer yang menggunakan Queue (FIFO)?',
    rencana_belajar: [
      'Mengelompokkan layer desain poster ke dalam folder bernomor urut',
      'Mempraktikkan pola algoritma Looping untuk membuat motif dekoratif',
      'Menyelesaikan latihan soal Struktur Data di Lab DKV & Tefa',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, true],
  },
  {
    id: 'fb-pusat-dkv3-11',
    reflectionId: 'ref-pusat-dkv3-11',
    studentId: 'std-dkv3-25',
    apresiasi:
      'Refleksi yang sangat tajam Sri Atika! Menyadari perbedaan antara memilih warna karena selera pribadi vs memilih warna berdasarkan data riset adalah lompatan besar seorang desainer.',
    sudah_dikuasai: [
      'Penerapan 4 tahapan komputasi data pada riset desain kemasan UMKM',
      'Transformasi cara berpikir dari desain subjektif menuju Data-Driven Design',
    ],
    perlu_diperkuat: [
      'Penyajian label angka dan persentase secara ringkas pada diagram batang horizontal',
    ],
    saran: [
      'Gunakan warna cerah/kontras hanya pada batang grafik dengan nilai tertinggi agar audiens langsung menangkap kesimpulan survei',
      'Batasi teks keterangan di dalam grafik maksimal 2-3 kata per baris',
    ],
    pertanyaan_pemantik:
      'Bagaimana data hasil survei preferensi konsumen dapat membantumu mempertahankan konsep desain saat presentasi di depan klien?',
    rencana_belajar: [
      'Menyusun grafik batang horizontal dari data bersih hasil survei',
      'Menambahkan label persentase yang kontras di ujung batang grafik',
      'Menerapkan palet warna terpilih pada mockup kemasan UMKM',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, false, false],
  },
  {
    id: 'fb-pusat-dkv3-12',
    reflectionId: 'ref-pusat-dkv3-12',
    studentId: 'std-dkv3-27',
    apresiasi:
      'Analogi kios dan meja kerja yang sangat tepat Wilda! Kamu berhasil memahami esensi memori RAM sekaligus menguasai standar ekspor Output digital (PNG-24 sRGB).',
    sudah_dikuasai: [
      'Pemahaman utuh model Input-Process-Output (IPO) dan analogi kapasitas RAM',
      'Pengaturan struktur folder proyek berdasarkan tahapan Input, Process, dan Output',
    ],
    perlu_diperkuat: [
      'Optimalisasi ukuran file (file size) saat mengekspor gambar beresolusi tinggi untuk web/media sosial',
    ],
    saran: [
      'Gunakan fitur Export for Screens di Adobe Illustrator/Figma untuk menghasilkan file PNG-24 dan WebP yang tajam namun tetap ringan',
      'Simpan selalu file master (.ai/.psd) di dalam folder 02_Process sebelum mengekspor ke folder 03_Output',
    ],
    pertanyaan_pemantik:
      'Mengapa profil warna sRGB selalu disarankan ketika kita mengekspor karya desain untuk ditampilkan di layar smartphone dan media sosial?',
    rencana_belajar: [
      'Menata proyek ke dalam folder 01_Input, 02_Process, dan 03_Output',
      'Mengekspor poster digital dengan format PNG-24 (1080px, sRGB)',
      'Membandingkan ketajaman teks hasil ekspor di layar HP dan monitor',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, false],
  },
  {
    id: 'fb-pusat-dkv3-13',
    reflectionId: 'ref-pusat-dkv3-13',
    studentId: 'std-dkv3-01',
    apresiasi:
      'Luar biasa Abdul Kadir! Pemanfaatan fitur Transform Again dan Smart Guides adalah contoh nyata penerapan algoritma Looping untuk menghasilkan presisi tinggi di studio DKV.',
    sudah_dikuasai: [
      'Pemahaman struktur data Array, Stack (LIFO), dan Queue (FIFO)',
      'Penerapan algoritma Looping dengan fitur Transform Again & Smart Guides',
    ],
    perlu_diperkuat: [
      'Penyesuaian rasio spasi perulangan motif saat adaptasi ukuran kanvas (A3 ke Spanduk)',
    ],
    saran: [
      'Jadikan elemen motif sebagai Symbol atau Pattern Brush terlebih dahulu agar jumlah perulangannya otomatis menyesuaikan panjang garis tepi kanvas',
      'Pastikan proporsi margin tepi tetap seimbang setelah ukuran kanvas diubah',
    ],
    pertanyaan_pemantik:
      'Bagaimana penggunaan fitur Symbol/Komponen menghemat pemakaian memori RAM ketika sebuah motif diulang sebanyak 50 kali di dalam poster?',
    rencana_belajar: [
      'Membuat Pattern/Symbol motif Karawo untuk bingkai poster',
      'Menguji adaptasi layout dari ukuran vertikal A3 ke spanduk horizontal',
      'Mengecek urutan layer dengan prinsip Stack (LIFO)',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, true],
  },
  {
    id: 'fb-pusat-dkv3-14',
    reflectionId: 'ref-pusat-dkv3-14',
    studentId: 'std-dkv3-05',
    apresiasi:
      'Kepemimpinan kolaborasi yang sangat baik Katla! Menyepakati format penamaan file bersama seluruh anggota kelompok sejak awal proyek adalah kunci sukses penerapan Sorting.',
    sudah_dikuasai: [
      'Mekanisme pencarian cepat Binary Search (maksimal 10 langkah pada 1.024 file)',
      'Standarisasi pengurutan (Sorting) nama file dalam kerja kelompok DKV',
    ],
    perlu_diperkuat: [
      'Pengecekan otomatis bila ada anggota tim yang mengunggah aset dengan nama belum terformat',
    ],
    saran: [
      'Tempelkan contoh format penamaan (misal: 01_Logo_SMKN2.svg) di pesan tersemat grup kelompok atau dokumen README folder proyek',
      'Lakukan pengecekan kerapian folder selama 2 menit sebelum memulai sesi penggabungan desain',
    ],
    pertanyaan_pemantik:
      'Mengapa penggunaan angka dua digit (01, 02, ... 10) jauh lebih rapi dalam pengurutan komputer dibandingkan angka satu digit (1, 2, ... 10)?',
    rencana_belajar: [
      'Menyusun panduan singkat penamaan file dengan angka dua digit (01-10)',
      'Mengurutkan seluruh aset kelompok X DKV 3 sebelum penggabungan layout',
      'Berbagi praktik baik manajemen file di Studio ON AIR',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, false],
  },
  {
    id: 'fb-pusat-dkv3-15',
    reflectionId: 'ref-pusat-dkv3-15',
    studentId: 'std-dkv3-09',
    apresiasi:
      'Solusi praktis yang sangat cerdas Alrezky! Mendahulukan cetak uji warna 1 lembar (Test Print) sebelum cetak ukuran penuh adalah penerapan nyata algoritma Shortest Job First di bengkel Tefa.',
    sudah_dikuasai: [
      'Penerapan algoritma penjadwalan FIFO dan SJF pada manajemen perangkat studio',
      'Strategi pencegahan antrean macet (Deadlock & Convoy Effect) saat jam praktik',
    ],
    perlu_diperkuat: [
      'Koordinasi paralel antara tim penyusun tipografi dan tim ilustrasi',
    ],
    saran: [
      'Gunakan cetak uji strip kecil (Test Strip) untuk memverifikasi ketepatan warna CMYK dalam waktu kurang dari 30 detik sebelum mencetak poster A3 penuh',
      'Tetapkan satu koordinator antrean cetak di setiap sesi praktik laboratorium',
    ],
    pertanyaan_pemantik:
      'Bagaimana cetak uji cepat (Test Strip) membantu menghemat tinta dan kertas sekaligus mempercepat antrean kerja seluruh kelas?',
    rencana_belajar: [
      'Menerapkan aturan cetak uji cepat (SJF) di bengkel Tefa DKV',
      'Membagi tugas paralel antara penyusunan teks dan ilustrasi kelompok',
      'Mengevaluasi hasil cetak akhir bersama guru pembimbing',
    ],
    perlu_perhatian_guru: false,
    completedSteps: [true, true, true],
  },
];
