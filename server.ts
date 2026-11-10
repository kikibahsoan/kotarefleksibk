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


