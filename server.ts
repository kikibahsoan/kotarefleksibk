import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { LIBRARY_4F_ARCHIVE_SEEDS } from './src/data/archiveSeeds.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint 1: AI Mentor Kota for Student Reflection
app.post('/api/gemini/reflect', async (req, res) => {
  const { studentName, className, materiTitle, goalStatement, answers, scale, moodEmoji } = req.body;

  const systemInstruction = `Kamu adalah "Mentor Kota" di aplikasi Kota Refleksi untuk murid SMK Negeri 2 Gorontalo mata pelajaran Informatika (Elemen Berpikir Komputasional / KKA) kelas X DKV (Desain Komunikasi Visual) 1, 2, dan 3, dengan rujukan materi ajar Berpikir Komputasional dari guru Abdul Rahman Bahsoan.
Karaktermu: hangat, ramah, bersahabat, memberi semangat, dan fokus pada proses serta strategi belajar murid SMK DKV (mengaitkan konsep komputasi seperti IPO, OS, data-driven design, stack/queue/undo, searching & sorting dengan dunia kreatif desain), bukan memberi angka atau nilai.
Aturan penting:
1. Selalu berbahasa Indonesia yang bersahabat dan mudah dipahami siswa SMK DKV.
2. Apresiasi usaha dan kejujuran murid dalam merefleksikan belajarnya.
3. Kaitkan saran dengan tujuan pembelajaran dari guru jika tersedia: "${goalStatement || 'Materi Berpikir Komputasional'}".
4. Jangan menjawab soal ujian atau tugas menggantikan murid; arahkan murid memahami konsep dan langkah solusinya.
5. Jika refleksi menunjukkan stres berat, keputusasaan, atau masalah emosional serius, beri kalimat empati dan sarankan murid berbicara dengan guru atau guru BK (Bimbingan Konseling), serta set "perlu_perhatian_guru": true. Jika normal, set false.
6. Kembalikan HANYA format JSON valid sesuai schema.`;

  const prompt = `Murid bernama ${studentName || 'Siswa'} dari kelas ${className || 'SMK'} telah menyelesaikan pembelajaran materi "${materiTitle || 'Pelajaran'}".
Skala pemahaman yang dipilih: ${scale || 3}/5 bintang. Suasana hati: ${moodEmoji || 'Normal'}.
Tujuan Pembelajaran dari Guru: ${goalStatement || 'Memahami dan mempraktikkan kompetensi dasar'}.
Jawaban Refleksi Murid:
1. Yang sudah dipahami: "${answers?.understood || '-'}"
2. Yang masih dirasa sulit/membingungkan: "${answers?.difficult || '-'}"
3. Rencana yang akan dilakukan agar lebih paham: "${answers?.actionPlan || '-'}"

Berikan umpan balik mentor dalam format JSON!`;

  if (!ai || !apiKey) {
    // Graceful fallback for offline / development without API key
    const needsAttention = scale <= 2 || (answers?.difficult?.toLowerCase().includes('menyerah') || answers?.difficult?.toLowerCase().includes('putus asa'));
    const fallbackResponse = {
      apresiasi: `Hebat sekali ${studentName}! Kejujuranmu merefleksikan pembelajaran materi "${materiTitle}" adalah langkah awal yang sangat berharga untuk terus berkembang di SMK.`,
      sudah_dikuasai: [
        answers?.understood && answers.understood.length > 5 ? answers.understood : 'Memahami konsep dasar materi dan keterhubungannya dengan praktik',
        'Kemauan untuk merefleksikan proses belajar secara mandiri'
      ],
      perlu_diperkuat: [
        answers?.difficult && answers.difficult.length > 5 ? answers.difficult : 'Mendalami bagian yang masih membingungkan dengan latihan terarah',
        'Membiasakan diri mengurai masalah menjadi langkah-langkah kecil'
      ],
      saran: [
        'Coba ulangi praktik langkah demi langkah dengan panduan modul atau catatan praktikum.',
        'Diskusikan bagian yang membingungkan dengan teman sekelompok atau langsung tanyakan ke guru saat jam pelajaran.',
        'Buat rangkuman visual atau diagram alur untuk memperjelas konsep.'
      ],
      pertanyaan_pemantik: `Menurutmu, bagian mana dari "${materiTitle}" yang paling relevan jika nanti kamu terapkan di dunia kerja atau proyek kejuruan?`,
      rencana_belajar: [
        'Buka kembali catatan atau modul materi selama 15 menit dan garis bawahi istilah kunci.',
        'Coba kerjakan 1 studi kasus atau latihan mandiri di Bengkel Latihan.',
        'Tuliskan satu pertanyaan spesifik untuk ditanyakan ke guru melalui Kantor Pos jika masih menemui kendala.'
      ],
      perlu_perhatian_guru: needsAttention
    };
    return res.json({ success: true, data: fallbackResponse, source: 'offline-mentor' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            apresiasi: {
              type: Type.STRING,
              description: 'Apresiasi singkat dan hangat pada usaha murid SMK',
            },
            sudah_dikuasai: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Daftar hal yang sudah dikuasai murid',
            },
            perlu_diperkuat: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Daftar hal yang masih perlu dipelajari lebih dalam',
            },
            saran: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 sampai 3 saran konkret',
            },
            pertanyaan_pemantik: {
              type: Type.STRING,
              description: 'Satu pertanyaan pemantik yang merangsang rasa ingin tahu',
            },
            rencana_belajar: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Tepat 3 langkah konkret yang bisa dicentang murid',
            },
            perlu_perhatian_guru: {
              type: Type.BOOLEAN,
              description: 'True jika murid mengalami kesulitan emosional serius atau perlu pendampingan guru',
            },
          },
          required: [
            'apresiasi',
            'sudah_dikuasai',
            'perlu_diperkuat',
            'saran',
            'pertanyaan_pemantik',
            'rencana_belajar',
            'perlu_perhatian_guru',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed, source: 'gemini' });
  } catch (error) {
    console.error('Gemini Reflection API error:', error);
    // Return structured fallback so user is never blocked
    return res.json({
      success: true,
      data: {
        apresiasi: `Bagus sekali ${studentName}! Usahamu menulis refleksi materi "${materiTitle}" menunjukkan dedikasi belajar yang hebat.`,
        sudah_dikuasai: ['Mencatat pemahaman awal mengenai materi yang telah dipelajari'],
        perlu_diperkuat: ['Mengkaji ulang bagian yang belum dipahami secara tuntas'],
        saran: [
          'Luangkan waktu 15 menit untuk mengulang poin-poin yang belum dipahami bersama modul.',
          'Jangan sungkan mengirim pesan ke guru melalui Kantor Pos di kota.',
        ],
        pertanyaan_pemantik: 'Apa satu hal terpenting yang ingin kamu kuasai besok?',
        rencana_belajar: [
          'Baca kembali ringkasan materi di Perpustakaan Kota.',
          'Latih pemahaman di Bengkel Latihan.',
          'Diskusikan materi ini dengan teman sebangku.',
        ],
        perlu_perhatian_guru: scale <= 2,
      },
      source: 'fallback',
    });
  }
});

// Endpoint 2: AI Summary for Teacher Dashboard
app.post('/api/gemini/teacher-summary', async (req, res) => {
  const { className, reflections, hardestTopic, averageScale } = req.body;

  const systemInstruction = `Kamu adalah asisten pedagogik AI untuk guru SMK (Bapak Abdul Rahman Bahsoan, pengampu mata pelajaran Informatika KKA elemen Berpikir Komputasional kelas X DKV 1, 2, dan 3 di SMK Negeri 2 Gorontalo).
Tugasmu: Menganalisis kumpulan refleksi murid DKV berdasarkan modul 5 Pertemuan (IPO, OS, Data Komputasi, Array/Stack/Queue, Searching/Sorting) dan memberikan ringkasan eksekutif untuk guru:
1. Tema kesulitan umum yang dialami murid dalam menghubungkan logika komputasi dengan industri kreatif DKV.
2. Pola kekuatan atau hal yang berhasil dipahami.
3. Rekomendasi diferensiasi dan tindak lanjut pembelajaran konkret untuk pertemuan tatap muka berikutnya.
Format output harus JSON.`;

  const prompt = `Kelas: ${className || 'Semua Kelas SMK'}
Rata-rata skala pemahaman: ${averageScale || 0}/5.0
Topik tersulit: ${hardestTopic?.title || 'Tidak ada'}
Total refleksi terkumpul: ${reflections?.length || 0}
Contoh data refleksi murid:
${JSON.stringify((reflections || []).slice(0, 10).map((r: any) => ({
  nama: r.studentName,
  materi: r.materiTitle,
  skala: r.scale,
  kesulitan: r.answers?.difficult,
  rencana: r.answers?.actionPlan,
})))}

Analisis dan berikan ringkasan pedagogis dalam JSON!`;

  if (!ai || !apiKey) {
    return res.json({
      success: true,
      data: {
        tema_kesulitan_umum: [
          `Sebagian murid masih kesulitan mengaitkan konsep teoritis dengan implementasi teknis pada materi ${hardestTopic?.title || 'kejuruan'}.`,
          'Banyak murid merasa ragu ketika menghadapi galat atau error tanpa bimbingan langsung.',
        ],
        pola_kekuatan_kelas: [
          'Tingkat kejujuran refleksi tinggi dan mayoritas murid memiliki inisiatif membuat rencana belajar mandiri.',
          'Konsep dasar dan sintaks awal dipahami dengan baik oleh sebagian besar siswa.',
        ],
        usulan_tindak_lanjut: [
          'Lakukan sesi bedah studi kasus (debugging workshop) selama 20 menit di awal pertemuan berikutnya.',
          'Terapkan metode Peer Tutoring (tutor sebaya) dengan memasangkan murid pemahaman tinggi (skala 4-5) dengan murid yang masih ragu (skala 1-2).',
          'Berikan penguatan ekstra untuk topik ' + (hardestTopic?.title || 'materi terkait') + '.',
        ],
      },
      source: 'offline-teacher',
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tema_kesulitan_umum: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Tema-tema kesulitan paling sering dialami murid',
            },
            pola_kekuatan_kelas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Pola kekuatan atau materi yang sudah dipahami kelas',
            },
            usulan_tindak_lanjut: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Saran tindakan pedagogik konkret untuk guru',
            },
          },
          required: ['tema_kesulitan_umum', 'pola_kekuatan_kelas', 'usulan_tindak_lanjut'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed, source: 'gemini' });
  } catch (err) {
    console.error('Teacher summary error:', err);
    return res.json({
      success: true,
      data: {
        tema_kesulitan_umum: ['Kendala umum berkutat pada pemahaman teknis lanjutan dan penanganan galat.'],
        pola_kekuatan_kelas: ['Murid menunjukkan antusiasme belajar dan kesediaan mencoba latihan.'],
        usulan_tindak_lanjut: ['Berikan ulasan singkat 15 menit dan latihan studi kasus terarah.'],
      },
      source: 'fallback',
    });
  }
});

// =========================================================================
// MONUMEN WARGA: REAL-TIME PUBLIC CHAT WITH 24-HOUR AUTOMATIC PURGE
// =========================================================================
interface ServerPublicChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderHandle: string;
  className: string;
  roomNumber: 1 | 2 | 3;
  content: string;
  timestamp: string;
  createdAt: string;
  avatarColor?: string;
  isReported?: boolean;
}

const CHATS_FILE_PATH = path.join(__dirname, 'server_chats.json');

const INITIAL_DEFAULT_CHATS: ServerPublicChatMessage[] = [
  {
    id: 'pchat-init-1',
    senderId: 'std-dkv-101',
    senderName: 'Budi Santoso',
    senderHandle: '@budi_dkv',
    className: 'X DKV 1 (Desain Komunikasi Visual)',
    roomNumber: 1,
    content: 'Halo teman-teman DKV! Sudah baca materi arsitektur Von Neumann di perpustakaan?',
    timestamp: '23.10',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    avatarColor: '#38bdf8',
  },
  {
    id: 'pchat-init-2',
    senderId: 'std-dkv-102',
    senderName: 'Siti Rahmawati',
    senderHandle: '@siti_rahma',
    className: 'X DKV 2 (Desain Komunikasi Visual)',
    roomNumber: 1,
    content: 'Halo Budi! Seru banget analogi meja kerja RAM dan bahan es tehnya hehe 😄',
    timestamp: '23.12',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    avatarColor: '#f472b6',
  },
  {
    id: 'pchat-init-3',
    senderId: 'std-dkv-103',
    senderName: 'Mohamad Rizki',
    senderHandle: '@m_rizki',
    className: 'X DKV 3 (Desain Komunikasi Visual)',
    roomNumber: 1,
    content: 'Salam kenal semua! Siapa yang lagi santai kumpul di Monumen Warga sekarang?',
    timestamp: '23.14',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    avatarColor: '#4ade80',
  },
];

const MAX_SERVER_CHAT_MESSAGES = 25;

function loadServerChatsFromFile(): ServerPublicChatMessage[] {
  try {
    if (fs.existsSync(CHATS_FILE_PATH)) {
      const raw = fs.readFileSync(CHATS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[server.ts] Could not read server_chats.json, using defaults:', err);
  }
  return INITIAL_DEFAULT_CHATS;
}

let serverChatMessages: ServerPublicChatMessage[] = loadServerChatsFromFile();

function saveServerChatsToFile() {
  try {
    fs.writeFileSync(CHATS_FILE_PATH, JSON.stringify(serverChatMessages, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[server.ts] Failed to persist server_chats.json:', err);
  }
}

// Automatically purge messages older than 24 hours (24 * 60 * 60 * 1000 ms) and keep at most 25 newest messages
function purgeExpiredServerChats() {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const cutoffTime = Date.now() - TWENTY_FOUR_HOURS;
  const prevCount = serverChatMessages.length;
  serverChatMessages = serverChatMessages
    .filter((msg) => {
      const time = new Date(msg.createdAt).getTime();
      return !isNaN(time) && time >= cutoffTime && !msg.isReported;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_SERVER_CHAT_MESSAGES);

  if (serverChatMessages.length !== prevCount) {
    saveServerChatsToFile();
  }
}

// Initial purge on startup
purgeExpiredServerChats();
saveServerChatsToFile();

// Background timer: periodically purge chats older than 24 hours every 60 seconds
setInterval(purgeExpiredServerChats, 60 * 1000);

// Get chats (filtered by 24-hour expiration and max 25 messages, with optional ?since=ISO or ?roomNumber=N)
app.get('/api/chat/messages', (req, res) => {
  purgeExpiredServerChats();
  const room = req.query.roomNumber ? Number(req.query.roomNumber) : undefined;
  const since = req.query.since ? String(req.query.since) : undefined;

  let result = serverChatMessages;
  if (room) {
    result = result.filter((m) => m.roomNumber === room);
  }
  if (since) {
    const sinceTime = new Date(since).getTime();
    if (!isNaN(sinceTime)) {
      result = result.filter((m) => new Date(m.createdAt).getTime() > sinceTime);
    }
  }

  res.json({
    success: true,
    data: result.slice(0, MAX_SERVER_CHAT_MESSAGES),
    ttlHours: 24,
    maxLimit: MAX_SERVER_CHAT_MESSAGES,
    serverTime: new Date().toISOString(),
  });
});

// Post chat message (shared with all students, persisted to disk and auto-purged after 24h)
app.post('/api/chat/messages', (req, res) => {
  purgeExpiredServerChats();
  const { senderId, senderName, senderHandle, className, roomNumber, content, avatarColor } = req.body;

  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Pesan obrolan tidak boleh kosong.' });
  }

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timestamp = `${hours}.${minutes}`;

  const newChat: ServerPublicChatMessage = {
    id: `pchat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    senderId: String(senderId || 'std-anon'),
    senderName: String(senderName || 'Warga Kota'),
    senderHandle: String(senderHandle || '@warga'),
    className: String(className || 'X DKV SMK'),
    roomNumber: (roomNumber === 2 || roomNumber === 3) ? roomNumber : 1,
    content: content.trim().slice(0, 120),
    timestamp,
    createdAt: now.toISOString(),
    avatarColor: avatarColor || '#38bdf8',
  };

  serverChatMessages.unshift(newChat);
  // Strictly enforce max 25 messages and 24-hour limit
  purgeExpiredServerChats();
  saveServerChatsToFile();

  res.json({
    success: true,
    data: newChat,
    ttlHours: 24,
    maxLimit: MAX_SERVER_CHAT_MESSAGES,
  });
});

// Report chat message
app.post('/api/chat/report', (req, res) => {
  const { messageId } = req.body;
  serverChatMessages = serverChatMessages.map((m) =>
    m.id === messageId ? { ...m, isReported: true } : m
  );
  saveServerChatsToFile();
  res.json({ success: true, message: 'Laporan berhasil dicatat.' });
});

// =========================================================================
// JURNAL HARIAN POHON BERINGIN & JURNAL 4F SYNC ACROSS CITIZENS
// =========================================================================

interface ServerStickyNote {
  id: string;
  studentId: string;
  studentName: string;
  className?: string;
  content: string;
  mood: string;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple';
  date: string;
  timestamp: number;
  likes?: number;
  likedBy?: string[];
  likedByNames?: string[];
}

interface ServerJurnal4F {
  id: string;
  title: string;
  subject: string;
  facts: string;
  feelings: string;
  findings: string;
  future: string;
  date: string;
  xpEarned?: number;
  studentId?: string;
  studentName?: string;
  className?: string;
}

const STICKY_NOTES_FILE_PATH = path.join(__dirname, 'server_sticky_notes.json');
const JURNAL_4F_FILE_PATH = path.join(__dirname, 'server_4f_journals.json');

const INITIAL_SERVER_STICKY_NOTES: ServerStickyNote[] = [
  {
    id: 'note-init-01',
    studentId: 'std-dkv2-01',
    studentName: 'ABDUL RAZAK SAMAUNA',
    className: 'X DKV 2',
    content: 'Hari ini paham konsep IPO Von Neumann, ternyata alur kerja layer desain mirip pemrosesan RAM!',
    mood: '💡',
    color: 'yellow',
    date: '31 Okt 2026',
    timestamp: Date.now() - 1000 * 60 * 45,
    likes: 5,
    likedBy: ['std-dkv2-02', 'std-dkv2-03', 'teacher-naziefah'],
    likedByNames: ['Siti Rahma', 'Budi Santoso', 'NAZIEFAH S.Pd'],
  },
  {
    id: 'note-init-02',
    studentId: 'teacher-naziefah',
    studentName: 'NAZIEFAH S.Pd',
    className: 'Guru Pembimbing',
    content: 'Semangat terus anak-anak DKV! Jangan lupa selalu istirahat cukup & jaga ketelitian berkarya.',
    mood: '🌿',
    color: 'pink',
    date: '31 Okt 2026',
    timestamp: Date.now() - 1000 * 60 * 120,
    likes: 12,
    likedBy: ['std-dkv2-01', 'std-dkv3-05', 'std-dkv2-12'],
    likedByNames: ['ABDUL RAZAK SAMAUNA', 'FADHIL ARKAN', 'NURUL AISYAH'],
  },
  {
    id: 'note-init-03',
    studentId: 'std-dkv3-05',
    studentName: 'FADHIL ARKAN',
    className: 'X DKV 3',
    content: 'Berhasil selesaikan 5 soal di Bengkel Latihan. Semoga besok bisa raih lencana reflektor lagi!',
    mood: '🚀',
    color: 'blue',
    date: '30 Okt 2026',
    timestamp: Date.now() - 1000 * 60 * 60 * 18,
    likes: 4,
    likedBy: ['std-dkv2-01', 'teacher-naziefah'],
    likedByNames: ['ABDUL RAZAK SAMAUNA', 'NAZIEFAH S.Pd'],
  },
  {
    id: 'note-init-04',
    studentId: 'std-dkv2-12',
    studentName: 'NURUL AISYAH',
    className: 'X DKV 2',
    content: 'Tadi santai di ayunan relaksasi sambil baca modul tipografi. Suasana kotanya adem banget.',
    mood: '🎨',
    color: 'green',
    date: '30 Okt 2026',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    likes: 7,
    likedBy: ['std-dkv2-01', 'std-dkv3-05'],
    likedByNames: ['ABDUL RAZAK SAMAUNA', 'FADHIL ARKAN'],
  },
];

const INITIAL_SERVER_4F: ServerJurnal4F[] = [
  {
    id: 'j4f-init-01',
    title: 'Model IPO & Von Neumann',
    subject: 'Informatika (Berpikir Komputasional)',
    facts: 'Mempelajari cara kerja Input - Process - Output pada arsitektur komputer Von Neumann dan hubungannya dengan workflow rendering karya desain.',
    feelings: 'Merasa kagum saat menyadari instruksi pen tablet adalah input dan layer aktif di Photoshop ditampung sementara oleh RAM.',
    findings: 'Pentingnya kapasitas RAM dan manajemen layer agar aplikasi desain tidak lagging atau crash saat proses rendering.',
    future: 'Akan selalu menyimpan file secara berkala (Ctrl+S) dan membersihkan scratch disk laptop sebelum memulai project besar.',
    date: '31 Okt 2026',
    xpEarned: 2,
    studentId: 'std-dkv2-01',
    studentName: 'ABDUL RAZAK SAMAUNA',
    className: 'X DKV 2',
  },
  {
    id: 'j4f-init-02',
    title: 'Manajemen Sistem Operasi & Antrean FIFO',
    subject: 'Informatika (Berpikir Komputasional)',
    facts: 'Mempelajari algoritma penjadwalan First In First Out (FIFO) dan Shortest Job First (SJF) dalam sistem operasi.',
    feelings: 'Tertantang memahami bagaimana CPU membagi waktu proses kerja rendering dan antrean cetak printer.',
    findings: 'Algoritma SJF lebih efisien mencegah deadlock saat banyak tugas desain kecil mengantre bersamaan.',
    future: 'Menerapkan prioritas pengerjaan tugas singkat terlebih dahulu agar antrean revisi klien tidak menumpuk.',
    date: '30 Okt 2026',
    xpEarned: 2,
    studentId: 'std-dkv3-02',
    studentName: 'AQILA NAILA SALSABILA',
    className: 'X DKV 3',
  },
];

function loadServerStickyNotesFromFile(): ServerStickyNote[] {
  try {
    if (fs.existsSync(STICKY_NOTES_FILE_PATH)) {
      const raw = fs.readFileSync(STICKY_NOTES_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[server.ts] Could not read server_sticky_notes.json:', err);
  }
  return INITIAL_SERVER_STICKY_NOTES;
}

let serverStickyNotes: ServerStickyNote[] = loadServerStickyNotesFromFile();

function saveServerStickyNotesToFile() {
  try {
    fs.writeFileSync(STICKY_NOTES_FILE_PATH, JSON.stringify(serverStickyNotes, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[server.ts] Failed to persist server_sticky_notes.json:', err);
  }
}

function loadServer4FFromFile(): ServerJurnal4F[] {
  const seedList: ServerJurnal4F[] = LIBRARY_4F_ARCHIVE_SEEDS.map((s) => ({
    id: s.id,
    title: s.title,
    subject: s.subject,
    facts: s.facts,
    feelings: s.feelings,
    findings: s.findings,
    future: s.future,
    date: s.date,
    xpEarned: s.xpEarned,
    studentId: s.studentId || 'std-dkv',
    studentName: s.studentName || 'Siswa DKV',
    className: s.className || 'X DKV',
  }));

  try {
    if (fs.existsSync(JURNAL_4F_FILE_PATH)) {
      const raw = fs.readFileSync(JURNAL_4F_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const legacyIds = new Set(['j4f-init-01', 'j4f-init-02', 'j4f-seed-1', 'j4f-seed-2', 'j4f-seed-3', 'j4f-seed-4']);
        const filteredExisting = parsed.filter(
          (item: ServerJurnal4F) => item && item.id && !legacyIds.has(item.id) && !item.id.startsWith('j4f-assa-')
        );
        const existingMap = new Map<string, ServerJurnal4F>();
        filteredExisting.forEach((item: ServerJurnal4F) => existingMap.set(item.id, item));
        seedList.forEach((seed) => {
          if (!existingMap.has(seed.id)) {
            existingMap.set(seed.id, seed);
          }
        });
        return Array.from(existingMap.values());
      }
    }
  } catch (err) {
    console.warn('[server.ts] Could not read server_4f_journals.json:', err);
  }
  return seedList;
}

let server4FJournals: ServerJurnal4F[] = loadServer4FFromFile();

function saveServer4FToFile() {
  try {
    fs.writeFileSync(JURNAL_4F_FILE_PATH, JSON.stringify(server4FJournals, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[server.ts] Failed to persist server_4f_journals.json:', err);
  }
}

// Sticky Notes Endpoints
app.get('/api/journals/sticky-notes', (_req, res) => {
  res.json({
    success: true,
    data: serverStickyNotes,
    serverTime: new Date().toISOString(),
  });
});

app.post('/api/journals/sticky-notes', (req, res) => {
  const { id, studentId, studentName, className, content, mood, color, date, timestamp } = req.body;
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Isi catatan tidak boleh kosong.' });
  }

  const noteId = id ? String(id) : `sticky-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const existingIdx = serverStickyNotes.findIndex((n) => n.id === noteId);

  const newNote: ServerStickyNote = {
    id: noteId,
    studentId: String(studentId || 'std-anon'),
    studentName: String(studentName || 'Warga Refleksia'),
    className: String(className || 'X DKV 2'),
    content: content.trim().slice(0, 200),
    mood: String(mood || '😊'),
    color: ['yellow', 'pink', 'blue', 'green', 'purple'].includes(color) ? color : 'yellow',
    date: date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
    likes: 0,
    likedBy: [],
    likedByNames: [],
  };

  if (existingIdx >= 0) {
    serverStickyNotes[existingIdx] = { ...serverStickyNotes[existingIdx], ...newNote };
  } else {
    serverStickyNotes.unshift(newNote);
  }
  if (serverStickyNotes.length > 100) {
    serverStickyNotes = serverStickyNotes.slice(0, 100);
  }
  saveServerStickyNotesToFile();

  res.json({ success: true, data: newNote });
});

app.post('/api/journals/sticky-notes/like', (req, res) => {
  const { noteId, increment, studentId, studentName } = req.body;
  const delta = increment === false ? -1 : 1;
  let updatedNote: ServerStickyNote | null = null;

  serverStickyNotes = serverStickyNotes.map((n) => {
    if (n.id === noteId) {
      const prevLikedBy = Array.isArray(n.likedBy) ? n.likedBy : [];
      const prevLikedNames = Array.isArray(n.likedByNames) ? n.likedByNames : [];
      let nextLikedBy = [...prevLikedBy];
      let nextLikedNames = [...prevLikedNames];

      if (studentId) {
        if (increment === false) {
          const idx = nextLikedBy.indexOf(studentId);
          if (idx >= 0) {
            nextLikedBy.splice(idx, 1);
            if (studentName) {
              nextLikedNames = nextLikedNames.filter((nm) => nm !== studentName);
            }
          }
        } else if (!nextLikedBy.includes(studentId)) {
          nextLikedBy.push(studentId);
          if (studentName && !nextLikedNames.includes(studentName)) {
            nextLikedNames.push(studentName);
          }
        }
      }

      const nextLikes = Math.max(nextLikedBy.length, Math.max(0, (n.likes || 0) + delta));
      updatedNote = {
        ...n,
        likes: nextLikes,
        likedBy: nextLikedBy,
        likedByNames: nextLikedNames,
      };
      return updatedNote;
    }
    return n;
  });
  saveServerStickyNotesToFile();
  res.json({ success: true, data: updatedNote });
});

// Jurnal 4F Endpoints
app.get('/api/journals/4f', (_req, res) => {
  res.json({
    success: true,
    data: server4FJournals,
    serverTime: new Date().toISOString(),
  });
});

app.post('/api/journals/4f', (req, res) => {
  const { title, subject, facts, feelings, findings, future, studentId, studentName, className, date, xpEarned } = req.body;
  if (!title || !facts) {
    return res.status(400).json({ success: false, error: 'Judul dan fakta tidak boleh kosong.' });
  }

  const newJurnal: ServerJurnal4F = {
    id: `j4f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: String(title).trim(),
    subject: String(subject || 'Informatika'),
    facts: String(facts).trim(),
    feelings: String(feelings || 'Tertantang dan bersemangat.').trim(),
    findings: String(findings || 'Menemukan wawasan baru.').trim(),
    future: String(future || 'Akan terus berlatih.').trim(),
    date: date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    xpEarned: Number(xpEarned || 2),
    studentId: String(studentId || 'std-anon'),
    studentName: String(studentName || 'Warga Refleksia'),
    className: String(className || 'X DKV'),
  };

  server4FJournals.unshift(newJurnal);
  if (server4FJournals.length > 100) {
    server4FJournals = server4FJournals.slice(0, 100);
  }
  saveServer4FToFile();

  res.json({ success: true, data: newJurnal });
});

// =========================================================================
// PODCAST MENARA MENTOR KOTA (AI HOST & RIWAYAT PODCAST WARGA)
// =========================================================================
const PODCAST_HISTORY_FILE_PATH = path.join(__dirname, 'server_podcasts.json');

interface ServerPodcastRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  materiId: string;
  materiTitle: string;
  sudahDikuasai: string;
  perluDiperkuat: string;
  saranKonkretAI: string[];
  pertanyaanPemantikAI: string;
  jawabanPemantikSiswa: string;
  rencanaBelajarSiswa: string[];
  apresiasiHost: string;
  transcriptText: string;
  messages: any[];
  createdAt: string;
  timestamp: number;
}

const INITIAL_SERVER_PODCASTS: ServerPodcastRecord[] = [
  {
    id: 'pod-init-01',
    studentId: 'std-dkv2-01',
    studentName: 'ABDUL RAZAK SAMAUNA',
    className: 'X DKV 2',
    materiId: 'materi-bk-01',
    materiTitle: 'BAB 1 — MODEL IPO & ARSITEKTUR VON NEUMANN',
    sudahDikuasai: 'Saya sudah paham alur Input, Process, dan Output, terutama bagaimana pen tablet menjadi input dan RAM menampung layer aktif.',
    perluDiperkuat: 'Masih perlu memperkuat pemahaman tentang cara kerja Control Unit dan ALU di dalam CPU saat merender grafis.',
    saranKonkretAI: [
      'Gunakan analogi dapur studio: Control Unit adalah sutradara yang mengatur antrean, sedangkan ALU adalah juru hitung piksel.',
      'Coba amati Task Manager saat membuka aplikasi desain untuk melihat beban kerja CPU dan RAM secara langsung.',
      'Buat sketsa peta konsep hubungan Input -> CPU (CU + ALU) <-> RAM -> Output di buku catatan.'
    ],
    pertanyaanPemantikAI: 'Jika suatu hari klien meminta revisi mendadak dengan 50 layer resolusi tinggi sementara kapasitas RAM terbatas, strategi apa yang akan kamu lakukan agar proses komputasi tidak macet?',
    jawabanPemantikSiswa: 'Saya akan menggabungkan (merge) layer yang sudah final dan menutup aplikasi lain agar ruang meja kerja RAM tetap lega.',
    rencanaBelajarSiswa: [
      'Membaca kembali ilustrasi arsitektur Von Neumann di Perpustakaan Kampus selama 15 menit.',
      'Membuat infografis ringkas tentang perbedaan fungsi RAM dan Storage SSD.',
      'Mengerjakan latihan soal Model IPO di Bengkel Latihan.'
    ],
    apresiasiHost: 'Luar biasa sekali obrolan kita hari ini, Abdul Razak! Kamu berhasil menghubungkan teori arsitektur komputer Von Neumann langsung ke manajemen layer desain grafis.',
    transcriptText: `[HOST AI MENTOR]: Halo pendengar Radio Refleksia! Selamat datang di Studio Podcast ON AIR Menara Mentor Kota bersama saya Host AI Mentor. Hari ini telah hadir bintang tamu spesial kita, ABDUL RAZAK SAMAUNA dari kelas X DKV 2 yang siap mengupas tuntas materi "BAB 1 — MODEL IPO & ARSITEKTUR VON NEUMANN". Halo Abdul Razak, dari materi ini, bagian mana yang menurutmu sudah paling kamu kuasai?\n\n[ABDUL RAZAK SAMAUNA]: Saya sudah paham alur Input, Process, dan Output, terutama bagaimana pen tablet menjadi input dan RAM menampung layer aktif.\n\n[HOST AI MENTOR]: Keren banget! Analogi RAM sebagai meja kerja layer itu tepat sasaran. Nah, kalau bagian atau area yang menurutmu masih perlu diperkuat apa nih?\n\n[ABDUL RAZAK SAMAUNA]: Masih perlu memperkuat pemahaman tentang cara kerja Control Unit dan ALU di dalam CPU saat merender grafis.\n\n[HOST AI MENTOR]: Jujur dan reflektif sekali! Sebagai Host sekaligus AI Mentor, ini 3 Saran Konkret untukmu:\n1. Gunakan analogi dapur studio: Control Unit adalah sutradara yang mengatur antrean, sedangkan ALU adalah juru hitung piksel.\n2. Coba amati Task Manager saat membuka aplikasi desain untuk melihat beban kerja CPU dan RAM secara langsung.\n3. Buat sketsa peta konsep hubungan Input -> CPU (CU + ALU) <-> RAM -> Output di buku catatan.\n\nSekarang, pertanyaan pemantik spesial buat kamu: "Jika suatu hari klien meminta revisi mendadak dengan 50 layer resolusi tinggi sementara kapasitas RAM terbatas, strategi apa yang akan kamu lakukan agar proses komputasi tidak macet?" Serta apa Rencana Belajar konkretmu selanjutnya?\n\n[ABDUL RAZAK SAMAUNA]: Saya akan menggabungkan (merge) layer yang sudah final dan menutup aplikasi lain agar ruang meja kerja RAM tetap lega. Rencana belajar saya: 1) Membaca kembali ilustrasi arsitektur Von Neumann di Perpustakaan Kampus selama 15 menit. 2) Membuat infografis ringkas tentang perbedaan fungsi RAM dan Storage SSD. 3) Mengerjakan latihan soal Model IPO di Bengkel Latihan.\n\n[HOST AI MENTOR]: Luar biasa sekali obrolan kita hari ini, Abdul Razak! Kamu berhasil menghubungkan teori arsitektur komputer Von Neumann langsung ke manajemen layer desain grafis. Sampai jumpa di episode Podcast Menara Mentor berikutnya!`,
    messages: [],
    createdAt: '31 Okt 2026',
    timestamp: Date.now() - 1000 * 60 * 30,
  },
];

function loadServerPodcastsFromFile(): ServerPodcastRecord[] {
  try {
    if (fs.existsSync(PODCAST_HISTORY_FILE_PATH)) {
      const raw = fs.readFileSync(PODCAST_HISTORY_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[server.ts] Could not read server_podcasts.json:', err);
  }
  return INITIAL_SERVER_PODCASTS;
}

let serverPodcasts: ServerPodcastRecord[] = loadServerPodcastsFromFile();

function saveServerPodcastsToFile() {
  try {
    fs.writeFileSync(PODCAST_HISTORY_FILE_PATH, JSON.stringify(serverPodcasts, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[server.ts] Failed to persist server_podcasts.json:', err);
  }
}

app.get('/api/podcasts/history', (_req, res) => {
  res.json({
    success: true,
    data: serverPodcasts,
    serverTime: new Date().toISOString(),
  });
});

app.post('/api/podcasts/history', (req, res) => {
  const ep = req.body;
  if (!ep || !ep.materiTitle) {
    return res.status(400).json({ success: false, error: 'Data podcast tidak lengkap.' });
  }
  const record: ServerPodcastRecord = {
    id: ep.id ? String(ep.id) : `pod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    studentId: String(ep.studentId || 'std-anon'),
    studentName: String(ep.studentName || 'Siswa DKV'),
    className: String(ep.className || 'X DKV 2'),
    materiId: String(ep.materiId || 'materi-bk-01'),
    materiTitle: String(ep.materiTitle),
    sudahDikuasai: String(ep.sudahDikuasai || ''),
    perluDiperkuat: String(ep.perluDiperkuat || ''),
    saranKonkretAI: Array.isArray(ep.saranKonkretAI) ? ep.saranKonkretAI : [],
    pertanyaanPemantikAI: String(ep.pertanyaanPemantikAI || ''),
    jawabanPemantikSiswa: String(ep.jawabanPemantikSiswa || ''),
    rencanaBelajarSiswa: Array.isArray(ep.rencanaBelajarSiswa) ? ep.rencanaBelajarSiswa : [],
    apresiasiHost: String(ep.apresiasiHost || ''),
    transcriptText: String(ep.transcriptText || ''),
    messages: Array.isArray(ep.messages) ? ep.messages : [],
    createdAt: ep.createdAt || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    timestamp: typeof ep.timestamp === 'number' ? ep.timestamp : Date.now(),
  };

  const existingIdx = serverPodcasts.findIndex((p) => p.id === record.id);
  if (existingIdx >= 0) {
    serverPodcasts[existingIdx] = record;
  } else {
    serverPodcasts.unshift(record);
  }
  if (serverPodcasts.length > 100) {
    serverPodcasts = serverPodcasts.slice(0, 100);
  }
  saveServerPodcastsToFile();
  res.json({ success: true, data: record });
});

app.post('/api/gemini/podcast-host', async (req, res) => {
  const {
    step,
    studentName,
    className,
    materiTitle,
    materiSummary,
    sudahDikuasai,
    perluDiperkuat,
    jawabanPemantikSiswa,
    rencanaBelajarSiswa,
  } = req.body;

  // Step 1: After student shares 'Yang Sudah Kamu Kuasai' -> Host responds with a friendly, warm, casual/santai female podcast host style and asks 'Area Perlu Diperkuat'
  if (step === 'after_mastered') {
    const fallbackReply = `Wah, keren banget ${studentName}! Penjelasan kamu soal "${sudahDikuasai}" di materi ${materiTitle} udah mantap dan gampang banget dipahami. Nah, kalau kita ngobrol jujur-jujuran santai nih, dari materi ini bagian atau area mana sih yang menurutmu masih agak bikin bingung atau perlu diperkuat lagi? Ceritain aja santai ke aku ya!`;

    if (!ai || !apiKey) {
      return res.json({ success: true, data: { hostReply: fallbackReply } });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Siswa bernama ${studentName} (${className}) sedang menjadi bintang tamu di Podcast Studio ON AIR Menara Mentor membahas materi "${materiTitle}".
Ringkasan materi: ${materiSummary || materiTitle}.
Siswa baru saja menjawab tentang Hal yang Sudah Dikuasai: "${sudahDikuasai}".
Sebagai Host Podcast cewek sekaligus AI Mentor yang super friendly, akrab, hangat, dan santai (seperti kakak mentor atau teman ngobrol podcast yang asyik tapi tetap sopan untuk anak SMK DKV), berikan tanggapan singkat yang mengapresiasi jawaban tersebut dengan bahasa santai dan akrab (1-2 kalimat), lalu tanyakan dengan santai: "Bagian atau area mana nih dari materi ini yang menurut kamu masih perlu diperkuat atau dipelajari lebih lanjut?"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hostReply: { type: Type.STRING },
            },
            required: ['hostReply'],
          },
        },
      });
      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, data: { hostReply: parsed.hostReply || fallbackReply } });
    } catch {
      return res.json({ success: true, data: { hostReply: fallbackReply } });
    }
  }

  // Step 2: After student shares 'Area Perlu Diperkuat' -> Host gives 3 Concrete Advice (Saran Konkret dari AI) + 1 Pertanyaan Pemantik + asks for Rencana Belajar
  if (step === 'after_strengthen') {
    const fallbackAdvice = [
      `Coba intip lagi poin inti "${perluDiperkuat}" di modul Perpustakaan Kampus sambil bikin coretan visual berwarna biar makin kebayang.`,
      `Coba praktikkan langsung pakai contoh kasus sederhana di studio desain atau ngobrol bareng teman sebangku.`,
      `Latih terus pemahamanmu secara santai di Bengkel Latihan atau tanya ke Bapak/Ibu Guru lewat Kantor Pos.`,
    ];
    const fallbackTrigger = `Kalau nanti konsep "${materiTitle}" ini kamu pakai pas lagi ngerjain project desain di dunia nyata, langkah kreatif apa nih yang paling pengen kamu coba duluan?`;
    const fallbackHostSpeech = `Makasih udah cerita jujur ya, ${studentName}! Wajar banget kok kalau bagian "${perluDiperkuat}" masih terasa menantang pas lagi belajar. Biar makin paham dan pede, aku udah siapin 3 tips santai plus 1 pertanyaan seru buat kamu. Habis ini langsung ceritain jawabanmu bareng 3 langkah Rencana Belajarmu ya!`;

    if (!ai || !apiKey) {
      return res.json({
        success: true,
        data: {
          hostIntro: fallbackHostSpeech,
          saranKonkret: fallbackAdvice,
          pertanyaanPemantik: fallbackTrigger,
          suggestedRencana: [
            `Membaca ulang bagian "${perluDiperkuat}" di modul Perpustakaan Kampus selama 15 menit.`,
            `Membuat rangkuman mind-map visual agar konsep "${materiTitle}" lebih mudah diingat.`,
            `Mengerjakan kuis latihan di Bengkel Latihan untuk menguji penguasaan materi.`,
          ],
        },
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Kamu adalah Host Podcast cewek sekaligus AI Mentor Kota di SMK Negeri 2 Gorontalo (Jurusan DKV) yang gayanya friendly, hangat, asyik, akrab, dan santai.
Bintang tamu siswa: ${studentName} (${className}).
Materi yang dibahas: "${materiTitle}".
1. Hal yang sudah dikuasai siswa: "${sudahDikuasai}"
2. Area yang masih perlu diperkuat menurut siswa: "${perluDiperkuat}"

Tugasmu di segmen podcast ini:
- Buat "hostIntro": Tanggapan gaya host podcast cewek yang friendly, santai, akrab, dan menyemangati siswa (2 kalimat).
- Buat "saranKonkret": Tepat 3 tips/saran konkret dengan bahasa santai, praktis, dan relevan dengan anak SMK DKV untuk memperkuat area yang masih sulit tersebut.
- Buat "pertanyaanPemantik": 1 pertanyaan pemantik yang seru, santai, dan bikin siswa penasaran terkait penerapan materi di dunia desain/komputasi.
- Buat "suggestedRencana": 3 ide langkah rencana belajar singkat sebagai referensi siswa.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hostIntro: { type: Type.STRING },
              saranKonkret: { type: Type.ARRAY, items: { type: Type.STRING } },
              pertanyaanPemantik: { type: Type.STRING },
              suggestedRencana: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['hostIntro', 'saranKonkret', 'pertanyaanPemantik', 'suggestedRencana'],
          },
        },
      });
      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        data: {
          hostIntro: parsed.hostIntro || fallbackHostSpeech,
          saranKonkret: Array.isArray(parsed.saranKonkret) && parsed.saranKonkret.length > 0 ? parsed.saranKonkret : fallbackAdvice,
          pertanyaanPemantik: parsed.pertanyaanPemantik || fallbackTrigger,
          suggestedRencana: Array.isArray(parsed.suggestedRencana) && parsed.suggestedRencana.length > 0 ? parsed.suggestedRencana : [
            `Membaca ulang bagian "${perluDiperkuat}" di modul Perpustakaan Kampus selama 15 menit.`,
            `Membuat rangkuman mind-map visual agar konsep "${materiTitle}" lebih mudah diingat.`,
            `Mengerjakan kuis latihan di Bengkel Latihan untuk menguji penguasaan materi.`,
          ],
        },
      });
    } catch {
      return res.json({
        success: true,
        data: {
          hostIntro: fallbackHostSpeech,
          saranKonkret: fallbackAdvice,
          pertanyaanPemantik: fallbackTrigger,
          suggestedRencana: [
            `Membaca ulang bagian "${perluDiperkuat}" di modul Perpustakaan Kampus selama 15 menit.`,
            `Membuat rangkuman mind-map visual agar konsep "${materiTitle}" lebih mudah diingat.`,
            `Mengerjakan kuis latihan di Bengkel Latihan untuk menguji penguasaan materi.`,
          ],
        },
      });
    }
  }

  // Step 3: After student answers trigger question & submits Rencana Belajar -> Host closes the podcast episode in a friendly & casual style
  const fallbackClosing = `Wih, mantap banget ${studentName}! Jawaban atas pertanyaan pemantik dan 3 langkah rencana belajar yang kamu susun udah keren banget dan siap dipraktikkan. Seru banget bisa ngobrol santai bareng kamu di Studio Podcast ON AIR Menara Mentor hari ini! Rekaman transkrip podcast kita udah tersimpan rapi di Riwayat Podcast dan Google Spreadsheet. Semangat terus belajarnya ya, sampai ketemu di episode berikutnya!`;

  if (!ai || !apiKey) {
    return res.json({ success: true, data: { hostClosing: fallbackClosing } });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Kamu adalah Host Podcast cewek sekaligus AI Mentor di Menara Mentor Kota yang gayanya friendly, akrab, hangat, dan santai.
Siswa ${studentName} (${className}) baru saja menyelesaikan sesi podcast materi "${materiTitle}".
Jawaban siswa atas pertanyaan pemantik: "${jawabanPemantikSiswa || '-'}"
Rencana belajar siswa: "${Array.isArray(rencanaBelajarSiswa) ? rencanaBelajarSiswa.join('; ') : rencanaBelajarSiswa || '-'}"
Berikan kalimat penutup podcast (closing statement) dengan gaya cewek yang friendly, santai, mengapresiasi rencana belajar siswa dengan antusias, dan menutup siaran ON AIR dengan hangat (2-3 kalimat).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hostClosing: { type: Type.STRING },
          },
          required: ['hostClosing'],
        },
      },
    });
    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: { hostClosing: parsed.hostClosing || fallbackClosing } });
  } catch {
    return res.json({ success: true, data: { hostClosing: fallbackClosing } });
  }
});

