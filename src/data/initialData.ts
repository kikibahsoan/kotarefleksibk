import {
  Materi,
  LearningObjective,
  QuizQuestion,
  Badge,
  Student,
  Reflection,
  MentorFeedback,
  Message,
  TownSettings,
  PublicChatMessage,
} from '../types/index.ts';

export const SMK_CLASSES = [
  'X DKV 1 (Desain Komunikasi Visual)',
  'X DKV 2 (Desain Komunikasi Visual)',
  'X DKV 3 (Desain Komunikasi Visual)',
];

export const PDF_MODUL_URL = '/public/assets/aistudio/Materi_Ajar_Siswa_Berpikir_Komputasional_Abdul_Rahman_Bahsoan_15d54abe.pdf';

export const INITIAL_MATERI: Materi[] = [
  {
    id: 'materi-bk-01',
    title: 'Pertemuan 1: Model Input-Process-Output (IPO) pada Arsitektur Von Neumann',
    subject: 'Informatika (KKA - Berpikir Komputasional)',
    targetClass: 'X DKV 1 (Desain Komunikasi Visual)',
    content:
      'Setiap komputer bekerja dengan pola dasar yang sama: Input (data/bahan dimasukkan, misal: ketikan teks atau bahan es teh gula/air), Process (CPU/prosesor mengolah data tersebut), Memori/RAM (meja kerja tempat menyimpan sementara data yang sedang aktif digunakan), dan Output (hasil akhir yang bisa dilihat/digunakan, misal: pesan terkirim atau es teh siap diminum).\n\nPada arsitektur Von Neumann, jika salah satu komponen gagal — misalnya gula (input) lupa dimasukkan — maka hasilnya (output) juga gagal. Dalam dunia desain grafis, model IPO membantu desainer memetakan aset mentah (input), proses editing di software (process & RAM), dan file ekspor cetak/digital (output).',
    link: PDF_MODUL_URL,
    location: 'perpustakaan',
    createdAt: '2026-10-20',
    isNew: true,
    customQuestions: [
      'Dari kegiatan desain yang kamu lakukan, tahap mana (Input, Process, atau Output) yang paling sering gagal atau error? Mengapa?',
      'Menurutmu, apa yang terjadi pada sebuah kios jika meja kerjanya (RAM) terlalu kecil untuk menampung banyak pesanan sekaligus?',
      'Bagaimana model IPO membantu kalian bekerja lebih rapi saat membuat karya poster atau ilustrasi DKV?',
    ],
  },
  {
    id: 'materi-bk-02',
    title: 'Pertemuan 2: Peran Sistem Operasi dalam Mengelola Proses IPO',
    subject: 'Informatika (KKA - Berpikir Komputasional)',
    targetClass: 'X DKV 2 (Desain Komunikasi Visual)',
    content:
      'Sistem Operasi (OS) seperti Windows, macOS, Android, atau iOS bertindak seperti petugas piket atau "pengatur lalu lintas". OS mengatur giliran program menggunakan sumber daya komputer (CPU, RAM, GPU, printer) agar tidak terjadi bentrok atau macet (deadlock).\n\nDua metode utama penjadwalan OS:\n1. FIFO (First In, First Out): Yang datang lebih dulu dilayani lebih dulu (seperti antrean kasir kantin atau antrean render cetak).\n2. Shortest Job First: Pekerjaan yang paling cepat selesai dikerjakan lebih dulu (seperti mendahulukan ekspor foto kecil 1MB daripada video 4K berjam-jam).',
    link: PDF_MODUL_URL,
    location: 'perpustakaan',
    createdAt: '2026-10-20',
    isNew: true,
    customQuestions: [
      'Apakah metode antrean FIFO selalu adil? Berikan contoh situasi di mana FIFO justru terasa tidak adil bagi pengguna!',
      'Aplikasi desain apa di perangkatmu yang paling banyak "berebut" memori dan baterai? Bagaimana caramu menyiasatinya?',
      'Jika kamu menjadi "OS" untuk kelompok kerja desain DKV, aturan giliran seperti apa yang kamu terapkan agar proyek selesai tepat waktu?',
    ],
  },
  {
    id: 'materi-bk-03',
    title: 'Pertemuan 3: Tahapan Proses Komputasi Data & Data-Driven Design',
    subject: 'Informatika (KKA - Berpikir Komputasional)',
    targetClass: 'X DKV 3 (Desain Komunikasi Visual)',
    content:
      'Dalam industri kreatif DKV, desain yang baik lahir dari data yang akurat (Data-Driven Design), bukan tebakan semata. Contoh: desainer yang membuat kemasan keripik pisang Gorontalo berwarna hitam pekat & emas tanpa riset, akibatnya pembeli mengira produk kosmetik sehingga tidak laku.\n\nEmpat tahapan komputasi data:\n1. Mengumpulkan: survei/angket langsung dari target audiens.\n2. Membersihkan (Data Cleaning): membuang data rusak, kosong, atau isian asal-asalan.\n3. Mengolah: menghitung frekuensi dengan turus (tally).\n4. Menyajikan: visualisasi data dalam bentuk diagram batang/lingkaran yang mudah dibaca klien.',
    link: PDF_MODUL_URL,
    location: 'perpustakaan',
    createdAt: '2026-10-20',
    isNew: true,
    customQuestions: [
      'Apa yang terjadi jika desainer langsung mengambil kesimpulan tanpa melakukan Data Cleaning (membersihkan data rusak)?',
      'Mengapa visualisasi grafik jauh lebih efektif dipahami klien dibanding deretan angka mentah?',
      'Ceritakan satu keputusan desain yang pernah kamu buat hanya berdasarkan tebakan/perasaan, apa yang berbeda jika kamu punya data riset terlebih dahulu?',
    ],
  },
  {
    id: 'materi-bk-04',
    title: 'Pertemuan 4: Struktur Data Dasar (Array, Stack, Queue) & Algoritma Standar',
    subject: 'Informatika (KKA - Berpikir Komputasional)',
    targetClass: 'X DKV 1 (Desain Komunikasi Visual)',
    content:
      'Komputer memiliki cara khusus menyimpan data:\n- Array: daftar bernomor urut/indeks slot (0, 1, 2, dst.), seperti palet warna swatch berurutan.\n- Stack (Tumpukan): LIFO (Last In First Out), data terakhir masuk menjadi yang pertama diambil, seperti tumpukan piring atau tombol "Undo" (Ctrl+Z) di Photoshop/Figma.\n- Queue (Antrean): FIFO (First In First Out), data pertama masuk keluar pertama, seperti antrean antitesis render atau chat klien.\n\nTiga pola algoritma kerja:\n1. Sequential: langkah runtut satu per satu.\n2. Branching: percabangan keputusan (IF-THEN-ELSE).\n3. Looping: pengulangan langkah yang sama.',
    link: PDF_MODUL_URL,
    location: 'perpustakaan',
    createdAt: '2026-10-20',
    isNew: false,
    customQuestions: [
      'Mengapa fitur "Undo" pada software desain grafis menggunakan struktur data Stack, bukan Queue?',
      'Bagaimana penerapan pola Sequential, Branching, dan Looping mempermudah alur kerja pembuatan mockup kemasan?',
    ],
  },
  {
    id: 'materi-bk-05',
    title: 'Pertemuan 5: Efisiensi & Keakuratan Algoritma Pencarian & Pengurutan',
    subject: 'Informatika (KKA - Berpikir Komputasional)',
    targetClass: 'X DKV 2 (Desain Komunikasi Visual)',
    content:
      'Rapi itu lebih cepat! Mengelola aset desain ribuan file membutuhkan pemahaman algoritma:\n- Linear Search: mencari satu per satu dari awal sampai akhir di tumpukan acak (sangat lambat jika data mencapai 1024 aset).\n- Binary Search: membelah data menjadi dua bagian berulang kali di tengah. Syarat mutlak: data harus sudah terurut (di-sorting) terlebih dahulu. Untuk 1024 data, Binary Search hanya butuh maksimal 10 langkah (log2 1024).\n\nPenataan folder aset desain yang terurut dan terstruktur memudahkan kolaborasi tim agensi desain.',
    link: PDF_MODUL_URL,
    location: 'perpustakaan',
    createdAt: '2026-10-20',
    isNew: false,
    customQuestions: [
      'Mengapa algoritma Binary Search tidak bisa langsung diterapkan pada data aset desain yang belum diurutkan (sorting)?',
      'Bagaimana kebiasaan menata folder dan layer secara berurutan meningkatkan efisiensi kerjamu sebagai calon desainer grafis?',
    ],
  },
];

