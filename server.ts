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

app.use(express.json());

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

  // Step 1: After student shares 'Yang Sudah Kamu Kuasai' -> Host responds warmly and asks 'Area Perlu Diperkuat'
  if (step === 'after_mastered') {
    const fallbackReply = `Wah, luar biasa sekali ${studentName}! Pemahamanmu tentang "${sudahDikuasai}" pada materi ${materiTitle} sudah sangat mantap dan aplikatif untuk anak DKV. Nah, sekarang kita geser sedikit nih obrolannya: dari materi ini, bagian atau area mana yang menurutmu masih agak membingungkan dan perlu diperkuat? Ceritakan santai saja!`;

    if (!ai || !apiKey) {
      return res.json({ success: true, data: { hostReply: fallbackReply } });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Siswa bernama ${studentName} (${className}) sedang menjadi bintang tamu di Podcast Studio ON AIR Menara Mentor membahas materi "${materiTitle}".
Ringkasan materi: ${materiSummary || materiTitle}.
Siswa baru saja menjawab tentang Hal yang Sudah Dikuasai: "${sudahDikuasai}".
Sebagai Host Podcast AI yang seru, hangat, dan suportif, berikan tanggapan singkat yang mengapresiasi jawaban tersebut (1-2 kalimat), lalu tanyakan dengan santai: "Bagian atau area mana dari materi ini yang menurutmu masih perlu diperkuat atau masih membingungkan?"`,
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
      `Ulas kembali poin inti "${perluDiperkuat}" pada modul di Perpustakaan sambil membuat catatan visual berwarna.`,
      `Praktikkan langsung lewat contoh kasus sederhana di studio desain atau diskusikan dengan teman sebangku.`,
      `Coba uji pemahaman di Bengkel Latihan atau kirim pertanyaan spesifik ke guru lewat Kantor Pos.`,
    ];
    const fallbackTrigger = `Kalau konsep "${materiTitle}" ini kamu terapkan saat mengerjakan proyek desain klien di dunia nyata nanti, langkah kreatif apa yang paling ingin kamu coba pertama kali?`;
    const fallbackHostSpeech = `Terima kasih sudah jujur berbagi, ${studentName}! Wajar banget kalau bagian "${perluDiperkuat}" terasa menantang. Sebagai Host sekaligus Mentor AI, saya punya beberapa saran konkret dan satu pertanyaan pemantik spesial untukmu. Setelah ini, yuk bagikan jawabanmu atas pertanyaan pemantik tersebut sekaligus Rencana Belajarmu ke depan!`;

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
        contents: `Kamu adalah Host Podcast AI sekaligus Mentor Kota di SMK Negeri 2 Gorontalo (Jurusan DKV).
Bintang tamu siswa: ${studentName} (${className}).
Materi yang dibahas: "${materiTitle}".
1. Hal yang sudah dikuasai siswa: "${sudahDikuasai}"
2. Area yang masih perlu diperkuat menurut siswa: "${perluDiperkuat}"

Tugasmu di segmen podcast ini:
- Buat "hostIntro": Tanggapan gaya host podcast yang hangat dan memvalidasi usaha siswa (2 kalimat).
- Buat "saranKonkret": Tepat 3 saran konkret, praktis, dan relevan dengan siswa SMK DKV untuk memperkuat area yang masih sulit tersebut.
- Buat "pertanyaanPemantik": 1 pertanyaan pemantik reflektif yang menantang rasa ingin tahu siswa terkait penerapan materi di dunia desain/komputasi.
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

  // Step 3: After student answers trigger question & submits Rencana Belajar -> Host closes the podcast episode warmly
  const fallbackClosing = `Luar biasa sekali, ${studentName}! Jawaban dan rencana belajarmu sangat matang. Terima kasih sudah hadir di Studio Podcast ON AIR Menara Mentor Kota hari ini. Rekaman teks transkrip podcast ini sudah disimpan ke Riwayat Podcast dan Google Spreadsheet! Tetap semangat berkarya!`;

  if (!ai || !apiKey) {
    return res.json({ success: true, data: { hostClosing: fallbackClosing } });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Kamu adalah Host Podcast AI di Menara Mentor Kota.
Siswa ${studentName} (${className}) baru saja menyelesaikan sesi podcast materi "${materiTitle}".
Jawaban siswa atas pertanyaan pemantik: "${jawabanPemantikSiswa || '-'}"
Rencana belajar siswa: "${Array.isArray(rencanaBelajarSiswa) ? rencanaBelajarSiswa.join('; ') : rencanaBelajarSiswa || '-'}"
Berikan kalimat penutup podcast (closing statement) yang antusias, mengapresiasi komitmen belajar siswa, dan menutup siaran ON AIR dengan hangat (2-3 kalimat).`,
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

// SSE Stream for Instant Real-Time Multi-Device Presence
app.get('/api/presence/stream', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  sseClients.add(res);

  // Send initial players immediately on connection
  purgeInactivePlayers();
  const initial = Array.from(onlinePlayersMap.values());
  res.write(`data: ${JSON.stringify({ type: 'sync', onlinePlayers: initial })}\n\n`);

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

  // Return all other active online players from other devices/browsers
  const others = Array.from(onlinePlayersMap.values()).filter((p) => p.id !== data.id);
  res.json({
    success: true,
    onlinePlayers: others,
    count: others.length + 1,
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

startServer();