// =========================================================================
// REAL-TIME PRESENCE & MULTI-DEVICE ONLINE AVATARS SYNC (24 JAM REAL-TIME)
// =========================================================================
interface ServerOnlinePlayer {
  id: string;
  handle: string;
  name: string;
  role: 'siswa' | 'guru' | 'warga';
  roleLabel: string;
  gender: 'L' | 'P';
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  wx: number;
  wy: number;
  targetWx: number;
  targetWy: number;
  speed: number;
  isMoving: boolean;
  walkFrame: number;
  facing: 'down-left' | 'down-right' | 'up-left' | 'up-right';
  isSitting?: boolean;
  sittingSeat?: string;
  isFishing?: boolean;
  heldItem?: 'kopi' | 'roti' | 'eskrim' | null;
  activeEmote?: {
    type: 'love' | 'wave' | 'laugh' | 'dance';
    icon: string;
    label: string;
    startTime: number;
    expiresAt: number;
  } | null;
  speechText?: string;
  speechTimer?: number;
  lastSeen: number;
  connectedAt?: number;
}

const PRESENCE_FILE_PATH = path.join(__dirname, 'server_presence.json');
const SERVER_START_TIME = Date.now();

function loadPresenceFromFile(): Map<string, ServerOnlinePlayer> {
  const map = new Map<string, ServerOnlinePlayer>();
  try {
    if (fs.existsSync(PRESENCE_FILE_PATH)) {
      const raw = fs.readFileSync(PRESENCE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const now = Date.now();
        // Restore players seen within last 45 seconds as active
        parsed.forEach((p: ServerOnlinePlayer) => {
          if (p && p.id && now - p.lastSeen < 45000) {
            map.set(p.id, p);
          }
        });
      }
    }
  } catch (err) {
    console.warn('[server.ts] Could not read server_presence.json:', err);
  }
  return map;
}

const onlinePlayersMap = loadPresenceFromFile();
const sseClients = new Set<express.Response>();
let lastPresenceSaveTime = 0;

