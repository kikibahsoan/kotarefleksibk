import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Flame,
  ShieldCheck,
  Users,
  Trophy,
  MessageSquare,
  Send,
  Timer,
  Lock,
  Unlock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Home,
  FileSpreadsheet,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Student,
  MysteryArenaState,
  MysteryGroupNumber,
  MysteryHouseNumber,
  MysteryArenaPlayerPresence,
  GamePilihanRow,
} from '../../types/index.ts';
import { StorageService } from '../../utils/storage.ts';
import { sounds } from '../../utils/audio.ts';
import { RealtimePresenceMesh } from '../../utils/realtimePresenceMesh.ts';
import { MysteryArenaEngine } from '../../utils/mysteryArenaEngine.ts';

interface ArenaRumahMisteriModalProps {
  onClose: () => void;
  student: Student;
  onAddXp?: (amount: number, reason: string) => void;
}

const GROUP_NUMBERS: MysteryGroupNumber[] = [1, 2, 3, 4, 5, 6, 7, 8];
const HOUSE_NUMBERS: MysteryHouseNumber[] = [1, 2, 3, 4, 5];

const GROUP_COLORS: Record<MysteryGroupNumber, { bg: string; border: string; text: string; hex: string }> = {
  1: { bg: 'bg-sky-500/20', border: 'border-sky-400', text: 'text-sky-300', hex: '#38bdf8' },
  2: { bg: 'bg-emerald-500/20', border: 'border-emerald-400', text: 'text-emerald-300', hex: '#34d399' },
  3: { bg: 'bg-amber-500/20', border: 'border-amber-400', text: 'text-amber-300', hex: '#fbbf24' },
  4: { bg: 'bg-rose-500/20', border: 'border-rose-400', text: 'text-rose-300', hex: '#fb7185' },
  5: { bg: 'bg-violet-500/20', border: 'border-violet-400', text: 'text-violet-300', hex: '#a78bfa' },
  6: { bg: 'bg-cyan-500/20', border: 'border-cyan-400', text: 'text-cyan-300', hex: '#22d3ee' },
  7: { bg: 'bg-orange-500/20', border: 'border-orange-400', text: 'text-orange-300', hex: '#fb923c' },
  8: { bg: 'bg-pink-500/20', border: 'border-pink-400', text: 'text-pink-300', hex: '#f472b6' },
};

const HOUSE_META: Record<
  MysteryHouseNumber,
  { name: string; roofHex: string; roofDarkHex: string; wallHex: string; doorHex: string; badgeBg: string }
> = {
  1: {
    name: 'Rumah 1',
    roofHex: '#ef4444',
    roofDarkHex: '#b91c1c',
    wallHex: '#fef2f2',
    doorHex: '#7f1d1d',
    badgeBg: 'from-rose-600 to-red-700',
  },
  2: {
    name: 'Rumah 2',
    roofHex: '#f59e0b',
    roofDarkHex: '#b45309',
    wallHex: '#fffbeb',
    doorHex: '#78350f',
    badgeBg: 'from-amber-500 to-orange-600',
  },
  3: {
    name: 'Rumah 3',
    roofHex: '#10b981',
    roofDarkHex: '#047857',
    wallHex: '#ecfdf5',
    doorHex: '#064e3b',
    badgeBg: 'from-emerald-500 to-teal-700',
  },
  4: {
    name: 'Rumah 4',
    roofHex: '#3b82f6',
    roofDarkHex: '#1d4ed8',
    wallHex: '#eff6ff',
    doorHex: '#1e3a8a',
    badgeBg: 'from-sky-500 to-blue-700',
  },
  5: {
    name: 'Rumah 5',
    roofHex: '#8b5cf6',
    roofDarkHex: '#6d28d9',
    wallHex: '#f5f3ff',
    doorHex: '#4c1d95',
    badgeBg: 'from-violet-500 to-purple-700',
  },
};

const PRESET_QUESTIONS = [
  {
    label: 'Hierarki Visual DKV',
    soal: 'Prinsip desain grafis yang mengatur urutan pandangan mata pembaca dari judul utama menuju informasi pendukung disebut...\n[Rumah 1: Distorsi] [Rumah 2: Hierarki Visual] [Rumah 3: Gradasi] [Rumah 4: Saturasi] [Rumah 5: Tekstur]',
    rumahBenar: 2 as MysteryHouseNumber,
  },
  {
    label: 'Ruang Kosong (White Space)',
    soal: 'Dalam desain poster publikasi, fungsi utama "White Space" (ruang negatif/kosong) adalah...\n[Rumah 1: Menghapus judul] [Rumah 2: Mengurangi resolusi] [Rumah 3: Memberi ruang bernafas mata & fokus pesan] [Rumah 4: Mengubah RGB ke CMYK] [Rumah 5: Menambah font]',
    rumahBenar: 3 as MysteryHouseNumber,
  },
  {
    label: 'Format Warna Cetak vs Layar',
    soal: 'Mode warna standar industri yang WAJIB digunakan saat menyiapkan file desain spanduk/poster untuk mesin cetak fisik (offset/indoor) adalah...\n[Rumah 1: CMYK] [Rumah 2: RGB] [Rumah 3: Grayscale] [Rumah 4: Indexed] [Rumah 5: Bitmap]',
    rumahBenar: 1 as MysteryHouseNumber,
  },
  {
    label: 'Segitiga Exposure Fotografi',
    soal: 'Tiga elemen utama dalam Segitiga Exposure fotografi yang mengatur pencahayaan foto adalah...\n[Rumah 1: Lensa, Tripod, Flash] [Rumah 2: JPEG, PNG, RAW] [Rumah 3: Kontras, Highlight, Shadow] [Rumah 4: Aperture (Diafragma), Shutter Speed, dan ISO] [Rumah 5: Grid, Crop, Rotate]',
    rumahBenar: 4 as MysteryHouseNumber,
  },
];

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  isSmoke: boolean;
}

