import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

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
      model: 'gemini-3.8-flash',
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
      model: 'gemini-3.8-flash',
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
  try {
    if (fs.existsSync(JURNAL_4F_FILE_PATH)) {
      const raw = fs.readFileSync(JURNAL_4F_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[server.ts] Could not read server_4f_journals.json:', err);
  }
  return INITIAL_SERVER_4F;
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
        model: 'gemini-3.8-flash',
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
        model: 'gemini-3.8-flash',
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
      model: 'gemini-3.8-flash',
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

function loadCreatorCityStateFromFile(): any | null {
  try {
    if (fs.existsSync(CREATOR_CITY_STATE_FILE_PATH)) {
      const raw = fs.readFileSync(CREATOR_CITY_STATE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && typeof parsed.version === 'number') {
        return parsed;
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
    serverCreatorCityState = incoming;
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
  pertanyaanRefleksi: string[];
  topikPodcastMentor: string;
  pertanyaanPemantikPodcast: string;
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

app.post('/api/bank-materi', (req, res) => {
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
    const cleanEss = String(materiEsensial || '').trim();
    const cleanTp = String(tujuanPembelajaran || '').trim();
    const cleanEl = String(elemen || '').trim();
    const cleanMapel = String(mataPelajaran || '').trim();

    return {
      ringkasanAI: `Materi "${cleanEl}" pada mata pelajaran ${cleanMapel} (${kelasTarget}) yang disusun oleh ${teacherName} ini berfokus pada pencapaian Tujuan Pembelajaran: "${cleanTp}". Siswa dipandu menguasai konsep esensial secara bertahap mulai dari literasi di Perpustakaan, refleksi diri di Pusat Refleksi, diskusi lisan di Studio ON AIR, hingga evaluasi 5 jenjang di Lab DKV & Tefa.`,
      modulPerpustakaan: `BAB 1 — PENGANTAR ELEMEN: ${cleanEl.toUpperCase()}\nMata Pelajaran: ${cleanMapel} (${kelasTarget})\nGuru Pengampu: ${teacherName}\n\nTujuan Pembelajaran:\n${cleanTp}\n\nBAB 2 — INTI MATERI ESENSIAL\n${cleanEss}\n\nBAB 3 — PENERAPAN KONTEKSTUAL & LANGKAH PRAKTIS DI KOTA REFLEKSIA\n1. Pahami konsep kunci dan istilah utama pada materi ${cleanEl}.\n2. Hubungkan poin-poin materi esensial di atas dengan tugas praktik atau kehidupan sehari-hari sebagai siswa SMK jurusan DKV.\n3. Evaluasi hasil belajarmu melalui pencatatan Jurnal 4F (Facts, Feelings, Findings, Future) serta latihan kuis berjenjang di Lab DKV & Tefa.`,
      pertanyaanRefleksi: [
        `Dari materi "${cleanEl}" (${cleanMapel}), bagian konsep esensial mana yang paling cepat kamu pahami dan mengapa?`,
        `Tantangan atau kesulitan apa yang kamu temukan saat mencoba mencapai Tujuan Pembelajaran: "${cleanTp}"?`,
        `Langkah konkret apa yang akan kamu lakukan pada proyek atau latihan berikutnya untuk menerapkan materi ini secara lebih optimal?`,
      ],
      topikPodcastMentor: `Kupas Tuntas ${cleanMapel}: Strategi Menguasai Elemen "${cleanEl}" bersama ${teacherName}`,
      pertanyaanPemantikPodcast: `Setelah mempelajari materi esensial "${cleanEl}", bagaimana cara kamu menjelaskan kembali konsep utamanya dengan bahasa sendiri serta menerapkannya dalam karya nyata?`,
      misiBalaiKota: `Misi Kota (${cleanMapel}): Pelajari modul "${cleanEl}" di Perpustakaan, tulis refleksi di Pusat Refleksi, dan taklukkan Kuis 5 Jenjang di Lab DKV & Tefa!`,
      tantanganBangunanLain: [
        {
          buildingId: 'perpustakaan',
          buildingName: 'Perpustakaan Kampus',
          buildingIcon: '📚',
          activityTitle: `Modul Bacaan & Jurnal 4F: ${cleanEl}`,
          materialSummary: `Baca modul lengkap ${cleanMapel} yang disusun oleh ${teacherName} tentang "${cleanEl}", lalu rangkum temuanmu di Jurnal 4F.`,
          challengePrompt: `Baca 3 Bab modul "${cleanEl}" di Rak Buku Perpustakaan dan simpan Jurnal 4F (+XP).`,
        },
        {
          buildingId: 'taman_refleksi',
          buildingName: 'Pusat Refleksi',
          buildingIcon: '🌿',
          activityTitle: `Refleksi Mandiri: ${cleanEl}`,
          materialSummary: `Evaluasi pemahamanmu terhadap Tujuan Pembelajaran: "${cleanTp}".`,
          challengePrompt: `Pilih materi "${cleanMapel}: ${cleanEl}" di Pusat Refleksi lalu jawab 3 pertanyaan refleksi Guru.`,
        },
        {
          buildingId: 'menara_mentor',
          buildingName: 'Studio ON AIR',
          buildingIcon: '🎙️',
          activityTitle: `Podcast Interaktif AI Mentor: ${cleanEl}`,
          materialSummary: `Diskusikan poin penguatan materi "${cleanEl}" bersama Host AI Mentor di Studio ON AIR.`,
          challengePrompt: `Rekam episode Podcast membahas "${cleanEl}" dan dapatkan umpan balik langsung.`,
        },
        {
          buildingId: 'bengkel_latihan',
          buildingName: 'Lab DKV & Tefa',
          buildingIcon: '🛠️',
          activityTitle: `Kuis Berjenjang 5 Level: ${cleanEl}`,
          materialSummary: `Uji penguasaan materi esensial "${cleanEl}" dari Jenjang 1 (Dasar) hingga Jenjang 5 (Mahir).`,
          challengePrompt: `Kerjakan 5 soal kuis "${cleanMapel} - ${cleanEl}" di Lab DKV & Tefa.`,
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
          materialSummary: `Kirimkan pertanyaan kepada ${teacherName} jika ada bagian dari materi "${cleanEl}" yang masih belum jelas.`,
          challengePrompt: `Kirim pesan konsultasi materi "${cleanEl}" melalui Kantor Pos.`,
        },
        {
          buildingId: 'monumen_warga',
          buildingName: 'Monumen Warga',
          buildingIcon: '🗿',
          activityTitle: `Diskusi Warga: Berbagi Insight ${cleanEl}`,
          materialSummary: `Diskusikan ide penerapan materi "${cleanEl}" bersama teman sekelas di ruang obrolan Monumen Warga.`,
          challengePrompt: `Bagikan 1 kesimpulan menarik tentang "${cleanEl}" di Monumen Warga.`,
        },
        {
          buildingId: 'pasar_prestasi',
          buildingName: 'Pasar Prestasi',
          buildingIcon: '🏆',
          activityTitle: `Penghargaan Penguasaan Materi ${cleanMapel}`,
          materialSummary: `Setiap aktivitas belajar pada materi "${cleanEl}" menambah skor keaktifan dan XP warga di Pasar Prestasi.`,
          challengePrompt: `Kumpulkan XP dari misi Bank Materi untuk masuk Top 5 Warga Berprestasi.`,
        },
        {
          buildingId: 'masjid',
          buildingName: 'Masjid Al-Hikmah',
          buildingIcon: '🕌',
          activityTitle: `Integrasi Karakter & Keberkahan Ilmu: ${cleanMapel}`,
          materialSummary: `Niatkan mempelajari "${cleanEl}" dengan jujur, tekun, dan penuh tanggung jawab agar ilmu yang diperoleh membawa manfaat.`,
          challengePrompt: `Jaga adab menuntut ilmu dan ketekunan belajar di Kota Refleksia.`,
        },
      ],
      kuisBengkel: [
        {
          question: `[Jenjang 1 - Dasar] Berdasarkan materi "${cleanEl}" pada mata pelajaran ${cleanMapel}, apa tujuan pembelajaran utama yang ingin dicapai?`,
          options: [
            cleanTp.length > 110 ? cleanTp.slice(0, 110) + '...' : cleanTp,
            'Menghafal daftar istilah tanpa memahami penerapannya dalam proyek',
            'Melewatkan tahapan perencanaan dan analisis konsep dasar',
            'Mengabaikan kaidah keselamatan kerja dan kolaborasi tim',
          ],
          correctIndex: 0,
          explanation: `Tujuan pembelajaran utama pada elemen "${cleanEl}" adalah: ${cleanTp}`,
        },
        {
          question: `[Jenjang 2 - Pemahaman] Manakah pernyataan berikut yang paling sesuai dengan pokok Materi Esensial "${cleanEl}" yang diajarkan oleh ${teacherName}?`,
          options: [
            'Konsep materi tidak memiliki kaitan dengan praktik nyata siswa',
            cleanEss.length > 110 ? cleanEss.slice(0, 110) + '...' : cleanEss,
            'Seluruh tahapan dikerjakan secara acak tanpa struktur yang jelas',
            'Evaluasi hasil karya tidak diperlukan dalam proses belajar',
          ],
          correctIndex: 1,
          explanation: `Materi esensial menekankan pada pemahaman konsep inti: ${cleanEss.slice(0, 140)}`,
        },
        {
          question: `[Jenjang 3 - Penerapan] Saat menerapkan elemen "${cleanEl}" dalam tugas praktik ${cleanMapel}, langkah awal yang paling tepat dilakukan siswa adalah...`,
          options: [
            'Langsung mengumpulkan tugas tanpa membaca instruksi dan tujuan pembelajaran',
            'Memahami prinsip dasar materi esensial lalu menyusun rencana kerja sesuai indikator capaian',
            'Menyalin pekerjaan teman tanpa melakukan proses analisis mandiri',
            'Menghindari diskusi maupun refleksi ketika menemui kesulitan teknis',
          ],
          correctIndex: 1,
          explanation:
            'Penerapan yang baik selalu dimulai dari pemahaman materi esensial dan perencanaan kerja yang mengacu pada Tujuan Pembelajaran.',
        },
        {
          question: `[Jenjang 4 - Analisis] Mengapa siswa perlu melakukan refleksi setelah mempelajari elemen "${cleanEl}" pada mata pelajaran ${cleanMapel}?`,
          options: [
            'Untuk memetakan bagian konsep yang sudah dikuasai dan merancang perbaikan pada bagian yang masih sulit',
            'Agar tidak perlu mengikuti latihan soal di Lab DKV & Tefa',
            'Hanya sebagai formalitas tanpa dampak pada peningkatan keterampilan',
            'Untuk menggantikan seluruh kegiatan praktik kejuruan di kelas',
          ],
          correctIndex: 0,
          explanation:
            'Refleksi membantu siswa menyadari kekuatan dan celah pemahamannya sehingga dapat menyusun strategi tindak lanjut yang terukur.',
        },
        {
          question: `[Jenjang 5 - Evaluasi & Kreasi] Bagaimana indikator bahwa seorang siswa telah mencapai level Mahir pada elemen "${cleanEl}" (${cleanMapel})?`,
          options: [
            'Hanya mampu menyebutkan judul materi tanpa bisa memberi contoh',
            'Mampu mengintegrasikan konsep materi esensial ke dalam karya/solusi nyata secara mandiri, kritis, dan kreatif',
            'Bergantung sepenuhnya pada bantuan orang lain saat menyelesaikan masalah dasar',
            'Belum dapat menghubungkan tujuan pembelajaran dengan hasil pekerjaan',
          ],
          correctIndex: 1,
          explanation:
            'Pada jenjang Mahir, siswa mampu mengevaluasi dan menerapkan konsep esensial secara kreatif serta mandiri sesuai Tujuan Pembelajaran.',
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
    const prompt = `Anda adalah Arsitek Kurikulum AI Kota Refleksia untuk SMK Jurusan Desain Komunikasi Visual (DKV).
Seorang Guru baru saja menginput data Bank Materi berikut:
- Nama Guru: ${teacherName}
- Mata Pelajaran: ${mataPelajaran}
- Kelas Target: ${kelasTarget}
- Elemen Kurikulum: ${elemen}
- Tujuan Pembelajaran (TP): ${tujuanPembelajaran}
- Materi Esensial: ${materiEsensial}

Tugas Anda adalah mengolah input Guru tersebut menjadi paket pembelajaran lengkap yang OTOMATIS TERSEBAR ke seluruh 9 bangunan di Refleksia City agar bisa langsung diakses dan dipelajari oleh siswa:
1. "ringkasanAI": Ringkasan eksekutif materi (2-3 kalimat padat dan inspiratif).
2. "modulPerpustakaan": Modul bacaan lengkap dan mendalam (minimal 3 BAB: BAB 1 Pengantar & Konteks, BAB 2 Kupas Tuntas Materi Esensial, BAB 3 Studi Kasus & Penerapan Praktis bagi siswa SMK DKV) untuk dipasang di gedung Perpustakaan Kampus.
3. "pertanyaanRefleksi": Array berisi tepat 3 pertanyaan refleksi kontekstual & mendalam untuk dijawab siswa di gedung Pusat Refleksi.
4. "topikPodcastMentor": Judul/topik diskusi menarik untuk disiarkan bersama AI Host di gedung Studio ON AIR (Menara Mentor).
5. "pertanyaanPemantikPodcast": 1 pertanyaan pemantik HOTS yang akan ditanyakan oleh Host Podcast AI kepada siswa saat siaran di Studio ON AIR.
6. "misiBalaiKota": 1 kalimat misi aksi nyata warga Kota Refleksia yang tampil di papan pengumuman Balai Kota.
7. "tantanganBangunanLain": Array berisi tepat 9 objek distribusi untuk masing-masing bangunan di Kota Refleksia:
   - buildingId: "perpustakaan" (buildingName: "Perpustakaan Kampus", buildingIcon: "📚")
   - buildingId: "taman_refleksi" (buildingName: "Pusat Refleksi", buildingIcon: "🌿")
   - buildingId: "menara_mentor" (buildingName: "Studio ON AIR", buildingIcon: "🎙️")
   - buildingId: "bengkel_latihan" (buildingName: "Lab DKV & Tefa", buildingIcon: "🛠️")
   - buildingId: "balai_kota" (buildingName: "Balai Kota", buildingIcon: "🏛️")
   - buildingId: "kantor_pos" (buildingName: "Kantor Pos", buildingIcon: "📮")
   - buildingId: "monumen_warga" (buildingName: "Monumen Warga", buildingIcon: "🗿")
   - buildingId: "pasar_prestasi" (buildingName: "Pasar Prestasi", buildingIcon: "🏆")
   - buildingId: "masjid" (buildingName: "Masjid Al-Hikmah", buildingIcon: "🕌")
   Setiap objek memiliki activityTitle, materialSummary (konten spesifik materi di bangunan tersebut), dan challengePrompt (instruksi aktivitas bagi siswa).
8. "kuisBengkel": Array berisi tepat 5 soal pilihan ganda berjenjang (Jenjang 1 Dasar, Jenjang 2 Pemahaman, Jenjang 3 Penerapan, Jenjang 4 Analisis, Jenjang 5 Evaluasi/Kreasi) untuk gedung Lab DKV & Tefa (Bengkel Latihan). Setiap soal wajib memiliki:
   - question (diawali label "[Jenjang 1 - Dasar]" s.d. "[Jenjang 5 - Mahir]")
   - options (array berisi tepat 4 pilihan jawaban dalam Bahasa Indonesia)
   - correctIndex (angka 0, 1, 2, atau 3)
   - explanation (pembahasan jelas mengapa jawaban tersebut benar).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ringkasanAI: { type: Type.STRING },
            modulPerpustakaan: { type: Type.STRING },
            pertanyaanRefleksi: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            topikPodcastMentor: { type: Type.STRING },
            pertanyaanPemantikPodcast: { type: Type.STRING },
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
            'ringkasanAI',
            'modulPerpustakaan',
            'pertanyaanRefleksi',
            'topikPodcastMentor',
            'pertanyaanPemantikPodcast',
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
        ringkasanAI: parsed.ringkasanAI || fb.ringkasanAI,
        modulPerpustakaan: parsed.modulPerpustakaan || fb.modulPerpustakaan,
        pertanyaanRefleksi:
          Array.isArray(parsed.pertanyaanRefleksi) && parsed.pertanyaanRefleksi.length >= 3
            ? parsed.pertanyaanRefleksi.slice(0, 3)
            : fb.pertanyaanRefleksi,
        topikPodcastMentor: parsed.topikPodcastMentor || fb.topikPodcastMentor,
        pertanyaanPemantikPodcast: parsed.pertanyaanPemantikPodcast || fb.pertanyaanPemantikPodcast,
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

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
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
