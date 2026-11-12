import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  Users,
  Trophy,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Send,
  FileSpreadsheet,
  Info,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Flag,
  BookOpen,
  BarChart3,
  Layers,
  RefreshCw,
  CheckSquare,
  Square,
  FileText,
  Table as TableIcon,
  Award,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Student,
  MenaraAsesmenState,
  AsesmenBankSoalRow,
  AsesmenStimulusRow,
  AsesmenJawabanRow,
  AsesmenQuestionType,
  AsesmenPresentationType,
  AsesmenStimulusType,
  AsesmenTpReference,
  AsesmenKategoriStatement,
} from '../../types/index.ts';
import { StorageService } from '../../utils/storage.ts';
import { sounds } from '../../utils/audio.ts';
import { RealtimePresenceMesh, PresenceMeshMessage } from '../../utils/realtimePresenceMesh.ts';
import {
  MenaraAsesmenEngine,
  CanonicalMenaraAsesmenStore,
} from '../../utils/menaraAsesmenEngine.ts';

interface MenaraAsesmenIndividuModalProps {
  onClose: () => void;
  currentStudent: Student | null;
  onAddXp?: (amount: number, reason: string) => void;
}

export const MenaraAsesmenIndividuModal: React.FC<MenaraAsesmenIndividuModalProps> = ({
  onClose,
  currentStudent,
  onAddXp,
}) => {
  const isTeacherAccount = Boolean(
    currentStudent?.isTeacher ||
      currentStudent?.id?.startsWith('teacher-') ||
      currentStudent?.name?.toLowerCase().includes('rizki bahsoan') ||
      currentStudent?.name?.toLowerCase() === 'kikybahsoan'
  );

  const [activeTab, setActiveTab] = useState<'ujian' | 'guru' | 'hasil' | 'info'>(
    isTeacherAccount ? 'guru' : 'ujian'
  );
  const [teacherSubTab, setTeacherSubTab] = useState<
    'konfigurasi' | 'bank_soal' | 'lobi_pantau' | 'analisis'
  >('konfigurasi');

  // Hydrate langsung tanpa menunggu /api agar di Vercel (https://refleksia-azure.vercel.app/) langsung tampil instan!
  const [asesmenState, setAsesmenState] = useState<MenaraAsesmenState>(() =>
    MenaraAsesmenEngine.getInitialHydratedState(currentStudent, isTeacherAccount)
  );
  const [isServerVerifiedTeacher, setIsServerVerifiedTeacher] = useState<boolean>(isTeacherAccount);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionBusy, setActionBusy] = useState<boolean>(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Daftar TP dari Bank Materi Kota Refleksia
  const [availableTpList, setAvailableTpList] = useState<AsesmenTpReference[]>([]);

  // Form Konfigurasi Guru
  const [judulAsesmen, setJudulAsesmen] = useState<string>(
    'Asesmen Sumatif Mandiri (TKA) — Dasar DKV & Berpikir Komputasional'
  );
  const [selectedTpIds, setSelectedTpIds] = useState<string[]>(['tp-bm-001', 'obj-1']);
  const [durasiMenit, setDurasiMenit] = useState<number>(30);
  const [komposisiJenis, setKomposisiJenis] = useState({
    pg_tunggal: 2,
    pg_mcma: 2,
    pg_kategori: 2,
  });
  const [komposisiPenyajian, setKomposisiPenyajian] = useState({
    tunggal: 3,
    grup: 3,
  });
  const [poinPerJenis, setPoinPerJenis] = useState({
    pg_tunggal: 10,
    pg_mcma: 15,
    pg_kategori_per_pernyataan: 5,
  });
  const [mcmaKreditParsial, setMcmaKreditParsial] = useState<boolean>(true);
  const [acakSoal, setAcakSoal] = useState<boolean>(true);
  const [acakOpsi, setAcakOpsi] = useState<boolean>(true);
  const [izinkanMenyusul, setIzinkanMenyusul] = useState<boolean>(true);
  const [tampilkanPembahasan, setTampilkanPembahasan] = useState<boolean>(false);
  const [xpBonusSelesai, setXpBonusSelesai] = useState<number>(50);
  const [teacherPinInput, setTeacherPinInput] = useState<string>('1234');
  const [configInitialized, setConfigInitialized] = useState<boolean>(false);

  // Form Tambah TP Cepat ke Bank Materi (jika guru ingin menambah TP baru langsung)
  const [showAddTpForm, setShowAddTpForm] = useState<boolean>(false);
  const [newTpMapel, setNewTpMapel] = useState<string>('Dasar-Dasar DKV');
  const [newTpKelas, setNewTpKelas] = useState<string>('X DKV');
  const [newTpGoal, setNewTpGoal] = useState<string>('');
  const [newTpContent, setNewTpContent] = useState<string>('');

  // Editor Soal & Stimulus untuk Guru (Review, Edit, Hapus, Ganti)
  const [editingQuestion, setEditingQuestion] = useState<AsesmenBankSoalRow | null>(null);
  const [editingStimulus, setEditingStimulus] = useState<AsesmenStimulusRow | null>(null);
  const [showKeyPreview, setShowKeyPreview] = useState<boolean>(true);

  // State Pengerjaan Siswa (Tampilan TKA)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [localAnswers, setLocalAnswers] = useState<Record<string, { jawaban: string; ragu: boolean; waktu: string }>>({});
  const [dirtyAnswerIds, setDirtyAnswerIds] = useState<Set<string>>(new Set());
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);
  const [stimulusFoldedMobile, setStimulusFoldedMobile] = useState<boolean>(false);
  const [tabWarningBanner, setTabWarningBanner] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1800);

  const sessionTokenRef = useRef<string>(
    (() => {
      try {
        const key = `asesmen_tok_${currentStudent?.id || 'guest'}`;
        const saved = sessionStorage.getItem(key);
        if (saved) return saved;
        const fresh = `astok-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        sessionStorage.setItem(key, fresh);
        return fresh;
      } catch {
        return `astok-${Date.now()}`;
      }
    })()
  );

  const meshRef = useRef<RealtimePresenceMesh | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const awardedSesiRef = useRef<string | null>(null);
  const autoSubmittedSesiRef = useRef<string | null>(null);
  const lastTabExitLogMsRef = useRef<number>(0);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 4200);
  }, []);

  // Broadcast real-time event ke seluruh perangkat di jaringan berbeda (Global WSS Mesh) & tab lokal
  const publishAsesmenMeshPayload = useCallback(
    (asesmenPayload: Record<string, any>) => {
      const msg: PresenceMeshMessage = {
        type: 'asesmen_tower_event',
        senderId: currentStudent?.id || 'teacher',
        asesmenPayload,
        ts: Date.now(),
      };
      try {
        meshRef.current?.publish(msg);
      } catch {}
      try {
        bcRef.current?.postMessage(msg);
      } catch {}
    },
    [currentStudent?.id]
  );

  // Muat daftar TP dari Bank Materi Kota Refleksia
  useEffect(() => {
    const tps = StorageService.getAvailableAsesmenTpList();
    setAvailableTpList(tps);
  }, []);

  // Fungsi Fetch State dari Server + Fallback Engine (Polling 3.5 detik + SSE/Mesh trigger)
  const fetchMenaraAsesmenState = useCallback(async () => {
    try {
      const result = await MenaraAsesmenEngine.fetchState({
        currentStudent,
        isTeacherAccount,
        teacherPin: teacherPinInput,
      });

      const data = result.data;
      setAsesmenState(data);
      setIsServerVerifiedTeacher(result.isVerifiedTeacher);
      setIsLoading(false);

      if (!configInitialized && data.sesi) {
        setJudulAsesmen(data.sesi.judul_asesmen || 'Asesmen Sumatif Mandiri (TKA)');
        if (Array.isArray(data.sesi.tp_terpilih) && data.sesi.tp_terpilih.length > 0) {
          setSelectedTpIds(data.sesi.tp_terpilih);
        }
        setDurasiMenit(data.sesi.durasi || 30);
        if (data.sesi.komposisi_jenis) setKomposisiJenis(data.sesi.komposisi_jenis);
        if (data.sesi.komposisi_penyajian) setKomposisiPenyajian(data.sesi.komposisi_penyajian);
        if (data.sesi.poin_per_jenis) setPoinPerJenis(data.sesi.poin_per_jenis);
        setMcmaKreditParsial(Boolean(data.sesi.mcma_kredit_parsial));
        setAcakSoal(Boolean(data.sesi.acak_soal));
        setAcakOpsi(Boolean(data.sesi.acak_opsi));
        setIzinkanMenyusul(Boolean(data.sesi.izinkan_menyusul));
        setTampilkanPembahasan(Boolean(data.sesi.tampilkan_pembahasan));
        setXpBonusSelesai(Number(data.sesi.xp_bonus_selesai || 50));
        setConfigInitialized(true);
      }

      // Hydrate jawaban siswa jika belum ada perubahan lokal yang belum tersimpan
      if (data.jawabanSaya && Object.keys(data.jawabanSaya).length > 0) {
        setLocalAnswers((prev) => {
          const merged = { ...prev };
          Object.entries(data.jawabanSaya).forEach(([idSoal, row]) => {
            if (!merged[idSoal]) {
              merged[idSoal] = {
                jawaban: row.jawaban,
                ragu: Boolean(row.ragu),
                waktu: row.waktu,
              };
            }
          });
          return merged;
        });
      }

      // Berikan XP bonus jika siswa selesai mengerjakan sesi ini
      if (
        !result.isVerifiedTeacher &&
        data.hasilSaya &&
        awardedSesiRef.current !== data.sesi.id_sesi
      ) {
        awardedSesiRef.current = data.sesi.id_sesi;
        const xpReward = data.sesi.xp_bonus_selesai || 50;
        if (onAddXp) {
          onAddXp(
            xpReward,
            `Menyelesaikan Asesmen Sumatif Mandiri di Menara Asesmen Individu (${data.sesi.id_sesi})`
          );
        }
        sounds.playSuccess();
      }
    } catch {
      setIsLoading(false);
    }
  }, [currentStudent, isTeacherAccount, teacherPinInput, configInitialized, onAddXp]);

  // Setup Polling (setiap 3.5 detik sesuai aturan 3-5 detik) + SSE + MQTT Mesh + BroadcastChannel
  useEffect(() => {
    fetchMenaraAsesmenState();
    const pollInterval = window.setInterval(fetchMenaraAsesmenState, 3500);

    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/presence/stream');
      es.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data);
          if (parsed?.type === 'asesmen_tower_tick') {
            fetchMenaraAsesmenState();
          }
        } catch {}
      };
    } catch {}

    const handleIncomingMeshMessage = (msg: PresenceMeshMessage) => {
      if (msg.type === 'asesmen_tower_event') {
        const payload = msg.asesmenPayload;
        if (payload?.eventType === 'state_sync' && payload.store) {
          const nextView = MenaraAsesmenEngine.mergeIncomingMeshStore(
            payload.store as CanonicalMenaraAsesmenStore,
            currentStudent,
            isTeacherAccount
          );
          if (nextView) {
            setAsesmenState(nextView);
          }
        } else if (payload?.eventType === 'student_sync' && payload.studentPacket) {
          const nextView = MenaraAsesmenEngine.mergeIncomingStudentPacket(
            payload.studentPacket,
            currentStudent,
            isTeacherAccount
          );
          if (nextView) {
            setAsesmenState(nextView);
          }
        }
        fetchMenaraAsesmenState();
      } else if (
        msg.type === 'asesmen_tower_request' &&
        isTeacherAccount &&
        msg.senderId !== (currentStudent?.id || 'teacher')
      ) {
        // Jika ada siswa baru membuka Menara Asesmen di Vercel, Guru otomatis mengirim Canonical Store terbaru!
        publishAsesmenMeshPayload({
          eventType: 'state_sync',
          store: MenaraAsesmenEngine.getLocalCanonicalStore(),
        });
      }
    };

    const mesh = new RealtimePresenceMesh(
      `asesmen-${currentStudent?.id || 'guest'}`,
      handleIncomingMeshMessage,
      () => {
        // Saat terhubung ke WSS Mesh, minta state terbaru dari Guru/peer
        mesh.publish({
          type: 'asesmen_tower_request',
          senderId: currentStudent?.id || 'guest',
          ts: Date.now(),
        });
      }
    );
    meshRef.current = mesh;

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('kota_refleksi_menara_asesmen');
        bcRef.current = bc;
        bc.onmessage = (ev) => {
          if (ev.data) {
            handleIncomingMeshMessage(ev.data as PresenceMeshMessage);
          }
        };
        bc.postMessage({
          type: 'asesmen_tower_request',
          senderId: currentStudent?.id || 'guest',
          ts: Date.now(),
        });
      }
    } catch {}

    return () => {
      clearInterval(pollInterval);
      if (es) es.close();
      mesh.dispose();
      meshRef.current = null;
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
      bcRef.current = null;
    };
  }, [fetchMenaraAsesmenState, currentStudent, isTeacherAccount, publishAsesmenMeshPayload]);

  // Hitung mundur timer ujian secara akurat
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!asesmenState?.sesi) return;
      const sesi = asesmenState.sesi;
      const totalDurationSec =
        (Number(sesi.durasi || 30) + Number(sesi.tambahan_waktu_menit || 0)) * 60;

      if (sesi.status === 'draf' || sesi.status === 'lobi') {
        setRemainingSeconds(totalDurationSec);
        return;
      }
      if (sesi.status === 'selesai') {
        setRemainingSeconds(0);
        return;
      }
      if (!sesi.waktu_mulai_ms) {
        setRemainingSeconds(totalDurationSec);
        return;
      }

      const now =
        sesi.status === 'jeda' && sesi.waktu_jeda_ms ? sesi.waktu_jeda_ms : Date.now();
      const elapsedSec = Math.max(
        0,
        Math.floor((now - sesi.waktu_mulai_ms - (sesi.total_durasi_jeda_ms || 0)) / 1000)
      );
      const rem = Math.max(0, totalDurationSec - elapsedSec);
      setRemainingSeconds(rem);
    }, 500);
    return () => clearInterval(timer);
  }, [asesmenState?.sesi]);

  // Urutan soal milik siswa sesuai Paket Siswa (atau urutan default bagi guru)
  const orderedQuestionsForStudent = useMemo((): AsesmenBankSoalRow[] => {
    if (!asesmenState?.bankSoal) return [];
    const mapById = new Map<string, AsesmenBankSoalRow>();
    asesmenState.bankSoal.forEach((q) => mapById.set(q.id_soal, q));

    const urutan = asesmenState.paketSaya?.urutan_soal;
    if (Array.isArray(urutan) && urutan.length > 0) {
      const ordered = urutan
        .map((id) => mapById.get(id))
        .filter((q): q is AsesmenBankSoalRow => Boolean(q));
      if (ordered.length > 0) return ordered;
    }
    return asesmenState.bankSoal;
  }, [asesmenState?.bankSoal, asesmenState?.paketSaya]);

  const activeStudentQuestion = useMemo(() => {
    if (orderedQuestionsForStudent.length === 0) return null;
    const safeIdx = Math.max(
      0,
      Math.min(orderedQuestionsForStudent.length - 1, currentQuestionIdx)
    );
    return orderedQuestionsForStudent[safeIdx] || null;
  }, [orderedQuestionsForStudent, currentQuestionIdx]);

  const activeStimulus = useMemo((): AsesmenStimulusRow | null => {
    if (
      !activeStudentQuestion ||
      activeStudentQuestion.tipe_penyajian !== 'grup' ||
      !activeStudentQuestion.id_stimulus
    ) {
      return null;
    }
    return (
      asesmenState?.stimulusList?.find(
        (s) => s.id_stimulus === activeStudentQuestion.id_stimulus
      ) || null
    );
  }, [activeStudentQuestion, asesmenState?.stimulusList]);

  // Fungsi Batch Auto-Save Jawaban Siswa ke Server, Mesh & Google Spreadsheet
  const flushDirtyAnswersBatch = useCallback(
    async (forceAll = false, nextQuestionNum?: number) => {
      if (!currentStudent || isServerVerifiedTeacher || !asesmenState?.sesi) return;
      if (asesmenState.hasilSaya) return;

      const idsToPush = forceAll
        ? Object.keys(localAnswers)
        : Array.from(dirtyAnswerIds);
      if (idsToPush.length === 0 && typeof nextQuestionNum !== 'number') return;

      const batchPayload: AsesmenJawabanRow[] = idsToPush.map((idSoal) => {
        const item = localAnswers[idSoal];
        return {
          id_sesi: asesmenState.sesi.id_sesi,
          siswa: currentStudent.id,
          nama_siswa: currentStudent.name,
          id_soal: idSoal,
          jawaban: item?.jawaban || '',
          ragu: Boolean(item?.ragu),
          waktu: item?.waktu || new Date().toLocaleString('id-ID'),
        };
      });

      try {
        setDirtyAnswerIds(new Set());
        const res = await MenaraAsesmenEngine.executeStudentAction({
          actionType: 'save_answers_batch',
          currentStudent,
          sessionToken: sessionTokenRef.current,
          answersBatch: batchPayload,
          activeQuestionNumber:
            typeof nextQuestionNum === 'number'
              ? nextQuestionNum
              : currentQuestionIdx + 1,
        });

        publishAsesmenMeshPayload({
          eventType: 'student_sync',
          studentPacket: res.studentSyncPacket,
        });

        if (batchPayload.length > 0) {
          StorageService.syncAsesmenJawabanBatchToGAS(batchPayload).catch(() => {});
        }
      } catch {}
    },
    [
      currentStudent,
      isServerVerifiedTeacher,
      asesmenState?.sesi,
      asesmenState?.hasilSaya,
      localAnswers,
      dirtyAnswerIds,
      currentQuestionIdx,
      publishAsesmenMeshPayload,
    ]
  );

  // Batch auto-save setiap 12 detik jika ada jawaban yang berubah
  useEffect(() => {
    if (isServerVerifiedTeacher || asesmenState?.sesi.status !== 'berjalan') return;
    const batchTimer = window.setInterval(() => {
      if (dirtyAnswerIds.size > 0) {
        flushDirtyAnswersBatch(false);
      }
    }, 12000);
    return () => clearInterval(batchTimer);
  }, [isServerVerifiedTeacher, asesmenState?.sesi.status, dirtyAnswerIds, flushDirtyAnswersBatch]);

  // Deteksi siswa keluar tab / pindah aplikasi saat asesmen sedang berjalan
  useEffect(() => {
    if (isServerVerifiedTeacher) return;
    const isWorking =
      asesmenState?.sesi.status === 'berjalan' &&
      !asesmenState?.hasilSaya &&
      Boolean(asesmenState?.paketSaya);
    if (!isWorking || !currentStudent) return;

    const recordTabSwitch = async (reason: string) => {
      const now = Date.now();
      if (now - lastTabExitLogMsRef.current < 2500) return;
      lastTabExitLogMsRef.current = now;

      setTabWarningBanner(
        `⚠️ Peringatan Integritas Asesmen: Sistem mencatat Anda keluar dari tab/jendela ujian (${reason}). Aktivitas ini tampil langsung di Panel Pantauan Guru.`
      );
      sounds.playError?.();

      const res = await MenaraAsesmenEngine.executeStudentAction({
        actionType: 'log_tab_exit',
        currentStudent,
        sessionToken: sessionTokenRef.current,
        tabExitReason: reason,
      });

      setAsesmenState(res.data);
      publishAsesmenMeshPayload({
        eventType: 'student_sync',
        studentPacket: res.studentSyncPacket,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordTabSwitch('Berpindah Tab Browser');
      }
    };
    const handleWindowBlur = () => {
      recordTabSwitch('Jendela Aplikasi Tidak Aktif');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [
    isServerVerifiedTeacher,
    asesmenState?.sesi.status,
    asesmenState?.hasilSaya,
    asesmenState?.paketSaya,
    currentStudent,
    publishAsesmenMeshPayload,
  ]);

  // Auto-submit ketika waktu habis (00:00)
  useEffect(() => {
    if (
      !isServerVerifiedTeacher &&
      asesmenState?.sesi.status === 'berjalan' &&
      !asesmenState?.hasilSaya &&
      asesmenState?.paketSaya &&
      remainingSeconds === 0 &&
      autoSubmittedSesiRef.current !== asesmenState.sesi.id_sesi
    ) {
      autoSubmittedSesiRef.current = asesmenState.sesi.id_sesi;
      handleSubmitExamFinal(true);
    }
  }, [
    remainingSeconds,
    isServerVerifiedTeacher,
    asesmenState?.sesi,
    asesmenState?.hasilSaya,
    asesmenState?.paketSaya,
  ]);

  // Handler Siswa: Gabung Lobi
  const handleStudentJoinLobby = async () => {
    if (!currentStudent) return;
    setActionBusy(true);
    try {
      const res = await MenaraAsesmenEngine.executeStudentAction({
        actionType: 'join_lobby',
        currentStudent,
        sessionToken: sessionTokenRef.current,
      });
      setAsesmenState(res.data);
      sounds.playClick();
      showToast('✅ Berhasil masuk ke Lobi Menara Asesmen Individu!');
      publishAsesmenMeshPayload({
        eventType: 'student_sync',
        studentPacket: res.studentSyncPacket,
      });
    } catch {
      showToast('Gagal bergabung ke lobi Menara Asesmen.');
    } finally {
      setActionBusy(false);
    }
  };

  // Handler Siswa: Pilih / Ubah Jawaban Lokal
  const handleSelectAnswer = (idSoal: string, newJawaban: string) => {
    sounds.playClick();
    const nowStr = new Date().toLocaleString('id-ID');
    setLocalAnswers((prev) => ({
      ...prev,
      [idSoal]: {
        jawaban: newJawaban,
        ragu: prev[idSoal]?.ragu || false,
        waktu: nowStr,
      },
    }));
    setDirtyAnswerIds((prev) => {
      const next = new Set(prev);
      next.add(idSoal);
      return next;
    });
  };

  // Handler Siswa: Tandai Ragu-ragu
  const handleToggleRagu = (idSoal: string) => {
    sounds.playClick();
    const nowStr = new Date().toLocaleString('id-ID');
    setLocalAnswers((prev) => ({
      ...prev,
      [idSoal]: {
        jawaban: prev[idSoal]?.jawaban || '',
        ragu: !prev[idSoal]?.ragu,
        waktu: nowStr,
      },
    }));
    setDirtyAnswerIds((prev) => {
      const next = new Set(prev);
      next.add(idSoal);
      return next;
    });
  };

  // Handler Siswa: Navigasi Soal (Sebelumnya / Selanjutnya / Nomor Soal) + Auto-Save Batch
  const handleNavigateQuestion = (targetIdx: number) => {
    const clamped = Math.max(
      0,
      Math.min(orderedQuestionsForStudent.length - 1, targetIdx)
    );
    sounds.playClick();
    setCurrentQuestionIdx(clamped);
    if (dirtyAnswerIds.size > 0) {
      flushDirtyAnswersBatch(false, clamped + 1);
    }
  };

  // Handler Siswa: Kumpulkan Ujian Final
  const handleSubmitExamFinal = async (isAutoTimeout = false) => {
    if (!currentStudent || !asesmenState?.sesi) return;
    setActionBusy(true);
    setShowSubmitConfirmModal(false);

    const allAnswersPayload: AsesmenJawabanRow[] = orderedQuestionsForStudent.map((q) => {
      const item = localAnswers[q.id_soal];
      return {
        id_sesi: asesmenState.sesi.id_sesi,
        siswa: currentStudent.id,
        nama_siswa: currentStudent.name,
        id_soal: q.id_soal,
        jawaban: item?.jawaban || '',
        ragu: false,
        waktu: item?.waktu || new Date().toLocaleString('id-ID'),
      };
    });

    try {
      const res = await MenaraAsesmenEngine.executeStudentAction({
        actionType: 'submit_exam',
        currentStudent,
        sessionToken: sessionTokenRef.current,
        answersBatch: allAnswersPayload,
      });

      setAsesmenState(res.data);
      setDirtyAnswerIds(new Set());
      sounds.playSuccess();
      showToast(
        isAutoTimeout
          ? '⏰ Waktu ujian habis! Jawaban Anda otomatis dikumpulkan dan dinilai.'
          : '🎉 Jawaban Asesmen Anda berhasil dikumpulkan!'
      );
      StorageService.syncAsesmenJawabanBatchToGAS(allAnswersPayload).catch(() => {});
      if (res.hasil) {
        StorageService.syncAsesmenHasilToGAS([res.hasil]).catch(() => {});
      }
      publishAsesmenMeshPayload({
        eventType: 'student_sync',
        studentPacket: res.studentSyncPacket,
      });
    } catch {
      showToast('Gagal mengumpulkan jawaban. Coba lagi.');
    } finally {
      setActionBusy(false);
    }
  };

  // Handler Guru: Pilih 1-5 TP dari Bank Materi
  const handleToggleSelectTp = (idTp: string) => {
    sounds.playClick();
    setSelectedTpIds((prev) => {
      if (prev.includes(idTp)) {
        if (prev.length <= 1) {
          showToast('Minimal 1 Tujuan Pembelajaran (TP) harus dipilih.');
          return prev;
        }
        return prev.filter((id) => id !== idTp);
      } else {
        if (prev.length >= 5) {
          showToast('Maksimal 5 Tujuan Pembelajaran (TP) dapat dipilih dalam satu sesi asesmen.');
          return prev;
        }
        return [...prev, idTp];
      }
    });
  };

  // Handler Guru: Tambah TP Baru ke Bank Materi
  const handleAddCustomTpToBankMateri = () => {
    if (!newTpGoal.trim()) {
      showToast('Isi Tujuan Pembelajaran (TP) terlebih dahulu.');
      return;
    }
    const newId = `tp-custom-${Date.now().toString(36).slice(-4)}`;
    const newEntry: AsesmenTpReference = {
      id_tp: newId,
      mata_pelajaran: newTpMapel.trim() || 'Dasar-Dasar DKV',
      kelas: newTpKelas.trim() || 'X DKV',
      tujuan_pembelajaran: newTpGoal.trim(),
      isi_materi: newTpContent.trim() || newTpGoal.trim(),
    };
    setAvailableTpList((prev) => [newEntry, ...prev]);
    if (selectedTpIds.length < 5) {
      setSelectedTpIds((prev) => [...prev, newId]);
    }
    setNewTpGoal('');
    setNewTpContent('');
    setShowAddTpForm(false);
    sounds.playSuccess();
    showToast('✅ Tujuan Pembelajaran baru ditambahkan & dipilih!');
  };

  // Handler Guru: Simpan Konfigurasi Sesi
  const handleSaveTeacherConfig = async () => {
    setActionBusy(true);
    try {
      const selectedTpDetails = availableTpList.filter((t) =>
        selectedTpIds.includes(t.id_tp)
      );
      const totalSoal =
        Number(komposisiJenis.pg_tunggal || 0) +
        Number(komposisiJenis.pg_mcma || 0) +
        Number(komposisiJenis.pg_kategori || 0);

      const res = await MenaraAsesmenEngine.executeTeacherAction({
        actionType: 'save_config',
        currentStudent,
        isTeacherAccount,
        teacherPin: teacherPinInput,
        sesiConfig: {
          judul_asesmen: judulAsesmen,
          tp_terpilih: selectedTpIds,
          tp_detail: selectedTpDetails,
          durasi: durasiMenit,
          jumlah_soal: totalSoal,
          komposisi_jenis: komposisiJenis,
          komposisi_penyajian: komposisiPenyajian,
          poin_per_jenis: poinPerJenis,
          mcma_kredit_parsial: mcmaKreditParsial,
          acak_soal: acakSoal,
          acak_opsi: acakOpsi,
          izinkan_menyusul: izinkanMenyusul,
          tampilkan_pembahasan: tampilkanPembahasan,
          xp_bonus_selesai: xpBonusSelesai,
        },
      });

      setAsesmenState(res.data);
      sounds.playSuccess();
      showToast('✅ Pengaturan Sesi Asesmen berhasil disimpan!');
      publishAsesmenMeshPayload({
        eventType: 'state_sync',
        store: res.canonicalStore,
      });
    } catch {
      showToast('Gagal menyimpan konfigurasi.');
    } finally {
      setActionBusy(false);
    }
  };

  // Handler Guru: Generate Soal Otomatis dengan Gemini API / Adaptive Engine dari Bank Materi
  const handleGenerateQuestionsWithAI = async () => {
    if (selectedTpIds.length === 0) {
      showToast('Pilih minimal 1 Tujuan Pembelajaran (TP) dari Bank Materi.');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const selectedTpDetails = availableTpList.filter((t) =>
        selectedTpIds.includes(t.id_tp)
      );
      const totalSoal =
        Number(komposisiJenis.pg_tunggal || 0) +
        Number(komposisiJenis.pg_mcma || 0) +
        Number(komposisiJenis.pg_kategori || 0);

      const res = await MenaraAsesmenEngine.generateQuestions({
        currentStudent,
        isTeacherAccount,
        teacherPin: teacherPinInput,
        tpDetailList: selectedTpDetails,
        jumlahSoal: totalSoal,
        komposisiJenis,
        komposisiPenyajian,
        poinPerJenis,
      });

      setAsesmenState(res.data);
      setTeacherSubTab('bank_soal');
      sounds.playRewardXp();
      showToast(
        res.message ||
          '✨ Soal TKA berhasil di-generate! Silakan tinjau, edit, dan periksa kunci jawaban.'
      );
      publishAsesmenMeshPayload({
        eventType: 'state_sync',
        store: res.canonicalStore,
      });
    } catch {
      showToast('Terjadi kesalahan saat men-generate soal.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handler Guru: Aksi Sesi (Buka Lobi, Mulai Asesmen, Tambah Waktu, Jeda, Lanjut, Akhiri Paksa, Reset)
  const handleTeacherSessionAction = async (
    actionType:
      | 'buka_lobi'
      | 'mulai_asesmen'
      | 'tambah_waktu'
      | 'jeda'
      | 'lanjut'
      | 'akhiri_paksa'
      | 'reset_sesi',
    extraMinutes?: number
  ) => {
    setActionBusy(true);
    try {
      const res = await MenaraAsesmenEngine.executeTeacherAction({
        actionType,
        currentStudent,
        isTeacherAccount,
        teacherPin: teacherPinInput,
        extraMinutes,
      });

      const nextData = res.data;
      setAsesmenState(nextData);
      sounds.playSuccess();

      if (actionType === 'buka_lobi') {
        setTeacherSubTab('lobi_pantau');
        showToast('🚪 Lobi Asesmen DIBUKA! Siswa kini dapat masuk dan menunggu di lobi.');
        StorageService.syncAsesmenSessionAndBankToGAS({
          sesi: nextData.sesi,
          bankSoal: nextData.bankSoal,
          stimulusList: nextData.stimulusList,
          teacherId: currentStudent?.id || 'teacher-1',
          teacherName: currentStudent?.name || 'Guru',
          teacherPin: teacherPinInput,
        }).catch(() => {});
      } else if (actionType === 'mulai_asesmen') {
        showToast('🚀 ASESMEN DIMULAI! Soal tampil serentak di layar seluruh siswa di lobi.');
        StorageService.syncAsesmenSessionAndBankToGAS({
          sesi: nextData.sesi,
          bankSoal: nextData.bankSoal,
          stimulusList: nextData.stimulusList,
          teacherId: currentStudent?.id || 'teacher-1',
          teacherName: currentStudent?.name || 'Guru',
          teacherPin: teacherPinInput,
        }).catch(() => {});
      } else if (actionType === 'tambah_waktu') {
        showToast(`⏱️ Waktu asesmen ditambah +${extraMinutes || 5} menit!`);
      } else if (actionType === 'jeda') {
        showToast('⏸️ Asesmen dijeda sementara.');
      } else if (actionType === 'lanjut') {
        showToast('▶️ Asesmen dilanjutkan kembali.');
      } else if (actionType === 'akhiri_paksa') {
        setTeacherSubTab('analisis');
        showToast('🛑 Asesmen diakhiri! Seluruh jawaban siswa telah dinilai otomatis.');
        if (nextData.semuaHasil && nextData.semuaHasil.length > 0) {
          StorageService.syncAsesmenHasilToGAS(nextData.semuaHasil).catch(() => {});
        }
      } else if (actionType === 'reset_sesi') {
        setLocalAnswers({});
        showToast('🔄 Sesi baru siap! Data lobi & peserta telah direset.');
      }

      publishAsesmenMeshPayload({
        eventType: 'state_sync',
        store: res.canonicalStore,
      });
    } catch {
      showToast('Gagal menjalankan aksi sesi.');
    } finally {
      setActionBusy(false);
    }
  };

  // Handler Guru: Simpan / Edit / Ganti Soal
  const handleSaveEditedQuestion = async () => {
    if (!editingQuestion) return;
    if (!editingQuestion.teks_soal.trim()) {
      showToast('Teks soal tidak boleh kosong.');
      return;
    }
    setActionBusy(true);
    try {
      const res = await MenaraAsesmenEngine.executeTeacherAction({
        actionType: 'save_question',
        currentStudent,
        isTeacherAccount,
        teacherPin: teacherPinInput,
        questionItem: editingQuestion,
      });

      setAsesmenState(res.data);
      setEditingQuestion(null);
      sounds.playSuccess();
      showToast('✅ Butir soal & kunci jawaban berhasil disimpan!');
      publishAsesmenMeshPayload({
        eventType: 'state_sync',
        store: res.canonicalStore,
      });
    } catch {
      showToast('Gagal menyimpan butir soal.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeleteQuestion = async (idSoal: string) => {
    setActionBusy(true);
    try {
      const res = await MenaraAsesmenEngine.executeTeacherAction({
        actionType: 'delete_question',
        currentStudent,
        isTeacherAccount,
        teacherPin: teacherPinInput,
        questionId: idSoal,
      });

      setAsesmenState(res.data);
      sounds.playClick();
      showToast(`🗑️ Soal ${idSoal} dihapus dari Bank Soal sesi.`);
      publishAsesmenMeshPayload({
        eventType: 'state_sync',
        store: res.canonicalStore,
      });
    } catch {} finally {
      setActionBusy(false);
    }
  };

  const handleSaveEditedStimulus = async () => {
    if (!editingStimulus) return;
    setActionBusy(true);
    try {
      const res = await MenaraAsesmenEngine.executeTeacherAction({
        actionType: 'save_stimulus',
        currentStudent,
        isTeacherAccount,
        teacherPin: teacherPinInput,
        stimulusItem: editingStimulus,
      });

      setAsesmenState(res.data);
      setEditingStimulus(null);
      sounds.playSuccess();
      showToast('✅ Stimulus soal grup berhasil disimpan!');
      publishAsesmenMeshPayload({
        eventType: 'state_sync',
        store: res.canonicalStore,
      });
    } catch {
      showToast('Gagal menyimpan stimulus.');
    } finally {
      setActionBusy(false);
    }
  };

  // Handler Guru: Ekspor Semua Data Sesi & Hasil ke Google Spreadsheet
  const handleExportToSpreadsheet = async () => {
    if (!asesmenState) return;
    setActionBusy(true);
    try {
      const ok1 = await StorageService.syncAsesmenSessionAndBankToGAS({
        sesi: asesmenState.sesi,
        bankSoal: asesmenState.bankSoal,
        stimulusList: asesmenState.stimulusList,
        teacherId: currentStudent?.id || 'teacher-1',
        teacherName: currentStudent?.name || 'Guru',
        teacherPin: teacherPinInput,
      });
      if (asesmenState.semuaHasil && asesmenState.semuaHasil.length > 0) {
        await StorageService.syncAsesmenHasilToGAS(asesmenState.semuaHasil);
      }

      // Unduh juga CSV Rekap Hasil agar guru langsung punya salinan lokal sekaligus sinkron ke Sheet
      const csvRows = [
        [
          'ID Sesi',
          'ID Siswa',
          'Nama Siswa',
          'Kelas',
          'Nilai Akhir (0-100)',
          'Poin Diperoleh',
          'Poin Maksimal',
          'Jumlah Soal Benar Penuh',
          'Total Soal',
          'Durasi (Detik)',
          'Peringatan Keluar Tab',
          'Waktu Selesai',
        ].join(','),
        ...(asesmenState.semuaHasil || []).map((r) =>
          [
            `"${r.id_sesi}"`,
            `"${r.siswa}"`,
            `"${r.nama_siswa}"`,
            `"${r.kelas}"`,
            r.nilai,
            r.poin_diperoleh,
            r.poin_maksimal,
            r.jumlah_benar,
            r.jumlah_soal,
            r.durasi,
            r.keluar_tab,
            `"${r.waktu_selesai}"`,
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rekap_Menara_Asesmen_${asesmenState.sesi.id_sesi}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      sounds.playRewardXp();
      showToast(
        ok1
          ? '📊 Data berhasil diekspor ke 6 Sheet Google Spreadsheet & file CSV terunduh!'
          : '📥 File CSV Rekap Nilai terunduh! (Pastikan URL Apps Script diisi di Ruang Guru untuk sinkron Cloud).'
      );
    } catch {
      showToast('Gagal mengekspor data.');
    } finally {
      setActionBusy(false);
    }
  };

  const formatTimerMMSS = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Helper Cek Status Jawaban Siswa untuk Navigasi Nomor Soal (Belum Dijawab / Sudah Dijawab / Ragu-ragu)
  const getQuestionAnswerState = (q: AsesmenBankSoalRow): 'unanswered' | 'answered' | 'doubtful' => {
    const item = localAnswers[q.id_soal];
    if (!item) return 'unanswered';
    if (item.ragu) return 'doubtful';
    const raw = String(item.jawaban || '').trim();
    if (!raw || raw === '[]' || raw === '{}') return 'unanswered';
    if (q.jenis === 'pg_kategori') {
      try {
        const map = JSON.parse(raw);
        const stmts = q.pernyataan_kategori || [];
        const answeredCount = stmts.filter((s) => map[s.id_pernyataan] === 'A' || map[s.id_pernyataan] === 'B').length;
        return answeredCount > 0 ? 'answered' : 'unanswered';
      } catch {
        return 'unanswered';
      }
    }
    return 'answered';
  };

  // Ringkasan progres jawaban siswa saat ini
  const studentProgressSummary = useMemo(() => {
    let answered = 0;
    let doubtful = 0;
    let unanswered = 0;
    orderedQuestionsForStudent.forEach((q) => {
      const st = getQuestionAnswerState(q);
      if (st === 'doubtful') doubtful++;
      else if (st === 'answered') answered++;
      else unanswered++;
    });
    return {
      answered,
      doubtful,
      unanswered,
      total: orderedQuestionsForStudent.length,
    };
  }, [orderedQuestionsForStudent, localAnswers]);

  // Render Stimulus (Teks / Tabel / Grafik)
  const renderStimulusContent = (stim: AsesmenStimulusRow) => {
    if (stim.jenis === 'tabel') {
      try {
        const parsed = JSON.parse(stim.isi);
        if (Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
          return (
            <div className="overflow-x-auto rounded-xl border border-sky-500/30 bg-slate-950/70">
              <table className="w-full text-left text-xs text-slate-200 border-collapse">
                <thead>
                  <tr className="bg-sky-900/50 text-sky-200 border-b border-sky-500/30">
                    {parsed.headers.map((h: string, i: number) => (
                      <th key={i} className="px-3 py-2.5 font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((row: string[], rIdx: number) => (
                    <tr
                      key={rIdx}
                      className="border-b border-white/10 odd:bg-white/[0.02] hover:bg-sky-500/10"
                    >
                      {row.map((cell: string, cIdx: number) => (
                        <td key={cIdx} className="px-3 py-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      } catch {}
    }

    if (stim.jenis === 'grafik') {
      try {
        const parsed = JSON.parse(stim.isi);
        if (Array.isArray(parsed.bars)) {
          const maxVal = Math.max(100, ...parsed.bars.map((b: any) => Number(b.value) || 0));
          return (
            <div className="p-4 rounded-xl border border-sky-500/30 bg-slate-950/80 space-y-3">
              <div className="text-xs font-bold text-sky-300 flex items-center justify-between">
                <span>📊 {parsed.title || stim.judul || 'Grafik Data Stimulus'}</span>
                <span className="text-[11px] text-slate-400">Satuan: {parsed.unit || '%'}</span>
              </div>
              <div className="space-y-2.5">
                {parsed.bars.map((bar: any, idx: number) => {
                  const val = Number(bar.value) || 0;
                  const widthPct = Math.max(6, Math.min(100, Math.round((val / maxVal) * 100)));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-200 font-medium">{bar.label}</span>
                        <span className="font-bold text-sky-300">
                          {val} {parsed.unit || '%'}
                        </span>
                      </div>
                      <div className="h-3.5 w-full rounded-lg bg-slate-800 overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-md transition-all duration-500"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: bar.color || '#38bdf8',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
      } catch {}
    }

    return (
      <div className="p-4 rounded-xl border border-sky-500/25 bg-slate-950/70 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
        {stim.isi}
      </div>
    );
  };

  const sesi = asesmenState?.sesi;
  const myLiveEntry = useMemo(() => {
    if (!currentStudent || !asesmenState?.pesertaLive) return null;
    return (
      asesmenState.pesertaLive.find((p) => p.studentId === currentStudent.id) || null
    );
  }, [currentStudent, asesmenState?.pesertaLive]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900/95 border border-sky-500/35 rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[110] px-5 py-3 rounded-2xl bg-sky-600/95 text-white text-xs sm:text-sm font-bold shadow-2xl border border-sky-300/40 flex items-center gap-2 animate-in slide-in-from-top-3">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-b border-sky-500/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              📝
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-sky-500/25 text-sky-300 border border-sky-400/30">
                  REFLEKSIA TIMUR • TKA INDIVIDU
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    sesi?.status === 'berjalan'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 animate-pulse'
                      : sesi?.status === 'lobi'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      : sesi?.status === 'jeda'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-400/40'
                      : sesi?.status === 'selesai'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-400/40'
                      : 'bg-slate-700/60 text-slate-300 border-slate-600'
                  }`}
                >
                  STATUS: {(sesi?.status || 'DRAF').toUpperCase()}
                </span>
                {sesi && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {sesi.id_sesi}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-xl font-black text-white truncate">
                Menara Asesmen Individu
              </h2>
            </div>
          </div>

          {/* Timer & Close */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {(sesi?.status === 'berjalan' || sesi?.status === 'jeda') && (
              <div
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs sm:text-sm font-black ${
                  remainingSeconds <= 180
                    ? 'bg-rose-950/90 border-rose-500/60 text-rose-300 animate-pulse'
                    : 'bg-slate-950/90 border-sky-500/40 text-sky-300'
                }`}
              >
                <Clock className="w-4 h-4 text-sky-400" />
                <span>{formatTimerMMSS(remainingSeconds)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Tutup Jendela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 py-2 bg-slate-950/70 border-b border-white/10 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('ujian');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'ujian'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Lobi & Lembar Asesmen (TKA)</span>
          </button>

          {isTeacherAccount && (
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('guru');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'guru'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-white/5 text-indigo-300 hover:bg-white/10 border border-indigo-500/30'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Panel Guru ({asesmenState?.bankSoal?.length || 0} Soal)</span>
            </button>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('hasil');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'hasil'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Hasil & Pembahasan</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('info');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'info'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Panduan TKA & Struktur Sheet</span>
          </button>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-300 font-semibold">
                Memuat ruang Menara Asesmen Individu...
              </p>
            </div>
          ) : (
            <>
              {/* ============================================================
                  TAB 1: LOBI & LEMBAR ASESMEN SISWA (TAMPILAN MIRIP TKA / CBT)
              ============================================================ */}
              {activeTab === 'ujian' && (
                <div className="space-y-4">
                  {/* Peringatan Keluar Tab */}
                  {tabWarningBanner && (
                    <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                        <span>{tabWarningBanner}</span>
                      </div>
                      <button
                        onClick={() => setTabWarningBanner(null)}
                        className="px-2.5 py-1 rounded-lg bg-rose-800/60 hover:bg-rose-700 text-white font-bold shrink-0"
                      >
                        Mengerti
                      </button>
                    </div>
                  )}

                  {/* KONDISI A: Siswa sudah selesai mengerjakan */}
                  {asesmenState?.hasilSaya ? (
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-sky-950/80 border border-emerald-500/40 text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-3xl">
                        🎓
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                          ASESMEN SUMATIF MANDIRI SELESAI
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white">
                          Terima Kasih, {currentStudent?.name}!
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                          Jawaban Anda pada sesi <b>{sesi?.judul_asesmen}</b> telah tersimpan aman di server dan Google Spreadsheet.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
                        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10">
                          <div className="text-[11px] text-slate-400">Nilai Akhir</div>
                          <div className="text-2xl font-black text-emerald-400">
                            {sesi?.tampilkan_pembahasan || sesi?.status === 'selesai'
                              ? asesmenState.hasilSaya.nilai
                              : '🔒 Menunggu'}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10">
                          <div className="text-[11px] text-slate-400">Soal Benar Penuh</div>
                          <div className="text-lg font-black text-sky-300">
                            {sesi?.tampilkan_pembahasan || sesi?.status === 'selesai'
                              ? `${asesmenState.hasilSaya.jumlah_benar} / ${asesmenState.hasilSaya.jumlah_soal}`
                              : 'Tersimpan'}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10">
                          <div className="text-[11px] text-slate-400">Durasi Kerja</div>
                          <div className="text-lg font-black text-amber-300">
                            {Math.ceil(asesmenState.hasilSaya.durasi / 60)} Menit
                          </div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10">
                          <div className="text-[11px] text-slate-400">Catatan Keluar Tab</div>
                          <div className="text-lg font-black text-rose-300">
                            {asesmenState.hasilSaya.keluar_tab}x
                          </div>
                        </div>
                      </div>

                      {sesi?.tampilkan_pembahasan && (
                        <div className="pt-2">
                          <button
                            onClick={() => setActiveTab('hasil')}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg"
                          >
                            📖 Lihat Kunci Jawaban & Pembahasan Lengkap
                          </button>
                        </div>
                      )}
                    </div>
                  ) : sesi?.status === 'draf' ? (
                    /* KONDISI B: Status masih Draf (Lobi belum dibuka guru) */
                    <div className="p-8 rounded-3xl bg-slate-950/70 border border-sky-500/25 text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center mx-auto text-3xl">
                        ⏳
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        Menunggu Guru Membuka Lobi Asesmen
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                        Saat ini Guru sedang menyiapkan soal dari <b>Bank Materi Kota Refleksia</b>. Begitu Guru menekan tombol <b>&quot;Buka Lobi&quot;</b>, Anda dapat langsung bergabung ke ruang tunggu.
                      </p>
                      {isTeacherAccount && (
                        <button
                          onClick={() => setActiveTab('guru')}
                          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                        >
                          ⚙️ Buka Panel Guru untuk Mengatur Sesi
                        </button>
                      )}
                    </div>
                  ) : sesi?.status === 'lobi' || (!myLiveEntry && !isTeacherAccount) ? (
                    /* KONDISI C: Lobi Terbuka atau Siswa Belum Masuk Lobi */
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950/40 to-slate-950 border border-sky-500/35 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div>
                          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                            LOBI MENARA ASESMEN INDIVIDU
                          </span>
                          <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                            {sesi?.judul_asesmen}
                          </h3>
                          <p className="text-xs text-slate-300 mt-1">
                            Durasi: <b>{sesi?.durasi} Menit</b> • Jumlah Soal:{' '}
                            <b>{asesmenState?.bankSoal.length || 0} Butir (TKA)</b> • Pengerjaan Mandiri
                          </p>
                        </div>

                        {!myLiveEntry ? (
                          <button
                            onClick={handleStudentJoinLobby}
                            disabled={actionBusy}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-black shadow-xl flex items-center justify-center gap-2 shrink-0"
                          >
                            <Play className="w-4 h-4" />
                            <span>
                              {sesi?.status === 'berjalan'
                                ? 'Masuk & Mulai Susul Asesmen'
                                : 'Gabung ke Lobi Asesmen Sekarang'}
                            </span>
                          </button>
                        ) : (
                          <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Sudah di Lobi — Menunggu Guru Memulai Asesmen...</span>
                          </div>
                        )}
                      </div>

                      {/* Daftar Siswa di Lobi Real-Time */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                            <Users className="w-4 h-4 text-sky-400" />
                            <span>
                              Peserta Terdaftar di Lobi ({asesmenState?.pesertaLive.length || 0}{' '}
                              Siswa)
                            </span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Sinkronisasi Real-Time Aktif
                          </span>
                        </div>

                        {asesmenState?.pesertaLive && asesmenState.pesertaLive.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {asesmenState.pesertaLive.map((p) => (
                              <div
                                key={p.studentId}
                                className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                                  p.studentId === currentStudent?.id
                                    ? 'bg-sky-500/15 border-sky-400/50'
                                    : 'bg-slate-950/60 border-white/10'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate">
                                    {p.studentName}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{p.className}</div>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                                  Siap di Lobi
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl bg-slate-950/50 border border-white/5 text-center text-xs text-slate-400">
                            Belum ada siswa yang masuk ke lobi. Klik tombol{' '}
                            <b>&quot;Gabung ke Lobi Asesmen Sekarang&quot;</b> di atas!
                          </div>
                        )}
                      </div>
                    </div>
                  ) : sesi?.status === 'jeda' ? (
                    /* KONDISI D: Asesmen Sedang Dijeda Guru */
                    <div className="p-8 rounded-3xl bg-amber-950/40 border border-amber-500/40 text-center space-y-3">
                      <Pause className="w-10 h-10 text-amber-400 mx-auto" />
                      <h3 className="text-lg font-black text-white">
                        ⏸️ Sesi Asesmen Sedang Dijeda oleh Guru
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                        Waktu hitung mundur dihentikan sementara dan seluruh jawaban Anda sudah tersimpan. Halaman soal akan otomatis terbuka kembali saat Guru menekan <b>Lanjut</b>.
                      </p>
                    </div>
                  ) : (
                    /* KONDISI E: ASESMEN SEDANG BERJALAN — TAMPILAN TKA / CBT LENGKAP */
                    <div className="space-y-4">
                      {/* Header Lembar Siswa (Nama, Sisa Waktu, Nomor Soal Saat Ini) */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-sky-500/30 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-black">
                            Soal No. {currentQuestionIdx + 1} / {orderedQuestionsForStudent.length}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              👤 {currentStudent?.name || 'Siswa'} ({currentStudent?.className || 'X DKV'})
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Terjawab: <b className="text-emerald-400">{studentProgressSummary.answered}</b> • Ragu-ragu:{' '}
                              <b className="text-amber-400">{studentProgressSummary.doubtful}</b> • Belum:{' '}
                              <b className="text-slate-300">{studentProgressSummary.unanswered}</b>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => flushDirtyAnswersBatch(true)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold border border-white/10"
                          >
                            💾 Simpan Progres
                          </button>
                          <button
                            onClick={() => setShowSubmitConfirmModal(true)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg"
                          >
                            ✅ Kumpulkan Asesmen
                          </button>
                        </div>
                      </div>

                      {/* Panel Nomor Soal (Warna berbeda untuk Belum Dijawab, Sudah Dijawab, dan Ragu-ragu) */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                            Navigasi Nomor Soal TKA
                          </span>
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span className="w-3 h-3 rounded bg-slate-800 border border-slate-600 inline-block" />
                              Belum Dijawab
                            </span>
                            <span className="flex items-center gap-1.5 text-emerald-300">
                              <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-400 inline-block" />
                              Sudah Dijawab
                            </span>
                            <span className="flex items-center gap-1.5 text-amber-300">
                              <span className="w-3 h-3 rounded bg-amber-500 border border-amber-300 inline-block" />
                              Ragu-ragu
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {orderedQuestionsForStudent.map((q, idx) => {
                            const st = getQuestionAnswerState(q);
                            const isCurrent = idx === currentQuestionIdx;
                            return (
                              <button
                                key={q.id_soal}
                                onClick={() => handleNavigateQuestion(idx)}
                                className={`w-9 h-9 rounded-xl text-xs font-black transition-all flex items-center justify-center border ${
                                  isCurrent ? 'ring-2 ring-white scale-105 ' : ''
                                }${
                                  st === 'doubtful'
                                    ? 'bg-amber-500 text-slate-950 border-amber-300'
                                    : st === 'answered'
                                    ? 'bg-emerald-600 text-white border-emerald-400'
                                    : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700'
                                }`}
                              >
                                {idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Area Utama Soal & Stimulus (Berdampingan di Laptop, Bisa Dilipat/Dibuka di HP) */}
                      {activeStudentQuestion && (
                        <div
                          className={`grid grid-cols-1 ${
                            activeStimulus ? 'lg:grid-cols-12' : ''
                          } gap-4 items-start`}
                        >
                          {/* Kolom Kiri: Stimulus (Khusus Soal Grup) */}
                          {activeStimulus && (
                            <div className="lg:col-span-5 rounded-2xl bg-slate-950/80 border border-sky-500/35 overflow-hidden">
                              <div className="px-4 py-3 bg-sky-950/60 border-b border-sky-500/30 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-black uppercase border border-sky-400/30">
                                    STIMULUS {activeStimulus.jenis.toUpperCase()}
                                  </span>
                                  <span className="text-xs font-bold text-white truncate">
                                    {activeStimulus.judul || 'Wacana / Data Acuan Soal'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setStimulusFoldedMobile((prev) => !prev)}
                                  className="lg:hidden px-2.5 py-1 rounded-lg bg-white/10 text-sky-200 text-[11px] font-bold flex items-center gap-1 shrink-0"
                                >
                                  {stimulusFoldedMobile ? (
                                    <>
                                      <span>Buka Stimulus</span>
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </>
                                  ) : (
                                    <>
                                      <span>Lipat</span>
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </button>
                              </div>
                              <div
                                className={`p-4 ${
                                  stimulusFoldedMobile ? 'hidden lg:block' : 'block'
                                }`}
                              >
                                {renderStimulusContent(activeStimulus)}
                              </div>
                            </div>
                          )}

                          {/* Kolom Kanan (atau Penuh jika Tunggal): Pertanyaan & Pilihan Jawaban */}
                          <div
                            className={`${
                              activeStimulus ? 'lg:col-span-7' : ''
                            } rounded-2xl bg-slate-950/80 border border-white/15 p-4 sm:p-5 space-y-4`}
                          >
                            {/* Badge Jenis Soal & Penyajian */}
                            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-black">
                                  {activeStudentQuestion.jenis === 'pg_tunggal'
                                    ? 'PILIHAN GANDA SEDERHANA (1 Jawaban Benar)'
                                    : activeStudentQuestion.jenis === 'pg_mcma'
                                    ? 'PILIHAN GANDA KOMPLEKS (MCMA — Pilih Lebih dari 1)'
                                    : 'PILIHAN GANDA KOMPLEKS KATEGORI (Tabel Pernyataan)'}
                                </span>
                                <span className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-400 text-[10px] font-semibold">
                                  {activeStudentQuestion.tipe_penyajian === 'grup'
                                    ? '🔗 Soal Grup Berstimulus'
                                    : '📄 Soal Tunggal'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                ID: {activeStudentQuestion.id_soal}
                              </span>
                            </div>

                            {/* Teks Soal */}
                            <div className="text-sm sm:text-base font-semibold text-white leading-relaxed whitespace-pre-line">
                              {activeStudentQuestion.teks_soal}
                            </div>

                            {/* INPUT JAWABAN SESUAI JENIS SOAL */}
                            {activeStudentQuestion.jenis === 'pg_tunggal' && (
                              <div className="space-y-2.5 pt-1">
                                {(() => {
                                  const optionOrder =
                                    asesmenState?.paketSaya?.urutan_opsi_map?.[
                                      activeStudentQuestion.id_soal
                                    ] ||
                                    activeStudentQuestion.opsi.map((_, i) => i);
                                  const selectedOrigIdx = String(
                                    localAnswers[activeStudentQuestion.id_soal]?.jawaban ?? ''
                                  );

                                  return optionOrder.map((origIdx, displayIdx) => {
                                    const optText = activeStudentQuestion.opsi[origIdx];
                                    if (typeof optText !== 'string') return null;
                                    const isSelected = selectedOrigIdx === String(origIdx);
                                    const letter = String.fromCharCode(65 + displayIdx);
                                    return (
                                      <button
                                        key={origIdx}
                                        type="button"
                                        onClick={() =>
                                          handleSelectAnswer(
                                            activeStudentQuestion.id_soal,
                                            String(origIdx)
                                          )
                                        }
                                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                                          isSelected
                                            ? 'bg-sky-600/25 border-sky-400 text-white shadow-md'
                                            : 'bg-slate-900/80 border-white/10 text-slate-200 hover:bg-slate-800/80 hover:border-white/20'
                                        }`}
                                      >
                                        <span
                                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                            isSelected
                                              ? 'bg-sky-500 text-white'
                                              : 'bg-slate-800 text-slate-300 border border-white/10'
                                          }`}
                                        >
                                          {letter}
                                        </span>
                                        <span className="text-xs sm:text-sm leading-relaxed pt-0.5">
                                          {optText}
                                        </span>
                                      </button>
                                    );
                                  });
                                })()}
                              </div>
                            )}

                            {activeStudentQuestion.jenis === 'pg_mcma' && (
                              <div className="space-y-2.5 pt-1">
                                <div className="text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                                  <CheckSquare className="w-3.5 h-3.5" />
                                  <span>
                                    Petunjuk MCMA: Centang SEMUA pilihan jawaban yang tepat (jawaban benar lebih dari satu).
                                  </span>
                                </div>
                                {(() => {
                                  const optionOrder =
                                    asesmenState?.paketSaya?.urutan_opsi_map?.[
                                      activeStudentQuestion.id_soal
                                    ] ||
                                    activeStudentQuestion.opsi.map((_, i) => i);

                                  let selectedIndices: number[] = [];
                                  try {
                                    const parsed = JSON.parse(
                                      localAnswers[activeStudentQuestion.id_soal]?.jawaban || '[]'
                                    );
                                    if (Array.isArray(parsed)) selectedIndices = parsed.map(Number);
                                  } catch {}

                                  return optionOrder.map((origIdx, displayIdx) => {
                                    const optText = activeStudentQuestion.opsi[origIdx];
                                    if (typeof optText !== 'string') return null;
                                    const isChecked = selectedIndices.includes(origIdx);
                                    const letter = String.fromCharCode(65 + displayIdx);

                                    const toggleMcmaOption = () => {
                                      const nextSet = new Set(selectedIndices);
                                      if (nextSet.has(origIdx)) nextSet.delete(origIdx);
                                      else nextSet.add(origIdx);
                                      const sorted = Array.from(nextSet).sort((a, b) => a - b);
                                      handleSelectAnswer(
                                        activeStudentQuestion.id_soal,
                                        JSON.stringify(sorted)
                                      );
                                    };

                                    return (
                                      <button
                                        key={origIdx}
                                        type="button"
                                        onClick={toggleMcmaOption}
                                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                                          isChecked
                                            ? 'bg-indigo-600/25 border-indigo-400 text-white shadow-md'
                                            : 'bg-slate-900/80 border-white/10 text-slate-200 hover:bg-slate-800/80'
                                        }`}
                                      >
                                        <span
                                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                            isChecked
                                              ? 'bg-indigo-500 text-white'
                                              : 'bg-slate-800 text-slate-300 border border-white/10'
                                          }`}
                                        >
                                          {isChecked ? (
                                            <CheckSquare className="w-4 h-4" />
                                          ) : (
                                            <Square className="w-4 h-4" />
                                          )}
                                        </span>
                                        <span className="text-xs sm:text-sm leading-relaxed pt-0.5">
                                          <b className="text-indigo-300 mr-1.5">[{letter}]</b>
                                          {optText}
                                        </span>
                                      </button>
                                    );
                                  });
                                })()}
                              </div>
                            )}

                            {activeStudentQuestion.jenis === 'pg_kategori' && (
                              <div className="space-y-2.5 pt-1">
                                <div className="text-[11px] text-sky-300 font-semibold">
                                  Petunjuk Kategori: Pilih kategori yang tepat pada setiap baris pernyataan di bawah ini (nilai dihitung per pernyataan).
                                </div>
                                {(() => {
                                  const statements =
                                    activeStudentQuestion.pernyataan_kategori || [];
                                  const colLabels = activeStudentQuestion.label_kategori || [
                                    'Benar',
                                    'Salah',
                                  ];
                                  let currentMap: Record<string, string> = {};
                                  try {
                                    const parsed = JSON.parse(
                                      localAnswers[activeStudentQuestion.id_soal]?.jawaban || '{}'
                                    );
                                    if (parsed && typeof parsed === 'object') currentMap = parsed;
                                  } catch {}

                                  const selectStatementChoice = (
                                    idPernyataan: string,
                                    choice: 'A' | 'B'
                                  ) => {
                                    const nextMap = {
                                      ...currentMap,
                                      [idPernyataan]: choice,
                                    };
                                    handleSelectAnswer(
                                      activeStudentQuestion.id_soal,
                                      JSON.stringify(nextMap)
                                    );
                                  };

                                  return (
                                    <div className="overflow-x-auto rounded-2xl border border-white/15 bg-slate-900/70">
                                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                        <thead>
                                          <tr className="bg-slate-950 text-slate-300 border-b border-white/15">
                                            <th className="p-3 font-bold">Pernyataan</th>
                                            <th className="p-3 font-bold text-center w-28 sm:w-32 text-emerald-300">
                                              {colLabels[0] || 'Benar'}
                                            </th>
                                            <th className="p-3 font-bold text-center w-28 sm:w-32 text-rose-300">
                                              {colLabels[1] || 'Salah'}
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {statements.map((st, sIdx) => {
                                            const picked = currentMap[st.id_pernyataan];
                                            return (
                                              <tr
                                                key={st.id_pernyataan || sIdx}
                                                className="border-b border-white/10 last:border-none"
                                              >
                                                <td className="p-3 text-slate-200 leading-relaxed">
                                                  <span className="font-bold text-sky-400 mr-1.5">
                                                    {sIdx + 1}.
                                                  </span>
                                                  {st.teks}
                                                </td>
                                                <td className="p-3 text-center">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      selectStatementChoice(st.id_pernyataan, 'A')
                                                    }
                                                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                                                      picked === 'A'
                                                        ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                                                        : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
                                                    }`}
                                                  >
                                                    {colLabels[0] || 'Benar'}
                                                  </button>
                                                </td>
                                                <td className="p-3 text-center">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      selectStatementChoice(st.id_pernyataan, 'B')
                                                    }
                                                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                                                      picked === 'B'
                                                        ? 'bg-rose-600 text-white border-rose-400 shadow'
                                                        : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
                                                    }`}
                                                  >
                                                    {colLabels[1] || 'Salah'}
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* Footer Tombol Navigasi: Sebelumnya, Tandai Ragu-ragu, Selanjutnya */}
                            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleNavigateQuestion(currentQuestionIdx - 1)}
                                disabled={currentQuestionIdx === 0}
                                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5"
                              >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Sebelumnya</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleRagu(activeStudentQuestion.id_soal)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${
                                  localAnswers[activeStudentQuestion.id_soal]?.ragu
                                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg'
                                    : 'bg-amber-500/15 text-amber-300 border-amber-400/30 hover:bg-amber-500/25'
                                }`}
                              >
                                <Flag className="w-4 h-4" />
                                <span>
                                  {localAnswers[activeStudentQuestion.id_soal]?.ragu
                                    ? 'Ditandai Ragu-ragu'
                                    : 'Tandai Ragu-ragu'}
                                </span>
                              </button>

                              {currentQuestionIdx < orderedQuestionsForStudent.length - 1 ? (
                                <button
                                  type="button"
                                  onClick={() => handleNavigateQuestion(currentQuestionIdx + 1)}
                                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5"
                                >
                                  <span>Selanjutnya</span>
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowSubmitConfirmModal(true)}
                                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Selesai & Kumpulkan</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================
                  TAB 2: PANEL GURU (OTORISASI SERVER-SIDE)
              ============================================================ */}
              {activeTab === 'guru' && isTeacherAccount && (
                <div className="space-y-5">
                  {/* Sub-Navigation Panel Guru */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 p-3 rounded-2xl border border-indigo-500/30">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setTeacherSubTab('konfigurasi')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          teacherSubTab === 'konfigurasi'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        1. Pilih TP Bank Materi & Atur Komposisi
                      </button>
                      <button
                        onClick={() => setTeacherSubTab('bank_soal')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          teacherSubTab === 'bank_soal'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        2. Tinjau & Edit Bank Soal ({asesmenState?.bankSoal.length || 0})
                      </button>
                      <button
                        onClick={() => setTeacherSubTab('lobi_pantau')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          teacherSubTab === 'lobi_pantau'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        3. Kontrol Lobi & Pantauan Langsung ({asesmenState?.pesertaLive.length || 0})
                      </button>
                      <button
                        onClick={() => setTeacherSubTab('analisis')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          teacherSubTab === 'analisis'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        4. Rekap Nilai, Analisis Butir/TP & Ekspor
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">PIN Otorisasi Server:</span>
                      <input
                        type="password"
                        value={teacherPinInput}
                        onChange={(e) => setTeacherPinInput(e.target.value)}
                        className="w-20 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/15 text-xs text-white text-center"
                        placeholder="1234"
                      />
                    </div>
                  </div>

                  {/* SUB-TAB 1: PILIH 1-5 TP BANK MATERI & KOMPOSISI SOAL */}
                  {teacherSubTab === 'konfigurasi' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Kiri: Pemilihan 1 sampai 5 TP dari Bank Materi */}
                      <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h3 className="text-sm sm:text-base font-black text-white">
                              a. Pilih 1 sampai 5 Tujuan Pembelajaran (TP) dari Bank Materi
                            </h3>
                            <p className="text-xs text-slate-400">
                              Terpilih: <b className="text-sky-400">{selectedTpIds.length} / 5 TP</b> (Terhubung otomatis dengan Bank Materi Kota Refleksia)
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAddTpForm((p) => !p)}
                            className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 text-xs font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah TP</span>
                          </button>
                        </div>

                        {showAddTpForm && (
                          <div className="p-3.5 rounded-xl bg-slate-900 border border-sky-500/30 space-y-2.5">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={newTpMapel}
                                onChange={(e) => setNewTpMapel(e.target.value)}
                                placeholder="Mata Pelajaran"
                                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-xs text-white"
                              />
                              <input
                                type="text"
                                value={newTpKelas}
                                onChange={(e) => setNewTpKelas(e.target.value)}
                                placeholder="Kelas (mis. X DKV)"
                                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-xs text-white"
                              />
                            </div>
                            <input
                              type="text"
                              value={newTpGoal}
                              onChange={(e) => setNewTpGoal(e.target.value)}
                              placeholder="Kalimat Tujuan Pembelajaran (TP)..."
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-xs text-white"
                            />
                            <textarea
                              value={newTpContent}
                              onChange={(e) => setNewTpContent(e.target.value)}
                              placeholder="Ringkasan isi materi esensial untuk acuan AI membuat soal..."
                              rows={2}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-xs text-white"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={handleAddCustomTpToBankMateri}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                              >
                                Simpan & Pilih TP Ini
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {availableTpList.map((tp) => {
                            const isChecked = selectedTpIds.includes(tp.id_tp);
                            return (
                              <div
                                key={tp.id_tp}
                                onClick={() => handleToggleSelectTp(tp.id_tp)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                                  isChecked
                                    ? 'bg-sky-500/15 border-sky-400/60'
                                    : 'bg-slate-900/60 border-white/10 hover:bg-slate-900'
                                }`}
                              >
                                <div className="pt-0.5 text-sky-400">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-500" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                                      {tp.mata_pelajaran}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Kelas: {tp.kelas}
                                    </span>
                                  </div>
                                  <div className="text-xs font-bold text-white mt-1">
                                    {tp.tujuan_pembelajaran}
                                  </div>
                                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                                    {tp.isi_materi}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Kanan: Pengaturan Komposisi, Durasi, Poin, Acak & Tombol Generate Soal */}
                      <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-4">
                        <h3 className="text-sm sm:text-base font-black text-white">
                          b. Atur Komposisi Soal, Durasi & Poin
                        </h3>

                        <div>
                          <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                            Judul Sesi Asesmen
                          </label>
                          <input
                            type="text"
                            value={judulAsesmen}
                            onChange={(e) => setJudulAsesmen(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              PG Tunggal
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={15}
                              value={komposisiJenis.pg_tunggal}
                              onChange={(e) =>
                                setKomposisiJenis((p) => ({
                                  ...p,
                                  pg_tunggal: Math.max(0, Number(e.target.value)),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              PG Kompleks (MCMA)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={15}
                              value={komposisiJenis.pg_mcma}
                              onChange={(e) =>
                                setKomposisiJenis((p) => ({
                                  ...p,
                                  pg_mcma: Math.max(0, Number(e.target.value)),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              PG Kategori (Tabel)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={15}
                              value={komposisiJenis.pg_kategori}
                              onChange={(e) =>
                                setKomposisiJenis((p) => ({
                                  ...p,
                                  pg_kategori: Math.max(0, Number(e.target.value)),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              Soal Tunggal
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={komposisiPenyajian.tunggal}
                              onChange={(e) =>
                                setKomposisiPenyajian((p) => ({
                                  ...p,
                                  tunggal: Math.max(0, Number(e.target.value)),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              Soal Grup (Stimulus)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={20}
                              value={komposisiPenyajian.grup}
                              onChange={(e) =>
                                setKomposisiPenyajian((p) => ({
                                  ...p,
                                  grup: Math.max(0, Number(e.target.value)),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              Durasi (Menit)
                            </label>
                            <input
                              type="number"
                              min={5}
                              max={180}
                              value={durasiMenit}
                              onChange={(e) => setDurasiMenit(Math.max(5, Number(e.target.value)))}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-white"
                            />
                          </div>
                        </div>

                        {/* Poin Per Jenis Soal */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              Poin PG Tunggal
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={poinPerJenis.pg_tunggal}
                              onChange={(e) =>
                                setPoinPerJenis((p) => ({
                                  ...p,
                                  pg_tunggal: Math.max(1, Number(e.target.value)),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              Poin PG MCMA
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={poinPerJenis.pg_mcma}
                              onChange={(e) =>
                                setPoinPerJenis((p) => ({
                                  ...p,
                                  pg_mcma: Math.max(1, Number(e.target.value)),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">
                              Poin/Pernyataan Kategori
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={poinPerJenis.pg_kategori_per_pernyataan}
                              onChange={(e) =>
                                setPoinPerJenis((p) => ({
                                  ...p,
                                  pg_kategori_per_pernyataan: Math.max(1, Number(e.target.value)),
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-white"
                            />
                          </div>
                        </div>

                        {/* Opsi Pengacakan & Aturan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={acakSoal}
                              onChange={(e) => setAcakSoal(e.target.checked)}
                              className="rounded"
                            />
                            <span>Acak Urutan Soal (Grup Tetap Menyatu)</span>
                          </label>
                          <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={acakOpsi}
                              onChange={(e) => setAcakOpsi(e.target.checked)}
                              className="rounded"
                            />
                            <span>Acak Urutan Opsi Jawaban</span>
                          </label>
                          <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={mcmaKreditParsial}
                              onChange={(e) => setMcmaKreditParsial(e.target.checked)}
                              className="rounded"
                            />
                            <span>Poin Sebagian (Partial Credit) MCMA</span>
                          </label>
                          <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={izinkanMenyusul}
                              onChange={(e) => setIzinkanMenyusul(e.target.checked)}
                              className="rounded"
                            />
                            <span>Izinkan Siswa Terlambat Menyusul</span>
                          </label>
                          <label className="flex items-center gap-2 text-slate-200 cursor-pointer sm:col-span-2">
                            <input
                              type="checkbox"
                              checked={tampilkanPembahasan}
                              onChange={(e) => setTampilkanPembahasan(e.target.checked)}
                              className="rounded"
                            />
                            <span>Tampilkan Nilai & Pembahasan ke Siswa Setelah Selesai</span>
                          </label>
                        </div>

                        <div className="pt-2 flex flex-col gap-2.5">
                          <button
                            type="button"
                            onClick={handleSaveTeacherConfig}
                            disabled={actionBusy}
                            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-white/15"
                          >
                            💾 Simpan Konfigurasi Sesi
                          </button>

                          <button
                            type="button"
                            onClick={handleGenerateQuestionsWithAI}
                            disabled={isGeneratingAI}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs sm:text-sm font-black shadow-xl flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>
                              {isGeneratingAI
                                ? 'Sedang Men-generate Soal TKA dengan Gemini AI...'
                                : 'c. Generate Soal Otomatis (Gemini AI dari TP Bank Materi)'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: TINJAU, EDIT, HAPUS & GANTI BANK SOAL & STIMULUS */}
                  {teacherSubTab === 'bank_soal' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-white">
                            d. Tinjau, Edit, Hapus, dan Ganti Soal & Stimulus (Wajib Sebelum Publikasi)
                          </h3>
                          <p className="text-xs text-slate-400">
                            Kunci jawaban & pembahasan di bawah ini HANYA terlihat oleh Guru dan tidak pernah dikirim ke siswa saat ujian.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setShowKeyPreview((p) => !p)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                          >
                            {showKeyPreview ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Sembunyikan Kunci</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Tampilkan Kunci & Pembahasan</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingStimulus({
                                id_stimulus: `STIM-${Date.now().toString(36).slice(-4).toUpperCase()}`,
                                jenis: 'teks',
                                judul: 'Stimulus Bacaan / Kasus Baru',
                                isi: 'Tulis wacana atau JSON tabel/grafik di sini...',
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-sky-600/30 hover:bg-sky-600/40 text-sky-200 border border-sky-400/40 text-xs font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Stimulus</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingQuestion({
                                id_soal: `SOAL-${String(
                                  (asesmenState?.bankSoal.length || 0) + 1
                                ).padStart(2, '0')}`,
                                id_sesi: sesi?.id_sesi || 'ASESMEN-TKA-01',
                                tp: selectedTpIds[0] || 'tp-bm-001',
                                tp_label:
                                  availableTpList.find((t) => t.id_tp === selectedTpIds[0])
                                    ?.tujuan_pembelajaran || '',
                                jenis: 'pg_tunggal',
                                tipe_penyajian: 'tunggal',
                                id_stimulus: '',
                                teks_soal: '',
                                opsi: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
                                kunci_jawaban: '0',
                                pembahasan: '',
                              })
                            }
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Soal Baru</span>
                          </button>
                        </div>
                      </div>

                      {/* Daftar Stimulus Soal Grup */}
                      {asesmenState?.stimulusList && asesmenState.stimulusList.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                            Daftar Stimulus Soal Grup ({asesmenState.stimulusList.length})
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {asesmenState.stimulusList.map((st) => (
                              <div
                                key={st.id_stimulus}
                                className="p-3.5 rounded-2xl bg-slate-950/70 border border-sky-500/30 space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-white">
                                    [{st.id_stimulus}] {st.judul || st.jenis.toUpperCase()}
                                  </span>
                                  <button
                                    onClick={() => setEditingStimulus(st)}
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sky-300 text-[11px] font-bold flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit Stimulus</span>
                                  </button>
                                </div>
                                {renderStimulusContent(st)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Daftar Butir Soal di Bank Soal Sesi */}
                      <div className="space-y-3">
                        {(asesmenState?.bankSoal || []).map((q, idx) => (
                          <div
                            key={q.id_soal}
                            className="p-4 rounded-2xl bg-slate-950/80 border border-white/15 space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 font-black text-xs">
                                  #{idx + 1} ({q.id_soal})
                                </span>
                                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[11px] font-bold">
                                  {q.jenis.toUpperCase()}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-[11px]">
                                  Penyajian: {q.tipe_penyajian.toUpperCase()}
                                  {q.id_stimulus ? ` (${q.id_stimulus})` : ''}
                                </span>
                                <span className="text-[11px] text-slate-400">TP: {q.tp}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingQuestion({ ...q })}
                                  className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit / Ganti Soal</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(q.id_soal)}
                                  className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 text-xs font-bold flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </div>

                            <div className="text-xs sm:text-sm font-semibold text-white">
                              {q.teks_soal}
                            </div>

                            {q.jenis !== 'pg_kategori' ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                                {q.opsi.map((opt, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className="p-2 rounded-lg bg-slate-900 border border-white/5"
                                  >
                                    <b className="text-sky-400 mr-1.5">
                                      {String.fromCharCode(65 + oIdx)}.
                                    </b>
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-1 text-xs text-slate-300">
                                {(q.pernyataan_kategori || []).map((st, sIdx) => (
                                  <div
                                    key={st.id_pernyataan || sIdx}
                                    className="p-2 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between gap-2"
                                  >
                                    <span>
                                      {sIdx + 1}. {st.teks}
                                    </span>
                                    {showKeyPreview && (
                                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                                        Kunci: {st.kunci === 'B' ? 'Salah/Tidak Sesuai' : 'Benar/Sesuai'}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {showKeyPreview && (
                              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1">
                                <div className="font-bold text-emerald-300">
                                  🔑 Kunci Jawaban: {q.kunci_jawaban}
                                </div>
                                <div className="text-slate-300">
                                  💡 <b>Pembahasan:</b> {q.pembahasan || '-'}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: KONTROL LOBI & PANTAUAN LANGSUNG */}
                  {teacherSubTab === 'lobi_pantau' && (
                    <div className="space-y-4">
                      {/* Tombol Kontrol Sesi Asesmen */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-indigo-500/35 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="text-sm sm:text-base font-black text-white">
                              e, f, g. Kontrol Sesi Lobi & Pelaksanaan Asesmen Serentak
                            </h3>
                            <p className="text-xs text-slate-400">
                              Status Saat Ini: <b className="text-sky-300">{sesi?.status.toUpperCase()}</b> • Sisa Waktu:{' '}
                              <b className="text-amber-300">{formatTimerMMSS(remainingSeconds)}</b>
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTeacherSessionAction('buka_lobi')}
                              disabled={actionBusy}
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg"
                            >
                              🚪 Buka Lobi
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTeacherSessionAction('mulai_asesmen')}
                              disabled={actionBusy}
                              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg flex items-center gap-1.5"
                            >
                              <Play className="w-4 h-4" />
                              <span>MULAI ASESMEN</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTeacherSessionAction('tambah_waktu', 5)}
                              disabled={actionBusy}
                              className="px-3.5 py-2 rounded-xl bg-sky-600/30 hover:bg-sky-600/40 text-sky-200 border border-sky-400/30 text-xs font-bold"
                            >
                              +5 Menit
                            </button>
                            {sesi?.status === 'berjalan' ? (
                              <button
                                type="button"
                                onClick={() => handleTeacherSessionAction('jeda')}
                                disabled={actionBusy}
                                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1"
                              >
                                <Pause className="w-3.5 h-3.5" />
                                <span>Jeda</span>
                              </button>
                            ) : sesi?.status === 'jeda' ? (
                              <button
                                type="button"
                                onClick={() => handleTeacherSessionAction('lanjut')}
                                disabled={actionBusy}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Lanjut</span>
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleTeacherSessionAction('akhiri_paksa')}
                              disabled={actionBusy}
                              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                            >
                              🛑 Akhiri Paksa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTeacherSessionAction('reset_sesi')}
                              disabled={actionBusy}
                              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reset / Sesi Baru</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tabel Pantauan Langsung Siswa */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-white/15 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-white">
                            h. Pantauan Langsung Peserta ({asesmenState?.pesertaLive.length || 0} Siswa)
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Memantau progres soal terjawab, selesai, & peringatan keluar tab
                          </span>
                        </div>

                        {asesmenState?.pesertaLive && asesmenState.pesertaLive.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-900 text-slate-300 border-b border-white/10">
                                  <th className="p-2.5">Nama Siswa</th>
                                  <th className="p-2.5">Kelas</th>
                                  <th className="p-2.5">Status</th>
                                  <th className="p-2.5">Progres Dijawab</th>
                                  <th className="p-2.5">Ragu-ragu</th>
                                  <th className="p-2.5">Peringatan Keluar Tab</th>
                                  <th className="p-2.5">Nilai</th>
                                </tr>
                              </thead>
                              <tbody>
                                {asesmenState.pesertaLive.map((p) => (
                                  <tr
                                    key={p.studentId}
                                    className="border-b border-white/5 hover:bg-white/[0.02]"
                                  >
                                    <td className="p-2.5 font-bold text-white">{p.studentName}</td>
                                    <td className="p-2.5 text-slate-300">{p.className}</td>
                                    <td className="p-2.5">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          p.status_peserta === 'selesai'
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : p.status_peserta === 'mengerjakan'
                                            ? 'bg-sky-500/20 text-sky-300'
                                            : 'bg-amber-500/20 text-amber-300'
                                        }`}
                                      >
                                        {p.status_peserta.toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="p-2.5 font-semibold text-sky-300">
                                      {p.soal_terjawab} / {p.total_soal} soal
                                    </td>
                                    <td className="p-2.5 text-amber-300">{p.soal_ragu}</td>
                                    <td className="p-2.5">
                                      {p.keluar_tab > 0 ? (
                                        <span
                                          className="px-2 py-0.5 rounded bg-rose-500/25 text-rose-300 font-bold"
                                          title={(p.log_keluar_tab || []).join(', ')}
                                        >
                                          ⚠️ {p.keluar_tab}x Keluar Tab
                                        </span>
                                      ) : (
                                        <span className="text-emerald-400">Aman (0x)</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 font-black text-emerald-400">
                                      {typeof p.nilai_akhir === 'number' ? p.nilai_akhir : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-xs text-slate-400">
                            Belum ada siswa yang masuk ke lobi asesmen.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 4: REKAP NILAI, ANALISIS BUTIR/TP & EKSPOR SPREADSHEET */}
                  {teacherSubTab === 'analisis' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-[11px] text-slate-400">Rata-Rata Kelas</div>
                            <div className="text-2xl font-black text-emerald-400">
                              {asesmenState?.rataRataKelas ?? 0}
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] text-slate-400">Jumlah Peserta Selesai</div>
                            <div className="text-2xl font-black text-sky-400">
                              {asesmenState?.semuaHasil?.length || 0} Siswa
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleExportToSpreadsheet}
                          disabled={actionBusy}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg flex items-center gap-2"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>i. Ekspor ke Google Spreadsheet & Unduh CSV</span>
                        </button>
                      </div>

                      {/* Analisis Penguasaan Per Tujuan Pembelajaran (TP) */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2.5">
                        <h4 className="text-xs sm:text-sm font-black text-white">
                          Analisis Ketercapaian Per Tujuan Pembelajaran (TP)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(asesmenState?.analisisTp || []).map((tpItem) => (
                            <div
                              key={tpItem.tp}
                              className="p-3 rounded-xl bg-slate-900 border border-white/10 space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-sky-300">{tpItem.tp}</span>
                                <span className="font-black text-emerald-400">
                                  {tpItem.rata_rata_penguasaan}% Penguasaan ({tpItem.jumlah_soal} Soal)
                                </span>
                              </div>
                              <div className="text-xs text-slate-300 line-clamp-2">
                                {tpItem.tp_label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Analisis Per Butir Soal */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2.5">
                        <h4 className="text-xs sm:text-sm font-black text-white">
                          Analisis Per Butir Soal
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-900 text-slate-300 border-b border-white/10">
                                <th className="p-2">No</th>
                                <th className="p-2">ID Soal</th>
                                <th className="p-2">TP</th>
                                <th className="p-2">Jenis</th>
                                <th className="p-2">Menjawab</th>
                                <th className="p-2">Benar Penuh</th>
                                <th className="p-2">% Ketercapaian</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(asesmenState?.analisisButir || []).map((ab) => (
                                <tr key={ab.id_soal} className="border-b border-white/5">
                                  <td className="p-2 font-bold text-white">{ab.nomor_urut}</td>
                                  <td className="p-2 text-sky-300">{ab.id_soal}</td>
                                  <td className="p-2 text-slate-300">{ab.tp}</td>
                                  <td className="p-2 text-indigo-300">{ab.jenis}</td>
                                  <td className="p-2 text-slate-300">{ab.jumlah_menjawab}</td>
                                  <td className="p-2 text-emerald-300">{ab.jumlah_benar}</td>
                                  <td className="p-2 font-black text-amber-300">
                                    {ab.persentase_benar}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================
                  TAB 3: HASIL & PEMBAHASAN
              ============================================================ */}
              {activeTab === 'hasil' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/15">
                    <h3 className="text-base font-black text-white">
                      Rekap Nilai & Pembahasan Menara Asesmen Individu
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isServerVerifiedTeacher
                        ? 'Menampilkan seluruh hasil siswa dan kunci pembahasan lengkap.'
                        : sesi?.tampilkan_pembahasan && asesmenState?.hasilSaya
                        ? 'Berikut adalah nilai akhir dan pembahasan untuk paket soal yang telah Anda kerjakan.'
                        : 'Nilai detail dan pembahasan soal akan ditampilkan setelah Anda menyelesaikan ujian dan Guru mengaktifkan publikasi pembahasan.'}
                    </p>
                  </div>

                  {/* Tabel Hasil */}
                  {asesmenState?.semuaHasil && asesmenState.semuaHasil.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-slate-300 border-b border-white/10">
                            <th className="p-2.5">Peringkat</th>
                            <th className="p-2.5">Nama Siswa</th>
                            <th className="p-2.5">Kelas</th>
                            <th className="p-2.5">Nilai (0-100)</th>
                            <th className="p-2.5">Benar Penuh</th>
                            <th className="p-2.5">Durasi</th>
                            <th className="p-2.5">Keluar Tab</th>
                          </tr>
                        </thead>
                        <tbody>
                          {asesmenState.semuaHasil.map((r, i) => (
                            <tr key={r.siswa} className="border-b border-white/5">
                              <td className="p-2.5 font-bold text-amber-300">#{i + 1}</td>
                              <td className="p-2.5 font-bold text-white">{r.nama_siswa}</td>
                              <td className="p-2.5 text-slate-300">{r.kelas}</td>
                              <td className="p-2.5 font-black text-emerald-400">{r.nilai}</td>
                              <td className="p-2.5 text-sky-300">
                                {r.jumlah_benar} / {r.jumlah_soal}
                              </td>
                              <td className="p-2.5 text-slate-300">{r.durasi} dtk</td>
                              <td className="p-2.5 text-rose-300">{r.keluar_tab}x</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pembahasan Soal (hanya tampil jika kunci_jawaban tidak null dari server) */}
                  {asesmenState?.bankSoal.some((q) => q.kunci_jawaban !== null) && (
                    <div className="space-y-3">
                      {asesmenState.bankSoal.map((q, idx) => (
                        <div
                          key={q.id_soal}
                          className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2"
                        >
                          <div className="text-xs font-bold text-sky-300">
                            Soal #{idx + 1} ({q.jenis.toUpperCase()})
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-white">
                            {q.teks_soal}
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-slate-200 space-y-1">
                            <div className="font-bold text-emerald-300">
                              🔑 Kunci Jawaban: {q.kunci_jawaban}
                            </div>
                            <div>💡 Pembahasan: {q.pembahasan}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================
                  TAB 4: INFO & PANDUAN STRUKTUR 6 SHEET BARU
              ============================================================ */}
              {activeTab === 'info' && (
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-white/15 space-y-4 text-xs sm:text-sm text-slate-300">
                  <h3 className="text-base font-black text-white">
                    Panduan Menara Asesmen Individu & 6 Sheet Google Spreadsheet Baru
                  </h3>
                  <p>
                    Fasilitas <b>Menara Asesmen Individu</b> menggantikan <i>Menara Inovasi Digital</i> di Refleksia Timur tanpa mengubah bentuk gedung maupun fitur Kota Refleksia lainnya.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 space-y-1">
                      <div className="font-bold text-sky-300">1. Sheet &quot;Asesmen_Sesi&quot;</div>
                      <div className="text-xs text-slate-400">
                        Kolom: <code>id_sesi, tp_terpilih, durasi, status, waktu_mulai</code>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 space-y-1">
                      <div className="font-bold text-sky-300">2. Sheet &quot;Asesmen_BankSoal&quot;</div>
                      <div className="text-xs text-slate-400">
                        Kolom: <code>id_soal, id_sesi, tp, jenis, tipe_penyajian, id_stimulus, teks_soal, opsi, kunci_jawaban, pembahasan</code>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 space-y-1">
                      <div className="font-bold text-sky-300">3. Sheet &quot;Asesmen_Stimulus&quot;</div>
                      <div className="text-xs text-slate-400">
                        Kolom: <code>id_stimulus, jenis, isi</code>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 space-y-1">
                      <div className="font-bold text-sky-300">4. Sheet &quot;Asesmen_PaketSiswa&quot;</div>
                      <div className="text-xs text-slate-400">
                        Kolom: <code>id_sesi, siswa, urutan_soal</code>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 space-y-1">
                      <div className="font-bold text-sky-300">5. Sheet &quot;Asesmen_Jawaban&quot;</div>
                      <div className="text-xs text-slate-400">
                        Kolom: <code>id_sesi, siswa, id_soal, jawaban, ragu, waktu</code>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 space-y-1">
                      <div className="font-bold text-sky-300">6. Sheet &quot;Asesmen_Hasil&quot;</div>
                      <div className="text-xs text-slate-400">
                        Kolom: <code>id_sesi, siswa, nilai, jumlah_benar, durasi, keluar_tab</code>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ============================================================
            MODAL KONFIRMASI SEBELUM KUMPULKAN (RINGKASAN SOAL)
        ============================================================ */}
        {showSubmitConfirmModal && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-sky-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-lg font-black text-white">
                Konfirmasi Pengumpulan Asesmen
              </h3>
              <p className="text-xs text-slate-300">
                Periksa kembali ringkasan pengerjaan Anda sebelum dikumpulkan secara permanen:
              </p>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
                  <div className="text-lg font-black text-emerald-400">
                    {studentProgressSummary.answered}
                  </div>
                  <div className="text-[10px] text-slate-300">Sudah Dijawab</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/30">
                  <div className="text-lg font-black text-amber-400">
                    {studentProgressSummary.doubtful}
                  </div>
                  <div className="text-[10px] text-slate-300">Ragu-ragu</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/30">
                  <div className="text-lg font-black text-rose-400">
                    {studentProgressSummary.unanswered}
                  </div>
                  <div className="text-[10px] text-slate-300">Belum Dijawab</div>
                </div>
              </div>
              {(studentProgressSummary.unanswered > 0 ||
                studentProgressSummary.doubtful > 0) && (
                <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs">
                  ⚠️ Masih ada soal yang belum dijawab atau ditandai ragu-ragu. Apakah Anda yakin ingin mengumpulkan sekarang?
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirmModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                >
                  Periksa Kembali
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitExamFinal(false)}
                  disabled={actionBusy}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg"
                >
                  Ya, Kumpulkan Sekarang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL EDITOR SOAL UNTUK GURU
        ============================================================ */}
        {editingQuestion && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white">
                  Edit / Ganti Butir Soal ({editingQuestion.id_soal})
                </h3>
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="p-1.5 rounded-lg bg-white/10 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Jenis Soal</label>
                  <select
                    value={editingQuestion.jenis}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        jenis: e.target.value as AsesmenQuestionType,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white"
                  >
                    <option value="pg_tunggal">PG Sederhana (Tunggal)</option>
                    <option value="pg_mcma">PG Kompleks (MCMA)</option>
                    <option value="pg_kategori">PG Kompleks Kategori</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Penyajian</label>
                  <select
                    value={editingQuestion.tipe_penyajian}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        tipe_penyajian: e.target.value as AsesmenPresentationType,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white"
                  >
                    <option value="tunggal">Soal Tunggal</option>
                    <option value="grup">Soal Grup (Stimulus)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">ID Stimulus</label>
                  <select
                    value={editingQuestion.id_stimulus || ''}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        id_stimulus: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white"
                  >
                    <option value="">-- Tanpa Stimulus --</option>
                    {(asesmenState?.stimulusList || []).map((st) => (
                      <option key={st.id_stimulus} value={st.id_stimulus}>
                        {st.id_stimulus} ({st.jenis})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Teks Pertanyaan</label>
                <textarea
                  rows={3}
                  value={editingQuestion.teks_soal}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, teks_soal: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                />
              </div>

              {editingQuestion.jenis !== 'pg_kategori' ? (
                <div className="space-y-2">
                  <label className="text-[11px] text-slate-400 block">
                    Opsi Pilihan Jawaban (Indeks 0 = A, 1 = B, 2 = C, 3 = D)
                  </label>
                  {editingQuestion.opsi.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-sky-400 w-5">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const nextOpsi = [...editingQuestion.opsi];
                          nextOpsi[oIdx] = e.target.value;
                          setEditingQuestion({ ...editingQuestion, opsi: nextOpsi });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-xs text-white"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] text-slate-400 block">
                    Daftar Pernyataan Kategori (A = Benar/Sesuai, B = Salah/Tidak Sesuai)
                  </label>
                  {(editingQuestion.pernyataan_kategori || []).map((st, sIdx) => (
                    <div key={st.id_pernyataan || sIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={st.teks}
                        onChange={(e) => {
                          const nextSt = [...(editingQuestion.pernyataan_kategori || [])];
                          nextSt[sIdx] = { ...nextSt[sIdx], teks: e.target.value };
                          setEditingQuestion({
                            ...editingQuestion,
                            pernyataan_kategori: nextSt,
                          });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-xs text-white"
                      />
                      <select
                        value={st.kunci || 'A'}
                        onChange={(e) => {
                          const nextSt = [...(editingQuestion.pernyataan_kategori || [])];
                          nextSt[sIdx] = {
                            ...nextSt[sIdx],
                            kunci: e.target.value as 'A' | 'B',
                          };
                          const kunciObj: Record<string, string> = {};
                          nextSt.forEach((item) => {
                            kunciObj[item.id_pernyataan] = item.kunci || 'A';
                          });
                          setEditingQuestion({
                            ...editingQuestion,
                            pernyataan_kategori: nextSt,
                            kunci_jawaban: JSON.stringify(kunciObj),
                          });
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-xs text-emerald-300 font-bold"
                      >
                        <option value="A">Benar / Sesuai (A)</option>
                        <option value="B">Salah / Tidak Sesuai (B)</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Kunci Jawaban (mis. &quot;0&quot; atau &quot;[0,1,3]&quot; atau JSON)
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.kunci_jawaban || ''}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        kunci_jawaban: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-xs text-emerald-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Pembahasan</label>
                  <input
                    type="text"
                    value={editingQuestion.pembahasan || ''}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        pembahasan: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedQuestion}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black"
                >
                  Simpan Perubahan Soal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            MODAL EDITOR STIMULUS UNTUK GURU
        ============================================================ */}
        {editingStimulus && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-sky-500/40 rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white">
                  Edit Stimulus ({editingStimulus.id_stimulus})
                </h3>
                <button
                  onClick={() => setEditingStimulus(null)}
                  className="p-1.5 rounded-lg bg-white/10 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Jenis Stimulus</label>
                  <select
                    value={editingStimulus.jenis}
                    onChange={(e) =>
                      setEditingStimulus({
                        ...editingStimulus,
                        jenis: e.target.value as AsesmenStimulusType,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white"
                  >
                    <option value="teks">Teks Bacaan / Kasus</option>
                    <option value="tabel">Tabel Spesifikasi (JSON)</option>
                    <option value="grafik">Grafik / Infografis (JSON)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Judul Stimulus</label>
                  <input
                    type="text"
                    value={editingStimulus.judul || ''}
                    onChange={(e) =>
                      setEditingStimulus({ ...editingStimulus, judul: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Isi Stimulus (Teks atau JSON untuk Tabel/Grafik)
                </label>
                <textarea
                  rows={5}
                  value={editingStimulus.isi}
                  onChange={(e) =>
                    setEditingStimulus({ ...editingStimulus, isi: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStimulus(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedStimulus}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black"
                >
                  Simpan Stimulus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
