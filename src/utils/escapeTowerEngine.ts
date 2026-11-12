import {
  Student,
  MysteryGroupNumber,
  EscapeFloorNumber,
  EscapeKonfigurasiFloor,
  EscapeProgresRow,
  EscapeSkorRow,
  EscapeTowerPlayerPresence,
  EscapeTowerState,
  EscapeSesiRow,
  MysteryArenaGroupChatMsg,
} from '../types/index.ts';

const ESCAPE_TOWER_STORE_KEY = 'kota_refleksi_escape_tower_canonical_v1';

export interface CanonicalEscapeTowerStore {
  version: number;
  sesi: EscapeSesiRow;
  konfigurasi: Array<
    EscapeKonfigurasiFloor & {
      hint: string;
      kunci_jawaban: string;
    }
  >;
  progres: Record<number, EscapeProgresRow>;
  skor: EscapeSkorRow[];
  studentGroupMap: Record<string, MysteryGroupNumber>;
  groupMembers: Record<
    number,
    Array<{
      studentId: string;
      studentName: string;
      className: string;
      gender: 'L' | 'P';
    }>
  >;
  towerPlayers: Record<string, EscapeTowerPlayerPresence>;
  groupChats: MysteryArenaGroupChatMsg[];
  winningGroups: MysteryGroupNumber[];
}

export function getDefaultCanonicalEscapeFloors(): CanonicalEscapeTowerStore['konfigurasi'] {
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

export function createDefaultEscapeTowerStore(): CanonicalEscapeTowerStore {
  const nowStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const sesiId = 'escape-1';
  const progres: Record<number, EscapeProgresRow> = {};
  const skor: EscapeSkorRow[] = [];
  const groupMembers: CanonicalEscapeTowerStore['groupMembers'] = {};

  for (let g = 1; g <= 8; g++) {
    const grp = g as MysteryGroupNumber;
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
    version: 1,
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
    konfigurasi: getDefaultCanonicalEscapeFloors(),
    progres,
    skor,
    studentGroupMap: {},
    groupMembers,
    towerPlayers: {},
    groupChats: [],
    winningGroups: [],
  };
}

export function loadLocalEscapeTowerStore(): CanonicalEscapeTowerStore {
  try {
    const raw = localStorage.getItem(ESCAPE_TOWER_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.sesi && Array.isArray(parsed.konfigurasi)) {
        const def = createDefaultEscapeTowerStore();
        return {
          ...def,
          ...parsed,
          sesi: { ...def.sesi, ...parsed.sesi },
          konfigurasi:
            parsed.konfigurasi.length === 5
              ? parsed.konfigurasi.map((f: any, idx: number) => ({
                  ...def.konfigurasi[idx],
                  ...f,
                  hint: String(f.hint ?? def.konfigurasi[idx].hint),
                  kunci_jawaban: String(f.kunci_jawaban ?? def.konfigurasi[idx].kunci_jawaban),
                }))
              : def.konfigurasi,
          progres: parsed.progres || def.progres,
          skor: Array.isArray(parsed.skor) && parsed.skor.length === 8 ? parsed.skor : def.skor,
          studentGroupMap: parsed.studentGroupMap || {},
          groupMembers: parsed.groupMembers || def.groupMembers,
          towerPlayers: parsed.towerPlayers || {},
          groupChats: Array.isArray(parsed.groupChats) ? parsed.groupChats : [],
          winningGroups: Array.isArray(parsed.winningGroups) ? parsed.winningGroups : [],
        };
      }
    }
  } catch {}
  return createDefaultEscapeTowerStore();
}

export function saveLocalEscapeTowerStore(
  store: CanonicalEscapeTowerStore
): CanonicalEscapeTowerStore {
  try {
    localStorage.setItem(ESCAPE_TOWER_STORE_KEY, JSON.stringify(store));
  } catch {}
  return store;
}

