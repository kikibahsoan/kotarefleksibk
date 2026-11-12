import {
  Student,
  MysteryArenaState,
  MysteryGroupNumber,
  MysteryHouseNumber,
  MysteryArenaPlayerPresence,
  GameRondeRow,
  GamePilihanRow,
  GameSkorRow,
  MysteryArenaGroupChatMsg,
} from '../types/index.ts';
import { StorageService } from './storage.ts';

const MYSTERY_ARENA_STORE_KEY = 'kota_refleksi_mystery_arena_canonical_v1';

export interface CanonicalMysteryArenaStore {
  version: number;
  currentRound: GameRondeRow & { rumah_benar: MysteryHouseNumber };
  choices: Record<number, GamePilihanRow>;
  scores: GameSkorRow[];
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
  arenaPlayers: Record<string, MysteryArenaPlayerPresence>;
  groupChats: MysteryArenaGroupChatMsg[];
  roundHistory: Array<GameRondeRow & { rumah_benar: MysteryHouseNumber | null }>;
  lastAwardedRoundId: string | null;
  winningGroups: MysteryGroupNumber[];
}

function getGroupGatheringCoords(
  kelompok: number | null,
  memberIndex = 0
): { wx: number; wy: number } {
  if (!kelompok || kelompok < 1 || kelompok > 8) {
    return { wx: 0.5, wy: 0.65 };
  }
  const idx = kelompok - 1;
  const col = idx % 4;
  const row = Math.floor(idx / 4);
  const x = 0.2 + col * 0.2 + (row % 2 === 1 ? 0.02 : -0.02) + ((memberIndex % 3) - 1) * 0.015;
  const y = 0.58 + row * 0.13 + (Math.floor(memberIndex / 3) % 2) * 0.015;
  return { wx: x, wy: y };
}

function getMysteryHouseCoords(houseNum: number, memberIndex = 0): { wx: number; wy: number } {
  const clamped = Math.max(1, Math.min(5, houseNum));
  const idx = clamped - 1;
  const x = 0.14 + idx * 0.18 + ((memberIndex % 3) - 1) * 0.012;
  const y = 0.34 + (Math.floor(memberIndex / 3) % 2) * 0.012;
  return { wx: x, wy: y };
}