export const INITIAL_OBJECTIVES: LearningObjective[] = [
  {
    id: 'tp-bk-01',
    materiId: 'materi-bk-01',
    goalStatement: 'Murid mampu menyimulasikan dinamika Input-Process-Output (IPO) pada arsitektur komputer dan proses produksi desain secara sistematis.',
    indicator: 'Mampu memetakan bahan input, proses CPU/RAM, dan output pada studi kasus desain kemasan.',
    deadline: '2026-10-25',
  },
  {
    id: 'tp-bk-02',
    materiId: 'materi-bk-02',
    goalStatement: 'Murid mampu menganalisis peran Sistem Operasi dalam penjadwalan sumber daya (FIFO vs Shortest Job First) untuk mencegah deadlock.',
    indicator: 'Mampu merancang aturan penjadwalan antrean render komputer lab DKV secara adil dan efisien.',
    deadline: '2026-10-27',
  },
  {
    id: 'tp-bk-03',
    materiId: 'materi-bk-03',
    goalStatement: 'Murid mampu melakukan proses komputasi data (mengumpulkan, data cleaning, tally, dan visualisasi) untuk Data-Driven Design.',
    indicator: 'Menyajikan diagram batang hasil survei preferensi visual konsumen produk lokal Gorontalo.',
    deadline: '2026-10-29',
  },
  {
    id: 'tp-bk-04',
    materiId: 'materi-bk-04',
    goalStatement: 'Murid mampu membedakan karakteristik struktur data Array, Stack, dan Queue serta menerapkan algoritma Sequential, Branching, dan Looping.',
    indicator: 'Mampu menjelaskan korelasi struktur data Stack dengan fungsi Undo pada aplikasi desain grafis.',
    deadline: '2026-11-02',
  },
  {
    id: 'tp-bk-05',
    materiId: 'materi-bk-05',
    goalStatement: 'Murid mampu membandingkan efisiensi algoritma Linear Search dan Binary Search pada persoalan pengorganisasian aset visual digital.',
    indicator: 'Mampu membuktikan efisiensi jumlah langkah pencarian data terurut menggunakan Binary Search.',
    deadline: '2026-11-05',
  },
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'reflektor_pertama',
    title: 'Langkah Pertama KKA',
    description: 'Menulis refleksi pertamamu di modul Berpikir Komputasional.',
    icon: '🌱',
    category: 'reflection',
    requiredCount: 1,
  },
  {
    id: 'reflektor_gigih',
    title: 'Reflektor DKV Gigih',
    description: 'Menulis minimal 3 refleksi pertemuan Berpikir Komputasional.',
    icon: '🌟',
    category: 'reflection',
    requiredCount: 3,
  },
  {
    id: 'penjelajah_rajin',
    title: 'Penjelajah Rajin',
    description: 'Belajar dan refleksi 3 hari berturut-turut.',
    icon: '🧭',
    category: 'streak',
    requiredCount: 3,
  },
  {
    id: 'juara_bengkel',
    title: 'Ahli Algoritma Bengkel',
    description: 'Menuntaskan tantangan kuis di Bengkel Latihan.',
    icon: '🛠️',
    category: 'practice',
    requiredCount: 2,
  },
  {
    id: 'murid_komunikatif',
    title: 'Murid Komunikatif',
    description: 'Mengirim surat pertanyaan atau kesulitan belajar ke guru via Kantor Pos.',
    icon: '📬',
    category: 'curiosity',
    requiredCount: 1,
  },
  {
    id: 'pemikir_kritis',
    title: 'Pemikir Kritis Komputasi',
    description: 'Menulis refleksi mendalam dan rencana aksi belajar konkret.',
    icon: '💡',
    category: 'reflection',
    requiredCount: 2,
  },
];

