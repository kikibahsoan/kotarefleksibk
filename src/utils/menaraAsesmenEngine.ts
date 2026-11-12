import {
  AsesmenBankSoalRow,
  AsesmenHasilRow,
  AsesmenJawabanRow,
  AsesmenLiveStudentStatus,
  AsesmenPaketSiswaRow,
  AsesmenSesiRow,
  AsesmenStimulusRow,
  AsesmenTpReference,
  MenaraAsesmenState,
  Student,
} from '../types/index.ts';
import { StorageService } from './storage.ts';

const ASESMEN_STORE_KEY = 'refleksia_menara_asesmen_store_v2';

export interface CanonicalMenaraAsesmenStore {
  version: number;
  sesi: AsesmenSesiRow;
  stimulusList: AsesmenStimulusRow[];
  bankSoal: AsesmenBankSoalRow[];
  paketByStudent: Record<string, AsesmenPaketSiswaRow>;
  jawabanByStudent: Record<string, Record<string, AsesmenJawabanRow>>;
  hasilByStudent: Record<string, AsesmenHasilRow>;
  pesertaLive: Record<string, AsesmenLiveStudentStatus>;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function createDefaultCanonicalStore(): CanonicalMenaraAsesmenStore {
  const nowStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const sesiId = 'asesmen-tka-1';

  const defaultTpDetail: AsesmenTpReference[] = [
    {
      id_tp: 'tp-bm-001',
      mata_pelajaran: 'Dasar-Dasar Desain Komunikasi Visual (DKV)',
      kelas: 'X DKV 1, 2 & 3',
      tujuan_pembelajaran:
        'Peserta didik mampu memahami dan menerapkan prinsip hierarki visual, kontras, keseimbangan (balance), dan ruang kosong (white space) pada media publikasi cetak maupun digital.',
      isi_materi:
        'Hierarki Visual mengatur urutan perhatian mata pembaca melalui ukuran, warna kontras, tipografi, dan ruang kosong (white space). Mode warna CMYK digunakan untuk cetak fisik beresolusi 300 DPI, sedangkan RGB untuk layar digital.',
    },
    {
      id_tp: 'obj-1',
      mata_pelajaran: 'Informatika (Berpikir Komputasional)',
      kelas: 'X DKV 1, 2 & 3',
      tujuan_pembelajaran:
        'Memahami konsep Input-Process-Output (IPO), algoritma pengurutan (sorting), pencarian (searching), serta struktur data Stack (LIFO) pada fitur Undo/Redo perangkat lunak desain.',
      isi_materi:
        'Alur IPO memproses data mentah menjadi informasi visual. Struktur data Stack menerapkan prinsip Last-In First-Out (LIFO) yang menjadi dasar fitur Ctrl+Z (Undo) pada aplikasi desain grafis.',
    },
  ];

  const defaultStimuli: AsesmenStimulusRow[] = [
    {
      id_stimulus: 'stim-1',
      id_sesi: sesiId,
      judul: 'Wacana 1: Kampanye Poster Digital & Cetak Festival Kreatif SMK',
      jenis: 'teks',
      isi: 'Tim kreatif kelas X DKV mendapat proyek merancang media publikasi "Festival Karya SMK Gorontalo". Mereka harus menyiapkan dua versi karya:\n1) Spanduk & Poster Cetak ukuran A2 untuk dipasang di papan pengumuman sekolah.\n2) E-Poster & Feed Instagram ukuran 1080×1350 piksel untuk dipublikasikan di media sosial.\n\nSaat uji cetak pertama, warna poster terlihat kusam karena file masih menggunakan mode warna RGB dengan resolusi 72 DPI, serta judul acara sulit terbaca karena jarak antar teks terlalu rapat tanpa ruang kosong (white space).',
      sumber: 'Studi Kasus Produksi Desain SMK Negeri 2 Gorontalo',
    },
    {
      id_stimulus: 'stim-2',
      id_sesi: sesiId,
      judul: 'Tabel 1: Spesifikasi Teknis Media Publikasi & Struktur Memori Aplikasi Desain',
      jenis: 'tabel',
      isi: JSON.stringify({
        headers: ['Komponen Kerja', 'Spesifikasi / Prinsip', 'Fungsi Utama dalam Proyek DKV'],
        rows: [
          ['Mode Warna CMYK', '300 DPI (Cyan, Magenta, Yellow, Key)', 'Standar warna tinta mesin cetak fisik (spanduk/poster)'],
          ['Mode Warna RGB', '72–150 PPI (Red, Green, Blue)', 'Standar tampilan layar monitor, HP, dan media sosial'],
          ['Stack (Tumpukan)', 'LIFO (Last-In, First-Out)', 'Menyimpan riwayat langkah kerja untuk fitur Undo (Ctrl+Z)'],
          ['Queue (Antrean)', 'FIFO (First-In, First-Out)', 'Mengatur antrean dokumen pada mesin printer/plotter'],
        ],
      }),
      sumber: 'Modul Bank Materi Informatika & Dasar DKV',
    },
    {
      id_stimulus: 'stim-3',
      id_sesi: sesiId,
      judul: 'Grafik 1: Persentase Keterbacaan Poster Berdasarkan Komposisi Visual (%)',
      jenis: 'grafik',
      isi: JSON.stringify({
        title: 'Tingkat Keterbacaan Pesan Poster oleh Audiens dalam 3 Detik Pertama (%)',
        unit: '%',
        bars: [
          { label: 'Desain A (Hierarki Jelas + White Space 30%)', value: 92, color: '#10b981' },
          { label: 'Desain B (Kontras Warna Tinggi Tanpa Grid)', value: 68, color: '#38bdf8' },
          { label: 'Desain C (Ukuran Font Seragam & Penuh Teks)', value: 34, color: '#f59e0b' },
          { label: 'Desain D (Tanpa Margin & Kontras Rendah)', value: 19, color: '#f43f5e' },
        ],
      }),
      sumber: 'Riset Evaluasi Visual Lab DKV Refleksia',
    },
  ];

  const defaultBankSoal: AsesmenBankSoalRow[] = [
    {
      id_soal: 'soal-1',
      id_sesi: sesiId,
      tp: 'tp-bm-001',
      tp_label: defaultTpDetail[0].tujuan_pembelajaran,
      id_tp: 'tp-bm-001',
      label_tp: defaultTpDetail[0].tujuan_pembelajaran,
      jenis: 'pg_tunggal',
      tipe_penyajian: 'grup',
      id_stimulus: 'stim-1',
      nomor_urut: 1,
      teks_soal:
        'Berdasarkan Wacana 1, langkah perbaikan paling tepat agar hasil cetak poster A2 tidak kusam dan judul utama langsung terbaca oleh warga sekolah adalah...',
      opsi: [
        'Mengubah mode warna ke CMYK 300 DPI serta memperbesar ukuran judul dengan ruang kosong (white space) yang proporsional',
        'Mengubah ukuran kanvas menjadi 72 DPI RGB dan memenuhi seluruh latar dengan teks dekoratif',
        'Menyamakan ukuran huruf judul, subjudul, dan isi informasi agar terlihat seragam',
        'Menurunkan kontras warna antara teks judul dan warna latar belakang poster',
      ],
      pernyataan_kategori: [],
      label_kategori: ['Benar', 'Salah'],
      kunci_jawaban: '0',
      poin_soal: 10,
      pembahasan:
        'Media cetak fisik wajib menggunakan mode warna CMYK dengan resolusi minimal 300 DPI, serta menerapkan hierarki visual dan white space agar judul langsung terbaca.',
    },
    {
      id_soal: 'soal-2',
      id_sesi: sesiId,
      tp: 'tp-bm-001',
      tp_label: defaultTpDetail[0].tujuan_pembelajaran,
      id_tp: 'tp-bm-001',
      label_tp: defaultTpDetail[0].tujuan_pembelajaran,
      jenis: 'pg_mcma',
      tipe_penyajian: 'grup',
      id_stimulus: 'stim-1',
      nomor_urut: 2,
      teks_soal:
        'Berdasarkan Wacana 1, pilihlah SEMUA keputusan teknis yang BENAR saat tim DKV mengekspor karya untuk dua kebutuhan media tersebut! (Jawaban benar lebih dari satu)',
      opsi: [
        'File E-Poster Instagram diekspor dalam mode warna RGB karena ditayangkan pada layar gawai/smartphone',
        'File Poster Cetak A2 disiapkan menggunakan mode warna CMYK dengan resolusi 300 DPI',
        'Menghapus seluruh margin dan ruang kosong (white space) agar poster terlihat padat',
        'Menempatkan informasi utama (Judul & Tanggal Acara) sebagai focal point dengan kontras tertinggi',
      ],
      pernyataan_kategori: [],
      label_kategori: ['Benar', 'Salah'],
      kunci_jawaban: JSON.stringify([0, 1, 3]),
      poin_soal: 15,
      pembahasan:
        'Pernyataan 1, 2, dan 4 benar: RGB untuk layar digital, CMYK 300 DPI untuk cetak fisik, dan focal point kontras tinggi untuk hierarki visual.',
    },
    {
      id_soal: 'soal-3',
      id_sesi: sesiId,
      tp: 'obj-1',
      tp_label: defaultTpDetail[1].tujuan_pembelajaran,
      id_tp: 'obj-1',
      label_tp: defaultTpDetail[1].tujuan_pembelajaran,
      jenis: 'pg_kategori',
      tipe_penyajian: 'grup',
      id_stimulus: 'stim-2',
      nomor_urut: 3,
      teks_soal:
        'Perhatikan Tabel 1! Tentukan apakah setiap pernyataan mengenai penerapan konsep Informatika & produksi desain berikut BENAR atau SALAH!',
      opsi: [],
      pernyataan_kategori: [
        {
          id_pernyataan: 'S1',
          teks: 'Saat desainer menekan Ctrl+Z (Undo), aksi terakhir yang baru saja dilakukan akan dibatalkan lebih dulu sesuai prinsip LIFO pada Stack.',
          teks_pernyataan:
            'Saat desainer menekan Ctrl+Z (Undo), aksi terakhir yang baru saja dilakukan akan dibatalkan lebih dulu sesuai prinsip LIFO pada Stack.',
          kunci: 'A',
        },
        {
          id_pernyataan: 'S2',
          teks: 'Antrean pencetakan 5 poster pada mesin printer laboratorium bekerja menggunakan prinsip LIFO (yang terakhir dikirim dicetak paling awal).',
          teks_pernyataan:
            'Antrean pencetakan 5 poster pada mesin printer laboratorium bekerja menggunakan prinsip LIFO (yang terakhir dikirim dicetak paling awal).',
          kunci: 'B',
        },
        {
          id_pernyataan: 'S3',
          teks: 'Tahap mengubah sketsa dan teks mentah menjadi layout poster di aplikasi desain merupakan bagian dari tahap Process dalam alur IPO.',
          teks_pernyataan:
            'Tahap mengubah sketsa dan teks mentah menjadi layout poster di aplikasi desain merupakan bagian dari tahap Process dalam alur IPO.',
          kunci: 'A',
        },
      ],
      label_kategori: ['Benar', 'Salah'],
      kunci_jawaban: JSON.stringify({ S1: 'A', S2: 'B', S3: 'A' }),
      poin_soal: 15,
      pembahasan:
        'S1 Benar (Stack = LIFO untuk Undo), S2 Salah (antrean printer menggunakan Queue = FIFO), S3 Benar (pengolahan layout adalah tahap Process pada IPO).',
    },
    {
      id_soal: 'soal-4',
      id_sesi: sesiId,
      tp: 'tp-bm-001',
      tp_label: defaultTpDetail[0].tujuan_pembelajaran,
      id_tp: 'tp-bm-001',
      label_tp: defaultTpDetail[0].tujuan_pembelajaran,
      jenis: 'pg_kategori',
      tipe_penyajian: 'grup',
      id_stimulus: 'stim-3',
      nomor_urut: 4,
      teks_soal:
        'Berdasarkan data Grafik 1, tentukan apakah kesimpulan evaluasi desain berikut SESUAI atau TIDAK SESUAI!',
      opsi: [],
      pernyataan_kategori: [
        {
          id_pernyataan: 'S1',
          teks: 'Kombinasi hierarki visual yang jelas dan ruang kosong (white space) 30% menghasilkan keterbacaan tertinggi hingga 92%.',
          teks_pernyataan:
            'Kombinasi hierarki visual yang jelas dan ruang kosong (white space) 30% menghasilkan keterbacaan tertinggi hingga 92%.',
          kunci: 'A',
        },
        {
          id_pernyataan: 'S2',
          teks: 'Menyeragamkan ukuran seluruh huruf pada poster (Desain C) membuat pesan lebih cepat ditangkap dibanding Desain B.',
          teks_pernyataan:
            'Menyeragamkan ukuran seluruh huruf pada poster (Desain C) membuat pesan lebih cepat ditangkap dibanding Desain B.',
          kunci: 'B',
        },
        {
          id_pernyataan: 'S3',
          teks: 'Selisih tingkat keterbacaan antara Desain A dan Desain D mencapai 73 poin persentase.',
          teks_pernyataan:
            'Selisih tingkat keterbacaan antara Desain A dan Desain D mencapai 73 poin persentase.',
          kunci: 'A',
        },
      ],
      label_kategori: ['Sesuai', 'Tidak Sesuai'],
      kunci_jawaban: JSON.stringify({ S1: 'A', S2: 'B', S3: 'A' }),
      poin_soal: 15,
      pembahasan:
        'S1 Sesuai (92%), S2 Tidak Sesuai (Desain C hanya 34% sedangkan Desain B 68%), S3 Sesuai (92% - 19% = 73%).',
    },
    {
      id_soal: 'soal-5',
      id_sesi: sesiId,
      tp: 'obj-1',
      tp_label: defaultTpDetail[1].tujuan_pembelajaran,
      id_tp: 'obj-1',
      label_tp: defaultTpDetail[1].tujuan_pembelajaran,
      jenis: 'pg_tunggal',
      tipe_penyajian: 'tunggal',
      id_stimulus: '',
      nomor_urut: 5,
      teks_soal:
        'Seorang fotografer SMK ingin mencari 1 file foto tertentu dari 500 file yang sudah diurutkan berdasarkan nomor urut nama file (IMG_0001 sampai IMG_0500). Algoritma pencarian paling efisien untuk menemukan file tersebut adalah...',
      opsi: [
        'Binary Search (Pencarian Bagi Dua pada data terurut)',
        'Random Guessing (Tebak Acak tanpa pola)',
        'Menghapus separuh folder secara manual',
        'Mengubah seluruh ekstensi file menjadi TXT',
      ],
      pernyataan_kategori: [],
      label_kategori: ['Benar', 'Salah'],
      kunci_jawaban: '0',
      poin_soal: 10,
      pembahasan:
        'Binary Search sangat cepat dan efisien digunakan ketika kumpulan data sudah berada dalam keadaan terurut (sorted).',
    },
    {
      id_soal: 'soal-6',
      id_sesi: sesiId,
      tp: 'tp-bm-001',
      tp_label: defaultTpDetail[0].tujuan_pembelajaran,
      id_tp: 'tp-bm-001',
      label_tp: defaultTpDetail[0].tujuan_pembelajaran,
      jenis: 'pg_mcma',
      tipe_penyajian: 'tunggal',
      id_stimulus: '',
      nomor_urut: 6,
      teks_soal:
        'Manakah di antara prinsip berikut yang secara langsung membantu menciptakan Hierarki Visual yang kuat pada desain poster layanan masyarakat? (Pilih semua jawaban yang benar)',
      opsi: [
        'Perbedaan ukuran (size/scale) yang tegas antara judul utama dan teks penjelasan',
        'Penggunaan kontras warna antara elemen utama (focal point) dengan latar belakang',
        'Pengaturan jarak pengelompokan informasi (proximity) dan ruang kosong (white space)',
        'Menggunakan 9 jenis font dekoratif yang berbeda dalam satu kalimat pendek',
      ],
      pernyataan_kategori: [],
      label_kategori: ['Benar', 'Salah'],
      kunci_jawaban: JSON.stringify([0, 1, 2]),
      poin_soal: 15,
      pembahasan:
        'Skala ukuran, kontras warna, proximity, dan white space memperkuat hierarki visual, sedangkan terlalu banyak font dekoratif justru merusak keterbacaan.',
    },
  ];

  return {
    version: 1,
    sesi: {
      id_sesi: sesiId,
      judul_asesmen: 'Asesmen Sumatif Mandiri (TKA) — Dasar DKV & Berpikir Komputasional',
      tp_terpilih: defaultTpDetail.map((t) => t.id_tp),
      tp_detail: defaultTpDetail,
      jumlah_soal: defaultBankSoal.length,
      komposisi_jenis: {
        pg_tunggal: 2,
        pg_mcma: 2,
        pg_kategori: 2,
      },
      komposisi_penyajian: {
        tunggal: 2,
        grup: 4,
      },
      durasi: 30,
      tambahan_waktu_menit: 0,
      poin_per_jenis: {
        pg_tunggal: 10,
        pg_mcma: 15,
        pg_kategori_per_pernyataan: 5,
      },
      mcma_kredit_parsial: true,
      acak_soal: true,
      acak_opsi: true,
      izinkan_menyusul: true,
      tampilkan_pembahasan: false,
      xp_bonus_selesai: 50,
      status: 'draf',
      waktu_buka_lobi: null,
      waktu_mulai: null,
      waktu_mulai_ms: null,
      waktu_jeda_ms: null,
      total_durasi_jeda_ms: 0,
      waktu_selesai: null,
      guru_pembuat: 'Guru Pembimbing DKV',
      updated_at: nowStr,
    },
    stimulusList: defaultStimuli,
    bankSoal: defaultBankSoal,
    paketByStudent: {},
    jawabanByStudent: {},
    hasilByStudent: {},
    pesertaLive: {},
  };
}

export function loadLocalCanonicalStore(): CanonicalMenaraAsesmenStore {
  try {
    const raw = localStorage.getItem(ASESMEN_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.sesi && Array.isArray(parsed.bankSoal)) {
        const def = createDefaultCanonicalStore();
        return {
          ...def,
          ...parsed,
          sesi: {
            ...def.sesi,
            ...parsed.sesi,
          },
          paketByStudent: parsed.paketByStudent || {},
          jawabanByStudent: parsed.jawabanByStudent || {},
          hasilByStudent: parsed.hasilByStudent || {},
          pesertaLive: parsed.pesertaLive || {},
        };
      }
    }
  } catch {}
  return createDefaultCanonicalStore();
}

