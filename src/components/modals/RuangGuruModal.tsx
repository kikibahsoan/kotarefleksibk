import React, { useState } from 'react';
import {
  X,
  Send,
  Sparkles,
  CheckCircle2,
  Users,
  BookOpen,
  MessageSquare,
  Settings,
  RefreshCw,
  Trash2,
  Plus,
  Award,
  Copy,
  Check,
  ExternalLink,
  FileSpreadsheet,
  Code2,
  ShieldCheck,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { sounds } from '../../utils/audio.ts';
import {
  Materi,
  LearningObjective,
  Reflection,
  MentorFeedback,
  Message,
  Student,
  TownSettings,
} from '../../types/index.ts';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * SKRIP GOOGLE APPS SCRIPT - KOTA REFLEKSI SMK NEGERI 2 GORONTALO
 * =========================================================================
 * Versi: 2.7 (Dukungan Bank Materi Guru AI, Studio ON AIR Podcast, Pasar Prestasi, Jurnal Pohon Beringin, Obrolan Warga & Refleksi 4F)
 * 
 * Panduan Pemasangan:
 * 1. Buka Google Spreadsheet ini.
 * 2. Klik menu Ekstensi (Extensions) > Apps Script.
 * 3. Hapus seluruh kode lama di Code.gs dan tempelkan seluruh skrip ini.
 * 4. Klik Simpan (ikon disket / Ctrl+S).
 * 5. Klik 'Terapkan' (Deploy) > 'Penerapan baru' (New deployment).
 * 6. Pilih jenis: 'Aplikasi Web' (Web app).
 * 7. Isi Konfigurasi:
 *    - Deskripsi: Kota Refleksi Web App v2.7 (Bank Materi Guru AI)
 *    - Jalankan sebagai (Execute as): Saya (Me)
 *    - Siapa yang memiliki akses (Who has access): Siapa saja (Anyone)
 * 8. Klik 'Terapkan' (Deploy) lalu berikan izin akses Google (Izinkan/Allow).
 * 9. Salin URL Aplikasi Web yang berakhiran /exec dan masukkan ke menu Pengaturan di Ruang Guru / Bank Materi.
 */

var SPREADSHEET_ID = ""; // Kosongkan jika skrip ini terikat langsung pada Google Sheet

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.length > 5) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "get_data";
  var ss = getSpreadsheet();
  
  // 1. Aksi Khusus Obrolan Cepat Real-time (Chat Only - Sangat Cepat)
  if (action === "get_chats") {
    var chats = getPublicChats(ss);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      chats: chats,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Aksi Khusus Bank Materi Guru (v2.7)
  if (action === "get_bank_materi") {
    var bankMateriOnly = getBankMateri(ss);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      version: "2.7",
      bankMateri: bankMateriOnly,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 2b. Aksi Khusus Arena Rumah Misteri (Polling Cepat 1-2 Detik + CacheService + Anti-Peek Rumah Benar)
  if (action === "get_mystery_arena") {
    var roleParam = (e && e.parameter && e.parameter.role) ? String(e.parameter.role) : "siswa";
    var teacherPinParam = (e && e.parameter && e.parameter.teacherPin) ? String(e.parameter.teacherPin) : "";
    var isTeacherVerified = (roleParam === "guru" && isValidTeacherPin(ss, teacherPinParam));
    var arenaData = getMysteryArenaState(ss, isTeacherVerified);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      isTeacherVerified: isTeacherVerified,
      arena: arenaData,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 2c. Aksi Khusus Escape Room Menara (Polling 2-3 Detik + Anti-Peek Kunci Jawaban)
  if (action === "get_escape_tower") {
    var roleEsc = (e && e.parameter && e.parameter.role) ? String(e.parameter.role) : "siswa";
    var pinEsc = (e && e.parameter && e.parameter.teacherPin) ? String(e.parameter.teacherPin) : "";
    var groupEsc = (e && e.parameter && e.parameter.kelompok) ? Number(e.parameter.kelompok) : 1;
    var isGuruEsc = (roleEsc === "guru" && isValidTeacherPin(ss, pinEsc));
    var escapeData = getEscapeTowerState(ss, isGuruEsc, groupEsc);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      isTeacherVerified: isGuruEsc,
      escapeTower: escapeData,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 2d. Aksi Khusus Menara Asesmen Individu (Polling 3-5 Detik + Anti-Peek Kunci Jawaban & Pembahasan)
  if (action === "get_menara_asesmen") {
    var roleAsesmen = (e && e.parameter && e.parameter.role) ? String(e.parameter.role) : "siswa";
    var pinAsesmen = (e && e.parameter && e.parameter.teacherPin) ? String(e.parameter.teacherPin) : "";
    var siswaAsesmen = (e && e.parameter && e.parameter.siswa) ? String(e.parameter.siswa) : "";
    var isGuruAsesmen = (roleAsesmen === "guru" && isValidTeacherPin(ss, pinAsesmen));
    var asesmenData = getMenaraAsesmenStateGAS(ss, isGuruAsesmen, siswaAsesmen);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      isTeacherVerified: isGuruAsesmen,
      asesmen: asesmenData,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 3. Aksi Lengkap Semua Data v3.0 (Refleksi, Feedback, Pesan Kantor Pos, Obrolan Warga, Jurnal Pohon Beringin, Podcast, Hasil Tes Lab DKV, Leaderboard Mingguan 7 Hari, Pasar Prestasi, Bank Materi Guru AI & Kotak Saran Wisma)
  var reflections = getReflections(ss);
  var feedbacks = getFeedbacks(ss);
  var messages = getMessages(ss);
  var chats = getPublicChats(ss);
  var stickyNotes = getStickyNotes(ss);
  var podcasts = getPodcasts(ss);
  var labDkvResults = getLabDkvResults(ss);
  var xpLogs = getWeeklyXpLogs(ss);
  var weeklyLeaderboard = getWeeklyLeaderboardTop5(ss, xpLogs, reflections, labDkvResults, podcasts, messages);
  var pasarPrestasi = getPasarPrestasi(ss);
  var bankMateri = getBankMateri(ss);
  var wismaSuggestions = getWismaSuggestions(ss);

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    version: "3.0",
    spreadsheet: ss.getName(),
    reflections: reflections,
    feedbacks: feedbacks,
    messages: messages,
    chats: chats,
    stickyNotes: stickyNotes,
    podcasts: podcasts,
    labDkvResults: labDkvResults,
    xpLogs: xpLogs,
    weeklyLeaderboard: weeklyLeaderboard,
    pasarPrestasi: pasarPrestasi,
    bankMateri: bankMateri,
    wismaSuggestions: wismaSuggestions,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "No post data" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var ss = getSpreadsheet();

    if (action === "send_public_chat") {
      savePublicChat(ss, data.message);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "submit_reflection") {
      saveReflection(ss, data.reflection, data.feedback);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_lab_dkv_test") {
      saveLabDkvTestResult(ss, data.testResult);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "log_xp_gain") {
      saveWeeklyXpLog(ss, data.xpLog);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_sticky_note") {
      saveStickyNote(ss, data.note);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "like_sticky_note") {
      updateStickyNoteLikes(ss, data.noteId, data.likes, data.likedBy, data.likedByNames);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_podcast_episode") {
      savePodcastEpisode(ss, data.episode);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_pasar_prestasi") {
      savePasarPrestasi(ss, data.student, data.top5);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_bank_materi") {
      saveBankMateri(ss, data.bankMateri);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "delete_bank_materi") {
      deleteBankMateri(ss, data.id);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_wisma_suggestion") {
      saveWismaSuggestion(ss, data.suggestion);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "send_message") {
      saveMessage(ss, data.message);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "reply_message") {
      saveMessageReply(ss, data.messageId, data.reply, data.repliedAt);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "sync_city_buildings") {
      saveCityBuildingsSheet(ss, data.buildings);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_mystery_arena_ronde") {
      if (!isValidTeacherAccountOrPin(ss, data.teacherId, data.teacherName, data.teacherPin)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Akses ditolak: Hanya akun Guru resmi yang dapat mengatur ronde Arena Rumah Misteri." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      saveGameRondeRow(ss, data.ronde);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_mystery_arena_pilihan") {
      saveGamePilihanRow(ss, data.pilihan);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_mystery_arena_skor") {
      saveGameSkorRows(ss, data.skorList);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_escape_konfigurasi") {
      if (!isValidTeacherAccountOrPin(ss, data.teacherId, data.teacherName, data.teacherPin)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Akses ditolak: Hanya akun Guru resmi yang dapat mengatur konfigurasi Escape Room Menara." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      saveEscapeKonfigurasiRows(ss, data.konfigurasi);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_escape_sesi") {
      if (!isValidTeacherAccountOrPin(ss, data.teacherId, data.teacherName, data.teacherPin)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Akses ditolak: Hanya akun Guru resmi yang dapat mengatur sesi Escape Room Menara." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      saveEscapeSesiRow(ss, data.sesi);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_escape_progres") {
      saveEscapeProgresRow(ss, data.progres);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_escape_skor") {
      saveEscapeSkorRows(ss, data.skorList);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "check_escape_answer") {
      var checkResult = checkEscapeAnswerInGAS(ss, data.nomor_lantai, data.jawaban_siswa);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        hasil: checkResult ? "benar" : "salah"
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_asesmen_sesi_dan_soal") {
      if (!isValidTeacherAccountOrPin(ss, data.teacherId, data.teacherName, data.teacherPin)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Akses ditolak: Hanya akun Guru resmi yang dapat mengatur Menara Asesmen Individu." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      saveAsesmenSesiDanSoalGAS(ss, data.sesi, data.bankSoal, data.stimulusList);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_asesmen_paket_batch") {
      saveAsesmenPaketBatchGAS(ss, data.paketList);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_asesmen_jawaban_batch") {
      saveAsesmenJawabanBatchGAS(ss, data.jawabanList);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "save_asesmen_hasil_batch") {
      saveAsesmenHasilBatchGAS(ss, data.hasilList);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Aksi berhasil diproses" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveCityBuildingsSheet(ss, buildings) {
  if (!Array.isArray(buildings)) return;
  var sheet = ss.getSheetByName("Data_Bangunan_Kota");
  if (!sheet) {
    sheet = ss.insertSheet("Data_Bangunan_Kota");
    sheet.appendRow([
      "ID Bangunan", "Nama Bangunan", "Posisi X", "Posisi Y",
      "Jenis / Zona", "Kategori", "Deskripsi & Fungsi", "Tujuan Belajar",
      "Kapasitas", "Jam Operasional", "Status", "Waktu Update"
    ]);
    sheet.setFrozenRows(1);
  }
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  for (var i = 0; i < buildings.length; i++) {
    var b = buildings[i] || {};
    sheet.appendRow([
      b.id || "",
      b.name || "",
      Number(b.wx) || 0,
      Number(b.wy) || 0,
      b.zone || "Pusat Kota",
      b.category || "",
      b.description || "",
      b.learningObjective || "",
      Number(b.capacity) || 35,
      b.openingHours || "06.00 - 22.00 WITA",
      b.status || "Terbuka",
      b.updatedAt || new Date().toLocaleString("id-ID")
    ]);
  }
}

// -------------------------------------------------------------
// MANAJEMEN OBROLAN WARGA (24 JAM AUTO-RETENTION)
// -------------------------------------------------------------
function getOrCreateChatSheet(ss) {
  var sheet = ss.getSheetByName("Obrolan_Warga");
  if (!sheet) {
    sheet = ss.insertSheet("Obrolan_Warga");
    sheet.appendRow([
      "ID Pesan", "ID Pengirim", "Nama Siswa", "Handle", 
      "Kelas", "Ruang", "Isi Pesan", "Waktu", "Created At", "Warna Avatar"
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function savePublicChat(ss, msg) {
  if (!msg || !msg.id) return;
  var sheet = getOrCreateChatSheet(ss);
  purgeOldChats(sheet);

  sheet.appendRow([
    msg.id,
    msg.senderId || "",
    msg.senderName || "Warga",
    msg.senderHandle || "@warga",
    msg.className || "X DKV",
    msg.roomNumber || 1,
    msg.content || "",
    msg.timestamp || "",
    msg.createdAt || new Date().toISOString(),
    msg.avatarColor || "#38bdf8"
  ]);
}

function getPublicChats(ss) {
  var sheet = ss.getSheetByName("Obrolan_Warga");
  if (!sheet) return [];

  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 Jam
  var list = [];

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var createdAtStr = row[8] ? String(row[8]) : "";
    var createdTime = new Date(createdAtStr).getTime();

    if (!isNaN(createdTime) && createdTime >= cutoff) {
      list.push({
        id: String(row[0]),
        senderId: String(row[1]),
        senderName: String(row[2]),
        senderHandle: String(row[3]),
        className: String(row[4]),
        roomNumber: Number(row[5]) || 1,
        content: String(row[6]),
        timestamp: String(row[7]),
        createdAt: createdAtStr,
        avatarColor: String(row[9] || "#38bdf8")
      });
    }
  }

  list.sort(function(a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return list.slice(0, 25);
}

function purgeOldChats(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 2) return;
  var cutoff = Date.now() - (24 * 60 * 60 * 1000);
  
  for (var i = rows.length - 1; i >= 1; i--) {
    var createdTime = new Date(rows[i][8]).getTime();
    if (!isNaN(createdTime) && createdTime < cutoff) {
      sheet.deleteRow(i + 1);
    }
  }
}

// -------------------------------------------------------------
// MANAJEMEN DATA_REFLEKSI_SISWA & FEEDBACK MENTOR (v3.0)
// -------------------------------------------------------------
function getOrCreateReflectionSheet(ss) {
  var sheet = ss.getSheetByName("Data_Refleksi_Siswa");
  if (!sheet) {
    sheet = ss.insertSheet("Data_Refleksi_Siswa");
    sheet.appendRow([
      "ID Refleksi", "ID Siswa", "Nama Siswa", "Kelas", "Nomor Absen",
      "ID Materi", "Judul Materi", "Skala Pemahaman (1-5)", "Mood Emoji",
      "Hal yang Dipahami (Facts)", "Kendala/Kesulitan (Feelings)",
      "Pelajaran/Insight (Findings)", "Rencana Aksi (Future)",
      "Jawaban Tambahan", "Tanggal Kirim"
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveReflection(ss, ref, fb) {
  if (!ref || !ref.id) return;
  var sheet = getOrCreateReflectionSheet(ss);
  var rowData = [
    ref.id,
    ref.studentId || "",
    ref.studentName || "",
    ref.className || "",
    ref.studentNumber || "",
    ref.materiId || "",
    ref.materiTitle || "",
    ref.scale || 5,
    ref.moodEmoji || "😊",
    (ref.answers && ref.answers.understood) || "",
    (ref.answers && ref.answers.difficult) || "",
    (ref.answers && ref.answers.findings) || "",
    (ref.answers && ref.answers.actionPlan) || "",
    JSON.stringify((ref.answers && ref.answers.customAnswers) || {}),
    ref.createdAt || new Date().toLocaleString("id-ID")
  ];
  sheet.appendRow(rowData);

  // Sinkron juga ke Refleksi_Siswa jika sheet lama tersebut sudah ada
  var legacySheet = ss.getSheetByName("Refleksi_Siswa");
  if (legacySheet) {
    legacySheet.appendRow(rowData);
  }

  if (fb && fb.id) {
    saveFeedback(ss, fb);
  }
}

function readReflectionRowsFromSheet(sheet, list, seenIds) {
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return;

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    var idStr = String(r[0]);
    if (seenIds[idStr]) continue;
    seenIds[idStr] = true;

    // Deteksi format kolom Data_Refleksi_Siswa v3.0 (15 kolom dengan ID di r[0]) vs v1.0
    if (r.length >= 15) {
      var custom = {};
      try { custom = JSON.parse(r[13]); } catch(e) {}
      list.push({
        id: idStr,
        studentId: String(r[1]),
        studentName: String(r[2]),
        className: String(r[3]),
        studentNumber: String(r[4]),
        materiId: String(r[5]),
        materiTitle: String(r[6]),
        scale: Number(r[7]) || 4,
        moodEmoji: String(r[8] || "😊"),
        answers: {
          understood: String(r[9] || ""),
          difficult: String(r[10] || ""),
          findings: String(r[11] || ""),
          actionPlan: String(r[12] || ""),
          customAnswers: custom
        },
        createdAt: String(r[14])
      });
    } else {
      var customLegacy = {};
      try { customLegacy = JSON.parse(r[11] || "{}"); } catch(e) {}
      list.push({
        id: String(r[1] || idStr),
        studentId: String(r[2] || ""),
        studentName: String(r[3] || ""),
        className: String(r[4] || ""),
        materiId: "materi-1",
        materiTitle: String(r[5] || ""),
        scale: Number(r[6]) || 4,
        moodEmoji: String(r[7] || "😊"),
        answers: {
          understood: String(r[8] || ""),
          difficult: String(r[9] || ""),
          actionPlan: String(r[10] || ""),
          customAnswers: customLegacy
        },
        createdAt: String(r[0] || "")
      });
    }
  }
}

function getReflections(ss) {
  var list = [];
  var seenIds = {};
  readReflectionRowsFromSheet(ss.getSheetByName("Data_Refleksi_Siswa"), list, seenIds);
  readReflectionRowsFromSheet(ss.getSheetByName("Refleksi_Siswa"), list, seenIds);
  return list;
}

function saveFeedback(ss, fb) {
  var sheet = ss.getSheetByName("Feedback_Mentor");
  if (!sheet) {
    sheet = ss.insertSheet("Feedback_Mentor");
    sheet.appendRow([
      "ID Feedback", "ID Refleksi", "Apresiasi", "Sudah Dikuasai",
      "Perlu Diperkuat", "Saran", "Pertanyaan Pemantik", "Rencana Belajar"
    ]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    fb.id,
    fb.reflectionId,
    fb.apresiasi || "",
    JSON.stringify(fb.sudah_dikuasai || []),
    JSON.stringify(fb.perlu_diperkuat || []),
    JSON.stringify(fb.saran || []),
    fb.pertanyaan_pemantik || "",
    JSON.stringify(fb.rencana_belajar || [])
  ]);
}

function getFeedbacks(ss) {
  var sheet = ss.getSheetByName("Feedback_Mentor");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    list.push({
      id: String(r[0]),
      reflectionId: String(r[1]),
      apresiasi: String(r[2]),
      sudah_dikuasai: parseJsonList(r[3]),
      perlu_diperkuat: parseJsonList(r[4]),
      saran: parseJsonList(r[5]),
      pertanyaan_pemantik: String(r[6]),
      rencana_belajar: parseJsonList(r[7]),
      completedSteps: [false, false, false]
    });
  }
  return list;
}

function parseJsonList(val) {
  try {
    var p = JSON.parse(val);
    return Array.isArray(p) ? p : [String(val)];
  } catch(e) {
    return val ? [String(val)] : [];
  }
}

// -------------------------------------------------------------
// MANAJEMEN PESAN_KANTOR_POS & PESAN_GURU (v3.0)
// -------------------------------------------------------------
function getOrCreateMessageSheet(ss) {
  var sheet = ss.getSheetByName("Pesan_Kantor_Pos");
  if (!sheet) {
    sheet = ss.insertSheet("Pesan_Kantor_Pos");
    sheet.appendRow(["ID Pesan", "ID Siswa", "Nama Siswa", "Kelas", "Isi Pesan", "Status", "Balasan Guru", "Waktu Kirim", "Waktu Balas"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveMessage(ss, msg) {
  if (!msg || !msg.id) return;
  var sheet = getOrCreateMessageSheet(ss);
  var rowData = [
    msg.id, msg.studentId || "", msg.studentName || "", msg.className || "", msg.content || "",
    msg.status || "unread", msg.teacherReply || "", msg.createdAt || new Date().toLocaleString("id-ID"), msg.repliedAt || ""
  ];
  sheet.appendRow(rowData);

  var legacySheet = ss.getSheetByName("Pesan_Guru");
  if (legacySheet) {
    legacySheet.appendRow(rowData);
  }
}

function readMessageRowsFromSheet(sheet, list, seenIds) {
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return;

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    var idCandidate = String(r[0]);
    if (seenIds[idCandidate]) continue;
    seenIds[idCandidate] = true;

    list.push({
      id: idCandidate,
      studentId: String(r[1] || ""),
      studentName: String(r[2] || ""),
      className: String(r[3] || ""),
      content: String(r[4] || ""),
      status: String(r[5] || "unread"),
      teacherReply: String(r[6] || ""),
      createdAt: String(r[7] || ""),
      repliedAt: String(r[8] || "")
    });
  }
}

function getMessages(ss) {
  var list = [];
  var seenIds = {};
  readMessageRowsFromSheet(ss.getSheetByName("Pesan_Kantor_Pos"), list, seenIds);
  readMessageRowsFromSheet(ss.getSheetByName("Pesan_Guru"), list, seenIds);
  return list;
}

function updateReplyInSheet(sheet, msgId, reply, repliedAt) {
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(msgId) || String(rows[i][1]) === String(msgId)) {
      sheet.getRange(i + 1, 6).setValue("replied");
      sheet.getRange(i + 1, 7).setValue(reply);
      sheet.getRange(i + 1, 9).setValue(repliedAt || new Date().toLocaleString("id-ID"));
      break;
    }
  }
}

function saveMessageReply(ss, msgId, reply, repliedAt) {
  updateReplyInSheet(ss.getSheetByName("Pesan_Kantor_Pos"), msgId, reply, repliedAt);
  updateReplyInSheet(ss.getSheetByName("Pesan_Guru"), msgId, reply, repliedAt);
}

// -------------------------------------------------------------
// MANAJEMEN JURNAL HARIAN POHON BERINGIN (STICKY NOTES WARGA)
// -------------------------------------------------------------
function getOrCreateStickyNoteSheet(ss) {
  var sheet = ss.getSheetByName("Jurnal_Pohon_Beringin");
  if (!sheet) {
    sheet = ss.insertSheet("Jurnal_Pohon_Beringin");
    sheet.appendRow([
      "ID Catatan", "ID Siswa", "Nama Siswa", "Kelas", "Isi Refleksi Harian",
      "Mood Emoji", "Warna Kertas", "Tanggal", "Timestamp", "Jumlah Suka", "Disukai Oleh (ID)", "Disukai Oleh (Nama)"
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveStickyNote(ss, note) {
  if (!note || !note.id) return;
  var sheet = getOrCreateStickyNoteSheet(ss);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(note.id)) {
      sheet.getRange(i + 1, 10).setValue(Number(note.likes) || 0);
      sheet.getRange(i + 1, 11).setValue(JSON.stringify(note.likedBy || []));
      sheet.getRange(i + 1, 12).setValue(JSON.stringify(note.likedByNames || []));
      return;
    }
  }
  sheet.appendRow([
    note.id,
    note.studentId || "",
    note.studentName || "Warga",
    note.className || "X DKV",
    note.content || "",
    note.mood || "😊",
    note.color || "yellow",
    note.date || "",
    note.timestamp || Date.now(),
    Number(note.likes) || 0,
    JSON.stringify(note.likedBy || []),
    JSON.stringify(note.likedByNames || [])
  ]);
}

function updateStickyNoteLikes(ss, noteId, likes, likedBy, likedByNames) {
  var sheet = ss.getSheetByName("Jurnal_Pohon_Beringin");
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(noteId)) {
      sheet.getRange(i + 1, 10).setValue(Number(likes) || 0);
      sheet.getRange(i + 1, 11).setValue(JSON.stringify(likedBy || []));
      sheet.getRange(i + 1, 12).setValue(JSON.stringify(likedByNames || []));
      break;
    }
  }
}

function getStickyNotes(ss) {
  var sheet = ss.getSheetByName("Jurnal_Pohon_Beringin");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] || !r[4]) continue;
    list.push({
      id: String(r[0]),
      studentId: String(r[1]),
      studentName: String(r[2]),
      className: String(r[3]),
      content: String(r[4]),
      mood: String(r[5] || "😊"),
      color: String(r[6] || "yellow"),
      date: String(r[7] || ""),
      timestamp: Number(r[8]) || Date.now(),
      likes: Number(r[9]) || 0,
      likedBy: parseJsonList(r[10]),
      likedByNames: parseJsonList(r[11])
    });
  }
  return list;
}

// -------------------------------------------------------------
// MANAJEMEN HASIL PODCAST SISWA & STUDIO ON AIR PODCAST (v3.0)
// -------------------------------------------------------------
function getOrCreatePodcastSheet(ss) {
  var sheet = ss.getSheetByName("Hasil_Podcast_Siswa") || ss.getSheetByName("Studio_On_Air_Podcast");
  if (!sheet) {
    sheet = ss.insertSheet("Hasil_Podcast_Siswa");
    sheet.appendRow([
      "ID Episode", "ID Siswa", "Nama Siswa", "Kelas", "ID Materi", "Judul Materi",
      "Hal Sudah Dikuasai", "Area Perlu Diperkuat", "Saran Konkret AI",
      "Pertanyaan Pemantik AI", "Jawaban Pemantik Siswa", "Rencana Belajar Siswa",
      "Apresiasi Host AI", "Transkrip Lengkap Podcast (Teks)", "Tanggal", "Timestamp"
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function savePodcastEpisode(ss, ep) {
  if (!ep || !ep.id) return;
  var sheet = getOrCreatePodcastSheet(ss);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(ep.id)) {
      return;
    }
  }
  var rowData = [
    ep.id,
    ep.studentId || "",
    ep.studentName || "Siswa DKV",
    ep.className || "X DKV",
    ep.materiId || "",
    ep.materiTitle || "",
    ep.sudahDikuasai || "",
    ep.perluDiperkuat || "",
    JSON.stringify(ep.saranKonkretAI || []),
    ep.pertanyaanPemantikAI || "",
    ep.jawabanPemantikSiswa || "",
    JSON.stringify(ep.rencanaBelajarSiswa || []),
    ep.apresiasiHost || "",
    ep.transcriptText || "",
    ep.createdAt || new Date().toLocaleDateString("id-ID"),
    ep.timestamp || Date.now()
  ];
  sheet.appendRow(rowData);

  // Simpan juga ke Studio_On_Air_Podcast jika terpisah
  var altSheet = ss.getSheetByName("Studio_On_Air_Podcast");
  if (altSheet && altSheet.getName() !== sheet.getName()) {
    altSheet.appendRow(rowData);
  }
}

function readPodcastRowsFromSheet(sheet, list, seenIds) {
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return;
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] || !r[5]) continue;
    var idStr = String(r[0]);
    if (seenIds[idStr]) continue;
    seenIds[idStr] = true;
    list.push({
      id: idStr,
      studentId: String(r[1]),
      studentName: String(r[2]),
      className: String(r[3]),
      materiId: String(r[4]),
      materiTitle: String(r[5]),
      sudahDikuasai: String(r[6] || ""),
      perluDiperkuat: String(r[7] || ""),
      saranKonkretAI: parseJsonList(r[8]),
      pertanyaanPemantikAI: String(r[9] || ""),
      jawabanPemantikSiswa: String(r[10] || ""),
      rencanaBelajarSiswa: parseJsonList(r[11]),
      apresiasiHost: String(r[12] || ""),
      transcriptText: String(r[13] || ""),
      createdAt: String(r[14] || ""),
      timestamp: Number(r[15]) || Date.now()
    });
  }
}

function getPodcasts(ss) {
  var list = [];
  var seenIds = {};
  readPodcastRowsFromSheet(ss.getSheetByName("Hasil_Podcast_Siswa"), list, seenIds);
  readPodcastRowsFromSheet(ss.getSheetByName("Studio_On_Air_Podcast"), list, seenIds);
  return list;
}

// -------------------------------------------------------------
// MANAJEMEN HASIL TES DI LAB DKV (Hasil_Tes_Lab_DKV - v3.0)
// -------------------------------------------------------------
function getOrCreateLabDkvSheet(ss) {
  var sheet = ss.getSheetByName("Hasil_Tes_Lab_DKV");
  if (!sheet) {
    sheet = ss.insertSheet("Hasil_Tes_Lab_DKV");
    sheet.appendRow([
      "ID Hasil Tes", "ID Siswa", "Nama Siswa", "Kelas", "ID Materi", "Topik Materi",
      "Paket Acak Ke", "Skor Benar", "Total Soal", "XP Diperoleh",
      "Rincian Jenjang 1-5", "Detail Jawaban", "Waktu Tes", "Timestamp"
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveLabDkvTestResult(ss, res) {
  if (!res || !res.id) return;
  var sheet = getOrCreateLabDkvSheet(ss);
  sheet.appendRow([
    res.id,
    res.studentId || "",
    res.studentName || "Siswa DKV",
    res.className || "X DKV",
    res.materiId || "",
    res.materiTitle || "Evaluasi Lab DKV",
    Number(res.roundNumber) || 1,
    Number(res.scoreCorrect) || 0,
    Number(res.totalQuestions) || 5,
    Number(res.xpEarned) || 0,
    res.tierBreakdown || "",
    res.answersDetail || "",
    res.createdAt || new Date().toLocaleString("id-ID"),
    res.timestamp || Date.now()
  ]);
}

function getLabDkvResults(ss) {
  var sheet = ss.getSheetByName("Hasil_Tes_Lab_DKV");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    list.push({
      id: String(r[0]),
      studentId: String(r[1] || ""),
      studentName: String(r[2] || ""),
      className: String(r[3] || ""),
      materiId: String(r[4] || ""),
      materiTitle: String(r[5] || ""),
      roundNumber: Number(r[6]) || 1,
      scoreCorrect: Number(r[7]) || 0,
      totalQuestions: Number(r[8]) || 5,
      xpEarned: Number(r[9]) || 0,
      tierBreakdown: String(r[10] || ""),
      answersDetail: String(r[11] || ""),
      createdAt: String(r[12] || ""),
      timestamp: Number(r[13]) || Date.now()
    });
  }
  return list;
}

// -------------------------------------------------------------
// MANAJEMEN LOG XP MINGGUAN & LEADERBOARD MINGGUAN BALAI KOTA (7 HARI TERAKHIR - v3.0)
// -------------------------------------------------------------
function getOrCreateWeeklyXpSheet(ss) {
  var sheet = ss.getSheetByName("Log_XP_Mingguan");
  if (!sheet) {
    sheet = ss.insertSheet("Log_XP_Mingguan");
    sheet.appendRow([
      "ID Log", "ID Siswa", "Nama Siswa", "Kelas",
      "XP Diperoleh", "Jenis Aktivitas", "Deskripsi Aktivitas", "Waktu", "Timestamp"
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveWeeklyXpLog(ss, xpLog) {
  if (!xpLog || !xpLog.id) return;
  var sheet = getOrCreateWeeklyXpSheet(ss);
  sheet.appendRow([
    xpLog.id,
    xpLog.studentId || "",
    xpLog.studentName || "",
    xpLog.className || "X DKV",
    Number(xpLog.xpEarned) || 1,
    xpLog.activityType || "aktivitas_kota",
    xpLog.description || "",
    xpLog.createdAt || new Date().toLocaleString("id-ID"),
    xpLog.timestamp || Date.now()
  ]);
}

function getWeeklyXpLogs(ss) {
  var sheet = ss.getSheetByName("Log_XP_Mingguan");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    var ts = Number(r[8]) || Date.now();
    if (ts >= cutoff) {
      list.push({
        id: String(r[0]),
        studentId: String(r[1] || ""),
        studentName: String(r[2] || ""),
        className: String(r[3] || ""),
        xpEarned: Number(r[4]) || 1,
        activityType: String(r[5] || "aktivitas_kota"),
        description: String(r[6] || ""),
        createdAt: String(r[7] || ""),
        timestamp: ts
      });
    }
  }
  return list;
}

function getWeeklyLeaderboardTop5(ss, xpLogs, reflections, labDkvResults, podcasts, messages) {
  var map = {};
  var addXp = function(id, name, cls, xp) {
    if (!name || xp <= 0) return;
    var key = id || name.toLowerCase();
    if (!map[key]) {
      map[key] = { studentId: id || key, studentName: name, className: cls || "X DKV", weeklyXp: 0, weeklyActivitiesCount: 0 };
    }
    map[key].weeklyXp += Number(xp) || 0;
    map[key].weeklyActivitiesCount += 1;
  };
  (xpLogs || []).forEach(function(l) { addXp(l.studentId, l.studentName, l.className, l.xpEarned); });
  (labDkvResults || []).forEach(function(t) { addXp(t.studentId, t.studentName, t.className, t.xpEarned || t.scoreCorrect || 1); });
  (podcasts || []).forEach(function(p) { addXp(p.studentId, p.studentName, p.className, 2); });
  var arr = Object.keys(map).map(function(k) { return map[k]; });
  arr.sort(function(a, b) { return b.weeklyXp - a.weeklyXp; });
  return arr.slice(0, 5);
}

// -------------------------------------------------------------
// MANAJEMEN PASAR PRESTASI & PERINGKAT AKTIVITAS WARGA (v2.6)
// -------------------------------------------------------------
function getOrCreatePasarPrestasiSheet(ss) {
  var sheet = ss.getSheetByName("Pasar_Prestasi_Siswa");
  if (!sheet) {
    sheet = ss.insertSheet("Pasar_Prestasi_Siswa");
    sheet.appendRow([
      "ID Siswa", "Nama Siswa", "Kelas", "Total Aktivitas Kota",
      "Jumlah Login", "Misi Selesai", "Refleksi Terkirim", "Obrolan Warga",
      "Kuis Bengkel", "Pesan Guru", "Saldo XP", "Status / Peringkat", "Waktu Sinkron"
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function upsertPasarPrestasiRow(sheet, item) {
  if (!item || !item.id) return;
  var stats = item.activityStats || {};
  var totalAct = Number(item.totalActivities || stats.total || 0);
  var logins = Number(stats.logins || 1);
  var missions = Number(stats.missions || 0);
  var reflections = Number(stats.reflections || 0);
  var chats = Number(stats.chats || 0);
  var quizzes = Number(stats.quizzes || 0);
  var messages = Number(stats.messages || 0);
  var points = Number(item.points || 0);
  var rankLabel = item.rankLabel || "Warga Aktif";
  var nowStr = new Date().toLocaleString("id-ID");

  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(item.id)) {
      sheet.getRange(i + 1, 2, 1, 12).setValues([[
        item.name || "Siswa DKV",
        item.className || "X DKV",
        Math.max(Number(rows[i][3]) || 0, totalAct),
        Math.max(Number(rows[i][4]) || 0, logins),
        Math.max(Number(rows[i][5]) || 0, missions),
        Math.max(Number(rows[i][6]) || 0, reflections),
        Math.max(Number(rows[i][7]) || 0, chats),
        Math.max(Number(rows[i][8]) || 0, quizzes),
        Math.max(Number(rows[i][9]) || 0, messages),
        Math.max(Number(rows[i][10]) || 0, points),
        rankLabel,
        nowStr
      ]]);
      return;
    }
  }

  sheet.appendRow([
    item.id,
    item.name || "Siswa DKV",
    item.className || "X DKV",
    totalAct,
    logins,
    missions,
    reflections,
    chats,
    quizzes,
    messages,
    points,
    rankLabel,
    nowStr
  ]);
}

function savePasarPrestasi(ss, student, top5List) {
  var sheet = getOrCreatePasarPrestasiSheet(ss);
  if (student && student.id) {
    upsertPasarPrestasiRow(sheet, student);
  }
  if (Array.isArray(top5List)) {
    for (var k = 0; k < top5List.length; k++) {
      var st = top5List[k];
      if (st && st.id) {
        st.rankLabel = "Top #" + (k + 1) + " Pasar Prestasi";
        upsertPasarPrestasiRow(sheet, st);
      }
    }
  }
}

function getPasarPrestasi(ss) {
  var sheet = ss.getSheetByName("Pasar_Prestasi_Siswa");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    list.push({
      id: String(r[0]),
      name: String(r[1]),
      className: String(r[2]),
      totalActivities: Number(r[3]) || 0,
      activityStats: {
        logins: Number(r[4]) || 1,
        missions: Number(r[5]) || 0,
        reflections: Number(r[6]) || 0,
        chats: Number(r[7]) || 0,
        quizzes: Number(r[8]) || 0,
        messages: Number(r[9]) || 0,
        total: Number(r[3]) || 0
      },
      points: Number(r[10]) || 0,
      rankLabel: String(r[11] || ""),
      updatedAt: String(r[12] || "")
    });
  }
  return list;
}

// -------------------------------------------------------------
// MANAJEMEN BANK MATERI GURU & DISTRIBUSI AI KOTA REFLEKSIA (v2.7)
// -------------------------------------------------------------
function getOrCreateBankMateriSheet(ss) {
  var sheet = ss.getSheetByName("Bank_Materi_Guru");
  if (!sheet) {
    sheet = ss.insertSheet("Bank_Materi_Guru");
    sheet.appendRow([
      "ID Bank Materi", "ID Materi", "ID TP", "ID Guru", "Nama Guru",
      "Mata Pelajaran", "Kelas Target", "Elemen", "Tujuan Pembelajaran",
      "Materi Esensial", "Ringkasan AI", "Modul Perpustakaan",
      "Pertanyaan Refleksi (JSON)", "Topik Podcast Mentor",
      "Pertanyaan Pemantik Podcast", "Misi Balai Kota",
      "Distribusi Bangunan Kota (JSON)", "Kuis 5 Jenjang Lab DKV (JSON)",
      "Tanggal Dibuat", "Timestamp", "Payload JSON Lengkap"
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveBankMateri(ss, bm) {
  if (!bm || !bm.id) return;
  var sheet = getOrCreateBankMateriSheet(ss);
  var rows = sheet.getDataRange().getValues();
  var rowValues = [
    bm.id,
    bm.materiId || ("materi-" + bm.id),
    bm.objectiveId || ("tp-" + bm.id),
    bm.teacherId || "",
    bm.teacherName || "Guru Pengampu",
    bm.mataPelajaran || "",
    bm.kelasTarget || "X DKV 2 & X DKV 3",
    bm.elemen || "",
    bm.tujuanPembelajaran || "",
    bm.materiEsensial || "",
    bm.ringkasanAI || "",
    bm.modulPerpustakaan || "",
    JSON.stringify(bm.pertanyaanRefleksi || []),
    bm.topikPodcastMentor || "",
    bm.pertanyaanPemantikPodcast || "",
    bm.misiBalaiKota || "",
    JSON.stringify(bm.tantanganBangunanLain || []),
    JSON.stringify(bm.kuisBengkel || []),
    bm.createdAt || new Date().toLocaleDateString("id-ID"),
    bm.timestamp || Date.now(),
    JSON.stringify(bm)
  ];

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(bm.id)) {
      sheet.getRange(i + 1, 1, 1, rowValues.length).setValues([rowValues]);
      return;
    }
  }
  sheet.appendRow(rowValues);
}

function deleteBankMateri(ss, id) {
  if (!id) return;
  var sheet = ss.getSheetByName("Bank_Materi_Guru");
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
    }
  }
}

function getBankMateri(ss) {
  var sheet = ss.getSheetByName("Bank_Materi_Guru");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] || !r[5]) continue;
    if (r[20]) {
      try {
        var fullObj = JSON.parse(String(r[20]));
        if (fullObj && fullObj.id) {
          list.push(fullObj);
          continue;
        }
      } catch (e) {}
    }
    var pertanyaanRefleksi = [];
    var tantanganBangunanLain = [];
    var kuisBengkel = [];
    try { pertanyaanRefleksi = JSON.parse(String(r[12] || "[]")); } catch (e) {}
    try { tantanganBangunanLain = JSON.parse(String(r[16] || "[]")); } catch (e) {}
    try { kuisBengkel = JSON.parse(String(r[17] || "[]")); } catch (e) {}

    list.push({
      id: String(r[0]),
      materiId: String(r[1] || ("materi-" + r[0])),
      objectiveId: String(r[2] || ("tp-" + r[0])),
      teacherId: String(r[3] || ""),
      teacherName: String(r[4] || "Guru Pengampu"),
      mataPelajaran: String(r[5] || ""),
      kelasTarget: String(r[6] || "X DKV 2 & X DKV 3"),
      elemen: String(r[7] || ""),
      tujuanPembelajaran: String(r[8] || ""),
      materiEsensial: String(r[9] || ""),
      ringkasanAI: String(r[10] || ""),
      modulPerpustakaan: String(r[11] || ""),
      pertanyaanRefleksi: Array.isArray(pertanyaanRefleksi) ? pertanyaanRefleksi : [],
      topikPodcastMentor: String(r[13] || ""),
      pertanyaanPemantikPodcast: String(r[14] || ""),
      misiBalaiKota: String(r[15] || ""),
      tantanganBangunanLain: Array.isArray(tantanganBangunanLain) ? tantanganBangunanLain : [],
      kuisBengkel: Array.isArray(kuisBengkel) ? kuisBengkel : [],
      createdAt: String(r[18] || ""),
      timestamp: Number(r[19]) || Date.now()
    });
  }
  return list;
}

// -------------------------------------------------------------
// MANAJEMEN KOTAK SURAT MASUKAN & SARAN WISMA SISWA & GURU (v2.8)
// -------------------------------------------------------------
function getOrCreateWismaSuggestionSheet(ss) {
  var sheet = ss.getSheetByName("Kotak_Saran_Wisma");
  if (!sheet) {
    sheet = ss.insertSheet("Kotak_Saran_Wisma");
    sheet.appendRow([
      "ID Masukan", "ID Wisma", "Nama Wisma / Rumah Dinas", "ID Pengirim",
      "Nama Pengirim", "Peran (Siswa/Guru)", "Kelas / Jabatan",
      "Kategori Saran", "Isi Masukan & Saran", "Tanggal Kirim", "Timestamp"
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveWismaSuggestion(ss, sug) {
  if (!sug || !sug.id) return;
  var sheet = getOrCreateWismaSuggestionSheet(ss);
  sheet.appendRow([
    sug.id,
    sug.wismaId || "",
    sug.wismaName || "Wisma Refleksia",
    sug.senderId || "",
    sug.senderName || "Warga Kota",
    sug.senderRole || "siswa",
    sug.className || "X DKV",
    sug.category || "Ide & Apresiasi",
    sug.content || "",
    sug.createdAt || new Date().toLocaleString("id-ID"),
    sug.timestamp || Date.now()
  ]);
}

function getWismaSuggestions(ss) {
  var sheet = ss.getSheetByName("Kotak_Saran_Wisma");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] || !r[8]) continue;
    list.push({
      id: String(r[0]),
      wismaId: String(r[1] || ""),
      wismaName: String(r[2] || "Wisma Refleksia"),
      senderId: String(r[3] || ""),
      senderName: String(r[4] || "Warga Kota"),
      senderRole: String(r[5] || "siswa") === "guru" ? "guru" : "siswa",
      className: String(r[6] || "X DKV"),
      category: String(r[7] || "Ide & Apresiasi"),
      content: String(r[8] || ""),
      createdAt: String(r[9] || ""),
      timestamp: Number(r[10]) || Date.now()
    });
  }
  return list;
}

// -------------------------------------------------------------
// ARENA RUMAH MISTERI (3 SHEET BARU TERPISAH: Game_Ronde, Game_Pilihan, Game_Skor)
// Rumah benar TIDAK dikirim ke sisi siswa sebelum status === "meledak"
// -------------------------------------------------------------
function isValidTeacherPin(ss, pin) {
  var p = String(pin || "").trim();
  return p === "1234" || p === "2025" || p === "guru123" || p === "dkv2025" || p === "refleksia";
}

function isValidTeacherAccountOrPin(ss, teacherId, teacherName, teacherPin) {
  if (isValidTeacherPin(ss, teacherPin)) return true;
  var tid = String(teacherId || "").toLowerCase();
  var tname = String(teacherName || "").toLowerCase();
  if (tid.indexOf("teacher-") === 0 || tname === "kikybahsoan" || tname.indexOf("rizki bahsoan") !== -1 || tname.indexOf("zulfitriani") !== -1 || tname.indexOf("winarni") !== -1 || tname.indexOf("satria") !== -1 || tname.indexOf("wahyudin") !== -1 || tname.indexOf("sufri") !== -1) {
    return true;
  }
  return false;
}

function getOrCreateGameRondeSheet(ss) {
  var sheet = ss.getSheetByName("Game_Ronde");
  if (!sheet) {
    sheet = ss.insertSheet("Game_Ronde");
    sheet.appendRow(["id_ronde", "soal", "rumah_benar", "status", "waktu", "poin_benar", "durasi_detik"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateGamePilihanSheet(ss) {
  var sheet = ss.getSheetByName("Game_Pilihan");
  if (!sheet) {
    sheet = ss.insertSheet("Game_Pilihan");
    sheet.appendRow(["id_ronde", "kelompok", "rumah_dipilih", "waktu"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateGameSkorSheet(ss) {
  var sheet = ss.getSheetByName("Game_Skor");
  if (!sheet) {
    sheet = ss.insertSheet("Game_Skor");
    sheet.appendRow(["kelompok", "total_poin"]);
    sheet.setFrozenRows(1);
    for (var k = 1; k <= 8; k++) {
      sheet.appendRow(["Kelompok " + k, 0]);
    }
  }
  return sheet;
}

function saveGameRondeRow(ss, ronde) {
  if (!ronde || !ronde.id_ronde) return;
  var sheet = getOrCreateGameRondeSheet(ss);
  var rows = sheet.getDataRange().getValues();
  var foundRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(ronde.id_ronde)) {
      foundRow = i + 1;
      break;
    }
  }
  var rowValues = [
    String(ronde.id_ronde),
    String(ronde.soal || ""),
    Number(ronde.rumah_benar) || 1,
    String(ronde.status || "menunggu"),
    String(ronde.waktu || new Date().toLocaleString("id-ID")),
    Number(ronde.poin_benar) || 10,
    Number(ronde.durasi_detik) || 0
  ];
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  try {
    CacheService.getScriptCache().remove("MYSTERY_ARENA_RAW_CACHE");
  } catch (e) {}
}

function saveGamePilihanRow(ss, pilihan) {
  if (!pilihan || !pilihan.id_ronde || !pilihan.kelompok) return;
  var sheet = getOrCreateGamePilihanSheet(ss);
  var rows = sheet.getDataRange().getValues();
  var foundRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(pilihan.id_ronde) && String(rows[i][1]) === String(pilihan.kelompok)) {
      foundRow = i + 1;
      break;
    }
  }
  var rowValues = [
    String(pilihan.id_ronde),
    String(pilihan.kelompok),
    Number(pilihan.rumah_dipilih) || 1,
    String(pilihan.waktu || new Date().toLocaleString("id-ID"))
  ];
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  try {
    CacheService.getScriptCache().remove("MYSTERY_ARENA_RAW_CACHE");
  } catch (e) {}
}

function saveGameSkorRows(ss, skorList) {
  if (!Array.isArray(skorList)) return;
  var sheet = getOrCreateGameSkorSheet(ss);
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  for (var i = 0; i < skorList.length; i++) {
    var item = skorList[i] || {};
    var kNum = Number(item.kelompok) || (i + 1);
    sheet.appendRow(["Kelompok " + kNum, Number(item.total_poin) || 0]);
  }
  try {
    CacheService.getScriptCache().remove("MYSTERY_ARENA_RAW_CACHE");
  } catch (e) {}
}

function getMysteryArenaState(ss, isTeacherVerified) {
  var raw = null;
  try {
    var cached = CacheService.getScriptCache().get("MYSTERY_ARENA_RAW_CACHE");
    if (cached) raw = JSON.parse(cached);
  } catch (e) {}

  if (!raw) {
    var rSheet = getOrCreateGameRondeSheet(ss);
    var pSheet = getOrCreateGamePilihanSheet(ss);
    var sSheet = getOrCreateGameSkorSheet(ss);

    var rRows = rSheet.getDataRange().getValues();
    var latestRonde = null;
    if (rRows.length > 1) {
      var lr = rRows[rRows.length - 1];
      latestRonde = {
        id_ronde: String(lr[0] || "RONDE-1"),
        soal: String(lr[1] || ""),
        rumah_benar: Number(lr[2]) || 1,
        status: String(lr[3] || "menunggu"),
        waktu: String(lr[4] || ""),
        poin_benar: Number(lr[5]) || 10,
        durasi_detik: Number(lr[6]) || 0
      };
    }

    var pRows = pSheet.getDataRange().getValues();
    var pilihanList = [];
    for (var i = 1; i < pRows.length; i++) {
      var pr = pRows[i];
      if (!pr[0]) continue;
      if (!latestRonde || String(pr[0]) === latestRonde.id_ronde) {
        var kRaw = String(pr[1] || "1").replace(/[^0-9]/g, "");
        pilihanList.push({
          id_ronde: String(pr[0]),
          kelompok: Number(kRaw) || 1,
          rumah_dipilih: Number(pr[2]) || 1,
          waktu: String(pr[3] || "")
        });
      }
    }

    var sRows = sSheet.getDataRange().getValues();
    var skorList = [];
    for (var j = 1; j < sRows.length; j++) {
      var sr = sRows[j];
      if (!sr[0]) continue;
      var kNum = Number(String(sr[0]).replace(/[^0-9]/g, "")) || j;
      skorList.push({
        kelompok: kNum,
        total_poin: Number(sr[1]) || 0
      });
    }

    raw = {
      currentRound: latestRonde,
      choices: pilihanList,
      scores: skorList
    };
    try {
      CacheService.getScriptCache().put("MYSTERY_ARENA_RAW_CACHE", JSON.stringify(raw), 1);
    } catch (e) {}
  }

  // KEAMANAN ANTI-INTIP: Rumah benar TIDAK BOLEH dikirim ke sisi siswa sebelum status === "meledak"
  var safeRound = null;
  if (raw.currentRound) {
    var canReveal = isTeacherVerified || raw.currentRound.status === "meledak";
    safeRound = {
      id_ronde: raw.currentRound.id_ronde,
      soal: raw.currentRound.soal,
      rumah_benar: canReveal ? raw.currentRound.rumah_benar : null,
      status: raw.currentRound.status,
      waktu: raw.currentRound.waktu,
      poin_benar: raw.currentRound.poin_benar,
      durasi_detik: raw.currentRound.durasi_detik
    };
  }

  return {
    currentRound: safeRound,
    choices: raw.choices || [],
    scores: raw.scores || []
  };
}

// -------------------------------------------------------------
// ESCAPE ROOM MENARA (4 SHEET BARU TERPISAH: Escape_Konfigurasi, Escape_Sesi, Escape_Progres, Escape_Skor)
// KUNCI JAWABAN TIDAK PERNAH DIKIRIM KE SISI SISWA
// -------------------------------------------------------------
function getOrCreateEscapeKonfigurasiSheet(ss) {
  var sheet = ss.getSheetByName("Escape_Konfigurasi");
  if (!sheet) {
    sheet = ss.insertSheet("Escape_Konfigurasi");
    sheet.appendRow(["nomor_lantai", "judul", "cerita", "soal", "jenis", "hint", "kunci_jawaban", "batas_waktu"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateEscapeSesiSheet(ss) {
  var sheet = ss.getSheetByName("Escape_Sesi");
  if (!sheet) {
    sheet = ss.insertSheet("Escape_Sesi");
    sheet.appendRow(["id_sesi", "status", "waktu_mulai"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateEscapeProgresSheet(ss) {
  var sheet = ss.getSheetByName("Escape_Progres");
  if (!sheet) {
    sheet = ss.insertSheet("Escape_Progres");
    sheet.appendRow(["id_sesi", "kelompok", "lantai_sekarang", "jumlah_salah", "hint_dipakai", "waktu_selesai"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateEscapeSkorSheet(ss) {
  var sheet = ss.getSheetByName("Escape_Skor");
  if (!sheet) {
    sheet = ss.insertSheet("Escape_Skor");
    sheet.appendRow(["kelompok", "total_poin"]);
    sheet.setFrozenRows(1);
    for (var k = 1; k <= 8; k++) {
      sheet.appendRow(["Kelompok " + k, 0]);
    }
  }
  return sheet;
}

function saveEscapeKonfigurasiRows(ss, konfigurasiList) {
  if (!Array.isArray(konfigurasiList)) return;
  var sheet = getOrCreateEscapeKonfigurasiSheet(ss);
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  for (var i = 0; i < konfigurasiList.length; i++) {
    var fl = konfigurasiList[i] || {};
    sheet.appendRow([
      Number(fl.nomor_lantai) || (i + 1),
      String(fl.judul || ""),
      String(fl.cerita || ""),
      String(fl.soal || ""),
      String(fl.jenis || "isian_singkat"),
      String(fl.hint || ""),
      String(fl.kunci_jawaban || ""),
      Number(fl.batas_waktu) || 120
    ]);
  }
  try {
    CacheService.getScriptCache().remove("ESCAPE_TOWER_RAW_CACHE");
  } catch (e) {}
}

function saveEscapeSesiRow(ss, sesi) {
  if (!sesi || !sesi.id_sesi) return;
  var sheet = getOrCreateEscapeSesiSheet(ss);
  var rows = sheet.getDataRange().getValues();
  var foundRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(sesi.id_sesi)) {
      foundRow = i + 1;
      break;
    }
  }
  var rowValues = [
    String(sesi.id_sesi),
    String(sesi.status || "menunggu"),
    String(sesi.waktu_mulai || new Date().toLocaleString("id-ID"))
  ];
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  try {
    CacheService.getScriptCache().remove("ESCAPE_TOWER_RAW_CACHE");
  } catch (e) {}
}

function saveEscapeProgresRow(ss, prog) {
  if (!prog || !prog.id_sesi || !prog.kelompok) return;
  var sheet = getOrCreateEscapeProgresSheet(ss);
  var rows = sheet.getDataRange().getValues();
  var foundRow = -1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(prog.id_sesi) && String(rows[i][1]) === String(prog.kelompok)) {
      foundRow = i + 1;
      break;
    }
  }
  var rowValues = [
    String(prog.id_sesi),
    String(prog.kelompok),
    Number(prog.lantai_sekarang) || 1,
    Number(prog.jumlah_salah) || 0,
    Number(prog.hint_dipakai) || 0,
    String(prog.waktu_selesai || "-")
  ];
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  try {
    CacheService.getScriptCache().remove("ESCAPE_TOWER_RAW_CACHE");
  } catch (e) {}
}

function saveEscapeSkorRows(ss, skorList) {
  if (!Array.isArray(skorList)) return;
  var sheet = getOrCreateEscapeSkorSheet(ss);
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  for (var i = 0; i < skorList.length; i++) {
    var item = skorList[i] || {};
    var kNum = Number(item.kelompok) || (i + 1);
    sheet.appendRow(["Kelompok " + kNum, Number(item.total_poin) || 0]);
  }
  try {
    CacheService.getScriptCache().remove("ESCAPE_TOWER_RAW_CACHE");
  } catch (e) {}
}

function normalizeEscapeAnswerGAS(str) {
  return String(str || "").trim().toLowerCase().replace(/\\s+/g, " ");
}

function checkEscapeAnswerInGAS(ss, nomorLantai, jawabanSiswa) {
  var kSheet = getOrCreateEscapeKonfigurasiSheet(ss);
  var rows = kSheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (Number(rows[i][0]) === Number(nomorLantai)) {
      var kunci = normalizeEscapeAnswerGAS(rows[i][6]);
      var jwb = normalizeEscapeAnswerGAS(jawabanSiswa);
      return kunci !== "" && kunci === jwb;
    }
  }
  return false;
}

function getEscapeTowerState(ss, isTeacherVerified, kelompokViewer) {
  var kSheet = getOrCreateEscapeKonfigurasiSheet(ss);
  var sSheet = getOrCreateEscapeSesiSheet(ss);
  var pSheet = getOrCreateEscapeProgresSheet(ss);
  var skSheet = getOrCreateEscapeSkorSheet(ss);

  var kRows = kSheet.getDataRange().getValues();
  var konfigList = [];
  for (var i = 1; i < kRows.length; i++) {
    var kr = kRows[i];
    if (!kr[0]) continue;
    konfigList.push({
      nomor_lantai: Number(kr[0]) || i,
      judul: String(kr[1] || ""),
      cerita: String(kr[2] || ""),
      soal: String(kr[3] || ""),
      jenis: String(kr[4] || "isian_singkat"),
      hint: String(kr[5] || ""),
      // KEAMANAN: Kunci jawaban TIDAK BOLEH dikirim ke sisi siswa!
      kunci_jawaban: isTeacherVerified ? String(kr[6] || "") : null,
      batas_waktu: Number(kr[7]) || 120
    });
  }

  var sRows = sSheet.getDataRange().getValues();
  var latestSesi = null;
  if (sRows.length > 1) {
    var ls = sRows[sRows.length - 1];
    latestSesi = {
      id_sesi: String(ls[0] || "SESI-1"),
      status: String(ls[1] || "menunggu"),
      waktu_mulai: String(ls[2] || "")
    };
  }

  var pRows = pSheet.getDataRange().getValues();
  var progresList = [];
  for (var p = 1; p < pRows.length; p++) {
    var pr = pRows[p];
    if (!pr[0]) continue;
    if (!latestSesi || String(pr[0]) === latestSesi.id_sesi) {
      var kNum = Number(String(pr[1]).replace(/[^0-9]/g, "")) || 1;
      progresList.push({
        id_sesi: String(pr[0]),
        kelompok: kNum,
        lantai_sekarang: Number(pr[2]) || 1,
        jumlah_salah: Number(pr[3]) || 0,
        hint_dipakai: Number(pr[4]) || 0,
        waktu_selesai: String(pr[5] || "-")
      });
    }
  }

  var skRows = skSheet.getDataRange().getValues();
  var skorList = [];
  for (var m = 1; m < skRows.length; m++) {
    var sr = skRows[m];
    if (!sr[0]) continue;
    var kg = Number(String(sr[0]).replace(/[^0-9]/g, "")) || m;
    skorList.push({
      kelompok: kg,
      total_poin: Number(sr[1]) || 0
    });
  }

  return {
    sesi: latestSesi,
    konfigurasi: konfigList,
    progres: progresList,
    skor: skorList
  };
}

// -------------------------------------------------------------
// MENARA ASESMEN INDIVIDU (6 SHEET BARU TERPISAH TANPA MENGUBAH SHEET LAMA)
// 1. "Asesmen_Sesi": id_sesi, tp_terpilih, durasi, status, waktu_mulai
// 2. "Asesmen_BankSoal": id_soal, id_sesi, tp, jenis, tipe_penyajian, id_stimulus, teks_soal, opsi, kunci_jawaban, pembahasan
// 3. "Asesmen_Stimulus": id_stimulus, jenis, isi
// 4. "Asesmen_PaketSiswa": id_sesi, siswa, urutan_soal
// 5. "Asesmen_Jawaban": id_sesi, siswa, id_soal, jawaban, ragu, waktu
// 6. "Asesmen_Hasil": id_sesi, siswa, nilai, jumlah_benar, durasi, keluar_tab
// KEAMANAN: Kunci jawaban & pembahasan TIDAK PERNAH dikirim ke siswa saat asesmen berlangsung!
// -------------------------------------------------------------
function getOrCreateAsesmenSesiSheet(ss) {
  var sheet = ss.getSheetByName("Asesmen_Sesi");
  if (!sheet) {
    sheet = ss.insertSheet("Asesmen_Sesi");
    sheet.appendRow(["id_sesi", "tp_terpilih", "durasi", "status", "waktu_mulai"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateAsesmenBankSoalSheet(ss) {
  var sheet = ss.getSheetByName("Asesmen_BankSoal");
  if (!sheet) {
    sheet = ss.insertSheet("Asesmen_BankSoal");
    sheet.appendRow(["id_soal", "id_sesi", "tp", "jenis", "tipe_penyajian", "id_stimulus", "teks_soal", "opsi", "kunci_jawaban", "pembahasan"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateAsesmenStimulusSheet(ss) {
  var sheet = ss.getSheetByName("Asesmen_Stimulus");
  if (!sheet) {
    sheet = ss.insertSheet("Asesmen_Stimulus");
    sheet.appendRow(["id_stimulus", "jenis", "isi"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateAsesmenPaketSiswaSheet(ss) {
  var sheet = ss.getSheetByName("Asesmen_PaketSiswa");
  if (!sheet) {
    sheet = ss.insertSheet("Asesmen_PaketSiswa");
    sheet.appendRow(["id_sesi", "siswa", "urutan_soal"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateAsesmenJawabanSheet(ss) {
  var sheet = ss.getSheetByName("Asesmen_Jawaban");
  if (!sheet) {
    sheet = ss.insertSheet("Asesmen_Jawaban");
    sheet.appendRow(["id_sesi", "siswa", "id_soal", "jawaban", "ragu", "waktu"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateAsesmenHasilSheet(ss) {
  var sheet = ss.getSheetByName("Asesmen_Hasil");
  if (!sheet) {
    sheet = ss.insertSheet("Asesmen_Hasil");
    sheet.appendRow(["id_sesi", "siswa", "nilai", "jumlah_benar", "durasi", "keluar_tab"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saveAsesmenSesiDanSoalGAS(ss, sesi, bankSoal, stimulusList) {
  if (sesi && sesi.id_sesi) {
    var sSheet = getOrCreateAsesmenSesiSheet(ss);
    var sRows = sSheet.getDataRange().getValues();
    var foundS = -1;
    for (var i = 1; i < sRows.length; i++) {
      if (String(sRows[i][0]) === String(sesi.id_sesi)) {
        foundS = i + 1;
        break;
      }
    }
    var sRowVal = [
      String(sesi.id_sesi),
      JSON.stringify(sesi.tp_terpilih || []),
      Number(sesi.durasi) || 30,
      String(sesi.status || "draf"),
      String(sesi.waktu_mulai || "")
    ];
    if (foundS > 0) {
      sSheet.getRange(foundS, 1, 1, sRowVal.length).setValues([sRowVal]);
    } else {
      sSheet.appendRow(sRowVal);
    }
  }

  if (Array.isArray(stimulusList)) {
    var stSheet = getOrCreateAsesmenStimulusSheet(ss);
    if (stSheet.getLastRow() > 1) {
      stSheet.deleteRows(2, stSheet.getLastRow() - 1);
    }
    for (var st = 0; st < stimulusList.length; st++) {
      var itemSt = stimulusList[st] || {};
      stSheet.appendRow([
        String(itemSt.id_stimulus || ""),
        String(itemSt.jenis || "teks"),
        String(itemSt.isi || "")
      ]);
    }
  }

  if (Array.isArray(bankSoal)) {
    var bSheet = getOrCreateAsesmenBankSoalSheet(ss);
    if (bSheet.getLastRow() > 1) {
      bSheet.deleteRows(2, bSheet.getLastRow() - 1);
    }
    for (var b = 0; b < bankSoal.length; b++) {
      var q = bankSoal[b] || {};
      var opsiPayload = q.jenis === "pg_kategori" ? JSON.stringify(q.pernyataan_kategori || q.opsi || []) : JSON.stringify(q.opsi || []);
      bSheet.appendRow([
        String(q.id_soal || ""),
        String(q.id_sesi || (sesi && sesi.id_sesi) || ""),
        String(q.tp || ""),
        String(q.jenis || "pg_tunggal"),
        String(q.tipe_penyajian || "tunggal"),
        String(q.id_stimulus || ""),
        String(q.teks_soal || ""),
        opsiPayload,
        String(q.kunci_jawaban || ""),
        String(q.pembahasan || "")
      ]);
    }
  }
}

function saveAsesmenPaketBatchGAS(ss, paketList) {
  if (!Array.isArray(paketList) || paketList.length === 0) return;
  var pSheet = getOrCreateAsesmenPaketSiswaSheet(ss);
  var pRows = pSheet.getDataRange().getValues();
  for (var i = 0; i < paketList.length; i++) {
    var pk = paketList[i] || {};
    if (!pk.id_sesi || !pk.siswa) continue;
    var foundIdx = -1;
    for (var r = 1; r < pRows.length; r++) {
      if (String(pRows[r][0]) === String(pk.id_sesi) && String(pRows[r][1]) === String(pk.siswa)) {
        foundIdx = r + 1;
        break;
      }
    }
    var rowVal = [
      String(pk.id_sesi),
      String(pk.nama_siswa || pk.siswa),
      JSON.stringify(pk.urutan_soal || [])
    ];
    if (foundIdx > 0) {
      pSheet.getRange(foundIdx, 1, 1, rowVal.length).setValues([rowVal]);
    } else {
      pSheet.appendRow(rowVal);
    }
  }
}

function saveAsesmenJawabanBatchGAS(ss, jawabanList) {
  if (!Array.isArray(jawabanList) || jawabanList.length === 0) return;
  var jSheet = getOrCreateAsesmenJawabanSheet(ss);
  var jRows = jSheet.getDataRange().getValues();
  for (var i = 0; i < jawabanList.length; i++) {
    var jw = jawabanList[i] || {};
    if (!jw.id_sesi || !jw.siswa || !jw.id_soal) continue;
    var siswaLabel = String(jw.nama_siswa || jw.siswa);
    var foundRow = -1;
    for (var r = 1; r < jRows.length; r++) {
      if (String(jRows[r][0]) === String(jw.id_sesi) && String(jRows[r][1]) === siswaLabel && String(jRows[r][2]) === String(jw.id_soal)) {
        foundRow = r + 1;
        break;
      }
    }
    var rowVal = [
      String(jw.id_sesi),
      siswaLabel,
      String(jw.id_soal),
      String(jw.jawaban || ""),
      Boolean(jw.ragu),
      String(jw.waktu || new Date().toLocaleString("id-ID"))
    ];
    if (foundRow > 0) {
      jSheet.getRange(foundRow, 1, 1, rowVal.length).setValues([rowVal]);
    } else {
      jSheet.appendRow(rowVal);
    }
  }
}

function saveAsesmenHasilBatchGAS(ss, hasilList) {
  if (!Array.isArray(hasilList) || hasilList.length === 0) return;
  var hSheet = getOrCreateAsesmenHasilSheet(ss);
  var hRows = hSheet.getDataRange().getValues();
  for (var i = 0; i < hasilList.length; i++) {
    var hs = hasilList[i] || {};
    if (!hs.id_sesi || !hs.siswa) continue;
    var siswaName = String(hs.nama_siswa || hs.siswa);
    var foundRow = -1;
    for (var r = 1; r < hRows.length; r++) {
      if (String(hRows[r][0]) === String(hs.id_sesi) && String(hRows[r][1]) === siswaName) {
        foundRow = r + 1;
        break;
      }
    }
    var rowVal = [
      String(hs.id_sesi),
      siswaName,
      Number(hs.nilai) || 0,
      Number(hs.jumlah_benar) || 0,
      Number(hs.durasi) || 0,
      Number(hs.keluar_tab) || 0
    ];
    if (foundRow > 0) {
      hSheet.getRange(foundRow, 1, 1, rowVal.length).setValues([rowVal]);
    } else {
      hSheet.appendRow(rowVal);
    }
  }
}

function getMenaraAsesmenStateGAS(ss, isTeacherVerified, siswaViewer) {
  var sSheet = getOrCreateAsesmenSesiSheet(ss);
  var bSheet = getOrCreateAsesmenBankSoalSheet(ss);
  var stSheet = getOrCreateAsesmenStimulusSheet(ss);
  var pSheet = getOrCreateAsesmenPaketSiswaSheet(ss);
  var hSheet = getOrCreateAsesmenHasilSheet(ss);

  var sRows = sSheet.getDataRange().getValues();
  var latestSesi = null;
  if (sRows.length > 1) {
    var ls = sRows[sRows.length - 1];
    var tpArr = [];
    try { tpArr = JSON.parse(String(ls[1] || "[]")); } catch (e) {}
    latestSesi = {
      id_sesi: String(ls[0] || "ASESMEN-1"),
      tp_terpilih: tpArr,
      durasi: Number(ls[2]) || 30,
      status: String(ls[3] || "draf"),
      waktu_mulai: String(ls[4] || "")
    };
  }

  var stRows = stSheet.getDataRange().getValues();
  var stimulusList = [];
  for (var st = 1; st < stRows.length; st++) {
    if (!stRows[st][0]) continue;
    stimulusList.push({
      id_stimulus: String(stRows[st][0]),
      jenis: String(stRows[st][1] || "teks"),
      isi: String(stRows[st][2] || "")
    });
  }

  var bRows = bSheet.getDataRange().getValues();
  var bankSoal = [];
  for (var b = 1; b < bRows.length; b++) {
    var br = bRows[b];
    if (!br[0]) continue;
    var parsedOpsi = [];
    try { parsedOpsi = JSON.parse(String(br[7] || "[]")); } catch (e) {}
    bankSoal.push({
      id_soal: String(br[0]),
      id_sesi: String(br[1] || ""),
      tp: String(br[2] || ""),
      jenis: String(br[3] || "pg_tunggal"),
      tipe_penyajian: String(br[4] || "tunggal"),
      id_stimulus: String(br[5] || ""),
      teks_soal: String(br[6] || ""),
      opsi: parsedOpsi,
      // KEAMANAN: Kunci jawaban & pembahasan TIDAK PERNAH dikirim ke siswa!
      kunci_jawaban: isTeacherVerified ? String(br[8] || "") : null,
      pembahasan: isTeacherVerified ? String(br[9] || "") : null
    });
  }

  var hRows = hSheet.getDataRange().getValues();
  var hasilList = [];
  for (var h = 1; h < hRows.length; h++) {
    var hr = hRows[h];
    if (!hr[0]) continue;
    if (!isTeacherVerified && siswaViewer && String(hr[1]) !== siswaViewer) continue;
    hasilList.push({
      id_sesi: String(hr[0]),
      siswa: String(hr[1]),
      nilai: Number(hr[2]) || 0,
      jumlah_benar: Number(hr[3]) || 0,
      durasi: Number(hr[4]) || 0,
      keluar_tab: Number(hr[5]) || 0
    });
  }

  return {
    sesi: latestSesi,
    stimulusList: stimulusList,
    bankSoal: bankSoal,
    hasilList: hasilList
  };
}`;

export interface RuangGuruModalProps {
  onClose: () => void;
  studentName?: string;
  teacherName?: string;
  onAddXp?: (amount: number, reason: string) => void;
  materis?: Materi[];
  objectives?: LearningObjective[];
  reflections?: Reflection[];
  feedbacks?: MentorFeedback[];
  messages?: Message[];
  students?: Student[];
  settings?: TownSettings;
  initialTab?: 'refleksi' | 'materi' | 'pesan' | 'pengaturan' | 'konsultasi';
  onAddMateri?: (materi: Materi) => void;
  onDeleteMateri?: (id: string) => void;
  onAddObjective?: (objective: LearningObjective) => void;
  onReplyMessage?: (messageId: string, reply: string) => void;
  onUpdateSettings?: (newSettings: TownSettings) => void;
  onDeleteReflection?: (id: string) => void;
  onClearAllReflections?: () => void;
  onSyncReflectionsAndMessages?: (
    syncedReflections: Reflection[],
    syncedFeedbacks: MentorFeedback[],
    syncedMessages: Message[]
  ) => void;
}

export const RuangGuruModal: React.FC<RuangGuruModalProps> = ({
  onClose,
  studentName = 'Siswa',
  teacherName,
  onAddXp,
  materis = [],
  objectives = [],
  reflections = [],
  feedbacks = [],
  messages = [],
  students = [],
  settings,
  initialTab,
  onAddMateri,
  onDeleteMateri,
  onAddObjective,
  onReplyMessage,
  onUpdateSettings,
  onDeleteReflection,
  onClearAllReflections,
  onSyncReflectionsAndMessages,
}) => {
  const isTeacherView = Boolean(settings || onAddMateri || students.length > 0);
  const [activeTab, setActiveTab] = useState<'refleksi' | 'materi' | 'pesan' | 'pengaturan' | 'konsultasi'>(
    initialTab || (isTeacherView ? 'refleksi' : 'konsultasi')
  );

  // Settings tab form state
  const [gasUrlInput, setGasUrlInput] = useState(settings?.gasWebAppUrl || '');
  const [sheetUrlInput, setSheetUrlInput] = useState(settings?.spreadsheetUrl || '');
  const [townNameInput, setTownNameInput] = useState(settings?.townName || 'Kota Refleksi SMK Negeri 2 Gorontalo');
  const [teacherPinInput, setTeacherPinInput] = useState(settings?.teacherPin || 'Kiki123!');
  const [academicYearInput, setAcademicYearInput] = useState(settings?.academicYear || '2026/2027 Ganjil');

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<{
    message: string;
    latency?: number;
    sheetName?: string;
    chatCount?: number;
    refCount?: number;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  const handleTestConnection = async () => {
    const targetUrl = gasUrlInput.trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      setTestStatus('error');
      setTestResult({ message: 'URL Google Apps Script tidak valid. Pastikan diawali dengan https://script.google.com/macros/s/.../exec' });
      return;
    }

    setTestStatus('testing');
    setTestResult(null);
    const startTime = Date.now();

    try {
      const url = new URL(targetUrl);
      url.searchParams.set('action', 'get_data');
      url.searchParams.set('_t', String(Date.now()));

      const res = await fetch(url.toString(), { method: 'GET' });
      const latency = Date.now() - startTime;

      if (!res.ok) {
        throw new Error(`Koneksi HTTP menghasilkan status: ${res.status}`);
      }

      const data = await res.json();
      const chatCount = Array.isArray(data.chats) ? data.chats.length : 0;
      const refCount = Array.isArray(data.reflections) ? data.reflections.length : 0;
      const sheetName = data.spreadsheet || 'Google Spreadsheet';

      setTestStatus('success');
      setTestResult({
        message: `Koneksi berhasil! Terhubung ke "${sheetName}" (${chatCount} chat tersimpan, ${refCount} refleksi murid).`,
        latency,
        sheetName,
        chatCount,
        refCount,
      });
      sounds.playRewardXp();
    } catch (err: any) {
      setTestStatus('error');
      setTestResult({
        message: `Gagal terhubung: ${err.message || 'Periksa kembali URL Web App atau pastikan opsi akses saat deploy adalah "Anyone / Siapa saja"'}.`,
      });
    }
  };

  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: TownSettings = {
      townName: townNameInput.trim() || 'Kota Refleksi SMK Negeri 2 Gorontalo',
      academicYear: academicYearInput.trim() || '2026/2027 Ganjil',
      teacherPin: teacherPinInput.trim() || 'Kiki123!',
      gasWebAppUrl: gasUrlInput.trim(),
      spreadsheetUrl: sheetUrlInput.trim(),
    };

    if (onUpdateSettings) {
      onUpdateSettings(updated);
    }
    setSettingsSavedToast(true);
    sounds.playRewardXp();
    setTimeout(() => setSettingsSavedToast(false), 3500);
  };

  const handleCopyScript = () => {
    try {
      navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setIsCopied(true);
      sounds.playClick();
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      // fallback
    }
  };

  // Student consultation state
  const [topic, setTopic] = useState('Kendala Praktik Kejuruan');
  const [question, setQuestion] = useState('');
  const [consultations, setConsultations] = useState([
    {
      id: 'c-1',
      mentor: 'Pak Budi (Guru RPL & Pembimbing)',
      avatar: '🧑‍🏫',
      reply: `Halo ${studentName}! Bagus sekali kamu telah rutin menuliskan refleksi harian. Kunci saat menghadapi bug koding atau rancangan yang error adalah memecahnya menjadi bagian-bagian kecil (dekomposisi). Tetap tenang dan percaya pada proses!`,
      date: 'Hari ini',
    },
    {
      id: 'c-2',
      mentor: 'dr. Maya (Konselor Pembelajaran)',
      avatar: '👩‍⚕️',
      reply: 'Jangan lupa memberi jeda istirahat jika merasa overthinking dengan tugas sekolah. Jalan santai di sekitar taman sangat baik untuk me-refresh fokus.',
      date: 'Kemarin',
    },
  ]);
  const [isSent, setIsSent] = useState(false);

  // Teacher reply state
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  const handleAskMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    sounds.playRewardXp();
    if (onAddXp) onAddXp(20, 'Konsultasi Belajar di Ruang Guru');

    const newConsultation = {
      id: `c-${Date.now()}`,
      mentor: 'Pak Budi (Guru Pembimbing)',
      avatar: '🧑‍🏫',
      reply: `Pertanyaan yang sangat reflektif tentang "${topic}". Guru sangat mengapresiasi usahamu. Pertahankan keterbukaan ini ya, ${studentName}! Catat progresnya di Jurnal 4F.`,
      date: 'Baru saja',
    };

    setConsultations([newConsultation, ...consultations]);
    setQuestion('');
    setIsSent(true);

    setTimeout(() => {
      setIsSent(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="liquid-glass-dark rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-white/20 relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-3xl shadow-inner">
              🧑‍🏫
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {isTeacherView ? 'Panel Manajemen Pendidik' : 'Konsultasi & Mentoring'}
                </span>
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Ruang Guru Kota Refleksi
                </span>
                {teacherName && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-400/40 flex items-center gap-1 shadow-sm">
                    <span>👨‍🏫</span>
                    <span>{teacherName}</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-white font-['Outfit']">Ruang Guru & Panel Pengajar</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        {isTeacherView && (
          <div className="mt-4 flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('refleksi')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'refleksi' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" /> Pantau Refleksi Murid ({reflections.length})
            </button>
            <button
              onClick={() => setActiveTab('materi')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'materi' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Kelola Materi ({materis.length})
            </button>
            <button
              onClick={() => setActiveTab('pesan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'pesan' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Pesan Masuk ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab('konsultasi')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'konsultasi' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span>💬</span> Konsultasi
            </button>
            <button
              onClick={() => setActiveTab('pengaturan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'pengaturan' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Settings className="w-4 h-4 text-amber-300" />
              <span>Pengaturan Spreadsheet & Apps Script</span>
            </button>
          </div>
        )}

        {/* Tab: Refleksi Murid */}
        {activeTab === 'refleksi' && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Daftar Pengiriman Refleksi Siswa ({reflections.length})
              </h4>
              {onSyncReflectionsAndMessages && (
                <button
                  onClick={() => onSyncReflectionsAndMessages(reflections, feedbacks, messages)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sinkron Spreadsheet
                </button>
              )}
            </div>

            {reflections.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Belum ada refleksi siswa yang masuk.
              </div>
            ) : (
              <div className="space-y-3">
                {reflections.map((r) => {
                  const fb = feedbacks.find((f) => f.reflectionId === r.id);
                  return (
                    <div key={r.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{r.studentName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                              {r.className}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                              Skala: {r.scale}/5
                            </span>
                          </div>
                          <p className="text-xs text-indigo-300 mt-0.5">{r.materiTitle || 'Materi Pembelajaran'}</p>
                        </div>
                        <span className="text-[10px] text-slate-400">{r.createdAt.slice(0, 10)}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 bg-black/20 p-3 rounded-xl">
                        {r.answers.understood && <p><strong className="text-emerald-300">Dipahami:</strong> {r.answers.understood}</p>}
                        {r.answers.difficult && <p><strong className="text-amber-300">Kendala:</strong> {r.answers.difficult}</p>}
                        {r.answers.actionPlan && <p><strong className="text-blue-300">Rencana:</strong> {r.answers.actionPlan}</p>}
                        {r.answers.facts && <p><strong className="text-purple-300">Fakta:</strong> {r.answers.facts}</p>}
                      </div>

                      {fb && (
                        <div className="text-xs text-indigo-200 bg-indigo-950/40 border border-indigo-500/30 p-2.5 rounded-xl">
                          <p className="font-semibold text-indigo-300">Feedback Mentor AI:</p>
                          <p>{fb.apresiasi}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Kelola Materi */}
        {activeTab === 'materi' && (
          <div className="mt-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Daftar Materi Aktif ({materis.length})
            </h4>
            <div className="space-y-3">
              {materis.map((m) => (
                <div key={m.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {m.targetClass}
                    </span>
                    <h5 className="font-bold text-sm text-white mt-1">{m.title}</h5>
                    <p className="text-xs text-slate-300 line-clamp-1">{m.content}</p>
                  </div>
                  {onDeleteMateri && (
                    <button
                      onClick={() => onDeleteMateri(m.id)}
                      className="p-2 rounded-xl bg-red-600/20 text-red-300 hover:bg-red-600/40 transition shrink-0"
                      title="Hapus materi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Pesan Masuk Siswa */}
        {activeTab === 'pesan' && (
          <div className="mt-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Pesan dari Kantor Pos Siswa ({messages.length})
            </h4>
            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Belum ada pesan dari siswa.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{msg.studentName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                          {msg.className}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{msg.createdAt.slice(0, 10)}</span>
                    </div>

                    <p className="text-xs text-slate-200 bg-black/20 p-3 rounded-xl border border-white/5">
                      {msg.content}
                    </p>

                    {msg.teacherReply ? (
                      <div className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl">
                        <strong>Balasan Guru:</strong> {msg.teacherReply}
                      </div>
                    ) : onReplyMessage ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Tulis balasan untuk siswa..."
                          value={replyInputs[msg.id] || ''}
                          onChange={(e) => setReplyInputs({ ...replyInputs, [msg.id]: e.target.value })}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/20 text-white text-xs outline-none focus:border-indigo-400"
                        />
                        <button
                          onClick={() => {
                            if (replyInputs[msg.id]?.trim()) {
                              onReplyMessage(msg.id, replyInputs[msg.id].trim());
                              setReplyInputs({ ...replyInputs, [msg.id]: '' });
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                        >
                          Kirim
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Konsultasi Siswa */}
        {activeTab === 'konsultasi' && (
          <div className="mt-5 space-y-4">
            <form onSubmit={handleAskMentor} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                💬 Ajukan Pertanyaan / Refleksi Kendala ke Guru
              </h4>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Topik Bimbingan</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:border-indigo-400 focus:outline-none"
                >
                  <option value="Kendala Praktik Kejuruan">Kendala Praktik Kejuruan</option>
                  <option value="Manajemen Waktu Belajar">Manajemen Waktu Belajar</option>
                  <option value="Persiapan Uji Kompetensi">Persiapan Uji Kompetensi</option>
                  <option value="Motivasi Belajar">Motivasi & Manajemen Diri</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pertanyaan atau Refleksimu</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ceritakan kendala atau pertanyaanmu di sini..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                {isSent ? (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Pertanyaan Terkirim! (+20 XP)
                  </span>
                ) : <span />}
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" /> Minta Feedback Guru
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Catatan Arahan dari Guru Pembimbing
              </h4>
              {consultations.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{c.avatar}</span>
                      <span className="text-xs font-bold text-white">{c.mentor}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{c.date}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                    {c.reply}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Pengaturan Spreadsheet & Apps Script */}
        {activeTab === 'pengaturan' && (
          <div className="mt-5 space-y-6">
            {/* Success Toast */}
            {settingsSavedToast && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-2xl flex items-center justify-between text-emerald-200 text-xs font-bold animate-fade-in">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Pengaturan Google Spreadsheet & Apps Script berhasil disimpan!
                </span>
                <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded-full text-white">Tersimpan</span>
              </div>
            )}

            {/* 1. KARTU INTEGRASI GOOGLE SPREADSHEET & APPS SCRIPT */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">Integrasi Google Spreadsheet & Web App</h4>
                    <p className="text-[11px] text-slate-300">
                      Basis data cloud untuk sinkronisasi obrolan murid, refleksi 4F, dan pesan pengajar
                    </p>
                  </div>
                </div>

                {sheetUrlInput && (
                  <a
                    href={sheetUrlInput}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <span>Buka Spreadsheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Spreadsheet URL Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>URL Google Spreadsheet</span>
                  </label>
                  <input
                    type="url"
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-white text-xs font-mono focus:border-emerald-400 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Link spreadsheet tempat penyimpanan data refleksi, feedback, dan obrolan warga.
                  </p>
                </div>

                {/* Google Apps Script Web App URL Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>URL Google Apps Script Web App (/exec)</span>
                  </label>
                  <input
                    type="url"
                    value={gasUrlInput}
                    onChange={(e) => setGasUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/15 text-white text-xs font-mono focus:border-indigo-400 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    URL deployment Web App yang menghubungkan website ini langsung ke spreadsheet.
                  </p>
                </div>
              </div>

              {/* Uji Koneksi Button & Status */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/20 p-3.5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow flex items-center gap-2 transition disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>{testStatus === 'testing' ? 'Menguji Koneksi...' : '⚡ Uji Koneksi ke Spreadsheet'}</span>
                  </button>

                  {testResult && testStatus === 'success' && (
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Activity className="w-3 h-3" /> {testResult.latency}ms
                    </span>
                  )}
                </div>

                {/* Test Feedback Message */}
                {testResult && (
                  <div
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                      testStatus === 'success'
                        ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-900/40 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {testStatus === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className="truncate max-w-sm">{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. KARTU FITUR REALTIME OBROLAN WARGA */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/40 to-cyan-950/40 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Fitur Obrolan Realtime Antar-Murid (Google Sheet Sync)</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Obrolan yang dikirim oleh murid di HP atau laptop otomatis disimpan ke sheet{' '}
                <code className="text-emerald-300 font-mono font-bold px-1.5 py-0.5 bg-black/40 rounded">Obrolan_Warga</code>.
                Setiap 3.5 detik, obrolan baru dari murid lain ditarik otomatis tanpa mengganggu pergerakan kota 3D, dan pesan lebih dari 24 jam otomatis dibersihkan.
              </p>
            </div>

            {/* 3. KARTU KODE SKRIP GOOGLE APPS SCRIPT LENGKAP */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">Kode Skrip Google Apps Script (v3.0)</h4>
                    <p className="text-[11px] text-slate-300">
                      Skrip resmi untuk Google Spreadsheet: mendukung Leaderboard Mingguan Balai Kota (7 Hari Terakhir), Pesan_Kantor_Pos, Data_Refleksi_Siswa, Hasil_Tes_Lab_DKV & Hasil_Podcast_Siswa
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Tersalin ke Clipboard!' : 'Salin Skrip Google Apps Script'}</span>
                </button>
              </div>

              {/* Langkah Instalasi */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
                  <span className="font-bold text-amber-400 block mb-0.5">1. Buka Sheet</span>
                  Buka Google Spreadsheet lalu pilih menu <b>Ekstensi &gt; Apps Script</b>.
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
                  <span className="font-bold text-amber-400 block mb-0.5">2. Tempel Kode</span>
                  Hapus isi file <code className="text-indigo-300 font-mono">Code.gs</code> lalu tempelkan skrip di bawah.
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
                  <span className="font-bold text-amber-400 block mb-0.5">3. Terapkan Web App</span>
                  Klik <b>Terapkan &gt; Penerapan Baru</b>, pilih jenis <b>Aplikasi Web</b>.
                </div>
                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
                  <span className="font-bold text-amber-400 block mb-0.5">4. Hak Akses: Anyone</span>
                  Setel <i>Akses</i> ke <b>Siapa saja (Anyone)</b>, lalu salin URL <code className="text-emerald-300 font-mono">/exec</code> ke kolom di atas.
                </div>
              </div>

              {/* Code Preview Box */}
              <div className="relative">
                <pre className="p-3.5 rounded-xl bg-slate-950/90 border border-white/10 text-[11px] font-mono text-emerald-300 max-h-56 overflow-y-auto leading-relaxed select-all">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>

            {/* 4. IDENTITAS KOTA & KATA SANDI GURU */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Pengaturan Umum Kota & Keamanan Pengajar</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nama Kota Pembelajaran</label>
                  <input
                    type="text"
                    value={townNameInput}
                    onChange={(e) => setTownNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tahun Ajaran & Semester</label>
                  <input
                    type="text"
                    value={academicYearInput}
                    onChange={(e) => setAcademicYearInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kata Sandi / PIN Ruang Guru</label>
                  <input
                    type="text"
                    value={teacherPinInput}
                    onChange={(e) => setTeacherPinInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 5. TOMBOL SIMPAN PENGATURAN */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs shadow-lg flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Seluruh Pengaturan</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