function savePresenceToFile() {
  const now = Date.now();
  if (now - lastPresenceSaveTime < 1500) return; // Throttled to avoid disk thrash
  lastPresenceSaveTime = now;
  try {
    const list = Array.from(onlinePlayersMap.values());
    fs.writeFileSync(PRESENCE_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[server.ts] Failed to persist server_presence.json:', err);
  }
}

function broadcastPresence(payload: any) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

function purgeInactivePlayers() {
  const timeoutMs = 40000; // 40 seconds of inactivity before marking offline
  const now = Date.now();
  let changed = false;
  for (const [id, player] of onlinePlayersMap.entries()) {
    if (now - player.lastSeen > timeoutMs) {
      onlinePlayersMap.delete(id);
      changed = true;
    }
  }
  if (changed) {
    savePresenceToFile();
    broadcastPresence({
      type: 'sync',
      onlinePlayers: Array.from(onlinePlayersMap.values()),
    });
  }
}

// Inactive cleanup & SSE keep-alive ping interval (every 2.5 seconds)
setInterval(() => {
  purgeInactivePlayers();
  for (const client of sseClients) {
    try {
      client.write(`: keepalive ${Date.now()}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}, 2500);

const CREATOR_CITY_STATE_FILE_PATH = path.join(__dirname, 'server_creator_city_state.json');

function migrateMenaraAsesmenInCreatorState(state: any): any {
  if (!state || typeof state !== 'object') return state;
  if (Array.isArray(state.customBuildings)) {
    state.customBuildings = state.customBuildings.map((b: any) => {
      if (
        b &&
        (b.id === 'cbuild-mw7csayu-ahr' ||
          b.name === 'Menara Inovasi Digital' ||
          (b.modelType === 'modern_tower' && Math.abs(Number(b.wx) - 9.5) < 0.8 && Math.abs(Number(b.wy) - -3.5) < 0.8))
      ) {
        return {
          ...b,
          name: 'Menara Asesmen Individu',
          tagline: 'Asesmen Sumatif Mandiri Berbasis Lobi (TKA Individu)',
          icon: '📝',
        };
      }
      return b;
    });
  }
  return state;
}

function loadCreatorCityStateFromFile(): any | null {
  try {
    if (fs.existsSync(CREATOR_CITY_STATE_FILE_PATH)) {
      const raw = fs.readFileSync(CREATOR_CITY_STATE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && typeof parsed.version === 'number') {
        return migrateMenaraAsesmenInCreatorState(parsed);
      }
    }
  } catch (err) {
    console.warn('[server.ts] Could not read server_creator_city_state.json:', err);
  }
  return null;
}

let serverCreatorCityState: any | null = loadCreatorCityStateFromFile();

function saveCreatorCityStateToFile() {
  if (!serverCreatorCityState) return;
  try {
    fs.writeFileSync(
      CREATOR_CITY_STATE_FILE_PATH,
      JSON.stringify(serverCreatorCityState, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.warn('[server.ts] Failed to persist server_creator_city_state.json:', err);
  }
}

app.get('/api/creator-city-state', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    success: true,
    data: serverCreatorCityState,
    version: serverCreatorCityState?.version || 0,
    serverTime: Date.now(),
  });
});

app.post('/api/creator-city-state', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const incoming = req.body?.creatorCityState || req.body;
  if (!incoming || typeof incoming !== 'object' || typeof incoming.version !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Data Creator City State tidak valid.',
    });
  }

  if (!serverCreatorCityState || incoming.version >= (serverCreatorCityState.version || 0)) {
    serverCreatorCityState = migrateMenaraAsesmenInCreatorState(incoming);
    saveCreatorCityStateToFile();

    // Broadcast immediately via SSE to all connected citizens in real-time
    broadcastPresence({
      type: 'creator_state_update',
      creatorCityState: serverCreatorCityState,
    });
  }

  return res.json({
    success: true,
    data: serverCreatorCityState,
    version: serverCreatorCityState?.version || 0,
  });
});

// SSE Stream for Instant Real-Time Multi-Device Presence & Creator City State
app.get('/api/presence/stream', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  sseClients.add(res);

  // Send initial players and current creatorCityState immediately on connection
  purgeInactivePlayers();
  const initial = Array.from(onlinePlayersMap.values());
  res.write(
    `data: ${JSON.stringify({
      type: 'sync',
      onlinePlayers: initial,
      creatorCityState: serverCreatorCityState,
    })}\n\n`
  );

  _req.on('close', () => {
    sseClients.delete(res);
  });
});

// Heartbeat & sync player position/state across all devices
app.post('/api/presence/heartbeat', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  purgeInactivePlayers();
  const data = req.body;
  if (!data || !data.id) {
    return res.status(400).json({ success: false, error: 'Data pemain tidak valid.' });
  }

  const existing = onlinePlayersMap.get(data.id);
  const isTeacherRole = data.role === 'guru' || Boolean(data.isTeacher);
  const now = Date.now();

  const player: ServerOnlinePlayer = {
    id: String(data.id),
    handle: String(data.handle || 'warga').replace(/^@/, ''),
    name: String(data.name || data.handle || 'Warga'),
    role: isTeacherRole ? 'guru' : 'siswa',
    roleLabel: String(data.roleLabel || (isTeacherRole ? 'GURU DKV' : 'Siswa DKV')),
    gender: data.gender === 'P' ? 'P' : 'L',
    shirtColor: String(data.shirtColor || (isTeacherRole ? (data.gender === 'P' ? '#047857' : '#1e3a8a') : '#2563eb')),
    pantsColor: String(data.pantsColor || (isTeacherRole ? (data.gender === 'P' ? '#065f46' : '#1e293b') : '#1e293b')),
    hairColor: String(data.hairColor || '#0f172a'),
    wx: typeof data.wx === 'number' && !isNaN(data.wx) ? data.wx : 1.5,
    wy: typeof data.wy === 'number' && !isNaN(data.wy) ? data.wy : 1.8,
    targetWx: typeof data.targetWx === 'number' && !isNaN(data.targetWx) ? data.targetWx : (data.wx || 1.5),
    targetWy: typeof data.targetWy === 'number' && !isNaN(data.targetWy) ? data.targetWy : (data.wy || 1.8),
    speed: typeof data.speed === 'number' && data.speed > 0 ? data.speed : 1.35,
    isMoving: Boolean(data.isMoving),
    walkFrame: typeof data.walkFrame === 'number' ? data.walkFrame : 0,
    facing: data.facing || 'down-left',
    isSitting: Boolean(data.isSitting),
    sittingSeat: data.sittingSeat,
    isFishing: Boolean(data.isFishing),
    heldItem: data.heldItem || null,
    activeEmote: data.activeEmote && now < data.activeEmote.expiresAt ? data.activeEmote : null,
    speechText: data.speechText,
    speechTimer: data.speechTimer,
    lastSeen: now,
    connectedAt: existing?.connectedAt || now,
  };

  onlinePlayersMap.set(data.id, player);
  savePresenceToFile();

  // Broadcast instantly to all other devices listening on SSE
  broadcastPresence({
    type: 'player_update',
    player,
    senderId: data.id,
    onlinePlayers: Array.from(onlinePlayersMap.values()),
  });

  // Return all other active online players from other devices/browsers + latest creator state version
  const others = Array.from(onlinePlayersMap.values()).filter((p) => p.id !== data.id);
  res.json({
    success: true,
    onlinePlayers: others,
    count: others.length + 1,
    creatorCityStateVersion: serverCreatorCityState?.version || 0,
    serverTime: now,
    mode: '24h-realtime-active',
  });
});

// Get list of online players
app.get('/api/presence/online', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  purgeInactivePlayers();
  res.json({
    success: true,
    onlinePlayers: Array.from(onlinePlayersMap.values()),
    count: onlinePlayersMap.size,
    serverUptime: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
    mode: '24h-realtime-active',
  });
});

// Interactive Radar endpoint with detailed positions & activities
app.get('/api/presence/radar', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  purgeInactivePlayers();
  const players = Array.from(onlinePlayersMap.values());
  res.json({
    success: true,
    onlineCount: players.length,
    onlinePlayers: players.map((p) => ({
      id: p.id,
      handle: p.handle,
      name: p.name,
      role: p.role,
      roleLabel: p.roleLabel,
      wx: p.wx,
      wy: p.wy,
      isMoving: p.isMoving,
      isSitting: p.isSitting,
      isFishing: p.isFishing,
      heldItem: p.heldItem,
      activeEmote: p.activeEmote,
      lastSeenAgoSec: Math.max(0, Math.floor((Date.now() - p.lastSeen) / 1000)),
    })),
    serverTime: Date.now(),
    uptimeSec: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
    status: '24h-mesh-online',
    brokers: [
      { name: 'EMQX Public Broker', protocol: 'WSS', port: 8084, status: 'online' },
      { name: 'HiveMQ Cloud Broker', protocol: 'WSS', port: 8884, status: 'online' },
      { name: 'Eclipse Mosquitto', protocol: 'WSS', port: 8081, status: 'online' },
    ],
  });
});

// Explicit player disconnect
app.post('/api/presence/leave', express.text({ type: '*/*' }), (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let id: string | undefined;
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      id = parsed?.id;
    } catch {
      id = undefined;
    }
  } else if (req.body && typeof req.body === 'object') {
    id = req.body.id;
  }
  if (id && onlinePlayersMap.has(id)) {
    onlinePlayersMap.delete(id);
    savePresenceToFile();
    broadcastPresence({
      type: 'leave',
      leftId: id,
      onlinePlayers: Array.from(onlinePlayersMap.values()),
    });
  }
  res.json({ success: true });
});

// ============================================================================
// BANK MATERI GURU & DISTRIBUSI AI KE SELURUH BANGUNAN REFLEKSIA CITY
// ============================================================================
const BANK_MATERI_FILE = path.join(__dirname, 'server_bank_materi.json');

interface ServerBankMateriEntry {
  id: string;
  materiId: string;
  objectiveId: string;
  teacherId: string;
  teacherName: string;
  mataPelajaran: string;
  kelasTarget: string;
  elemen: string;
  tujuanPembelajaran: string;
  materiEsensial: string;
  ringkasanAI: string;
  modulPerpustakaan: string;
  ilustrasiVisual?: {
    id: string;
    title: string;
    badge: string;
    caption: string;
    visualType: 'flow_diagram' | 'comparison_visual' | 'daily_tech_scene';
    steps: {
      stepLabel: string;
      icon: string;
      description: string;
    }[];
    takeaway: string;
  }[];
  implementasiSehariHari?: {
    id: string;
    title: string;
    icon: string;
    dailyProblem: string;
    conceptApplication: string;
    realBenefit: string;
  }[];
  pertanyaanRefleksi: string[];
  topikPodcastMentor: string;
  ringkasanMendalamPodcast?: string;
  studiKasusPodcast?: string;
  poinDiskusiPodcast?: string[];
  pertanyaanPemantikPodcast: string;
  daftarPemantikPodcast?: string[];
  misiBalaiKota: string;
  tantanganBangunanLain: {
    buildingId: string;
    buildingName: string;
    buildingIcon: string;
    activityTitle: string;
    materialSummary: string;
    challengePrompt: string;
  }[];
  kuisBengkel: {
    id: string;
    materiId: string;
    materiTitle?: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  createdAt: string;
  timestamp: number;
}

const DEFAULT_BANK_MATERI: ServerBankMateriEntry[] = [
  {
    id: 'bm-seed-001',
    materiId: 'materi-bm-001',
    objectiveId: 'tp-bm-001',
    teacherId: 'teacher-1',
    teacherName: 'Mohamad Rizki Bahsoan, S.Kom',
    mataPelajaran: 'Komputer Grafis & Publikasi',
    kelasTarget: 'X DKV 2 & X DKV 3',
    elemen: 'Prinsip Desain Grafis, Tipografi & Hierarki Visual Publikasi',
    tujuanPembelajaran:
      'Peserta didik mampu menerapkan prinsip keseimbangan, kontras, penekanan (emphasis), dan hierarki tipografi dalam merancang poster publikasi digital yang komunikatif.',
    materiEsensial:
      '1. Hierarki Visual mengatur urutan mata audiens membaca informasi (Judul Utama -> Subjudul -> Isi -> Call to Action).\n2. Kontras warna dan ukuran huruf membantu menonjolkan pesan kunci.\n3. White space (ruang kosong) menjaga desain tetap lega, rapi, dan mudah dipindai.\n4. Grid system menyatukan tata letak elemen grafis dan foto agar proporsional.',
    ringkasanAI:
      'Materi ini membekali siswa DKV dengan fondasi penyusunan tata letak visual menggunakan Hierarki Tipografi, Kontras Warna, Grid System, dan White Space agar karya publikasi memiliki pesan yang langsung tertangkap audiens dalam 3 detik pertama.',
    modulPerpustakaan:
      'BAB 1 — MENGAPA HIERARKI VISUAL PENTING DALAM DESAIN PUBLIKASI?\nKetika seseorang melihat poster atau konten media sosial, mata mereka hanya membutuhkan waktu kurang dari 3 detik untuk memutuskan apakah informasi tersebut menarik atau membingungkan. Hierarki visual adalah seni memandu pandangan mata pembaca dari elemen terpenting menuju detail pendukung.\n\nBAB 2 — 4 PILAR UTAMA KOMPOSISI GRAFIS\n1. Ukuran & Skala (Scale): Elemen yang lebih besar otomatis dipersepsikan lebih penting. Pastikan Headline memiliki ukuran paling dominan dibanding Body Text.\n2. Kontras Warna & Nilai Gelap-Terang: Gunakan kontras tinggi antara teks utama dan latar belakang agar keterbacaan (readability) tetap terjaga dari jarak jauh.\n3. Keseimbangan & Sistem Grid: Gunakan margin yang konsisten dan rata kiri/tengah yang jelas agar desain tidak terlihat berantakan.\n4. White Space (Ruang Negatif): Jangan memenuhi seluruh kanvas dengan teks atau ornamen. Ruang kosong memberi nafas bagi mata audiens.\n\nBAB 3 — RUMUS CEPAT EVALUASI KARYA (TES 3 DETIK)\nCoba jauhkan desainmu atau kecilkan ukurannya hingga 25%. Apakah judul utamanya masih terbaca jelas? Apa elemen pertama yang dilihat matamu? Jika mata langsung tertuju pada pesan inti, maka hierarki visualmu sudah berhasil!',
    pertanyaanRefleksi: [
      'Saat melihat sebuah poster atau desain publikasi, bagian mana dari prinsip hierarki visual (ukuran, kontras warna, atau ruang kosong) yang paling mudah kamu terapkan?',
      'Kendala apa yang paling sering kamu alami ketika menyusun banyak teks di dalam satu kanvas desain agar tidak terlihat penuh dan semrawut?',
      'Bagaimana langkah perbaikan yang akan kamu terapkan pada proyek poster DKV berikutnya setelah memahami konsep Grid System dan White Space?',
    ],
    topikPodcastMentor:
      'Strategi menyusun Hierarki Visual & Tipografi agar poster karya siswa DKV langsung menarik perhatian audiens dalam 3 detik pertama.',
    pertanyaanPemantikPodcast:
      'Jika kamu diminta mendesain ulang satu poster kegiatan sekolah yang penuh teks, elemen apa yang akan kamu perbesar pertama kali dan bagian mana yang akan kamu beri ruang kosong (white space)?',
    misiBalaiKota:
      'Misi Kota: Amati 1 desain poster/informasi di lingkungan sekolah atau kota, lalu identifikasi Headline utama, kontras warna, dan penggunaan White Space-nya!',
    tantanganBangunanLain: [
      {
        buildingId: 'perpustakaan',
        buildingName: 'Perpustakaan Kampus',
        buildingIcon: '📚',
        activityTitle: 'Modul Bacaan & Jurnal 4F: Hierarki Visual & Tipografi',
        materialSummary:
          'Pelajari 4 pilar komposisi grafis (Skala, Kontras, Grid, White Space) dan rumus evaluasi karya Tes 3 Detik, lalu catat kesimpulanmu di Jurnal 4F.',
        challengePrompt: 'Baca modul lengkap di Rak Buku Bank Materi lalu tulis Jurnal 4F (Facts, Feelings, Findings, Future).',
      },
      {
        buildingId: 'taman_refleksi',
        buildingName: 'Pusat Refleksi',
        buildingIcon: '🌿',
        activityTitle: 'Refleksi Mandiri: Evaluasi Tata Letak & Keterbacaan Desain',
        materialSummary:
          'Refleksikan pengalamanmu mengatur keseimbangan teks dan gambar dalam karya publikasi digital.',
        challengePrompt: 'Jawab 3 pertanyaan refleksi khusus dari Guru pada materi Komputer Grafis & Publikasi.',
      },
      {
        buildingId: 'menara_mentor',
        buildingName: 'Studio ON AIR',
        buildingIcon: '🎙️',
        activityTitle: 'Siaran Podcast AI Mentor: Bedah Karya Poster DKV',
        materialSummary:
          'Diskusikan bersama Host AI Mentor mengenai cara mengatasi kanvas desain yang terlalu penuh menggunakan prinsip White Space.',
        challengePrompt: 'Mulai sesi rekaman Podcast ON AIR dengan memilih topik Komputer Grafis & Publikasi.',
      },
      {
        buildingId: 'bengkel_latihan',
        buildingName: 'Lab DKV & Tefa',
        buildingIcon: '🛠️',
        activityTitle: 'Tantangan Kuis 5 Jenjang: Komputer Grafis & Publikasi',
        materialSummary:
          'Uji pemahamanmu dari Jenjang 1 (Dasar) hingga Jenjang 5 (Mahir) seputar Hierarki Visual, Tipografi, dan Grid System.',
        challengePrompt: 'Selesaikan 5 soal berjenjang untuk meraih bintang kompetensi dan XP tambahan.',
      },
      {
        buildingId: 'balai_kota',
        buildingName: 'Balai Kota',
        buildingIcon: '🏛️',
        activityTitle: 'Misi Utama Warga: Audit Visual Poster Kota',
        materialSummary:
          'Panduan capaian pembelajaran & misi kolaboratif merancang publikasi visual yang informatif bagi warga Kota Refleksia.',
        challengePrompt: 'Cek target capaian pembelajaran di papan informasi Balai Kota.',
      },
      {
        buildingId: 'kantor_pos',
        buildingName: 'Kantor Pos',
        buildingIcon: '📮',
        activityTitle: 'Konsultasi Karya ke Guru Pengampu',
        materialSummary:
          'Kirimkan pertanyaan atau minta masukan langsung kepada Bapak Mohamad Rizki Bahsoan, S.Kom terkait draf desain publikasimu.',
        challengePrompt: 'Tulis surat konsultasi desain melalui Kantor Pos.',
      },
      {
        buildingId: 'monumen_warga',
        buildingName: 'Monumen Warga',
        buildingIcon: '🗿',
        activityTitle: 'Diskusi Publik: Warna & Font Favorit Desainer DKV',
        materialSummary:
          'Bagikan tips kombinasi font (Font Pairing) atau palet warna andalanmu di papan obrolan Monumen Warga.',
        challengePrompt: 'Berdiskusi santun dengan teman sekelas di ruang obrolan Monumen Warga.',
      },
      {
        buildingId: 'pasar_prestasi',
        buildingName: 'Pasar Prestasi',
        buildingIcon: '🏆',
        activityTitle: 'Apresiasi Kompetensi Desainer Publikasi',
        materialSummary:
          'Kumpulkan XP dari membaca modul, refleksi, podcast, dan kuis Bank Materi untuk menaikkan peringkatmu di Pasar Prestasi.',
        challengePrompt: 'Pantau lencana dan papan peringkat warga teraktif.',
      },
      {
        buildingId: 'masjid',
        buildingName: 'Masjid Al-Hikmah',
        buildingIcon: '🕌',
        activityTitle: 'Adab & Etika Komunikasi Visual yang Jujur dan Santun',
        materialSummary:
          'Setiap karya desain publikasi harus menyampaikan informasi yang benar, jujur, bermanfaat, dan menjauhi unsur hoaks.',
        challengePrompt: 'Renungkan nilai kejujuran dan kebermanfaatan karya bagi sesama.',
      },
    ],
    kuisBengkel: [
      {
        id: 'q-bm-001-1',
        materiId: 'materi-bm-001',
        materiTitle: 'Komputer Grafis & Publikasi: Prinsip Desain & Hierarki Visual',
        question:
          '[Jenjang 1 - Dasar] Apa fungsi utama dari penerapan Hierarki Visual dalam sebuah desain poster publikasi?',
        options: [
          'Memandu urutan pandangan mata audiens dari informasi paling penting ke informasi pendukung',
          'Membuat seluruh teks memiliki ukuran yang sama rata di seluruh kanvas',
          'Mengisi seluruh ruang kosong dengan ornamen dekoratif sebanyak mungkin',
          'Menggunakan lebih dari sepuluh jenis font berbeda dalam satu halaman',
        ],
        correctIndex: 0,
        explanation:
          'Hierarki visual berfungsi memandu mata pembaca agar langsung menangkap pesan utama (Headline) sebelum membaca detail pendukung.',
      },
      {
        id: 'q-bm-001-2',
        materiId: 'materi-bm-001',
        materiTitle: 'Komputer Grafis & Publikasi: Prinsip Desain & Hierarki Visual',
        question:
          '[Jenjang 2 - Pemahaman] Mengapa keberadaan White Space (ruang kosong/negatif) sangat penting dalam tata letak publikasi?',
        options: [
          'Agar perancang tidak perlu memikirkan isi informasi poster',
          'Memberi ruang bernafas bagi mata audiens sehingga desain tampak rapi dan mudah dibaca',
          'Menurunkan kontras warna antara judul dan latar belakang',
          'Menghilangkan kebutuhan akan sistem grid dan margin',
        ],
        correctIndex: 1,
        explanation:
          'White space menjaga fokus visual dan mencegah kelelahan mata saat audiens memindai informasi.',
      },
      {
        id: 'q-bm-001-3',
        materiId: 'materi-bm-001',
        materiTitle: 'Komputer Grafis & Publikasi: Prinsip Desain & Hierarki Visual',
        question:
          '[Jenjang 3 - Penerapan] Seorang siswa DKV membuat poster dengan latar biru tua gelap. Warna teks judul apa yang paling tepat dipilih untuk menghasilkan kontras keterbacaan (readability) tertinggi?',
        options: [
          'Ungu tua atau hitam pekat',
          'Abu-abu gelap dengan transparansi rendah',
          'Putih bersih atau kuning cerah',
          'Biru dongker dengan ukuran font kecil',
        ],
        correctIndex: 2,
        explanation:
          'Pada latar belakang gelap (biru tua), teks berwarna terang seperti putih atau kuning cerah menciptakan kontras nilai (value contrast) yang tinggi sehingga mudah terbaca.',
      },
      {
        id: 'q-bm-001-4',
        materiId: 'materi-bm-001',
        materiTitle: 'Komputer Grafis & Publikasi: Prinsip Desain & Hierarki Visual',
        question:
          '[Jenjang 4 - Analisis] Saat dilakukan "Tes 3 Detik", audiens justru lebih dulu melihat dekorasi bunga di sudut poster daripada judul acara. Langkah perbaikan apa yang paling tepat?',
        options: [
          'Memperbesar ukuran dekorasi bunga agar menutupi setengah kanvas',
          'Memperbesar ukuran & ketebalan font judul utama serta mengecilkan/meredupkan elemen dekorasi',
          'Menghapus judul acara dari poster',
          'Mengubah jenis huruf judul menjadi huruf sambung (script) yang rumit dan tipis',
        ],
        correctIndex: 1,
        explanation:
          'Penekanan (Emphasis) harus diberikan pada judul utama melalui skala, ketebalan font, dan kontras, sementara elemen dekoratif tidak boleh mendominasi pesan inti.',
      },
      {
        id: 'q-bm-001-5',
        materiId: 'materi-bm-001',
        materiTitle: 'Komputer Grafis & Publikasi: Prinsip Desain & Hierarki Visual',
        question:
          '[Jenjang 5 - Evaluasi & Kreasi] Dalam merancang katalog produk Teaching Factory DKV yang memuat foto, judul produk, spesifikasi, dan harga, sistem tata letak apa yang paling efektif menjaga konsistensi antarhalaman?',
        options: [
          'Menempatkan foto dan teks secara acak di setiap halaman tanpa garis bantu',
          'Menerapkan Modular Grid System dengan gaya tipografi (Heading, Subheading, Body) yang konsisten',
          'Mengganti warna latar dan jenis font di setiap baris kalimat',
          'Menyatukan seluruh teks spesifikasi tanpa paragraf maupun jarak antarbaris (leading)',
        ],
        correctIndex: 1,
        explanation:
          'Modular Grid System dikombinasikan dengan aturan tipografi yang konsisten memastikan katalog multi-halaman terlihat profesional, terstruktur, dan nyaman dibaca.',
      },
    ],
    createdAt: '3 November 2026',
    timestamp: Date.now(),
  },
];

function loadServerBankMateri(): ServerBankMateriEntry[] {
  try {
    if (fs.existsSync(BANK_MATERI_FILE)) {
      const raw = fs.readFileSync(BANK_MATERI_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading server_bank_materi.json:', e);
  }
  return [...DEFAULT_BANK_MATERI];
}

function saveServerBankMateri(list: ServerBankMateriEntry[]) {
  try {
    fs.writeFileSync(BANK_MATERI_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed saving server_bank_materi.json:', e);
  }
}

let serverBankMateriList: ServerBankMateriEntry[] = loadServerBankMateri();

app.get('/api/bank-materi', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    success: true,
    data: serverBankMateriList,
  });
});

const DEFAULT_GAS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbwzHhVYKBfznA_k4dZlB1eGFevpeLoJDiSUbLKXJACQPgsKFxi0HfbNNbjUZBWa7finfw/exec';

app.post('/api/bank-materi', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const entry = req.body as ServerBankMateriEntry;
  if (!entry || !entry.id || !entry.mataPelajaran) {
    return res.status(400).json({
      success: false,
      error: 'Data Bank Materi tidak lengkap.',
    });
  }

  const existingIdx = serverBankMateriList.findIndex((item) => item.id === entry.id);
  if (existingIdx >= 0) {
    serverBankMateriList[existingIdx] = entry;
  } else {
    serverBankMateriList.unshift(entry);
  }
  saveServerBankMateri(serverBankMateriList);

  // Forward to Google Spreadsheet via GAS Web App in background so server also guarantees persistence
  fetch(DEFAULT_GAS_WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'save_bank_materi',
      timestamp: new Date().toISOString(),
      bankMateri: entry,
    }),
  }).catch(() => {});

  res.json({
    success: true,
    data: entry,
    all: serverBankMateriList,
  });
});

app.delete('/api/bank-materi/:id', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.params;
  serverBankMateriList = serverBankMateriList.filter((item) => item.id !== id);
  saveServerBankMateri(serverBankMateriList);

  fetch(DEFAULT_GAS_WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'delete_bank_materi',
      timestamp: new Date().toISOString(),
      id,
    }),
  }).catch(() => {});

  res.json({
    success: true,
    deletedId: id,
    all: serverBankMateriList,
  });
});

app.post('/api/bank-materi/generate-ai', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const {
    teacherName = 'Guru Pengampu',
    mataPelajaran = 'Dasar-Dasar Desain Komunikasi Visual',
    kelasTarget = 'X DKV 2 & X DKV 3',
    elemen = 'Pemahaman Konsep & Praktik Kejuruan',
    tujuanPembelajaran = 'Peserta didik mampu memahami dan menerapkan konsep inti materi dalam proyek nyata.',
    materiEsensial = 'Konsep dasar, langkah kerja, dan penerapan nyata dalam proyek pembelajaran.',
  } = req.body || {};

  const buildFallbackDistribution = () => {
    const rawEss = String(materiEsensial || '').trim();
    const cleanTp = String(tujuanPembelajaran || '').trim();
    const cleanEl = String(elemen || '').trim();
    const cleanMapel = String(mataPelajaran || '').trim();

    const expandedMateriEsensial =
      rawEss.length >= 160
        ? rawEss
        : `${rawEss ? rawEss + '\n\n' : ''}Pengembangan Materi Esensial berdasarkan Tujuan Pembelajaran (${cleanTp}):\n1. Konsep Dasar & Definisi Inti ${cleanEl}: Memahami prinsip kerja, fungsi utama, dan komponen kunci pada mata pelajaran ${cleanMapel}.\n2. Mekanisme & Alur Pemecahan Masalah: Menyusun tahapan sistematis (Analisis Kebutuhan -> Perancangan Solusi -> Implementasi Teknis -> Pengujian/Evaluasi).\n3. Penerapan Teknologi dalam Kehidupan Sehari-hari: Menghubungkan konsep ${cleanEl} untuk menyelesaikan kendala teknologi harian seperti efisiensi informasi digital, otomasi tugas harian, serta kejelasan komunikasi visual.\n4. Evaluasi Kualitas & Mitigasi Kesalahan: Mengidentifikasi penyebab kegagalan teknis di lapangan dan memilih solusi paling efektif berbasis data.`;

    return {
      materiEsensialDikembangkan: expandedMateriEsensial,
      ringkasanAI: `Materi "${cleanEl}" pada mata pelajaran ${cleanMapel} (${kelasTarget}) yang dikembangkan dari Tujuan Pembelajaran "${cleanTp}" membekali siswa dengan penguasaan konsep esensial, ilustrasi visual cara kerja sistem, serta penerapan nyata dalam memecahkan masalah teknologi di kehidupan sehari-hari.`,
      modulPerpustakaan: `BAB 1 — PENGANTAR KONSEP & TUJUAN PEMBELAJARAN: ${cleanEl.toUpperCase()}\nMata Pelajaran: ${cleanMapel} (${kelasTarget})\nGuru Pengampu: ${teacherName}\n\nTujuan Pembelajaran Utama:\n"${cleanTp}"\n\nMengapa materi "${cleanEl}" sangat penting? Dalam kehidupan modern yang serba digital, hampir seluruh aktivitas harian kita—mulai dari berkomunikasi lewat smartphone, bertransaksi digital, mencari rute perjalanan, hingga mengelola informasi sekolah—bergantung pada cara kerja teknologi yang terstruktur. Bab ini mengantarkan kita memahami bagaimana konsep ${cleanEl} menjadi pondasi utama dalam menyelesaikan berbagai persoalan nyata secara efektif.\n\nBAB 2 — PENGEMBANGAN MENDALAM MATERI ESENSIAL\n${expandedMateriEsensial}\n\nPrinsip Utama yang Wajib Dikuasai:\n• Pemetaan Masalah (Problem Identification): Membedakan gejala permukaan dengan akar masalah teknis yang sebenarnya.\n• Penyusunan Solusi Terstruktur: Menggunakan kaidah ${cleanEl} agar langkah penyelesaian tidak dilakukan secara coba-coba (trial and error).\n• Optimasi & Efisiensi: Memastikan solusi yang dirancang hemat waktu, mudah digunakan oleh masyarakat, dan minim risiko kesalahan.\n\nBAB 3 — ILUSTRASI VISUAL & SKEMA KERJA SISTEM\nUntuk memahami cara kerja "${cleanEl}" secara utuh, perhatikan skema alur visual Input -> Proses Transformasi Konsep -> Output Solusi Nyata pada kartu Infografis Interaktif di bawah modul ini:\n1. Tahap Input (Situasi Harian): Mengumpulkan data, kebutuhan pengguna, dan kendala teknologi yang dihadapi sehari-hari.\n2. Tahap Proses (Penerapan ${cleanEl}): Mengolah data menggunakan aturan, struktur, dan langkah sistematis sesuai materi esensial.\n3. Tahap Output (Dampak Nyata): Menghasilkan solusi teknologi/visual yang cepat, akurat, aman, dan langsung mempermudah aktivitas warga.\n\nBAB 4 — IMPLEMENTASI MATERI DALAM KEHIDUPAN SEHARI-HARI\nBagaimana konsep "${cleanEl}" bekerja di sekitar kita setiap hari?\n• Kasus 1 (Efisiensi Aplikasi & Layanan Harian): Saat memesan makanan/transportasi atau mengisi daftar hadir digital, konsep ${cleanEl} memastikan data tersusun rapi dan proses berjalan dalam hitungan detik.\n• Kasus 2 (Pemecahan Masalah Perangkat & Informasi Digital): Ketika koneksi lambat, memori ponsel penuh, atau informasi publik membingungkan, kita menggunakan prinsip analisis pada ${cleanEl} untuk mengurai masalah dan mengambil keputusan tepat.\n• Kasus 3 (Inovasi Lingkungan Sekolah & Masyarakat): Siswa SMK dapat merancang sistem informasi, panduan visual, atau alur otomatisasi sederhana berbasis ${cleanEl} yang langsung membantu warga sekolah.`,
      ilustrasiVisual: [
        {
          id: `vis-${Date.now()}-1`,
          title: `Diagram Alur Cara Kerja: ${cleanEl} dalam Kehidupan Sehari-hari`,
          badge: 'Infografis Interaktif #1',
          caption: `Visualisasi tahapan sistematis bagaimana konsep "${cleanEl}" mengubah masalah teknologi harian menjadi solusi yang terukur.`,
          visualType: 'flow_diagram' as const,
          steps: [
            {
              stepLabel: '1. Identifikasi Masalah Harian (Input)',
              icon: '🔍',
              description: `Mengamati kendala teknologi yang dialami pengguna sehari-hari terkait ${cleanEl} dan mengumpulkan informasi kunci yang relevan.`,
            },
            {
              stepLabel: '2. Pemrosesan Konsep Esensial (Process)',
              icon: '⚙️',
              description: `Menerapkan prinsip inti "${cleanTp.slice(0, 90)}" untuk menyusun langkah penyelesaian yang logis, rapi, dan efisien.`,
            },
            {
              stepLabel: '3. Solusi Teknologi Teruji (Output)',
              icon: '🚀',
              description: `Menghasilkan solusi siap pakai yang menghemat waktu, mencegah kesalahan teknis, dan mudah dipahami oleh pengguna.`,
            },
          ],
          takeaway: `Pemahaman "${cleanEl}" bukan sekadar hafalan teori, melainkan kerangka kerja visual untuk menyelesaikan masalah teknologi setiap hari.`,
        },
        {
          id: `vis-${Date.now()}-2`,
          title: `Perbandingan Visual: Tanpa Konsep vs. Dengan Penerapan ${cleanEl}`,
          badge: 'Infografis Interaktif #2',
          caption: `Ilustrasi kontras antara penanganan masalah teknologi secara acak dibandingkan dengan penerapan "${cleanEl}".`,
          visualType: 'comparison_visual' as const,
          steps: [
            {
              stepLabel: 'Kondisi Awal: Penanganan Acak & Tidak Terstruktur',
              icon: '⚠️',
              description: `Pengguna kebingungan saat menghadapi masalah teknologi harian karena informasi berantakan dan langkah kerja tidak berurutan.`,
            },
            {
              stepLabel: 'Transformasi: Integrasi Materi Esensial',
              icon: '📐',
              description: `Konsep ${cleanEl} diterapkan untuk memilah prioritas, menata alur kerja, dan memvalidasi setiap tahapan secara sistematis.`,
            },
            {
              stepLabel: 'Hasil Akhir: Sistem Efisien & Tepat Sasaran',
              icon: '✅',
              description: `Masalah terselesaikan lebih cepat, risiko kesalahan turun drastis, dan hasil kerja memenuhi capaian Tujuan Pembelajaran.`,
            },
          ],
          takeaway: `Dengan menerapkan ${cleanEl}, setiap kendala teknologi sehari-hari dapat dianalisis dan diselesaikan secara akurat.`,
        },
      ],
      implementasiSehariHari: [
        {
          id: `imp-${Date.now()}-1`,
          title: `Optimasi Penggunaan Aplikasi & Perangkat Digital Harian`,
          icon: '📱',
          dailyProblem: `Dalam aktivitas sehari-hari, banyak pengguna mengalami kendala aplikasi lambat, data berantakan, atau salah langkah saat menggunakan layanan teknologi.`,
          conceptApplication: `Menerapkan prinsip "${cleanEl}" (${cleanTp.slice(0, 100)}) untuk mengorganisir data, menyusun urutan langkah yang benar, dan menyaring informasi penting.`,
          realBenefit: `Aktivitas digital harian (belajar, transaksi, komunikasi) berjalan jauh lebih cepat, hemat kuota/memori, dan bebas dari kesalahan pengoperasian.`,
        },
        {
          id: `imp-${Date.now()}-2`,
          title: `Penyelesaian Masalah Sistem Layanan di Lingkungan Sekolah`,
          icon: '🏫',
          dailyProblem: `Antrean layanan perpustakaan, absensi pagi, atau pengumpulan tugas digital sering tersendat karena alur informasi yang tidak terstruktur.`,
          conceptApplication: `Menggunakan konsep materi esensial "${cleanEl}" untuk memetakan ulang alur layanan menjadi tahapan sederhana yang mudah diikuti seluruh siswa.`,
          realBenefit: `Mengurangi waktu tunggu siswa secara signifikan dan meningkatkan ketertiban serta akurasi data di sekolah.`,
        },
        {
          id: `imp-${Date.now()}-3`,
          title: `Keamanan Informasi & Pengambilan Keputusan di Media Digital`,
          icon: '🛡️',
          dailyProblem: `Masyarakat sering terjebak informasi palsu, tautan berbahaya, atau kebingungan saat membaca panduan teknis perangkat baru.`,
          conceptApplication: `Melakukan evaluasi kritis dan verifikasi bertahap berbasis "${cleanEl}" sebelum mengambil keputusan atau membagikan informasi digital.`,
          realBenefit: `Melindungi keamanan akun pribadi serta membantu keluarga dan warga sekitar menggunakan teknologi secara cerdas dan aman.`,
        },
      ],
      pertanyaanRefleksi: [
        `Dari pengembangan materi "${cleanEl}" (${cleanMapel}) dan contoh penerapannya dalam kehidupan sehari-hari, konsep mana yang paling membuka wawasan barumu hari ini?`,
        `Masalah teknologi sehari-hari apa yang pernah kamu alami sendiri dan ternyata bisa diselesaikan menggunakan prinsip Tujuan Pembelajaran: "${cleanTp}"?`,
        `Bagaimana rencana konkretmu untuk menerapkan konsep "${cleanEl}" dalam aktivitas harian atau tugas proyek berikutnya?`,
      ],
      topikPodcastMentor: `Kupas Tuntas ${cleanMapel}: Implementasi Nyata "${cleanEl}" dalam Memecahkan Masalah Teknologi Sehari-hari`,
      ringkasanMendalamPodcast: `Episode spesial Studio ON AIR bersama ${teacherName} ini mengupas secara mendalam bagaimana elemen "${cleanEl}" pada mata pelajaran ${cleanMapel} diturunkan langsung dari Tujuan Pembelajaran: "${cleanTp}". Kita tidak hanya membahas definisi konsep, tetapi membedah bagaimana konsep esensial ini bekerja di balik teknologi yang kita gunakan setiap hari—mulai dari bangun tidur hingga beraktivitas di sekolah dan masyarakat. Siswa diajak berpikir kritis menganalisis masalah teknologi di sekitar mereka dan merumuskan solusi praktis berbasis materi esensial.`,
      studiKasusPodcast: `Studi Kasus Siaran ON AIR: Di lingkungan tempat tinggal dan sekolah kita, banyak warga atau teman siswa yang sering mengalami kendala saat menggunakan sistem teknologi harian (misalnya sistem antrean digital yang membingungkan, pengelolaan file tugas yang berantakan hingga hilang, atau penyebaran informasi digital yang kurang efektif). Dengan menerapkan prinsip "${cleanEl}" secara sistematis mulai dari identifikasi masalah, pemetaan komponen penting, hingga perancangan solusi yang ramah pengguna, masalah tersebut berhasil diatasi dengan hasil yang terukur!`,
      poinDiskusiPodcast: [
        `1. Bedah Konsep Inti: Apa hubungan langsung antara Tujuan Pembelajaran "${cleanTp}" dengan materi esensial "${cleanEl}"?`,
        `2. Fenomena Sehari-hari: Mengapa masalah teknologi di sekitar kita sering gagal diselesaikan jika kita mengabaikan prinsip dasar "${cleanEl}"?`,
        `3. Studi Kasus Lapangan: Membedah contoh nyata penerapan "${cleanEl}" pada aplikasi smartphone, sistem sekolah, dan kehidupan warga.`,
        `4. Langkah Aksi Siswa: Tips praktis menerapkan materi ini secara langsung mulai hari ini.`,
      ],
      pertanyaanPemantikPodcast: `Coba amati satu masalah teknologi yang paling sering kamu atau keluargamu temui dalam kehidupan sehari-hari. Bagaimana kamu akan menggunakan konsep "${cleanEl}" untuk menganalisis penyebabnya dan merancang solusi yang paling efektif?`,
      daftarPemantikPodcast: [
        `Coba amati satu masalah teknologi yang paling sering kamu atau keluargamu temui dalam kehidupan sehari-hari. Bagaimana kamu akan menggunakan konsep "${cleanEl}" untuk menganalisis penyebabnya dan merancang solusi yang paling efektif?`,
        `Jika sebuah aplikasi atau sistem digital di sekolah tiba-tiba membingungkan penggunanya, indikator apa dari materi "${cleanEl}" yang pertama kali akan kamu evaluasi?`,
        `Menurut pendapatmu, apa dampak nyata yang dirasakan masyarakat jika seorang perancang teknologi menerapkan "${cleanEl}" dengan baik dibandingkan yang mengabaikannya?`,
      ],
      misiBalaiKota: `Misi Kota (${cleanMapel}): Pelajari modul berilustrasi "${cleanEl}" di Perpustakaan, bedah studi kasusnya di Studio ON AIR, dan pecahkan soal HOTS teknologi sehari-hari di Lab DKV & Menara Asesmen!`,
      tantanganBangunanLain: [
        {
          buildingId: 'perpustakaan',
          buildingName: 'Perpustakaan Kampus',
          buildingIcon: '📚',
          activityTitle: `Modul Visual & Implementasi Sehari-hari: ${cleanEl}`,
          materialSummary: `Pelajari 4 Bab lengkap "${cleanEl}" beserta Diagram Infografis Interaktif dan 3 kartu Implementasi Masalah Teknologi Kehidupan Sehari-hari.`,
          challengePrompt: `Baca modul berilustrasi "${cleanEl}" di Rak Buku Perpustakaan dan tulis Jurnal Pemahaman (+XP).`,
        },
        {
          buildingId: 'taman_refleksi',
          buildingName: 'Pusat Refleksi',
          buildingIcon: '🌿',
          activityTitle: `Refleksi Kontekstual: ${cleanEl}`,
          materialSummary: `Refleksikan keterkaitan Tujuan Pembelajaran "${cleanTp}" dengan pengalaman menggunakan teknologi sehari-hari.`,
          challengePrompt: `Pilih materi "${cleanMapel}: ${cleanEl}" di Pusat Refleksi lalu jawab 3 pertanyaan refleksi mendalam.`,
        },
        {
          buildingId: 'menara_mentor',
          buildingName: 'Studio ON AIR',
          buildingIcon: '🎙️',
          activityTitle: `Siaran Podcast & Bedah Kasus Teknologi: ${cleanEl}`,
          materialSummary: `Pelajari Ringkasan Mendalam, Studi Kasus Teknologi Sehari-hari, dan Poin Diskusi "${cleanEl}" lalu siarkan bersama Host AI Mentor.`,
          challengePrompt: `Mulai siaran Podcast ON AIR membahas studi kasus "${cleanEl}" dalam kehidupan sehari-hari.`,
        },
        {
          buildingId: 'bengkel_latihan',
          buildingName: 'Lab DKV & Tefa',
          buildingIcon: '🛠️',
          activityTitle: `Kuis 5 Jenjang Penerapan Teknologi Harian: ${cleanEl}`,
          materialSummary: `Uji kemampuan memecahkan masalah teknologi sehari-hari menggunakan konsep "${cleanEl}" dari Jenjang 1 (Dasar) hingga Jenjang 5 (Mahir).`,
          challengePrompt: `Kerjakan 5 soal studi kasus sehari-hari "${cleanMapel} - ${cleanEl}" di Lab DKV & Tefa.`,
        },
        {
          buildingId: 'balai_kota',
          buildingName: 'Balai Kota',
          buildingIcon: '🏛️',
          activityTitle: `Papan Misi & Capaian Pembelajaran: ${cleanMapel}`,
          materialSummary: `Target Capaian (${kelasTarget}): ${cleanTp}`,
          challengePrompt: `Cek progres penyelesaian misi materi "${cleanEl}" di Balai Kota.`,
        },
        {
          buildingId: 'kantor_pos',
          buildingName: 'Kantor Pos',
          buildingIcon: '📮',
          activityTitle: `Kotak Konsultasi Guru: ${teacherName}`,
          materialSummary: `Konsultasikan ide penerapan "${cleanEl}" untuk masalah teknologi sehari-hari kepada ${teacherName}.`,
          challengePrompt: `Kirim pesan konsultasi materi "${cleanEl}" melalui Kantor Pos.`,
        },
        {
          buildingId: 'monumen_warga',
          buildingName: 'Monumen Warga',
          buildingIcon: '🗿',
          activityTitle: `Diskusi Warga: Solusi Teknologi Harian ${cleanEl}`,
          materialSummary: `Diskusikan contoh penerapan "${cleanEl}" di kehidupan sehari-hari bersama teman sekelas di Monumen Warga.`,
          challengePrompt: `Bagikan 1 contoh penerapan nyata "${cleanEl}" di Monumen Warga.`,
        },
        {
          buildingId: 'pasar_prestasi',
          buildingName: 'Pasar Prestasi',
          buildingIcon: '🏆',
          activityTitle: `Penghargaan Pemecah Masalah ${cleanMapel}`,
          materialSummary: `Setiap aktivitas belajar pada materi "${cleanEl}" menambah skor keaktifan dan XP warga di Pasar Prestasi.`,
          challengePrompt: `Kumpulkan XP dari misi Bank Materi untuk masuk Top 5 Warga Berprestasi.`,
        },
        {
          buildingId: 'masjid',
          buildingName: 'Masjid Al-Hikmah',
          buildingIcon: '🕌',
          activityTitle: `Etika & Kebermanfaatan Teknologi: ${cleanMapel}`,
          materialSummary: `Gunakan ilmu "${cleanEl}" untuk menghadirkan solusi teknologi yang jujur, aman, dan bermanfaat bagi masyarakat.`,
          challengePrompt: `Jaga adab menuntut ilmu dan pemanfaatan teknologi yang positif di Kota Refleksia.`,
        },
      ],
      kuisBengkel: [
        {
          question: `[Jenjang 1 - Dasar] Dalam kehidupan sehari-hari, seorang siswa sering mengalami kebingungan saat mengelola data dan informasi digital di perangkatnya karena tidak terstruktur. Berdasarkan materi "${cleanEl}" (${cleanMapel}), langkah dasar apa yang harus dilakukan sesuai Tujuan Pembelajaran?`,
          options: [
            `Mengidentifikasi kebutuhan utama lalu menerapkan prinsip dasar "${cleanEl}" (${cleanTp.slice(0, 85)}) secara teratur`,
            'Menyimpan seluruh file dan informasi secara acak tanpa kategori maupun aturan yang jelas',
            'Menghapus seluruh aplikasi penting tanpa memeriksa fungsi dan kegunaannya terlebih dahulu',
            'Membiarkan masalah berlarut-larut tanpa mencari tahu penyebab utamanya',
          ],
          correctIndex: 0,
          explanation: `Sesuai Tujuan Pembelajaran (${cleanTp}), langkah dasar pemecahan masalah teknologi harian dimulai dari identifikasi kebutuhan dan penerapan konsep "${cleanEl}" secara terstruktur.`,
        },
        {
          question: `[Jenjang 2 - Pemahaman] Mengapa pemahaman terhadap Materi Esensial "${cleanEl}" sangat membantu masyarakat saat menghadapi kendala penggunaan aplikasi atau layanan teknologi sehari-hari?`,
          options: [
            'Karena membuat perangkat elektronik tidak membutuhkan daya listrik sama sekali',
            `Karena memberikan kerangka berpikir sistematis untuk memahami cara kerja sistem dan menemukan letak kesalahan dengan cepat`,
            'Karena menghilangkan kebutuhan untuk membaca petunjuk keamanan digital',
            'Karena semua masalah teknologi dapat selesai sendiri tanpa tindakan pengguna',
          ],
          correctIndex: 1,
          explanation: `Materi esensial "${cleanEl}" membekali pengguna dengan pemahaman alur sistem sehingga saat terjadi kendala teknologi harian, penyebabnya dapat dipetakan secara logis.`,
        },
        {
          question: `[Jenjang 3 - Penerapan] Keluarga di rumah mengeluhkan proses pencarian dokumen digital dan pengaturan jadwal kegiatan di ponsel yang selalu memakan waktu lama hingga sering terlambat. Bagaimana cara menerapkan konsep "${cleanEl}" untuk menyelesaikan masalah tersebut?`,
          options: [
            'Membeli ponsel baru setiap minggu meskipun cara penggunaannya tetap berantakan',
            `Menyusun struktur pengelompokan yang jelas, menetapkan prioritas informasi, dan menerapkan alur kerja "${cleanEl}" yang konsisten`,
            'Menggabungkan seluruh dokumen pribadi dan jadwal ke dalam satu catatan panjang tanpa judul',
            'Menonaktifkan seluruh fitur pengingat dan pencarian pada perangkat ponsel',
          ],
          correctIndex: 1,
          explanation: `Penerapan "${cleanEl}" dalam kehidupan sehari-hari dilakukan dengan menata struktur informasi dan alur kerja secara konsisten sehingga waktu pencarian menjadi jauh lebih singkat.`,
        },
        {
          question: `[Jenjang 4 - Analisis] Sebuah sistem pendaftaran kegiatan siswa secara online mengalami kemacetan karena 65% pengguna salah mengisi kolom data penting. Jika dianalisis menggunakan konsep "${cleanEl}", akar masalah dan solusi perbaikan yang paling tepat adalah...`,
          options: [
            'Menyalahkan seluruh pengguna dan menutup pendaftaran tanpa memperbaiki sistem',
            'Alur informasi dan validasi input belum menerapkan prinsip materi esensial; solusinya adalah menyederhanakan tahapan dan memperjelas petunjuk pada titik krusial',
            'Menambah jumlah kolom isian menjadi tiga kali lipat tanpa memberi keterangan',
            'Menghapus fitur penyimpanan otomatis sehingga siswa harus mengetik ulang dari awal',
          ],
          correctIndex: 1,
          explanation: `Analisis berbasis "${cleanEl}" menunjukkan bahwa tingginya kesalahan pengguna disebabkan oleh alur sistem yang belum ramah pengguna; perbaikannya fokus pada penyederhanaan tahapan dan kejelasan panduan.`,
        },
        {
          question: `[Jenjang 5 - Evaluasi & Kreasi] Kamu diminta merancang solusi teknologi sederhana berbasis "${cleanEl}" untuk mengatasi masalah antrean panjang dan kesalahan pesanan di kantin sekolah pada jam istirahat. Rancangan solusi manakah yang paling efektif, realistis, dan memenuhi indikator Tujuan Pembelajaran?`,
          options: [
            'Meminta siswa berteriak bersamaan di depan kasir tanpa catatan pesanan',
            `Merancang sistem pemesanan/katalog terstruktur berbasis "${cleanEl}" yang memisahkan kategori menu, menampilkan rincian biaya otomatis, dan mengurutkan antrean secara transparan`,
            'Membuat aturan yang melarang siswa membeli makanan selama jam istirahat berlangsung',
            'Menggunakan formulir kertas tanpa nomor urut yang dikumpulkan secara acak di meja kasir',
          ],
          correctIndex: 1,
          explanation: `Pada level Evaluasi & Kreasi (HOTS), solusi terbaik mengintegrasikan konsep "${cleanEl}" untuk menciptakan sistem yang terstruktur, transparan, dan langsung menyelesaikan masalah nyata di lingkungan sekolah.`,
        },
      ],
    };
  };

  if (!ai) {
    return res.json({
      success: true,
      source: 'fallback',
      data: buildFallbackDistribution(),
    });
  }

  try {
    const prompt = `Anda adalah Arsitek Kurikulum AI Kota Refleksia untuk SMK Jurusan Desain Komunikasi Visual (DKV) & Informatika.
Seorang Guru menginput data Bank Materi berikut:
- Nama Guru: ${teacherName}
- Mata Pelajaran: ${mataPelajaran}
- Kelas Target: ${kelasTarget}
- Elemen Kurikulum: ${elemen}
- Tujuan Pembelajaran (TP): ${tujuanPembelajaran}
- Materi Esensial Awal: ${materiEsensial}

TUGAS UTAMA ANDA (OPTIMASI AI BANK MATERI):
Kembangkan secara mendalam Materi Esensial dan Tujuan Pembelajaran tersebut menjadi paket materi komprehensif untuk 4 gedung utama:
1. "materiEsensialDikembangkan": Pengembangan lengkap dan terstruktur dari Materi Esensial agar selaras penuh dengan Tujuan Pembelajaran (minimal 4 poin konsep utama beserta penjelasannya).
2. "ringkasanAI": Ringkasan eksekutif materi (2-3 kalimat padat, jelas, dan kontekstual).
3. GEDUNG 1 — PERPUSTAKAAN KAMPUS:
   - "modulPerpustakaan": Modul bacaan sangat lengkap (4 BAB: BAB 1 Pengantar & Konteks Tujuan Pembelajaran, BAB 2 Kupas Tuntas Materi Esensial, BAB 3 Penjelasan Visual & Skema Cara Kerja Konsep, BAB 4 Implementasi Nyata Materi dalam Memecahkan Masalah Teknologi Kehidupan Sehari-hari).
   - "ilustrasiVisual": Array berisi tepat 2 objek diagram infografis interaktif & ilustrasi visual kontekstual untuk mendampingi modul di Perpustakaan Kampus. Setiap objek memiliki id, title, badge, caption, visualType ("flow_diagram" atau "comparison_visual" atau "daily_tech_scene"), steps (array 3 langkah berisi stepLabel, icon emoji, dan description), serta takeaway.
   - "implementasiSehariHari": Array berisi tepat 3 contoh nyata implementasi materi dalam menyelesaikan masalah teknologi di kehidupan sehari-hari. Setiap objek memiliki id, title, icon (emoji), dailyProblem (masalah teknologi sehari-hari), conceptApplication (cara menerapkan materi ini), dan realBenefit (dampak/solusi nyata).
4. GEDUNG 2 — STUDIO ON AIR (PODCAST & RADIO KAMPUS):
   - "topikPodcastMentor": Judul episode diskusi Podcast yang menarik dan kontekstual.
   - "ringkasanMendalamPodcast": Uraian materi mendalam (2-3 paragraf) untuk bekal siswa dan AI Co-Host sebelum siaran dimulai.
   - "studiKasusPodcast": 1 cerita studi kasus nyata masalah teknologi dalam kehidupan sehari-hari yang berhasil dipecahkan dengan materi ini.
   - "poinDiskusiPodcast": Array berisi 4 poin alur bahasan utama selama siaran ON AIR.
   - "pertanyaanPemantikPodcast": 1 pertanyaan pemantik HOTS utama untuk ditanyakan Host AI kepada siswa.
   - "daftarPemantikPodcast": Array berisi 3 pertanyaan pemantik HOTS seputar penerapan materi dalam kehidupan sehari-hari.
5. GEDUNG 3 — LAB DKV & TEFA (BENGKEL LATIHAN):
   - "kuisBengkel": Array berisi tepat 5 soal pilihan ganda berjenjang (diawali label "[Jenjang 1 - Dasar]", "[Jenjang 2 - Pemahaman]", "[Jenjang 3 - Penerapan]", "[Jenjang 4 - Analisis]", "[Jenjang 5 - Evaluasi & Kreasi]").
   - WAJIB: Ke-5 soal harus mengangkat SKENARIO PENERAPAN MATERI DALAM MEMECAHKAN MASALAH TEKNOLOGI DI KEHIDUPAN SEHARI-HARI!
6. "pertanyaanRefleksi": Array berisi tepat 3 pertanyaan refleksi mendalam untuk Pusat Refleksi.
7. "misiBalaiKota": 1 kalimat misi aksi nyata warga Kota Refleksia.
8. "tantanganBangunanLain": Array berisi tepat 9 objek distribusi bangunan Kota Refleksia.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            materiEsensialDikembangkan: { type: Type.STRING },
            ringkasanAI: { type: Type.STRING },
            modulPerpustakaan: { type: Type.STRING },
            ilustrasiVisual: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  badge: { type: Type.STRING },
                  caption: { type: Type.STRING },
                  visualType: { type: Type.STRING },
                  steps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        stepLabel: { type: Type.STRING },
                        icon: { type: Type.STRING },
                        description: { type: Type.STRING },
                      },
                      required: ['stepLabel', 'icon', 'description'],
                    },
                  },
                  takeaway: { type: Type.STRING },
                },
                required: ['id', 'title', 'badge', 'caption', 'visualType', 'steps', 'takeaway'],
              },
            },
            implementasiSehariHari: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  icon: { type: Type.STRING },
                  dailyProblem: { type: Type.STRING },
                  conceptApplication: { type: Type.STRING },
                  realBenefit: { type: Type.STRING },
                },
                required: ['id', 'title', 'icon', 'dailyProblem', 'conceptApplication', 'realBenefit'],
              },
            },
            pertanyaanRefleksi: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            topikPodcastMentor: { type: Type.STRING },
            ringkasanMendalamPodcast: { type: Type.STRING },
            studiKasusPodcast: { type: Type.STRING },
            poinDiskusiPodcast: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            pertanyaanPemantikPodcast: { type: Type.STRING },
            daftarPemantikPodcast: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            misiBalaiKota: { type: Type.STRING },
            tantanganBangunanLain: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  buildingId: { type: Type.STRING },
                  buildingName: { type: Type.STRING },
                  buildingIcon: { type: Type.STRING },
                  activityTitle: { type: Type.STRING },
                  materialSummary: { type: Type.STRING },
                  challengePrompt: { type: Type.STRING },
                },
                required: [
                  'buildingId',
                  'buildingName',
                  'buildingIcon',
                  'activityTitle',
                  'materialSummary',
                  'challengePrompt',
                ],
              },
            },
            kuisBengkel: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: [
            'materiEsensialDikembangkan',
            'ringkasanAI',
            'modulPerpustakaan',
            'ilustrasiVisual',
            'implementasiSehariHari',
            'pertanyaanRefleksi',
            'topikPodcastMentor',
            'ringkasanMendalamPodcast',
            'studiKasusPodcast',
            'poinDiskusiPodcast',
            'pertanyaanPemantikPodcast',
            'daftarPemantikPodcast',
            'misiBalaiKota',
            'tantanganBangunanLain',
            'kuisBengkel',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }
    const parsed = JSON.parse(text);
    const fb = buildFallbackDistribution();

    return res.json({
      success: true,
      source: 'gemini-ai',
      data: {
        materiEsensialDikembangkan: parsed.materiEsensialDikembangkan || fb.materiEsensialDikembangkan,
        ringkasanAI: parsed.ringkasanAI || fb.ringkasanAI,
        modulPerpustakaan: parsed.modulPerpustakaan || fb.modulPerpustakaan,
        ilustrasiVisual:
          Array.isArray(parsed.ilustrasiVisual) && parsed.ilustrasiVisual.length > 0
            ? parsed.ilustrasiVisual
            : fb.ilustrasiVisual,
        implementasiSehariHari:
          Array.isArray(parsed.implementasiSehariHari) && parsed.implementasiSehariHari.length > 0
            ? parsed.implementasiSehariHari
            : fb.implementasiSehariHari,
        pertanyaanRefleksi:
          Array.isArray(parsed.pertanyaanRefleksi) && parsed.pertanyaanRefleksi.length >= 3
            ? parsed.pertanyaanRefleksi.slice(0, 3)
            : fb.pertanyaanRefleksi,
        topikPodcastMentor: parsed.topikPodcastMentor || fb.topikPodcastMentor,
        ringkasanMendalamPodcast: parsed.ringkasanMendalamPodcast || fb.ringkasanMendalamPodcast,
        studiKasusPodcast: parsed.studiKasusPodcast || fb.studiKasusPodcast,
        poinDiskusiPodcast:
          Array.isArray(parsed.poinDiskusiPodcast) && parsed.poinDiskusiPodcast.length > 0
            ? parsed.poinDiskusiPodcast
            : fb.poinDiskusiPodcast,
        pertanyaanPemantikPodcast: parsed.pertanyaanPemantikPodcast || fb.pertanyaanPemantikPodcast,
        daftarPemantikPodcast:
          Array.isArray(parsed.daftarPemantikPodcast) && parsed.daftarPemantikPodcast.length > 0
            ? parsed.daftarPemantikPodcast
            : fb.daftarPemantikPodcast,
        misiBalaiKota: parsed.misiBalaiKota || fb.misiBalaiKota,
        tantanganBangunanLain:
          Array.isArray(parsed.tantanganBangunanLain) && parsed.tantanganBangunanLain.length > 0
            ? parsed.tantanganBangunanLain
            : fb.tantanganBangunanLain,
        kuisBengkel:
          Array.isArray(parsed.kuisBengkel) && parsed.kuisBengkel.length >= 5
            ? parsed.kuisBengkel.slice(0, 5)
            : fb.kuisBengkel,
      },
    });
  } catch (err) {
    console.warn('Gemini generate-ai fallback triggered:', err);
    return res.json({
      success: true,
      source: 'fallback',
      data: buildFallbackDistribution(),
    });
  }
});