export const INITIAL_QUIZ: QuizQuestion[] = [
  {
    id: 'q-bk-01',
    materiId: 'materi-bk-01',
    materiTitle: 'Pertemuan 1: Model Input-Process-Output (IPO)',
    question: 'Dalam analogi pembuatan es teh manis di modul, bagian mana yang berfungsi sebagai Memori/RAM (penyimpan sementara)?',
    options: [
      'Uang pembeli',
      'Meja kerja tempat meletakkan gelas dan bahan yang sedang aktif diracik',
      'Resep es teh yang tertempel di dinding',
      'Gelas yang sudah dibawa pulang oleh pembeli',
    ],
    correctIndex: 1,
    explanation: 'RAM adalah memori kerja sementara yang menampung data yang sedang aktif diproses oleh CPU, persis seperti meja kerja tempat meletakkan bahan yang sedang diaduk.',
  },
  {
    id: 'q-bk-02',
    materiId: 'materi-bk-02',
    materiTitle: 'Pertemuan 2: Peran Sistem Operasi dalam Mengelola Proses IPO',
    question: 'Manakah skenario yang paling tepat menggambarkan metode penjadwalan "Shortest Job First" di lab komputer DKV?',
    options: [
      'Mendahulukan mencetak poster ukuran A4 1 lembar (10 detik) sebelum mencetak banner 10 meter (30 menit)',
      'Mencetak pesanan siswa yang datang paling pagi jam 06.30',
      'Mencetak semua file secara bersamaan sampai printer kehabisan memori',
      'Membatalkan semua tugas cetak yang masuk',
    ],
    correctIndex: 0,
    explanation: 'Shortest Job First mendahulukan pekerjaan yang durasi pengerjaannya paling singkat agar antrean cepat berkurang dan tidak menumpuk.',
  },
  {
    id: 'q-bk-03',
    materiId: 'materi-bk-03',
    materiTitle: 'Pertemuan 3: Tahapan Proses Komputasi Data',
    question: 'Mengapa tahap "Data Cleaning" sangat krusial sebelum data hasil kuesioner divisualisasikan dalam bentuk grafik?',
    options: [
      'Agar grafik terlihat berwarna-warni',
      'Untuk membuang data rusak, angket kosong, atau isian asal-asalan sehingga tidak merusak kesimpulan',
      'Agar jumlah responden bertambah dua kali lipat',
      'Untuk mengubah jawaban responden sesuai keinginan desainer',
    ],
    correctIndex: 1,
    explanation: 'Data Cleaning mencegah bias atau kesimpulan keliru dengan menyingkirkan respons yang tidak valid atau rusak sebelum dihitung.',
  },
  {
    id: 'q-bk-04',
    materiId: 'materi-bk-04',
    materiTitle: 'Pertemuan 4: Struktur Data Dasar (Array, Stack, Queue)',
    question: 'Mengapa fitur "Undo" (kembali ke aksi sebelumnya) pada software Adobe Photoshop atau Figma menggunakan prinsip Stack (LIFO)?',
    options: [
      'Karena aksi pertama yang dilakukan saat membuka aplikasi harus dibatalkan duluan',
      'Karena aksi terakhir yang baru saja digambar adalah yang paling pertama harus dibatalkan/dihapus',
      'Karena data diurutkan berdasarkan abjad nama layer',
      'Karena aksi disimpan dalam antrean berurutan secara acak',
    ],
    correctIndex: 1,
    explanation: 'Stack menerapkan prinsip LIFO (Last In First Out). Aksi paling akhir yang dimasukkan adalah yang pertama kali dibatalkan saat tombol Undo ditekan.',
  },
  {
    id: 'q-bk-05',
    materiId: 'materi-bk-05',
    materiTitle: 'Pertemuan 5: Efisiensi & Keakuratan Algoritma Searching',
    question: 'Berapa langkah maksimal yang dibutuhkan oleh Binary Search untuk menemukan 1 data dari 1.024 data yang telah terurut?',
    options: ['1.024 langkah', '512 langkah', '10 langkah (karena 2^10 = 1024)', '100 langkah'],
    correctIndex: 2,
    explanation: 'Binary Search membagi dua ruang pencarian pada setiap langkah (log2 1024 = 10), sehingga dari 1.024 data hanya dibutuhkan maksimal 10 langkah.',
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-dkv-101',
    name: 'Budi Santoso',
    className: 'X DKV 1 (Desain Komunikasi Visual)',
    studentNumber: '05',
    points: 0,
    badges: [],
    lastLogin: '2026-10-20',
    streakDays: 1,
  },
  {
    id: 'std-dkv-102',
    name: 'Siti Rahmawati',
    className: 'X DKV 2 (Desain Komunikasi Visual)',
    studentNumber: '18',
    points: 0,
    badges: [],
    lastLogin: '2026-10-19',
    streakDays: 1,
  },
  {
    id: 'std-dkv-103',
    name: 'Mohamad Rizki',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    studentNumber: '12',
    points: 0,
    badges: [],
    lastLogin: '2026-10-20',
    streakDays: 1,
  },
];

