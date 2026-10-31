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
 * Versi: 2.6 (Dukungan Studio ON AIR Podcast, Pasar Prestasi, Jurnal Pohon Beringin, Obrolan Warga & Refleksi 4F)
 * 
 * Panduan Pemasangan:
 * 1. Buka Google Spreadsheet ini.
 * 2. Klik menu Ekstensi (Extensions) > Apps Script.
 * 3. Hapus seluruh kode lama di Code.gs dan tempelkan seluruh skrip ini.
 * 4. Klik Simpan (ikon disket / Ctrl+S).
 * 5. Klik 'Terapkan' (Deploy) > 'Penerapan baru' (New deployment).
 * 6. Pilih jenis: 'Aplikasi Web' (Web app).
 * 7. Isi Konfigurasi:
 *    - Deskripsi: Kota Refleksi Web App v2.6
 *    - Jalankan sebagai (Execute as): Saya (Me)
 *    - Siapa yang memiliki akses (Who has access): Siapa saja (Anyone)
 * 8. Klik 'Terapkan' (Deploy) lalu berikan izin akses Google (Izinkan/Allow).
 * 9. Salin URL Aplikasi Web yang berakhiran /exec dan masukkan ke menu Pengaturan di Ruang Guru.
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

  // 2. Aksi Lengkap Semua Data v2.6 (Refleksi, Feedback, Pesan, Obrolan Warga, Jurnal Pohon Beringin, Studio ON AIR Podcast, & Pasar Prestasi)
  var reflections = getReflections(ss);
  var feedbacks = getFeedbacks(ss);
  var messages = getMessages(ss);
  var chats = getPublicChats(ss);
  var stickyNotes = getStickyNotes(ss);
  var podcasts = getPodcasts(ss);
  var pasarPrestasi = getPasarPrestasi(ss);

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    version: "2.6",
    spreadsheet: ss.getName(),
    reflections: reflections,
    feedbacks: feedbacks,
    messages: messages,
    chats: chats,
    stickyNotes: stickyNotes,
    podcasts: podcasts,
    pasarPrestasi: pasarPrestasi,
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
    } else if (action === "send_message") {
      saveMessage(ss, data.message);
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === "reply_message") {
      saveMessageReply(ss, data.messageId, data.reply, data.repliedAt);
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
// MANAJEMEN REFLEKSI & FEEDBACK SISWA
// -------------------------------------------------------------
function getOrCreateReflectionSheet(ss) {
  var sheet = ss.getSheetByName("Refleksi_Siswa");
  if (!sheet) {
    sheet = ss.insertSheet("Refleksi_Siswa");
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
  
  sheet.appendRow([
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
  ]);

  if (fb && fb.id) {
    saveFeedback(ss, fb);
  }
}

function getReflections(ss) {
  var sheet = ss.getSheetByName("Refleksi_Siswa");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var custom = {};
    try { custom = JSON.parse(r[13]); } catch(e) {}
    list.push({
      id: String(r[0]),
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
  }
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

function saveMessage(ss, msg) {
  var sheet = ss.getSheetByName("Pesan_Guru");
  if (!sheet) {
    sheet = ss.insertSheet("Pesan_Guru");
    sheet.appendRow(["ID Pesan", "ID Siswa", "Nama Siswa", "Kelas", "Isi Pesan", "Status", "Balasan Guru", "Waktu Kirim", "Waktu Balas"]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    msg.id, msg.studentId, msg.studentName, msg.className, msg.content,
    msg.status || "unread", msg.teacherReply || "", msg.createdAt || "", ""
  ]);
}

function getMessages(ss) {
  var sheet = ss.getSheetByName("Pesan_Guru");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];

  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    list.push({
      id: String(r[0]),
      studentId: String(r[1]),
      studentName: String(r[2]),
      className: String(r[3]),
      content: String(r[4]),
      status: String(r[5]) || "unread",
      teacherReply: String(r[6] || ""),
      createdAt: String(r[7]),
      repliedAt: String(r[8] || "")
    });
  }
  return list;
}

function saveMessageReply(ss, msgId, reply, repliedAt) {
  var sheet = ss.getSheetByName("Pesan_Guru");
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(msgId)) {
      sheet.getRange(i + 1, 6).setValue("replied");
      sheet.getRange(i + 1, 7).setValue(reply);
      sheet.getRange(i + 1, 9).setValue(repliedAt || new Date().toLocaleString("id-ID"));
      break;
    }
  }
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
// MANAJEMEN STUDIO ON AIR PODCAST (MENARA MENTOR KOTA - v2.6)
// -------------------------------------------------------------
function getOrCreatePodcastSheet(ss) {
  var sheet = ss.getSheetByName("Studio_On_Air_Podcast");
  if (!sheet) {
    sheet = ss.insertSheet("Studio_On_Air_Podcast");
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
  sheet.appendRow([
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
  ]);
}

function getPodcasts(ss) {
  var sheet = ss.getSheetByName("Studio_On_Air_Podcast");
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] || !r[5]) continue;
    list.push({
      id: String(r[0]),
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
  return list;
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
                    <h4 className="text-sm font-extrabold text-white">Kode Skrip Google Apps Script (v2.6)</h4>
                    <p className="text-[11px] text-slate-300">
                      Skrip resmi untuk Google Spreadsheet agar mendukung Studio ON AIR Podcast, Pasar Prestasi, Jurnal Pohon Beringin, Obrolan Warga & Refleksi 4F
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
