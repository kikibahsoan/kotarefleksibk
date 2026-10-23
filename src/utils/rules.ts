import type { Reflection, ReflectionAnswers, Student, Materi, MentorFeedback, Message } from '../types/index.ts';

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

export function parseSpreadsheetPastedText(rawText: string): {
  reflections: Reflection[];
  feedbacks: MentorFeedback[];
  messages: Message[];
} {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const reflections: Reflection[] = [];
  const feedbacks: MentorFeedback[] = [];
  const messages: Message[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    // Split by tab (default copy from Google Spreadsheet) or comma/semicolon
    let cols = line.split('\t');
    if (cols.length < 3) {
      cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    }
    cols = cols.map((c) => c.replace(/^["']|["']$/g, '').trim());

    // Skip header row
    const lineLower = line.toLowerCase();
    if (
      lineLower.includes('waktu catat') ||
      lineLower.includes('id refleksi') ||
      lineLower.includes('nama siswa') ||
      lineLower.includes('isi pesan') ||
      lineLower.includes('waktu kirim')
    ) {
      continue;
    }

    // Check if reflection row (has multiple columns)
    if (cols.length >= 6) {
      const possibleScale = parseInt(cols[6], 10);
      const isScaleValid = !isNaN(possibleScale) && possibleScale >= 1 && possibleScale <= 5;

      // Columns in Data_Refleksi_Siswa:
      // 0: Waktu Catat, 1: ID Refleksi, 2: Nama Siswa, 3: Kelas, 4: No. Absen, 5: Judul Materi, 6: Skala (1-5), 7: Mood,
      // 8: Dipahami, 9: Sulit, 10: Rencana, 11: Custom, 12: Apresiasi AI, 13: Dikuasai, 14: Diperkuat, 15: Saran, 16: Pemantik, 17: Rencana AI, 18: Perlu Perhatian
      if (isScaleValid || cols.length >= 9) {
        const createdAt = cols[0] || new Date().toLocaleString('id-ID');
        const refId = cols[1] && cols[1].startsWith('ref-') ? cols[1] : `ref-sheet-${Date.now().toString(36)}-${idx}`;
        const studentName = cols[2] || 'Siswa SMK';
        const className = cols[3] || 'X DKV 1 (Desain Komunikasi Visual)';
        const studentNumber = cols[4] || '';
        const materiTitle = cols[5] || 'Refleksi Berpikir Komputasional';
        const scale = isScaleValid ? possibleScale : 4;
        const moodEmoji = cols[7] || '😊';
        const understood = cols[8] || '-';
        const difficult = cols[9] || '-';
        const actionPlan = cols[10] || '-';
        const customAnswersStr = cols[11] || '';

        const fbApresiasi = cols[12] || `Bagus sekali refleksimu, ${studentName}!`;
        const fbSudah = cols[13] ? cols[13].split('; ') : [understood];
        const fbPerlu = cols[14] ? cols[14].split('; ') : [difficult];
        const fbSaran = cols[15] ? cols[15].split('; ') : ['Terus kembangkan pemahaman materi.'];
        const fbPemantik = cols[16] || 'Bagaimana penerapan materi ini pada proyekmu?';
        const fbRencana = cols[17] ? cols[17].split('; ') : [actionPlan];
        const fbPerhatian = (cols[18] || '').toUpperCase().includes('YA');

        const studentId = `std-${studentName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

        reflections.push({
          id: refId,
          studentId,
          studentName,
          className,
          studentNumber,
          materiId: 'mat-sheet',
          materiTitle,
          scale,
          moodEmoji,
          answers: {
            understood,
            difficult,
            actionPlan,
            customAnswers: customAnswersStr ? { 'Catatan': customAnswersStr } : undefined,
          },
          createdAt,
        });

        feedbacks.push({
          id: `fb-${refId}`,
          reflectionId: refId,
          apresiasi: fbApresiasi,
          sudah_dikuasai: fbSudah,
          perlu_diperkuat: fbPerlu,
          saran: fbSaran,
          pertanyaan_pemantik: fbPemantik,
          rencana_belajar: fbRencana,
          perlu_perhatian_guru: fbPerhatian,
          completedSteps: [false, false, false],
        });
        continue;
      }
    }

    // Check if message row (Columns: [Waktu Kirim, ID Pesan, Nama Siswa, Kelas, Isi Pesan, Balasan Guru, Status, Waktu Dibalas])
    if (cols.length >= 4) {
      const createdAt = cols[0] || new Date().toLocaleString('id-ID');
      const msgId = cols[1] && cols[1].startsWith('msg-') ? cols[1] : `msg-sheet-${Date.now().toString(36)}-${idx}`;
      const studentName = cols[2] || 'Siswa SMK';
      const className = cols[3] || 'X DKV 1 (Desain Komunikasi Visual)';
      const content = cols[4] || '';
      const teacherReply = cols[5] || undefined;
      const status: 'unread' | 'replied' = cols[6] === 'replied' || teacherReply ? 'replied' : 'unread';
      const repliedAt = cols[7] || undefined;

      if (content || studentName) {
        messages.push({
          id: msgId,
          studentId: `std-${studentName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          studentName,
          className,
          content: content || 'Pesan refleksi siswa',
          teacherReply,
          status,
          createdAt,
          repliedAt,
        });
      }
    }
  }

  return { reflections, feedbacks, messages };
}

export function getGoogleAppsScriptCode(): string {
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: BACKEND KOTA REFLEKSI (VERSI 2.0 - DUA ARAH)
 * Guru: Pak Abdul Rahman Bahsoan (SMK Negeri 2 Gorontalo)
 * Fitur: Simpan Refleksi/Pesan & BACA KEMBALI data ke Ruang Guru Kota Refleksi
 * =========================================================================
 * PANDUAN PEMBARUAN CEPAT (1 MENIT):
 * 1. Buka spreadsheet 'Data Base Kota Refleksi' di Google Spreadsheet Anda.
 * 2. Klik menu 'Ekstensi' > 'Apps Script'.
 * 3. Hapus seluruh kode lama yang ada di editor, lalu tempel SELURUH skrip ini.
 * 4. Klik tombol 'Terapkan (Deploy)' di kanan atas > pilih 'Kelola Deployment' (Manage Deployments).
 * 5. Klik ikon PENSIL (Edit) di samping deployment aktif Anda:
 *    - Versi: pilih 'Versi Baru' (New version)
 *    - Jalankan sebagai: 'Saya'
 *    - Akses: 'Siapa saja' (Anyone)  <-- Wajib Siapa saja!
 * 6. Klik 'Terapkan (Deploy)'.
 * 7. Selesai! Ruang Guru sekarang dapat otomatis menyinkronkan data langsung dari Spreadsheet!
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
  var headersObrolan = [
    'Waktu Kirim',
    'ID Pesan',
    'Nama Siswa',
    'Handle Siswa',
    'Kelas',
    'Ruang',
    'Isi Obrolan (Maks 120 Karakter)'
  ];

  getOrCreateSheet('Data_Refleksi_Siswa', headersRefleksi, '#0284C7');
  getOrCreateSheet('Pesan_Kantor_Pos', headersPesan, '#DC2626');
  getOrCreateSheet('Obrolan_Monumen_Warga', headersObrolan, '#0D9488');
}

/**
 * Endpoint GET: Membaca data refleksi, pesan, & obrolan monumen dari Google Spreadsheet
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var result = {
    status: "Online",
    version: "2.0",
    app: "Kota Refleksi SMK",
    spreadsheet: ss.getName(),
    time: new Date().toISOString(),
    reflections: [],
    feedbacks: [],
    messages: [],
    chats: []
  };

  try {
    // 1. Baca Data_Refleksi_Siswa
    var refSheet = ss.getSheetByName('Data_Refleksi_Siswa');
    if (refSheet && refSheet.getLastRow() > 1) {
      var numRows = refSheet.getLastRow() - 1;
      var numCols = Math.max(refSheet.getLastColumn(), 19);
      var rows = refSheet.getRange(2, 1, numRows, numCols).getValues();

      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var studentName = String(r[2] || '').trim();
        var materiTitle = String(r[5] || '').trim();
        if (!studentName && !materiTitle) continue;

        var refId = String(r[1] || ('ref-' + (i + 1))).trim();
        var createdAt = String(r[0] || new Date().toLocaleString('id-ID')).trim();
        var className = String(r[3] || 'X DKV 1 (Desain Komunikasi Visual)').trim();
        var studentNumber = String(r[4] || '').trim();
        var scale = Number(r[6]) || 4;
        var moodEmoji = String(r[7] || '😊').trim();
        var understood = String(r[8] || '').trim();
        var difficult = String(r[9] || '').trim();
        var actionPlan = String(r[10] || '').trim();
        var customAnswersStr = String(r[11] || '').trim();

        var fbApresiasi = String(r[12] || ('Bagus sekali refleksimu, ' + studentName)).trim();
        var fbSudah = String(r[13] || understood).trim();
        var fbPerlu = String(r[14] || difficult).trim();
        var fbSaran = String(r[15] || 'Terus kembangkan pemahaman materi ini').trim();
        var fbPemantik = String(r[16] || 'Bagaimana penerapan materi ini pada proyekmu?').trim();
        var fbRencana = String(r[17] || actionPlan).trim();
        var fbPerhatian = String(r[18] || '').trim();

        var studentId = 'std-' + studentName.toLowerCase().replace(/[^a-z0-9]/g, '_');

        result.reflections.push({
          id: refId,
          studentId: studentId,
          studentName: studentName,
          className: className,
          studentNumber: studentNumber,
          materiId: 'mat-sheet-' + (i + 1),
          materiTitle: materiTitle || 'Refleksi Berpikir Komputasional',
          scale: scale,
          moodEmoji: moodEmoji,
          answers: {
            understood: understood,
            difficult: difficult,
            actionPlan: actionPlan,
            customAnswers: customAnswersStr ? { 'Catatan': customAnswersStr } : undefined
          },
          createdAt: createdAt
        });

        result.feedbacks.push({
          id: 'fb-' + refId,
          reflectionId: refId,
          apresiasi: fbApresiasi,
          sudah_dikuasai: fbSudah ? fbSudah.split('; ') : [understood],
          perlu_diperkuat: fbPerlu ? fbPerlu.split('; ') : [difficult],
          saran: fbSaran ? fbSaran.split('; ') : ['Terus kembangkan pemahaman materi.'],
          pertanyaan_pemantik: fbPemantik,
          rencana_belajar: fbRencana ? fbRencana.split('; ') : [actionPlan],
          perlu_perhatian_guru: fbPerhatian.toUpperCase().indexOf('YA') !== -1,
          completedSteps: [false, false, false]
        });
      }
    }

    // 2. Baca Pesan_Kantor_Pos
    var pSheet = ss.getSheetByName('Pesan_Kantor_Pos');
    if (pSheet && pSheet.getLastRow() > 1) {
      var pRows = pSheet.getRange(2, 1, pSheet.getLastRow() - 1, Math.max(pSheet.getLastColumn(), 8)).getValues();
      for (var j = 0; j < pRows.length; j++) {
        var pr = pRows[j];
        var mContent = String(pr[4] || '').trim();
        var mName = String(pr[2] || '').trim();
        if (!mContent && !mName) continue;

        var msgId = String(pr[1] || ('msg-' + (j + 1))).trim();
        var mCreated = String(pr[0] || new Date().toLocaleString('id-ID')).trim();
        var mClass = String(pr[3] || 'X DKV 1 (Desain Komunikasi Visual)').trim();
        var mReply = String(pr[5] || '').trim();
        var mStatus = String(pr[6] || (mReply ? 'replied' : 'unread')).trim();
        var mRepliedAt = String(pr[7] || '').trim();

        result.messages.push({
          id: msgId,
          studentId: 'std-' + mName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          studentName: mName || 'Siswa SMK',
          className: mClass,
          content: mContent,
          teacherReply: mReply || undefined,
          status: mStatus === 'replied' ? 'replied' : 'unread',
          createdAt: mCreated,
          repliedAt: mRepliedAt || undefined
        });
      }
    }

    // 3. Baca Obrolan_Monumen_Warga (hanya ambil obrolan 24 jam terakhir)
    var cSheet = ss.getSheetByName('Obrolan_Monumen_Warga');
    if (cSheet && cSheet.getLastRow() > 1) {
      var cRows = cSheet.getRange(2, 1, cSheet.getLastRow() - 1, Math.max(cSheet.getLastColumn(), 7)).getValues();
      var nowMillis = new Date().getTime();
      var twentyFourHours = 24 * 3600 * 1000;

      for (var c = 0; c < cRows.length; c++) {
        var cr = cRows[c];
        var cContent = String(cr[6] || '').trim();
        if (!cContent) continue;

        var cTimeStr = String(cr[0] || '').trim();
        var cDate = new Date(cTimeStr).getTime();
        // Lewati obrolan yang sudah lebih dari 24 jam
        if (!isNaN(cDate) && (nowMillis - cDate > twentyFourHours)) {
          continue;
        }

        result.chats.push({
          id: String(cr[1] || ('pchat-' + (c + 1))).trim(),
          senderName: String(cr[2] || 'Warga').trim(),
          senderHandle: String(cr[3] || '@warga').trim(),
          className: String(cr[4] || 'X DKV SMK').trim(),
          roomNumber: Number(cr[5]) || 1,
          content: cContent,
          timestamp: new Date(cTimeStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          createdAt: cTimeStr || new Date().toISOString()
        });
      }
    }

  } catch (err) {
    result.error = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Endpoint POST: Menyimpan refleksi baru, pesan baru, atau balasan guru
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);
  var ss = SpreadsheetApp.getActiveSpreadsheet();

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

    } else if (action === 'reply_message') {
      var msgId = requestData.messageId;
      var reply = requestData.reply;
      var repliedAt = requestData.repliedAt || new Date().toLocaleString('id-ID');

      var sheetP = ss.getSheetByName('Pesan_Kantor_Pos');
      if (sheetP && sheetP.getLastRow() > 1) {
        var ids = sheetP.getRange(2, 2, sheetP.getLastRow() - 1, 1).getValues();
        for (var k = 0; k < ids.length; k++) {
          if (String(ids[k][0]).trim() === String(msgId).trim()) {
            var rowIndex = k + 2;
            sheetP.getRange(rowIndex, 6).setValue(reply);
            sheetP.getRange(rowIndex, 7).setValue('replied');
            sheetP.getRange(rowIndex, 8).setValue(repliedAt);
            break;
          }
        }
      }
      result.message = "Balasan guru berhasil diperbarui di Spreadsheet!";

    } else if (action === 'delete_reflection') {
      var delRefId = requestData.reflectionId;
      var sheetR = ss.getSheetByName('Data_Refleksi_Siswa');
      if (sheetR && sheetR.getLastRow() > 1 && delRefId) {
        var rIds = sheetR.getRange(2, 2, sheetR.getLastRow() - 1, 1).getValues();
        for (var d = 0; d < rIds.length; d++) {
          if (String(rIds[d][0]).trim() === String(delRefId).trim()) {
            sheetR.deleteRow(d + 2);
            result.message = "Baris refleksi berhasil dihapus dari Spreadsheet!";
            break;
          }
        }
      }

    } else if (action === 'clear_all_reflections') {
      var sheetAll = ss.getSheetByName('Data_Refleksi_Siswa');
      if (sheetAll && sheetAll.getLastRow() > 1) {
        sheetAll.deleteRows(2, sheetAll.getLastRow() - 1);
        result.message = "Seluruh baris refleksi berhasil dikosongkan dari Spreadsheet!";
      }

    } else if (action === 'send_public_chat') {
      var cMsg = requestData.message || {};
      var headersObrolan = [
        'Waktu Kirim',
        'ID Pesan',
        'Nama Siswa',
        'Handle Siswa',
        'Kelas',
        'Ruang',
        'Isi Obrolan (Maks 120 Karakter)'
      ];
      var chatSheet = getOrCreateSheet('Obrolan_Monumen_Warga', headersObrolan, '#0D9488');

      chatSheet.appendRow([
        cMsg.createdAt || new Date().toISOString(),
        cMsg.id || '',
        cMsg.senderName || '',
        cMsg.senderHandle || '',
        cMsg.className || '',
        cMsg.roomNumber || 1,
        cMsg.content || ''
      ]);
      result.message = "Obrolan monumen warga berhasil dicatat di Spreadsheet!";
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
`;
}