export function saveLocalCanonicalStore(store: CanonicalMenaraAsesmenStore): CanonicalMenaraAsesmenStore {
  const stamped: CanonicalMenaraAsesmenStore = {
    ...store,
    version: Math.max((store.version || 1) + 1, Date.now()),
  };
  try {
    localStorage.setItem(ASESMEN_STORE_KEY, JSON.stringify(stamped));
  } catch {}
  return stamped;
}

export function buildStudentPackageFromStore(
  store: CanonicalMenaraAsesmenStore,
  params: {
    studentId: string;
    studentName: string;
    className: string;
    sessionToken?: string;
  }
): AsesmenPaketSiswaRow {
  const { studentId, studentName, className, sessionToken } = params;
  const sesi = store.sesi;
  const allQuestions = store.bankSoal;

  const blocks: AsesmenBankSoalRow[][] = [];
  const stimulusGroups = new Map<string, AsesmenBankSoalRow[]>();

  allQuestions.forEach((q) => {
    if (q.tipe_penyajian === 'grup' && q.id_stimulus) {
      const existing = stimulusGroups.get(q.id_stimulus) || [];
      existing.push(q);
      stimulusGroups.set(q.id_stimulus, existing);
    } else {
      blocks.push([q]);
    }
  });

  stimulusGroups.forEach((groupQuestions) => {
    blocks.push(groupQuestions);
  });

  const orderedBlocks = sesi.acak_soal ? shuffleArray(blocks) : blocks;
  const urutanSoal: string[] = [];
  const urutanOpsiMap: Record<string, number[]> = {};

  orderedBlocks.forEach((block) => {
    const innerQuestions = sesi.acak_soal && block.length > 1 ? shuffleArray(block) : block;
    innerQuestions.forEach((q) => {
      urutanSoal.push(q.id_soal);
      if (
        (q.jenis === 'pg_tunggal' || q.jenis === 'pg_mcma') &&
        Array.isArray(q.opsi) &&
        q.opsi.length > 0
      ) {
        const indices = q.opsi.map((_, idx) => idx);
        urutanOpsiMap[q.id_soal] = sesi.acak_opsi ? shuffleArray(indices) : indices;
      }
    });
  });

  const existingPkg = store.paketByStudent[studentId];
  return {
    id_sesi: sesi.id_sesi,
    siswa: studentId,
    nama_siswa: studentName,
    kelas: className || 'X DKV',
    urutan_soal: urutanSoal,
    urutan_opsi_map: urutanOpsiMap,
    waktu_paket_dibuat: existingPkg?.waktu_paket_dibuat || new Date().toLocaleString('id-ID'),
    session_token:
      sessionToken ||
      existingPkg?.session_token ||
      `astok-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
}

export function gradeSingleQuestion(
  soal: AsesmenBankSoalRow,
  jawabanRaw: string | undefined,
  sesi: AsesmenSesiRow
): {
  poinDiperoleh: number;
  poinMaksimal: number;
  isFullyCorrect: boolean;
} {
  const jwb = String(jawabanRaw ?? '').trim();

  if (soal.jenis === 'pg_tunggal') {
    const maxPoin = Number(soal.poin_soal) || Number(sesi.poin_per_jenis.pg_tunggal) || 10;
    const kunci = String(soal.kunci_jawaban ?? '0').trim();
    const isCorrect = jwb !== '' && jwb === kunci;
    return {
      poinDiperoleh: isCorrect ? maxPoin : 0,
      poinMaksimal: maxPoin,
      isFullyCorrect: isCorrect,
    };
  }

  if (soal.jenis === 'pg_mcma') {
    const maxPoin = Number(soal.poin_soal) || Number(sesi.poin_per_jenis.pg_mcma) || 15;
    let kunciArr: number[] = [];
    let siswaArr: number[] = [];
    try {
      const parsedK = JSON.parse(soal.kunci_jawaban || '[]');
      if (Array.isArray(parsedK)) kunciArr = parsedK.map(Number);
    } catch {}
    try {
      const parsedS = JSON.parse(jwb || '[]');
      if (Array.isArray(parsedS)) siswaArr = parsedS.map(Number);
    } catch {}

    const kunciSet = new Set(kunciArr);
    const siswaSet = new Set(siswaArr);
    if (kunciSet.size === 0) {
      return { poinDiperoleh: 0, poinMaksimal: maxPoin, isFullyCorrect: false };
    }

    let correctPicked = 0;
    let wrongPicked = 0;
    siswaSet.forEach((idx) => {
      if (kunciSet.has(idx)) correctPicked++;
      else wrongPicked++;
    });

    const isExactMatch = correctPicked === kunciSet.size && wrongPicked === 0;
    if (isExactMatch) {
      return { poinDiperoleh: maxPoin, poinMaksimal: maxPoin, isFullyCorrect: true };
    }

    if (sesi.mcma_kredit_parsial && correctPicked > 0) {
      const netCorrect = Math.max(0, correctPicked - wrongPicked);
      const partialPoints = Math.round((netCorrect / kunciSet.size) * maxPoin * 10) / 10;
      return {
        poinDiperoleh: partialPoints,
        poinMaksimal: maxPoin,
        isFullyCorrect: false,
      };
    }

    return { poinDiperoleh: 0, poinMaksimal: maxPoin, isFullyCorrect: false };
  }

  const statements = Array.isArray(soal.pernyataan_kategori) ? soal.pernyataan_kategori : [];
  const poinPerStmt = Number(sesi.poin_per_jenis.pg_kategori_per_pernyataan) || 5;
  const maxPoin = statements.length * poinPerStmt;

  let kunciMap: Record<string, string> = {};
  try {
    const parsedK = JSON.parse(soal.kunci_jawaban || '{}');
    if (parsedK && typeof parsedK === 'object') kunciMap = parsedK;
  } catch {}
  statements.forEach((st) => {
    if (st.kunci && !kunciMap[st.id_pernyataan]) {
      kunciMap[st.id_pernyataan] = st.kunci;
    }
  });

  let siswaMap: Record<string, string> = {};
  try {
    const parsedS = JSON.parse(jwb || '{}');
    if (parsedS && typeof parsedS === 'object') siswaMap = parsedS;
  } catch {}

  let correctStmts = 0;
  statements.forEach((st) => {
    const expected = String(kunciMap[st.id_pernyataan] || 'A').toUpperCase();
    const actual = String(siswaMap[st.id_pernyataan] || '').toUpperCase();
    if (actual && actual === expected) {
      correctStmts++;
    }
  });

  const earned = correctStmts * poinPerStmt;
  const isAllCorrect = statements.length > 0 && correctStmts === statements.length;
  return {
    poinDiperoleh: earned,
    poinMaksimal: maxPoin || 10,
    isFullyCorrect: isAllCorrect,
  };
}

export function finalizeAndGradeStudentInStore(
  store: CanonicalMenaraAsesmenStore,
  studentId: string
): AsesmenHasilRow | null {
  const sesi = store.sesi;
  const live = store.pesertaLive[studentId];
  const pkg = store.paketByStudent[studentId];
  if (!live && !pkg) return null;

  const studentName = live?.studentName || pkg?.nama_siswa || 'Siswa DKV';
  const className = live?.className || pkg?.kelas || 'X DKV';
  const ansMap = store.jawabanByStudent[studentId] || {};

  let totalEarned = 0;
  let totalMax = 0;
  let totalFullyCorrect = 0;
  const tpStats: Record<string, { benar: number; total: number; persentase: number }> = {};

  store.bankSoal.forEach((soal) => {
    const ansObj = ansMap[soal.id_soal];
    const graded = gradeSingleQuestion(soal, ansObj?.jawaban, sesi);
    totalEarned += graded.poinDiperoleh;
    totalMax += graded.poinMaksimal;
    if (graded.isFullyCorrect) totalFullyCorrect++;

    if (ansObj) {
      ansObj.skor_butir = graded.poinDiperoleh;
      ansObj.benar = graded.isFullyCorrect;
    }

    const tpKey = soal.id_tp || 'tp-umum';
    if (!tpStats[tpKey]) {
      tpStats[tpKey] = { benar: 0, total: 0, persentase: 0 };
    }
    tpStats[tpKey].total += 1;
    if (graded.isFullyCorrect) {
      tpStats[tpKey].benar += 1;
    }
  });

  Object.keys(tpStats).forEach((k) => {
    const item = tpStats[k];
    item.persentase = item.total > 0 ? Math.round((item.benar / item.total) * 100) : 0;
  });

  const nilaiSkala100 =
    totalMax > 0 ? Math.round((totalEarned / totalMax) * 1000) / 10 : 0;
  const nowMs = Date.now();
  const startMs = sesi.waktu_mulai_ms || nowMs - 60000;
  const durasiDetik = Math.max(
    1,
    Math.round((nowMs - startMs - (sesi.total_durasi_jeda_ms || 0)) / 1000)
  );
  const nowStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const hasil: AsesmenHasilRow = {
    id_sesi: sesi.id_sesi,
    siswa: studentId,
    nama_siswa: studentName,
    kelas: className,
    nilai: nilaiSkala100,
    poin_diperoleh: Math.round(totalEarned * 10) / 10,
    poin_maksimal: totalMax,
    jumlah_benar: totalFullyCorrect,
    jumlah_soal: store.bankSoal.length,
    durasi: durasiDetik,
    keluar_tab: live?.keluar_tab || 0,
    detail_per_tp: tpStats,
    waktu_selesai: nowStr,
  };

  store.hasilByStudent[studentId] = hasil;
  if (live) {
    live.status_peserta = 'selesai';
    live.waktu_selesai = nowStr;
    live.lastSeen = nowMs;
  }

  return hasil;
}

export function buildViewFromCanonicalStore(
  store: CanonicalMenaraAsesmenStore,
  viewerId: string,
  isVerifiedTeacher: boolean
): MenaraAsesmenState {
  const sesi = store.sesi;
  const hasilSaya = viewerId ? store.hasilByStudent[viewerId] || null : null;
  const paketSaya = viewerId ? store.paketByStudent[viewerId] || null : null;
  const jawabanSaya = viewerId ? store.jawabanByStudent[viewerId] || {} : {};

  const canSeeAnswerKey =
    isVerifiedTeacher ||
    (sesi.tampilkan_pembahasan && (sesi.status === 'selesai' || Boolean(hasilSaya)));

  const sanitizedBankSoal: AsesmenBankSoalRow[] = store.bankSoal.map((soal) => {
    const cleanStatements = (soal.pernyataan_kategori || []).map((st) => ({
      id_pernyataan: st.id_pernyataan,
      teks: st.teks || st.teks_pernyataan || '',
      teks_pernyataan: st.teks_pernyataan || st.teks || '',
      ...(canSeeAnswerKey ? { kunci: st.kunci } : {}),
    }));

    return {
      ...soal,
      tp: soal.tp || soal.id_tp || 'tp-bm-001',
      tp_label: soal.tp_label || soal.label_tp || '',
      pernyataan_kategori: cleanStatements,
      kunci_jawaban: canSeeAnswerKey ? soal.kunci_jawaban : null,
      pembahasan: canSeeAnswerKey ? soal.pembahasan : null,
    };
  });

  const pesertaLiveList = Object.values(store.pesertaLive).sort((a, b) =>
    a.studentName.localeCompare(b.studentName, 'id')
  );

  const semuaHasilList = Object.values(store.hasilByStudent).sort(
    (a, b) => b.nilai - a.nilai || a.durasi - b.durasi
  );

  let analisisButir: MenaraAsesmenState['analisisButir'] = undefined;
  let analisisTp: MenaraAsesmenState['analisisTp'] = undefined;

  if (isVerifiedTeacher) {
    const finishedStudentIds = Object.keys(store.hasilByStudent);
    const totalResponden = finishedStudentIds.length;

    const butirList = store.bankSoal.map((soal, idx) => {
      let benarPenuh = 0;
      let belumJawab = 0;
      finishedStudentIds.forEach((sid) => {
        const ans = store.jawabanByStudent[sid]?.[soal.id_soal];
        if (!ans || !String(ans.jawaban ?? '').trim()) {
          belumJawab++;
        } else {
          const g = gradeSingleQuestion(soal, ans.jawaban, sesi);
          if (g.isFullyCorrect) benarPenuh++;
        }
      });
      const salahAtauParsial = Math.max(0, totalResponden - benarPenuh - belumJawab);
      const pct = totalResponden > 0 ? Math.round((benarPenuh / totalResponden) * 100) : 0;
      const tpCode = soal.tp || soal.id_tp || 'tp-bm-001';
      return {
        id_soal: soal.id_soal,
        nomor_urut: soal.nomor_urut || idx + 1,
        tp: tpCode,
        id_tp: tpCode,
        jenis: soal.jenis,
        teks_soal: soal.teks_soal,
        jumlah_menjawab: totalResponden - belumJawab,
        jumlah_benar: benarPenuh,
        persentase_benar: pct,
        total_menjawab: totalResponden - belumJawab,
        jumlah_benar_penuh: benarPenuh,
        jumlah_salah_atau_parsial: salahAtauParsial,
        persentase_ketercapaian: pct,
      };
    });
    analisisButir = butirList;

    const tpMap = new Map<
      string,
      { id_tp: string; tujuan_pembelajaran: string; jumlah_soal: number; sumPct: number }
    >();
    (sesi.tp_detail || []).forEach((tp) => {
      tpMap.set(tp.id_tp, {
        id_tp: tp.id_tp,
        tujuan_pembelajaran: tp.tujuan_pembelajaran,
        jumlah_soal: 0,
        sumPct: 0,
      });
    });

    butirList.forEach((ab) => {
      const tpKey = ab.tp || ab.id_tp || 'tp-bm-001';
      const existing = tpMap.get(tpKey) || {
        id_tp: tpKey,
        tujuan_pembelajaran: tpKey,
        jumlah_soal: 0,
        sumPct: 0,
      };
      existing.jumlah_soal += 1;
      existing.sumPct += ab.persentase_benar;
      tpMap.set(tpKey, existing);
    });

    analisisTp = Array.from(tpMap.values()).map((item) => {
      const avg = item.jumlah_soal > 0 ? Math.round(item.sumPct / item.jumlah_soal) : 0;
      return {
        tp: item.id_tp,
        tp_label: item.tujuan_pembelajaran,
        id_tp: item.id_tp,
        tujuan_pembelajaran: item.tujuan_pembelajaran,
        jumlah_soal: item.jumlah_soal,
        rata_rata_penguasaan: avg,
        rata_rata_ketercapaian: avg,
      };
    });
  }

  return {
    sesi,
    stimulusList: store.stimulusList,
    bankSoal: sanitizedBankSoal,
    paketSaya,
    jawabanSaya,
    hasilSaya,
    pesertaLive: pesertaLiveList,
    semuaHasil: isVerifiedTeacher || sesi.status === 'selesai' ? semuaHasilList : [],
    analisisButir,
    analisisTp,
    serverTime: Date.now(),
  };
}

export function buildAdaptiveQuestionsFromTpList(params: {
  sesiId: string;
  tpDetailList: AsesmenTpReference[];
  komposisiJenis: { pg_tunggal: number; pg_mcma: number; pg_kategori: number };
  komposisiPenyajian: { tunggal: number; grup: number };
  poinPerJenis: { pg_tunggal: number; pg_mcma: number; pg_kategori_per_pernyataan: number };
}): {
  stimuli: AsesmenStimulusRow[];
  questions: AsesmenBankSoalRow[];
} {
  const { sesiId, tpDetailList, komposisiJenis, komposisiPenyajian, poinPerJenis } = params;
  const tps: AsesmenTpReference[] =
    tpDetailList.length > 0
      ? tpDetailList
      : [
          {
            id_tp: 'tp-bm-001',
            mata_pelajaran: 'Dasar-Dasar DKV',
            kelas: 'X DKV',
            tujuan_pembelajaran:
              'Memahami prinsip hierarki visual, kontras, dan spesifikasi warna media publikasi.',
            isi_materi:
              'Hierarki visual, white space, CMYK 300 DPI untuk cetak, dan RGB untuk layar.',
          },
        ];

  const totalTunggalJenis = Math.max(0, Number(komposisiJenis.pg_tunggal) || 2);
  const totalMcmaJenis = Math.max(0, Number(komposisiJenis.pg_mcma) || 2);
  const totalKategoriJenis = Math.max(0, Number(komposisiJenis.pg_kategori) || 2);

  const jenisQueue: Array<'pg_tunggal' | 'pg_mcma' | 'pg_kategori'> = [
    ...Array(totalTunggalJenis).fill('pg_tunggal'),
    ...Array(totalMcmaJenis).fill('pg_mcma'),
    ...Array(totalKategoriJenis).fill('pg_kategori'),
  ];
  if (jenisQueue.length === 0) {
    jenisQueue.push('pg_tunggal', 'pg_mcma', 'pg_kategori');
  }

  const totalQuestions = jenisQueue.length;
  const targetGrupCount = Math.min(
    totalQuestions,
    Math.max(0, Number(komposisiPenyajian.grup) ?? Math.ceil(totalQuestions / 2))
  );

  const stimuli: AsesmenStimulusRow[] = [];
  if (targetGrupCount > 0) {
    const tp0 = tps[0];
    const tp1 = tps[1 % tps.length];
    stimuli.push({
      id_stimulus: 'stim-gen-1',
      id_sesi: sesiId,
      judul: `Wacana Kontekstual: Proyek Studio ${tp0.mata_pelajaran} (${tp0.kelas})`,
      jenis: 'teks',
      isi: `Dalam kegiatan pembelajaran "${tp0.mata_pelajaran}" di Kota Refleksia, tim siswa kelas ${tp0.kelas} diminta menyelesaikan tantangan proyek nyata dengan capaian utama:\n"${tp0.tujuan_pembelajaran}"\n\nRingkasan Materi Rujukan:\n${tp0.isi_materi || tp0.tujuan_pembelajaran}\n\nTim harus menganalisis kebutuhan pengguna, memilih spesifikasi teknis yang tepat, melakukan uji kualitas karya, dan memastikan hasil akhir komunikatif serta sesuai standar kejuruan.`,
      sumber: `Bank Materi Kota Refleksia • ${tp0.mata_pelajaran}`,
    });

    if (targetGrupCount >= 3) {
      stimuli.push({
        id_stimulus: 'stim-gen-2',
        id_sesi: sesiId,
        judul: `Tabel Evaluasi Indikator: ${tp1.mata_pelajaran}`,
        jenis: 'tabel',
        isi: JSON.stringify({
          headers: ['Tahap Evaluasi', 'Fokus Kompetensi', 'Indikator Keberhasilan Proyek'],
          rows: [
            [
              '1. Perencanaan & Konsep',
              tp0.mata_pelajaran,
              `Kesesuaian konsep dengan TP: ${tp0.tujuan_pembelajaran.slice(0, 90)}`,
            ],
            [
              '2. Eksekusi Teknis',
              tp1.mata_pelajaran,
              `Penerapan prosedur tepat sesuai materi: ${(tp1.isi_materi || tp1.tujuan_pembelajaran).slice(0, 90)}`,
            ],
            [
              '3. Uji Kualitas & Publikasi',
              'Refleksi & Standar Mutu',
              'Karya teruji rapi, fungsional, dan mudah dipahami audiens sasaran',
            ],
          ],
        }),
        sumber: `Bank Materi Kota Refleksia • ${tp1.mata_pelajaran}`,
      });
    }
  }

  const questions: AsesmenBankSoalRow[] = jenisQueue.map((jenis, idx) => {
    const nomor = idx + 1;
    const tp = tps[idx % tps.length];
    const isGrup = idx < targetGrupCount && stimuli.length > 0;
    const chosenStimulus = isGrup ? stimuli[idx % stimuli.length] : null;
    const stimPrefix = chosenStimulus ? `Berdasarkan ${chosenStimulus.judul}, ` : '';

    if (jenis === 'pg_tunggal') {
      return {
        id_soal: `soal-${nomor}`,
        id_sesi: sesiId,
        tp: tp.id_tp,
        tp_label: tp.tujuan_pembelajaran,
        id_tp: tp.id_tp,
        label_tp: tp.tujuan_pembelajaran,
        jenis: 'pg_tunggal',
        tipe_penyajian: isGrup ? 'grup' : 'tunggal',
        id_stimulus: chosenStimulus ? chosenStimulus.id_stimulus : '',
        nomor_urut: nomor,
        teks_soal: `${stimPrefix}manakah langkah penerapan paling tepat untuk mencapai tujuan pembelajaran "${tp.tujuan_pembelajaran}" pada mata pelajaran ${tp.mata_pelajaran}?`,
        opsi: [
          `Menerapkan konsep inti secara sistematis sesuai kaidah: ${(tp.isi_materi || tp.tujuan_pembelajaran).slice(0, 110)}`,
          'Mengabaikan tahap perencanaan dan langsung mengekspor karya tanpa evaluasi kualitas',
          'Menggunakan parameter teknis secara acak tanpa memperhatikan kebutuhan audiens sasaran',
          'Menghilangkan struktur utama agar waktu pengerjaan lebih singkat namun pesan tidak terbaca',
        ],
        pernyataan_kategori: [],
        label_kategori: ['Benar', 'Salah'],
        kunci_jawaban: '0',
        poin_soal: Number(poinPerJenis.pg_tunggal) || 10,
        pembahasan: `Jawaban A tepat karena selaras langsung dengan Tujuan Pembelajaran (${tp.id_tp}): ${tp.tujuan_pembelajaran}.`,
      };
    }

    if (jenis === 'pg_mcma') {
      return {
        id_soal: `soal-${nomor}`,
        id_sesi: sesiId,
        tp: tp.id_tp,
        tp_label: tp.tujuan_pembelajaran,
        id_tp: tp.id_tp,
        label_tp: tp.tujuan_pembelajaran,
        jenis: 'pg_mcma',
        tipe_penyajian: isGrup ? 'grup' : 'tunggal',
        id_stimulus: chosenStimulus ? chosenStimulus.id_stimulus : '',
        nomor_urut: nomor,
        teks_soal: `${stimPrefix}pilihlah SEMUA indikator praktik yang TEPAT dalam menguasai kompetensi "${tp.tujuan_pembelajaran}"! (Jawaban benar lebih dari satu)`,
        opsi: [
          `Memahami prinsip dasar dan materi esensial pada ${tp.mata_pelajaran} secara utuh`,
          `Menganalisis keterkaitan antara konsep "${tp.tujuan_pembelajaran.slice(0, 75)}" dengan studi kasus nyata`,
          'Melakukan pemeriksaan mutu dan refleksi hasil kerja sebelum dikumpulkan',
          'Melewatkan seluruh prosedur standar agar terhindar dari proses verifikasi kualitas',
        ],
        pernyataan_kategori: [],
        label_kategori: ['Benar', 'Salah'],
        kunci_jawaban: JSON.stringify([0, 1, 2]),
        poin_soal: Number(poinPerJenis.pg_mcma) || 15,
        pembahasan: `Pernyataan 1, 2, dan 3 merupakan langkah komprehensif pencapaian TP "${tp.tujuan_pembelajaran}".`,
      };
    }

    const useSesuai = nomor % 2 === 0;
    const stmts = [
      {
        id_pernyataan: 'S1',
        teks: `Penerapan kompetensi "${tp.tujuan_pembelajaran.slice(0, 95)}" membutuhkan pemahaman konsep dan ketelitian analisis.`,
        teks_pernyataan: `Penerapan kompetensi "${tp.tujuan_pembelajaran.slice(0, 95)}" membutuhkan pemahaman konsep dan ketelitian analisis.`,
        kunci: 'A' as const,
      },
      {
        id_pernyataan: 'S2',
        teks: `Dalam mata pelajaran ${tp.mata_pelajaran}, kualitas hasil akhir tetap optimal meskipun seluruh prinsip dasar diabaikan.`,
        teks_pernyataan: `Dalam mata pelajaran ${tp.mata_pelajaran}, kualitas hasil akhir tetap optimal meskipun seluruh prinsip dasar diabaikan.`,
        kunci: 'B' as const,
      },
      {
        id_pernyataan: 'S3',
        teks: `Evaluasi bertahap berdasarkan materi "${(tp.isi_materi || tp.tujuan_pembelajaran).slice(0, 85)}" membantu mencegah kesalahan produksi.`,
        teks_pernyataan: `Evaluasi bertahap berdasarkan materi "${(tp.isi_materi || tp.tujuan_pembelajaran).slice(0, 85)}" membantu mencegah kesalahan produksi.`,
        kunci: 'A' as const,
      },
    ];

    return {
      id_soal: `soal-${nomor}`,
      id_sesi: sesiId,
      tp: tp.id_tp,
      tp_label: tp.tujuan_pembelajaran,
      id_tp: tp.id_tp,
      label_tp: tp.tujuan_pembelajaran,
      jenis: 'pg_kategori',
      tipe_penyajian: isGrup ? 'grup' : 'tunggal',
      id_stimulus: chosenStimulus ? chosenStimulus.id_stimulus : '',
      nomor_urut: nomor,
      teks_soal: `${stimPrefix}tentukan apakah setiap pernyataan terkait Tujuan Pembelajaran "${tp.tujuan_pembelajaran}" berikut ${
        useSesuai ? 'SESUAI atau TIDAK SESUAI' : 'BENAR atau SALAH'
      }!`,
      opsi: [],
      pernyataan_kategori: stmts,
      label_kategori: useSesuai ? ['Sesuai', 'Tidak Sesuai'] : ['Benar', 'Salah'],
      kunci_jawaban: JSON.stringify({ S1: 'A', S2: 'B', S3: 'A' }),
      poin_soal: (Number(poinPerJenis.pg_kategori_per_pernyataan) || 5) * stmts.length,
      pembahasan: `Pernyataan S1 dan S3 ${useSesuai ? 'Sesuai' : 'Benar'}, sedangkan S2 ${
        useSesuai ? 'Tidak Sesuai' : 'Salah'
      } karena mengabaikan prinsip dasar akan menurunkan kualitas karya.`,
    };
  });

  return { stimuli, questions };
}

async function fetchJsonSafe(
  url: string,
  options?: RequestInit,
  timeoutMs = 3500
): Promise<{ ok: boolean; json: any | null }> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return { ok: false, json: null };
    }
    const json = await res.json();
    return { ok: true, json };
  } catch {
    return { ok: false, json: null };
  } finally {
    window.clearTimeout(timer);
  }
}

export const MenaraAsesmenEngine = {
  getInitialHydratedState(
    currentStudent: Student | null,
    isTeacherAccount: boolean
  ): MenaraAsesmenState {
    const store = loadLocalCanonicalStore();
    return buildViewFromCanonicalStore(
      store,
      currentStudent?.id || '',
      isTeacherAccount
    );
  },

  getLocalCanonicalStore(): CanonicalMenaraAsesmenStore {
    return loadLocalCanonicalStore();
  },

  mergeIncomingMeshStore(
    incomingStore: CanonicalMenaraAsesmenStore,
    currentStudent: Student | null,
    isTeacherAccount: boolean
  ): MenaraAsesmenState | null {
    if (!incomingStore || !incomingStore.sesi || !Array.isArray(incomingStore.bankSoal)) {
      return null;
    }
    const local = loadLocalCanonicalStore();
    const merged: CanonicalMenaraAsesmenStore = {
      ...local,
      ...incomingStore,
      sesi: {
        ...local.sesi,
        ...incomingStore.sesi,
      },
      paketByStudent: {
        ...local.paketByStudent,
        ...(incomingStore.paketByStudent || {}),
      },
      jawabanByStudent: {
        ...local.jawabanByStudent,
        ...(incomingStore.jawabanByStudent || {}),
      },
      hasilByStudent: {
        ...local.hasilByStudent,
        ...(incomingStore.hasilByStudent || {}),
      },
      pesertaLive: {
        ...local.pesertaLive,
        ...(incomingStore.pesertaLive || {}),
      },
    };

    // Jika asesmen sudah berjalan dan siswa ini belum punya paket soal, buatkan otomatis
    if (
      currentStudent &&
      !isTeacherAccount &&
      merged.sesi.status === 'berjalan' &&
      !merged.paketByStudent[currentStudent.id] &&
      (merged.pesertaLive[currentStudent.id] || merged.sesi.izinkan_menyusul)
    ) {
      merged.paketByStudent[currentStudent.id] = buildStudentPackageFromStore(merged, {
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        className: currentStudent.className || 'X DKV',
      });
    }

    const saved = saveLocalCanonicalStore(merged);
    return buildViewFromCanonicalStore(
      saved,
      currentStudent?.id || '',
      isTeacherAccount
    );
  },

  mergeIncomingStudentPacket(
    packet: {
      studentId: string;
      live?: AsesmenLiveStudentStatus;
      paket?: AsesmenPaketSiswaRow;
      jawabanMap?: Record<string, AsesmenJawabanRow>;
      hasil?: AsesmenHasilRow;
    },
    currentStudent: Student | null,
    isTeacherAccount: boolean
  ): MenaraAsesmenState | null {
    if (!packet || !packet.studentId) return null;
    const store = loadLocalCanonicalStore();
    if (packet.live) {
      store.pesertaLive[packet.studentId] = packet.live;
    }
    if (packet.paket) {
      store.paketByStudent[packet.studentId] = packet.paket;
    }
    if (packet.jawabanMap) {
      store.jawabanByStudent[packet.studentId] = {
        ...(store.jawabanByStudent[packet.studentId] || {}),
        ...packet.jawabanMap,
      };
    }
    if (packet.hasil) {
      store.hasilByStudent[packet.studentId] = packet.hasil;
    }
    const saved = saveLocalCanonicalStore(store);
    return buildViewFromCanonicalStore(
      saved,
      currentStudent?.id || '',
      isTeacherAccount
    );
  },

  async fetchState(params: {
    currentStudent: Student | null;
    isTeacherAccount: boolean;
    teacherPin: string;
  }): Promise<{
    data: MenaraAsesmenState;
    isVerifiedTeacher: boolean;
    source: 'server' | 'local';
  }> {
    const { currentStudent, isTeacherAccount, teacherPin } = params;
    const qs = new URLSearchParams();
    if (currentStudent?.id) qs.set('studentId', currentStudent.id);
    if (currentStudent?.name) qs.set('studentName', currentStudent.name);
    if (currentStudent?.className) qs.set('className', currentStudent.className);
    if (currentStudent?.gender) qs.set('gender', currentStudent.gender);
    if (isTeacherAccount) qs.set('isTeacher', 'true');
    if (currentStudent?.studentNumber) qs.set('studentNumber', currentStudent.studentNumber);
    if (teacherPin) qs.set('teacherPin', teacherPin);
    qs.set('_t', String(Date.now()));

    const { ok, json } = await fetchJsonSafe(`/api/menara-asesmen/state?${qs.toString()}`, {
      cache: 'no-store',
    });

    if (ok && json?.success && json.data) {
      return {
        data: json.data as MenaraAsesmenState,
        isVerifiedTeacher: Boolean(json.isVerifiedTeacher ?? isTeacherAccount),
        source: 'server',
      };
    }

    // Fallback ke Local + Mesh Canonical Store (untuk Vercel static deployment)
    const store = loadLocalCanonicalStore();
    if (currentStudent && !isTeacherAccount && store.pesertaLive[currentStudent.id]) {
      store.pesertaLive[currentStudent.id].lastSeen = Date.now();
      if (
        store.sesi.status === 'berjalan' &&
        store.pesertaLive[currentStudent.id].status_peserta === 'di_lobi'
      ) {
        store.pesertaLive[currentStudent.id].status_peserta = 'mengerjakan';
        if (!store.paketByStudent[currentStudent.id]) {
          store.paketByStudent[currentStudent.id] = buildStudentPackageFromStore(store, {
            studentId: currentStudent.id,
            studentName: currentStudent.name,
            className: currentStudent.className || 'X DKV',
          });
        }
      }
      saveLocalCanonicalStore(store);
    }

    return {
      data: buildViewFromCanonicalStore(store, currentStudent?.id || '', isTeacherAccount),
      isVerifiedTeacher: isTeacherAccount,
      source: 'local',
    };
  },

  async generateQuestions(params: {
    currentStudent: Student | null;
    isTeacherAccount: boolean;
    teacherPin: string;
    tpDetailList: AsesmenTpReference[];
    jumlahSoal: number;
    komposisiJenis: { pg_tunggal: number; pg_mcma: number; pg_kategori: number };
    komposisiPenyajian: { tunggal: number; grup: number };
    poinPerJenis: { pg_tunggal: number; pg_mcma: number; pg_kategori_per_pernyataan: number };
  }): Promise<{
    success: boolean;
    data: MenaraAsesmenState;
    canonicalStore: CanonicalMenaraAsesmenStore;
    message: string;
  }> {
    const {
      currentStudent,
      isTeacherAccount,
      teacherPin,
      tpDetailList,
      jumlahSoal,
      komposisiJenis,
      komposisiPenyajian,
      poinPerJenis,
    } = params;

    const { ok, json } = await fetchJsonSafe(
      '/api/menara-asesmen/generate-soal',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: currentStudent?.id,
          teacherName: currentStudent?.name,
          isTeacher: isTeacherAccount,
          studentNumber: currentStudent?.studentNumber,
          teacherPin,
          tpDetailList,
          jumlahSoal,
          komposisiJenis,
          komposisiPenyajian,
        }),
      },
      8000
    );

    const store = loadLocalCanonicalStore();
    if (ok && json?.success && json.data) {
      const serverData = json.data as MenaraAsesmenState;
      store.sesi = serverData.sesi;
      store.stimulusList = serverData.stimulusList || [];
      store.bankSoal = serverData.bankSoal || [];
      const saved = saveLocalCanonicalStore(store);
      return {
        success: true,
        data: serverData,
        canonicalStore: saved,
        message:
          json.message ||
          `✨ Berhasil men-generate ${store.bankSoal.length} soal TKA dari Bank Materi!`,
      };
    }

    // Fallback Adaptive Generator langsung dari TP Bank Materi terpilih
    const generated = buildAdaptiveQuestionsFromTpList({
      sesiId: store.sesi.id_sesi,
      tpDetailList,
      komposisiJenis,
      komposisiPenyajian,
      poinPerJenis,
    });

    const nowStr = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    store.sesi.tp_terpilih = tpDetailList.map((t) => t.id_tp);
    store.sesi.tp_detail = tpDetailList;
    store.sesi.komposisi_jenis = komposisiJenis;
    store.sesi.komposisi_penyajian = komposisiPenyajian;
    store.sesi.poin_per_jenis = poinPerJenis;
    store.sesi.jumlah_soal = generated.questions.length;
    store.sesi.updated_at = nowStr;
    store.stimulusList = generated.stimuli;
    store.bankSoal = generated.questions;

    const saved = saveLocalCanonicalStore(store);
    return {
      success: true,
      data: buildViewFromCanonicalStore(saved, currentStudent?.id || '', true),
      canonicalStore: saved,
      message: `✨ Berhasil menyusun ${generated.questions.length} butir soal TKA & ${generated.stimuli.length} stimulus dari ${tpDetailList.length} Tujuan Pembelajaran (Bank Materi)!`,
    };
  },

  async executeTeacherAction(params: {
    actionType: string;
    currentStudent: Student | null;
    isTeacherAccount: boolean;
    teacherPin: string;
    sesiConfig?: Partial<AsesmenSesiRow>;
    questionItem?: AsesmenBankSoalRow;
    questionId?: string;
    stimulusItem?: AsesmenStimulusRow;
    extraMinutes?: number;
  }): Promise<{
    success: boolean;
    data: MenaraAsesmenState;
    canonicalStore: CanonicalMenaraAsesmenStore;
  }> {
    const {
      actionType,
      currentStudent,
      isTeacherAccount,
      teacherPin,
      sesiConfig,
      questionItem,
      questionId,
      stimulusItem,
      extraMinutes,
    } = params;

    const { ok, json } = await fetchJsonSafe('/api/menara-asesmen/teacher-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionType,
        teacherId: currentStudent?.id,
        teacherName: currentStudent?.name,
        isTeacher: isTeacherAccount,
        studentNumber: currentStudent?.studentNumber,
        teacherPin,
        sesiConfig,
        questionItem,
        questionId,
        stimulusItem,
        extraMinutes,
      }),
    });

    const store = loadLocalCanonicalStore();
    const now = Date.now();
    const nowStr = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // Terapkan perubahan yang sama ke Canonical Store lokal agar selalu sinkron & siap dibroadcast via Mesh
    if (actionType === 'save_config' && sesiConfig) {
      store.sesi = {
        ...store.sesi,
        judul_asesmen: String(sesiConfig.judul_asesmen || store.sesi.judul_asesmen),
        tp_terpilih: Array.isArray(sesiConfig.tp_terpilih)
          ? sesiConfig.tp_terpilih
          : store.sesi.tp_terpilih,
        tp_detail: Array.isArray(sesiConfig.tp_detail)
          ? sesiConfig.tp_detail
          : store.sesi.tp_detail,
        durasi: Math.max(5, Math.min(180, Number(sesiConfig.durasi) || store.sesi.durasi)),
        komposisi_jenis: sesiConfig.komposisi_jenis || store.sesi.komposisi_jenis,
        komposisi_penyajian: sesiConfig.komposisi_penyajian || store.sesi.komposisi_penyajian,
        poin_per_jenis: sesiConfig.poin_per_jenis || store.sesi.poin_per_jenis,
        mcma_kredit_parsial:
          typeof sesiConfig.mcma_kredit_parsial === 'boolean'
            ? sesiConfig.mcma_kredit_parsial
            : store.sesi.mcma_kredit_parsial,
        acak_soal:
          typeof sesiConfig.acak_soal === 'boolean' ? sesiConfig.acak_soal : store.sesi.acak_soal,
        acak_opsi:
          typeof sesiConfig.acak_opsi === 'boolean' ? sesiConfig.acak_opsi : store.sesi.acak_opsi,
        izinkan_menyusul:
          typeof sesiConfig.izinkan_menyusul === 'boolean'
            ? sesiConfig.izinkan_menyusul
            : store.sesi.izinkan_menyusul,
        tampilkan_pembahasan:
          typeof sesiConfig.tampilkan_pembahasan === 'boolean'
            ? sesiConfig.tampilkan_pembahasan
            : store.sesi.tampilkan_pembahasan,
        xp_bonus_selesai: Math.max(
          5,
          Math.min(200, Number(sesiConfig.xp_bonus_selesai) || store.sesi.xp_bonus_selesai)
        ),
        guru_pembuat: currentStudent?.name || store.sesi.guru_pembuat,
        updated_at: nowStr,
      };
    } else if (actionType === 'save_question' && questionItem) {
      const idx = store.bankSoal.findIndex((q) => q.id_soal === questionItem.id_soal);
      const cleanQ: AsesmenBankSoalRow = {
        ...questionItem,
        id_soal: questionItem.id_soal || `soal-${store.bankSoal.length + 1}`,
        id_sesi: store.sesi.id_sesi,
        nomor_urut:
          idx >= 0 ? store.bankSoal[idx].nomor_urut : store.bankSoal.length + 1,
      };
      if (idx >= 0) {
        store.bankSoal[idx] = cleanQ;
      } else {
        store.bankSoal.push(cleanQ);
      }
      store.sesi.jumlah_soal = store.bankSoal.length;
      store.sesi.updated_at = nowStr;
    } else if (actionType === 'delete_question' && questionId) {
      store.bankSoal = store.bankSoal
        .filter((q) => q.id_soal !== questionId)
        .map((q, i) => ({ ...q, nomor_urut: i + 1 }));
      store.sesi.jumlah_soal = store.bankSoal.length;
      store.sesi.updated_at = nowStr;
    } else if (actionType === 'save_stimulus' && stimulusItem) {
      const idx = store.stimulusList.findIndex(
        (s) => s.id_stimulus === stimulusItem.id_stimulus
      );
      const cleanS: AsesmenStimulusRow = {
        ...stimulusItem,
        id_stimulus: stimulusItem.id_stimulus || `stim-${store.stimulusList.length + 1}`,
        id_sesi: store.sesi.id_sesi,
      };
      if (idx >= 0) {
        store.stimulusList[idx] = cleanS;
      } else {
        store.stimulusList.push(cleanS);
      }
      store.sesi.updated_at = nowStr;
    } else if (actionType === 'buka_lobi') {
      store.sesi.status = 'lobi';
      store.sesi.waktu_buka_lobi = nowStr;
      store.sesi.waktu_mulai = null;
      store.sesi.waktu_mulai_ms = null;
      store.sesi.waktu_jeda_ms = null;
      store.sesi.total_durasi_jeda_ms = 0;
      store.sesi.tambahan_waktu_menit = 0;
      store.sesi.waktu_selesai = null;
      store.sesi.updated_at = nowStr;
      store.paketByStudent = {};
      store.jawabanByStudent = {};
      store.hasilByStudent = {};
      Object.values(store.pesertaLive).forEach((p) => {
        p.status_peserta = 'di_lobi';
        p.nomor_soal_aktif = 1;
        p.soal_aktif = 1;
        p.soal_terjawab = 0;
        p.soal_ragu = 0;
        p.keluar_tab = 0;
        p.log_keluar_tab = [];
        p.waktu_mulai = null;
        p.waktu_selesai = null;
      });
    } else if (actionType === 'mulai_asesmen') {
      store.sesi.status = 'berjalan';
      store.sesi.waktu_mulai = nowStr;
      store.sesi.waktu_mulai_ms = now;
      store.sesi.waktu_jeda_ms = null;
      store.sesi.total_durasi_jeda_ms = 0;
      store.sesi.updated_at = nowStr;
      Object.values(store.pesertaLive).forEach((p) => {
        p.status_peserta = 'mengerjakan';
        p.waktu_mulai = nowStr;
        p.nomor_soal_aktif = 1;
        p.soal_aktif = 1;
        store.paketByStudent[p.studentId] = buildStudentPackageFromStore(store, {
          studentId: p.studentId,
          studentName: p.studentName,
          className: p.className,
          sessionToken: p.session_token,
        });
      });
    } else if (actionType === 'tambah_waktu') {
      const addMin = Number(extraMinutes) || 5;
      store.sesi.tambahan_waktu_menit = (store.sesi.tambahan_waktu_menit || 0) + addMin;
      store.sesi.updated_at = nowStr;
    } else if (actionType === 'jeda') {
      if (store.sesi.status === 'berjalan') {
        store.sesi.status = 'jeda';
        store.sesi.waktu_jeda_ms = now;
        store.sesi.updated_at = nowStr;
      }
    } else if (actionType === 'lanjut') {
      if (store.sesi.status === 'jeda') {
        const pausedDelta = store.sesi.waktu_jeda_ms ? now - store.sesi.waktu_jeda_ms : 0;
        store.sesi.total_durasi_jeda_ms =
          (store.sesi.total_durasi_jeda_ms || 0) + Math.max(0, pausedDelta);
        store.sesi.waktu_jeda_ms = null;
        store.sesi.status = 'berjalan';
        store.sesi.updated_at = nowStr;
      }
    } else if (actionType === 'akhiri_paksa') {
      store.sesi.status = 'selesai';
      store.sesi.waktu_selesai = nowStr;
      store.sesi.updated_at = nowStr;
      const allSids = new Set([
        ...Object.keys(store.pesertaLive),
        ...Object.keys(store.paketByStudent),
      ]);
      allSids.forEach((sid) => {
        if (!store.hasilByStudent[sid]) {
          finalizeAndGradeStudentInStore(store, sid);
        }
      });
    } else if (actionType === 'reset_sesi') {
      const nextNum =
        (parseInt(store.sesi.id_sesi.replace(/\D+/g, ''), 10) || 1) + 1;
      const nextSesiId = `asesmen-tka-${nextNum}`;
      store.sesi.id_sesi = nextSesiId;
      store.sesi.status = 'draf';
      store.sesi.waktu_buka_lobi = null;
      store.sesi.waktu_mulai = null;
      store.sesi.waktu_mulai_ms = null;
      store.sesi.waktu_jeda_ms = null;
      store.sesi.total_durasi_jeda_ms = 0;
      store.sesi.tambahan_waktu_menit = 0;
      store.sesi.waktu_selesai = null;
      store.sesi.updated_at = nowStr;
      store.bankSoal = store.bankSoal.map((q) => ({ ...q, id_sesi: nextSesiId }));
      store.stimulusList = store.stimulusList.map((s) => ({ ...s, id_sesi: nextSesiId }));
      store.paketByStudent = {};
      store.jawabanByStudent = {};
      store.hasilByStudent = {};
      store.pesertaLive = {};
    }

    const saved = saveLocalCanonicalStore(store);

    if (ok && json?.success && json.data) {
      return {
        success: true,
        data: json.data as MenaraAsesmenState,
        canonicalStore: saved,
      };
    }

    return {
      success: true,
      data: buildViewFromCanonicalStore(saved, currentStudent?.id || '', true),
      canonicalStore: saved,
    };
  },

  async executeStudentAction(params: {
    actionType: 'join_lobby' | 'save_answers_batch' | 'log_tab_exit' | 'submit_exam';
    currentStudent: Student;
    sessionToken: string;
    answersBatch?: AsesmenJawabanRow[];
    activeQuestionNumber?: number;
    tabExitReason?: string;
  }): Promise<{
    success: boolean;
    error?: string;
    hasil?: AsesmenHasilRow | null;
    data: MenaraAsesmenState;
    studentSyncPacket: {
      studentId: string;
      live?: AsesmenLiveStudentStatus;
      paket?: AsesmenPaketSiswaRow;
      jawabanMap?: Record<string, AsesmenJawabanRow>;
      hasil?: AsesmenHasilRow;
    };
  }> {
    const {
      actionType,
      currentStudent,
      sessionToken,
      answersBatch,
      activeQuestionNumber,
      tabExitReason,
    } = params;

    const { ok, json } = await fetchJsonSafe('/api/menara-asesmen/student-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionType,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        className: currentStudent.className,
        gender: currentStudent.gender,
        sessionToken,
        answersBatch,
        activeQuestionNumber,
        tabExitReason,
      }),
    });

    const store = loadLocalCanonicalStore();
    const sid = currentStudent.id;
    const sName = currentStudent.name;
    const sClass = currentStudent.className || 'X DKV';
    const sGender = currentStudent.gender === 'P' ? 'P' : 'L';
    const now = Date.now();
    const nowStr = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    let live = store.pesertaLive[sid];
    let hasil: AsesmenHasilRow | null = null;

    if (actionType === 'join_lobby') {
      if (!live) {
        live = {
          studentId: sid,
          studentName: sName,
          className: sClass,
          gender: sGender,
          status_peserta:
            store.sesi.status === 'berjalan'
              ? 'mengerjakan'
              : store.hasilByStudent[sid]
              ? 'selesai'
              : 'di_lobi',
          waktu_gabung: nowStr,
          waktu_gabung_lobi: nowStr,
          waktu_mulai: store.sesi.status === 'berjalan' ? nowStr : null,
          waktu_selesai: store.hasilByStudent[sid]?.waktu_selesai || null,
          nomor_soal_aktif: 1,
          soal_aktif: 1,
          soal_terjawab: 0,
          soal_ragu: 0,
          total_soal: store.bankSoal.length,
          keluar_tab: 0,
          log_keluar_tab: [],
          lastSeen: now,
          activeSessionToken: sessionToken,
          session_token: sessionToken,
        };
        store.pesertaLive[sid] = live;
      } else {
        live.lastSeen = now;
        live.activeSessionToken = sessionToken;
        live.session_token = sessionToken;
        if (store.sesi.status === 'berjalan' && live.status_peserta === 'di_lobi') {
          live.status_peserta = 'mengerjakan';
          live.waktu_mulai = live.waktu_mulai || nowStr;
        }
      }

      if (store.sesi.status === 'berjalan' && !store.paketByStudent[sid]) {
        const pkg = buildStudentPackageFromStore(store, {
          studentId: sid,
          studentName: sName,
          className: sClass,
          sessionToken,
        });
        store.paketByStudent[sid] = pkg;
        StorageService.syncAsesmenPaketSiswaBatchToGAS([pkg]).catch(() => {});
      }
    } else if (actionType === 'save_answers_batch') {
      if (!store.jawabanByStudent[sid]) {
        store.jawabanByStudent[sid] = {};
      }
      if (Array.isArray(answersBatch)) {
        answersBatch.forEach((item) => {
          if (!item || !item.id_soal) return;
          store.jawabanByStudent[sid][item.id_soal] = {
            id_sesi: store.sesi.id_sesi,
            siswa: sid,
            nama_siswa: sName,
            id_soal: item.id_soal,
            jawaban: String(item.jawaban ?? ''),
            ragu: Boolean(item.ragu),
            waktu: item.waktu || nowStr,
          };
        });
      }
      if (live) {
        const allAns = Object.values(store.jawabanByStudent[sid]);
        live.soal_terjawab = allAns.filter((a) => {
          const v = String(a.jawaban || '').trim();
          return v !== '' && v !== '[]' && v !== '{}';
        }).length;
        live.soal_ragu = allAns.filter((a) => a.ragu).length;
        if (typeof activeQuestionNumber === 'number') {
          live.nomor_soal_aktif = activeQuestionNumber;
          live.soal_aktif = activeQuestionNumber;
        }
        live.lastSeen = now;
      }
    } else if (actionType === 'log_tab_exit') {
      if (live && live.status_peserta === 'mengerjakan' && store.sesi.status === 'berjalan') {
        live.keluar_tab = (live.keluar_tab || 0) + 1;
        const d = new Date();
        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(
          d.getMinutes()
        ).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
        live.log_keluar_tab = [
          `${timeStr} (${tabExitReason || 'Pindah Tab/Aplikasi'})`,
          ...(live.log_keluar_tab || []),
        ].slice(0, 20);
        live.lastSeen = now;
      }
    } else if (actionType === 'submit_exam') {
      if (!store.jawabanByStudent[sid]) {
        store.jawabanByStudent[sid] = {};
      }
      if (Array.isArray(answersBatch)) {
        answersBatch.forEach((item) => {
          if (!item || !item.id_soal) return;
          store.jawabanByStudent[sid][item.id_soal] = {
            id_sesi: store.sesi.id_sesi,
            siswa: sid,
            nama_siswa: sName,
            id_soal: item.id_soal,
            jawaban: String(item.jawaban ?? ''),
            ragu: false,
            waktu: item.waktu || nowStr,
          };
        });
      }
      if (live) {
        const allAns = Object.values(store.jawabanByStudent[sid]);
        live.soal_terjawab = allAns.filter((a) => {
          const v = String(a.jawaban || '').trim();
          return v !== '' && v !== '[]' && v !== '{}';
        }).length;
        live.soal_ragu = 0;
      }
      hasil = finalizeAndGradeStudentInStore(store, sid);
    }

    const saved = saveLocalCanonicalStore(store);
    const studentSyncPacket = {
      studentId: sid,
      live: saved.pesertaLive[sid],
      paket: saved.paketByStudent[sid],
      jawabanMap: saved.jawabanByStudent[sid],
      hasil: saved.hasilByStudent[sid],
    };

    if (ok && json?.success && json.data) {
      return {
        success: true,
        hasil: json.hasil || hasil,
        data: json.data as MenaraAsesmenState,
        studentSyncPacket,
      };
    }

    return {
      success: true,
      hasil,
      data: buildViewFromCanonicalStore(saved, sid, false),
      studentSyncPacket,
    };
  },
};