// =========================================================================
// KOTAK SURAT KECIL MASUKAN & SARAN DI SETIAP WISMA SISWA & GURU
// =========================================================================
const WISMA_SUGGESTIONS_FILE_PATH = path.join(__dirname, 'server_wisma_suggestions.json');

function loadWismaSuggestionsFromFile(): any[] {
  try {
    if (fs.existsSync(WISMA_SUGGESTIONS_FILE_PATH)) {
      const raw = fs.readFileSync(WISMA_SUGGESTIONS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

let serverWismaSuggestions: any[] = loadWismaSuggestionsFromFile();

function saveWismaSuggestionsToFile() {
  try {
    fs.writeFileSync(WISMA_SUGGESTIONS_FILE_PATH, JSON.stringify(serverWismaSuggestions, null, 2), 'utf-8');
  } catch {}
}

app.get('/api/wisma-suggestions', (_req, res) => {
  return res.json({
    success: true,
    data: serverWismaSuggestions,
  });
});

app.post('/api/wisma-suggestions', (req, res) => {
  const item = req.body;
  if (!item || !item.id || !item.content) {
    return res.status(400).json({ success: false, error: 'Data masukan/saran tidak lengkap.' });
  }
  serverWismaSuggestions = [
    item,
    ...serverWismaSuggestions.filter((s) => s && s.id !== item.id),
  ].slice(0, 150);
  saveWismaSuggestionsToFile();
  return res.json({
    success: true,
    data: item,
  });
});

// ============================================================================
// ARENA RUMAH MISTERI (LIVE MULTIPLAYER GROUP GAME DI REFLEKSIA TIMUR DEPAN)
// Server-Authoritative State, Role Verification, Anti-Peek & Spreadsheet Sync
// ============================================================================
const MYSTERY_ARENA_FILE_PATH = path.join(__dirname, 'server_mystery_arena.json');

const AUTHORIZED_TEACHER_USERNAMES = new Set([
  'kikybahsoan',
  'guru.dkv',
  'irfan.syahrul',
  'nurlaila.doda',
  'abdul.rahman',
  'patria.wumu',
  'syahrul.ramadhan',
  'sarifin.ahmad',
  'rizal.abdul',
  'ayunita.tuliabu',
  'naziefah',
]);

const AUTHORIZED_TEACHER_NAMES = [
  'KIKYBAHSOAN',
  'MOHAMAD RIZKI BAHSOAN',
  'IRFAN SYAHRUL BASRI',
  'NURLAILA DODA',
  'ABDUL RAHMAN BAHSOAN',
  'PATRIA WUMU',
  'SYAHRUL RAMADHAN',
  'SARIFIN AHMAD',
  'RIZAL ABDUL',
  'AYUNITA TULIABU',
  'NAZIEFAH',
];

function verifyTeacherAccountServerSide(payload: {
  teacherId?: string;
  teacherName?: string;
  isTeacher?: boolean;
  studentNumber?: string;
}): boolean {
  if (!payload) return false;
  const rawId = String(payload.teacherId || '').trim().toLowerCase();
  const rawName = String(payload.teacherName || '').trim().toUpperCase();
  const rawNum = String(payload.studentNumber || '').trim().toUpperCase();

  if (rawId.startsWith('std-') || rawId.startsWith('guest-')) {
    return false;
  }

  if (rawId.startsWith('teacher-')) {
    const uname = rawId.replace(/^teacher-/, '');
    if (AUTHORIZED_TEACHER_USERNAMES.has(uname) || uname === 'guru' || uname.includes('kikybahsoan')) {
      return true;
    }
  }

  if (AUTHORIZED_TEACHER_USERNAMES.has(rawId)) {
    return true;
  }

  if (
    payload.isTeacher === true &&
    (rawNum === 'MASTER-DKV' ||
      rawNum === 'GURU-DKV' ||
      AUTHORIZED_TEACHER_NAMES.some((n) => rawName.includes(n)))
  ) {
    return true;
  }

  if (AUTHORIZED_TEACHER_NAMES.some((n) => rawName.includes(n)) && rawId.includes('teacher')) {
    return true;
  }

  return false;
}

interface ServerMysteryArenaStore {
  currentRound: {
    id_ronde: string;
    soal: string;
    rumah_benar: 1 | 2 | 3 | 4 | 5;
    status: 'menunggu' | 'buka' | 'tutup' | 'meledak';
    waktu: string;
    poin_benar: number;
    timer_detik: number;
    timer_berakhir_ms: number | null;
    ledakan_mulai_ms: number | null;
    guru_pembuat: string;
  };
  choices: Record<
    number,
    {
      id_ronde: string;
      kelompok: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      rumah_dipilih: 1 | 2 | 3 | 4 | 5 | null;
      waktu: string;
      diwakili_oleh?: string;
    }
  >;
  scores: Array<{
    kelompok: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    total_poin: number;
    ronde_menang: number;
    waktu_update: string;
  }>;
  studentGroupMap: Record<string, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>;
  groupMembers: Record<
    number,
    Array<{
      studentId: string;
      studentName: string;
      className: string;
      gender: 'L' | 'P';
    }>
  >;
  arenaPlayers: Record<
    string,
    {
      studentId: string;
      studentName: string;
      className: string;
      gender: 'L' | 'P';
      isTeacher: boolean;
      kelompok: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | null;
      arenaWx: number;
      arenaWy: number;
      rumah_dipilih: 1 | 2 | 3 | 4 | 5 | null;
      lastSeen: number;
    }
  >;
  groupChats: Array<{
    id: string;
    kelompok: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
    createdAt: number;
  }>;
  roundHistory: Array<{
    id_ronde: string;
    soal: string;
    rumah_benar: 1 | 2 | 3 | 4 | 5;
    status: 'menunggu' | 'buka' | 'tutup' | 'meledak';
    waktu: string;
    poin_benar: number;
    timer_detik: number;
    guru_pembuat?: string;
  }>;
  lastAwardedRoundId: string | null;
  winningGroups: Array<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>;
}

function createInitialMysteryArenaStore(): ServerMysteryArenaStore {
  const nowStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const roundId = 'ronde-1';
  const choices: ServerMysteryArenaStore['choices'] = {};
  const scores: ServerMysteryArenaStore['scores'] = [];
  const groupMembers: ServerMysteryArenaStore['groupMembers'] = {};

  for (let g = 1; g <= 8; g++) {
    const grp = g as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    choices[grp] = {
      id_ronde: roundId,
      kelompok: grp,
      rumah_dipilih: null,
      waktu: nowStr,
      diwakili_oleh: '',
    };
    scores.push({
      kelompok: grp,
      total_poin: 0,
      ronde_menang: 0,
      waktu_update: nowStr,
    });
    groupMembers[grp] = [];
  }

  return {
    currentRound: {
      id_ronde: roundId,
      soal: 'Dalam desain poster publikasi DKV, elemen visual yang dibuat paling besar dan kontras agar dilihat pertama kali dalam 3 detik disebut?\n\n🏠 Rumah 1: Watermark\n🏠 Rumah 2: Headline / Focal Point\n🏠 Rumah 3: Catatan Kaki (Footnote)\n🏠 Rumah 4: Garis Margin\n🏠 Rumah 5: Nomor Halaman',
      rumah_benar: 2,
      status: 'menunggu',
      waktu: nowStr,
      poin_benar: 20,
      timer_detik: 45,
      timer_berakhir_ms: null,
      ledakan_mulai_ms: null,
      guru_pembuat: 'Guru Pembimbing DKV',
    },
    choices,
    scores,
    studentGroupMap: {},
    groupMembers,
    arenaPlayers: {},
    groupChats: [],
    roundHistory: [],
    lastAwardedRoundId: null,
    winningGroups: [],
  };
}

function loadMysteryArenaFromFile(): ServerMysteryArenaStore {
  try {
    if (fs.existsSync(MYSTERY_ARENA_FILE_PATH)) {
      const raw = fs.readFileSync(MYSTERY_ARENA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.currentRound && parsed.scores) {
        return {
          ...createInitialMysteryArenaStore(),
          ...parsed,
        };
      }
    }
  } catch (err) {
    console.warn('[server.ts] Could not read server_mystery_arena.json:', err);
  }
  return createInitialMysteryArenaStore();
}

let mysteryArenaStore: ServerMysteryArenaStore = loadMysteryArenaFromFile();
let lastMysterySaveMs = 0;

function saveMysteryArenaToFile(force = false) {
  const now = Date.now();
  if (!force && now - lastMysterySaveMs < 800) return;
  lastMysterySaveMs = now;
  try {
    fs.writeFileSync(MYSTERY_ARENA_FILE_PATH, JSON.stringify(mysteryArenaStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[server.ts] Failed writing server_mystery_arena.json:', err);
  }
}

// Helper: Get default arena coordinates for a group (1..8) in the Group Gathering Zone in front of Teacher
function getGroupGatheringCoords(kelompok: number | null, memberIndex = 0): { wx: number; wy: number } {
  if (!kelompok || kelompok < 1 || kelompok > 8) {
    return { wx: 0, wy: 2.2 };
  }
  // 8 group pads arranged in 2 rows of 4 in front of the teacher podium
  const col = (kelompok - 1) % 4; // 0..3
  const row = Math.floor((kelompok - 1) / 4); // 0..1
  const baseWx = (col - 1.5) * 2.2; // -3.3, -1.1, +1.1, +3.3
  const baseWy = 0.6 + row * 1.45; // 0.6, 2.05
  const jitterX = ((memberIndex % 3) - 1) * 0.28;
  const jitterY = (Math.floor(memberIndex / 3) % 2) * 0.24;
  return { wx: baseWx + jitterX, wy: baseWy + jitterY };
}

// Helper: Get arena coordinates for a Mystery House (1..5) lined up at the back
function getMysteryHouseCoords(houseNum: number, memberIndex = 0): { wx: number; wy: number } {
  const clamped = Math.max(1, Math.min(5, houseNum));
  const baseWx = (clamped - 3) * 2.4; // -4.8, -2.4, 0, +2.4, +4.8
  const baseWy = -2.35;
  const jitterX = ((memberIndex % 3) - 1) * 0.25;
  const jitterY = (Math.floor(memberIndex / 3) % 2) * 0.22;
  return { wx: baseWx + jitterX, wy: baseWy + jitterY };
}

function syncMysteryArenaWithCityOnlinePlayers() {
  const now = Date.now();
  // Bridge online players from city map (/api/presence/heartbeat) who are standing at Arena Rumah Misteri
  // or who have already joined a group in Mystery Arena
  for (const [, cityPlayer] of onlinePlayersMap.entries()) {
    if (!cityPlayer || !cityPlayer.id || now - cityPlayer.lastSeen > 40000) continue;
    const isNearArenaOnMap =
      cityPlayer.wx >= 10.2 &&
      cityPlayer.wx <= 16.8 &&
      cityPlayer.wy >= 0.8 &&
      cityPlayer.wy <= 6.0;
    const isTeacherRole = cityPlayer.role === 'guru';

    // Match by ID or name in existing arenaPlayers / studentGroupMap
    const existingArenaEntry = Object.values(mysteryArenaStore.arenaPlayers).find(
      (ap) =>
        ap.studentId === cityPlayer.id ||
        ap.studentName.trim().toLowerCase() === cityPlayer.name.trim().toLowerCase()
    );

    if (existingArenaEntry) {
      existingArenaEntry.lastSeen = Math.max(existingArenaEntry.lastSeen, cityPlayer.lastSeen);
    } else if (isNearArenaOnMap) {
      const pKey = cityPlayer.id;
      const existingGrp = isTeacherRole
        ? null
        : mysteryArenaStore.studentGroupMap[pKey] || (1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);
      if (!isTeacherRole && existingGrp && !mysteryArenaStore.studentGroupMap[pKey]) {
        mysteryArenaStore.studentGroupMap[pKey] = existingGrp;
        const alreadyInGrp = (mysteryArenaStore.groupMembers[existingGrp] || []).some(
          (m) =>
            m.studentId === pKey ||
            m.studentName.trim().toLowerCase() === cityPlayer.name.trim().toLowerCase()
        );
        if (!alreadyInGrp) {
          mysteryArenaStore.groupMembers[existingGrp].push({
            studentId: pKey,
            studentName: cityPlayer.name,
            className: cityPlayer.roleLabel || 'X DKV',
            gender: cityPlayer.gender === 'P' ? 'P' : 'L',
          });
        }
      }
      const chosenHouse = existingGrp
        ? mysteryArenaStore.choices[existingGrp]?.rumah_dipilih || null
        : null;
      const coords = isTeacherRole
        ? { wx: 0, wy: 3.65 }
        : chosenHouse
        ? getMysteryHouseCoords(chosenHouse, Object.keys(mysteryArenaStore.arenaPlayers).length)
        : getGroupGatheringCoords(existingGrp, Object.keys(mysteryArenaStore.arenaPlayers).length);

      mysteryArenaStore.arenaPlayers[pKey] = {
        studentId: pKey,
        studentName: cityPlayer.name,
        className: cityPlayer.roleLabel || (isTeacherRole ? 'Dewan Guru' : 'X DKV'),
        gender: cityPlayer.gender === 'P' ? 'P' : 'L',
        isTeacher: isTeacherRole,
        kelompok: existingGrp,
        arenaWx: coords.wx,
        arenaWy: coords.wy,
        rumah_dipilih: chosenHouse,
        lastSeen: cityPlayer.lastSeen,
      };
    }
  }
}

function checkAndAdvanceMysteryArenaTimer() {
  const now = Date.now();
  // 1. Auto-lock choices if countdown timer expired while status === 'buka'
  if (
    mysteryArenaStore.currentRound.status === 'buka' &&
    mysteryArenaStore.currentRound.timer_berakhir_ms &&
    now >= mysteryArenaStore.currentRound.timer_berakhir_ms
  ) {
    mysteryArenaStore.currentRound.status = 'tutup';
    mysteryArenaStore.currentRound.timer_berakhir_ms = null;
    saveMysteryArenaToFile(true);
    broadcastPresence({
      type: 'mystery_arena_tick',
      roundId: mysteryArenaStore.currentRound.id_ronde,
      status: 'tutup',
      timestamp: now,
    });
  }

  syncMysteryArenaWithCityOnlinePlayers();

  // 2. Purge inactive arena players older than 45 seconds
  for (const [sid, p] of Object.entries(mysteryArenaStore.arenaPlayers)) {
    if (now - p.lastSeen > 45000) {
      delete mysteryArenaStore.arenaPlayers[sid];
    }
  }
}

function buildSanitizedMysteryArenaPayload(params: {
  viewerId?: string;
  isVerifiedTeacher: boolean;
  viewerGroup?: number | null;
}) {
  checkAndAdvanceMysteryArenaTimer();
  const { isVerifiedTeacher, viewerGroup } = params;
  const round = mysteryArenaStore.currentRound;

  // CRITICAL ANTI-PEEK RULE:
  // rumah_benar TIDAK BOLEH dikirim ke sisi siswa sebelum status === 'meledak'!
  const canSeeCorrectHouse = isVerifiedTeacher || round.status === 'meledak';

  const sanitizedRound = {
    ...round,
    rumah_benar: canSeeCorrectHouse ? round.rumah_benar : null,
  };

  // Ensure all online student arenaPlayers are reflected in groupMembers so no participant is ever missing
  Object.values(mysteryArenaStore.arenaPlayers).forEach((ap) => {
    if (!ap.isTeacher && ap.kelompok && ap.kelompok >= 1 && ap.kelompok <= 8) {
      const grp = ap.kelompok;
      mysteryArenaStore.studentGroupMap[ap.studentId] = grp;
      const list = mysteryArenaStore.groupMembers[grp] || [];
      if (!list.some((m) => m.studentId === ap.studentId)) {
        list.push({
          studentId: ap.studentId,
          studentName: ap.studentName,
          className: ap.className || 'X DKV',
          gender: ap.gender === 'P' ? 'P' : 'L',
        });
        mysteryArenaStore.groupMembers[grp] = list;
      }
    }
  });

  // Enrich groupMembers with online status
  const enrichedGroupMembers: Record<number, any[]> = {};
  for (let g = 1; g <= 8; g++) {
    const members = mysteryArenaStore.groupMembers[g] || [];
    enrichedGroupMembers[g] = members.map((m) => ({
      ...m,
      isOnline: Boolean(
        mysteryArenaStore.arenaPlayers[m.studentId] ||
          Object.values(mysteryArenaStore.arenaPlayers).some(
            (ap) => ap.studentName.trim().toLowerCase() === m.studentName.trim().toLowerCase()
          )
      ),
    }));
  }

  // Filter groupChats: teacher sees all or selected group; student only sees their own group's chat
  const effectiveGroup =
    viewerGroup ||
    (params.viewerId ? mysteryArenaStore.studentGroupMap[params.viewerId] : null) ||
    null;

  const filteredChats = isVerifiedTeacher
    ? mysteryArenaStore.groupChats.slice(-80)
    : effectiveGroup
    ? mysteryArenaStore.groupChats.filter((c) => c.kelompok === effectiveGroup).slice(-50)
    : [];

  return {
    currentRound: sanitizedRound,
    choices: mysteryArenaStore.choices,
    scores: mysteryArenaStore.scores,
    studentGroupMap: mysteryArenaStore.studentGroupMap,
    groupMembers: enrichedGroupMembers,
    arenaPlayers: Object.values(mysteryArenaStore.arenaPlayers),
    groupChats: filteredChats,
    roundHistory: mysteryArenaStore.roundHistory.slice(0, 15).map((r) => ({
      ...r,
      rumah_benar: isVerifiedTeacher || r.status === 'meledak' ? r.rumah_benar : null,
    })),
    lastAwardedRoundId: mysteryArenaStore.lastAwardedRoundId,
    winningGroups: round.status === 'meledak' ? mysteryArenaStore.winningGroups : [],
    serverTime: Date.now(),
  };
}

// GET /api/mystery-arena/state (Polled every 1-2s by clients + acts as live presence heartbeat!)
app.get('/api/mystery-arena/state', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const viewerId = req.query.studentId ? String(req.query.studentId).trim() : undefined;
  const viewerName = req.query.studentName ? String(req.query.studentName).trim() : undefined;
  const viewerClass = req.query.className ? String(req.query.className).trim() : 'X DKV';
  const viewerGender: 'L' | 'P' = req.query.gender === 'P' ? 'P' : 'L';
  const isTeacherParam = req.query.isTeacher === 'true' || req.query.isTeacher === '1';
  const studentNumber = req.query.studentNumber ? String(req.query.studentNumber) : undefined;
  const viewerGroupRaw = req.query.kelompok ? Number(req.query.kelompok) : undefined;

  const isVerifiedTeacher = verifyTeacherAccountServerSide({
    teacherId: viewerId,
    teacherName: viewerName,
    isTeacher: isTeacherParam,
    studentNumber,
  });

  // Upsert & refresh live participant presence on every poll so participants are ALWAYS read in real-time
  if (viewerId && viewerName) {
    const now = Date.now();
    if (isVerifiedTeacher) {
      // Ensure teacher is never mistakenly listed as a student in groupMembers
      delete mysteryArenaStore.studentGroupMap[viewerId];
      for (let g = 1; g <= 8; g++) {
        mysteryArenaStore.groupMembers[g] = (mysteryArenaStore.groupMembers[g] || []).filter(
          (m) => m.studentId !== viewerId
        );
      }
      mysteryArenaStore.arenaPlayers[viewerId] = {
        studentId: viewerId,
        studentName: viewerName,
        className: viewerClass || 'Dewan Guru',
        gender: viewerGender,
        isTeacher: true,
        kelompok: null,
        arenaWx: 0,
        arenaWy: 3.65,
        rumah_dipilih: null,
        lastSeen: now,
      };
    } else {
      const assignedGrp =
        mysteryArenaStore.studentGroupMap[viewerId] ||
        (viewerGroupRaw && viewerGroupRaw >= 1 && viewerGroupRaw <= 8
          ? (viewerGroupRaw as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8)
          : 1);

      mysteryArenaStore.studentGroupMap[viewerId] = assignedGrp;
      const grpList = mysteryArenaStore.groupMembers[assignedGrp] || [];
      if (!grpList.some((m) => m.studentId === viewerId)) {
        for (let g = 1; g <= 8; g++) {
          mysteryArenaStore.groupMembers[g] = (mysteryArenaStore.groupMembers[g] || []).filter(
            (m) => m.studentId !== viewerId
          );
        }
        mysteryArenaStore.groupMembers[assignedGrp].push({
          studentId: viewerId,
          studentName: viewerName,
          className: viewerClass,
          gender: viewerGender,
        });
      }

      const currentHouse = mysteryArenaStore.choices[assignedGrp]?.rumah_dipilih || null;
      const existingPlayer = mysteryArenaStore.arenaPlayers[viewerId];
      const memberIdx = Math.max(0, mysteryArenaStore.groupMembers[assignedGrp].length - 1);
      const coords = currentHouse
        ? getMysteryHouseCoords(currentHouse, memberIdx)
        : getGroupGatheringCoords(assignedGrp, memberIdx);

      mysteryArenaStore.arenaPlayers[viewerId] = {
        studentId: viewerId,
        studentName: viewerName,
        className: viewerClass,
        gender: viewerGender,
        isTeacher: false,
        kelompok: assignedGrp,
        arenaWx: existingPlayer ? existingPlayer.arenaWx : coords.wx,
        arenaWy: existingPlayer ? existingPlayer.arenaWy : coords.wy,
        rumah_dipilih: currentHouse,
        lastSeen: now,
      };
    }
  }

  const data = buildSanitizedMysteryArenaPayload({
    viewerId,
    isVerifiedTeacher,
    viewerGroup: viewerGroupRaw,
  });

  return res.json({
    success: true,
    isVerifiedTeacher,
    data,
  });
});

// POST /api/mystery-arena/teacher-action (Strictly verified on server!)
app.post('/api/mystery-arena/teacher-action', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const {
    teacherId,
    teacherName,
    isTeacher,
    studentNumber,
    actionType,
    soal,
    rumah_benar,
    poin_benar,
    timer_detik,
    openImmediately,
    targetStudentId,
    targetStudentName,
    targetStudentClass,
    targetStudentGender,
    targetKelompok,
  } = req.body || {};

  // Server-side role verification (bukan sekadar menyembunyikan tombol di UI)
  const isVerified = verifyTeacherAccountServerSide({
    teacherId,
    teacherName,
    isTeacher,
    studentNumber,
  });

  if (!isVerified) {
    return res.status(403).json({
      success: false,
      error: 'Akses Ditolak (403): Hanya akun Guru resmi yang diizinkan mengontrol Panel Guru Arena Rumah Misteri.',
    });
  }

  const now = Date.now();
  const nowStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  if (actionType === 'start_round') {
    const cleanSoal = String(soal || '').trim();
    if (!cleanSoal) {
      return res.status(400).json({ success: false, error: 'Soal ronde tidak boleh kosong.' });
    }
    const houseNum = Math.max(1, Math.min(5, Number(rumah_benar) || 1)) as 1 | 2 | 3 | 4 | 5;
    const pointsVal = Math.max(1, Math.min(500, Number(poin_benar) || 20));
    const timerSec = Math.max(0, Math.min(600, Number(timer_detik) || 0));
    const nextRoundId = `ronde-${Date.now().toString(36)}`;
    const initialStatus = openImmediately ? 'buka' : 'menunggu';

    // Archive previous round if it was detonated
    if (mysteryArenaStore.currentRound.status === 'meledak') {
      mysteryArenaStore.roundHistory = [
        { ...mysteryArenaStore.currentRound },
        ...mysteryArenaStore.roundHistory.filter(
          (r) => r.id_ronde !== mysteryArenaStore.currentRound.id_ronde
        ),
      ].slice(0, 20);
    }

    mysteryArenaStore.currentRound = {
      id_ronde: nextRoundId,
      soal: cleanSoal,
      rumah_benar: houseNum,
      status: initialStatus,
      waktu: nowStr,
      poin_benar: pointsVal,
      timer_detik: timerSec,
      timer_berakhir_ms: initialStatus === 'buka' && timerSec > 0 ? now + timerSec * 1000 : null,
      ledakan_mulai_ms: null,
      guru_pembuat: String(teacherName || 'Guru DKV'),
    };

    // Reset all group choices & return all students to group gathering zone
    for (let g = 1; g <= 8; g++) {
      const grp = g as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      mysteryArenaStore.choices[grp] = {
        id_ronde: nextRoundId,
        kelompok: grp,
        rumah_dipilih: null,
        waktu: nowStr,
        diwakili_oleh: '',
      };
    }

    Object.values(mysteryArenaStore.arenaPlayers).forEach((p, idx) => {
      p.rumah_dipilih = null;
      if (!p.isTeacher) {
        const coords = getGroupGatheringCoords(p.kelompok, idx);
        p.arenaWx = coords.wx;
        p.arenaWy = coords.wy;
      }
    });

    mysteryArenaStore.winningGroups = [];
    saveMysteryArenaToFile(true);
  } else if (actionType === 'open_choices') {
    const timerSec =
      typeof timer_detik === 'number'
        ? Math.max(0, Math.min(600, timer_detik))
        : mysteryArenaStore.currentRound.timer_detik;
    mysteryArenaStore.currentRound.timer_detik = timerSec;
    mysteryArenaStore.currentRound.status = 'buka';
    mysteryArenaStore.currentRound.timer_berakhir_ms =
      timerSec > 0 ? now + timerSec * 1000 : null;
    mysteryArenaStore.currentRound.ledakan_mulai_ms = null;
    mysteryArenaStore.currentRound.waktu = nowStr;
    saveMysteryArenaToFile(true);
  } else if (actionType === 'close_choices') {
    mysteryArenaStore.currentRound.status = 'tutup';
    mysteryArenaStore.currentRound.timer_berakhir_ms = null;
    mysteryArenaStore.currentRound.waktu = nowStr;
    saveMysteryArenaToFile(true);
  } else if (actionType === 'detonate') {
    // Requirement: "LEDAKKAN": aktif hanya setelah pilihan ditutup. Meledakkan 4 rumah salah.
    if (mysteryArenaStore.currentRound.status !== 'tutup') {
      return res.status(400).json({
        success: false,
        error: 'Tombol LEDAKKAN hanya dapat diaktifkan setelah pilihan ditutup!',
      });
    }

    mysteryArenaStore.currentRound.status = 'meledak';
    mysteryArenaStore.currentRound.ledakan_mulai_ms = now;
    mysteryArenaStore.currentRound.waktu = nowStr;

    const correctHouse = mysteryArenaStore.currentRound.rumah_benar;
    const rewardPts = mysteryArenaStore.currentRound.poin_benar || 20;
    const winners: Array<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8> = [];

    if (mysteryArenaStore.lastAwardedRoundId !== mysteryArenaStore.currentRound.id_ronde) {
      for (let g = 1; g <= 8; g++) {
        const grp = g as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
        const choice = mysteryArenaStore.choices[grp];
        if (choice && choice.rumah_dipilih === correctHouse) {
          winners.push(grp);
          const scoreRow = mysteryArenaStore.scores.find((s) => s.kelompok === grp);
          if (scoreRow) {
            scoreRow.total_poin += rewardPts;
            scoreRow.ronde_menang = (scoreRow.ronde_menang || 0) + 1;
            scoreRow.waktu_update = nowStr;
          }
        }
      }
      mysteryArenaStore.lastAwardedRoundId = mysteryArenaStore.currentRound.id_ronde;
    }

    mysteryArenaStore.winningGroups = winners;

    // Groups in the 4 wrong houses get knocked back to the group gathering zone!
    Object.values(mysteryArenaStore.arenaPlayers).forEach((p, idx) => {
      if (!p.isTeacher && p.rumah_dipilih && p.rumah_dipilih !== correctHouse) {
        const coords = getGroupGatheringCoords(p.kelompok, idx);
        p.arenaWx = coords.wx;
        p.arenaWy = coords.wy;
      }
    });

    saveMysteryArenaToFile(true);
  } else if (actionType === 'next_round' || actionType === 'reset_arena') {
    // Archive finished round
    if (mysteryArenaStore.currentRound.status === 'meledak') {
      mysteryArenaStore.roundHistory = [
        { ...mysteryArenaStore.currentRound },
        ...mysteryArenaStore.roundHistory.filter(
          (r) => r.id_ronde !== mysteryArenaStore.currentRound.id_ronde
        ),
      ].slice(0, 20);
    }

    const nextNum = mysteryArenaStore.roundHistory.length + 1;
    const nextRoundId = `ronde-${nextNum}-${Date.now().toString(36).slice(-3)}`;

    mysteryArenaStore.currentRound = {
      ...mysteryArenaStore.currentRound,
      id_ronde: nextRoundId,
      status: 'menunggu',
      timer_berakhir_ms: null,
      ledakan_mulai_ms: null,
      waktu: nowStr,
    };

    for (let g = 1; g <= 8; g++) {
      const grp = g as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      mysteryArenaStore.choices[grp] = {
        id_ronde: nextRoundId,
        kelompok: grp,
        rumah_dipilih: null,
        waktu: nowStr,
        diwakili_oleh: '',
      };
    }

    Object.values(mysteryArenaStore.arenaPlayers).forEach((p, idx) => {
      p.rumah_dipilih = null;
      if (!p.isTeacher) {
        const coords = getGroupGatheringCoords(p.kelompok, idx);
        p.arenaWx = coords.wx;
        p.arenaWy = coords.wy;
      }
    });

    mysteryArenaStore.winningGroups = [];
    saveMysteryArenaToFile(true);
  } else if (actionType === 'assign_student_group') {
    const sid = String(targetStudentId || '').trim();
    const grp = Math.max(1, Math.min(8, Number(targetKelompok) || 1)) as
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8;
    if (sid) {
      mysteryArenaStore.studentGroupMap[sid] = grp;
      for (let g = 1; g <= 8; g++) {
        mysteryArenaStore.groupMembers[g] = (mysteryArenaStore.groupMembers[g] || []).filter(
          (m) => m.studentId !== sid
        );
      }
      mysteryArenaStore.groupMembers[grp].push({
        studentId: sid,
        studentName: String(targetStudentName || 'Siswa DKV'),
        className: String(targetStudentClass || 'X DKV'),
        gender: targetStudentGender === 'P' ? 'P' : 'L',
      });
      if (mysteryArenaStore.arenaPlayers[sid]) {
        mysteryArenaStore.arenaPlayers[sid].kelompok = grp;
        const chosenHouse = mysteryArenaStore.choices[grp]?.rumah_dipilih || null;
        mysteryArenaStore.arenaPlayers[sid].rumah_dipilih = chosenHouse;
        const coords = chosenHouse
          ? getMysteryHouseCoords(chosenHouse, 0)
          : getGroupGatheringCoords(grp, 0);
        mysteryArenaStore.arenaPlayers[sid].arenaWx = coords.wx;
        mysteryArenaStore.arenaPlayers[sid].arenaWy = coords.wy;
      }
      saveMysteryArenaToFile(true);
    }
  } else if (actionType === 'reset_scores') {
    for (let g = 1; g <= 8; g++) {
      const grp = g as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      const row = mysteryArenaStore.scores.find((s) => s.kelompok === grp);
      if (row) {
        row.total_poin = 0;
        row.ronde_menang = 0;
        row.waktu_update = nowStr;
      }
    }
    mysteryArenaStore.lastAwardedRoundId = null;
    saveMysteryArenaToFile(true);
  }

  broadcastPresence({
    type: 'mystery_arena_tick',
    roundId: mysteryArenaStore.currentRound.id_ronde,
    status: mysteryArenaStore.currentRound.status,
    timestamp: now,
  });

  return res.json({
    success: true,
    isVerifiedTeacher: true,
    data: buildSanitizedMysteryArenaPayload({
      viewerId: teacherId,
      isVerifiedTeacher: true,
    }),
  });
});

// POST /api/mystery-arena/student-action (Join group, choose house, move avatar, send group chat)
app.post('/api/mystery-arena/student-action', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  checkAndAdvanceMysteryArenaTimer();

  const {
    studentId,
    studentName,
    className,
    gender,
    isTeacher,
    studentNumber,
    actionType,
    kelompok,
    rumah_dipilih,
    arenaWx,
    arenaWy,
    chatContent,
  } = req.body || {};

  if (!studentId) {
    return res.status(400).json({ success: false, error: 'ID pengguna diperlukan.' });
  }

  const sid = String(studentId);
  const sName = String(studentName || 'Siswa DKV');
  const sClass = String(className || 'X DKV');
  const sGender: 'L' | 'P' = gender === 'P' ? 'P' : 'L';
  const verifiedTeacher = verifyTeacherAccountServerSide({
    teacherId: sid,
    teacherName: sName,
    isTeacher,
    studentNumber,
  });

  const now = Date.now();
  const nowStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Ensure player presence entry exists
  if (!mysteryArenaStore.arenaPlayers[sid]) {
    const existingGrp = mysteryArenaStore.studentGroupMap[sid] || null;
    const defaultCoords = verifiedTeacher
      ? { wx: 0, wy: 3.65 } // Teacher stands at the front podium!
      : getGroupGatheringCoords(existingGrp, Object.keys(mysteryArenaStore.arenaPlayers).length);
    mysteryArenaStore.arenaPlayers[sid] = {
      studentId: sid,
      studentName: sName,
      className: sClass,
      gender: sGender,
      isTeacher: verifiedTeacher,
      kelompok: existingGrp,
      arenaWx: defaultCoords.wx,
      arenaWy: defaultCoords.wy,
      rumah_dipilih: existingGrp ? mysteryArenaStore.choices[existingGrp]?.rumah_dipilih || null : null,
      lastSeen: now,
    };
  } else {
    mysteryArenaStore.arenaPlayers[sid].lastSeen = now;
    mysteryArenaStore.arenaPlayers[sid].studentName = sName;
    mysteryArenaStore.arenaPlayers[sid].isTeacher = verifiedTeacher;
  }

  const player = mysteryArenaStore.arenaPlayers[sid];

  if (actionType === 'join_group') {
    if (verifiedTeacher) {
      // Teacher stays at front podium, never placed inside student groups 1-8
      delete mysteryArenaStore.studentGroupMap[sid];
      for (let g = 1; g <= 8; g++) {
        mysteryArenaStore.groupMembers[g] = (mysteryArenaStore.groupMembers[g] || []).filter(
          (m) => m.studentId !== sid
        );
      }
      player.kelompok = null;
      player.rumah_dipilih = null;
      player.arenaWx = 0;
      player.arenaWy = 3.65;
    } else {
      const grp = Math.max(1, Math.min(8, Number(kelompok) || 1)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      mysteryArenaStore.studentGroupMap[sid] = grp;
      for (let g = 1; g <= 8; g++) {
        mysteryArenaStore.groupMembers[g] = (mysteryArenaStore.groupMembers[g] || []).filter(
          (m) => m.studentId !== sid
        );
      }
      mysteryArenaStore.groupMembers[grp].push({
        studentId: sid,
        studentName: sName,
        className: sClass,
        gender: sGender,
      });

      player.kelompok = grp;
      const currentGroupHouse = mysteryArenaStore.choices[grp]?.rumah_dipilih || null;
      player.rumah_dipilih = currentGroupHouse;
      const memberIdx = mysteryArenaStore.groupMembers[grp].length - 1;
      const targetCoords = currentGroupHouse
        ? getMysteryHouseCoords(currentGroupHouse, memberIdx)
        : getGroupGatheringCoords(grp, memberIdx);
      player.arenaWx = targetCoords.wx;
      player.arenaWy = targetCoords.wy;
    }
    saveMysteryArenaToFile(true);
    broadcastPresence({
      type: 'mystery_arena_tick',
      roundId: mysteryArenaStore.currentRound.id_ronde,
      status: mysteryArenaStore.currentRound.status,
      timestamp: now,
    });
  } else if (actionType === 'select_house') {
    const grp = player.kelompok || mysteryArenaStore.studentGroupMap[sid];
    if (!grp) {
      return res.status(400).json({
        success: false,
        error: 'Silakan bergabung ke salah satu Kelompok (1-8) terlebih dahulu!',
      });
    }

    // Enforce rule: Boleh pindah rumah selama pilihan dibuka; setelah ditutup, posisi terkunci!
    if (mysteryArenaStore.currentRound.status !== 'buka') {
      return res.status(400).json({
        success: false,
        error:
          mysteryArenaStore.currentRound.status === 'tutup'
            ? '🔒 Pilihan sudah ditutup oleh Guru! Posisi kelompok terkunci.'
            : '⏳ Pilihan rumah belum dibuka oleh Guru.',
      });
    }

    const houseNum =
      rumah_dipilih === null || rumah_dipilih === 0
        ? null
        : (Math.max(1, Math.min(5, Number(rumah_dipilih))) as 1 | 2 | 3 | 4 | 5);

    // Satu kelompok hanya di satu rumah
    mysteryArenaStore.choices[grp] = {
      id_ronde: mysteryArenaStore.currentRound.id_ronde,
      kelompok: grp,
      rumah_dipilih: houseNum,
      waktu: nowStr,
      diwakili_oleh: sName,
    };

    // Move all online members of this group into the chosen house (or back to group area)
    let mIdx = 0;
    Object.values(mysteryArenaStore.arenaPlayers).forEach((p) => {
      if (p.kelompok === grp && !p.isTeacher) {
        p.rumah_dipilih = houseNum;
        const coords = houseNum
          ? getMysteryHouseCoords(houseNum, mIdx)
          : getGroupGatheringCoords(grp, mIdx);
        p.arenaWx = coords.wx;
        p.arenaWy = coords.wy;
        mIdx++;
      }
    });

    saveMysteryArenaToFile(true);
    broadcastPresence({
      type: 'mystery_arena_tick',
      roundId: mysteryArenaStore.currentRound.id_ronde,
      status: mysteryArenaStore.currentRound.status,
      timestamp: now,
    });
  } else if (actionType === 'move_avatar') {
    if (typeof arenaWx === 'number' && typeof arenaWy === 'number') {
      player.arenaWx = Math.max(-6.2, Math.min(6.2, arenaWx));
      player.arenaWy = Math.max(-3.6, Math.min(4.2, arenaWy));
    }
  } else if (actionType === 'send_group_chat') {
    const grp =
      (kelompok ? (Math.max(1, Math.min(8, Number(kelompok))) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) : null) ||
      player.kelompok ||
      mysteryArenaStore.studentGroupMap[sid];
    const text = String(chatContent || '').trim().slice(0, 160);
    if (!grp || !text) {
      return res.status(400).json({
        success: false,
        error: 'Pilih kelompok terlebih dahulu dan pastikan pesan tidak kosong.',
      });
    }
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    mysteryArenaStore.groupChats.push({
      id: `gchat-${now}-${Math.random().toString(36).slice(2, 6)}`,
      kelompok: grp,
      senderId: sid,
      senderName: sName,
      content: text,
      timestamp: `${hh}.${mm}`,
      createdAt: now,
    });
    if (mysteryArenaStore.groupChats.length > 200) {
      mysteryArenaStore.groupChats = mysteryArenaStore.groupChats.slice(-200);
    }
    saveMysteryArenaToFile();
    broadcastPresence({
      type: 'mystery_arena_tick',
      roundId: mysteryArenaStore.currentRound.id_ronde,
      status: mysteryArenaStore.currentRound.status,
      timestamp: now,
    });
  }

  return res.json({
    success: true,
    data: buildSanitizedMysteryArenaPayload({
      viewerId: sid,
      isVerifiedTeacher: verifiedTeacher,
      viewerGroup: player.kelompok,
    }),
  });
});

// ============================================================================
// ESCAPE ROOM MENARA (GEDUNG PENCAKAR LANGIT TERTINGGI • REFLEKSIA TIMUR)
// Server-Authoritative State, Role Check, Anti-Peek Answer Verification & Sync
// ============================================================================
const ESCAPE_TOWER_FILE_PATH = path.join(__dirname, 'server_escape_tower.json');

interface ServerEscapeTowerStore {
  sesi: {
    id_sesi: string;
    status: 'menunggu' | 'berjalan' | 'jeda' | 'selesai';
    waktu_mulai: string;
    waktu_mulai_ms: number | null;
    waktu_jeda_ms: number | null;
    total_durasi_jeda_ms: number;
    jumlah_kelompok: number;
    poin_dasar: number;
    bonus_kecepatan: number;
    pengurang_hint: number;
    pengurang_salah: number;
    penalti_waktu_salah_detik: number;
    guru_pembuat: string;
  };
  konfigurasi: Array<{
    nomor_lantai: 1 | 2 | 3 | 4 | 5;
    judul: string;
    cerita: string;
    soal: string;
    jenis: 'pilihan_ganda' | 'isian_singkat' | 'urutan_langkah' | 'sandi_kode';
    opsi?: string[];
    hint: string;
    kunci_jawaban: string;
    batas_waktu: number;
  }>;
  progres: Record<
    number,
    {
      id_sesi: string;
      kelompok: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      lantai_sekarang: 1 | 2 | 3 | 4 | 5 | 6;
      jumlah_salah: number;
      hint_dipakai: number;
      hint_terbuka_lantai: Array<1 | 2 | 3 | 4 | 5>;
      waktu_selesai: string;
      durasi_detik: number | null;
      peringkat_atap: number | null;
      penalti_waktu_detik: number;
      cooldown_sampai_ms: number | null;
      draft_jawaban: string;
      terakhir_dijawab_oleh: string;
      status_jawaban_terakhir: 'benar' | 'salah' | null;
      pesan_jawaban_terakhir: string;
    }
  >;
  skor: Array<{
    kelompok: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    total_poin: number;
    waktu_selesai: string;
    durasi_detik: number | null;
    hint_dipakai: number;
    jumlah_salah: number;
    peringkat: number | null;
  }>;
  studentGroupMap: Record<string, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>;
  groupMembers: Record<
    number,
    Array<{
      studentId: string;
      studentName: string;
      className: string;
      gender: 'L' | 'P';
    }>
  >;
  towerPlayers: Record<
    string,
    {
      studentId: string;
      studentName: string;
      className: string;
      gender: 'L' | 'P';
      isTeacher: boolean;
      kelompok: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | null;
      lantai_sekarang: 1 | 2 | 3 | 4 | 5 | 6;
      lastSeen: number;
    }
  >;
  groupChats: Array<{
    id: string;
    kelompok: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
    createdAt: number;
  }>;
  winningGroups: Array<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>;
}

function getDefaultEscapeFloors(): ServerEscapeTowerStore['konfigurasi'] {
  return [
    {
      nomor_lantai: 1,
      judul: 'Lantai 1 • Lobi Keamanan Visual',
      cerita:
        'Pintu utama Menara Pencakar Langit terkunci rapat! Sistem keamanan meminta kelompokmu mengidentifikasi prinsip dasar komposisi visual agar lift menuju Lantai 2 aktif.',
      soal: 'Prinsip desain yang mengatur urutan perhatian mata pembaca dari elemen terpenting (judul utama) ke informasi pendukung disebut...',
      jenis: 'pilihan_ganda',
      opsi: [
        'A. Hirarki Visual (Visual Hierarchy)',
        'B. Distorsi Perspektif',
        'C. Redundansi Piksel',
        'D. Monotonisasi Ruang',
      ],
      hint: 'Ingat istilah untuk menyusun prioritas informasi dari yang paling besar/kontras ke yang terkecil.',
      kunci_jawaban: 'A',
      batas_waktu: 120,
    },
    {
      nomor_lantai: 2,
      judul: 'Lantai 2 • Laboratorium Warna Cetak',
      cerita:
        'Lift berhenti di Lantai 2. Mesin cetak offset raksasa memblokir lorong darurat dan meminta kode singkatan 4 warna tinta utama percetakan.',
      soal: 'Ketik singkatan 4 huruf model warna subtraktif yang wajib digunakan saat menyiapkan file desain untuk dicetak di mesin percetakan (Cyan, Magenta, Yellow, Key/Black):',
      jenis: 'isian_singkat',
      opsi: [],
      hint: 'Terdiri dari 4 huruf kapital: dimulai dengan huruf C dan diakhiri huruf K.',
      kunci_jawaban: 'CMYK',
      batas_waktu: 120,
    },
    {
      nomor_lantai: 3,
      judul: 'Lantai 3 • Ruang Algoritma Produksi Desain',
      cerita:
        'Panel jembatan menuju tangga Lantai 4 teracak! Susun kembali urutan alur kerja (workflow) proyek desain komunikasi visual dari tahap paling awal hingga akhir.',
      soal: 'Susun urutan langkah kerja desainer profesional berikut dari langkah pertama (1) hingga terakhir (4) dengan menggeser (drag & drop) atau tombol panah:',
      jenis: 'urutan_langkah',
      opsi: [
        'Memahami Brief Klien & Riset Target Audiens',
        'Membuat Moodboard & Sketsa Kasar (Thumbnail)',
        'Eksekusi Desain Digital & Tipografi',
        'Revisi Akhir & Ekspor File Siap Cetak/Publikasi',
      ],
      hint: 'Selalu mulai dari memahami brief/riset, lalu sketsa/moodboard, kemudian eksekusi digital, dan terakhir ekspor final.',
      kunci_jawaban:
        'Memahami Brief Klien & Riset Target Audiens -> Membuat Moodboard & Sketsa Kasar (Thumbnail) -> Eksekusi Desain Digital & Tipografi -> Revisi Akhir & Ekspor File Siap Cetak/Publikasi',
      batas_waktu: 150,
    },
    {
      nomor_lantai: 4,
      judul: 'Lantai 4 • Brankas Enkripsi Resolusi',
      cerita:
        'Tinggal satu lantai sebelum puncak! Pintu baja Lantai 4 dikunci dengan keypad sandi angka 3 digit yang biasa dipakai desainer untuk standar resolusi cetak tajam.',
      soal: 'Masukkan sandi angka 3 digit: Berapa nilai standar resolusi DPI (Dots Per Inch) minimal agar hasil cetak poster/majalah terlihat tajam dan tidak pecah?',
      jenis: 'sandi_kode',
      opsi: [],
      hint: 'Angka ratusan bulat yang berada di antara 250 dan 350 DPI (bukan 72 DPI untuk layar).',
      kunci_jawaban: '300',
      batas_waktu: 120,
    },
    {
      nomor_lantai: 5,
      judul: 'Lantai 5 • Ruang Kontrol Pintu Atap',
      cerita:
        'Kelompokmu tiba di lantai tertinggi tepat di bawah Pintu Atap Helipad! Jawab teka-teki terakhir ini untuk membuka kunci hidrolik Pintu Atap dan mengibarkan bendera kemenangan.',
      soal: 'Kumpulan karya terbaik seorang desainer yang disusun secara rapi dan terkurasi untuk ditunjukkan kepada klien atau perusahaan saat melamar kerja disebut...',
      jenis: 'isian_singkat',
      opsi: [],
      hint: 'Kata benda 10 huruf yang diawali dengan "PORTO..." dan diakhiri "...FOLIO".',
      kunci_jawaban: 'PORTOFOLIO',
      batas_waktu: 120,
    },
  ];
}

function createInitialEscapeTowerStore(): ServerEscapeTowerStore {
  const nowStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const sesiId = 'escape-1';
  const progres: ServerEscapeTowerStore['progres'] = {};
  const skor: ServerEscapeTowerStore['skor'] = [];
  const groupMembers: ServerEscapeTowerStore['groupMembers'] = {};

  for (let g = 1; g <= 8; g++) {
    const grp = g as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    progres[grp] = {
      id_sesi: sesiId,
      kelompok: grp,
      lantai_sekarang: 1,
      jumlah_salah: 0,
      hint_dipakai: 0,
      hint_terbuka_lantai: [],
      waktu_selesai: '-',
      durasi_detik: null,
      peringkat_atap: null,
      penalti_waktu_detik: 0,
      cooldown_sampai_ms: null,
      draft_jawaban: '',
      terakhir_dijawab_oleh: '',
      status_jawaban_terakhir: null,
      pesan_jawaban_terakhir: '',
    };
    skor.push({
      kelompok: grp,
      total_poin: 0,
      waktu_selesai: '-',
      durasi_detik: null,
      hint_dipakai: 0,
      jumlah_salah: 0,
      peringkat: null,
    });
    groupMembers[grp] = [];
  }

  return {
    sesi: {
      id_sesi: sesiId,
      status: 'menunggu',
      waktu_mulai: nowStr,
      waktu_mulai_ms: null,
      waktu_jeda_ms: null,
      total_durasi_jeda_ms: 0,
      jumlah_kelompok: 8,
      poin_dasar: 100,
      bonus_kecepatan: 50,
      pengurang_hint: 10,
      pengurang_salah: 5,
      penalti_waktu_salah_detik: 5,
      guru_pembuat: 'Guru Pembimbing DKV',
    },
    konfigurasi: getDefaultEscapeFloors(),
    progres,
    skor,
    studentGroupMap: {},
    groupMembers,
    towerPlayers: {},
    groupChats: [],
    winningGroups: [],
  };
}

function loadEscapeTowerFromFile(): ServerEscapeTowerStore {
  try {
    if (fs.existsSync(ESCAPE_TOWER_FILE_PATH)) {
      const raw = fs.readFileSync(ESCAPE_TOWER_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.sesi && Array.isArray(parsed.konfigurasi)) {
        return {
          ...createInitialEscapeTowerStore(),
          ...parsed,
        };
      }
    }
  } catch (err) {
    console.warn('[server.ts] Could not read server_escape_tower.json:', err);
  }
  return createInitialEscapeTowerStore();
}

let escapeTowerStore: ServerEscapeTowerStore = loadEscapeTowerFromFile();
let lastEscapeSaveMs = 0;

function saveEscapeTowerToFile(force = false) {
  const now = Date.now();
  if (!force && now - lastEscapeSaveMs < 800) return;
  lastEscapeSaveMs = now;
  try {
    fs.writeFileSync(ESCAPE_TOWER_FILE_PATH, JSON.stringify(escapeTowerStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[server.ts] Failed writing server_escape_tower.json:', err);
  }
}

function normalizeEscapeAnswer(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function checkEscapeFloorAnswerServerSide(
  floor: ServerEscapeTowerStore['konfigurasi'][number],
  rawSubmitted: string
): boolean {
  const submitted = normalizeEscapeAnswer(rawSubmitted);
  const key = normalizeEscapeAnswer(floor.kunci_jawaban);
  if (!submitted || !key) return false;

  if (submitted === key) return true;

  if (floor.jenis === 'pilihan_ganda') {
    // Allow matching "A" or "A. Hirarki Visual..."
    const subFirstLetter = submitted.replace(/^([a-e])[\.\)\s].*$/i, '$1').trim();
    const keyFirstLetter = key.replace(/^([a-e])[\.\)\s].*$/i, '$1').trim();
    if (
      subFirstLetter.length === 1 &&
      keyFirstLetter.length === 1 &&
      subFirstLetter === keyFirstLetter
    ) {
      return true;
    }
    // Or match against the full option text corresponding to key letter
    const matchedOpt = (floor.opsi || []).find((o) =>
      normalizeEscapeAnswer(o).startsWith(keyFirstLetter + '.')
    );
    if (matchedOpt && normalizeEscapeAnswer(matchedOpt) === submitted) {
      return true;
    }
  }

  if (floor.jenis === 'urutan_langkah') {
    const cleanSub = submitted
      .split(/->|\||,|\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' -> ');
    const cleanKey = key
      .split(/->|\||,|\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' -> ');
    if (cleanSub === cleanKey) return true;
  }

  if (floor.jenis === 'sandi_kode') {
    const cleanSubCode = submitted.replace(/[^a-z0-9]/gi, '');
    const cleanKeyCode = key.replace(/[^a-z0-9]/gi, '');
    if (cleanSubCode && cleanSubCode === cleanKeyCode) return true;
  }

  return false;
}

function recalculateEscapeTowerScores() {
  const sesi = escapeTowerStore.sesi;
  const maxGroup = Math.max(1, Math.min(8, sesi.jumlah_kelompok || 8));

  // Rank groups that reached rooftop (lantai_sekarang === 6) by durasi_detik ascending
  const finishedGroups = Object.values(escapeTowerStore.progres)
    .filter((p) => p.kelompok <= maxGroup && p.lantai_sekarang === 6 && p.durasi_detik !== null)
    .sort((a, b) => (a.durasi_detik || 999999) - (b.durasi_detik || 999999));

  finishedGroups.forEach((p, idx) => {
    p.peringkat_atap = idx + 1;
  });

  escapeTowerStore.winningGroups = finishedGroups.map((p) => p.kelompok);

  for (let g = 1; g <= 8; g++) {
    const grp = g as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    const prog = escapeTowerStore.progres[grp];
    const skorRow = escapeTowerStore.skor.find((s) => s.kelompok === grp);
    if (!prog || !skorRow) continue;

    // Speed bonus based on roof arrival rank (1st = 100% bonus, 2nd = 75%, 3rd = 50%, 4th+ = 25%)
    let speedBonus = 0;
    if (prog.lantai_sekarang === 6 && prog.peringkat_atap) {
      const rankMultipliers = [1.0, 0.75, 0.5, 0.35, 0.25, 0.2, 0.15, 0.1];
      const mult = rankMultipliers[prog.peringkat_atap - 1] ?? 0.1;
      speedBonus = Math.round(sesi.bonus_kecepatan * mult);
    }

    // Partial floor progress points if not yet on roof (each solved floor gives 15% of poin_dasar)
    const floorsSolved = Math.max(0, prog.lantai_sekarang - 1);
    const basePointsEarned =
      prog.lantai_sekarang === 6
        ? sesi.poin_dasar
        : Math.round((floorsSolved / 5) * (sesi.poin_dasar * 0.75));

    const hintPenalty = prog.hint_dipakai * sesi.pengurang_hint;
    const wrongPenalty = prog.jumlah_salah * sesi.pengurang_salah;

    const totalPoin =
      floorsSolved === 0 && prog.hint_dipakai === 0 && prog.jumlah_salah === 0
        ? 0
        : Math.max(0, basePointsEarned + speedBonus - hintPenalty - wrongPenalty);

    skorRow.total_poin = totalPoin;
    skorRow.waktu_selesai = prog.waktu_selesai;
    skorRow.durasi_detik = prog.durasi_detik;
    skorRow.hint_dipakai = prog.hint_dipakai;
    skorRow.jumlah_salah = prog.jumlah_salah;
    skorRow.peringkat = prog.peringkat_atap;
  }
}

function syncEscapeTowerWithCityOnlinePlayers() {
  const now = Date.now();
  // Bridge online citizens standing near Gedung Pencakar Langit (wx: 10.5..17.5, wy: -12.0..-7.5)
  for (const [, cityPlayer] of onlinePlayersMap.entries()) {
    if (!cityPlayer || !cityPlayer.id || now - cityPlayer.lastSeen > 40000) continue;
    const isNearSkyscraper =
      cityPlayer.wx >= 10.5 &&
      cityPlayer.wx <= 17.5 &&
      cityPlayer.wy >= -12.0 &&
      cityPlayer.wy <= -7.5;
    const isTeacherRole = cityPlayer.role === 'guru';

    const existingEntry = Object.values(escapeTowerStore.towerPlayers).find(
      (tp) =>
        tp.studentId === cityPlayer.id ||
        tp.studentName.trim().toLowerCase() === cityPlayer.name.trim().toLowerCase()
    );

    if (existingEntry) {
      existingEntry.lastSeen = Math.max(existingEntry.lastSeen, cityPlayer.lastSeen);
    } else if (isNearSkyscraper) {
      const pKey = cityPlayer.id;
      const existingGrp = isTeacherRole
        ? null
        : escapeTowerStore.studentGroupMap[pKey] || (1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);
      if (!isTeacherRole && existingGrp && !escapeTowerStore.studentGroupMap[pKey]) {
        escapeTowerStore.studentGroupMap[pKey] = existingGrp;
        const list = escapeTowerStore.groupMembers[existingGrp] || [];
        if (!list.some((m) => m.studentId === pKey)) {
          list.push({
            studentId: pKey,
            studentName: cityPlayer.name,
            className: cityPlayer.roleLabel || 'X DKV',
            gender: cityPlayer.gender === 'P' ? 'P' : 'L',
          });
          escapeTowerStore.groupMembers[existingGrp] = list;
        }
      }
      const currentFloor = existingGrp
        ? escapeTowerStore.progres[existingGrp]?.lantai_sekarang || 1
        : 1;
      escapeTowerStore.towerPlayers[pKey] = {
        studentId: pKey,
        studentName: cityPlayer.name,
        className: cityPlayer.roleLabel || (isTeacherRole ? 'Dewan Guru' : 'X DKV'),
        gender: cityPlayer.gender === 'P' ? 'P' : 'L',
        isTeacher: isTeacherRole,
        kelompok: existingGrp,
        lantai_sekarang: currentFloor,
        lastSeen: cityPlayer.lastSeen,
      };
    }
  }

  for (const [sid, p] of Object.entries(escapeTowerStore.towerPlayers)) {
    if (now - p.lastSeen > 45000) {
      delete escapeTowerStore.towerPlayers[sid];
    }
  }
}

function buildSanitizedEscapeTowerPayload(params: {
  viewerId?: string;
  isVerifiedTeacher: boolean;
  viewerGroup?: number | null;
}) {
  syncEscapeTowerWithCityOnlinePlayers();
  recalculateEscapeTowerScores();

  const { isVerifiedTeacher, viewerGroup } = params;
  const effectiveGroup = (viewerGroup ||
    (params.viewerId ? escapeTowerStore.studentGroupMap[params.viewerId] : null) ||
    1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

  const myProg = escapeTowerStore.progres[effectiveGroup];
  const myCurrentFloor = myProg?.lantai_sekarang || 1;
  const myUnlockedHints = myProg?.hint_terbuka_lantai || [];

  // CRITICAL ANTI-PEEK SECURITY:
  // 1. kunci_jawaban TIDAK PERNAH dikirim ke siswa!
  // 2. Siswa hanya bisa melihat soal & cerita untuk lantai yang sedang dikerjakan atau sudah dilewati kelompoknya.
  // 3. Hint hanya dikirim ke siswa jika kelompoknya sudah menekan "Minta Petunjuk" di lantai tersebut.
  const sanitizedKonfigurasi = escapeTowerStore.konfigurasi.map((f) => {
    if (isVerifiedTeacher) {
      return { ...f };
    }
    const isFloorUnlockedForGroup = f.nomor_lantai <= myCurrentFloor;
    const isHintUnlocked = myUnlockedHints.includes(f.nomor_lantai);

    // Shuffle steps for urutan_langkah when sent to students so it isn't pre-sorted in the answer order
    let studentOpsi = f.opsi ? [...f.opsi] : [];
    if (f.jenis === 'urutan_langkah' && studentOpsi.length > 1) {
      // Deterministic rotation based on floor number so all group members see the same initial shuffled list
      studentOpsi = studentOpsi.slice(1).concat(studentOpsi.slice(0, 1));
    }

    return {
      nomor_lantai: f.nomor_lantai,
      judul: f.judul,
      cerita: isFloorUnlockedForGroup
        ? f.cerita
        : '🔒 Lantai ini masih terkunci! Selesaikan teka-teki lantai sebelumnya terlebih dahulu.',
      soal: isFloorUnlockedForGroup
        ? f.soal
        : '🔒 Soal terkunci sampai kelompokmu berhasil membuka pintu lantai sebelumnya.',
      jenis: f.jenis,
      opsi: isFloorUnlockedForGroup ? studentOpsi : [],
      hint: isFloorUnlockedForGroup && isHintUnlocked ? f.hint : null,
      kunci_jawaban: null, // NEVER sent to students!
      batas_waktu: f.batas_waktu,
    };
  });

  // Sanitize progres: students can see which floor each group is on (for the live tower visual)
  // but CANNOT see draft_jawaban or detailed answer messages of other groups!
  const sanitizedProgres: Record<number, any> = {};
  for (let g = 1; g <= 8; g++) {
    const grp = g as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    const p = escapeTowerStore.progres[grp];
    if (!p) continue;
    const isOwnGroupOrTeacher = isVerifiedTeacher || grp === effectiveGroup;
    sanitizedProgres[grp] = {
      ...p,
      draft_jawaban: isOwnGroupOrTeacher ? p.draft_jawaban : '',
      pesan_jawaban_terakhir: isOwnGroupOrTeacher ? p.pesan_jawaban_terakhir : '',
    };
  }

  // Ensure all online student towerPlayers are reflected in groupMembers
  Object.values(escapeTowerStore.towerPlayers).forEach((tp) => {
    if (!tp.isTeacher && tp.kelompok && tp.kelompok >= 1 && tp.kelompok <= 8) {
      const grp = tp.kelompok;
      escapeTowerStore.studentGroupMap[tp.studentId] = grp;
      const list = escapeTowerStore.groupMembers[grp] || [];
      if (!list.some((m) => m.studentId === tp.studentId)) {
        list.push({
          studentId: tp.studentId,
          studentName: tp.studentName,
          className: tp.className || 'X DKV',
          gender: tp.gender === 'P' ? 'P' : 'L',
        });
        escapeTowerStore.groupMembers[grp] = list;
      }
    }
  });

  const enrichedGroupMembers: Record<number, any[]> = {};
  for (let g = 1; g <= 8; g++) {
    const members = escapeTowerStore.groupMembers[g] || [];
    enrichedGroupMembers[g] = members.map((m) => ({
      ...m,
      isOnline: Boolean(
        escapeTowerStore.towerPlayers[m.studentId] ||
          Object.values(escapeTowerStore.towerPlayers).some(
            (tp) => tp.studentName.trim().toLowerCase() === m.studentName.trim().toLowerCase()
          )
      ),
    }));
  }

  const filteredChats = isVerifiedTeacher
    ? escapeTowerStore.groupChats.slice(-80)
    : escapeTowerStore.groupChats.filter((c) => c.kelompok === effectiveGroup).slice(-50);

  return {
    sesi: escapeTowerStore.sesi,
    konfigurasi: sanitizedKonfigurasi,
    progres: sanitizedProgres,
    skor: escapeTowerStore.skor,
    studentGroupMap: escapeTowerStore.studentGroupMap,
    groupMembers: enrichedGroupMembers,
    towerPlayers: Object.values(escapeTowerStore.towerPlayers),
    groupChats: filteredChats,
    winningGroups: escapeTowerStore.winningGroups,
    serverTime: Date.now(),
  };
}

// GET /api/escape-tower/state (Polled every 2-3s + SSE / Mesh real-time trigger)
app.get('/api/escape-tower/state', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const viewerId = String(req.query.studentId || '').trim();
  const viewerName = String(req.query.studentName || '').trim();
  const viewerClass = String(req.query.className || 'X DKV').trim();
  const viewerGender: 'L' | 'P' = String(req.query.gender || 'L').trim() === 'P' ? 'P' : 'L';
  const isTeacherFlag = req.query.isTeacher === 'true';
  const studentNumber = String(req.query.studentNumber || '').trim();
  const viewerGroup = req.query.kelompok ? Number(req.query.kelompok) : null;

  const isVerifiedTeacher = verifyTeacherAccountServerSide({
    teacherId: viewerId,
    teacherName: viewerName,
    isTeacher: isTeacherFlag,
    studentNumber,
  });

  const now = Date.now();
  if (viewerId && viewerName) {
    const existingPlayer = escapeTowerStore.towerPlayers[viewerId];
    const resolvedGroup = isVerifiedTeacher
      ? null
      : ((viewerGroup && viewerGroup >= 1 && viewerGroup <= 8
          ? viewerGroup
          : existingPlayer?.kelompok || escapeTowerStore.studentGroupMap[viewerId] || 1) as
          | 1
          | 2
          | 3
          | 4
          | 5
          | 6
          | 7
          | 8);

    if (!isVerifiedTeacher && resolvedGroup) {
      escapeTowerStore.studentGroupMap[viewerId] = resolvedGroup;
      for (let g = 1; g <= 8; g++) {
        if (g !== resolvedGroup) {
          escapeTowerStore.groupMembers[g] = (escapeTowerStore.groupMembers[g] || []).filter(
            (m) => m.studentId !== viewerId
          );
        }
      }
      const grpList = escapeTowerStore.groupMembers[resolvedGroup] || [];
      if (!grpList.some((m) => m.studentId === viewerId)) {
        grpList.push({
          studentId: viewerId,
          studentName: viewerName,
          className: viewerClass || 'X DKV',
          gender: viewerGender,
        });
        escapeTowerStore.groupMembers[resolvedGroup] = grpList;
      }
    }

    const currentFloor = resolvedGroup
      ? escapeTowerStore.progres[resolvedGroup]?.lantai_sekarang || 1
      : 1;

    escapeTowerStore.towerPlayers[viewerId] = {
      studentId: viewerId,
      studentName: viewerName,
      className: viewerClass || (isVerifiedTeacher ? 'Dewan Guru' : 'X DKV'),
      gender: viewerGender,
      isTeacher: isVerifiedTeacher,
      kelompok: resolvedGroup,
      lantai_sekarang: currentFloor,
      lastSeen: now,
    };
  }

  return res.json({
    success: true,
    isVerifiedTeacher,
    data: buildSanitizedEscapeTowerPayload({
      viewerId,
      isVerifiedTeacher,
      viewerGroup,
    }),
  });
});

// POST /api/escape-tower/teacher-action (Strictly verified on server!)
app.post('/api/escape-tower/teacher-action', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const {
    teacherId,
    teacherName,
    isTeacher,
    studentNumber,
    actionType,
    konfigurasi,
    pengaturan,
    targetStudentId,
    targetStudentName,
    targetStudentClass,
    targetStudentGender,
    targetGroup,
  } = req.body || {};

  const isVerifiedTeacher = verifyTeacherAccountServerSide({
    teacherId,
    teacherName,
    isTeacher,
    studentNumber,
  });

  if (!isVerifiedTeacher) {
    return res.status(403).json({
      success: false,
      error:
        'Akses Ditolak (Server Security): Hanya akun Guru resmi yang diizinkan mengontrol Panel Guru Escape Room Menara!',
    });
  }

  const now = Date.now();
  const nowStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  if (actionType === 'save_konfigurasi') {
    if (Array.isArray(konfigurasi) && konfigurasi.length === 5) {
      escapeTowerStore.konfigurasi = konfigurasi.map((f: any, idx: number) => ({
        nomor_lantai: (idx + 1) as 1 | 2 | 3 | 4 | 5,
        judul: String(f.judul || `Lantai ${idx + 1}`).trim(),
        cerita: String(f.cerita || '').trim(),
        soal: String(f.soal || '').trim(),
        jenis: (['pilihan_ganda', 'isian_singkat', 'urutan_langkah', 'sandi_kode'].includes(f.jenis)
          ? f.jenis
          : 'isian_singkat') as 'pilihan_ganda' | 'isian_singkat' | 'urutan_langkah' | 'sandi_kode',
        opsi: Array.isArray(f.opsi) ? f.opsi.map((o: any) => String(o)) : [],
        hint: String(f.hint || '').trim(),
        kunci_jawaban: String(f.kunci_jawaban || '').trim(),
        batas_waktu: Math.max(15, Math.min(900, Number(f.batas_waktu) || 120)),
      }));
    }
    if (pengaturan && typeof pengaturan === 'object') {
      escapeTowerStore.sesi.jumlah_kelompok = Math.max(
        1,
        Math.min(8, Number(pengaturan.jumlah_kelompok) || 8)
      );
      escapeTowerStore.sesi.poin_dasar = Math.max(
        10,
        Math.min(500, Number(pengaturan.poin_dasar) || 100)
      );
      escapeTowerStore.sesi.bonus_kecepatan = Math.max(
        0,
        Math.min(300, Number(pengaturan.bonus_kecepatan) || 50)
      );
      escapeTowerStore.sesi.pengurang_hint = Math.max(
        0,
        Math.min(100, Number(pengaturan.pengurang_hint) || 10)
      );
      escapeTowerStore.sesi.pengurang_salah = Math.max(
        0,
        Math.min(100, Number(pengaturan.pengurang_salah) || 5)
      );
      escapeTowerStore.sesi.penalti_waktu_salah_detik = Math.max(
        1,
        Math.min(60, Number(pengaturan.penalti_waktu_salah_detik) || 5)
      );
    }
    recalculateEscapeTowerScores();
    saveEscapeTowerToFile(true);
  } else if (actionType === 'start_game') {
    if (escapeTowerStore.sesi.status === 'menunggu' || escapeTowerStore.sesi.status === 'selesai') {
      const nextNum =
        (parseInt(escapeTowerStore.sesi.id_sesi.replace('escape-', ''), 10) || 1) +
        (escapeTowerStore.sesi.status === 'selesai' ? 1 : 0);
      const sesiId = `escape-${nextNum}`;
      escapeTowerStore.sesi.id_sesi = sesiId;
      escapeTowerStore.sesi.waktu_mulai = nowStr;
      escapeTowerStore.sesi.waktu_mulai_ms = now;
      escapeTowerStore.sesi.waktu_jeda_ms = null;
      escapeTowerStore.sesi.total_durasi_jeda_ms = 0;
      escapeTowerStore.sesi.guru_pembuat = teacherName || 'Guru DKV';
      escapeTowerStore.winningGroups = [];

      for (let g = 1; g <= 8; g++) {
        const grp = g as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
        escapeTowerStore.progres[grp] = {
          id_sesi: sesiId,
          kelompok: grp,
          lantai_sekarang: 1,
          jumlah_salah: 0,
          hint_dipakai: 0,
          hint_terbuka_lantai: [],
          waktu_selesai: '-',
          durasi_detik: null,
          peringkat_atap: null,
          penalti_waktu_detik: 0,
          cooldown_sampai_ms: null,
          draft_jawaban: '',
          terakhir_dijawab_oleh: '',
          status_jawaban_terakhir: null,
          pesan_jawaban_terakhir: '',
        };
      }
      Object.values(escapeTowerStore.towerPlayers).forEach((tp) => {
        tp.lantai_sekarang = 1;
      });
    }
    escapeTowerStore.sesi.status = 'berjalan';
    if (!escapeTowerStore.sesi.waktu_mulai_ms) {
      escapeTowerStore.sesi.waktu_mulai_ms = now;
    }
    recalculateEscapeTowerScores();
    saveEscapeTowerToFile(true);
  } else if (actionType === 'pause_game') {
    if (escapeTowerStore.sesi.status === 'berjalan') {
      escapeTowerStore.sesi.status = 'jeda';
      escapeTowerStore.sesi.waktu_jeda_ms = now;
      saveEscapeTowerToFile(true);
    }
  } else if (actionType === 'resume_game') {
    if (escapeTowerStore.sesi.status === 'jeda') {
      if (escapeTowerStore.sesi.waktu_jeda_ms) {
        escapeTowerStore.sesi.total_durasi_jeda_ms +=
          now - escapeTowerStore.sesi.waktu_jeda_ms;
      }
      escapeTowerStore.sesi.waktu_jeda_ms = null;
      escapeTowerStore.sesi.status = 'berjalan';
      saveEscapeTowerToFile(true);
    }
  } else if (actionType === 'end_game') {
    escapeTowerStore.sesi.status = 'selesai';
    escapeTowerStore.sesi.waktu_jeda_ms = null;
    recalculateEscapeTowerScores();
    saveEscapeTowerToFile(true);
  } else if (actionType === 'reset_game') {
    const nextNum = (parseInt(escapeTowerStore.sesi.id_sesi.replace('escape-', ''), 10) || 1) + 1;
    const newId = `escape-${nextNum}`;
    escapeTowerStore.sesi.id_sesi = newId;
    escapeTowerStore.sesi.status = 'menunggu';
    escapeTowerStore.sesi.waktu_mulai = nowStr;
    escapeTowerStore.sesi.waktu_mulai_ms = null;
    escapeTowerStore.sesi.waktu_jeda_ms = null;
    escapeTowerStore.sesi.total_durasi_jeda_ms = 0;
    escapeTowerStore.winningGroups = [];

    for (let g = 1; g <= 8; g++) {
      const grp = g as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
      escapeTowerStore.progres[grp] = {
        id_sesi: newId,
        kelompok: grp,
        lantai_sekarang: 1,
        jumlah_salah: 0,
        hint_dipakai: 0,
        hint_terbuka_lantai: [],
        waktu_selesai: '-',
        durasi_detik: null,
        peringkat_atap: null,
        penalti_waktu_detik: 0,
        cooldown_sampai_ms: null,
        draft_jawaban: '',
        terakhir_dijawab_oleh: '',
        status_jawaban_terakhir: null,
        pesan_jawaban_terakhir: '',
      };
    }
    Object.values(escapeTowerStore.towerPlayers).forEach((tp) => {
      tp.lantai_sekarang = 1;
    });
    recalculateEscapeTowerScores();
    saveEscapeTowerToFile(true);
  } else if (actionType === 'assign_group') {
    const grp = Math.max(1, Math.min(8, Number(targetGroup) || 1)) as
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8;
    const sid = String(targetStudentId || '').trim();
    if (sid) {
      escapeTowerStore.studentGroupMap[sid] = grp;
      for (let g = 1; g <= 8; g++) {
        escapeTowerStore.groupMembers[g] = (escapeTowerStore.groupMembers[g] || []).filter(
          (m) => m.studentId !== sid
        );
      }
      escapeTowerStore.groupMembers[grp].push({
        studentId: sid,
        studentName: String(targetStudentName || 'Siswa DKV'),
        className: String(targetStudentClass || 'X DKV'),
        gender: targetStudentGender === 'P' ? 'P' : 'L',
      });
      if (escapeTowerStore.towerPlayers[sid]) {
        escapeTowerStore.towerPlayers[sid].kelompok = grp;
        escapeTowerStore.towerPlayers[sid].lantai_sekarang =
          escapeTowerStore.progres[grp]?.lantai_sekarang || 1;
      }
      saveEscapeTowerToFile(true);
    }
  }

  broadcastPresence({
    type: 'escape_tower_tick',
    sesiId: escapeTowerStore.sesi.id_sesi,
    status: escapeTowerStore.sesi.status,
    timestamp: now,
  });

  return res.json({
    success: true,
    isVerifiedTeacher: true,
    data: buildSanitizedEscapeTowerPayload({
      viewerId: teacherId,
      isVerifiedTeacher: true,
    }),
  });
});

// POST /api/escape-tower/student-action (Join group, update shared draft, request hint, submit answer, group chat)
app.post('/api/escape-tower/student-action', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const {
    studentId,
    studentName,
    className,
    gender,
    isTeacher,
    studentNumber,
    actionType,
    kelompok,
    jawaban,
    draft_jawaban,
    chatContent,
  } = req.body || {};

  if (!studentId) {
    return res.status(400).json({ success: false, error: 'ID pengguna diperlukan.' });
  }

  const sid = String(studentId);
  const sName = String(studentName || 'Siswa DKV');
  const sClass = String(className || 'X DKV');
  const sGender: 'L' | 'P' = gender === 'P' ? 'P' : 'L';
  const verifiedTeacher = verifyTeacherAccountServerSide({
    teacherId: sid,
    teacherName: sName,
    isTeacher,
    studentNumber,
  });

  const now = Date.now();
  const nowStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const maxAllowedGroup = Math.max(1, Math.min(8, escapeTowerStore.sesi.jumlah_kelompok || 8));

  if (!escapeTowerStore.towerPlayers[sid]) {
    const existingGrp = verifiedTeacher
      ? null
      : escapeTowerStore.studentGroupMap[sid] || (1 as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);
    escapeTowerStore.towerPlayers[sid] = {
      studentId: sid,
      studentName: sName,
      className: sClass,
      gender: sGender,
      isTeacher: verifiedTeacher,
      kelompok: existingGrp,
      lantai_sekarang: existingGrp
        ? escapeTowerStore.progres[existingGrp]?.lantai_sekarang || 1
        : 1,
      lastSeen: now,
    };
  } else {
    escapeTowerStore.towerPlayers[sid].lastSeen = now;
    escapeTowerStore.towerPlayers[sid].studentName = sName;
    escapeTowerStore.towerPlayers[sid].isTeacher = verifiedTeacher;
  }

  const player = escapeTowerStore.towerPlayers[sid];
  let answerResult: 'benar' | 'salah' | null = null;
  let answerFeedback = '';
  let unlockedFloor: number | null = null;
  let reachedRoof = false;

  if (actionType === 'join_group') {
    if (verifiedTeacher) {
      delete escapeTowerStore.studentGroupMap[sid];
      for (let g = 1; g <= 8; g++) {
        escapeTowerStore.groupMembers[g] = (escapeTowerStore.groupMembers[g] || []).filter(
          (m) => m.studentId !== sid
        );
      }
      player.kelompok = null;
    } else {
      const grp = Math.max(1, Math.min(maxAllowedGroup, Number(kelompok) || 1)) as
        | 1
        | 2
        | 3
        | 4
        | 5
        | 6
        | 7
        | 8;
      escapeTowerStore.studentGroupMap[sid] = grp;
      for (let g = 1; g <= 8; g++) {
        escapeTowerStore.groupMembers[g] = (escapeTowerStore.groupMembers[g] || []).filter(
          (m) => m.studentId !== sid
        );
      }
      escapeTowerStore.groupMembers[grp].push({
        studentId: sid,
        studentName: sName,
        className: sClass,
        gender: sGender,
      });
      player.kelompok = grp;
      player.lantai_sekarang = escapeTowerStore.progres[grp]?.lantai_sekarang || 1;
    }
    saveEscapeTowerToFile(true);
  } else if (actionType === 'sync_draft') {
    const grp =
      player.kelompok ||
      escapeTowerStore.studentGroupMap[sid] ||
      (Math.max(1, Math.min(8, Number(kelompok) || 1)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);
    if (grp && escapeTowerStore.progres[grp]) {
      escapeTowerStore.progres[grp].draft_jawaban = String(draft_jawaban ?? '').slice(0, 500);
      escapeTowerStore.progres[grp].terakhir_dijawab_oleh = sName;
    }
  } else if (actionType === 'request_hint') {
    const grp =
      player.kelompok ||
      escapeTowerStore.studentGroupMap[sid] ||
      (Math.max(1, Math.min(8, Number(kelompok) || 1)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);
    const prog = grp ? escapeTowerStore.progres[grp] : null;
    if (!prog) {
      return res.status(400).json({ success: false, error: 'Pilih kelompok terlebih dahulu.' });
    }
    if (escapeTowerStore.sesi.status !== 'berjalan') {
      return res.status(400).json({
        success: false,
        error: 'Permainan harus berstatus BERJALAN untuk membuka petunjuk (Hint).',
      });
    }
    if (prog.lantai_sekarang <= 5) {
      const currentFl = prog.lantai_sekarang as 1 | 2 | 3 | 4 | 5;
      if (!prog.hint_terbuka_lantai.includes(currentFl)) {
        prog.hint_terbuka_lantai.push(currentFl);
        prog.hint_dipakai += 1;
        recalculateEscapeTowerScores();
        saveEscapeTowerToFile(true);
      }
    }
  } else if (actionType === 'submit_answer') {
    const grp =
      player.kelompok ||
      escapeTowerStore.studentGroupMap[sid] ||
      (Math.max(1, Math.min(8, Number(kelompok) || 1)) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8);
    const prog = grp ? escapeTowerStore.progres[grp] : null;
    if (!prog) {
      return res.status(400).json({ success: false, error: 'Pilih kelompok terlebih dahulu.' });
    }
    if (escapeTowerStore.sesi.status !== 'berjalan') {
      return res.status(400).json({
        success: false,
        error:
          escapeTowerStore.sesi.status === 'jeda'
            ? '⏸️ Permainan sedang dijeda oleh Guru.'
            : '⏳ Permainan belum dimulai oleh Guru.',
      });
    }
    if (prog.lantai_sekarang >= 6) {
      return res.status(400).json({
        success: false,
        error: '🏆 Kelompokmu sudah berhasil membuka Pintu Atap!',
      });
    }
    if (prog.cooldown_sampai_ms && now < prog.cooldown_sampai_ms) {
      const waitSec = Math.ceil((prog.cooldown_sampai_ms - now) / 1000);
      return res.status(400).json({
        success: false,
        error: `⏳ Penalti waktu aktif! Tunggu ${waitSec} detik sebelum mencoba lagi.`,
      });
    }

    const currentFloorNum = prog.lantai_sekarang as 1 | 2 | 3 | 4 | 5;
    const floorConfig = escapeTowerStore.konfigurasi.find(
      (f) => f.nomor_lantai === currentFloorNum
    );
    if (!floorConfig) {
      return res.status(400).json({ success: false, error: 'Konfigurasi lantai tidak ditemukan.' });
    }

    const isCorrect = checkEscapeFloorAnswerServerSide(floorConfig, String(jawaban || ''));
    if (isCorrect) {
      answerResult = 'benar';
      unlockedFloor = currentFloorNum + 1;
      prog.lantai_sekarang = (currentFloorNum + 1) as 1 | 2 | 3 | 4 | 5 | 6;
      prog.draft_jawaban = '';
      prog.cooldown_sampai_ms = null;
      prog.terakhir_dijawab_oleh = sName;
      prog.status_jawaban_terakhir = 'benar';

      // Update all online members of this group to the new floor
      Object.values(escapeTowerStore.towerPlayers).forEach((tp) => {
        if (tp.kelompok === grp) {
          tp.lantai_sekarang = prog.lantai_sekarang;
        }
      });

      if (prog.lantai_sekarang === 6) {
        reachedRoof = true;
        prog.waktu_selesai = nowStr;
        const startMs = escapeTowerStore.sesi.waktu_mulai_ms || now;
        const rawElapsedSec = Math.max(
          1,
          Math.round((now - startMs - escapeTowerStore.sesi.total_durasi_jeda_ms) / 1000)
        );
        prog.durasi_detik = rawElapsedSec + prog.penalti_waktu_detik;
        prog.pesan_jawaban_terakhir = `🎉 LUAR BIASA! ${sName} membuka PINTU ATAP untuk Kelompok ${grp}!`;
        answerFeedback = prog.pesan_jawaban_terakhir;
      } else {
        prog.pesan_jawaban_terakhir = `✅ Jawaban Benar oleh ${sName}! Pintu Lift Lantai ${prog.lantai_sekarang} terbuka!`;
        answerFeedback = prog.pesan_jawaban_terakhir;
      }
      recalculateEscapeTowerScores();
      saveEscapeTowerToFile(true);
    } else {
      answerResult = 'salah';
      const penaltiSec = escapeTowerStore.sesi.penalti_waktu_salah_detik || 5;
      prog.jumlah_salah += 1;
      prog.penalti_waktu_detik += penaltiSec;
      prog.cooldown_sampai_ms = now + penaltiSec * 1000;
      prog.terakhir_dijawab_oleh = sName;
      prog.status_jawaban_terakhir = 'salah';
      prog.pesan_jawaban_terakhir = `❌ Jawaban belum tepat, coba lagi! (Penalti +${penaltiSec} detik & -${escapeTowerStore.sesi.pengurang_salah} poin)`;
      answerFeedback = prog.pesan_jawaban_terakhir;
      recalculateEscapeTowerScores();
      saveEscapeTowerToFile(true);
    }
  } else if (actionType === 'send_group_chat') {
    const grp =
      (kelompok ? (Math.max(1, Math.min(8, Number(kelompok))) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) : null) ||
      player.kelompok ||
      escapeTowerStore.studentGroupMap[sid];
    const text = String(chatContent || '').trim().slice(0, 160);
    if (!grp || !text) {
      return res.status(400).json({
        success: false,
        error: 'Pilih kelompok terlebih dahulu dan pastikan pesan tidak kosong.',
      });
    }
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    escapeTowerStore.groupChats.push({
      id: `echat-${now}-${Math.random().toString(36).slice(2, 6)}`,
      kelompok: grp,
      senderId: sid,
      senderName: sName,
      content: text,
      timestamp: `${hh}.${mm}`,
      createdAt: now,
    });
    if (escapeTowerStore.groupChats.length > 200) {
      escapeTowerStore.groupChats = escapeTowerStore.groupChats.slice(-200);
    }
    saveEscapeTowerToFile();
  }

  broadcastPresence({
    type: 'escape_tower_tick',
    sesiId: escapeTowerStore.sesi.id_sesi,
    status: escapeTowerStore.sesi.status,
    timestamp: now,
  });

  return res.json({
    success: true,
    hasil: answerResult,
    message: answerFeedback,
    unlockedFloor,
    reachedRoof,
    data: buildSanitizedEscapeTowerPayload({
      viewerId: sid,
      isVerifiedTeacher: verifiedTeacher,
      viewerGroup: player.kelompok,
    }),
  });
});

// ============================================================================
// MENARA ASESMEN INDIVIDU (TKA / CBT SUMATIF MANDIRI BERBASIS LOBI • REFLEKSIA TIMUR)
//Lokasi: Gedung Biru Modern Tower di Refleksia Timur (wx: 9.5, wy: -3.5)
//Sheet Baru: Asesmen_Sesi, Asesmen_BankSoal, Asesmen_Stimulus, Asesmen_PaketSiswa, Asesmen_Jawaban, Asesmen_Hasil
// ============================================================================
const MENARA_ASESMEN_FILE_PATH = path.join(__dirname, 'server_menara_asesmen.json');

interface ServerAsesmenKategoriStatement {
  id_pernyataan: string;
  teks: string;
  label_opsi?: [string, string];
  kunci: 'A' | 'B'; // 'A' = Benar/Sesuai, 'B' = Salah/Tidak Sesuai
}

interface ServerAsesmenStimulus {
  id_stimulus: string;
  jenis: 'teks' | 'tabel' | 'grafik';
  judul?: string;
  isi: string;
}

interface ServerAsesmenSoal {
  id_soal: string;
  id_sesi: string;
  tp: string;
  tp_label?: string;
  jenis: 'pg_tunggal' | 'pg_mcma' | 'pg_kategori';
  tipe_penyajian: 'tunggal' | 'grup';
  id_stimulus: string;
  teks_soal: string;
  opsi: string[];
  pernyataan_kategori?: ServerAsesmenKategoriStatement[];
  label_kategori?: [string, string];
  poin_soal?: number;
  kunci_jawaban: string;
  pembahasan: string;
}

interface ServerAsesmenSesi {
  id_sesi: string;
  judul_asesmen: string;
  tp_terpilih: string[];
  tp_detail: Array<{
    id_tp: string;
    mata_pelajaran: string;
    kelas: string;
    tujuan_pembelajaran: string;
    isi_materi: string;
  }>;
  durasi: number; // menit
  status: 'draf' | 'lobi' | 'berjalan' | 'jeda' | 'selesai';
  waktu_mulai: string;
  waktu_mulai_ms: number | null;
  waktu_jeda_ms: number | null;
  total_durasi_jeda_ms: number;
  tambahan_waktu_menit: number;
  jumlah_soal: number;
  komposisi_jenis: {
    pg_tunggal: number;
    pg_mcma: number;
    pg_kategori: number;
  };
  komposisi_penyajian: {
    tunggal: number;
    grup: number;
  };
  poin_per_jenis: {
    pg_tunggal: number;
    pg_mcma: number;
    pg_kategori_per_pernyataan: number;
  };
  mcma_kredit_parsial: boolean;
  acak_soal: boolean;
  acak_opsi: boolean;
  izinkan_menyusul: boolean;
  tampilkan_pembahasan: boolean;
  xp_bonus_selesai: number;
  guru_pembuat?: string;
}

interface ServerAsesmenPaketSiswa {
  id_sesi: string;
  siswa: string;
  nama_siswa: string;
  kelas: string;
  urutan_soal: string[];
  urutan_opsi_map: Record<string, number[]>;
  waktu_paket_dibuat: string;
  session_token: string;
}

interface ServerAsesmenJawaban {
  id_sesi: string;
  siswa: string;
  nama_siswa: string;
  id_soal: string;
  jawaban: string;
  ragu: boolean;
  waktu: string;
}

interface ServerAsesmenHasil {
  id_sesi: string;
  siswa: string;
  nama_siswa: string;
  kelas: string;
  nilai: number;
  poin_diperoleh: number;
  poin_maksimal: number;
  jumlah_benar: number;
  jumlah_soal: number;
  durasi: number;
  keluar_tab: number;
  waktu_selesai: string;
  rincian_per_tp: Record<string, { benar: number; total: number; persentase: number }>;
}

interface ServerAsesmenStudentLive {
  studentId: string;
  studentName: string;
  className: string;
  gender: 'L' | 'P';
  status_peserta: 'di_lobi' | 'mengerjakan' | 'selesai';
  soal_terjawab: number;
  soal_ragu: number;
  total_soal: number;
  nomor_soal_aktif: number;
  keluar_tab: number;
  log_keluar_tab: string[];
  waktu_gabung: string;
  waktu_mulai_kerja_ms: number | null;
  waktu_selesai: string | null;
  nilai_akhir: number | null;
  lastSeen: number;
  activeSessionToken: string;
}

interface ServerMenaraAsesmenStore {
  sesi: ServerAsesmenSesi;
  stimulusList: ServerAsesmenStimulus[];
  bankSoal: ServerAsesmenSoal[];
  paketByStudent: Record<string, ServerAsesmenPaketSiswa>;
  jawabanByStudent: Record<string, Record<string, ServerAsesmenJawaban>>;
  hasilByStudent: Record<string, ServerAsesmenHasil>;
  pesertaLive: Record<string, ServerAsesmenStudentLive>;
}

function createDefaultAsesmenStimulusAndQuestions(idSesi: string): {
  stimulusList: ServerAsesmenStimulus[];
  bankSoal: ServerAsesmenSoal[];
} {
  const stimulusList: ServerAsesmenStimulus[] = [
    {
      id_stimulus: 'STIM-TABEL-01',
      jenis: 'tabel',
      judul: 'Tabel Spesifikasi Teknis Produksi Karya Desain Publikasi (Cetak vs Digital)',
      isi: JSON.stringify({
        headers: ['Parameter Teknis', 'Media Cetak (Poster A3)', 'Media Digital (Feed Instagram)'],
        rows: [
          ['Mode Warna Utama', 'CMYK (Cyan, Magenta, Yellow, Key)', 'RGB (Red, Green, Blue)'],
          ['Resolusi Standar', '300 DPI / PPI', '72 - 144 PPI (1080 x 1350 px)'],
          ['Margin Aman & Bleed', 'Bleed 3 mm + Margin Dalam 15 mm', 'Safe Zone 120 px dari tepi kanvas'],
          ['Format File Akhir', 'PDF Print-Ready / TIFF', 'PNG-24 / JPEG Kualitas Tinggi / WebP'],
        ],
      }),
    },
    {
      id_stimulus: 'STIM-GRAFIK-02',
      jenis: 'grafik',
      judul: 'Grafik Hasil Uji Keterbacaan Poster (Tes 3 Detik) pada 100 Audiens Warga Kota',
      isi: JSON.stringify({
        title: 'Persentase Audiens yang Langsung Menangkap Pesan Utama Poster dalam 3 Detik',
        unit: '% Audiens',
        bars: [
          { label: 'Desain A (Hierarki + White Space 35%)', value: 92, color: '#10b981' },
          { label: 'Desain B (Kontras Tinggi Tanpa Grid)', value: 64, color: '#38bdf8' },
          { label: 'Desain C (5 Jenis Font Dekoratif)', value: 31, color: '#f59e0b' },
          { label: 'Desain D (Teks Penuh Tanpa Ruang Kosong)', value: 18, color: '#ef4444' },
        ],
      }),
    },
  ];

  const bankSoal: ServerAsesmenSoal[] = [
    {
      id_soal: 'SOAL-01',
      id_sesi: idSesi,
      tp: 'tp-bm-001',
      tp_label:
        'Menerapkan prinsip keseimbangan, kontras, penekanan (emphasis), dan hierarki tipografi dalam merancang poster publikasi digital yang komunikatif.',
      jenis: 'pg_tunggal',
      tipe_penyajian: 'tunggal',
      id_stimulus: '',
      teks_soal:
        'Seorang desainer komunikasi visual ingin memastikan informasi waktu dan tempat acara pada poster kegiatan sekolah langsung terbaca jelas setelah judul utama. Langkah pengaturan hierarki visual manakah yang paling tepat?',
      opsi: [
        'Menempatkan informasi waktu dan tempat dengan ukuran subjudul yang kontras di bawah Headline serta memberi ruang kosong (white space) di sekelilingnya',
        'Menyamakan ukuran seluruh huruf dari judul hingga catatan kaki agar terlihat seragam',
        'Menggunakan huruf sambung dekoratif berukuran sangat kecil dengan warna yang mirip latar belakang',
        'Memenuhi seluruh sudut kanvas dengan ilustrasi ramai tanpa menyisakan margin tepi',
      ],
      kunci_jawaban: '0',
      pembahasan:
        'Hierarki visual bekerja dengan membedakan ukuran dan kontras antara Headline, Subjudul (waktu/tempat), dan Body Text, didukung white space agar mata audiens mudah memindai informasi.',
    },
    {
      id_soal: 'SOAL-02',
      id_sesi: idSesi,
      tp: 'tp-bm-001',
      tp_label:
        'Menerapkan prinsip keseimbangan, kontras, penekanan (emphasis), dan hierarki tipografi dalam merancang poster publikasi digital yang komunikatif.',
      jenis: 'pg_mcma',
      tipe_penyajian: 'tunggal',
      id_stimulus: '',
      teks_soal:
        'Pilihlah SEMUA tindakan yang TEPAT ketika menerapkan sistem Grid dan White Space pada perancangan poster publikasi digital! (Jawaban benar lebih dari satu)',
      opsi: [
        'Menjaga konsistensi batas margin kiri dan kanan agar susunan teks tampak rapi dan terstruktur',
        'Menyisakan ruang negatif (white space) di sekitar elemen utama untuk meningkatkan fokus baca audiens',
        'Menghapus seluruh jarak antarbaris (leading) sehingga baris teks saling bertumpukan',
        'Mengelompokkan informasi yang saling berkaitan (prinsip proximity) ke dalam modul grid yang jelas',
      ],
      kunci_jawaban: JSON.stringify([0, 1, 3]),
      pembahasan:
        'Penerapan Grid System yang baik mencakup konsistensi margin (opsi A), pemanfaatan white space untuk fokus visual (opsi B), dan pengelompokan elemen terkait/proximity (opsi D). Menghapus leading justru merusak keterbacaan.',
    },
    {
      id_soal: 'SOAL-03',
      id_sesi: idSesi,
      tp: 'obj-1',
      tp_label:
        'Memahami alur kerja Input-Process-Output (IPO) dan struktur file/folder terstandar pada produksi karya DKV.',
      jenis: 'pg_kategori',
      tipe_penyajian: 'tunggal',
      id_stimulus: '',
      teks_soal:
        'Tentukan apakah setiap pernyataan mengenai manajemen alur kerja produksi desain (Input - Process - Output) berikut BENAR atau SALAH!',
      opsi: [],
      label_kategori: ['Benar', 'Salah'],
      pernyataan_kategori: [
        {
          id_pernyataan: 'p1',
          teks: 'Brief klien, aset logo mentah, dan referensi palet warna termasuk dalam tahapan Input pada produksi desain.',
          label_opsi: ['Benar', 'Salah'],
          kunci: 'A',
        },
        {
          id_pernyataan: 'p2',
          teks: 'Menyimpan seluruh file proyek di satu folder acak bernama "Campuran_Baru_Fix_Banget" merupakan standar penamaan file industri DKV.',
          label_opsi: ['Benar', 'Salah'],
          kunci: 'B',
        },
        {
          id_pernyataan: 'p3',
          teks: 'Tahap ekspor karya ke format cetak (PDF/CMYK) atau layar (PNG/RGB) merupakan bagian dari tahapan Output.',
          label_opsi: ['Benar', 'Salah'],
          kunci: 'A',
        },
      ],
      kunci_jawaban: JSON.stringify({ p1: 'A', p2: 'B', p3: 'A' }),
      pembahasan:
        'Pernyataan 1 Benar (brief & aset mentah adalah Input). Pernyataan 2 Salah (penamaan file harus terstruktur per tanggal/versi). Pernyataan 3 Benar (ekspor akhir adalah Output).',
    },
    {
      id_soal: 'SOAL-04',
      id_sesi: idSesi,
      tp: 'tp-bm-001',
      tp_label:
        'Menerapkan prinsip keseimbangan, kontras, penekanan (emphasis), dan hierarki tipografi dalam merancang poster publikasi digital yang komunikatif.',
      jenis: 'pg_tunggal',
      tipe_penyajian: 'grup',
      id_stimulus: 'STIM-TABEL-01',
      teks_soal:
        'Berdasarkan Tabel Spesifikasi Teknis Produksi Karya di samping, kombinasi pengaturan manakah yang WAJIB digunakan jika siswa DKV ingin mencetak poster ukuran A3 di mesin percetakan offset?',
      opsi: [
        'Mode warna CMYK, resolusi 300 DPI, dilengkapi Bleed 3 mm dalam format PDF Print-Ready',
        'Mode warna RGB, resolusi 72 PPI, tanpa area bleed dalam format WebP',
        'Mode warna CMYK dengan resolusi 72 PPI dan ukuran 1080 x 1350 piksel',
        'Mode warna RGB dengan bleed 3 mm dan kompresi JPEG ukuran rendah',
      ],
      kunci_jawaban: '0',
      pembahasan:
        'Sesuai tabel spesifikasi, produksi cetak Poster A3 memerlukan mode warna tinta CMYK, resolusi tajam 300 DPI, serta area potong Bleed 3 mm dalam format PDF Print-Ready.',
    },
    {
      id_soal: 'SOAL-05',
      id_sesi: idSesi,
      tp: 'tp-bm-001',
      tp_label:
        'Menerapkan prinsip keseimbangan, kontras, penekanan (emphasis), dan hierarki tipografi dalam merancang poster publikasi digital yang komunikatif.',
      jenis: 'pg_kategori',
      tipe_penyajian: 'grup',
      id_stimulus: 'STIM-TABEL-01',
      teks_soal:
        'Berdasarkan Tabel Spesifikasi Teknis Produksi Karya tersebut, tentukan apakah keputusan produksi berikut SESUAI atau TIDAK SESUAI!',
      opsi: [],
      label_kategori: ['Sesuai', 'Tidak Sesuai'],
      pernyataan_kategori: [
        {
          id_pernyataan: 'p1',
          teks: 'Menggunakan mode warna RGB dan format PNG-24 untuk konten publikasi di Feed Instagram agar warna tampil cerah di layar HP.',
          label_opsi: ['Sesuai', 'Tidak Sesuai'],
          kunci: 'A',
        },
        {
          id_pernyataan: 'p2',
          teks: 'Meletakkan teks judul penting tepat di tepi luar kanvas cetak tanpa menyisakan Margin Dalam 15 mm.',
          label_opsi: ['Sesuai', 'Tidak Sesuai'],
          kunci: 'B',
        },
        {
          id_pernyataan: 'p3',
          teks: 'Menyiapkan area Bleed 3 mm pada desain poster cetak untuk mencegah munculnya garis putih saat kertas dipotong mesin.',
          label_opsi: ['Sesuai', 'Tidak Sesuai'],
          kunci: 'A',
        },
      ],
      kunci_jawaban: JSON.stringify({ p1: 'A', p2: 'B', p3: 'A' }),
      pembahasan:
        'Pernyataan 1 Sesuai (layar digital menggunakan RGB & PNG-24). Pernyataan 2 Tidak Sesuai (teks penting wajib berada di dalam margin aman 15 mm agar tidak terpotong). Pernyataan 3 Sesuai (fungsi bleed 3 mm).',
    },
    {
      id_soal: 'SOAL-06',
      id_sesi: idSesi,
      tp: 'tp-bm-001',
      tp_label:
        'Menerapkan prinsip keseimbangan, kontras, penekanan (emphasis), dan hierarki tipografi dalam merancang poster publikasi digital yang komunikatif.',
      jenis: 'pg_mcma',
      tipe_penyajian: 'grup',
      id_stimulus: 'STIM-GRAFIK-02',
      teks_soal:
        'Perhatikan Grafik Hasil Uji Keterbacaan Poster (Tes 3 Detik)! Kesimpulan analitis manakah yang TEPAT berdasarkan data grafik tersebut? (Pilih semua jawaban yang benar)',
      opsi: [
        'Desain A mencapai tingkat keterbacaan tertinggi (92%) karena memadukan hierarki visual yang jelas dengan ruang kosong (white space) 35%',
        'Penggunaan terlalu banyak jenis font dekoratif (Desain C) menurunkan keterbacaan pesan hingga tersisa 31%',
        'Memenuhi seluruh kanvas dengan teks tanpa ruang kosong (Desain D) justru menghasilkan efektivitas komunikasi tertinggi',
        'Selisih keberhasilan tangkap pesan antara Desain A dan Desain D mencapai 74 poin persentase',
      ],
      kunci_jawaban: JSON.stringify([0, 1, 3]),
      pembahasan:
        'Data grafik menunjukkan Desain A tertinggi (92%), Desain C turun menjadi 31% akibat 5 font dekoratif, dan selisih Desain A (92%) dengan Desain D (18%) adalah 92 - 18 = 74%. Opsi C salah karena Desain D justru terendah (18%).',
    },
  ];

  return { stimulusList, bankSoal };
}

function createInitialMenaraAsesmenStore(): ServerMenaraAsesmenStore {
  const defaultSesiId = 'ASESMEN-TKA-01';
  const { stimulusList, bankSoal } = createDefaultAsesmenStimulusAndQuestions(defaultSesiId);
  return {
    sesi: {
      id_sesi: defaultSesiId,
      judul_asesmen: 'Asesmen Sumatif Mandiri (TKA) — Dasar DKV & Berpikir Komputasional',
      tp_terpilih: ['tp-bm-001', 'obj-1'],
      tp_detail: [
        {
          id_tp: 'tp-bm-001',
          mata_pelajaran: 'Komputer Grafis & Publikasi',
          kelas: 'X DKV 2 & X DKV 3',
          tujuan_pembelajaran:
            'Peserta didik mampu menerapkan prinsip keseimbangan, kontras, penekanan (emphasis), dan hierarki tipografi dalam merancang poster publikasi digital yang komunikatif.',
          isi_materi:
            'Hierarki Visual mengatur urutan mata audiens membaca informasi. Kontras warna dan ukuran huruf menonjolkan pesan kunci. White space menjaga desain tetap lega dan mudah dipindai. Grid system menyatukan tata letak elemen.',
        },
        {
          id_tp: 'obj-1',
          mata_pelajaran: 'Informatika & Berpikir Komputasional DKV',
          kelas: 'X DKV 1, 2 & 3',
          tujuan_pembelajaran:
            'Memahami alur kerja Input-Process-Output (IPO) dan struktur file/folder terstandar pada produksi karya DKV.',
          isi_materi:
            'Alur IPO dalam produksi desain meliputi Input (brief klien, aset mentah, riset), Process (sketsa, layouting, olah vektor/raster), dan Output (ekspor PDF CMYK 300 DPI untuk cetak atau PNG/WebP RGB untuk media digital).',
        },
      ],
      durasi: 30,
      status: 'draf',
      waktu_mulai: '-',
      waktu_mulai_ms: null,
      waktu_jeda_ms: null,
      total_durasi_jeda_ms: 0,
      tambahan_waktu_menit: 0,
      jumlah_soal: 6,
      komposisi_jenis: {
        pg_tunggal: 2,
        pg_mcma: 2,
        pg_kategori: 2,
      },
      komposisi_penyajian: {
        tunggal: 3,
        grup: 3,
      },
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
      guru_pembuat: 'Mohamad Rizki Bahsoan, S.Kom',
    },
    stimulusList,
    bankSoal,
    paketByStudent: {},
    jawabanByStudent: {},
    hasilByStudent: {},
    pesertaLive: {},
  };
}

function loadMenaraAsesmenFromFile(): ServerMenaraAsesmenStore {
  try {
    if (fs.existsSync(MENARA_ASESMEN_FILE_PATH)) {
      const raw = fs.readFileSync(MENARA_ASESMEN_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.sesi && Array.isArray(parsed.bankSoal)) {
        return {
          ...createInitialMenaraAsesmenStore(),
          ...parsed,
          sesi: {
            ...createInitialMenaraAsesmenStore().sesi,
            ...parsed.sesi,
          },
        };
      }
    }
  } catch (err) {
    console.warn('[server.ts] Failed reading server_menara_asesmen.json:', err);
  }
  return createInitialMenaraAsesmenStore();
}

let menaraAsesmenStore: ServerMenaraAsesmenStore = loadMenaraAsesmenFromFile();
let lastAsesmenSaveMs = 0;

function saveMenaraAsesmenToFile(force = false) {
  const now = Date.now();
  if (!force && now - lastAsesmenSaveMs < 800) return;
  lastAsesmenSaveMs = now;
  try {
    fs.writeFileSync(MENARA_ASESMEN_FILE_PATH, JSON.stringify(menaraAsesmenStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[server.ts] Failed writing server_menara_asesmen.json:', err);
  }
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

/**
 * Membangun Paket Soal Siswa (Asesmen_PaketSiswa):
 * - Jika acak_soal aktif, urutan diacak TETAPI soal-soal grup yang berbagi id_stimulus yang sama
 *   tetap dikelompokkan berurutan agar siswa membaca stimulus secara utuh!
 * - Jika acak_opsi aktif, indeks opsi PG Tunggal & MCMA diacak per siswa.
 */
function buildStudentPackageForAsesmen(params: {
  studentId: string;
  studentName: string;
  className: string;
  sessionToken?: string;
}): ServerAsesmenPaketSiswa {
  const { studentId, studentName, className, sessionToken } = params;
  const sesi = menaraAsesmenStore.sesi;
  const allQuestions = menaraAsesmenStore.bankSoal;

  // Kelompokkan berdasarkan stimulus untuk soal grup, dan mandiri untuk soal tunggal
  const blocks: ServerAsesmenSoal[][] = [];
  const stimulusGroups = new Map<string, ServerAsesmenSoal[]>();

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

  const existingPkg = menaraAsesmenStore.paketByStudent[studentId];
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

/**
 * Penilaian 1 Butir Soal di Sisi Server (Anti-Manipulasi Sisi Klien)
 */
function gradeSingleAsesmenQuestionServerSide(
  soal: ServerAsesmenSoal,
  jawabanRaw: string | undefined,
  sesi: ServerAsesmenSesi
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

  // pg_kategori: nilai dihitung per pernyataan!
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

/**
 * Menghitung & menyimpan Asesmen_Hasil untuk seorang siswa di sisi server
 */
function finalizeAndGradeStudentAsesmen(studentId: string): ServerAsesmenHasil | null {
  const sesi = menaraAsesmenStore.sesi;
  const live = menaraAsesmenStore.pesertaLive[studentId];
  const pkg = menaraAsesmenStore.paketByStudent[studentId];
  if (!live && !pkg) return null;

  const studentName = live?.studentName || pkg?.nama_siswa || 'Siswa DKV';
  const className = live?.className || pkg?.kelas || 'X DKV';
  const ansMap = menaraAsesmenStore.jawabanByStudent[studentId] || {};

  let totalEarned = 0;
  let totalMax = 0;
  let totalFullyCorrect = 0;
  const tpStats: Record<string, { benar: number; total: number; persentase: number }> = {};

  menaraAsesmenStore.bankSoal.forEach((soal) => {
    const ansObj = ansMap[soal.id_soal];
    const graded = gradeSingleAsesmenQuestionServerSide(soal, ansObj?.jawaban, sesi);
    totalEarned += graded.poinDiperoleh;
    totalMax += graded.poinMaksimal;
    if (graded.isFullyCorrect) {
      totalFullyCorrect += 1;
    }

    const tpKey = soal.tp || 'TP-Umum';
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

  const nilaiAkhir = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
  const now = Date.now();
  const startWorkMs = live?.waktu_mulai_kerja_ms || sesi.waktu_mulai_ms || now - 60000;
  const durasiDetik = Math.max(
    5,
    Math.round((now - startWorkMs - (sesi.total_durasi_jeda_ms || 0)) / 1000)
  );
  const nowStr = new Date().toLocaleString('id-ID');

  const hasil: ServerAsesmenHasil = {
    id_sesi: sesi.id_sesi,
    siswa: studentId,
    nama_siswa: studentName,
    kelas: className,
    nilai: nilaiAkhir,
    poin_diperoleh: Math.round(totalEarned * 10) / 10,
    poin_maksimal: totalMax,
    jumlah_benar: totalFullyCorrect,
    jumlah_soal: menaraAsesmenStore.bankSoal.length,
    durasi: durasiDetik,
    keluar_tab: live?.keluar_tab || 0,
    waktu_selesai: nowStr,
    rincian_per_tp: tpStats,
  };

  menaraAsesmenStore.hasilByStudent[studentId] = hasil;
  if (live) {
    live.status_peserta = 'selesai';
    live.waktu_selesai = nowStr;
    live.nilai_akhir = nilaiAkhir;
  }

  return hasil;
}

function checkAndAdvanceMenaraAsesmenTimer() {
  const sesi = menaraAsesmenStore.sesi;
  if (sesi.status !== 'berjalan' || !sesi.waktu_mulai_ms) return;

  const now = Date.now();
  const totalAllowedMs =
    (Number(sesi.durasi || 30) + Number(sesi.tambahan_waktu_menit || 0)) * 60 * 1000;
  const elapsedMs = now - sesi.waktu_mulai_ms - (sesi.total_durasi_jeda_ms || 0);

  if (elapsedMs >= totalAllowedMs) {
    // Waktu habis! Otomatis kumpulkan & nilai seluruh siswa yang sedang mengerjakan
    sesi.status = 'selesai';
    Object.keys(menaraAsesmenStore.pesertaLive).forEach((sid) => {
      const p = menaraAsesmenStore.pesertaLive[sid];
      if (p && p.status_peserta !== 'selesai') {
        finalizeAndGradeStudentAsesmen(sid);
      }
    });
    saveMenaraAsesmenToFile(true);
    broadcastPresence({
      type: 'asesmen_tower_tick',
      sesiId: sesi.id_sesi,
      status: 'selesai',
      timestamp: now,
    });
  }
}

function buildSanitizedMenaraAsesmenPayload(params: {
  viewerId?: string;
  isVerifiedTeacher: boolean;
}) {
  checkAndAdvanceMenaraAsesmenTimer();
  const { viewerId, isVerifiedTeacher } = params;
  const sesi = menaraAsesmenStore.sesi;
  const myHasil = viewerId ? menaraAsesmenStore.hasilByStudent[viewerId] || null : null;
  const myPaket = viewerId ? menaraAsesmenStore.paketByStudent[viewerId] || null : null;
  const myJawaban = viewerId ? menaraAsesmenStore.jawabanByStudent[viewerId] || {} : {};

  // KEAMANAN: Kunci jawaban & pembahasan HANYA dikirim ke Guru,
  // ATAU ke siswa yang sudah selesai JIKA guru mengaktifkan tampilkan_pembahasan!
  const canRevealKeys =
    isVerifiedTeacher || (Boolean(myHasil) && Boolean(sesi.tampilkan_pembahasan));

  const sanitizedBankSoal = menaraAsesmenStore.bankSoal.map((q) => ({
    ...q,
    pernyataan_kategori: Array.isArray(q.pernyataan_kategori)
      ? q.pernyataan_kategori.map((st) => ({
          id_pernyataan: st.id_pernyataan,
          teks: st.teks,
          label_opsi: st.label_opsi,
          kunci: canRevealKeys ? st.kunci : undefined,
        }))
      : undefined,
    kunci_jawaban: canRevealKeys ? q.kunci_jawaban : null,
    pembahasan: canRevealKeys ? q.pembahasan : null,
  }));

  const semuaHasilList = Object.values(menaraAsesmenStore.hasilByStudent).sort(
    (a, b) => b.nilai - a.nilai
  );

  const rataRataKelas =
    semuaHasilList.length > 0
      ? Math.round(
          (semuaHasilList.reduce((acc, r) => acc + r.nilai, 0) / semuaHasilList.length) * 10
        ) / 10
      : 0;

  // Hitung Analisis Per Butir Soal & Analisis Per TP untuk Guru
  let analisisButir: any[] = [];
  let analisisTp: any[] = [];

  if (isVerifiedTeacher) {
    const allStudentIdsWithAnswers = Object.keys(menaraAsesmenStore.jawabanByStudent);
    analisisButir = menaraAsesmenStore.bankSoal.map((soal, idx) => {
      let answeredCount = 0;
      let correctCount = 0;
      allStudentIdsWithAnswers.forEach((sid) => {
        const ans = menaraAsesmenStore.jawabanByStudent[sid]?.[soal.id_soal];
        if (ans && String(ans.jawaban || '').trim() !== '') {
          answeredCount++;
          const graded = gradeSingleAsesmenQuestionServerSide(soal, ans.jawaban, sesi);
          if (graded.isFullyCorrect) correctCount++;
        }
      });
      return {
        id_soal: soal.id_soal,
        nomor_urut: idx + 1,
        tp: soal.tp,
        jenis: soal.jenis,
        teks_soal: soal.teks_soal,
        jumlah_menjawab: answeredCount,
        jumlah_benar: correctCount,
        persentase_benar:
          answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
      };
    });

    const tpGroupMap = new Map<
      string,
      { tp: string; tp_label: string; countSoal: number; sumPct: number }
    >();
    analisisButir.forEach((ab) => {
      const soalObj = menaraAsesmenStore.bankSoal.find((s) => s.id_soal === ab.id_soal);
      const tpKey = ab.tp || 'TP-Umum';
      const existing = tpGroupMap.get(tpKey) || {
        tp: tpKey,
        tp_label: soalObj?.tp_label || tpKey,
        countSoal: 0,
        sumPct: 0,
      };
      existing.countSoal += 1;
      existing.sumPct += ab.persentase_benar;
      tpGroupMap.set(tpKey, existing);
    });

    analisisTp = Array.from(tpGroupMap.values()).map((item) => ({
      tp: item.tp,
      tp_label: item.tp_label,
      jumlah_soal: item.countSoal,
      rata_rata_penguasaan:
        item.countSoal > 0 ? Math.round(item.sumPct / item.countSoal) : 0,
    }));
  }

  return {
    sesi,
    stimulusList: menaraAsesmenStore.stimulusList,
    bankSoal: sanitizedBankSoal,
    paketSaya: myPaket,
    jawabanSaya: myJawaban,
    hasilSaya: myHasil,
    pesertaLive: Object.values(menaraAsesmenStore.pesertaLive).sort(
      (a, b) => b.lastSeen - a.lastSeen
    ),
    semuaHasil: isVerifiedTeacher ? semuaHasilList : myHasil ? [myHasil] : [],
    analisisButir: isVerifiedTeacher ? analisisButir : undefined,
    analisisTp: isVerifiedTeacher ? analisisTp : undefined,
    rataRataKelas,
    serverTime: Date.now(),
  };
}

// GET /api/menara-asesmen/state (Polled every 3-5s by Lobby & Exam clients)
app.get('/api/menara-asesmen/state', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const viewerId = req.query.studentId ? String(req.query.studentId).trim() : undefined;
  const viewerName = req.query.studentName ? String(req.query.studentName).trim() : undefined;
  const viewerClass = req.query.className ? String(req.query.className).trim() : 'X DKV';
  const viewerGender: 'L' | 'P' = req.query.gender === 'P' ? 'P' : 'L';
  const isTeacherParam = req.query.isTeacher === 'true' || req.query.isTeacher === '1';
  const studentNumber = req.query.studentNumber ? String(req.query.studentNumber) : undefined;
  const teacherPin = req.query.teacherPin ? String(req.query.teacherPin) : undefined;

  const isVerifiedTeacher = verifyTeacherAccountServerSide({
    teacherId: viewerId,
    teacherName: viewerName,
    isTeacher: isTeacherParam,
    studentNumber,
    teacherPin,
  });

  // Update student lastSeen if already registered in pesertaLive
  if (viewerId && !isVerifiedTeacher && menaraAsesmenStore.pesertaLive[viewerId]) {
    menaraAsesmenStore.pesertaLive[viewerId].lastSeen = Date.now();
    menaraAsesmenStore.pesertaLive[viewerId].studentName =
      viewerName || menaraAsesmenStore.pesertaLive[viewerId].studentName;
    menaraAsesmenStore.pesertaLive[viewerId].className =
      viewerClass || menaraAsesmenStore.pesertaLive[viewerId].className;
    menaraAsesmenStore.pesertaLive[viewerId].gender = viewerGender;
  }

  return res.json({
    success: true,
    isVerifiedTeacher,
    data: buildSanitizedMenaraAsesmenPayload({
      viewerId,
      isVerifiedTeacher,
    }),
  });
});

// POST /api/menara-asesmen/generate-soal (Uses Gemini API @google/genai to generate TKA questions from Bank Materi TPs)
app.post('/api/menara-asesmen/generate-soal', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const {
    teacherId,
    teacherName,
    isTeacher,
    studentNumber,
    teacherPin,
    tpDetailList,
    jumlahSoal = 6,
    komposisiJenis = { pg_tunggal: 2, pg_mcma: 2, pg_kategori: 2 },
    komposisiPenyajian = { tunggal: 3, grup: 3 },
  } = req.body || {};

  const verified = verifyTeacherAccountServerSide({
    teacherId,
    teacherName,
    isTeacher,
    studentNumber,
    teacherPin,
  });

  if (!verified) {
    return res.status(403).json({
      success: false,
      error: 'Akses Ditolak (Server Auth): Hanya akun Guru resmi yang dapat men-generate soal asesmen.',
    });
  }

  const validTpList: Array<{
    id_tp: string;
    mata_pelajaran: string;
    kelas: string;
    tujuan_pembelajaran: string;
    isi_materi: string;
  }> = Array.isArray(tpDetailList) && tpDetailList.length > 0
    ? tpDetailList.slice(0, 5)
    : menaraAsesmenStore.sesi.tp_detail;

  const totalCount = Math.max(
    3,
    Math.min(
      25,
      Number(komposisiJenis.pg_tunggal || 0) +
        Number(komposisiJenis.pg_mcma || 0) +
        Number(komposisiJenis.pg_kategori || 0) || Number(jumlahSoal) || 6
    )
  );
  const countTunggal = Math.max(0, Number(komposisiJenis.pg_tunggal ?? 2));
  const countMcma = Math.max(0, Number(komposisiJenis.pg_mcma ?? 2));
  const countKategori = Math.max(0, Number(komposisiJenis.pg_kategori ?? 2));
  const countGrup = Math.max(0, Math.min(totalCount, Number(komposisiPenyajian.grup ?? 3)));
  const countStandalone = Math.max(0, totalCount - countGrup);

  const sesiId = menaraAsesmenStore.sesi.id_sesi;

  // Deterministic adaptive builder from selected TPs if Gemini API is unavailable or fails
  const buildAdaptiveQuestionsFromTps = (): {
    stimulusList: ServerAsesmenStimulus[];
    bankSoal: ServerAsesmenSoal[];
  } => {
    const stims: ServerAsesmenStimulus[] = [];
    const questions: ServerAsesmenSoal[] = [];

    if (countGrup > 0) {
      const primaryTp = validTpList[0] || {
        id_tp: 'tp-bm-001',
        mata_pelajaran: 'Informatika & Dasar-Dasar DKV',
        kelas: 'X DKV',
        tujuan_pembelajaran: 'Menerapkan konsep berpikir komputasional dan desain sistem informasi dalam kehidupan sehari-hari',
        isi_materi: 'Materi pemecahan masalah teknologi sehari-hari, efisiensi algoritma, dan komunikasi visual.',
      };
      stims.push({
        id_stimulus: `STIM-TEKS-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        jenis: 'teks',
        judul: `Studi Kasus HOTS Masalah Teknologi Harian: ${primaryTp.mata_pelajaran}`,
        isi: `Di lingkungan masyarakat dan sekolah, warga mengalami kendala nyata pada sistem layanan digital harian (seperti antrean kantin digital yang sering macet saat jam istirahat, notifikasi informasi darurat yang terlambat terbaca, serta pencatatan data peminjaman alat yang sering ganda).\n\nMengacu pada Tujuan Pembelajaran: "${primaryTp.tujuan_pembelajaran}" serta Materi Esensial:\n${primaryTp.isi_materi || primaryTp.tujuan_pembelajaran}\n\nTim siswa diminta melakukan analisis akar masalah (Level Kognitif C4), mengevaluasi beberapa alternatif perbaikan sistem teknologi (Level Kognitif C5), dan merumuskan rancangan solusi yang paling efisien, aman, serta mudah digunakan oleh warga sehari-hari (Level Kognitif C6).`,
      });
      stims.push({
        id_stimulus: `STIM-TABEL-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        jenis: 'tabel',
        judul: `Tabel Evaluasi Kinerja Sistem Teknologi Harian Sebelum & Sesudah Optimasi`,
        isi: JSON.stringify({
          headers: ['Masalah Teknologi Sehari-hari', 'Kondisi Awal (Tanpa Konsep TP)', 'Hasil Optimasi Berbasis Materi Esensial'],
          rows: [
            ['Waktu Proses Layanan Harian', 'Rata-rata 120 detik/pengguna (sering antre)', 'Rata-rata 25 detik/pengguna (otomatis & terstruktur)'],
            ['Tingkat Kesalahan Input Pengguna', '38% salah klik akibat tampilan & alur rumit', '4% kesalahan berkat validasi & hierarki jelas'],
            ['Keamanan & Ketepatan Data Harian', 'Sering duplikat dan sulit dilacak ulang', 'Tersinkronisasi real-time dengan kode unik terverifikasi'],
          ],
        }),
      });
      stims.push({
        id_stimulus: `STIM-GRAFIK-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        jenis: 'grafik',
        judul: `Grafik Efektivitas Pemecahan Masalah Teknologi Sehari-hari (${primaryTp.mata_pelajaran})`,
        isi: JSON.stringify({
          title: 'Indeks Efisiensi & Kepuasan Pengguna setelah Penerapan Konsep (%)',
          unit: '%',
          bars: [
            { label: 'Kecepatan Akses Informasi Harian', value: 91, color: '#10b981' },
            { label: 'Akurasi Pemrosesan Data Otomatis', value: 87, color: '#38bdf8' },
            { label: 'Kemudahan Penggunaan oleh Warga', value: 85, color: '#a855f7' },
            { label: 'Penurunan Keluhan Gangguan Teknis', value: 82, color: '#f59e0b' },
          ],
        }),
      });
    }

    const typeQueue: Array<'pg_tunggal' | 'pg_mcma' | 'pg_kategori'> = [];
    for (let i = 0; i < countTunggal; i++) typeQueue.push('pg_tunggal');
    for (let i = 0; i < countMcma; i++) typeQueue.push('pg_mcma');
    for (let i = 0; i < countKategori; i++) typeQueue.push('pg_kategori');
    while (typeQueue.length < totalCount) typeQueue.push('pg_tunggal');

    for (let idx = 0; idx < totalCount; idx++) {
      const qType = typeQueue[idx] || 'pg_tunggal';
      const tpItem = validTpList[idx % validTpList.length];
      const isGrupQuestion = idx >= countStandalone && stims.length > 0;
      const chosenStim = isGrupQuestion ? stims[(idx - countStandalone) % stims.length] : null;
      const qNum = idx + 1;
      const idSoal = `SOAL-${String(qNum).padStart(2, '0')}`;

      if (qType === 'pg_tunggal') {
        questions.push({
          id_soal: idSoal,
          id_sesi: sesiId,
          tp: tpItem.id_tp,
          tp_label: tpItem.tujuan_pembelajaran,
          jenis: 'pg_tunggal',
          tipe_penyajian: isGrupQuestion ? 'grup' : 'tunggal',
          id_stimulus: chosenStim ? chosenStim.id_stimulus : '',
          teks_soal: isGrupQuestion
            ? `[HOTS - Analisis & Evaluasi] Berdasarkan data pada stimulus "${chosenStim?.judul}" di samping, apabila warga masih mengalami kendala saat menggunakan layanan teknologi harian, strategi pemecahan masalah manakah yang PALING EFEKTIF sesuai Tujuan Pembelajaran "${tpItem.tujuan_pembelajaran}"?`
            : `[HOTS - Studi Kasus Sehari-hari] Dalam aktivitas sehari-hari, banyak pengguna ponsel dan layanan digital mengalami kesalahan pemrosesan data akibat alur sistem yang tidak terstruktur. Berdasarkan konsep "${tpItem.mata_pelajaran}" (${tpItem.tujuan_pembelajaran}), solusi rancangan manakah yang paling tepat untuk mengatasi masalah tersebut?`,
          opsi: [
            `Menganalisis pola masalah harian lalu menerapkan konsep inti "${tpItem.tujuan_pembelajaran.slice(0, 95)}" secara sistematis agar alur teknologi lebih cepat, akurat, dan ramah pengguna`,
            'Menambah fitur-fitur rumit tanpa melakukan analisis kebutuhan maupun pengujian pada pengguna sehari-hari',
            'Menghapus seluruh sistem validasi data agar pengguna bisa memasukkan data acak tanpa pemeriksaan',
            'Mengabaikan kendala teknis yang dialami pengguna dan tetap mempertahankan cara manual yang lambat',
          ],
          kunci_jawaban: '0',
          pembahasan: `Pembahasan HOTS: Opsi A merupakan hasil analisis akar masalah (C4) dan evaluasi solusi terbaik (C5) yang menerapkan "${tpItem.tujuan_pembelajaran}" untuk meningkatkan efisiensi serta akurasi teknologi dalam kehidupan sehari-hari.`,
        });
      } else if (qType === 'pg_mcma') {
        questions.push({
          id_soal: idSoal,
          id_sesi: sesiId,
          tp: tpItem.id_tp,
          tp_label: tpItem.tujuan_pembelajaran,
          jenis: 'pg_mcma',
          tipe_penyajian: isGrupQuestion ? 'grup' : 'tunggal',
          id_stimulus: chosenStim ? chosenStim.id_stimulus : '',
          teks_soal: isGrupQuestion
            ? `[HOTS - Evaluasi Multi-Aspek] Perhatikan stimulus "${chosenStim?.judul}"! Pilihlah SEMUA keputusan rekayasa/solusi teknologi sehari-hari yang TEPAT berdasarkan kompetensi "${tpItem.tujuan_pembelajaran}"! (Jawaban benar lebih dari satu)`
            : `[HOTS - Penerapan Teknologi Harian] Sebuah keluarga ingin mengoptimalkan sistem pengelolaan informasi dan keamanan perangkat digital di rumah. Manakah tindakan yang TEPAT sesuai prinsip "${tpItem.tujuan_pembelajaran}"? (Pilih semua yang benar)`,
          opsi: [
            `Memetakan akar permasalahan teknologi harian menggunakan prinsip "${tpItem.mata_pelajaran}" sebelum menentukan langkah solusi`,
            'Menyusun struktur data dan tampilan informasi yang jelas agar mudah diakses kembali dalam situasi mendesak sehari-hari',
            'Membiarkan seluruh data, kata sandi, dan pengaturan perangkat bercampur secara acak tanpa struktur pengamanan',
            'Melakukan evaluasi berkala terhadap kecepatan, keamanan, dan kemudahan penggunaan sistem oleh anggota keluarga/warga',
          ],
          kunci_jawaban: JSON.stringify([0, 1, 3]),
          pembahasan:
            'Pembahasan HOTS: Pernyataan 1 (Analisis masalah), Pernyataan 2 (Perancangan struktur solusi), dan Pernyataan 4 (Evaluasi keberlanjutan sistem) adalah langkah berpikir tingkat tinggi yang tepat dalam menyelesaikan masalah teknologi sehari-hari.',
        });
      } else {
        questions.push({
          id_soal: idSoal,
          id_sesi: sesiId,
          tp: tpItem.id_tp,
          tp_label: tpItem.tujuan_pembelajaran,
          jenis: 'pg_kategori',
          tipe_penyajian: isGrupQuestion ? 'grup' : 'tunggal',
          id_stimulus: chosenStim ? chosenStim.id_stimulus : '',
          teks_soal: isGrupQuestion
            ? `[HOTS - Analisis Kritis Stimulus] Berdasarkan fakta dan data pada stimulus "${chosenStim?.judul}", analisis apakah setiap simpulan penerapan teknologi sehari-hari berikut SESUAI atau TIDAK SESUAI dengan konsep "${tpItem.tujuan_pembelajaran}"!`
            : `[HOTS - Evaluasi Kasus Teknologi Sehari-hari] Tentukan apakah setiap pernyataan analisis pemecahan masalah teknologi harian berikut BENAR atau SALAH berdasarkan kompetensi "${tpItem.tujuan_pembelajaran}"!`,
          opsi: [],
          label_kategori: isGrupQuestion ? ['Sesuai', 'Tidak Sesuai'] : ['Benar', 'Salah'],
          pernyataan_kategori: [
            {
              id_pernyataan: 'p1',
              teks: `Penyelesaian masalah teknologi sehari-hari (seperti antrean layanan digital atau pengelolaan data harian) menjadi jauh lebih cepat apabila dirancang mengikuti indikator: ${tpItem.tujuan_pembelajaran.slice(0, 110)}.`,
              label_opsi: isGrupQuestion ? ['Sesuai', 'Tidak Sesuai'] : ['Benar', 'Salah'],
              kunci: 'A',
            },
            {
              id_pernyataan: 'p2',
              teks: 'Apabila sebuah aplikasi harian sering membuat pengguna salah klik dan kehilangan data, perancang tidak perlu mengevaluasi alur sistem maupun struktur informasinya.',
              label_opsi: isGrupQuestion ? ['Sesuai', 'Tidak Sesuai'] : ['Benar', 'Salah'],
              kunci: 'B',
            },
            {
              id_pernyataan: 'p3',
              teks: 'Pengujian solusi teknologi pada skenario kehidupan nyata membantu memastikan sistem benar-benar efektif dan meminimalkan tingkat kesalahan pengguna.',
              label_opsi: isGrupQuestion ? ['Sesuai', 'Tidak Sesuai'] : ['Benar', 'Salah'],
              kunci: 'A',
            },
          ],
          kunci_jawaban: JSON.stringify({ p1: 'A', p2: 'B', p3: 'A' }),
          pembahasan:
            'Pembahasan HOTS: Pernyataan 1 Benar/Sesuai (dampak positif penerapan konsep TP pada efisiensi harian), Pernyataan 2 Salah/Tidak Sesuai (kegagalan sistem wajib dievaluasi akar masalahnya), dan Pernyataan 3 Benar/Sesuai (pentingnya validasi nyata).',
        });
      }
    }

    return { stimulusList: stims, bankSoal: questions };
  };

  if (ai && apiKey) {
    try {
      const tpPromptText = validTpList
        .map(
          (t, i) =>
            `${i + 1}. [ID_TP: ${t.id_tp}] Mapel: ${t.mata_pelajaran} (${t.kelas})\n   Tujuan Pembelajaran: ${t.tujuan_pembelajaran}\n   Materi Esensial: ${t.isi_materi}`
        )
        .join('\n\n');

      const prompt = `Buat paket soal Asesmen Sumatif Mandiri setara TKA (Tes Kemampuan Akademik) berstandar HOTS (Higher-Order Thinking Skills — Level Kognitif C4 Analisis, C5 Evaluasi, dan C6 Kreasi) dengan FOKUS UTAMA PADA PEMECAHAN MASALAH TEKNOLOGI DALAM KEHIDUPAN SEHARI-HARI berdasarkan Tujuan Pembelajaran (TP) dari Bank Materi berikut:

${tpPromptText}

Spesifikasi Wajib:
- KARAKTERISTIK SOAL (WAJIB HOTS & KONTEKSTUAL SEHARI-HARI):
  * Setiap soal WAJIB menyajikan skenario masalah teknologi nyata dalam kehidupan sehari-hari siswa, keluarga, sekolah, atau masyarakat (contoh: efisiensi aplikasi harian, keamanan akun digital, antrean layanan publik digital, manajemen data perangkat harian, otomatisasi jadwal, atau komunikasi visual informasi publik).
  * Hindari soal hafalan definisi (C1/C2). Buat soal yang menuntut siswa MENGANALISIS akar masalah (C4), MENGEVALUASI perbandingan data/keputusan terbaik (C5), atau MERANCANG solusi teknologi yang tepat (C6).
- Total Soal: ${totalCount} butir
- Komposisi Jenis Soal:
  * pg_tunggal (Pilihan Ganda Sederhana 4 opsi, 1 jawaban benar): ${countTunggal} soal
  * pg_mcma (Pilihan Ganda Kompleks MCMA 4 opsi, 2 atau 3 jawaban benar): ${countMcma} soal
  * pg_kategori (Pilihan Ganda Kompleks Kategori berisi 3 pernyataan Benar/Salah atau Sesuai/Tidak Sesuai): ${countKategori} soal
- Komposisi Penyajian:
  * Soal Tunggal (tipe_penyajian = "tunggal", id_stimulus = ""): ${countStandalone} soal
  * Soal Grup Berstimulus (tipe_penyajian = "grup", berbagi id_stimulus dari daftar stimulusList): ${countGrup} soal
- Untuk stimulusList, buat minimal 2 stimulus HOTS berkualitas tinggi bertema masalah teknologi dalam kehidupan sehari-hari (kombinasikan jenis "teks" studi kasus nyata, "tabel" dalam format JSON {headers, rows}, atau "grafik" dalam format JSON {title, unit, bars:[{label, value, color}]}).
- Setiap soal WAJIB memiliki kunci_jawaban dan pembahasan penalaran HOTS yang jelas dalam Bahasa Indonesia.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Kamu adalah penyusun soal Asesmen Nasional / TKA (Tes Kemampuan Akademik) tingkat SMK Kejuruan DKV & Informatika. Kembalikan HANYA JSON valid sesuai schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              stimulusList: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id_stimulus: { type: Type.STRING },
                    jenis: { type: Type.STRING, description: 'teks, tabel, atau grafik' },
                    judul: { type: Type.STRING },
                    isi: {
                      type: Type.STRING,
                      description:
                        'Untuk teks: paragraf wacana. Untuk tabel: JSON string {"headers":[...],"rows":[[...]]}. Untuk grafik: JSON string {"title":"...","unit":"%","bars":[{"label":"...","value":80,"color":"#38bdf8"}]}',
                    },
                  },
                  required: ['id_stimulus', 'jenis', 'judul', 'isi'],
                },
              },
              bankSoal: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id_soal: { type: Type.STRING },
                    tp: { type: Type.STRING, description: 'ID_TP yang dirujuk' },
                    tp_label: { type: Type.STRING },
                    jenis: {
                      type: Type.STRING,
                      description: 'pg_tunggal, pg_mcma, atau pg_kategori',
                    },
                    tipe_penyajian: {
                      type: Type.STRING,
                      description: 'tunggal atau grup',
                    },
                    id_stimulus: { type: Type.STRING },
                    teks_soal: { type: Type.STRING },
                    opsi: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    pernyataan_kategori: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id_pernyataan: { type: Type.STRING },
                          teks: { type: Type.STRING },
                          kunci: { type: Type.STRING, description: 'A untuk Benar/Sesuai, B untuk Salah/Tidak Sesuai' },
                        },
                        required: ['id_pernyataan', 'teks', 'kunci'],
                      },
                    },
                    kunci_jawaban: {
                      type: Type.STRING,
                      description:
                        'Untuk pg_tunggal: indeks "0".."3". Untuk pg_mcma: JSON array "[0,2]". Untuk pg_kategori: JSON object {"p1":"A","p2":"B","p3":"A"}',
                    },
                    pembahasan: { type: Type.STRING },
                  },
                  required: [
                    'id_soal',
                    'tp',
                    'jenis',
                    'tipe_penyajian',
                    'id_stimulus',
                    'teks_soal',
                    'opsi',
                    'kunci_jawaban',
                    'pembahasan',
                  ],
                },
              },
            },
            required: ['stimulusList', 'bankSoal'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (Array.isArray(parsed.bankSoal) && parsed.bankSoal.length > 0) {
        const cleanStims: ServerAsesmenStimulus[] = Array.isArray(parsed.stimulusList)
          ? parsed.stimulusList.map((st: any, idx: number) => ({
              id_stimulus: String(st.id_stimulus || `STIM-${idx + 1}`),
              jenis:
                st.jenis === 'tabel' || st.jenis === 'grafik' ? st.jenis : 'teks',
              judul: String(st.judul || `Stimulus #${idx + 1}`),
              isi: String(st.isi || ''),
            }))
          : [];

        const cleanQuestions: ServerAsesmenSoal[] = parsed.bankSoal.map(
          (q: any, idx: number) => {
            const jenisClean: 'pg_tunggal' | 'pg_mcma' | 'pg_kategori' =
              q.jenis === 'pg_mcma' || q.jenis === 'pg_kategori'
                ? q.jenis
                : 'pg_tunggal';
            const penyajianClean: 'tunggal' | 'grup' =
              q.tipe_penyajian === 'grup' && q.id_stimulus ? 'grup' : 'tunggal';
            const stmts: ServerAsesmenKategoriStatement[] | undefined =
              jenisClean === 'pg_kategori'
                ? (Array.isArray(q.pernyataan_kategori) && q.pernyataan_kategori.length > 0
                    ? q.pernyataan_kategori
                    : [
                        { id_pernyataan: 'p1', teks: 'Pernyataan 1 sesuai materi TP', kunci: 'A' },
                        { id_pernyataan: 'p2', teks: 'Pernyataan 2 bertentangan dengan materi TP', kunci: 'B' },
                        { id_pernyataan: 'p3', teks: 'Pernyataan 3 mendukung kualitas karya', kunci: 'A' },
                      ]
                  ).map((st: any, sIdx: number) => ({
                    id_pernyataan: String(st.id_pernyataan || `p${sIdx + 1}`),
                    teks: String(st.teks || ''),
                    label_opsi: ['Benar', 'Salah'],
                    kunci: String(st.kunci || 'A').toUpperCase() === 'B' ? 'B' : 'A',
                  }))
                : undefined;

            return {
              id_soal: `SOAL-${String(idx + 1).padStart(2, '0')}`,
              id_sesi: sesiId,
              tp: String(q.tp || validTpList[0]?.id_tp || 'tp-bm-001'),
              tp_label: String(
                q.tp_label ||
                  validTpList.find((t) => t.id_tp === q.tp)?.tujuan_pembelajaran ||
                  validTpList[0]?.tujuan_pembelajaran ||
                  ''
              ),
              jenis: jenisClean,
              tipe_penyajian: penyajianClean,
              id_stimulus: penyajianClean === 'grup' ? String(q.id_stimulus || '') : '',
              teks_soal: String(q.teks_soal || `Pertanyaan #${idx + 1}`),
              opsi:
                Array.isArray(q.opsi) && q.opsi.length >= 2
                  ? q.opsi.map(String)
                  : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
              pernyataan_kategori: stmts,
              label_kategori: ['Benar', 'Salah'],
              kunci_jawaban: String(q.kunci_jawaban || '0'),
              pembahasan: String(q.pembahasan || 'Pembahasan sesuai Tujuan Pembelajaran.'),
            };
          }
        );

        menaraAsesmenStore.stimulusList = cleanStims;
        menaraAsesmenStore.bankSoal = cleanQuestions;
        menaraAsesmenStore.sesi.tp_terpilih = validTpList.map((t) => t.id_tp);
        menaraAsesmenStore.sesi.tp_detail = validTpList;
        menaraAsesmenStore.sesi.jumlah_soal = cleanQuestions.length;
        saveMenaraAsesmenToFile(true);

        return res.json({
          success: true,
          source: 'gemini-ai',
          message: `✨ Berhasil men-generate ${cleanQuestions.length} soal TKA & ${cleanStims.length} stimulus dari Gemini AI! Silakan tinjau dan edit sebelum dipublikasikan.`,
          data: buildSanitizedMenaraAsesmenPayload({
            viewerId: teacherId,
            isVerifiedTeacher: true,
          }),
        });
      }
    } catch (err) {
      console.warn('[MenaraAsesmen] Gemini generate-soal fallback triggered:', err);
    }
  }

  // Fallback adaptif berbasis TP terpilih
  const generated = buildAdaptiveQuestionsFromTps();
  menaraAsesmenStore.stimulusList = generated.stimulusList;
  menaraAsesmenStore.bankSoal = generated.bankSoal;
  menaraAsesmenStore.sesi.tp_terpilih = validTpList.map((t) => t.id_tp);
  menaraAsesmenStore.sesi.tp_detail = validTpList;
  menaraAsesmenStore.sesi.jumlah_soal = generated.bankSoal.length;
  saveMenaraAsesmenToFile(true);

  return res.json({
    success: true,
    source: 'bank-materi-engine',
    message: `✅ Berhasil menyusun ${generated.bankSoal.length} soal TKA & ${generated.stimulusList.length} stimulus dari ${validTpList.length} Tujuan Pembelajaran Bank Materi!`,
    data: buildSanitizedMenaraAsesmenPayload({
      viewerId: teacherId,
      isVerifiedTeacher: true,
    }),
  });
});

// POST /api/menara-asesmen/teacher-action (Server-verified Teacher Controls)
app.post('/api/menara-asesmen/teacher-action', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const {
    actionType,
    teacherId,
    teacherName,
    isTeacher,
    studentNumber,
    teacherPin,
    sesiConfig,
    questionItem,
    questionId,
    stimulusItem,
    stimulusId,
    extraMinutes,
  } = req.body || {};

  const verified = verifyTeacherAccountServerSide({
    teacherId,
    teacherName,
    isTeacher,
    studentNumber,
    teacherPin,
  });

  if (!verified) {
    return res.status(403).json({
      success: false,
      error:
        'Akses Ditolak (Server Role Check): Hanya akun Guru resmi yang diizinkan mengelola Panel Guru Menara Asesmen Individu.',
    });
  }

  const now = Date.now();
  const nowStr = new Date().toLocaleString('id-ID');
  const sesi = menaraAsesmenStore.sesi;

  if (actionType === 'save_config' && sesiConfig && typeof sesiConfig === 'object') {
    sesi.judul_asesmen = String(sesiConfig.judul_asesmen || sesi.judul_asesmen).trim();
    if (Array.isArray(sesiConfig.tp_terpilih) && sesiConfig.tp_terpilih.length > 0) {
      sesi.tp_terpilih = sesiConfig.tp_terpilih.slice(0, 5);
    }
    if (Array.isArray(sesiConfig.tp_detail) && sesiConfig.tp_detail.length > 0) {
      sesi.tp_detail = sesiConfig.tp_detail.slice(0, 5);
    }
    if (typeof sesiConfig.durasi === 'number') {
      sesi.durasi = Math.max(5, Math.min(180, sesiConfig.durasi));
    }
    if (sesiConfig.komposisi_jenis) {
      sesi.komposisi_jenis = {
        pg_tunggal: Math.max(0, Number(sesiConfig.komposisi_jenis.pg_tunggal ?? 2)),
        pg_mcma: Math.max(0, Number(sesiConfig.komposisi_jenis.pg_mcma ?? 2)),
        pg_kategori: Math.max(0, Number(sesiConfig.komposisi_jenis.pg_kategori ?? 2)),
      };
      sesi.jumlah_soal =
        sesi.komposisi_jenis.pg_tunggal +
        sesi.komposisi_jenis.pg_mcma +
        sesi.komposisi_jenis.pg_kategori;
    }
    if (sesiConfig.komposisi_penyajian) {
      sesi.komposisi_penyajian = {
        tunggal: Math.max(0, Number(sesiConfig.komposisi_penyajian.tunggal ?? 3)),
        grup: Math.max(0, Number(sesiConfig.komposisi_penyajian.grup ?? 3)),
      };
    }
    if (sesiConfig.poin_per_jenis) {
      sesi.poin_per_jenis = {
        pg_tunggal: Math.max(1, Number(sesiConfig.poin_per_jenis.pg_tunggal ?? 10)),
        pg_mcma: Math.max(1, Number(sesiConfig.poin_per_jenis.pg_mcma ?? 15)),
        pg_kategori_per_pernyataan: Math.max(
          1,
          Number(sesiConfig.poin_per_jenis.pg_kategori_per_pernyataan ?? 5)
        ),
      };
    }
    if (typeof sesiConfig.mcma_kredit_parsial === 'boolean') {
      sesi.mcma_kredit_parsial = sesiConfig.mcma_kredit_parsial;
    }
    if (typeof sesiConfig.acak_soal === 'boolean') {
      sesi.acak_soal = sesiConfig.acak_soal;
    }
    if (typeof sesiConfig.acak_opsi === 'boolean') {
      sesi.acak_opsi = sesiConfig.acak_opsi;
    }
    if (typeof sesiConfig.izinkan_menyusul === 'boolean') {
      sesi.izinkan_menyusul = sesiConfig.izinkan_menyusul;
    }
    if (typeof sesiConfig.tampilkan_pembahasan === 'boolean') {
      sesi.tampilkan_pembahasan = sesiConfig.tampilkan_pembahasan;
    }
    if (typeof sesiConfig.xp_bonus_selesai === 'number') {
      sesi.xp_bonus_selesai = Math.max(10, Math.min(200, sesiConfig.xp_bonus_selesai));
    }
    sesi.guru_pembuat = teacherName || sesi.guru_pembuat;
    saveMenaraAsesmenToFile(true);
  } else if (actionType === 'save_question' && questionItem && typeof questionItem === 'object') {
    const idSoal = String(
      questionItem.id_soal || `SOAL-${String(menaraAsesmenStore.bankSoal.length + 1).padStart(2, '0')}`
    );
    const cleanedQuestion: ServerAsesmenSoal = {
      id_soal: idSoal,
      id_sesi: sesi.id_sesi,
      tp: String(questionItem.tp || sesi.tp_terpilih[0] || 'tp-bm-001'),
      tp_label: String(questionItem.tp_label || ''),
      jenis:
        questionItem.jenis === 'pg_mcma' || questionItem.jenis === 'pg_kategori'
          ? questionItem.jenis
          : 'pg_tunggal',
      tipe_penyajian:
        questionItem.tipe_penyajian === 'grup' && questionItem.id_stimulus ? 'grup' : 'tunggal',
      id_stimulus:
        questionItem.tipe_penyajian === 'grup' ? String(questionItem.id_stimulus || '') : '',
      teks_soal: String(questionItem.teks_soal || '').trim(),
      opsi: Array.isArray(questionItem.opsi) ? questionItem.opsi.map(String) : [],
      pernyataan_kategori: Array.isArray(questionItem.pernyataan_kategori)
        ? questionItem.pernyataan_kategori.map((st: any, idx: number) => ({
            id_pernyataan: String(st.id_pernyataan || `p${idx + 1}`),
            teks: String(st.teks || ''),
            label_opsi: Array.isArray(st.label_opsi) ? st.label_opsi : ['Benar', 'Salah'],
            kunci: String(st.kunci || 'A').toUpperCase() === 'B' ? 'B' : 'A',
          }))
        : undefined,
      label_kategori: Array.isArray(questionItem.label_kategori)
        ? questionItem.label_kategori
        : ['Benar', 'Salah'],
      kunci_jawaban: String(questionItem.kunci_jawaban ?? '0'),
      pembahasan: String(questionItem.pembahasan || ''),
    };

    const existingIdx = menaraAsesmenStore.bankSoal.findIndex((q) => q.id_soal === idSoal);
    if (existingIdx >= 0) {
      menaraAsesmenStore.bankSoal[existingIdx] = cleanedQuestion;
    } else {
      menaraAsesmenStore.bankSoal.push(cleanedQuestion);
    }
    sesi.jumlah_soal = menaraAsesmenStore.bankSoal.length;
    saveMenaraAsesmenToFile(true);
  } else if (actionType === 'delete_question' && questionId) {
    menaraAsesmenStore.bankSoal = menaraAsesmenStore.bankSoal.filter(
      (q) => q.id_soal !== String(questionId)
    );
    sesi.jumlah_soal = menaraAsesmenStore.bankSoal.length;
    saveMenaraAsesmenToFile(true);
  } else if (actionType === 'save_stimulus' && stimulusItem && typeof stimulusItem === 'object') {
    const idStim = String(
      stimulusItem.id_stimulus || `STIM-${Date.now().toString(36).slice(-4).toUpperCase()}`
    );
    const cleanedStim: ServerAsesmenStimulus = {
      id_stimulus: idStim,
      jenis:
        stimulusItem.jenis === 'tabel' || stimulusItem.jenis === 'grafik'
          ? stimulusItem.jenis
          : 'teks',
      judul: String(stimulusItem.judul || `Stimulus ${idStim}`),
      isi: String(stimulusItem.isi || ''),
    };
    const existingIdx = menaraAsesmenStore.stimulusList.findIndex(
      (s) => s.id_stimulus === idStim
    );
    if (existingIdx >= 0) {
      menaraAsesmenStore.stimulusList[existingIdx] = cleanedStim;
    } else {
      menaraAsesmenStore.stimulusList.push(cleanedStim);
    }
    saveMenaraAsesmenToFile(true);
  } else if (actionType === 'delete_stimulus' && stimulusId) {
    menaraAsesmenStore.stimulusList = menaraAsesmenStore.stimulusList.filter(
      (s) => s.id_stimulus !== String(stimulusId)
    );
    menaraAsesmenStore.bankSoal.forEach((q) => {
      if (q.id_stimulus === String(stimulusId)) {
        q.id_stimulus = '';
        q.tipe_penyajian = 'tunggal';
      }
    });
    saveMenaraAsesmenToFile(true);
  } else if (actionType === 'buka_lobi') {
    if (menaraAsesmenStore.bankSoal.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bank Soal sesi masih kosong. Silakan Generate Soal atau tambah soal terlebih dahulu.',
      });
    }
    sesi.status = 'lobi';
    sesi.waktu_mulai = '-';
    sesi.waktu_mulai_ms = null;
    sesi.waktu_jeda_ms = null;
    sesi.total_durasi_jeda_ms = 0;
    sesi.tambahan_waktu_menit = 0;
    saveMenaraAsesmenToFile(true);
  } else if (actionType === 'mulai_asesmen') {
    if (menaraAsesmenStore.bankSoal.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bank Soal sesi masih kosong.',
      });
    }
    sesi.status = 'berjalan';
    sesi.waktu_mulai = nowStr;
    sesi.waktu_mulai_ms = now;
    sesi.waktu_jeda_ms = null;
    sesi.total_durasi_jeda_ms = 0;

    // Buat paket soal teracak untuk seluruh siswa yang sudah menunggu di lobi
    Object.values(menaraAsesmenStore.pesertaLive).forEach((peserta) => {
      const pkg = buildStudentPackageForAsesmen({
        studentId: peserta.studentId,
        studentName: peserta.studentName,
        className: peserta.className,
        sessionToken: peserta.activeSessionToken,
      });
      menaraAsesmenStore.paketByStudent[peserta.studentId] = pkg;
      if (peserta.status_peserta === 'di_lobi') {
        peserta.status_peserta = 'mengerjakan';
        peserta.waktu_mulai_kerja_ms = now;
        peserta.total_soal = pkg.urutan_soal.length;
      }
    });
    saveMenaraAsesmenToFile(true);
  } else if (actionType === 'tambah_waktu') {
    const addMin = Math.max(1, Math.min(60, Number(extraMinutes) || 5));
    sesi.tambahan_waktu_menit = (sesi.tambahan_waktu_menit || 0) + addMin;
    saveMenaraAsesmenToFile(true);
  } else if (actionType === 'jeda') {
    if (sesi.status === 'berjalan') {
      sesi.status = 'jeda';
      sesi.waktu_jeda_ms = now;
      saveMenaraAsesmenToFile(true);
    }
  } else if (actionType === 'lanjut') {
    if (sesi.status === 'jeda') {
      if (sesi.waktu_jeda_ms) {
        sesi.total_durasi_jeda_ms += Math.max(0, now - sesi.waktu_jeda_ms);
      }
      sesi.waktu_jeda_ms = null;
      sesi.status = 'berjalan';
      saveMenaraAsesmenToFile(true);
    }
  } else if (actionType === 'akhiri_paksa') {
    sesi.status = 'selesai';
    Object.keys(menaraAsesmenStore.pesertaLive).forEach((sid) => {
      const p = menaraAsesmenStore.pesertaLive[sid];
      if (p && p.status_peserta !== 'selesai') {
        finalizeAndGradeStudentAsesmen(sid);
      }
    });
    saveMenaraAsesmenToFile(true);
  } else if (actionType === 'reset_sesi') {
    const nextSesiNum =
      Number(String(sesi.id_sesi).replace(/[^0-9]/g, '') || '1') + 1;
    const nextSesiId = `ASESMEN-TKA-${String(nextSesiNum).padStart(2, '0')}`;
    sesi.id_sesi = nextSesiId;
    sesi.status = 'draf';
    sesi.waktu_mulai = '-';
    sesi.waktu_mulai_ms = null;
    sesi.waktu_jeda_ms = null;
    sesi.total_durasi_jeda_ms = 0;
    sesi.tambahan_waktu_menit = 0;
    menaraAsesmenStore.bankSoal.forEach((q) => {
      q.id_sesi = nextSesiId;
    });
    menaraAsesmenStore.paketByStudent = {};
    menaraAsesmenStore.jawabanByStudent = {};
    menaraAsesmenStore.hasilByStudent = {};
    menaraAsesmenStore.pesertaLive = {};
    saveMenaraAsesmenToFile(true);
  }

  broadcastPresence({
    type: 'asesmen_tower_tick',
    sesiId: sesi.id_sesi,
    status: sesi.status,
    timestamp: now,
  });

  return res.json({
    success: true,
    data: buildSanitizedMenaraAsesmenPayload({
      viewerId: teacherId,
      isVerifiedTeacher: true,
    }),
  });
});

