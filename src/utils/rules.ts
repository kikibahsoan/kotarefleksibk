import type { Reflection, ReflectionAnswers, Student, Materi, MentorFeedback } from '../types/index.ts';

export interface LevelInfo {
  level: number;
  title: string;
  minPoints: number;
  nextLevelPoints: number;
  progressPercent: number;
}

export function calculateStudentLevel(points: number): LevelInfo {
  const levels = [
    { level: 1, title: 'Warga Pemula', min: 0, max: 50 },
    { level: 2, title: 'Penjelajah Kota', min: 50, max: 150 },
    { level: 3, title: 'Pelajar Kritis', min: 150, max: 300 },
    { level: 4, title: 'Master Refleksi', min: 300, max: 500 },
    { level: 5, title: 'Arsitek Pembelajar', min: 500, max: 1000 },
  ];

  for (let i = 0; i < levels.length; i++) {
    const lvl = levels[i];
    if (points < lvl.max || i === levels.length - 1) {
      const range = lvl.max - lvl.min;
      const current = Math.max(0, points - lvl.min);
      const progressPercent = Math.min(100, Math.round((current / range) * 100));
      return {
        level: lvl.level,
        title: lvl.title,
        minPoints: lvl.min,
        nextLevelPoints: lvl.max,
        progressPercent,
      };
    }
  }

  return {
    level: 5,
    title: 'Arsitek Pembelajar',
    minPoints: 500,
    nextLevelPoints: 1000,
    progressPercent: 100,
  };
}

export function evaluateBadges(
  student: Student,
  studentReflections: Reflection[],
  quizScoreCount: number,
  sentMessagesCount: number
): string[] {
  const currentBadges = new Set(student.badges || []);

  // 1. Reflektor Pertama: Menulis minimal 1 refleksi
  if (studentReflections.length >= 1) {
    currentBadges.add('reflektor_pertama');
  }

  // 2. Reflektor Gigih: Menulis minimal 3 refleksi
  if (studentReflections.length >= 3) {
    currentBadges.add('reflektor_gigih');
  }

  // 3. Penjelajah Rajin: Streak belajar minimal 3 hari
  if (student.streakDays >= 3) {
    currentBadges.add('penjelajah_rajin');
  }

  // 4. Juara Bengkel: Menyelesaikan kuis latihan minimal 2 kali
  if (quizScoreCount >= 2) {
    currentBadges.add('juara_bengkel');
  }

  // 5. Murid Komunikatif: Bertanya atau mengirim pesan ke guru
  if (sentMessagesCount >= 1) {
    currentBadges.add('murid_komunikatif');
  }

  // 6. Pemikir Kritis: Memberikan refleksi dengan skala jujur dan jawaban terurai
  const detailedCount = studentReflections.filter(
    (r) =>
      (r.answers?.understood?.length || 0) > 30 &&
      (r.answers?.difficult?.length || 0) > 20 &&
      (r.answers?.actionPlan?.length || 0) > 20
  ).length;
  if (detailedCount >= 2) {
    currentBadges.add('pemikir_kritis');
  }

  return Array.from(currentBadges);
}

export interface ClassStats {
  totalReflections: number;
  averageScale: number;
  studentCount: number;
  studentsPendingReflectionCount: number;
  attentionNeededCount: number;
  hardestTopic: {
    materiId: string;
    title: string;
    avgScale: number;
    count: number;
  } | null;
  scaleDistribution: Record<number, number>;
}

export function calculateClassStats(
  reflections: Reflection[],
  feedbacks: MentorFeedback[],
  allStudents: Student[],
  materis: Materi[],
  selectedClass?: string
): ClassStats {
  const filteredReflections = selectedClass && selectedClass !== 'all'
    ? reflections.filter((r) => r.className === selectedClass)
    : reflections;

  const filteredStudents = selectedClass && selectedClass !== 'all'
    ? allStudents.filter((s) => s.className === selectedClass)
    : allStudents;

  const totalReflections = filteredReflections.length;
  const sumScale = filteredReflections.reduce((acc, r) => acc + (r.scale || 0), 0);
  const averageScale = totalReflections > 0 ? Number((sumScale / totalReflections).toFixed(1)) : 0;

  const reflectedStudentIds = new Set(filteredReflections.map((r) => r.studentId));
  const studentsPendingReflectionCount = filteredStudents.filter(
    (s) => !reflectedStudentIds.has(s.id)
  ).length;

  const attentionReflectionIds = new Set(
    feedbacks.filter((f) => f.perlu_perhatian_guru).map((f) => f.reflectionId)
  );

  const attentionNeededCount = filteredReflections.filter(
    (r) => attentionReflectionIds.has(r.id) || r.scale <= 2
  ).length;

  // Scale distribution (1 to 5)
  const scaleDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  filteredReflections.forEach((r) => {
    const s = Math.round(r.scale);
    if (scaleDistribution[s] !== undefined) {
      scaleDistribution[s]++;
    }
  });

  // Calculate hardest topic (lowest average scale with at least 1 reflection)
  const materiStats: Record<string, { total: number; sum: number }> = {};
  filteredReflections.forEach((r) => {
    if (!materiStats[r.materiId]) {
      materiStats[r.materiId] = { total: 0, sum: 0 };
    }
    materiStats[r.materiId].total++;
    materiStats[r.materiId].sum += r.scale;
  });

  let hardestTopic: ClassStats['hardestTopic'] = null;
  let lowestAvg = 999;

  Object.keys(materiStats).forEach((mId) => {
    const stat = materiStats[mId];
    const avg = stat.sum / stat.total;
    if (avg < lowestAvg) {
      lowestAvg = avg;
      const mObj = materis.find((m) => m.id === mId);
      hardestTopic = {
        materiId: mId,
        title: mObj?.title || 'Materi Belum Terdaftar',
        avgScale: Number(avg.toFixed(1)),
        count: stat.total,
      };
    }
  });

  return {
    totalReflections,
    averageScale,
    studentCount: filteredStudents.length,
    studentsPendingReflectionCount,
    attentionNeededCount,
    hardestTopic,
    scaleDistribution,
  };
}