export const INITIAL_REFLECTIONS: Reflection[] = [];

export const INITIAL_FEEDBACKS: MentorFeedback[] = [];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-bk-01',
    studentId: 'std-dkv-102',
    studentName: 'Siti Rahmawati',
    className: 'X DKV 2 (Desain Komunikasi Visual)',
    content:
      'Selamat siang Pak Guru Abdul Rahman Bahsoan, saya masih bingung membedakan kapan sistem operasi memilih FIFO dan kapan Shortest Job First pada perangkat komputer kita. Mohon bimbingannya Pak.',
    teacherReply:
      'Halo Siti! Pertanyaan bagus. FIFO dipakai saat semua tugas punya bobot mirip, sedangkan Shortest Job First dipakai saat ada pekerjaan sangat singkat agar antrean tidak macet total. Di pertemuan besok kita akan simulasikan langsung di depan kelas ya!',
    status: 'replied',
    createdAt: '2026-10-20 10:30',
    repliedAt: '2026-10-20 11:15',
  },
];

export const INITIAL_SETTINGS: TownSettings = {
  townName: 'Kota Refleksi SMK Negeri 2 Gorontalo',
  academicYear: '2026/2027 Ganjil',
  teacherPin: 'Kiki123!',
  gasWebAppUrl:
    'https://script.google.com/macros/s/AKfycbwzHhVYKBfznA_k4dZlB1eGFevpeLoJDiSUbLKXJACQPgsKFxi0HfbNNbjUZBWa7finfw/exec',
};