// POST /api/menara-asesmen/student-action (Lobby join, Batch auto-save answers, Tab exit warning, Submit exam)
app.post('/api/menara-asesmen/student-action', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const {
    actionType,
    studentId,
    studentName,
    className,
    gender,
    sessionToken,
    answersBatch,
    activeQuestionNumber,
    tabExitReason,
  } = req.body || {};

  if (!studentId || !studentName) {
    return res.status(400).json({
      success: false,
      error: 'Identitas siswa diperlukan.',
    });
  }

  checkAndAdvanceMenaraAsesmenTimer();
  const sid = String(studentId).trim();
  const sName = String(studentName).trim();
  const sClass = String(className || 'X DKV').trim();
  const sGender: 'L' | 'P' = gender === 'P' ? 'P' : 'L';
  const now = Date.now();
  const nowStr = new Date().toLocaleString('id-ID');
  const sesi = menaraAsesmenStore.sesi;

  let live = menaraAsesmenStore.pesertaLive[sid];

  if (actionType === 'join_lobby') {
    if (sesi.status === 'draf') {
      return res.status(400).json({
        success: false,
        error: 'Lobi belum dibuka oleh Guru. Tunggu Guru menekan tombol "Buka Lobi".',
      });
    }

    // Jika asesmen sudah berjalan dan siswa belum pernah gabung lobi, cek opsi izinkan_menyusul
    if (sesi.status === 'berjalan' && !live && !sesi.izinkan_menyusul) {
      return res.status(403).json({
        success: false,
        error:
          'Asesmen sudah dimulai dan opsi "Siswa Menyusul" dikunci oleh Guru. Silakan hubungi Guru Pengampu.',
      });
    }

    const tok =
      String(sessionToken || '').trim() ||
      live?.activeSessionToken ||
      `astok-${now}-${Math.random().toString(36).slice(2, 7)}`;

    if (!live) {
      live = {
        studentId: sid,
        studentName: sName,
        className: sClass,
        gender: sGender,
        status_peserta:
          sesi.status === 'berjalan' || sesi.status === 'jeda' ? 'mengerjakan' : 'di_lobi',
        soal_terjawab: 0,
        soal_ragu: 0,
        total_soal: menaraAsesmenStore.bankSoal.length,
        nomor_soal_aktif: 1,
        keluar_tab: 0,
        log_keluar_tab: [],
        waktu_gabung: nowStr,
        waktu_mulai_kerja_ms:
          sesi.status === 'berjalan' || sesi.status === 'jeda' ? now : null,
        waktu_selesai: null,
        nilai_akhir: null,
        lastSeen: now,
        activeSessionToken: tok,
      };
      menaraAsesmenStore.pesertaLive[sid] = live;
    } else {
      live.lastSeen = now;
      live.studentName = sName;
      live.className = sClass;
      live.activeSessionToken = tok;
      if (
        (sesi.status === 'berjalan' || sesi.status === 'jeda') &&
        live.status_peserta === 'di_lobi'
      ) {
        live.status_peserta = 'mengerjakan';
        live.waktu_mulai_kerja_ms = live.waktu_mulai_kerja_ms || now;
      }
    }

    // Pastikan paket siswa dibuat jika asesmen sudah berjalan atau saat di lobi
    if (!menaraAsesmenStore.paketByStudent[sid]) {
      menaraAsesmenStore.paketByStudent[sid] = buildStudentPackageForAsesmen({
        studentId: sid,
        studentName: sName,
        className: sClass,
        sessionToken: tok,
      });
    }

    saveMenaraAsesmenToFile(true);
  } else if (actionType === 'save_answers_batch') {
    if (!live) {
      return res.status(400).json({
        success: false,
        error: 'Silakan bergabung ke lobi asesmen terlebih dahulu.',
      });
    }
    if (live.status_peserta === 'selesai') {
      return res.status(400).json({
        success: false,
        error: 'Asesmen Anda sudah dikumpulkan dan dikunci.',
      });
    }

    if (!menaraAsesmenStore.jawabanByStudent[sid]) {
      menaraAsesmenStore.jawabanByStudent[sid] = {};
    }

    if (Array.isArray(answersBatch)) {
      answersBatch.forEach((item: any) => {
        if (!item || !item.id_soal) return;
        menaraAsesmenStore.jawabanByStudent[sid][String(item.id_soal)] = {
          id_sesi: sesi.id_sesi,
          siswa: sid,
          nama_siswa: sName,
          id_soal: String(item.id_soal),
          jawaban: String(item.jawaban ?? ''),
          ragu: Boolean(item.ragu),
          waktu: String(item.waktu || nowStr),
        };
      });
    }

    const allAns = Object.values(menaraAsesmenStore.jawabanByStudent[sid]);
    live.soal_terjawab = allAns.filter((a) => {
      const v = String(a.jawaban || '').trim();
      return v !== '' && v !== '[]' && v !== '{}';
    }).length;
    live.soal_ragu = allAns.filter((a) => Boolean(a.ragu)).length;
    if (typeof activeQuestionNumber === 'number') {
      live.nomor_soal_aktif = activeQuestionNumber;
    }
    live.lastSeen = now;
    saveMenaraAsesmenToFile();
  } else if (actionType === 'log_tab_exit') {
    if (live && live.status_peserta === 'mengerjakan' && sesi.status === 'berjalan') {
      live.keluar_tab = (live.keluar_tab || 0) + 1;
      const d = new Date();
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(
        d.getMinutes()
      ).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      live.log_keluar_tab = [
        `${timeStr} (${String(tabExitReason || 'Pindah Tab/Aplikasi')})`,
        ...(live.log_keluar_tab || []),
      ].slice(0, 20);
      live.lastSeen = now;
      saveMenaraAsesmenToFile();
    }
  } else if (actionType === 'submit_exam') {
    // Simpan batch jawaban terakhir jika disertakan bersama tombol Kumpulkan
    if (Array.isArray(answersBatch)) {
      if (!menaraAsesmenStore.jawabanByStudent[sid]) {
        menaraAsesmenStore.jawabanByStudent[sid] = {};
      }
      answersBatch.forEach((item: any) => {
        if (!item || !item.id_soal) return;
        menaraAsesmenStore.jawabanByStudent[sid][String(item.id_soal)] = {
          id_sesi: sesi.id_sesi,
          siswa: sid,
          nama_siswa: sName,
          id_soal: String(item.id_soal),
          jawaban: String(item.jawaban ?? ''),
          ragu: Boolean(item.ragu),
          waktu: String(item.waktu || nowStr),
        };
      });
    }

    if (live) {
      const allAns = Object.values(menaraAsesmenStore.jawabanByStudent[sid] || {});
      live.soal_terjawab = allAns.filter((a) => {
        const v = String(a.jawaban || '').trim();
        return v !== '' && v !== '[]' && v !== '{}';
      }).length;
      live.soal_ragu = 0;
    }

    const hasil = finalizeAndGradeStudentAsesmen(sid);
    saveMenaraAsesmenToFile(true);

    broadcastPresence({
      type: 'asesmen_tower_tick',
      sesiId: sesi.id_sesi,
      status: sesi.status,
      timestamp: now,
    });

    return res.json({
      success: true,
      hasil,
      data: buildSanitizedMenaraAsesmenPayload({
        viewerId: sid,
        isVerifiedTeacher: false,
      }),
    });
  }

  broadcastPresence({
    type: 'asesmen_tower_tick',
    sesiId: sesi.id_sesi,
    status: sesi.status,
    timestamp: now,
  });

  return res.json({
    success: true,
    data: buildSanitizedMenaraAsesmenPayload({
      viewerId: sid,
      isVerifiedTeacher: false,
    }),
  });
});