function normalizeEscapeAnswer(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function checkEscapeFloorAnswer(
  floor: CanonicalEscapeTowerStore['konfigurasi'][number],
  rawSubmitted: string
): boolean {
  const submitted = normalizeEscapeAnswer(rawSubmitted);
  const key = normalizeEscapeAnswer(floor.kunci_jawaban);
  if (!submitted || !key) return false;

  if (submitted === key) return true;

  if (floor.jenis === 'pilihan_ganda') {
    const subFirstLetter = submitted.replace(/^([a-e])[\.\)\s].*$/i, '$1').trim();
    const keyFirstLetter = key.replace(/^([a-e])[\.\)\s].*$/i, '$1').trim();
    if (
      subFirstLetter.length === 1 &&
      keyFirstLetter.length === 1 &&
      subFirstLetter === keyFirstLetter
    ) {
      return true;
    }
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

export function recalculateEscapeTowerScoresInStore(store: CanonicalEscapeTowerStore) {
  const sesi = store.sesi;
  const maxGroup = Math.max(1, Math.min(8, sesi.jumlah_kelompok || 8));

  const finishedGroups = Object.values(store.progres)
    .filter((p) => p.kelompok <= maxGroup && p.lantai_sekarang === 6 && p.durasi_detik !== null)
    .sort((a, b) => (a.durasi_detik || 999999) - (b.durasi_detik || 999999));

  finishedGroups.forEach((p, idx) => {
    p.peringkat_atap = idx + 1;
  });

  store.winningGroups = finishedGroups.map((p) => p.kelompok);

  for (let g = 1; g <= 8; g++) {
    const grp = g as MysteryGroupNumber;
    const prog = store.progres[grp];
    const skorRow = store.skor.find((s) => s.kelompok === grp);
    if (!prog || !skorRow) continue;

    let speedBonus = 0;
    if (prog.lantai_sekarang === 6 && prog.peringkat_atap) {
      const rankMultipliers = [1.0, 0.75, 0.5, 0.35, 0.25, 0.2, 0.15, 0.1];
      const mult = rankMultipliers[prog.peringkat_atap - 1] ?? 0.1;
      speedBonus = Math.round(sesi.bonus_kecepatan * mult);
    }

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

export function buildViewFromEscapeTowerStore(
  store: CanonicalEscapeTowerStore,
  viewerId: string,
  isVerifiedTeacher: boolean,
  viewerGroup?: MysteryGroupNumber | null
): EscapeTowerState {
  recalculateEscapeTowerScoresInStore(store);

  const effectiveGroup = (viewerGroup ||
    (viewerId ? store.studentGroupMap[viewerId] : null) ||
    1) as MysteryGroupNumber;

  const myProg = store.progres[effectiveGroup];
  const myCurrentFloor = myProg?.lantai_sekarang || 1;
  const myUnlockedHints = myProg?.hint_terbuka_lantai || [];

  const sanitizedKonfigurasi: EscapeKonfigurasiFloor[] = store.konfigurasi.map((f) => {
    if (isVerifiedTeacher) {
      return { ...f };
    }
    const isFloorUnlockedForGroup = f.nomor_lantai <= myCurrentFloor;
    const isHintUnlocked = myUnlockedHints.includes(f.nomor_lantai);

    let studentOpsi = f.opsi ? [...f.opsi] : [];
    if (f.jenis === 'urutan_langkah' && studentOpsi.length > 1) {
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
      kunci_jawaban: null,
      batas_waktu: f.batas_waktu,
    };
  });

  const sanitizedProgres: Record<number, EscapeProgresRow> = {};
  for (let g = 1; g <= 8; g++) {
    const grp = g as MysteryGroupNumber;
    const p = store.progres[grp];
    if (!p) continue;
    const isOwnGroupOrTeacher = isVerifiedTeacher || grp === effectiveGroup;
    sanitizedProgres[grp] = {
      ...p,
      draft_jawaban: isOwnGroupOrTeacher ? p.draft_jawaban : '',
      pesan_jawaban_terakhir: isOwnGroupOrTeacher ? p.pesan_jawaban_terakhir : '',
    };
  }

  Object.values(store.towerPlayers).forEach((tp) => {
    if (!tp.isTeacher && tp.kelompok && tp.kelompok >= 1 && tp.kelompok <= 8) {
      const grp = tp.kelompok;
      store.studentGroupMap[tp.studentId] = grp;
      const list = store.groupMembers[grp] || [];
      if (!list.some((m) => m.studentId === tp.studentId)) {
        list.push({
          studentId: tp.studentId,
          studentName: tp.studentName,
          className: tp.className || 'X DKV',
          gender: tp.gender === 'P' ? 'P' : 'L',
        });
        store.groupMembers[grp] = list;
      }
    }
  });

  const enrichedGroupMembers: EscapeTowerState['groupMembers'] = {};
  for (let g = 1; g <= 8; g++) {
    const members = store.groupMembers[g] || [];
    enrichedGroupMembers[g] = members.map((m) => ({
      ...m,
      isOnline: Boolean(
        store.towerPlayers[m.studentId] ||
          Object.values(store.towerPlayers).some(
            (tp) => tp.studentName.trim().toLowerCase() === m.studentName.trim().toLowerCase()
          )
      ),
    }));
  }

  const filteredChats = isVerifiedTeacher
    ? store.groupChats.slice(-80)
    : store.groupChats.filter((c) => c.kelompok === effectiveGroup).slice(-50);

  return {
    sesi: store.sesi,
    konfigurasi: sanitizedKonfigurasi,
    progres: sanitizedProgres,
    skor: store.skor,
    studentGroupMap: store.studentGroupMap,
    groupMembers: enrichedGroupMembers,
    towerPlayers: Object.values(store.towerPlayers),
    groupChats: filteredChats,
    winningGroups: store.winningGroups,
    serverTime: Date.now(),
  };
}

async function fetchJsonSafe(
  url: string,
  options?: RequestInit,
  timeoutMs = 3000
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

export const EscapeTowerEngine = {
  getInitialHydratedState(
    student: Student,
    effectiveStudentId: string,
    effectiveStudentName: string,
    selectedGroup: MysteryGroupNumber
  ): EscapeTowerState {
    const store = loadLocalEscapeTowerStore();
    const now = Date.now();
    const isTeacher = Boolean(student.isTeacher);
    const resolvedGroup = isTeacher
      ? null
      : (store.studentGroupMap[effectiveStudentId] || selectedGroup || 1);

    if (!isTeacher && resolvedGroup) {
      store.studentGroupMap[effectiveStudentId] = resolvedGroup;
      for (let g = 1; g <= 8; g++) {
        store.groupMembers[g] = (store.groupMembers[g] || []).filter(
          (m) => m.studentId !== effectiveStudentId
        );
      }
      store.groupMembers[resolvedGroup].push({
        studentId: effectiveStudentId,
        studentName: effectiveStudentName,
        className: student.className || 'X DKV',
        gender: student.gender === 'P' ? 'P' : 'L',
      });
    }

    store.towerPlayers[effectiveStudentId] = {
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      className: student.className || (isTeacher ? 'Dewan Guru' : 'X DKV'),
      gender: student.gender === 'P' ? 'P' : 'L',
      isTeacher,
      kelompok: resolvedGroup,
      lantai_sekarang: resolvedGroup ? store.progres[resolvedGroup]?.lantai_sekarang || 1 : 1,
      lastSeen: now,
    };

    saveLocalEscapeTowerStore(store);
    return buildViewFromEscapeTowerStore(store, effectiveStudentId, isTeacher, selectedGroup);
  },

  async fetchState(params: {
    student: Student;
    effectiveStudentId: string;
    effectiveStudentName: string;
    selectedGroup: MysteryGroupNumber;
  }): Promise<{
    data: EscapeTowerState;
    isVerifiedTeacher: boolean;
    source: 'server' | 'local';
  }> {
    const { student, effectiveStudentId, effectiveStudentName, selectedGroup } = params;
    const isTeacher = Boolean(student.isTeacher);
    const qs = new URLSearchParams({
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      className: student.className || 'X DKV',
      gender: student.gender === 'P' ? 'P' : 'L',
      isTeacher: String(isTeacher),
      studentNumber: student.studentNumber || '',
      kelompok: String(selectedGroup),
      _t: String(Date.now()),
    });

    const { ok, json } = await fetchJsonSafe(`/api/escape-tower/state?${qs.toString()}`, {
      cache: 'no-store',
    });

    if (ok && json?.success && json.data) {
      const srv = json.data as EscapeTowerState;
      const store = loadLocalEscapeTowerStore();
      if (srv.sesi) store.sesi = srv.sesi;
      if (isTeacher && Array.isArray(srv.konfigurasi) && srv.konfigurasi.length === 5) {
        store.konfigurasi = srv.konfigurasi.map((f, idx) => ({
          ...store.konfigurasi[idx],
          ...f,
          hint: String(f.hint ?? store.konfigurasi[idx].hint),
          kunci_jawaban: String(f.kunci_jawaban ?? store.konfigurasi[idx].kunci_jawaban),
        }));
      }
      if (srv.progres) {
        for (let g = 1; g <= 8; g++) {
          if (srv.progres[g]) {
            store.progres[g] = { ...store.progres[g], ...srv.progres[g] };
          }
        }
      }
      if (Array.isArray(srv.skor) && srv.skor.length === 8) store.skor = srv.skor;
      if (srv.studentGroupMap) {
        store.studentGroupMap = { ...store.studentGroupMap, ...srv.studentGroupMap };
      }
      if (Array.isArray(srv.towerPlayers)) {
        srv.towerPlayers.forEach((tp) => {
          store.towerPlayers[tp.studentId] = tp;
        });
      }
      saveLocalEscapeTowerStore(store);

      return {
        data: srv,
        isVerifiedTeacher: Boolean(json.isVerifiedTeacher ?? isTeacher),
        source: 'server',
      };
    }

    const store = loadLocalEscapeTowerStore();
    if (store.towerPlayers[effectiveStudentId]) {
      store.towerPlayers[effectiveStudentId].lastSeen = Date.now();
      saveLocalEscapeTowerStore(store);
    }
    return {
      data: buildViewFromEscapeTowerStore(store, effectiveStudentId, isTeacher, selectedGroup),
      isVerifiedTeacher: isTeacher,
      source: 'local',
    };
  },

  async executeTeacherAction(params: {
    student: Student;
    actionType: string;
    extraPayload?: Record<string, any>;
  }): Promise<{
    success: boolean;
    error?: string;
    data: EscapeTowerState;
    canonicalStore: CanonicalEscapeTowerStore;
  }> {
    const { student, actionType, extraPayload = {} } = params;

    const { ok, json } = await fetchJsonSafe('/api/escape-tower/teacher-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacherId: student.id,
        teacherName: student.name,
        isTeacher: student.isTeacher,
        studentNumber: student.studentNumber,
        actionType,
        ...extraPayload,
      }),
    });

    const store = loadLocalEscapeTowerStore();
    const now = Date.now();
    const nowStr = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    if (actionType === 'save_konfigurasi') {
      const { konfigurasi, pengaturan } = extraPayload;
      if (Array.isArray(konfigurasi) && konfigurasi.length === 5) {
        store.konfigurasi = konfigurasi.map((f: any, idx: number) => ({
          nomor_lantai: (idx + 1) as EscapeFloorNumber,
          judul: String(f.judul || `Lantai ${idx + 1}`).trim(),
          cerita: String(f.cerita || '').trim(),
          soal: String(f.soal || '').trim(),
          jenis: (['pilihan_ganda', 'isian_singkat', 'urutan_langkah', 'sandi_kode'].includes(f.jenis)
            ? f.jenis
            : 'isian_singkat') as EscapeKonfigurasiFloor['jenis'],
          opsi: Array.isArray(f.opsi) ? f.opsi.map(String) : [],
          hint: String(f.hint || '').trim(),
          kunci_jawaban: String(f.kunci_jawaban || '').trim(),
          batas_waktu: Math.max(15, Math.min(900, Number(f.batas_waktu) || 120)),
        }));
      }
      if (pengaturan && typeof pengaturan === 'object') {
        store.sesi.jumlah_kelompok = Math.max(
          1,
          Math.min(8, Number(pengaturan.jumlah_kelompok) || 8)
        );
        store.sesi.poin_dasar = Math.max(10, Math.min(500, Number(pengaturan.poin_dasar) || 100));
        store.sesi.bonus_kecepatan = Math.max(
          0,
          Math.min(300, Number(pengaturan.bonus_kecepatan) || 50)
        );
        store.sesi.pengurang_hint = Math.max(
          0,
          Math.min(100, Number(pengaturan.pengurang_hint) || 10)
        );
        store.sesi.pengurang_salah = Math.max(
          0,
          Math.min(100, Number(pengaturan.pengurang_salah) || 5)
        );
        store.sesi.penalti_waktu_salah_detik = Math.max(
          1,
          Math.min(60, Number(pengaturan.penalti_waktu_salah_detik) || 5)
        );
      }
    } else if (actionType === 'start_game') {
      if (store.sesi.status === 'menunggu' || store.sesi.status === 'selesai') {
        const nextNum =
          (parseInt(store.sesi.id_sesi.replace('escape-', ''), 10) || 1) +
          (store.sesi.status === 'selesai' ? 1 : 0);
        const sesiId = `escape-${nextNum}`;
        store.sesi.id_sesi = sesiId;
        store.sesi.waktu_mulai = nowStr;
        store.sesi.waktu_mulai_ms = now;
        store.sesi.waktu_jeda_ms = null;
        store.sesi.total_durasi_jeda_ms = 0;
        store.sesi.guru_pembuat = student.name || 'Guru DKV';
        store.winningGroups = [];

        for (let g = 1; g <= 8; g++) {
          const grp = g as MysteryGroupNumber;
          store.progres[grp] = {
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
        Object.values(store.towerPlayers).forEach((tp) => {
          tp.lantai_sekarang = 1;
        });
      }
      store.sesi.status = 'berjalan';
      if (!store.sesi.waktu_mulai_ms) {
        store.sesi.waktu_mulai_ms = now;
      }
    } else if (actionType === 'pause_game') {
      if (store.sesi.status === 'berjalan') {
        store.sesi.status = 'jeda';
        store.sesi.waktu_jeda_ms = now;
      }
    } else if (actionType === 'resume_game') {
      if (store.sesi.status === 'jeda') {
        if (store.sesi.waktu_jeda_ms) {
          store.sesi.total_durasi_jeda_ms += now - store.sesi.waktu_jeda_ms;
        }
        store.sesi.waktu_jeda_ms = null;
        store.sesi.status = 'berjalan';
      }
    } else if (actionType === 'end_game') {
      store.sesi.status = 'selesai';
      store.sesi.waktu_jeda_ms = null;
    } else if (actionType === 'reset_game') {
      const nextNum = (parseInt(store.sesi.id_sesi.replace('escape-', ''), 10) || 1) + 1;
      const newId = `escape-${nextNum}`;
      store.sesi.id_sesi = newId;
      store.sesi.status = 'menunggu';
      store.sesi.waktu_mulai = nowStr;
      store.sesi.waktu_mulai_ms = null;
      store.sesi.waktu_jeda_ms = null;
      store.sesi.total_durasi_jeda_ms = 0;
      store.winningGroups = [];

      for (let g = 1; g <= 8; g++) {
        const grp = g as MysteryGroupNumber;
        store.progres[grp] = {
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
      Object.values(store.towerPlayers).forEach((tp) => {
        tp.lantai_sekarang = 1;
      });
    } else if (actionType === 'assign_group') {
      const grp = Math.max(1, Math.min(8, Number(extraPayload.targetGroup) || 1)) as MysteryGroupNumber;
      const sid = String(extraPayload.targetStudentId || '').trim();
      if (sid) {
        store.studentGroupMap[sid] = grp;
        for (let g = 1; g <= 8; g++) {
          store.groupMembers[g] = (store.groupMembers[g] || []).filter((m) => m.studentId !== sid);
        }
        store.groupMembers[grp].push({
          studentId: sid,
          studentName: String(extraPayload.targetStudentName || 'Siswa DKV'),
          className: String(extraPayload.targetStudentClass || 'X DKV'),
          gender: extraPayload.targetStudentGender === 'P' ? 'P' : 'L',
        });
        if (store.towerPlayers[sid]) {
          store.towerPlayers[sid].kelompok = grp;
          store.towerPlayers[sid].lantai_sekarang = store.progres[grp]?.lantai_sekarang || 1;
        }
      }
    }

    recalculateEscapeTowerScoresInStore(store);
    const saved = saveLocalEscapeTowerStore(store);

    if (ok && json?.success && json.data) {
      return {
        success: true,
        data: json.data as EscapeTowerState,
        canonicalStore: saved,
      };
    }

    return {
      success: true,
      data: buildViewFromEscapeTowerStore(saved, student.id, true),
      canonicalStore: saved,
    };
  },

  async executeStudentAction(params: {
    student: Student;
    effectiveStudentId: string;
    effectiveStudentName: string;
    actionType: 'join_group' | 'sync_draft' | 'request_hint' | 'submit_answer' | 'send_group_chat';
    kelompok: MysteryGroupNumber;
    jawaban?: string;
    draft_jawaban?: string;
    chatContent?: string;
  }): Promise<{
    success: boolean;
    error?: string;
    hasil?: 'benar' | 'salah' | null;
    message?: string;
    data: EscapeTowerState;
    groupProgress?: EscapeProgresRow;
  }> {
    const {
      student,
      effectiveStudentId,
      effectiveStudentName,
      actionType,
      kelompok,
      jawaban,
      draft_jawaban,
      chatContent,
    } = params;

    const { ok, json } = await fetchJsonSafe('/api/escape-tower/student-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: effectiveStudentId,
        studentName: effectiveStudentName,
        className: student.className,
        gender: student.gender,
        isTeacher: student.isTeacher,
        studentNumber: student.studentNumber,
        actionType,
        kelompok,
        jawaban,
        draft_jawaban,
        chatContent,
      }),
    });

    const store = loadLocalEscapeTowerStore();
    const now = Date.now();
    const nowStr = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const isTeacher = Boolean(student.isTeacher);
    const sGender: 'L' | 'P' = student.gender === 'P' ? 'P' : 'L';
    const sClass = student.className || 'X DKV';

    if (!store.towerPlayers[effectiveStudentId]) {
      store.towerPlayers[effectiveStudentId] = {
        studentId: effectiveStudentId,
        studentName: effectiveStudentName,
        className: sClass,
        gender: sGender,
        isTeacher,
        kelompok: isTeacher ? null : kelompok,
        lantai_sekarang: isTeacher ? 1 : store.progres[kelompok]?.lantai_sekarang || 1,
        lastSeen: now,
      };
    } else {
      store.towerPlayers[effectiveStudentId].lastSeen = now;
      store.towerPlayers[effectiveStudentId].studentName = effectiveStudentName;
    }

    const player = store.towerPlayers[effectiveStudentId];
    let answerResult: 'benar' | 'salah' | null = null;
    let answerFeedback = '';

    if (actionType === 'join_group') {
      if (!isTeacher) {
        store.studentGroupMap[effectiveStudentId] = kelompok;
        for (let g = 1; g <= 8; g++) {
          store.groupMembers[g] = (store.groupMembers[g] || []).filter(
            (m) => m.studentId !== effectiveStudentId
          );
        }
        store.groupMembers[kelompok].push({
          studentId: effectiveStudentId,
          studentName: effectiveStudentName,
          className: sClass,
          gender: sGender,
        });
        player.kelompok = kelompok;
        player.lantai_sekarang = store.progres[kelompok]?.lantai_sekarang || 1;
      }
    } else if (actionType === 'sync_draft') {
      if (store.progres[kelompok]) {
        store.progres[kelompok].draft_jawaban = String(draft_jawaban ?? '').slice(0, 500);
        store.progres[kelompok].terakhir_dijawab_oleh = effectiveStudentName;
      }
    } else if (actionType === 'request_hint') {
      const prog = store.progres[kelompok];
      if (!prog) {
        return {
          success: false,
          error: 'Pilih kelompok terlebih dahulu.',
          data: buildViewFromEscapeTowerStore(store, effectiveStudentId, isTeacher, kelompok),
        };
      }
      if (store.sesi.status !== 'berjalan' && (!ok || !json?.success)) {
        return {
          success: false,
          error: 'Permainan harus berstatus BERJALAN untuk membuka petunjuk (Hint).',
          data: buildViewFromEscapeTowerStore(store, effectiveStudentId, isTeacher, kelompok),
        };
      }
      if (prog.lantai_sekarang <= 5) {
        const currentFl = prog.lantai_sekarang as EscapeFloorNumber;
        if (!prog.hint_terbuka_lantai.includes(currentFl)) {
          prog.hint_terbuka_lantai.push(currentFl);
          prog.hint_dipakai += 1;
          recalculateEscapeTowerScoresInStore(store);
        }
      }
    } else if (actionType === 'submit_answer') {
      const prog = store.progres[kelompok];
      if (!prog) {
        return {
          success: false,
          error: 'Pilih kelompok terlebih dahulu.',
          data: buildViewFromEscapeTowerStore(store, effectiveStudentId, isTeacher, kelompok),
        };
      }
      if (store.sesi.status !== 'berjalan' && (!ok || !json?.success)) {
        return {
          success: false,
          error:
            store.sesi.status === 'jeda'
              ? '⏸️ Permainan sedang dijeda oleh Guru.'
              : '⏳ Permainan belum dimulai oleh Guru.',
          data: buildViewFromEscapeTowerStore(store, effectiveStudentId, isTeacher, kelompok),
        };
      }
      if (prog.lantai_sekarang >= 6 && (!ok || !json?.success)) {
        return {
          success: false,
          error: '🏆 Kelompokmu sudah berhasil membuka Pintu Atap!',
          data: buildViewFromEscapeTowerStore(store, effectiveStudentId, isTeacher, kelompok),
        };
      }
      if (prog.cooldown_sampai_ms && now < prog.cooldown_sampai_ms && (!ok || !json?.success)) {
        const waitSec = Math.ceil((prog.cooldown_sampai_ms - now) / 1000);
        return {
          success: false,
          error: `⏳ Penalti waktu aktif! Tunggu ${waitSec} detik sebelum mencoba lagi.`,
          data: buildViewFromEscapeTowerStore(store, effectiveStudentId, isTeacher, kelompok),
        };
      }

      const currentFloorNum = Math.min(5, prog.lantai_sekarang) as EscapeFloorNumber;
      const floorConfig = store.konfigurasi.find((f) => f.nomor_lantai === currentFloorNum);
      if (floorConfig) {
        const isCorrect =
          ok && json?.hasil ? json.hasil === 'benar' : checkEscapeFloorAnswer(floorConfig, String(jawaban || ''));
        if (isCorrect) {
          answerResult = 'benar';
          prog.lantai_sekarang = Math.min(6, currentFloorNum + 1) as 1 | 2 | 3 | 4 | 5 | 6;
          prog.draft_jawaban = '';
          prog.cooldown_sampai_ms = null;
          prog.terakhir_dijawab_oleh = effectiveStudentName;
          prog.status_jawaban_terakhir = 'benar';

          Object.values(store.towerPlayers).forEach((tp) => {
            if (tp.kelompok === kelompok) {
              tp.lantai_sekarang = prog.lantai_sekarang;
            }
          });

          if (prog.lantai_sekarang === 6) {
            prog.waktu_selesai = nowStr;
            const startMs = store.sesi.waktu_mulai_ms || now;
            const rawElapsedSec = Math.max(
              1,
              Math.round((now - startMs - store.sesi.total_durasi_jeda_ms) / 1000)
            );
            prog.durasi_detik = rawElapsedSec + prog.penalti_waktu_detik;
            prog.pesan_jawaban_terakhir = `🎉 LUAR BIASA! ${effectiveStudentName} membuka PINTU ATAP untuk Kelompok ${kelompok}!`;
            answerFeedback = prog.pesan_jawaban_terakhir;
          } else {
            prog.pesan_jawaban_terakhir = `✅ Jawaban Benar oleh ${effectiveStudentName}! Pintu Lift Lantai ${prog.lantai_sekarang} terbuka!`;
            answerFeedback = prog.pesan_jawaban_terakhir;
          }
          recalculateEscapeTowerScoresInStore(store);
        } else {
          answerResult = 'salah';
          const penaltiSec = store.sesi.penalti_waktu_salah_detik || 5;
          prog.jumlah_salah += 1;
          prog.penalti_waktu_detik += penaltiSec;
          prog.cooldown_sampai_ms = now + penaltiSec * 1000;
          prog.terakhir_dijawab_oleh = effectiveStudentName;
          prog.status_jawaban_terakhir = 'salah';
          prog.pesan_jawaban_terakhir = `❌ Jawaban belum tepat, coba lagi! (Penalti +${penaltiSec} detik & -${store.sesi.pengurang_salah} poin)`;
          answerFeedback = prog.pesan_jawaban_terakhir;
          recalculateEscapeTowerScoresInStore(store);
        }
      }
    } else if (actionType === 'send_group_chat') {
      const text = String(chatContent || '').trim().slice(0, 160);
      if (text) {
        const d = new Date();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        store.groupChats.push({
          id: `echat-${now}-${Math.random().toString(36).slice(2, 6)}`,
          kelompok,
          senderId: effectiveStudentId,
          senderName: effectiveStudentName,
          content: text,
          timestamp: `${hh}.${mm}`,
          createdAt: now,
        });
        if (store.groupChats.length > 200) {
          store.groupChats = store.groupChats.slice(-200);
        }
      }
    }

    const saved = saveLocalEscapeTowerStore(store);

    if (ok && json?.success && json.data) {
      return {
        success: true,
        hasil: json.hasil ?? answerResult,
        message: json.message || answerFeedback,
        data: json.data as EscapeTowerState,
        groupProgress: saved.progres[kelompok],
      };
    }

    return {
      success: true,
      hasil: answerResult,
      message: answerFeedback,
      data: buildViewFromEscapeTowerStore(saved, effectiveStudentId, isTeacher, kelompok),
      groupProgress: saved.progres[kelompok],
    };
  },

  mergeIncomingMeshPayload(
    payload: any,
    effectiveStudentId: string,
    isTeacher: boolean,
    selectedGroup: MysteryGroupNumber
  ): EscapeTowerState {
    const store = loadLocalEscapeTowerStore();
    const now = Date.now();

    if (payload.canonicalStore) {
      const inc = payload.canonicalStore as CanonicalEscapeTowerStore;
      if (inc.sesi) store.sesi = inc.sesi;
      if (Array.isArray(inc.konfigurasi) && inc.konfigurasi.length === 5) {
        store.konfigurasi = inc.konfigurasi;
      }
      if (inc.progres) store.progres = inc.progres;
      if (inc.skor) store.skor = inc.skor;
      if (inc.studentGroupMap) {
        store.studentGroupMap = { ...store.studentGroupMap, ...inc.studentGroupMap };
      }
      if (inc.winningGroups) store.winningGroups = inc.winningGroups;
    }

    if (payload.groupProgress && payload.kelompok) {
      const grp = Number(payload.kelompok) as MysteryGroupNumber;
      if (grp >= 1 && grp <= 8) {
        store.progres[grp] = {
          ...store.progres[grp],
          ...payload.groupProgress,
        };
      }
    }

    if (payload.studentId && payload.studentName) {
      const pid = String(payload.studentId);
      const pIsTeacher = Boolean(payload.isTeacher);
      const nextGrp: MysteryGroupNumber | null = pIsTeacher
        ? null
        : ((Number(payload.kelompok) || store.towerPlayers[pid]?.kelompok || 1) as MysteryGroupNumber);

      store.towerPlayers[pid] = {
        studentId: pid,
        studentName: String(payload.studentName),
        className: String(payload.className || (pIsTeacher ? 'Dewan Guru' : 'X DKV')),
        gender: payload.gender === 'P' ? 'P' : 'L',
        isTeacher: pIsTeacher,
        kelompok: nextGrp,
        lantai_sekarang:
          payload.lantai_sekarang ||
          (nextGrp ? store.progres[nextGrp]?.lantai_sekarang : 1) ||
          1,
        lastSeen: now,
      };

      if (!pIsTeacher && nextGrp) {
        store.studentGroupMap[pid] = nextGrp;
        for (let g = 1; g <= 8; g++) {
          store.groupMembers[g] = (store.groupMembers[g] || []).filter((m) => m.studentId !== pid);
        }
        store.groupMembers[nextGrp].push({
          studentId: pid,
          studentName: String(payload.studentName),
          className: String(payload.className || 'X DKV'),
          gender: payload.gender === 'P' ? 'P' : 'L',
        });

        if (payload.actionType === 'send_group_chat' && payload.chatContent) {
          const text = String(payload.chatContent).trim().slice(0, 160);
          if (text) {
            const d = new Date();
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            store.groupChats.push({
              id: `echat-${now}-${Math.random().toString(36).slice(2, 6)}`,
              kelompok: nextGrp,
              senderId: pid,
              senderName: String(payload.studentName),
              content: text,
              timestamp: `${hh}.${mm}`,
              createdAt: now,
            });
          }
        }
      }
    }

    recalculateEscapeTowerScoresInStore(store);
    const saved = saveLocalEscapeTowerStore(store);
    return buildViewFromEscapeTowerStore(saved, effectiveStudentId, isTeacher, selectedGroup);
  },
};