export const ArenaRumahMisteriModal: React.FC<ArenaRumahMisteriModalProps> = ({
  onClose,
  student,
  onAddXp,
}) => {
  const [isTeacherVerifiedServer, setIsTeacherVerifiedServer] = useState<boolean>(
    Boolean(student.isTeacher)
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Teacher Panel Inputs
  const [soalInput, setSoalInput] = useState<string>(PRESET_QUESTIONS[0].soal);
  const [rumahBenarInput, setRumahBenarInput] = useState<MysteryHouseNumber>(2);
  const [poinBenarInput, setPoinBenarInput] = useState<number>(20);
  const [timerSecondsInput, setTimerSecondsInput] = useState<number>(45);
  const [assignStudentId, setAssignStudentId] = useState<string>('');
  const [assignGroupNum, setAssignGroupNum] = useState<MysteryGroupNumber>(1);
  const [isSubmittingTeacherAction, setIsSubmittingTeacherAction] = useState<boolean>(false);

  // Student Panel Inputs
  const [selectedGroup, setSelectedGroup] = useState<MysteryGroupNumber>(() => {
    const saved = localStorage.getItem(`mystery_arena_group_${student.id}`);
    const parsed = Number(saved);
    return parsed >= 1 && parsed <= 8 ? (parsed as MysteryGroupNumber) : 1;
  });
  const [chatText, setChatText] = useState<string>('');
  const [activeRightTab, setActiveRightTab] = useState<'kontrol' | 'diskusi' | 'skor' | 'spreadsheet'>(
    student.isTeacher ? 'kontrol' : 'diskusi'
  );

  // Countdown & Explosion Animation State
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const lastDetonatedRoundIdRef = useRef<string | null>(null);
  const rewardedRoundIdRef = useRef<string | null>(null);
  const explosionStartMsRef = useRef<number | null>(null);
  const particlesRef = useRef<ExplosionParticle[]>([]);

  // Unique per-tab identity if multiple tabs share the same account in the same browser
  const participantIdentity = useMemo(() => {
    if (typeof window === 'undefined') {
      return { id: student.id, name: student.name };
    }
    try {
      let tabId = sessionStorage.getItem('mystery_arena_tab_id');
      if (!tabId) {
        tabId = Math.random().toString(36).slice(2, 6);
        sessionStorage.setItem('mystery_arena_tab_id', tabId);
      }
      const regKey = `mystery_arena_active_tabs_${student.id}`;
      const now = Date.now();
      let activeTabs: Record<string, number> = {};
      try {
        activeTabs = JSON.parse(localStorage.getItem(regKey) || '{}') || {};
      } catch {}
      // Purge stale tabs older than 5s
      for (const [tid, ts] of Object.entries(activeTabs)) {
        if (now - Number(ts) > 5000) {
          delete activeTabs[tid];
        }
      }
      const otherTabIds = Object.keys(activeTabs).filter((tid) => tid !== tabId);
      activeTabs[tabId] = now;
      localStorage.setItem(regKey, JSON.stringify(activeTabs));

      if (otherTabIds.length > 0 && !student.isTeacher) {
        return {
          id: `${student.id}_${tabId}`,
          name: `${student.name} (${tabId.slice(0, 2).toUpperCase()})`,
          tabId,
          regKey,
        };
      }
      return { id: student.id, name: student.name, tabId, regKey };
    } catch {
      return { id: student.id, name: student.name, tabId: 'default', regKey: '' };
    }
  }, [student.id, student.isTeacher, student.name]);

  const effectiveStudentId = participantIdentity.id;
  const effectiveStudentName = participantIdentity.name;

  const [arenaState, setArenaState] = useState<MysteryArenaState | null>(() =>
    MysteryArenaEngine.getInitialHydratedState(
      student,
      effectiveStudentId,
      effectiveStudentName,
      selectedGroup
    )
  );

  // Live peers discovered via Global WebSocket Mesh (WSS MQTT) or BroadcastChannel across URLs/tabs
  const [meshPeersVersion, setMeshPeersVersion] = useState<number>(0);
  const meshPeersRef = useRef<Map<string, MysteryArenaPlayerPresence>>(new Map());
  const meshRef = useRef<RealtimePresenceMesh | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Isometric Arena Canvas Ref
  const arenaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const localAvatarPosRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0.5,
    y: 0.66,
    targetX: 0.5,
    targetY: 0.66,
  });
  const arenaStateRef = useRef<MysteryArenaState | null>(null);
  arenaStateRef.current = arenaState;
  const selectedGroupRef = useRef<MysteryGroupNumber>(selectedGroup);
  selectedGroupRef.current = selectedGroup;

  const settings = useMemo(() => StorageService.getSettings(), []);

  const showTempStatus = useCallback((msg: string) => {
    setStatusMessage(msg);
    setErrorMessage(null);
    window.setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 4200);
  }, []);

  const showTempError = useCallback((err: string) => {
    setErrorMessage(err);
    window.setTimeout(() => {
      setErrorMessage((prev) => (prev === err ? null : prev));
    }, 5000);
  }, []);

  // Compute canonical target coordinates (0..1 normalized in arena canvas) for a group or house
  const getGroupGatheringCoords = useCallback((groupNum: MysteryGroupNumber) => {
    const idx = groupNum - 1;
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const x = 0.2 + col * 0.2 + (row % 2 === 1 ? 0.02 : -0.02);
    const y = 0.58 + row * 0.13;
    return { x, y };
  }, []);

  const getHouseDoorCoords = useCallback((houseNum: MysteryHouseNumber) => {
    const idx = houseNum - 1;
    const x = 0.14 + idx * 0.18;
    const y = 0.31;
    return { x, y };
  }, []);

  // Trigger 3-2-1 Countdown + Explosion sequence when status transitions to 'meledak'
  const triggerExplosionSequence = useCallback(
    (state: MysteryArenaState) => {
      const round = state.currentRound;
      if (!round || round.status !== 'meledak') return;
      if (lastDetonatedRoundIdRef.current === `${round.id_ronde}_meledak`) return;
      lastDetonatedRoundIdRef.current = `${round.id_ronde}_meledak`;

      // Start 3 - 2 - 1 countdown
      setCountdownNumber(3);
      sounds.playCountdownBeep(3);

      window.setTimeout(() => {
        setCountdownNumber(2);
        sounds.playCountdownBeep(2);
      }, 850);

      window.setTimeout(() => {
        setCountdownNumber(1);
        sounds.playCountdownBeep(1);
      }, 1700);

      window.setTimeout(() => {
        setCountdownNumber(null);
        explosionStartMsRef.current = performance.now();
        setIsScreenShaking(true);
        sounds.playExplosionBoom();

        // Spawn fire & smoke particles on the 4 wrong houses
        const wrongHouses = HOUSE_NUMBERS.filter((h) => h !== round.rumah_benar);
        const newParticles: ExplosionParticle[] = [];
        wrongHouses.forEach((hNum) => {
          const coords = getHouseDoorCoords(hNum);
          for (let i = 0; i < 28; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.4 + Math.random() * 2.6;
            const isSmoke = i >= 16;
            newParticles.push({
              x: coords.x,
              y: coords.y - 0.05,
              vx: Math.cos(angle) * speed * 0.004,
              vy: Math.sin(angle) * speed * 0.004 - (isSmoke ? 0.0035 : 0.002),
              size: isSmoke ? 10 + Math.random() * 14 : 5 + Math.random() * 9,
              color: isSmoke
                ? '#475569'
                : i % 3 === 0
                ? '#ef4444'
                : i % 3 === 1
                ? '#f97316'
                : '#fde047',
              alpha: 1,
              isSmoke,
            });
          }
        });
        particlesRef.current = newParticles;

        // Knockback sound after 250ms
        window.setTimeout(() => {
          sounds.playBounceKnockback();
        }, 260);

        // Stop screen shake after 1.1s
        window.setTimeout(() => {
          setIsScreenShaking(false);
        }, 1100);

        // Check if current student's group chose the correct house -> play victory fanfare + confetti + XP!
        const myGroup = state.studentGroupMap?.[student.id] || selectedGroup;
        const myChoice = state.choices?.[myGroup];
        if (myChoice && myChoice.rumah_dipilih && myChoice.rumah_dipilih === round.rumah_benar) {
          window.setTimeout(() => {
            sounds.playVictoryFanfare();
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
            if (
              !student.isTeacher &&
              onAddXp &&
              rewardedRoundIdRef.current !== round.id_ronde
            ) {
              rewardedRoundIdRef.current = round.id_ronde;
              onAddXp(
                3,
                `Menang Arena Rumah Misteri (${round.id_ronde} • Kelompok ${myGroup})`
              );
            }
          }, 650);
        }
      }, 2550);
    },
    [getHouseDoorCoords, onAddXp, selectedGroup, student.id, student.isTeacher]
  );

  // Sync local avatar target whenever group choice or round status changes
  useEffect(() => {
    if (!arenaState) return;
    const assignedGroup =
      arenaState.studentGroupMap?.[effectiveStudentId] ||
      arenaState.studentGroupMap?.[student.id] ||
      selectedGroup;
    if (!student.isTeacher && assignedGroup !== selectedGroup) {
      setSelectedGroup(assignedGroup);
    }

    const round = arenaState.currentRound;
    if (student.isTeacher) {
      localAvatarPosRef.current.targetX = 0.5;
      localAvatarPosRef.current.targetY = 0.86;
      return;
    }

    const choice = arenaState.choices?.[assignedGroup];

    if (round?.status === 'meledak') {
      if (choice && choice.rumah_dipilih && round.rumah_benar && choice.rumah_dipilih === round.rumah_benar) {
        const door = getHouseDoorCoords(choice.rumah_dipilih);
        localAvatarPosRef.current.targetX = door.x;
        localAvatarPosRef.current.targetY = door.y + 0.03;
      } else {
        const pad = getGroupGatheringCoords(assignedGroup);
        localAvatarPosRef.current.targetX = pad.x;
        localAvatarPosRef.current.targetY = pad.y;
      }
    } else if (choice && choice.rumah_dipilih && (round?.status === 'buka' || round?.status === 'tutup')) {
      const door = getHouseDoorCoords(choice.rumah_dipilih);
      localAvatarPosRef.current.targetX = door.x;
      localAvatarPosRef.current.targetY = door.y + 0.03;
    } else {
      const pad = getGroupGatheringCoords(assignedGroup);
      localAvatarPosRef.current.targetX = pad.x;
      localAvatarPosRef.current.targetY = pad.y;
    }
  }, [arenaState, effectiveStudentId, getGroupGatheringCoords, getHouseDoorCoords, selectedGroup, student.id, student.isTeacher]);

  // Trigger explosion sequence if round is 'meledak'
  useEffect(() => {
    if (arenaState?.currentRound?.status === 'meledak') {
      triggerExplosionSequence(arenaState);
    } else if (arenaState?.currentRound?.status === 'menunggu' || arenaState?.currentRound?.status === 'buka') {
      setCountdownNumber(null);
      explosionStartMsRef.current = null;
      particlesRef.current = [];
    }
  }, [arenaState, triggerExplosionSequence]);

  // Publish Mystery Arena event over Global WSS Mesh + Local BroadcastChannel
  const publishArenaMeshEvent = useCallback(
    (arenaPayload: Record<string, any>) => {
      const fullPayload = {
        ...arenaPayload,
        senderId: effectiveStudentId,
        ts: Date.now(),
      };
      try {
        meshRef.current?.publish({
          type: 'mystery_arena_event',
          senderId: effectiveStudentId,
          arenaPayload: fullPayload,
        });
      } catch {}
      try {
        broadcastChannelRef.current?.postMessage({
          type: 'mystery_arena_event',
          senderId: effectiveStudentId,
          arenaPayload: fullPayload,
        });
      } catch {}
    },
    [effectiveStudentId]
  );

  // 1.2-second real-time polling + presence heartbeat (Server + Client/Mesh Hybrid Engine)
  const fetchArenaState = useCallback(async () => {
    try {
      // Keep local tab registry fresh
      if (participantIdentity.regKey && participantIdentity.tabId) {
        try {
          const activeTabs = JSON.parse(localStorage.getItem(participantIdentity.regKey) || '{}') || {};
          activeTabs[participantIdentity.tabId] = Date.now();
          localStorage.setItem(participantIdentity.regKey, JSON.stringify(activeTabs));
        } catch {}
      }

      const res = await MysteryArenaEngine.fetchState({
        student,
        effectiveStudentId,
        effectiveStudentName,
        selectedGroup: selectedGroupRef.current,
      });
      if (res && res.data) {
        setArenaState(res.data);
        setIsTeacherVerifiedServer(Boolean(res.isVerifiedTeacher));
      }
    } catch {
      // ignore transient network errors during polling
    }
  }, [
    effectiveStudentId,
    effectiveStudentName,
    participantIdentity.regKey,
    participantIdentity.tabId,
    student,
  ]);

  // 4-Layer Real-Time Synchronization:
  // 1. Global WSS MQTT Presence Mesh (connects ais-dev, ais-pre, Vercel, mobile & laptop in <50ms)
  // 2. Local BroadcastChannel
  // 3. Express SSE (/api/presence/stream)
  // 4. Fast 1.2s HTTP Polling (/api/mystery-arena/state with local fallback)
  useEffect(() => {
    let isMounted = true;

    const announceSelfOnMesh = () => {
      if (!isMounted) return;
      const myHouse =
        arenaStateRef.current?.choices?.[selectedGroupRef.current]?.rumah_dipilih || null;
      publishArenaMeshEvent({
        eventType: 'participant_presence',
        studentId: effectiveStudentId,
        studentName: effectiveStudentName,
        className: student.className || (student.isTeacher ? 'Dewan Guru' : 'X DKV'),
        gender: student.gender === 'P' ? 'P' : 'L',
        isTeacher: Boolean(student.isTeacher),
        studentNumber: student.studentNumber || '',
        kelompok: student.isTeacher ? null : selectedGroupRef.current,
        rumah_dipilih: student.isTeacher ? null : myHouse,
        arenaWx: localAvatarPosRef.current.x,
        arenaWy: localAvatarPosRef.current.y,
      });
    };

    const handleIncomingMeshPayload = (payload: any) => {
      if (!isMounted || !payload) return;
      const now = Date.now();

      if (
        payload.eventType === 'participant_presence' ||
        payload.eventType === 'student_action'
      ) {
        const pid = String(payload.studentId || '').trim();
        if (pid && pid !== effectiveStudentId) {
          const pIsTeacher = Boolean(payload.isTeacher);
          const pGroup = pIsTeacher
            ? null
            : ((Math.max(1, Math.min(8, Number(payload.kelompok) || 1)) as MysteryGroupNumber) || 1);
          const pHouse =
            payload.rumah_dipilih && Number(payload.rumah_dipilih) >= 1 && Number(payload.rumah_dipilih) <= 5
              ? (Number(payload.rumah_dipilih) as MysteryHouseNumber)
              : null;

          meshPeersRef.current.set(pid, {
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
          });
          setMeshPeersVersion((v) => v + 1);
        }
      }

      const merged = MysteryArenaEngine.mergeIncomingMeshPayload(
        payload,
        effectiveStudentId,
        Boolean(student.isTeacher),
        selectedGroupRef.current
      );
      if (merged && isMounted) {
        setArenaState(merged);
      }
    };

    // 1. Global WSS MQTT Mesh
    const mesh = new RealtimePresenceMesh(
      `arena_${effectiveStudentId}`,
      (msg) => {
        if (!isMounted) return;
        if (msg.type === 'mystery_arena_event' && msg.arenaPayload) {
          handleIncomingMeshPayload(msg.arenaPayload);
        } else if (msg.type === 'mystery_arena_request' && msg.senderId !== effectiveStudentId) {
          announceSelfOnMesh();
        }
      },
      () => {
        if (!isMounted) return;
        mesh.publish({ type: 'mystery_arena_request', senderId: effectiveStudentId });
        announceSelfOnMesh();
      }
    );
    meshRef.current = mesh;

    // 2. Local BroadcastChannel across browser tabs
    const bc =
      typeof window !== 'undefined' && 'BroadcastChannel' in window
        ? new BroadcastChannel('kota_refleksi_mystery_arena')
        : null;
    broadcastChannelRef.current = bc;
    if (bc) {
      bc.onmessage = (ev) => {
        if (!isMounted) return;
        if (ev.data?.type === 'mystery_arena_event' && ev.data.arenaPayload) {
          handleIncomingMeshPayload(ev.data.arenaPayload);
        } else if (ev.data?.type === 'mystery_arena_request' && ev.data.senderId !== effectiveStudentId) {
          announceSelfOnMesh();
        }
      };
      try {
        bc.postMessage({ type: 'mystery_arena_request', senderId: effectiveStudentId });
      } catch {}
    }

    // 3. Server-Sent Events (/api/presence/stream) for instant same-server triggers
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/presence/stream');
      es.onmessage = (ev) => {
        if (!isMounted) return;
        try {
          const parsed = JSON.parse(ev.data);
          if (parsed?.type === 'mystery_arena_tick') {
            fetchArenaState();
          }
        } catch {}
      };
    } catch {}

    // 4. Initial & periodic HTTP poll + mesh heartbeat
    fetchArenaState();
    announceSelfOnMesh();
    const pollInterval = window.setInterval(fetchArenaState, 1200);
    const meshPingInterval = window.setInterval(() => {
      announceSelfOnMesh();
      // Purge stale mesh peers older than 40s
      const now = Date.now();
      let changed = false;
      for (const [pid, peer] of meshPeersRef.current.entries()) {
        if (now - peer.lastSeen > 40000) {
          meshPeersRef.current.delete(pid);
          changed = true;
        }
      }
      if (changed && isMounted) {
        setMeshPeersVersion((v) => v + 1);
      }
    }, 2800);

    return () => {
      isMounted = false;
      window.clearInterval(pollInterval);
      window.clearInterval(meshPingInterval);
      try {
        es?.close();
      } catch {}
      try {
        bc?.close();
      } catch {}
    };
  }, [
    effectiveStudentId,
    effectiveStudentName,
    fetchArenaState,
    publishArenaMeshEvent,
    student.className,
    student.gender,
    student.isTeacher,
    student.studentNumber,
  ]);

  // Register presence / auto-join group on open or when selectedGroup changes
  useEffect(() => {
    MysteryArenaEngine.executeStudentAction({
      student,
      effectiveStudentId,
      effectiveStudentName,
      actionType: 'join_group',
      kelompok: selectedGroup,
    })
      .then((res) => {
        if (res?.data) setArenaState(res.data);
      })
      .catch(() => {});

    publishArenaMeshEvent({
      eventType: 'student_action',
      actionType: 'join_group',
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      className: student.className || (student.isTeacher ? 'Dewan Guru' : 'X DKV'),
      gender: student.gender === 'P' ? 'P' : 'L',
      isTeacher: Boolean(student.isTeacher),
      studentNumber: student.studentNumber || '',
      kelompok: student.isTeacher ? null : selectedGroup,
    });
  }, [
    effectiveStudentId,
    effectiveStudentName,
    publishArenaMeshEvent,
    selectedGroup,
    student,
  ]);

  // Teacher Action Handler (Hybrid Server + Client/Mesh Engine)
  const handleTeacherAction = async (
    actionType: 'start_round' | 'open_choices' | 'close_choices' | 'detonate' | 'next_round' | 'reset_arena' | 'assign_student_group',
    extraPayload?: Record<string, any>
  ) => {
    if (isSubmittingTeacherAction) return;
    setIsSubmittingTeacherAction(true);
    setErrorMessage(null);
    try {
      const json = await MysteryArenaEngine.executeTeacherAction({
        student,
        actionType,
        soal: soalInput,
        rumah_benar: rumahBenarInput,
        poin_benar: poinBenarInput,
        timer_detik: timerSecondsInput,
        extraPayload,
      });
      if (!json.success || !json.data) {
        showTempError(json.error || 'Gagal menjalankan aksi guru.');
        return;
      }

      const nextState: MysteryArenaState = json.data;
      setArenaState(nextState);
      sounds.playClick();

      // Broadcast state over Mesh & BroadcastChannel (anti-peek: hide rumah_benar unless status === 'meledak')
      publishArenaMeshEvent({
        eventType: 'teacher_state_broadcast',
        canonicalStore: json.canonicalStore,
        sanitizedState: {
          ...nextState,
          currentRound: {
            ...nextState.currentRound,
            rumah_benar:
              nextState.currentRound.status === 'meledak'
                ? nextState.currentRound.rumah_benar
                : null,
          },
        },
      });

      // Sync to Google Spreadsheet (Game_Ronde & Game_Skor) without blocking UI
      if (nextState.currentRound) {
        const fullRondeForSheet = {
          ...nextState.currentRound,
          rumah_benar: rumahBenarInput,
        };
        StorageService.syncMysteryArenaRondeToGAS({
          ronde: fullRondeForSheet,
          teacherId: student.id,
          teacherName: student.name,
          teacherPin: settings.teacherPin || '1234',
        });
      }
      if (actionType === 'detonate' || actionType === 'next_round' || actionType === 'reset_arena') {
        StorageService.syncMysteryArenaSkorToGAS(nextState.scores);
      }

      if (actionType === 'start_round') {
        showTempStatus('✅ Ronde baru berhasil disiapkan! Klik "Buka Pilihan" saat siswa siap.');
      } else if (actionType === 'open_choices') {
        showTempStatus('🔓 Pilihan Rumah DIBUKA! Kelompok siswa kini dapat bergerak memilih Rumah 1–5.');
      } else if (actionType === 'close_choices') {
        showTempStatus('🔒 Pilihan Rumah DITUTUP! Posisi seluruh kelompok telah dikunci.');
      } else if (actionType === 'detonate') {
        showTempStatus('💥 LEDAKKAN diaktifkan! Hitung mundur 3-2-1 dimulai...');
      } else if (actionType === 'next_round' || actionType === 'reset_arena') {
        showTempStatus('🔄 Arena di-reset! Kelima rumah utuh kembali & siswa kembali ke area kelompok.');
      } else if (actionType === 'assign_student_group') {
        showTempStatus('✅ Kelompok siswa berhasil diperbarui.');
      }
    } catch {
      showTempError('Gagal menjalankan aksi Guru.');
    } finally {
      setIsSubmittingTeacherAction(false);
    }
  };

  // Student Action: Switch Group
  const handleSelectGroup = async (kelompok: MysteryGroupNumber) => {
    sounds.playClick();
    setSelectedGroup(kelompok);
    try {
      localStorage.setItem(`mystery_arena_group_${student.id}`, String(kelompok));
    } catch {}
    const pad = getGroupGatheringCoords(kelompok);
    localAvatarPosRef.current.targetX = pad.x;
    localAvatarPosRef.current.targetY = pad.y;

    publishArenaMeshEvent({
      eventType: 'student_action',
      actionType: 'join_group',
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      className: student.className || 'X DKV',
      gender: student.gender === 'P' ? 'P' : 'L',
      isTeacher: Boolean(student.isTeacher),
      studentNumber: student.studentNumber || '',
      kelompok,
    });

    try {
      const json = await MysteryArenaEngine.executeStudentAction({
        student,
        effectiveStudentId,
        effectiveStudentName,
        actionType: 'join_group',
        kelompok,
      });
      if (json?.data) {
        setArenaState(json.data);
        showTempStatus(`👥 Bergabung ke Kelompok ${kelompok}!`);
      }
    } catch {}
  };

  // Student Action: Move Group into Chosen House (1-5)
  const handleSelectHouse = async (rumah: MysteryHouseNumber) => {
    const round = arenaState?.currentRound;
    if (!round || round.status !== 'buka') {
      sounds.playClick();
      showTempError('Pilihan rumah belum dibuka atau sudah dikunci oleh Guru!');
      return;
    }

    sounds.playRewardXp();
    const door = getHouseDoorCoords(rumah);
    localAvatarPosRef.current.targetX = door.x;
    localAvatarPosRef.current.targetY = door.y + 0.03;

    publishArenaMeshEvent({
      eventType: 'student_action',
      actionType: 'select_house',
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      className: student.className || 'X DKV',
      gender: student.gender === 'P' ? 'P' : 'L',
      isTeacher: Boolean(student.isTeacher),
      studentNumber: student.studentNumber || '',
      kelompok: selectedGroup,
      rumah_dipilih: rumah,
    });

    try {
      const json = await MysteryArenaEngine.executeStudentAction({
        student,
        effectiveStudentId,
        effectiveStudentName,
        actionType: 'select_house',
        kelompok: selectedGroup,
        rumah_dipilih: rumah,
      });
      if (!json.success) {
        showTempError(json.error || 'Tidak dapat memilih rumah saat ini.');
        return;
      }
      if (json.data) {
        const nextState = json.data as MysteryArenaState;
        setArenaState(nextState);
        showTempStatus(`🏠 Kelompok ${selectedGroup} bergerak masuk ke Rumah ${rumah}!`);
        const latestChoice = nextState.choices?.[selectedGroup];
        if (latestChoice && latestChoice.rumah_dipilih) {
          StorageService.syncMysteryArenaPilihanToGAS(latestChoice);
        }
      }
    } catch {
      showTempError('Tidak dapat memilih rumah saat ini.');
    }
  };

  // Student Action: Send Group Chat Message
  const handleSendGroupChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatText.trim();
    if (!trimmed) return;
    setChatText('');
    sounds.playClick();

    publishArenaMeshEvent({
      eventType: 'student_action',
      actionType: 'send_group_chat',
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      className: student.className || 'X DKV',
      gender: student.gender === 'P' ? 'P' : 'L',
      isTeacher: Boolean(student.isTeacher),
      studentNumber: student.studentNumber || '',
      kelompok: selectedGroup,
      chatContent: trimmed,
    });

    try {
      const json = await MysteryArenaEngine.executeStudentAction({
        student,
        effectiveStudentId,
        effectiveStudentName,
        actionType: 'send_group_chat',
        kelompok: selectedGroup,
        chatContent: trimmed,
      });
      if (json?.data) {
        setArenaState(json.data);
      }
    } catch {}
  };

  // Countdown Timer Remaining Seconds when status === 'buka'
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  useEffect(() => {
    const timerEnd = arenaState?.currentRound?.timer_berakhir_ms;
    const status = arenaState?.currentRound?.status;
    if (status !== 'buka' || !timerEnd) {
      setRemainingSeconds(null);
      return;
    }
    const updateRemaining = () => {
      const diff = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setRemainingSeconds(diff);
    };
    updateRemaining();
    const id = window.setInterval(updateRemaining, 300);
    return () => window.clearInterval(id);
  }, [arenaState?.currentRound?.status, arenaState?.currentRound?.timer_berakhir_ms]);

  // 60FPS Isometric Arena Canvas Render Loop
  useEffect(() => {
    const canvas = arenaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const renderArena = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const W = rect.width;
      const H = rect.height;

      const state = arenaStateRef.current;
      const round = state?.currentRound;
      const isDetonated = round?.status === 'meledak' && explosionStartMsRef.current !== null;
      const detonateElapsed = explosionStartMsRef.current ? now - explosionStartMsRef.current : 0;

      // 1. Isometric Plaza Background (Matching Kota Refleksia Palette)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.32, '#1e293b');
      bgGrad.addColorStop(0.33, '#15803d');
      bgGrad.addColorStop(1, '#166534');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Decorative Isometric Cobblestone Arena Floor
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.08, H * 0.32);
      ctx.lineTo(W * 0.92, H * 0.32);
      ctx.lineTo(W * 0.97, H * 0.93);
      ctx.lineTo(W * 0.03, H * 0.93);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Subtle Isometric Grid Lines on Plaza Floor
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 8; i++) {
        const y = H * (0.32 + i * 0.075);
        ctx.beginPath();
        ctx.moveTo(W * 0.05, y);
        ctx.lineTo(W * 0.95, y);
        ctx.stroke();
      }
      for (let j = 1; j <= 9; j++) {
        const x = W * (0.08 + j * 0.084);
        ctx.beginPath();
        ctx.moveTo(x, H * 0.32);
        ctx.lineTo(x, H * 0.93);
        ctx.stroke();
      }

      // 2. Draw Pathways from Group Area to the 5 Mystery Houses
      HOUSE_NUMBERS.forEach((hNum) => {
        const door = getHouseDoorCoords(hNum);
        const hx = door.x * W;
        const hy = door.y * H;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(hx, hy + 10);
        ctx.lineTo(hx, H * 0.52);
        ctx.stroke();
      });

      const choicesArray: GamePilihanRow[] = state?.choices ? Object.values(state.choices) : [];

      // 3. Draw 5 Mystery Houses at the Back (Rumah 1 - 5)
      HOUSE_NUMBERS.forEach((hNum) => {
        const meta = HOUSE_META[hNum];
        const door = getHouseDoorCoords(hNum);
        const cx = door.x * W;
        const cy = door.y * H;
        const hw = Math.min(76, W * 0.14);
        const hh = Math.min(54, H * 0.13);

        const isCorrectHouse = isDetonated && round?.rumah_benar === hNum;
        const isDestroyedHouse = isDetonated && round?.rumah_benar !== null && round?.rumah_benar !== hNum;

        const occupyingGroups: MysteryGroupNumber[] = choicesArray
          .filter((c) => c.rumah_dipilih === hNum)
          .map((c) => c.kelompok);

        ctx.save();

        if (isCorrectHouse) {
          const pulse = 0.75 + Math.sin(now * 0.008) * 0.25;
          const aura = ctx.createRadialGradient(cx, cy - hh * 0.4, 8, cx, cy - hh * 0.4, hw * 1.15);
          aura.addColorStop(0, `rgba(250, 204, 21, ${0.85 * pulse})`);
          aura.addColorStop(0.6, `rgba(16, 185, 129, ${0.4 * pulse})`);
          aura.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(cx, cy - hh * 0.4, hw * 1.15, 0, Math.PI * 2);
          ctx.fill();
        }

        if (isDestroyedHouse) {
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 4, hw * 0.65, 12, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.moveTo(cx - hw * 0.48, cy);
          ctx.lineTo(cx - hw * 0.45, cy - hh * 0.35);
          ctx.lineTo(cx - hw * 0.15, cy - hh * 0.18);
          ctx.lineTo(cx + hw * 0.12, cy - hh * 0.42);
          ctx.lineTo(cx + hw * 0.46, cy - hh * 0.22);
          ctx.lineTo(cx + hw * 0.48, cy);
          ctx.closePath();
          ctx.fill();

          const flameH = 12 + Math.sin(now * 0.02 + hNum) * 5;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(cx - 8, cy - 8, flameH * 0.45, 0, Math.PI * 2);
          ctx.arc(cx + 10, cy - 6, flameH * 0.38, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💥 MELEDAK', cx, cy - hh * 0.65);
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
          ctx.beginPath();
          ctx.ellipse(cx, cy + 5, hw * 0.62, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = meta.wallHex;
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(cx - hw * 0.48, cy - hh * 0.72, hw * 0.96, hh * 0.72, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = meta.roofHex;
          ctx.beginPath();
          ctx.moveTo(cx - hw * 0.58, cy - hh * 0.68);
          ctx.lineTo(cx, cy - hh * 1.25);
          ctx.lineTo(cx + hw * 0.58, cy - hh * 0.68);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = round?.status === 'tutup' ? '#475569' : meta.doorHex;
          ctx.beginPath();
          ctx.roundRect(cx - hw * 0.14, cy - hh * 0.42, hw * 0.28, hh * 0.42, [4, 4, 0, 0]);
          ctx.fill();

          if (round?.status === 'tutup') {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔒', cx, cy - hh * 0.15);
          }

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(cx - 26, cy - hh * 0.98, 52, 17, 6);
          ctx.fill();
          ctx.strokeStyle = isCorrectHouse ? '#fde047' : '#94a3b8';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = isCorrectHouse ? '#fde047' : '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(meta.name, cx, cy - hh * 0.98 + 12);
        }

        // Group Badges floating ABOVE the house
        if (occupyingGroups.length > 0 && (!isDestroyedHouse || detonateElapsed < 350)) {
          occupyingGroups.forEach((gNum: MysteryGroupNumber, idx: number) => {
            const gColor = GROUP_COLORS[gNum];
            const badgeY = cy - hh * 1.38 - idx * 18;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.beginPath();
            ctx.roundRect(cx - 34, badgeY - 12, 68, 16, 8);
            ctx.fill();
            ctx.strokeStyle = gColor.hex;
            ctx.lineWidth = 1.4;
            ctx.stroke();

            ctx.fillStyle = gColor.hex;
            ctx.font = 'bold 9.5px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Kelompok ${gNum}`, cx, badgeY - 1);
          });
        }

        ctx.restore();
      });

      // 4. Draw Group Gathering Zones (Kelompok 1 - 8) in the Middle
      GROUP_NUMBERS.forEach((gNum) => {
        const pad = getGroupGatheringCoords(gNum);
        const gx = pad.x * W;
        const gy = pad.y * H;
        const gColor = GROUP_COLORS[gNum];
        const isMyGroup = !student.isTeacher && selectedGroup === gNum;

        ctx.save();
        ctx.fillStyle = isMyGroup ? 'rgba(56, 189, 248, 0.24)' : 'rgba(15, 23, 42, 0.55)';
        ctx.strokeStyle = gColor.hex;
        ctx.lineWidth = isMyGroup ? 2.4 : 1.3;
        ctx.beginPath();
        ctx.ellipse(gx, gy, Math.min(44, W * 0.08), 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`KELOMPOK ${gNum}`, gx, gy + 3);
        ctx.restore();
      });

      // 5. Draw Teacher Stage / Podium at the Front
      const podX = W * 0.5;
      const podY = H * 0.87;
      ctx.save();
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(podX - 78, podY - 18, 156, 32, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👨‍🏫 PODIUM GURU (DEPAN ARENA)', podX, podY + 2);
      ctx.restore();

      // 6. Smoothly interpolate local avatar position
      const loc = localAvatarPosRef.current;
      loc.x += (loc.targetX - loc.x) * 0.14;
      loc.y += (loc.targetY - loc.y) * 0.14;

      // 7. Render All Online Players in the Arena (Server + Global Mesh Peers + Local Player)
      const playerMap = new Map<string, MysteryArenaPlayerPresence>();
      (state?.arenaPlayers || []).forEach((p) => {
        if (p && p.studentId) playerMap.set(p.studentId, p);
      });
      meshPeersRef.current.forEach((peer, pid) => {
        if (!playerMap.has(pid)) {
          playerMap.set(pid, peer);
        }
      });
      if (!playerMap.has(effectiveStudentId)) {
        playerMap.set(effectiveStudentId, {
          studentId: effectiveStudentId,
          studentName: effectiveStudentName,
          className: student.className || 'X DKV',
          gender: student.gender === 'P' ? 'P' : 'L',
          isTeacher: Boolean(student.isTeacher),
          kelompok: student.isTeacher ? null : selectedGroup,
          arenaWx: loc.x,
          arenaWy: loc.y,
          rumah_dipilih: null,
          lastSeen: Date.now(),
        });
      }
      const playersToDraw: MysteryArenaPlayerPresence[] = Array.from(playerMap.values());

      playersToDraw.forEach((p, idx) => {
        const isSelf = p.studentId === effectiveStudentId || p.studentId === student.id;
        const pGroup: MysteryGroupNumber =
          (p.kelompok || state?.studentGroupMap?.[p.studentId] || 1) as MysteryGroupNumber;
        const choice = state?.choices?.[pGroup];

        let targetX = 0.5;
        let targetY = 0.65;

        if (p.isTeacher) {
          targetX = 0.5;
          targetY = 0.84;
        } else if (choice && choice.rumah_dipilih) {
          const door = getHouseDoorCoords(choice.rumah_dipilih);
          const offsetAngle = (idx % 5) * 0.6 - 1.2;
          if (isDetonated && round?.rumah_benar !== choice.rumah_dipilih) {
            const pad = getGroupGatheringCoords(pGroup);
            const t = Math.min(1, detonateElapsed / 950);
            targetX = door.x + (pad.x - door.x) * t;
            const arcLift = Math.sin(t * Math.PI) * 0.18;
            targetY = door.y + (pad.y - door.y) * t - arcLift;
          } else {
            targetX = door.x + offsetAngle * 0.015;
            targetY = door.y + 0.025 + (idx % 2) * 0.015;
          }
        } else {
          const pad = getGroupGatheringCoords(pGroup);
          const offsetAngle = (idx % 4) * 0.014 - 0.02;
          targetX = pad.x + offsetAngle;
          targetY = pad.y - 0.02;
        }

        const drawX = (isSelf && !isDetonated ? loc.x : targetX) * W;
        const drawY = (isSelf && !isDetonated ? loc.y : targetY) * H;

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(drawX, drawY + 8, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        const shirtColor = p.isTeacher
          ? '#f59e0b'
          : GROUP_COLORS[pGroup]?.hex || '#38bdf8';
        ctx.fillStyle = shirtColor;
        ctx.beginPath();
        ctx.roundRect(drawX - 6, drawY - 6, 12, 12, 4);
        ctx.fill();
        ctx.strokeStyle = isSelf ? '#ffffff' : '#0f172a';
        ctx.lineWidth = isSelf ? 2 : 1;
        ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.arc(drawX, drawY - 11, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const shortName = p.studentName.split(' ')[0].slice(0, 10);
        ctx.font = 'bold 8.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = isSelf ? '#fde047' : '#e2e8f0';
        ctx.fillText(p.isTeacher ? `👨‍🏫 ${shortName}` : shortName, drawX, drawY - 20);
        ctx.restore();
      });

      // 8. Update & Draw Explosion Particles (Fire & Smoke on 4 Wrong Houses)
      if (particlesRef.current.length > 0) {
        particlesRef.current.forEach((pt) => {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.alpha = Math.max(0, pt.alpha - (pt.isSmoke ? 0.008 : 0.014));
          if (pt.alpha > 0.01) {
            ctx.save();
            ctx.globalAlpha = pt.alpha;
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x * W, pt.y * H, pt.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });
      }

      ctx.restore();
      animId = window.requestAnimationFrame(renderArena);
    };

    animId = window.requestAnimationFrame(renderArena);
    return () => window.cancelAnimationFrame(animId);
  }, [getGroupGatheringCoords, getHouseDoorCoords, selectedGroup, student.className, student.gender, student.id, student.isTeacher, student.name]);

  // Handle clicking directly on the Isometric Arena Canvas to select a house (1-5)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (student.isTeacher) return;
    const round = arenaState?.currentRound;
    if (!round || round.status !== 'buka') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    for (const hNum of HOUSE_NUMBERS) {
      const door = getHouseDoorCoords(hNum);
      if (Math.abs(clickX - door.x) < 0.08 && Math.abs(clickY - (door.y - 0.04)) < 0.14) {
        handleSelectHouse(hNum);
        return;
      }
    }
  };

  const currentRound = arenaState?.currentRound;
  const myGroupChoice = useMemo(() => {
    if (!arenaState?.choices) return null;
    return arenaState.choices[selectedGroup] || null;
  }, [arenaState?.choices, selectedGroup]);

  const myGroupChats = useMemo(() => {
    if (!arenaState?.groupChats) return [];
    return arenaState.groupChats.filter((c) => c.kelompok === selectedGroup);
  }, [arenaState?.groupChats, selectedGroup]);

  const choicesList: GamePilihanRow[] = useMemo(() => {
    if (!arenaState?.choices) return [];
    return Object.values(arenaState.choices);
  }, [arenaState?.choices]);

  // Unified real-time list of all online participants (Server + Global Mesh + Self)
  const allOnlineParticipants = useMemo(() => {
    void meshPeersVersion;
    const map = new Map<string, MysteryArenaPlayerPresence>();
    (arenaState?.arenaPlayers || []).forEach((p) => {
      if (p && p.studentId) {
        map.set(p.studentId, p);
      }
    });
    meshPeersRef.current.forEach((peer, pid) => {
      const existing = map.get(pid);
      if (!existing || peer.lastSeen > existing.lastSeen) {
        map.set(pid, peer);
      }
    });
    map.set(effectiveStudentId, {
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      className: student.className || (student.isTeacher ? 'Dewan Guru' : 'X DKV'),
      gender: student.gender === 'P' ? 'P' : 'L',
      isTeacher: Boolean(student.isTeacher),
      kelompok: student.isTeacher ? null : selectedGroup,
      arenaWx: localAvatarPosRef.current.x,
      arenaWy: localAvatarPosRef.current.y,
      rumah_dipilih: student.isTeacher ? null : myGroupChoice?.rumah_dipilih || null,
      lastSeen: Date.now(),
    });
    return Array.from(map.values());
  }, [
    arenaState?.arenaPlayers,
    effectiveStudentId,
    effectiveStudentName,
    meshPeersVersion,
    myGroupChoice?.rumah_dipilih,
    selectedGroup,
    student.className,
    student.gender,
    student.isTeacher,
  ]);

  // Unified real-time group member roster (Kelompok 1 - 8)
  const groupRosterMap = useMemo(() => {
    const map: Record<
      MysteryGroupNumber,
      Array<{ studentId: string; studentName: string; className: string; isOnline: boolean }>
    > = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
    };

    // 1. Add members from server groupMembers
    GROUP_NUMBERS.forEach((gNum) => {
      const serverMembers = arenaState?.groupMembers?.[gNum] || [];
      serverMembers.forEach((m: any) => {
        if (!m || !m.studentId) return;
        const isOnline = allOnlineParticipants.some(
          (ap) =>
            ap.studentId === m.studentId ||
            ap.studentName.trim().toLowerCase() === String(m.studentName || '').trim().toLowerCase()
        );
        if (!map[gNum].some((existing) => existing.studentId === m.studentId)) {
          map[gNum].push({
            studentId: m.studentId,
            studentName: m.studentName,
            className: m.className || 'X DKV',
            isOnline,
          });
        }
      });
    });

    // 2. Ensure all online student participants are in their active group
    allOnlineParticipants.forEach((ap) => {
      if (ap.isTeacher) return;
      const gNum = (ap.kelompok ||
        arenaState?.studentGroupMap?.[ap.studentId] ||
        1) as MysteryGroupNumber;
      if (gNum >= 1 && gNum <= 8) {
        // Remove from other groups if they switched
        GROUP_NUMBERS.forEach((otherG) => {
          if (otherG !== gNum) {
            map[otherG] = map[otherG].filter((m) => m.studentId !== ap.studentId);
          }
        });
        const existingIdx = map[gNum].findIndex((m) => m.studentId === ap.studentId);
        if (existingIdx >= 0) {
          map[gNum][existingIdx].isOnline = true;
          map[gNum][existingIdx].studentName = ap.studentName;
        } else {
          map[gNum].push({
            studentId: ap.studentId,
            studentName: ap.studentName,
            className: ap.className || 'X DKV',
            isOnline: true,
          });
        }
      }
    });

    return map;
  }, [allOnlineParticipants, arenaState?.groupMembers, arenaState?.studentGroupMap]);

  const onlineStudentsList = useMemo(
    () => allOnlineParticipants.filter((p) => !p.isTeacher),
    [allOnlineParticipants]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-backdrop-fade">
      <div
        className={`bg-slate-900 border border-amber-500/40 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-slate-100 transition-transform ${
          isScreenShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* TOP HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-700/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-xl sm:text-2xl shadow-lg border border-amber-300/40 shrink-0">
              🏠
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white truncate">
                  Arena Rumah Misteri • Refleksia Timur Depan
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {allOnlineParticipants.length} Peserta Online ({onlineStudentsList.length} Siswa)
                  </span>
                </span>
                {currentRound && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                      currentRound.status === 'buka'
                        ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400'
                        : currentRound.status === 'tutup'
                        ? 'bg-amber-500/25 text-amber-200 border-amber-400'
                        : currentRound.status === 'meledak'
                        ? 'bg-rose-500/30 text-rose-200 border-rose-400'
                        : 'bg-slate-800 text-slate-300 border-slate-600'
                    }`}
                  >
                    Status: {currentRound.status.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                Game Kelompok Langsung • Diskusikan soal bersama kelompokmu &amp; masuk ke 1 dari 5 Rumah Misteri sebelum meledak!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0 border border-slate-600/60"
            title="Keluar dari Arena Rumah Misteri"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STATUS / ERROR BANNER */}
        {(statusMessage || errorMessage) && (
          <div
            className={`px-4 py-2 text-xs font-bold flex items-center justify-between gap-2 shrink-0 border-b ${
              errorMessage
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {errorMessage ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{errorMessage || statusMessage}</span>
            </div>
          </div>
        )}

        {/* MAIN RESPONSIVE BODY: LEFT ARENA STAGE + RIGHT INTERACTION PANEL */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* LEFT COLUMN (7 COLS): ACTIVE QUESTION BANNER + ISOMETRIC ARENA + HOUSE BUTTONS */}
          <div className="lg:col-span-7 flex flex-col p-3 sm:p-4 gap-3 overflow-y-auto">
            {/* QUESTION BANNER */}
            <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border border-indigo-400/40 rounded-2xl p-3.5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/30 border border-indigo-400/50 text-indigo-200 font-mono font-extrabold text-xs">
                    {currentRound?.id_ronde || 'BELUM ADA RONDE'}
                  </span>
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Hadiah: +{currentRound?.poin_benar || 20} Poin Kelompok</span>
                  </span>
                </div>

                {remainingSeconds !== null && currentRound?.status === 'buka' && (
                  <div
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black flex items-center gap-1.5 border ${
                      remainingSeconds <= 10
                        ? 'bg-rose-600/30 border-rose-400 text-rose-200 animate-pulse'
                        : 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>Sisa Waktu: {remainingSeconds}d</span>
                  </div>
                )}
              </div>

              <div className="text-xs sm:text-sm font-bold text-white whitespace-pre-line leading-relaxed bg-slate-950/60 rounded-xl p-3 border border-slate-800">
                {currentRound?.soal ||
                  'Menunggu Bapak/Ibu Guru memulai ronde dan menampilkan soal di layar...'}
              </div>

              {/* Anti-Peek Security Indicator & Post-Explosion Answer Reveal */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Keamanan Anti-Intip Aktif: Rumah benar disembunyikan di server hingga status{' '}
                    <strong className="text-rose-300">MELEDAK</strong>.
                  </span>
                </span>
                {currentRound?.status === 'meledak' && currentRound.rumah_benar && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/25 border border-emerald-400 text-emerald-200 font-extrabold">
                    ✨ Rumah yang Benar: RUMAH {currentRound.rumah_benar}!
                  </span>
                )}
              </div>
            </div>

            {/* DEDICATED ARENA LAYOUT BAR (OUTSIDE SIMULATION CANVAS SO IT NEVER COVERS THE ARENA) */}
            <div className="bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-200 shrink-0">
              <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                <span>🗺️ Tata Letak Arena:</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span><strong>Belakang:</strong> Rumah Misteri 1–5 (Klik untuk masuk)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span><strong>Tengah:</strong> Area Berkumpul Kelompok 1–8</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span><strong>Depan:</strong> Podium Guru</span>
                </span>
              </div>
            </div>

            {/* LIVE ISOMETRIC ARENA CANVAS (CLEAN & UNOBSTRUCTED) */}
            <div className="relative w-full h-[270px] sm:h-[320px] rounded-2xl overflow-hidden border border-slate-700 shadow-inner bg-slate-950 shrink-0">
              <canvas
                ref={arenaCanvasRef}
                onClick={handleCanvasClick}
                className="w-full h-full block cursor-pointer"
              />

              {/* 3 - 2 - 1 COUNTDOWN OVERLAY */}
              {countdownNumber !== null && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center z-20 pointer-events-none">
                  <div className="text-6xl sm:text-8xl font-black text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.9)] animate-ping">
                    {countdownNumber}
                  </div>
                  <div className="mt-4 text-sm sm:text-base font-extrabold text-rose-300 uppercase tracking-widest">
                    💥 BERSIAP! 4 RUMAH SALAH AKAN MELEDAK...
                  </div>
                </div>
              )}
            </div>

            {/* LIVE PARTICIPANTS ROSTER STRIP (TERBACA REAL-TIME) */}
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-2.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="text-[11px] font-extrabold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>
                    Peserta Bergabung Real-Time ({allOnlineParticipants.length} Orang •{' '}
                    {onlineStudentsList.length} Siswa)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Sinkronisasi Otomatis Multi-Perangkat
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[68px] overflow-y-auto pr-1">
                {allOnlineParticipants.map((p) => {
                  const isMe = p.studentId === effectiveStudentId || p.studentId === student.id;
                  const pGrp = p.kelompok || arenaState?.studentGroupMap?.[p.studentId];
                  const grpHouse = pGrp ? arenaState?.choices?.[pGrp]?.rumah_dipilih : null;
                  return (
                    <span
                      key={p.studentId}
                      className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold flex items-center gap-1 border ${
                        p.isTeacher
                          ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                          : isMe
                          ? 'bg-sky-500/25 border-sky-400 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-200'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{p.isTeacher ? `👨‍🏫 ${p.studentName}` : p.studentName}</span>
                      {!p.isTeacher && pGrp && (
                        <span className="px-1 rounded bg-slate-800 text-sky-300 text-[9.5px] font-extrabold">
                          K{pGrp}
                        </span>
                      )}
                      {!p.isTeacher && grpHouse && (
                        <span className="px-1 rounded bg-amber-500/25 text-amber-300 text-[9.5px] font-extrabold">
                          🏠R{grpHouse}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* HOUSE SELECTION CONTROLS (FOR STUDENTS) OR QUICK STATUS (FOR TEACHER) */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-amber-400" />
                  <span>
                    {student.isTeacher
                      ? 'Status Hunian 5 Rumah Misteri (Real-Time):'
                      : `Pilih Rumah untuk Kelompok ${selectedGroup}:`}
                  </span>
                </div>
                {!student.isTeacher && (
                  <span className="text-[11px] font-bold text-sky-300">
                    {myGroupChoice?.rumah_dipilih
                      ? `✅ Kelompok ${selectedGroup} berada di Rumah ${myGroupChoice.rumah_dipilih}`
                      : 'Belum memilih rumah'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2">
                {HOUSE_NUMBERS.map((hNum) => {
                  const meta = HOUSE_META[hNum];
                  const groupsInHouse: MysteryGroupNumber[] = choicesList
                    .filter((c) => c.rumah_dipilih === hNum)
                    .map((c) => c.kelompok);
                  const isMyHouse = myGroupChoice?.rumah_dipilih === hNum;
                  const canClick = !student.isTeacher && currentRound?.status === 'buka';

                  return (
                    <button
                      key={hNum}
                      type="button"
                      disabled={!canClick}
                      onClick={() => handleSelectHouse(hNum)}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-between gap-1 ${
                        isMyHouse
                          ? 'bg-gradient-to-b from-amber-500/30 to-orange-600/30 border-amber-400 ring-2 ring-amber-400/40'
                          : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                      } ${canClick ? 'cursor-pointer active:scale-95' : 'opacity-80 cursor-not-allowed'}`}
                    >
                      <div className="text-base sm:text-lg">🏠</div>
                      <div className="font-extrabold text-[11px] sm:text-xs text-white">
                        {meta.name}
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-0.5 min-h-[18px]">
                        {groupsInHouse.length === 0 ? (
                          <span className="text-[9.5px] text-slate-500">Kosong</span>
                        ) : (
                          groupsInHouse.map((g: MysteryGroupNumber) => (
                            <span
                              key={g}
                              className="px-1.5 py-0.2 rounded bg-amber-500/25 border border-amber-400/50 text-amber-200 text-[9px] font-extrabold"
                            >
                              K{g}
                            </span>
                          ))
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (5 COLS): TEACHER PANEL / GROUP CHAT / SCOREBOARD / SPREADSHEET */}
          <div className="lg:col-span-5 flex flex-col h-full overflow-hidden bg-slate-900/60">
            {/* TAB BAR */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-2 pt-2 gap-1 shrink-0 overflow-x-auto">
              {student.isTeacher && (
                <button
                  type="button"
                  onClick={() => setActiveRightTab('kontrol')}
                  className={`px-3 py-2 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
                    activeRightTab === 'kontrol'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-400'
                      : 'text-slate-400 border-transparent hover:text-slate-200'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Panel Guru</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveRightTab('diskusi')}
                className={`px-3 py-2 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeRightTab === 'diskusi'
                    ? 'bg-sky-500/15 text-sky-300 border-sky-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Kelompok &amp; Obrolan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab('skor')}
                className={`px-3 py-2 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeRightTab === 'skor'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Papan Skor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab('spreadsheet')}
                className={`px-3 py-2 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeRightTab === 'spreadsheet'
                    ? 'bg-violet-500/15 text-violet-300 border-violet-400'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Info Sheet</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
              {/* TAB 1: PANEL KONTROL GURU (Hanya Akun Guru & Diverifikasi di Server) */}
              {activeRightTab === 'kontrol' && student.isTeacher && (
                <div className="space-y-3.5">
                  <div className="bg-amber-500/10 border border-amber-400/40 rounded-2xl p-3 flex items-center justify-between gap-2">
                    <div className="text-xs">
                      <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Otorisasi Guru Server: {isTeacherVerifiedServer ? 'TERVERIFIKASI' : 'AKTIF'}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Seluruh aksi ronde &amp; tombol LEDAKKAN divalidasi di sisi server.
                      </p>
                    </div>
                  </div>

                  {/* Quick Preset Soal */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Template Soal Cepat (Opsional):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_QUESTIONS.map((pq, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSoalInput(pq.soal);
                            setRumahBenarInput(pq.rumahBenar);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[10.5px] font-bold text-sky-300 cursor-pointer"
                        >
                          {pq.label} (Rumah {pq.rumahBenar})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Soal */}
                  <div>
                    <label className="block text-xs font-extrabold text-white mb-1">
                      1. Isi Soal &amp; Keterangan Pilihan Rumah (1–5):
                    </label>
                    <textarea
                      rows={3}
                      value={soalInput}
                      onChange={(e) => setSoalInput(e.target.value)}
                      placeholder="Tulis pertanyaan untuk didiskusikan kelompok..."
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Pilih Rumah Benar, Poin, dan Timer */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-300 mb-1">
                        Rumah Benar (Rahasia):
                      </label>
                      <select
                        value={rumahBenarInput}
                        onChange={(e) => setRumahBenarInput(Number(e.target.value) as MysteryHouseNumber)}
                        className="w-full rounded-xl bg-slate-950 border border-amber-400/50 px-2.5 py-2 text-xs font-extrabold text-amber-200"
                      >
                        {HOUSE_NUMBERS.map((h) => (
                          <option key={h} value={h}>
                            Rumah {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-300 mb-1">
                        Poin Kelompok Benar:
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={200}
                        value={poinBenarInput}
                        onChange={(e) => setPoinBenarInput(Number(e.target.value) || 20)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-2 text-xs font-bold text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-sky-300 mb-1">
                        Timer Buka (Detik):
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={timerSecondsInput}
                        onChange={(e) => setTimerSecondsInput(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-2.5 py-2 text-xs font-bold text-white"
                      />
                    </div>
                  </div>

                  {/* 4 Tombol Tahapan Utama Guru */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleTeacherAction('start_round')}
                      disabled={isSubmittingTeacherAction}
                      className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow border border-indigo-400/50 cursor-pointer active:scale-95"
                    >
                      <Play className="w-4 h-4" />
                      <span>Mulai Ronde</span>
                    </button>

                    {currentRound?.status === 'buka' ? (
                      <button
                        type="button"
                        onClick={() => handleTeacherAction('close_choices')}
                        disabled={isSubmittingTeacherAction}
                        className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow border border-amber-300 cursor-pointer active:scale-95"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Tutup Pilihan</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTeacherAction('open_choices')}
                        disabled={isSubmittingTeacherAction}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow border border-emerald-400/50 cursor-pointer active:scale-95"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>Buka Pilihan</span>
                      </button>
                    )}

                    {/* TOMBOL LEDAKKAN: Hanya Aktif Setelah Pilihan Ditutup (status === 'tutup') */}
                    <button
                      type="button"
                      onClick={() => handleTeacherAction('detonate')}
                      disabled={isSubmittingTeacherAction || currentRound?.status !== 'tutup'}
                      className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow border transition ${
                        currentRound?.status === 'tutup'
                          ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border-rose-300 cursor-pointer active:scale-95 animate-pulse'
                          : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                      }`}
                      title={
                        currentRound?.status === 'tutup'
                          ? 'Ledakkan 4 rumah yang salah sekarang!'
                          : 'Tutup pilihan terlebih dahulu untuk mengaktifkan tombol LEDAKKAN'
                      }
                    >
                      <Flame className="w-4 h-4" />
                      <span>💥 LEDAKKAN!</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTeacherAction('next_round')}
                      disabled={isSubmittingTeacherAction}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs flex items-center justify-center gap-1.5 border border-slate-600 cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Ronde Berikutnya / Reset</span>
                    </button>
                  </div>

                  {/* Daftar Kelompok, Anggota Bergabung & Rumah yang Dipilih (Terlihat oleh Guru) */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
                    <div className="text-xs font-extrabold text-amber-300 mb-2 flex items-center justify-between">
                      <span>📋 Pantauan Kelompok, Peserta &amp; Pilihan (1–8)</span>
                      <span className="text-[10.5px] text-slate-400">
                        Rumah Benar Server: Rumah {currentRound?.rumah_benar ?? rumahBenarInput}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                      {GROUP_NUMBERS.map((gNum) => {
                        const choice = arenaState?.choices?.[gNum];
                        const members = groupRosterMap[gNum] || [];
                        return (
                          <div
                            key={gNum}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-extrabold text-slate-100 flex items-center gap-1">
                                <span>Kelompok {gNum}</span>
                                <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 text-[9.5px]">
                                  👥 {members.length}
                                </span>
                              </span>
                              {choice?.rumah_dipilih ? (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold text-[10px]">
                                  🏠 Rumah {choice.rumah_dipilih}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic text-[10px]">Belum pilih</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {members.length === 0 ? (
                                <span className="text-[10px] text-slate-500 italic">
                                  Belum ada siswa bergabung
                                </span>
                              ) : (
                                members.map((m) => (
                                  <span
                                    key={m.studentId}
                                    className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] text-emerald-200 flex items-center gap-1"
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        m.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                                      }`}
                                    />
                                    <span className="truncate max-w-[110px]">{m.studentName}</span>
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Penempatan Kelompok Siswa oleh Guru */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 space-y-2">
                    <div className="text-xs font-extrabold text-sky-300 flex items-center justify-between">
                      <span>👥 Atur Kelompok Siswa Online ({onlineStudentsList.length} Siswa):</span>
                    </div>
                    {onlineStudentsList.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic py-1">
                        Menunggu siswa bergabung ke Arena Rumah Misteri... Begitu siswa membuka arena atau berjalan ke plaza arena, nama mereka langsung tampil real-time di sini.
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={assignStudentId}
                          onChange={(e) => setAssignStudentId(e.target.value)}
                          className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="">-- Pilih Siswa Online --</option>
                          {onlineStudentsList.map((p) => (
                            <option key={p.studentId} value={p.studentId}>
                              {p.studentName} (Kelompok {p.kelompok || 1})
                            </option>
                          ))}
                        </select>
                        <select
                          value={assignGroupNum}
                          onChange={(e) => setAssignGroupNum(Number(e.target.value) as MysteryGroupNumber)}
                          className="rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs font-bold text-amber-300"
                        >
                          {GROUP_NUMBERS.map((g) => (
                            <option key={g} value={g}>
                              Kelompok {g}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (!assignStudentId) return;
                            const targetPlayer = onlineStudentsList.find(
                              (p) => p.studentId === assignStudentId
                            );
                            handleTeacherAction('assign_student_group', {
                              targetStudentId: assignStudentId,
                              targetStudentName: targetPlayer?.studentName || 'Siswa DKV',
                              targetStudentClass: targetPlayer?.className || 'X DKV',
                              targetStudentGender: targetPlayer?.gender || 'L',
                              targetKelompok: assignGroupNum,
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold cursor-pointer"
                        >
                          Atur
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PILIH KELOMPOK & OBROLAN DISKUSI KELOMPOK */}
              {activeRightTab === 'diskusi' && (
                <div className="flex flex-col h-full space-y-3">
                  {/* Pilih Kelompok (1-8) */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                    <div className="text-xs font-extrabold text-white flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-sky-400" />
                        <span>Pilih Kelompok Belajar (1–8):</span>
                      </span>
                      <span className="text-[11px] text-amber-300 font-bold">
                        Aktif: Kelompok {selectedGroup}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {GROUP_NUMBERS.map((gNum) => {
                        const isSelected = selectedGroup === gNum;
                        const memberCount = (groupRosterMap[gNum] || []).length;
                        return (
                          <button
                            key={gNum}
                            type="button"
                            onClick={() => handleSelectGroup(gNum)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-extrabold border transition cursor-pointer flex flex-col items-center gap-0.5 ${
                              isSelected
                                ? 'bg-sky-500/25 border-sky-400 text-white shadow'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span>Kelompok {gNum}</span>
                            <span className="text-[9.5px] text-emerald-300 font-bold">
                              👥 {memberCount} Siswa
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Daftar Anggota di Kelompok yang Dipilih */}
                    <div className="pt-1.5 border-t border-slate-800/80">
                      <div className="text-[10.5px] font-bold text-slate-300 mb-1">
                        👥 Anggota Kelompok {selectedGroup} Saat Ini (
                        {(groupRosterMap[selectedGroup] || []).length} Siswa):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(groupRosterMap[selectedGroup] || []).length === 0 ? (
                          <span className="text-[10px] text-slate-500 italic">
                            Belum ada anggota di Kelompok {selectedGroup}
                          </span>
                        ) : (
                          (groupRosterMap[selectedGroup] || []).map((m) => (
                            <span
                              key={m.studentId}
                              className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10.5px] font-bold text-emerald-200 flex items-center gap-1"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  m.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                                }`}
                              />
                              <span>{m.studentName}</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Obrolan Internal Kelompok */}
                  <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col min-h-[220px]">
                    <div className="text-xs font-extrabold text-sky-300 mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span>💬 Diskusi Internal Kelompok {selectedGroup}</span>
                      <span className="text-[10px] text-slate-400">
                        Diskusikan jawaban lalu klik Rumah 1–5
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[210px] pr-1">
                      {myGroupChats.length === 0 ? (
                        <div className="text-center text-xs text-slate-500 py-8">
                          Belum ada obrolan di Kelompok {selectedGroup}. Yuk sapa teman satu kelompokmu dan diskusikan rumah mana yang benar!
                        </div>
                      ) : (
                        myGroupChats.map((msg) => {
                          const isMe =
                            msg.senderId === effectiveStudentId || msg.senderId === student.id;
                          return (
                            <div
                              key={msg.id}
                              className={`p-2.5 rounded-xl text-xs border ${
                                isMe
                                  ? 'bg-sky-950/60 border-sky-500/40 ml-4'
                                  : 'bg-slate-900 border-slate-800 mr-4'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                                <span className="font-extrabold text-amber-300">{msg.senderName}</span>
                                <span>{msg.timestamp}</span>
                              </div>
                              <div className="text-slate-100 leading-snug">{msg.content}</div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendGroupChat} className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-800">
                      <input
                        type="text"
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        placeholder={`Ketik pesan diskusi Kelompok ${selectedGroup}...`}
                        className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 3: PAPAN SKOR KELOMPOK (Game_Skor) */}
              {activeRightTab === 'skor' && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Papan Skor Kelompok (Sheet: Game_Skor)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {[...(arenaState?.scores || [])]
                      .sort((a, b) => b.total_poin - a.total_poin)
                      .map((row, index) => {
                        const choice = arenaState?.choices?.[row.kelompok];
                        return (
                          <div
                            key={row.kelompok}
                            className={`px-3 py-2 rounded-xl border flex items-center justify-between ${
                              index === 0 && row.total_poin > 0
                                ? 'bg-amber-500/15 border-amber-400/50'
                                : 'bg-slate-900/90 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-black text-amber-300">
                                #{index + 1}
                              </span>
                              <div>
                                <div className="text-xs font-extrabold text-white">
                                  Kelompok {row.kelompok}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {choice?.rumah_dipilih
                                    ? `Pilihan Ronde Ini: Rumah ${choice.rumah_dipilih}`
                                    : 'Belum memilih rumah'}
                                </div>
                              </div>
                            </div>
                            <div className="font-mono font-black text-sm text-emerald-300">
                              {row.total_poin} Poin
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB 4: STRUKTUR 3 SHEET BARU GOOGLE SPREADSHEET */}
              {activeRightTab === 'spreadsheet' && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-3 text-xs">
                  <div className="font-extrabold text-violet-300 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Integrasi 3 Sheet Baru Google Spreadsheet</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Fitur ini tidak mengubah sheet lama sama sekali. Skrip Apps Script di{' '}
                    <strong>Ruang Guru</strong> otomatis membuat &amp; menyinkronkan 3 sheet baru berikut:
                  </p>
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-extrabold text-amber-300">1. Sheet &quot;Game_Ronde&quot;</div>
                      <div className="text-slate-400 font-mono mt-0.5">
                        Kolom: id_ronde | soal | rumah_benar | status (menunggu/buka/tutup/meledak) | waktu
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-extrabold text-sky-300">2. Sheet &quot;Game_Pilihan&quot;</div>
                      <div className="text-slate-400 font-mono mt-0.5">
                        Kolom: id_ronde | kelompok | rumah_dipilih | waktu
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="font-extrabold text-emerald-300">3. Sheet &quot;Game_Skor&quot;</div>
                      <div className="text-slate-400 font-mono mt-0.5">
                        Kolom: kelompok | total_poin
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