// ============================================================================
// AIR MANCUR WARGA: DAFTAR HADIR SISWA HARIAN (LEMPAR KOIN 1 XP -> SHEET "Daftar_Hadir")
// ============================================================================
interface ServerFountainAttendanceRow {
  id_absen: string;
  tanggal: string;
  waktu: string;
  student_id: string;
  nama_siswa: string;
  kelas: string;
  gender?: 'L' | 'P';
  koin_xp: number;
  status: 'HADIR';
  timestamp: number;
}

const FOUNTAIN_ATTENDANCE_FILE = path.join(__dirname, 'server_fountain_attendance.json');
let fountainAttendanceRows: ServerFountainAttendanceRow[] = [];

function loadFountainAttendanceFromFile() {
  try {
    if (fs.existsSync(FOUNTAIN_ATTENDANCE_FILE)) {
      const raw = fs.readFileSync(FOUNTAIN_ATTENDANCE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        fountainAttendanceRows = parsed;
      }
    }
  } catch (e) {
    console.warn('Could not load fountain attendance file:', e);
  }
}
loadFountainAttendanceFromFile();

function saveFountainAttendanceToFile() {
  try {
    fs.writeFileSync(FOUNTAIN_ATTENDANCE_FILE, JSON.stringify(fountainAttendanceRows, null, 2), 'utf-8');
  } catch {
    // Ignore read-only filesystem on serverless (Vercel)
  }
}