export function validateReflection(
  answers: Partial<ReflectionAnswers>,
  scale: number
): { valid: boolean; error?: string } {
  if (!scale || scale < 1 || scale > 5) {
    return { valid: false, error: 'Silakan pilih skala pemahaman bintang 1 sampai 5.' };
  }
  if (!answers.understood || answers.understood.trim().length < 5) {
    return { valid: false, error: 'Mohon tulis apa yang sudah kamu pahami (minimal 5 karakter).' };
  }
  if (!answers.difficult || answers.difficult.trim().length < 5) {
    return { valid: false, error: 'Mohon tulis bagian materi yang masih sulit atau membingungkan.' };
  }
  if (!answers.actionPlan || answers.actionPlan.trim().length < 5) {
    return { valid: false, error: 'Mohon tulis rencana yang akan kamu lakukan agar lebih paham.' };
  }
  return { valid: true };
}

export function generateCSVExport(
  reflections: Reflection[],
  feedbacks: MentorFeedback[],
  materis: Materi[]
): string {
  const headers = [
    'ID Refleksi',
    'Tanggal',
    'Nama Murid',
    'Kelas',
    'Materi',
    'Skala Pemahaman (1-5)',
    'Suasana Hati',
    'Yang Dipahami',
    'Yang Masih Sulit',
    'Rencana Murid',
    'Apresiasi AI',
    'Perlu Perhatian Guru',
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = reflections.map((r) => {
    const fb = feedbacks.find((f) => f.reflectionId === r.id);
    const m = materis.find((mat) => mat.id === r.materiId);
    return [
      escapeCSV(r.id),
      escapeCSV(r.createdAt),
      escapeCSV(r.studentName),
      escapeCSV(r.className),
      escapeCSV(m?.title || r.materiTitle || r.materiId),
      escapeCSV(r.scale),
      escapeCSV(r.moodEmoji),
      escapeCSV(r.answers?.understood || ''),
      escapeCSV(r.answers?.difficult || ''),
      escapeCSV(r.answers?.actionPlan || ''),
      escapeCSV(fb?.apresiasi || ''),
      escapeCSV(fb?.perlu_perhatian_guru ? 'YA (Perlu Pendampingan)' : 'Tidak'),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function getGoogleAppsScriptCode(): string {
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: BACKEND KOTA REFLEKSI (SMK INFORMATIKA)
 * Guru: Pak Abdul Rahman Bahsoan
 * =========================================================================
 * CARA PAKAI:
 * 1. Buka Google Spreadsheet baru di browser Anda.
 * 2. Klik menu 'Ekstensi' > 'Apps Script'.
 * 3. Hapus semua kode bawaan, lalu tempel SELURUH skrip ini.
 * 4. Klik tombol 'Terapkan (Deploy)' > 'Deployment Baru'.
 * 5. Pilih jenis 'Aplikasi Web' (Web App):
 *    - Jalankan sebagai (Execute as): 'Saya' (akun Google guru Anda)
 *    - Siapa yang memiliki akses (Who has access): 'Siapa saja' (Anyone)  <-- PENTING!
 * 6. Klik 'Terapkan', lalu izinkan akses Google saat diminta.
 * 7. Salin URL Web App yang berakhiran '/exec', lalu tempel di Ruang Guru Kota Refleksi.
 * =========================================================================
 */

function getOrCreateSheet(sheetName, headers, headerColor) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground(headerColor || "#1E3A8A");
    headerRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function setupSpreadsheet() {
  var headersRefleksi = [
    'Waktu Catat',
    'ID Refleksi',
    'Nama Siswa',
    'Kelas',
    'No. Absen',
    'Judul Materi',
    'Skala Bintang (1-5)',
    'Emoji Perasaan',
    'Yang Sudah Dipahami',
    'Yang Masih Sulit / Bingung',
    'Rencana Aksi Siswa',
    'Jawaban Khusus Modul',
    'Apresiasi AI Mentor',
    'Hal yang Sudah Dikuasai',
    'Hal yang Perlu Diperkuat',
    'Saran AI Mentor',
    'Pertanyaan Pemantik AI',
    'Rencana Belajar AI',
    'Perlu Perhatian Guru (YA/TIDAK)'
  ];

  var headersPesan = [
    'Waktu Kirim',
    'ID Pesan',
    'Nama Siswa',
    'Kelas',
    'Isi Pesan / Pertanyaan Siswa',
    'Balasan Guru',
    'Status Balasan',
    'Waktu Dibalas'
  ];

  var headersMurid = [
    'ID Siswa',
    'Nama Siswa',
    'Kelas',
    'No. Absen',
    'Total Poin XP',
    'Daftar Lencana',
    'Terakhir Aktif'
  ];

  getOrCreateSheet('Data_Refleksi_Siswa', headersRefleksi, '#0284C7');
  getOrCreateSheet('Pesan_Kantor_Pos', headersPesan, '#DC2626');
  getOrCreateSheet('Daftar_Siswa', headersMurid, '#059669');
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var contents = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var requestData = JSON.parse(contents);
    var action = requestData.action || '';
    var result = { success: true };

    if (action === 'submit_reflection') {
      var ref = requestData.reflection || {};
      var fb = requestData.feedback || {};
      var answers = ref.answers || {};

      var headersRefleksi = [
        'Waktu Catat',
        'ID Refleksi',
        'Nama Siswa',
        'Kelas',
        'No. Absen',
        'Judul Materi',
        'Skala Bintang (1-5)',
        'Emoji Perasaan',
        'Yang Sudah Dipahami',
        'Yang Masih Sulit / Bingung',
        'Rencana Aksi Siswa',
        'Jawaban Khusus Modul',
        'Apresiasi AI Mentor',
        'Hal yang Sudah Dikuasai',
        'Hal yang Perlu Diperkuat',
        'Saran AI Mentor',
        'Pertanyaan Pemantik AI',
        'Rencana Belajar AI',
        'Perlu Perhatian Guru (YA/TIDAK)'
      ];

      var rSheet = getOrCreateSheet('Data_Refleksi_Siswa', headersRefleksi, '#0284C7');

      var customAnswersStr = '';
      if (answers.customAnswers) {
        customAnswersStr = Object.entries(answers.customAnswers)
          .map(function(pair) { return pair[0] + ': ' + pair[1]; })
          .join(' | ');
      }

      var rowData = [
        ref.createdAt || new Date().toLocaleString('id-ID'),
        ref.id || '',
        ref.studentName || '',
        ref.className || '',
        ref.studentNumber || '',
        ref.materiTitle || '',
        ref.scale || 0,
        ref.moodEmoji || '',
        answers.understood || '',
        answers.difficult || '',
        answers.actionPlan || '',
        customAnswersStr,
        fb.apresiasi || '',
        Array.isArray(fb.sudah_dikuasai) ? fb.sudah_dikuasai.join('; ') : (fb.sudah_dikuasai || ''),
        Array.isArray(fb.perlu_diperkuat) ? fb.perlu_diperkuat.join('; ') : (fb.perlu_diperkuat || ''),
        Array.isArray(fb.saran) ? fb.saran.join('; ') : (fb.saran || ''),
        fb.pertanyaan_pemantik || '',
        Array.isArray(fb.rencana_belajar) ? fb.rencana_belajar.join('; ') : (fb.rencana_belajar || ''),
        fb.perlu_perhatian_guru ? 'YA (Butuh Bimbingan)' : 'Tidak'
      ];

      rSheet.appendRow(rowData);
      result.message = "Refleksi siswa " + ref.studentName + " berhasil dicatat di Spreadsheet!";

    } else if (action === 'send_message') {
      var msg = requestData.message || {};
      var headersPesan = [
        'Waktu Kirim',
        'ID Pesan',
        'Nama Siswa',
        'Kelas',
        'Isi Pesan / Pertanyaan Siswa',
        'Balasan Guru',
        'Status Balasan',
        'Waktu Dibalas'
      ];

      var pSheet = getOrCreateSheet('Pesan_Kantor_Pos', headersPesan, '#DC2626');

      pSheet.appendRow([
        msg.createdAt || new Date().toLocaleString('id-ID'),
        msg.id || '',
        msg.studentName || '',
        msg.className || '',
        msg.content || '',
        msg.teacherReply || '',
        msg.status || 'unread',
        msg.repliedAt || ''
      ]);
      result.message = "Pesan siswa berhasil dicatat di Spreadsheet!";
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ContentService.createTextOutput(JSON.stringify({
    status: "Online",
    app: "Kota Refleksi SMK",
    spreadsheet: ss.getName(),
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
}