export function createDefaultMysteryArenaStore(): CanonicalMysteryArenaStore {
  const nowStr = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const roundId = 'ronde-1';
  const choices: Record<number, GamePilihanRow> = {};
  const scores: GameSkorRow[] = [];
  const groupMembers: CanonicalMysteryArenaStore['groupMembers'] = {};

  for (let g = 1; g <= 8; g++) {
    const grp = g as MysteryGroupNumber;
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
    version: 1,
    currentRound: {
      id_ronde: roundId,
      soal: 'Prinsip desain grafis yang mengatur urutan pandangan mata pembaca dari judul utama menuju informasi pendukung disebut...\n[Rumah 1: Distorsi] [Rumah 2: Hierarki Visual] [Rumah 3: Gradasi] [Rumah 4: Saturasi] [Rumah 5: Tekstur]',
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

export function loadLocalMysteryArenaStore(): CanonicalMysteryArenaStore {
  try {
    const raw = localStorage.getItem(MYSTERY_ARENA_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.currentRound && Array.isArray(parsed.scores)) {
        const def = createDefaultMysteryArenaStore();
        return {
          ...def,
          ...parsed,
          currentRound: {
            ...def.currentRound,
            ...parsed.currentRound,
            rumah_benar: (Number(parsed.currentRound.rumah_benar) || 2) as MysteryHouseNumber,
          },
          choices: parsed.choices || def.choices,
          scores: Array.isArray(parsed.scores) && parsed.scores.length === 8 ? parsed.scores : def.scores,
          studentGroupMap: parsed.studentGroupMap || {},
          groupMembers: parsed.groupMembers || def.groupMembers,
          arenaPlayers: parsed.arenaPlayers || {},
          groupChats: Array.isArray(parsed.groupChats) ? parsed.groupChats : [],
          roundHistory: Array.isArray(parsed.roundHistory) ? parsed.roundHistory : [],
          winningGroups: Array.isArray(parsed.winningGroups) ? parsed.winningGroups : [],
        };
      }
    }
  } catch {}
  return createDefaultMysteryArenaStore();
}

export function saveLocalMysteryArenaStore(
  store: CanonicalMysteryArenaStore
): CanonicalMysteryArenaStore {
  try {
    localStorage.setItem(MYSTERY_ARENA_STORE_KEY, JSON.stringify(store));
  } catch {}
  return store;
}

export function buildViewFromMysteryArenaStore(
  store: CanonicalMysteryArenaStore,
  viewerId: string,
  isVerifiedTeacher: boolean,
  viewerGroup?: MysteryGroupNumber | null
): MysteryArenaState {
  const now = Date.now();
  // Auto-advance timer if expired while 'buka'
  if (
    store.currentRound.status === 'buka' &&
    store.currentRound.timer_berakhir_ms &&
    now >= store.currentRound.timer_berakhir_ms
  ) {
    store.currentRound.status = 'tutup';
    store.currentRound.timer_berakhir_ms = null;
    saveLocalMysteryArenaStore(store);
  }

  const round = store.currentRound;
  const canSeeCorrectHouse = isVerifiedTeacher || round.status === 'meledak';

  const sanitizedRound: GameRondeRow = {
    ...round,
    rumah_benar: canSeeCorrectHouse ? round.rumah_benar : null,
  };

  Object.values(store.arenaPlayers).forEach((ap) => {
    if (!ap.isTeacher && ap.kelompok && ap.kelompok >= 1 && ap.kelompok <= 8) {
      const grp = ap.kelompok;
      store.studentGroupMap[ap.studentId] = grp;
      const list = store.groupMembers[grp] || [];
      if (!list.some((m) => m.studentId === ap.studentId)) {
        list.push({
          studentId: ap.studentId,
          studentName: ap.studentName,
          className: ap.className || 'X DKV',
          gender: ap.gender === 'P' ? 'P' : 'L',
        });
        store.groupMembers[grp] = list;
      }
    }
  });

  const enrichedGroupMembers: MysteryArenaState['groupMembers'] = {};
  for (let g = 1; g <= 8; g++) {
    const members = store.groupMembers[g] || [];
    enrichedGroupMembers[g] = members.map((m) => ({
      ...m,
      isOnline: Boolean(
        store.arenaPlayers[m.studentId] ||
          Object.values(store.arenaPlayers).some(
            (ap) => ap.studentName.trim().toLowerCase() === m.studentName.trim().toLowerCase()
          )
      ),
    }));
  }

  const effectiveGroup =
    viewerGroup || (viewerId ? store.studentGroupMap[viewerId] : null) || null;

  const filteredChats = isVerifiedTeacher
    ? store.groupChats.slice(-80)
    : effectiveGroup
    ? store.groupChats.filter((c) => c.kelompok === effectiveGroup).slice(-50)
    : [];

  return {
    currentRound: sanitizedRound,
    choices: store.choices,
    scores: store.scores,
    studentGroupMap: store.studentGroupMap,
    groupMembers: enrichedGroupMembers,
    arenaPlayers: Object.values(store.arenaPlayers),
    groupChats: filteredChats,
    roundHistory: store.roundHistory.slice(0, 15).map((r) => ({
      ...r,
      rumah_benar: isVerifiedTeacher || r.status === 'meledak' ? r.rumah_benar : null,
    })),
    lastAwardedRoundId: store.lastAwardedRoundId,
    winningGroups: round.status === 'meledak' ? store.winningGroups : [],
    serverTime: now,
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

export const MysteryArenaEngine = {
  getInitialHydratedState(
    student: Student,
    effectiveStudentId: string,
    effectiveStudentName: string,
    selectedGroup: MysteryGroupNumber
  ): MysteryArenaState {
    const store = loadLocalMysteryArenaStore();
    const now = Date.now();
    const isTeacher = Boolean(student.isTeacher);

    if (isTeacher) {
      store.arenaPlayers[effectiveStudentId] = {
        studentId: effectiveStudentId,
        studentName: effectiveStudentName,
        className: student.className || 'Dewan Guru',
        gender: student.gender === 'P' ? 'P' : 'L',
        isTeacher: true,
        kelompok: null,
        arenaWx: 0.5,
        arenaWy: 0.86,
        rumah_dipilih: null,
        lastSeen: now,
      };
    } else {
      const grp = store.studentGroupMap[effectiveStudentId] || selectedGroup || 1;
      store.studentGroupMap[effectiveStudentId] = grp;
      for (let g = 1; g <= 8; g++) {
        store.groupMembers[g] = (store.groupMembers[g] || []).filter(
          (m) => m.studentId !== effectiveStudentId
        );
      }
      store.groupMembers[grp].push({
        studentId: effectiveStudentId,
        studentName: effectiveStudentName,
        className: student.className || 'X DKV',
        gender: student.gender === 'P' ? 'P' : 'L',
      });
      const currentHouse = store.choices[grp]?.rumah_dipilih || null;
      const coords = currentHouse
        ? getMysteryHouseCoords(currentHouse, 0)
        : getGroupGatheringCoords(grp, 0);
      store.arenaPlayers[effectiveStudentId] = {
        studentId: effectiveStudentId,
        studentName: effectiveStudentName,
        className: student.className || 'X DKV',
        gender: student.gender === 'P' ? 'P' : 'L',
        isTeacher: false,
        kelompok: grp,
        arenaWx: coords.wx,
        arenaWy: coords.wy,
        rumah_dipilih: currentHouse,
        lastSeen: now,
      };
    }

    saveLocalMysteryArenaStore(store);
    return buildViewFromMysteryArenaStore(store, effectiveStudentId, isTeacher, selectedGroup);
  },

  async fetchState(params: {
    student: Student;
    effectiveStudentId: string;
    effectiveStudentName: string;
    selectedGroup: MysteryGroupNumber;
  }): Promise<{
    data: MysteryArenaState;
    isVerifiedTeacher: boolean;
    source: 'server' | 'local';
  }> {
    const { student, effectiveStudentId, effectiveStudentName, selectedGroup } = params;
    const isTeacher = Boolean(student.isTeacher);
    const query = new URLSearchParams({
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      className: student.className || 'X DKV',
      gender: student.gender === 'P' ? 'P' : 'L',
      isTeacher: isTeacher ? 'true' : 'false',
      studentNumber: student.studentNumber || '',
      kelompok: String(selectedGroup),
      _t: String(Date.now()),
    });

    const { ok, json } = await fetchJsonSafe(`/api/mystery-arena/state?${query.toString()}`, {
      cache: 'no-store',
    });

    if (ok && json?.data) {
      // Sync incoming server round & scores into local canonical store as well
      const store = loadLocalMysteryArenaStore();
      const srv: MysteryArenaState = json.data;
      if (srv.currentRound) {
        store.currentRound = {
          ...store.currentRound,
          ...srv.currentRound,
          rumah_benar:
            (srv.currentRound.rumah_benar as MysteryHouseNumber) ||
            store.currentRound.rumah_benar ||
            2,
        };
      }
      if (srv.choices) store.choices = srv.choices;
      if (Array.isArray(srv.scores) && srv.scores.length === 8) store.scores = srv.scores;
      if (srv.studentGroupMap) {
        store.studentGroupMap = { ...store.studentGroupMap, ...srv.studentGroupMap };
      }
      if (Array.isArray(srv.arenaPlayers)) {
        srv.arenaPlayers.forEach((ap) => {
          store.arenaPlayers[ap.studentId] = ap;
        });
      }
      saveLocalMysteryArenaStore(store);

      return {
        data: srv,
        isVerifiedTeacher: Boolean(json.isVerifiedTeacher ?? isTeacher),
        source: 'server',
      };
    }

    const store = loadLocalMysteryArenaStore();
    if (store.arenaPlayers[effectiveStudentId]) {
      store.arenaPlayers[effectiveStudentId].lastSeen = Date.now();
      saveLocalMysteryArenaStore(store);
    }
    return {
      data: buildViewFromMysteryArenaStore(store, effectiveStudentId, isTeacher, selectedGroup),
      isVerifiedTeacher: isTeacher,
      source: 'local',
    };
  },

  async executeTeacherAction(params: {
    student: Student;
    actionType:
      | 'start_round'
      | 'open_choices'
      | 'close_choices'
      | 'detonate'
      | 'next_round'
      | 'reset_arena'
      | 'assign_student_group'
      | 'reset_scores';
    soal: string;
    rumah_benar: MysteryHouseNumber;
    poin_benar: number;
    timer_detik: number;
    extraPayload?: Record<string, any>;
  }): Promise<{
    success: boolean;
    error?: string;
    data: MysteryArenaState;
    canonicalStore: CanonicalMysteryArenaStore;
  }> {
    const {
      student,
      actionType,
      soal,
      rumah_benar,
      poin_benar,
      timer_detik,
      extraPayload = {},
    } = params;

    const reqBody = {
      teacherId: student.id,
      teacherName: student.name,
      isTeacher: student.isTeacher,
      studentNumber: student.studentNumber,
      actionType,
      soal,
      rumah_benar,
      poin_benar,
      timer_detik,
      ...extraPayload,
    };

    const { ok, json } = await fetchJsonSafe('/api/mystery-arena/teacher-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
    });

    const store = loadLocalMysteryArenaStore();
    const now = Date.now();
    const nowStr = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    if (actionType === 'start_round') {
      const cleanSoal = String(soal || '').trim() || store.currentRound.soal;
      const houseNum = Math.max(1, Math.min(5, Number(rumah_benar) || 2)) as MysteryHouseNumber;
      const pointsVal = Math.max(1, Math.min(500, Number(poin_benar) || 20));
      const timerSec = Math.max(0, Math.min(600, Number(timer_detik) || 0));
      const nextRoundId = `ronde-${Date.now().toString(36)}`;
      const initialStatus = extraPayload.openImmediately ? 'buka' : 'menunggu';

      if (store.currentRound.status === 'meledak') {
        store.roundHistory = [
          { ...store.currentRound },
          ...store.roundHistory.filter((r) => r.id_ronde !== store.currentRound.id_ronde),
        ].slice(0, 20);
      }

      store.currentRound = {
        id_ronde: nextRoundId,
        soal: cleanSoal,
        rumah_benar: houseNum,
        status: initialStatus,
        waktu: nowStr,
        poin_benar: pointsVal,
        timer_detik: timerSec,
        timer_berakhir_ms: initialStatus === 'buka' && timerSec > 0 ? now + timerSec * 1000 : null,
        ledakan_mulai_ms: null,
        guru_pembuat: student.name || 'Guru DKV',
      };

      for (let g = 1; g <= 8; g++) {
        const grp = g as MysteryGroupNumber;
        store.choices[grp] = {
          id_ronde: nextRoundId,
          kelompok: grp,
          rumah_dipilih: null,
          waktu: nowStr,
          diwakili_oleh: '',
        };
      }

      Object.values(store.arenaPlayers).forEach((p, idx) => {
        p.rumah_dipilih = null;
        if (!p.isTeacher) {
          const coords = getGroupGatheringCoords(p.kelompok, idx);
          p.arenaWx = coords.wx;
          p.arenaWy = coords.wy;
        }
      });

      store.winningGroups = [];
    } else if (actionType === 'open_choices') {
      const timerSec =
        typeof timer_detik === 'number'
          ? Math.max(0, Math.min(600, timer_detik))
          : store.currentRound.timer_detik;
      store.currentRound.timer_detik = timerSec;
      store.currentRound.status = 'buka';
      store.currentRound.timer_berakhir_ms = timerSec > 0 ? now + timerSec * 1000 : null;
      store.currentRound.ledakan_mulai_ms = null;
      store.currentRound.waktu = nowStr;
    } else if (actionType === 'close_choices') {
      store.currentRound.status = 'tutup';
      store.currentRound.timer_berakhir_ms = null;
      store.currentRound.waktu = nowStr;
    } else if (actionType === 'detonate') {
      if (store.currentRound.status !== 'tutup' && (!ok || !json?.success)) {
        return {
          success: false,
          error: 'Tombol LEDAKKAN hanya dapat diaktifkan setelah pilihan ditutup!',
          data: buildViewFromMysteryArenaStore(store, student.id, true),
          canonicalStore: store,
        };
      }
      store.currentRound.status = 'meledak';
      store.currentRound.ledakan_mulai_ms = now;
      store.currentRound.waktu = nowStr;

      const correctHouse = store.currentRound.rumah_benar;
      const rewardPts = store.currentRound.poin_benar || 20;
      const winners: MysteryGroupNumber[] = [];

      if (store.lastAwardedRoundId !== store.currentRound.id_ronde) {
        for (let g = 1; g <= 8; g++) {
          const grp = g as MysteryGroupNumber;
          const choice = store.choices[grp];
          if (choice && choice.rumah_dipilih === correctHouse) {
            winners.push(grp);
            const scoreRow = store.scores.find((s) => s.kelompok === grp);
            if (scoreRow) {
              scoreRow.total_poin += rewardPts;
              scoreRow.ronde_menang = (scoreRow.ronde_menang || 0) + 1;
              scoreRow.waktu_update = nowStr;
            }
          }
        }
        store.lastAwardedRoundId = store.currentRound.id_ronde;
      }

      store.winningGroups = winners;
      Object.values(store.arenaPlayers).forEach((p, idx) => {
        if (!p.isTeacher && p.rumah_dipilih && p.rumah_dipilih !== correctHouse) {
          const coords = getGroupGatheringCoords(p.kelompok, idx);
          p.arenaWx = coords.wx;
          p.arenaWy = coords.wy;
        }
      });
    } else if (actionType === 'next_round' || actionType === 'reset_arena') {
      if (store.currentRound.status === 'meledak') {
        store.roundHistory = [
          { ...store.currentRound },
          ...store.roundHistory.filter((r) => r.id_ronde !== store.currentRound.id_ronde),
        ].slice(0, 20);
      }
      const nextNum = store.roundHistory.length + 1;
      const nextRoundId = `ronde-${nextNum}-${Date.now().toString(36).slice(-3)}`;

      store.currentRound = {
        ...store.currentRound,
        id_ronde: nextRoundId,
        status: 'menunggu',
        timer_berakhir_ms: null,
        ledakan_mulai_ms: null,
        waktu: nowStr,
      };

      for (let g = 1; g <= 8; g++) {
        const grp = g as MysteryGroupNumber;
        store.choices[grp] = {
          id_ronde: nextRoundId,
          kelompok: grp,
          rumah_dipilih: null,
          waktu: nowStr,
          diwakili_oleh: '',
        };
      }

      Object.values(store.arenaPlayers).forEach((p, idx) => {
        p.rumah_dipilih = null;
        if (!p.isTeacher) {
          const coords = getGroupGatheringCoords(p.kelompok, idx);
          p.arenaWx = coords.wx;
          p.arenaWy = coords.wy;
        }
      });
      store.winningGroups = [];
    } else if (actionType === 'assign_student_group') {
      const sid = String(extraPayload.targetStudentId || '').trim();
      const grp = Math.max(1, Math.min(8, Number(extraPayload.targetKelompok) || 1)) as MysteryGroupNumber;
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
        if (store.arenaPlayers[sid]) {
          store.arenaPlayers[sid].kelompok = grp;
          store.arenaPlayers[sid].rumah_dipilih = store.choices[grp]?.rumah_dipilih || null;
        }
      }
    } else if (actionType === 'reset_scores') {
      for (let g = 1; g <= 8; g++) {
        const grp = g as MysteryGroupNumber;
        const row = store.scores.find((s) => s.kelompok === grp);
        if (row) {
          row.total_poin = 0;
          row.ronde_menang = 0;
          row.waktu_update = nowStr;
        }
      }
      store.lastAwardedRoundId = null;
    }

    const saved = saveLocalMysteryArenaStore(store);

    if (ok && json?.success && json.data) {
      return {
        success: true,
        data: json.data as MysteryArenaState,
        canonicalStore: saved,
      };
    }

    return {
      success: true,
      data: buildViewFromMysteryArenaStore(saved, student.id, true),
      canonicalStore: saved,
    };
  },

  async executeStudentAction(params: {
    student: Student;
    effectiveStudentId: string;
    effectiveStudentName: string;
    actionType: 'join_group' | 'select_house' | 'send_group_chat';
    kelompok: MysteryGroupNumber;
    rumah_dipilih?: MysteryHouseNumber | null;
    chatContent?: string;
  }): Promise<{
    success: boolean;
    error?: string;
    data: MysteryArenaState;
  }> {
    const {
      student,
      effectiveStudentId,
      effectiveStudentName,
      actionType,
      kelompok,
      rumah_dipilih,
      chatContent,
    } = params;

    const { ok, json } = await fetchJsonSafe('/api/mystery-arena/student-action', {
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
        rumah_dipilih,
        chatContent,
      }),
    });

    const store = loadLocalMysteryArenaStore();
    const now = Date.now();
    const nowStr = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const isTeacher = Boolean(student.isTeacher);
    const sGender: 'L' | 'P' = student.gender === 'P' ? 'P' : 'L';
    const sClass = student.className || 'X DKV';

    if (!store.arenaPlayers[effectiveStudentId]) {
      const coords = isTeacher
        ? { wx: 0.5, wy: 0.86 }
        : getGroupGatheringCoords(kelompok, 0);
      store.arenaPlayers[effectiveStudentId] = {
        studentId: effectiveStudentId,
        studentName: effectiveStudentName,
        className: sClass,
        gender: sGender,
        isTeacher,
        kelompok: isTeacher ? null : kelompok,
        arenaWx: coords.wx,
        arenaWy: coords.wy,
        rumah_dipilih: isTeacher ? null : store.choices[kelompok]?.rumah_dipilih || null,
        lastSeen: now,
      };
    } else {
      store.arenaPlayers[effectiveStudentId].lastSeen = now;
      store.arenaPlayers[effectiveStudentId].studentName = effectiveStudentName;
    }

    const player = store.arenaPlayers[effectiveStudentId];

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
        const currentHouse = store.choices[kelompok]?.rumah_dipilih || null;
        player.rumah_dipilih = currentHouse;
        const coords = currentHouse
          ? getMysteryHouseCoords(currentHouse, 0)
          : getGroupGatheringCoords(kelompok, 0);
        player.arenaWx = coords.wx;
        player.arenaWy = coords.wy;
      }
    } else if (actionType === 'select_house') {
      if (store.currentRound.status !== 'buka' && (!ok || !json?.success)) {
        return {
          success: false,
          error:
            store.currentRound.status === 'tutup'
              ? '🔒 Pilihan sudah ditutup oleh Guru! Posisi kelompok terkunci.'
              : '⏳ Pilihan rumah belum dibuka oleh Guru.',
          data: buildViewFromMysteryArenaStore(store, effectiveStudentId, isTeacher, kelompok),
        };
      }
      const houseNum =
        rumah_dipilih === null || rumah_dipilih === undefined
          ? null
          : (Math.max(1, Math.min(5, Number(rumah_dipilih))) as MysteryHouseNumber);

      store.choices[kelompok] = {
        id_ronde: store.currentRound.id_ronde,
        kelompok,
        rumah_dipilih: houseNum,
        waktu: nowStr,
        diwakili_oleh: effectiveStudentName,
      };

      Object.values(store.arenaPlayers).forEach((p, idx) => {
        if (p.kelompok === kelompok && !p.isTeacher) {
          p.rumah_dipilih = houseNum;
          const coords = houseNum
            ? getMysteryHouseCoords(houseNum, idx)
            : getGroupGatheringCoords(kelompok, idx);
          p.arenaWx = coords.wx;
          p.arenaWy = coords.wy;
        }
      });
    } else if (actionType === 'send_group_chat') {
      const text = String(chatContent || '').trim().slice(0, 160);
      if (text) {
        const d = new Date();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        store.groupChats.push({
          id: `gchat-${now}-${Math.random().toString(36).slice(2, 6)}`,
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

    const saved = saveLocalMysteryArenaStore(store);

    if (ok && json?.success && json.data) {
      return {
        success: true,
        data: json.data as MysteryArenaState,
      };
    }

    return {
      success: true,
      data: buildViewFromMysteryArenaStore(saved, effectiveStudentId, isTeacher, kelompok),
    };
  },

  mergeIncomingMeshPayload(
    payload: any,
    effectiveStudentId: string,
    isTeacher: boolean,
    selectedGroup: MysteryGroupNumber
  ): MysteryArenaState {
    const store = loadLocalMysteryArenaStore();
    const now = Date.now();
    const nowStr = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    if (payload.eventType === 'teacher_state_broadcast') {
      if (payload.canonicalStore) {
        const inc = payload.canonicalStore as CanonicalMysteryArenaStore;
        store.currentRound = {
          ...store.currentRound,
          ...inc.currentRound,
        };
        store.choices = inc.choices || store.choices;
        store.scores = inc.scores || store.scores;
        store.studentGroupMap = { ...store.studentGroupMap, ...(inc.studentGroupMap || {}) };
        store.winningGroups = inc.winningGroups || [];
        store.lastAwardedRoundId = inc.lastAwardedRoundId ?? store.lastAwardedRoundId;
      } else if (payload.sanitizedState) {
        const inc = payload.sanitizedState as MysteryArenaState;
        store.currentRound = {
          ...store.currentRound,
          ...inc.currentRound,
          rumah_benar:
            (inc.currentRound.rumah_benar as MysteryHouseNumber) ||
            store.currentRound.rumah_benar ||
            2,
        };
        if (inc.choices) store.choices = inc.choices;
        if (inc.scores) store.scores = inc.scores;
        if (inc.studentGroupMap) {
          store.studentGroupMap = { ...store.studentGroupMap, ...inc.studentGroupMap };
        }
        if (inc.winningGroups) store.winningGroups = inc.winningGroups;
      }
    } else if (
      payload.eventType === 'participant_presence' ||
      payload.eventType === 'student_action'
    ) {
      const pid = String(payload.studentId || '').trim();
      if (pid) {
        const pIsTeacher = Boolean(payload.isTeacher);
        const pGroup = pIsTeacher
          ? null
          : ((Math.max(1, Math.min(8, Number(payload.kelompok) || 1)) as MysteryGroupNumber) || 1);
        const pHouse =
          payload.rumah_dipilih &&
          Number(payload.rumah_dipilih) >= 1 &&
          Number(payload.rumah_dipilih) <= 5
            ? (Number(payload.rumah_dipilih) as MysteryHouseNumber)
            : null;

        store.arenaPlayers[pid] = {
          studentId: pid,
          studentName: String(payload.studentName || 'Siswa DKV'),
          className: String(payload.className || 'X DKV'),
          gender: payload.gender === 'P' ? 'P' : 'L',
          isTeacher: pIsTeacher,
          kelompok: pGroup,
          arenaWx: typeof payload.arenaWx === 'number' ? payload.arenaWx : 0.5,
          arenaWy: typeof payload.arenaWy === 'number' ? payload.arenaWy : 0.65,
          rumah_dipilih: pHouse,
          lastSeen: now,
        };

        if (!pIsTeacher && pGroup) {
          store.studentGroupMap[pid] = pGroup;
          for (let g = 1; g <= 8; g++) {
            store.groupMembers[g] = (store.groupMembers[g] || []).filter(
              (m) => m.studentId !== pid
            );
          }
          store.groupMembers[pGroup].push({
            studentId: pid,
            studentName: String(payload.studentName || 'Siswa DKV'),
            className: String(payload.className || 'X DKV'),
            gender: payload.gender === 'P' ? 'P' : 'L',
          });

          if (payload.actionType === 'select_house' && pHouse) {
            store.choices[pGroup] = {
              id_ronde: store.currentRound.id_ronde,
              kelompok: pGroup,
              rumah_dipilih: pHouse,
              waktu: nowStr,
              diwakili_oleh: String(payload.studentName || 'Siswa DKV'),
            };
          } else if (payload.actionType === 'send_group_chat' && payload.chatContent) {
            const text = String(payload.chatContent).trim().slice(0, 160);
            if (text) {
              const d = new Date();
              const hh = String(d.getHours()).padStart(2, '0');
              const mm = String(d.getMinutes()).padStart(2, '0');
              store.groupChats.push({
                id: `gchat-${now}-${Math.random().toString(36).slice(2, 6)}`,
                kelompok: pGroup,
                senderId: pid,
                senderName: String(payload.studentName || 'Siswa DKV'),
                content: text,
                timestamp: `${hh}.${mm}`,
                createdAt: now,
              });
            }
          }
        }
      }
    }

    const saved = saveLocalMysteryArenaStore(store);
    return buildViewFromMysteryArenaStore(saved, effectiveStudentId, isTeacher, selectedGroup);
  },
};