function mergeFountainAttendanceRows(incoming: ServerFountainAttendanceRow[]) {
  const map = new Map<string, ServerFountainAttendanceRow>();
  fountainAttendanceRows.forEach((r) => {
    if (!r || !r.tanggal || !r.student_id) return;
    map.set(`${r.tanggal}_${r.student_id}`, r);
  });
  incoming.forEach((r) => {
    if (!r || !r.tanggal || !r.student_id) return;
    const key = `${r.tanggal}_${r.student_id}`;
    const existing = map.get(key);
    if (!existing || (r.timestamp || 0) < (existing.timestamp || Infinity)) {
      map.set(key, {
        id_absen: String(r.id_absen || `absen_${r.tanggal}_${r.student_id}`),
        tanggal: String(r.tanggal),
        waktu: String(r.waktu || '07:00:00'),
        student_id: String(r.student_id),
        nama_siswa: String(r.nama_siswa || 'Siswa'),
        kelas: String(r.kelas || 'X DKV'),
        gender: r.gender === 'P' ? 'P' : 'L',
        koin_xp: typeof r.koin_xp === 'number' ? r.koin_xp : 1,
        status: 'HADIR',
        timestamp: Number(r.timestamp || Date.now()),
      });
    }
  });
  fountainAttendanceRows = Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
  saveFountainAttendanceToFile();
}