export const INITIAL_PUBLIC_CHAT: PublicChatMessage[] = [
  {
    id: 'pchat-1',
    senderId: 'std-dkv-101',
    senderName: 'Budi Santoso',
    senderHandle: '@budi_dkv',
    className: 'X DKV 1 (Desain Komunikasi Visual)',
    roomNumber: 1,
    content: 'Halo teman-teman DKV 1! Sudah baca materi arsitektur Von Neumann di perpustakaan?',
    timestamp: '23.10',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    avatarColor: '#38bdf8',
  },
  {
    id: 'pchat-2',
    senderId: 'std-dkv-102',
    senderName: 'Siti Rahmawati',
    senderHandle: '@siti_rahma',
    className: 'X DKV 2 (Desain Komunikasi Visual)',
    roomNumber: 1,
    content: 'Halo Budi! Seru banget analogi meja kerja RAM dan bahan es tehnya hehe 😄',
    timestamp: '23.12',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    avatarColor: '#f472b6',
  },
  {
    id: 'pchat-3',
    senderId: 'std-dkv-103',
    senderName: 'Mohamad Rizki',
    senderHandle: '@m_rizki',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    roomNumber: 1,
    content: 'Salam kenal semua! Siapa yang lagi santai kumpul di Monumen Warga sekarang?',
    timestamp: '23.14',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    avatarColor: '#4ade80',
  },
  {
    id: 'pchat-4',
    senderId: 'std-dkv-104',
    senderName: 'Nurul Aini',
    senderHandle: '@nurul_aini',
    className: 'X DKV 1 (Desain Komunikasi Visual)',
    roomNumber: 1,
    content: 'Aku udah kirim refleksi di Taman Refleksi, dapet +30 XP langsung naik level! 🚀',
    timestamp: '23.16',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    avatarColor: '#fbbf24',
  },
  {
    id: 'pchat-5',
    senderId: 'std-dkv-105',
    senderName: 'Fajar Pratama',
    senderHandle: '@fajar_p',
    className: 'X DKV 2 (Desain Komunikasi Visual)',
    roomNumber: 2,
    content: 'Ruang 2 DKV kumpul di sini ya! Ayo latihan kuis di Bengkel Latihan bareng!',
    timestamp: '23.15',
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    avatarColor: '#a78bfa',
  },
  {
    id: 'pchat-6',
    senderId: 'std-dkv-106',
    senderName: 'Dewi Lestari',
    senderHandle: '@dewi_lestari',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    roomNumber: 3,
    content: 'Ruang 3 hadir! Semangat buat proyek portfolio desain semester ini teman-teman ✨',
    timestamp: '23.18',
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    avatarColor: '#34d399',
  },
];