app.get('/api/fountain-attendance', async (req, res) => {
  const gasUrl = String(req.query.gasUrl || process.env.GAS_WEB_APP_URL || '').trim();
  if (gasUrl && gasUrl.startsWith('https://script.google.com/')) {
    try {
      const separator = gasUrl.includes('?') ? '&' : '?';
      const gasRes = await fetch(`${gasUrl}${separator}action=get_absensi_air_mancur`, {
        method: 'GET',
      });
      if (gasRes.ok) {
        const gasData: any = await gasRes.json();
        if (Array.isArray(gasData?.rows)) {
          mergeFountainAttendanceRows(gasData.rows);
        }
      }
    } catch {}
  }
  const tanggalFilter = String(req.query.tanggal || '').trim();
  const rows = tanggalFilter
    ? fountainAttendanceRows.filter((r) => r.tanggal === tanggalFilter)
    : fountainAttendanceRows;
  return res.json({
    success: true,
    rows,
    allRowsCount: fountainAttendanceRows.length,
  });
});

app.post('/api/fountain-attendance', async (req, res) => {
  const { action, entry, entries, gasUrl: bodyGasUrl } = req.body || {};
  const gasUrl = String(bodyGasUrl || process.env.GAS_WEB_APP_URL || '').trim();
  let gasSynced = false;

  if (action === 'record_attendance' && entry && entry.tanggal && entry.student_id) {
    mergeFountainAttendanceRows([entry]);
    const savedEntry =
      fountainAttendanceRows.find(
        (r) => r.tanggal === entry.tanggal && r.student_id === entry.student_id
      ) || entry;

    if (gasUrl && gasUrl.startsWith('https://script.google.com/')) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'save_absensi_air_mancur',
            sheetName: 'Daftar_Hadir',
            entry: savedEntry,
            row: {
              ID_Absen: savedEntry.id_absen,
              Tanggal: savedEntry.tanggal,
              Waktu: savedEntry.waktu,
              NIS_ID: savedEntry.student_id,
              Nama_Siswa: savedEntry.nama_siswa,
              Kelas: savedEntry.kelas,
              Koin_XP: savedEntry.koin_xp,
              Status: savedEntry.status,
            },
          }),
        });
        gasSynced = true;
      } catch (e) {
        console.warn('Server forwarding to GAS Daftar_Hadir failed:', e);
      }
    }

    return res.json({
      success: true,
      gasSynced,
      entry: savedEntry,
      rows: fountainAttendanceRows,
    });
  }

  if (action === 'sync_batch' && Array.isArray(entries)) {
    mergeFountainAttendanceRows(entries);
    if (gasUrl && gasUrl.startsWith('https://script.google.com/') && entries.length > 0) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'save_absensi_air_mancur_batch',
            sheetName: 'Daftar_Hadir',
            entries,
            rows: entries.map((r: any) => ({
              ID_Absen: r.id_absen,
              Tanggal: r.tanggal,
              Waktu: r.waktu,
              NIS_ID: r.student_id,
              Nama_Siswa: r.nama_siswa,
              Kelas: r.kelas,
              Koin_XP: r.koin_xp,
              Status: r.status || 'HADIR',
            })),
          }),
        });
        gasSynced = true;
      } catch (e) {
        console.warn('Server batch forwarding to GAS Daftar_Hadir failed:', e);
      }
    }
    return res.json({
      success: true,
      gasSynced,
      rows: fountainAttendanceRows,
    });
  }

  return res.json({
    success: true,
    rows: fountainAttendanceRows,
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vitePkg = 'vite';
    const { createServer } = await import(/* @vite-ignore */ vitePkg);
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kota Refleksi server listening on http://0.0.0.0:${PORT}`);
  });
}

// Export Express app for Vercel Serverless deployment
export default app;

// Only bind port when running standalone server (not on Vercel serverless)
if (!process.env.VERCEL) {
  startServer();
}


