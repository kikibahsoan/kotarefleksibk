/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Student,
  Materi,
  LearningObjective,
  Reflection,
  MentorFeedback,
  Message,
  QuizQuestion,
  TownSettings,
  BuildingId,
  BankMateriEntry,
} from './types/index.ts';
import { StorageService } from './utils/storage.ts';
import { evaluateBadges, calculateStudentLevel } from './utils/rules.ts';
import { ThreeTownCanvas, BUILDINGS_INFO } from './components/ThreeTownCanvas.tsx';
import { StudentWelcome } from './components/StudentWelcome.tsx';
import { CloudTransition } from './components/CloudTransition.tsx';
import { TeacherPinModal } from './components/TeacherPinModal.tsx';
import { QuickNav2D } from './components/QuickNav2D.tsx';
import {
  BalaiKotaModal,
  TownMissionDef,
  getOrInitUserRandomMissions,
  getCompletedMissionIds,
  saveCompletedMissionIds,
} from './components/modals/BalaiKotaModal.tsx';
import { PerpustakaanModal } from './components/modals/PerpustakaanModal.tsx';
import { TamanRefleksiModal } from './components/modals/TamanRefleksiModal.tsx';
import { MenaraMentorModal } from './components/modals/MenaraMentorModal.tsx';
import { BengkelLatihanModal } from './components/modals/BengkelLatihanModal.tsx';
import { KantorPosModal } from './components/modals/KantorPosModal.tsx';
import { PasarPrestasiModal } from './components/modals/PasarPrestasiModal.tsx';
import { RuangGuruModal } from './components/modals/RuangGuruModal.tsx';
import { MonumenWargaChatModal } from './components/modals/MonumenWargaChatModal.tsx';
import { MasjidModal } from './components/modals/MasjidModal.tsx';
import { BankMateriModal } from './components/modals/BankMateriModal.tsx';
import { PusatKotaBuildingModal } from './components/modals/PusatKotaBuildingModal.tsx';
import { ArenaRumahMisteriModal } from './components/modals/ArenaRumahMisteriModal.tsx';
import { EscapeRoomMenaraModal } from './components/modals/EscapeRoomMenaraModal.tsx';
import { MenaraAsesmenIndividuModal } from './components/modals/MenaraAsesmenIndividuModal.tsx';
import { isPusatKotaBuilding } from './utils/aturanBakuKota.ts';
import { FloatingWorldChat } from './components/FloatingWorldChat.tsx';
import { LofiAudioControl } from './components/LofiAudioControl.tsx';
import { getTimePeriodWita, TimePeriod } from './utils/lofiAudio.ts';
import { WeatherType, getWeatherTypeWita, getWeatherMeta, fetchGorontaloLiveWeather } from './utils/weather.ts';
import { WeatherGorontaloModal } from './components/modals/WeatherGorontaloModal.tsx';
import { KalenderNasionalModal } from './components/modals/KalenderNasionalModal.tsx';
import { KartuWargaModal } from './components/modals/KartuWargaModal.tsx';
import { sounds } from './utils/audio.ts';
import { PublicChatMessage } from './types/index.ts';
import {
  LogOut,
  Sparkles,
  Volume2,
  VolumeX,
  Compass,
  ChevronLeft,
  Users,
  Sprout,
  Bell,
  Clock,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [student, setStudent] = useState<Student | null>(() => {
    const cur = StorageService.getCurrentStudent();
    if (cur && (cur.id === 'teacher-kikybahsoan' || cur.name.toLowerCase() === 'kikybahsoan' || cur.id === 'teacher-guru.dkv')) {
      const updated: Student = {
        ...cur,
        id: 'teacher-kikybahsoan',
        name: 'kikybahsoan',
        className: 'Master Guru',
        points: 999,
      };
      StorageService.setCurrentStudent(updated);
      StorageService.saveOrUpdateStudent(updated);
      return updated;
    }
    if (cur && cur.isGuest && (cur.points === undefined || cur.points === 5)) {
      const updatedGuest: Student = { ...cur, points: 10 };
      StorageService.setCurrentStudent(updatedGuest);
      return updatedGuest;
    }
    return cur;
  });
  const studentRef = useRef<Student | null>(student);
  studentRef.current = student;

  const [bankMateriList, setBankMateriList] = useState<BankMateriEntry[]>(() => {
    const initialList = StorageService.getBankMateri();
    StorageService.applyBankMateriToCityState(initialList);
    return initialList;
  });
  const [materis, setMateris] = useState<Materi[]>(() => StorageService.getMateri());
  const [objectives, setObjectives] = useState<LearningObjective[]>(() => StorageService.getObjectives());
  const [reflections, setReflections] = useState<Reflection[]>(() => StorageService.getReflections());
  const [feedbacks, setFeedbacks] = useState<MentorFeedback[]>(() => StorageService.getFeedbacks());
  const [messages, setMessages] = useState<Message[]>(() => StorageService.getMessages());
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() => StorageService.getQuizQuestions());
  const [settings, setSettings] = useState<TownSettings>(() => StorageService.getSettings());

  // Randomized 5 missions per user (3 XP per mission, auto-completed without claim button)
  const [assignedMissions, setAssignedMissions] = useState<TownMissionDef[]>(() =>
    student ? getOrInitUserRandomMissions(student.id, false) : []
  );
  const assignedMissionsRef = useRef<TownMissionDef[]>(assignedMissions);
  assignedMissionsRef.current = assignedMissions;

  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>(() =>
    student ? getCompletedMissionIds(student.id) : []
  );
  const completedMissionIdsRef = useRef<string[]>(completedMissionIds);
  completedMissionIdsRef.current = completedMissionIds;

  const [missionToast, setMissionToast] = useState<string | null>(null);
  const missionToastTimerRef = useRef<number | null>(null);

  // Interactive floating pop-up for XP gain feedback
  const [latestXpGain, setLatestXpGain] = useState<{ amount: number; reason?: string; timestamp: number } | null>(null);
  const xpGainTimerRef = useRef<number | null>(null);

  const [activeBuilding, setActiveBuilding] = useState<BuildingId | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isTeacherPinModalOpen, setIsTeacherPinModalOpen] = useState(false);
  const [loggedTeacherName, setLoggedTeacherName] = useState<string | null>(null);
  const [teacherModalInitialTab, setTeacherModalInitialTab] = useState<'refleksi' | 'materi' | 'pesan' | 'pengaturan' | 'konsultasi'>('refleksi');
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);
  const [preselectedMateriForReflection, setPreselectedMateriForReflection] = useState<string | undefined>(undefined);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(() => getTimePeriodWita());

  // 4 Tipe Cuaca WITA & Suhu Realtime Gorontalo
  const [weatherType, setWeatherType] = useState<WeatherType>(() => getWeatherTypeWita());
  const [liveGorontaloTemp, setLiveGorontaloTemp] = useState<number | undefined>(undefined);
  const [liveGorontaloHumidity, setLiveGorontaloHumidity] = useState<number | undefined>(undefined);
  const [weatherOverride, setWeatherOverride] = useState<WeatherType | 'auto'>('auto');
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isKwrModalOpen, setIsKwrModalOpen] = useState(false);
  const weatherOverrideRef = useRef(weatherOverride);
  weatherOverrideRef.current = weatherOverride;

  // Live Clock (Asia/Makassar)
  const [currentTimeWita, setCurrentTimeWita] = useState(() => {
    const now = new Date();
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimePeriod(getTimePeriodWita(now));
      const autoWeather = getWeatherTypeWita(now);
      if (weatherOverrideRef.current === 'auto') {
        setWeatherType(autoWeather);
      }
      setCurrentTimeWita(
        new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Makassar',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(now)
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Atmospheric weather automatic change notification with smooth fade-in/fade-out
  const [weatherChangeToast, setWeatherChangeToast] = useState<{ icon: string; title: string; desc: string } | null>(null);
  const [showCareerModalInSkyscraper, setShowCareerModalInSkyscraper] = useState(false);
  const prevWeatherForToastRef = useRef<WeatherType>(weatherType);

  useEffect(() => {
    if (prevWeatherForToastRef.current !== weatherType) {
      prevWeatherForToastRef.current = weatherType;

      if (studentRef.current) {
        const infoMap: Record<WeatherType, { icon: string; title: string; desc: string }> = {
          berawan: { icon: '☁️', title: 'Cuaca Berawan (15.00 - 17.00)', desc: 'Awan kumulus sejuk berarak menaungi kota Refleksia' },
          hujan_ringan: { icon: '🌧️', title: 'Hujan Ringan (10.00-12.00 & 21.00-22.30)', desc: 'Rintik hujan lembut membasahi tanah kota' },
          salju: { icon: '❄️', title: 'Salju Malam (00.00 - 02.30)', desc: 'Serpihan salju melayang anggun di keheningan kota' },
          normal: { icon: '☀️', title: 'Cuaca Normal', desc: 'Langit cerah alami menyinari Kota Refleksia' },
        };
        const info = infoMap[weatherType];
        if (info) {
          setWeatherChangeToast(info);
          const t = setTimeout(() => {
            setWeatherChangeToast(null);
          }, 4500);
          return () => clearTimeout(t);
        }
      }
    }
  }, [weatherType]);

  // Fetch real-time temperature & humidity for Gorontalo
  useEffect(() => {
    let isCancelled = false;
    const syncGorontaloWeather = async () => {
      try {
        const live = await fetchGorontaloLiveWeather();
        if (live && !isCancelled) {
          setLiveGorontaloTemp(live.tempCelsius);
          setLiveGorontaloHumidity(live.humidity);
        }
      } catch {}
    };

    syncGorontaloWeather();
    const interval = setInterval(syncGorontaloWeather, 5 * 60 * 1000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Sync Bank Materi from Server & Google Spreadsheet and distribute to all buildings for Students & Teachers
  const refreshBankMateriState = useCallback(async () => {
    try {
      const merged = await StorageService.fetchBankMateriFromAllSources();
      setBankMateriList(merged);
      setMateris(StorageService.getMateri());
      setObjectives(StorageService.getObjectives());
      setQuizQuestions(StorageService.getQuizQuestions());
    } catch {
      // Safe fallback
    }
  }, []);

  useEffect(() => {
    refreshBankMateriState();
    const interval = setInterval(refreshBankMateriState, 15000);
    return () => clearInterval(interval);
  }, [refreshBankMateriState]);

  const currentWeatherInfo = useMemo(
    () => getWeatherMeta(weatherType, liveGorontaloTemp, liveGorontaloHumidity),
    [weatherType, liveGorontaloTemp, liveGorontaloHumidity]
  );

  // Live World Chat State matching screenshot
  const [publicChats, setPublicChats] = useState<PublicChatMessage[]>(() =>
    StorageService.getPublicChatMessages()
  );
  const publicChatsRef = useRef(publicChats);
  publicChatsRef.current = publicChats;

  const [latestChat, setLatestChat] = useState<PublicChatMessage | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Sync public chat updates via event - only update if data changed
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        const curIds = publicChatsRef.current.map((c) => c.id).join(',');
        const newIds = e.detail.map((c: any) => c.id).join(',');
        if (curIds !== newIds) {
          setPublicChats(e.detail);
        }
      }
    };
    window.addEventListener('kota_refleksi_public_chat_updated', handleUpdate);
    return () => window.removeEventListener('kota_refleksi_public_chat_updated', handleUpdate);
  }, []);

  const playChimeSound = () => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // safe fallback
    }
  };

  // Auto-sync world chat strictly from dedicated server endpoint (/api/chat/messages)
  // Only updates state if new chat messages actually arrived or expired
  // Prevents heavy full-app reloads or disruptions to 3D canvas and other modules
  useEffect(() => {
    let isCancelled = false;

    const pullRemoteChats = async () => {
      try {
        const currentList = publicChatsRef.current;
        const prevIds = currentList.map((c: PublicChatMessage) => c.id).join(',');
        const remoteList = await StorageService.fetchPublicChatMessages();
        if (isCancelled) return;

        const newIds = remoteList.map((c: PublicChatMessage) => c.id).join(',');
        // If chat IDs are identical, exit early to prevent ANY re-rendering of App or canvas
        if (prevIds === newIds) {
          return;
        }

        const prevIdSet = new Set(currentList.map((c: PublicChatMessage) => c.id));
        // Check if there are brand-new incoming messages from other students
        const incomingFromOthers = remoteList.filter(
          (msg: PublicChatMessage) => !prevIdSet.has(msg.id) && msg.senderId !== student?.id
        );

        if (incomingFromOthers.length > 0) {
          // Display the newest incoming message in bubble & play gentle chime
          setLatestChat(incomingFromOthers[incomingFromOthers.length - 1]);
          playChimeSound();
        }

        setPublicChats(remoteList);
      } catch (err) {
        // Safe silent fallback
      }
    };

    pullRemoteChats();
    const interval = setInterval(pullRemoteChats, 3500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [student?.id]);

  // Add points to student saldo (from missions, reflection, quiz, chat)
  const handleAddPoints = useCallback(
    (amount: number, _reason?: string) => {
      const current = studentRef.current;
      if (!current || current.isGuest) return;
      const newPoints = current.points + amount;
      const myReflections = reflections.filter((r) => r.studentId === current.id);
      const myMessages = messages.filter((m) => m.studentId === current.id);
      const newBadges = evaluateBadges(current, myReflections, 1, myMessages.length);

      const updatedStudent: Student = {
        ...current,
        points: newPoints,
        badges: newBadges,
      };

      studentRef.current = updatedStudent;
      setStudent(updatedStudent);
      StorageService.saveOrUpdateStudent(updatedStudent);
      StorageService.setCurrentStudent(updatedStudent);

      try {
        confetti({
          particleCount: 45,
          spread: 65,
          origin: { y: 0.65 },
        });
      } catch (e) {
        // Safe fallback
      }

      // Trigger interactive floating XP pop-up
      setLatestXpGain({ amount, reason: _reason, timestamp: Date.now() });
      if (xpGainTimerRef.current) {
        window.clearTimeout(xpGainTimerRef.current);
      }
      xpGainTimerRef.current = window.setTimeout(() => {
        setLatestXpGain(null);
        xpGainTimerRef.current = null;
      }, 2800);
    },
    [reflections, messages]
  );

  // Automatically complete a randomized mission and award +1 XP (no manual claim button)
  const completeMissionIfActive = useCallback(
    (missionId: string) => {
      const current = studentRef.current;
      if (!current || current.isGuest) return;
      const activeList = assignedMissionsRef.current;
      const completedList = completedMissionIdsRef.current;

      const foundMission = activeList.find((m) => m.id === missionId);
      if (!foundMission || completedList.includes(missionId)) {
        return;
      }

      const nextCompleted = [...completedList, missionId];
      completedMissionIdsRef.current = nextCompleted;
      setCompletedMissionIds(nextCompleted);
      saveCompletedMissionIds(current.id, nextCompleted);

      sounds.playRewardXp();
      const awardedXp = foundMission.xp || 1;
      handleAddPoints(awardedXp, foundMission.title);
      StorageService.recordStudentActivity(current.id, 'mission', 1);
      StorageService.logWeeklyXpGain({
        studentId: current.id,
        studentName: current.name,
        className: current.className,
        xpEarned: awardedXp,
        activityType: 'misi',
        description: `Misi Tuntas: ${foundMission.title}`,
      });

      if (missionToastTimerRef.current) {
        window.clearTimeout(missionToastTimerRef.current);
      }
      setMissionToast(`🎯 Misi Tuntas: "${foundMission.title}" (+${awardedXp} XP otomatis masuk ke saldo!)`);
      missionToastTimerRef.current = window.setTimeout(() => {
        setMissionToast(null);
        missionToastTimerRef.current = null;
      }, 3600);
    },
    [handleAddPoints]
  );

  const handleSelectBuilding = useCallback(
    (buildingId: BuildingId) => {
      if (studentRef.current?.isGuest) {
        sounds.playClick();
        if (missionToastTimerRef.current) {
          window.clearTimeout(missionToastTimerRef.current);
        }
        setMissionToast(
          '📸 Mode Tamu (Hanya Melihat-lihat): Tamu tidak dapat masuk ke dalam gedung.'
        );
        missionToastTimerRef.current = window.setTimeout(() => {
          setMissionToast(null);
          missionToastTimerRef.current = null;
        }, 4000);
        return;
      }

      if (buildingId === 'bank_materi' && !studentRef.current?.isTeacher) {
        sounds.playClick();
        if (missionToastTimerRef.current) {
          window.clearTimeout(missionToastTimerRef.current);
        }
        setMissionToast(
          '🔒 Gedung Bank Materi khusus untuk Bapak/Ibu Guru! Materi hasil Generate AI Guru sudah tersebar di Perpustakaan, Pusat Refleksi, Studio ON AIR, Lab DKV & Tefa, serta Balai Kota.'
        );
        missionToastTimerRef.current = window.setTimeout(() => {
          setMissionToast(null);
          missionToastTimerRef.current = null;
        }, 4800);
        return;
      }

      setActiveBuilding(buildingId);
      if (buildingId === 'perpustakaan') {
        completeMissionIfActive('m_perpustakaan');
      } else if (buildingId === 'menara_mentor') {
        completeMissionIfActive('m_mentor');
      } else if (buildingId === 'monumen_warga') {
        completeMissionIfActive('m_papan');
      } else if (buildingId === 'pasar_prestasi') {
        completeMissionIfActive('m_pasar');
      } else if (buildingId === 'masjid') {
        completeMissionIfActive('m_masjid');
      }
    },
    [completeMissionIfActive]
  );

  // Deduct points from student/teacher/guest saldo automatically when used in town (e.g. ayunan)
  const handleDeductPoints = useCallback((amount: number, _reason?: string): boolean => {
    const current = studentRef.current;
    if (!current) return false;
    if (current.points < amount) {
      return false;
    }
    const newPoints = Math.max(0, current.points - amount);
    const updatedStudent: Student = {
      ...current,
      points: newPoints,
    };
    studentRef.current = updatedStudent;
    setStudent(updatedStudent);
    StorageService.saveOrUpdateStudent(updatedStudent);
    StorageService.setCurrentStudent(updatedStudent);
    return true;
  }, []);

  const handleSendWorldChat = (text: string) => {
    const current = studentRef.current;
    if (!current) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const cleanHandle = current.name
      .split(' ')
      .slice(0, 2)
      .join('_')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    const newMsg: PublicChatMessage = {
      id: `pchat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: current.id,
      senderName: current.name,
      senderHandle: `@${cleanHandle || (current.isTeacher ? 'guru_dkv' : 'siswa')}`,
      className: current.className,
      roomNumber: (current.className.includes('DKV 3') ? 3 : 2) as 1 | 2 | 3,
      content: text,
      timestamp: `${hours}.${minutes}`,
      createdAt: now.toISOString(),
      avatarColor: current.isTeacher ? '#f59e0b' : '#38bdf8',
      isTeacher: Boolean(current.isTeacher),
    };

    // Update only chat state locally immediately with newest at the BOTTOM
    setPublicChats((prev) => [...prev.filter((m) => m.id !== newMsg.id), newMsg].slice(-25));
    setLatestChat(newMsg);
    playChimeSound();

    // Automatically complete chat mission (+1 XP) if assigned
    completeMissionIfActive('m_chat');

    // Record world chat activity
    StorageService.recordStudentActivity(current.id, 'chat', 1);

    // Persist and send to chat server asynchronously without blocking UI or triggering full data reloads
    StorageService.addPublicChatMessage(newMsg).catch(() => {});
  };

  const handleReportMessage = (msgId: string) => {
    StorageService.reportChatMessage(msgId);
    setPublicChats((prev) => prev.filter((m) => m.id !== msgId));
  };

  // Check ?autostart=1 for headless testing & fast access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !student) {
      const demoStudent: Student = {
        id: 'std-dkv2-01',
        name: 'ABDUL RAZAK SAMAUNA',
        className: 'X DKV 2 (Desain Komunikasi Visual)',
        studentNumber: '01',
        password: '0101315814',
        gender: 'L',
        points: 5,
        badges: ['reflektor_pertama', 'penjelajah_rajin'],
        lastLogin: new Date().toISOString().slice(0, 10),
        streakDays: 3,
      };
      studentRef.current = demoStudent;
      setStudent(demoStudent);
      StorageService.setCurrentStudent(demoStudent);
      StorageService.saveOrUpdateStudent(demoStudent);
      const randomMissions = getOrInitUserRandomMissions(demoStudent.id, true);
      setAssignedMissions(randomMissions);
      setCompletedMissionIds([]);
      saveCompletedMissionIds(demoStudent.id, []);
    }
  }, [student]);

  // If previous saved student was in removed DKV 1, clear session
  useEffect(() => {
    if (student && student.className.includes('DKV 1')) {
      StorageService.setCurrentStudent(null);
      studentRef.current = null;
      setStudent(null);
    }
  }, [student]);

  // Animasi minimalis awan tertutup & terbuka saat perpindahan login ke kota
  const [cloudPhase, setCloudPhase] = useState<'idle' | 'closing' | 'opening'>('idle');
  const [cloudMessage, setCloudMessage] = useState<string>('Memasuki Refleksia City...');
  const pendingStudentRef = useRef<Student | null>(null);
  const pendingTeacherDestinationRef = useRef<string | null>(null);

  // Handle Student / Guest Login dengan transisi awan lembut (Closing -> Midpoint -> Opening)
  const handleLoginStudent = (newStudent: Student) => {
    const loginXp = newStudent.isTeacher || newStudent.isGuest ? 10 : 5;
    const studentWithLoginXp: Student = {
      ...newStudent,
      points: loginXp,
      isGuest: Boolean(newStudent.isGuest),
    };
    pendingStudentRef.current = studentWithLoginXp;
    pendingTeacherDestinationRef.current = null;
    if (studentWithLoginXp.isGuest) {
      setCloudMessage('Selamat Datang Tamu Refleksia City...');
    } else if (studentWithLoginXp.isTeacher) {
      setCloudMessage('Selamat Datang Bapak/Ibu Guru...');
    } else {
      setCloudMessage('Memasuki Refleksia City...');
    }
    // Tutup awan dari kiri dan kanan
    setCloudPhase('closing');
  };

  // Handle Teacher Login dengan transisi awan lembut (Closing -> Midpoint -> Opening)
  const handleLoginTeacher = (teacherUser: Student, destination?: string) => {
    pendingStudentRef.current = teacherUser;
    pendingTeacherDestinationRef.current = destination || null;
    setCloudMessage('Selamat Datang Bapak/Ibu Guru...');
    setIsTeacherPinModalOpen(false);
    // Tutup awan dari kiri dan kanan
    setCloudPhase('closing');
  };

  // Pastikan warga yang sedang aktif di sesi ini tercatat oleh Penjaga Gerbang Nawa & data bangunan tersinkron ke Spreadsheet
  useEffect(() => {
    if (student && student.name) {
      StorageService.recordCityEntry(student);
      StorageService.syncCityBuildingsToSpreadsheet();
    }
  }, [student?.id, student?.name]);

  const handleCloudMidpoint = () => {
    if (pendingStudentRef.current) {
      const studentWithLoginXp = pendingStudentRef.current;
      studentRef.current = studentWithLoginXp;
      setStudent(studentWithLoginXp);
      StorageService.setCurrentStudent(studentWithLoginXp);
      StorageService.recordCityEntry(studentWithLoginXp);
      if (!studentWithLoginXp.isGuest) {
        StorageService.saveOrUpdateStudent(studentWithLoginXp);
      }

      // Randomize missions on login
      const randomMissions = getOrInitUserRandomMissions(studentWithLoginXp.id, true);
      assignedMissionsRef.current = randomMissions;
      setAssignedMissions(randomMissions);
      completedMissionIdsRef.current = [];
      setCompletedMissionIds([]);
      saveCompletedMissionIds(studentWithLoginXp.id, []);

      // Record login town activity
      if (!studentWithLoginXp.isGuest) {
        StorageService.recordStudentActivity(studentWithLoginXp.id, 'login', 1);
      }

      // Jika guru langsung menuju ke panel Ruang Guru
      if (pendingTeacherDestinationRef.current === 'panel') {
        setTeacherModalInitialTab('refleksi');
        setIsTeacherModalOpen(true);
      }
    }
    // Buka awan ke kiri dan kanan memperlihatkan kota
    setCloudPhase('opening');
  };

  const handleCloudComplete = () => {
    setCloudPhase('idle');
    pendingStudentRef.current = null;
    pendingTeacherDestinationRef.current = null;
  };

  // Handle Logout
  const handleLogout = () => {
    studentRef.current = null;
    setStudent(null);
    StorageService.setCurrentStudent(null);
    setActiveBuilding(null);
  };

  // Submit Reflection
  const handleSubmitReflection = (newReflection: Reflection, newFeedback: MentorFeedback) => {
    if (studentRef.current?.isGuest) {
      sounds.playClick();
      if (missionToastTimerRef.current) {
        window.clearTimeout(missionToastTimerRef.current);
      }
      setMissionToast('📸 Mode Tamu Kota (Wartawan): Akses Anda hanya melihat-lihat (View Only).');
      missionToastTimerRef.current = window.setTimeout(() => {
        setMissionToast(null);
        missionToastTimerRef.current = null;
      }, 3600);
      return;
    }
    const updatedReflections = [newReflection, ...reflections];
    const updatedFeedbacks = [newFeedback, ...feedbacks];

    setReflections(updatedReflections);
    setFeedbacks(updatedFeedbacks);
    StorageService.addReflection(newReflection);
    StorageService.addFeedback(newFeedback);

    // Sync to Google Apps Script (Sheet: Data_Refleksi_Siswa & Refleksi_Siswa)
    StorageService.syncWithGAS('submit_reflection', {
      reflection: newReflection,
      feedback: newFeedback,
      targetSheet: 'Data_Refleksi_Siswa',
    });

    // Complete reflection mission (+1 XP automatic) or update badges
    const current = studentRef.current;
    if (current) {
      StorageService.recordStudentActivity(current.id, 'reflection', 1);
      StorageService.logWeeklyXpGain({
        studentId: current.id,
        studentName: current.name,
        className: current.className,
        xpEarned: 1,
        activityType: 'refleksi',
        description: `Refleksi Siswa: ${newReflection.materiTitle || 'Pusat Refleksi'}`,
      });
      const hasReflectionMission =
        assignedMissionsRef.current.some((m) => m.id === 'm_refleksi') &&
        !completedMissionIdsRef.current.includes('m_refleksi');

      if (hasReflectionMission) {
        completeMissionIfActive('m_refleksi');
      } else {
        sounds.playRewardXp();
        handleAddPoints(1, 'Kirim Refleksi di Pusat Refleksi');
        if (missionToastTimerRef.current) {
          window.clearTimeout(missionToastTimerRef.current);
        }
        setMissionToast('🌍 Refleksi terkirim & tersinkron ke Data_Refleksi_Siswa! (+1 Poin masuk ke saldo!)');
        missionToastTimerRef.current = window.setTimeout(() => {
          setMissionToast(null);
          missionToastTimerRef.current = null;
        }, 3600);
      }
    }
  };

  // Delete a specific reflection
  const handleDeleteReflection = (reflectionId: string) => {
    const updatedReflections = reflections.filter((r) => r.id !== reflectionId);
    const updatedFeedbacks = feedbacks.filter((f) => f.reflectionId !== reflectionId);
    setReflections(updatedReflections);
    setFeedbacks(updatedFeedbacks);
    StorageService.deleteReflection(reflectionId);
  };

  // Clear all reflections
  const handleClearAllReflections = () => {
    setReflections([]);
    setFeedbacks([]);
    StorageService.clearReflections();
  };

  // Update checkable learning plan steps
  const handleUpdateFeedbackSteps = (feedbackId: string, steps: boolean[]) => {
    const updated = feedbacks.map((f) => (f.id === feedbackId ? { ...f, completedSteps: steps } : f));
    setFeedbacks(updated);
    StorageService.setFeedbacks(updated);
  };

  // Answer Quiz Correctly (+1 XP per correct question)
  const handleAnswerCorrect = (pointsEarned: number) => {
    const current = studentRef.current;
    if (!current) return;
    StorageService.recordStudentActivity(current.id, 'quiz', 1);
    const newPoints = current.points + pointsEarned;
    const myReflections = reflections.filter((r) => r.studentId === current.id);
    const myMessages = messages.filter((m) => m.studentId === current.id);
    const newBadges = evaluateBadges(current, myReflections, 2, myMessages.length);

    const updatedStudent: Student = {
      ...current,
      points: newPoints,
      badges: newBadges,
    };
    studentRef.current = updatedStudent;
    setStudent(updatedStudent);
    StorageService.saveOrUpdateStudent(updatedStudent);
    StorageService.setCurrentStudent(updatedStudent);

    try {
      confetti({
        particleCount: 30,
        spread: 55,
        origin: { y: 0.8 },
      });
    } catch (e) {
      // Safe fallback
    }
  };

  // Send Message from Kantor Pos
  const handleSendMessage = (content: string) => {
    const current = studentRef.current;
    if (!current) return;
    if (current.isGuest) {
      sounds.playClick();
      if (missionToastTimerRef.current) {
        window.clearTimeout(missionToastTimerRef.current);
      }
      setMissionToast('📸 Mode Tamu Kota (Wartawan): Akses Anda hanya melihat-lihat (View Only).');
      missionToastTimerRef.current = window.setTimeout(() => {
        setMissionToast(null);
        missionToastTimerRef.current = null;
      }, 3600);
      return;
    }
    const newMsg: Message = {
      id: `msg-${Date.now().toString(36)}`,
      studentId: current.id,
      studentName: current.name,
      className: current.className,
      content,
      status: 'unread',
      createdAt: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    };

    const updatedMessages = [newMsg, ...messages];
    setMessages(updatedMessages);
    StorageService.addMessage(newMsg);
    StorageService.recordStudentActivity(current.id, 'message', 1);

    // Sync to Google Apps Script (Sheet: Pesan_Kantor_Pos & Pesan_Guru)
    StorageService.syncWithGAS('send_message', {
      message: newMsg,
      targetSheet: 'Pesan_Kantor_Pos',
    });
    StorageService.logWeeklyXpGain({
      studentId: current.id,
      studentName: current.name,
      className: current.className,
      xpEarned: 1,
      activityType: 'kantor_pos',
      description: 'Kirim Surat Konsultasi di Kantor Pos',
    });

    // Complete Kantor Pos mission (+1 XP automatic) if assigned
    const hasPosMission =
      assignedMissionsRef.current.some((m) => m.id === 'm_pos') &&
      !completedMissionIdsRef.current.includes('m_pos');

    if (hasPosMission) {
      completeMissionIfActive('m_pos');
    } else {
      const myReflections = reflections.filter((r) => r.studentId === current.id);
      const newBadges = evaluateBadges(current, myReflections, 0, updatedMessages.length);
      const updatedStudent: Student = { ...current, badges: newBadges };
      studentRef.current = updatedStudent;
      setStudent(updatedStudent);
      StorageService.saveOrUpdateStudent(updatedStudent);
      StorageService.setCurrentStudent(updatedStudent);
    }
  };

  // Teacher Reply to Message
  const handleReplyMessage = (messageId: string, reply: string) => {
    const repliedAt = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const updated = messages.map((m) =>
      m.id === messageId
        ? {
            ...m,
            teacherReply: reply,
            status: 'replied' as const,
            repliedAt,
          }
        : m
    );
    setMessages(updated);
    StorageService.setMessages(updated);

    // Sync reply back to Google Spreadsheet
    StorageService.syncWithGAS('reply_message', { messageId, reply, repliedAt });
  };

  // Sync reflections & messages from Google Spreadsheet
  const handleSyncReflectionsAndMessages = (
    syncedReflections: Reflection[],
    syncedFeedbacks: MentorFeedback[],
    syncedMessages: Message[]
  ) => {
    const deletedIds = new Set(StorageService.getDeletedReflectionIds());
    const validSyncedReflections = syncedReflections.filter((r) => !deletedIds.has(r.id));
    const validSyncedFeedbacks = syncedFeedbacks.filter((f) => !deletedIds.has(f.reflectionId));

    // Merge reflections by ID
    const refMap = new Map<string, Reflection>();
    validSyncedReflections.forEach((r) => refMap.set(r.id, r));
    reflections.forEach((r) => {
      if (!refMap.has(r.id) && !deletedIds.has(r.id)) refMap.set(r.id, r);
    });
    const mergedReflections = Array.from(refMap.values());

    // Merge feedbacks
    const fbMap = new Map<string, MentorFeedback>();
    validSyncedFeedbacks.forEach((f) => fbMap.set(f.id, f));
    feedbacks.forEach((f) => {
      if (!fbMap.has(f.id) && !deletedIds.has(f.reflectionId)) fbMap.set(f.id, f);
    });
    const mergedFeedbacks = Array.from(fbMap.values());

    // Merge messages
    const msgMap = new Map<string, Message>();
    syncedMessages.forEach((m) => msgMap.set(m.id, m));
    messages.forEach((m) => {
      if (!msgMap.has(m.id)) msgMap.set(m.id, m);
    });
    const mergedMessages = Array.from(msgMap.values());

    setReflections(mergedReflections);
    setFeedbacks(mergedFeedbacks);
    setMessages(mergedMessages);

    StorageService.setReflections(mergedReflections);
    StorageService.setFeedbacks(mergedFeedbacks);
    StorageService.setMessages(mergedMessages);
  };

  // Add Materi (from Teacher)
  const handleAddMateri = (materi: Materi) => {
    const updated = [materi, ...materis];
    setMateris(updated);
    StorageService.addMateri(materi);
  };

  // Delete Materi
  const handleDeleteMateri = (id: string) => {
    const updated = materis.filter((m) => m.id !== id);
    setMateris(updated);
    StorageService.deleteMateri(id);
  };

  // Add Objective (from Teacher)
  const handleAddObjective = (obj: LearningObjective) => {
    const updated = [...objectives, obj];
    setObjectives(updated);
    StorageService.addObjective(obj);
  };

  // Update Town Settings
  const handleUpdateSettings = (newSettings: TownSettings) => {
    setSettings(newSettings);
    StorageService.setSettings(newSettings);
  };

  // Building ids with new materials (memoized to keep reference stable)
  const newMateriBuildingIds: BuildingId[] = useMemo(
    () => materis.filter((m) => m.isNew).map((m) => m.location),
    [materis]
  );

  // Memoize check if student has shared a chat today for Balai Kota missions
  const hasSharedChatToday = useMemo(() => {
    return student ? publicChats.some((c) => c.senderId === student.id) : false;
  }, [publicChats, student?.id]);

  // If no student is logged in, show Welcome Entrance
  if (!student) {
    return (
      <main className="w-full min-h-screen">
        <StudentWelcome
          onLoginStudent={handleLoginStudent}
          onOpenTeacherLogin={() => setIsTeacherPinModalOpen(true)}
          existingStudent={StorageService.getCurrentStudent()}
          timePeriod={timePeriod}
          weatherType={weatherType}
        />

        {/* Minimalist Cloud Transition (Awan Tertutup & Terbuka) */}
        <CloudTransition
          phase={cloudPhase}
          message={cloudMessage}
          onMidpoint={handleCloudMidpoint}
          onComplete={handleCloudComplete}
        />

        {isTeacherPinModalOpen && (
          <TeacherPinModal
            onClose={() => setIsTeacherPinModalOpen(false)}
            expectedPin={settings.teacherPin}
            onSuccess={(info) => {
              const teacherGender = info?.gender || 'L';
              const teacherSubject = info?.subject || 'Kreatif, Inovatif, dan Kewirausahaan';
              const isMaster = info?.isMasterPin || info?.username === 'kikybahsoan' || info?.name === 'kikybahsoan';
              const teacherUser: Student = {
                id: `teacher-${info?.username || 'guru'}`,
                name: info?.name || 'kikybahsoan',
                className: isMaster ? 'Master Guru' : 'DKV',
                studentNumber: isMaster ? 'MASTER-DKV' : 'GURU-DKV',
                password: '',
                gender: teacherGender,
                points: info?.points !== undefined ? info.points : (isMaster ? 999 : 10),
                badges: isMaster
                  ? ['guru_pembimbing', 'penjelajah_rajin', 'master_refleksi', 'bintang_kota']
                  : ['guru_pembimbing', 'penjelajah_rajin'],
                lastLogin: new Date().toISOString().slice(0, 10),
                streakDays: 5,
                isTeacher: true,
                subject: teacherSubject,
              };

              if (info?.name) {
                setLoggedTeacherName(info.name);
              }
              // Jalankan transisi awan lembut saat guru login
              handleLoginTeacher(teacherUser, info?.destination);
            }}
            onOpenSettings={() => {
              setTeacherModalInitialTab('pengaturan');
              setIsTeacherPinModalOpen(false);
              setIsTeacherModalOpen(true);
            }}
          />
        )}

        {isTeacherModalOpen && (
          <RuangGuruModal
            onClose={() => setIsTeacherModalOpen(false)}
            materis={materis}
            objectives={objectives}
            reflections={reflections}
            feedbacks={feedbacks}
            messages={messages}
            students={StorageService.getStudents()}
            settings={settings}
            initialTab={teacherModalInitialTab}
            onAddMateri={handleAddMateri}
            onDeleteMateri={handleDeleteMateri}
            onAddObjective={handleAddObjective}
            onReplyMessage={handleReplyMessage}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>
    );
  }

  const levelInfo = calculateStudentLevel(student.points);

  const cleanHandle = student.name
    .split(' ')
    .slice(0, 2)
    .join('_')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
  const studentHandle = `@${cleanHandle || 'siswa'}`;
  const roomNum = student.className.includes('DKV 3') ? 3 : 2;

  const isMaster = Boolean(
    student.className === 'Master Guru' ||
    student.studentNumber === 'MASTER-DKV' ||
    student.name.toLowerCase().includes('kikybahsoan') ||
    student.name.toLowerCase().includes('kikybahoan') ||
    student.id.toLowerCase().includes('kikybahsoan')
  );

  return (
    <div
      className={`relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden ${
        timePeriod === 'subuh'
          ? 'bg-[#151a36]'
          : timePeriod === 'pagi'
          ? 'bg-[#60a5fa]'
          : timePeriod === 'siang'
          ? 'bg-[#38bdf8]'
          : timePeriod === 'sore'
          ? 'bg-[#9a3412]'
          : 'bg-[#0c1527]'
      } select-none transition-colors duration-1000 ease-in-out`}
    >
      {/* Minimalist Cloud Transition (Awan Terbuka saat memasuki kota) */}
      <CloudTransition
        phase={cloudPhase}
        message={cloudMessage}
        onMidpoint={handleCloudMidpoint}
        onComplete={handleCloudComplete}
      />

      {/* 2D Isometric Town Canvas */}
      <ThreeTownCanvas
        onSelectBuilding={handleSelectBuilding}
        activeBuilding={activeBuilding}
        newMateriBuildingIds={newMateriBuildingIds}
        studentId={student.id}
        studentName={student.name}
        studentGender={student.gender}
        isTeacher={student.isTeacher}
        isGuest={student.isGuest}
        timePeriod={timePeriod}
        weatherType={weatherType}
        weatherTempCelsius={currentWeatherInfo.tempCelsius}
        latestMessage={latestChat}
        studentPoints={student.points}
        latestXpGain={latestXpGain}
        onDeductPoints={handleDeductPoints}
        onAddXp={handleAddPoints}
      />

      {/* Atmospheric Weather Mood Transition Layer (Smooth fade-in / fade-out) */}
      <div
        className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-1000 ease-in-out ${
          weatherType === 'berawan'
            ? 'opacity-100 bg-gradient-to-b from-slate-900/35 via-slate-800/15 to-transparent'
            : weatherType === 'hujan_ringan'
            ? 'opacity-100 bg-gradient-to-b from-blue-950/40 via-slate-900/20 to-cyan-950/25'
            : weatherType === 'salju'
            ? 'opacity-100 bg-gradient-to-b from-indigo-950/35 via-slate-900/15 to-purple-950/20'
            : 'opacity-0'
        }`}
      />

      {/* ATMOSPHERIC WEATHER AUTO-CHANGE NOTIFICATION BANNER (Smooth fade-in / fade-out) */}
      {weatherChangeToast && (
        <div className="fixed top-12 sm:top-14 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-fade-in flex flex-col items-center transition-all duration-700">
          <div className="bg-[#121e2c]/85 backdrop-blur-md border border-sky-400/50 text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center gap-2.5 max-w-[90vw]">
            <span className="text-lg sm:text-xl shrink-0">{weatherChangeToast.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-sky-200">{weatherChangeToast.title}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Otomatis
                </span>
              </div>
              <p className="text-[10px] text-slate-300 truncate max-w-[240px] sm:max-w-[340px]">
                {weatherChangeToast.desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE FLOATING POP-UP BADGE (+XP Feedback) */}
      {latestXpGain && (
        <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-[100] pointer-events-none animate-bounce flex flex-col items-center">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-xs sm:text-sm px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-[0_10px_35px_rgba(245,158,11,0.6)] border-2 border-amber-300 flex items-center gap-2">
            <span className="text-lg sm:text-xl">🪙</span>
            <span className="tracking-wide">+{latestXpGain.amount} XP</span>
            {latestXpGain.reason && (
              <span className="text-[10px] sm:text-xs text-amber-100 font-semibold bg-black/30 px-2 py-0.5 rounded-lg border border-amber-300/30">
                {latestXpGain.reason}
              </span>
            )}
          </div>
        </div>
      )}

      {/* TOP HEADER OVERLAY (Clean, Semi-Transparent & Guaranteed No Overlap on Mobile) */}
      {!activeBuilding && !isQuickNavOpen && (
        <header className="absolute top-2 sm:top-3.5 left-2 sm:left-4 right-2 sm:right-4 flex items-center justify-between pointer-events-none z-20 gap-1 sm:gap-2 max-w-[calc(100vw-16px)] sm:max-w-[calc(100vw-32px)]">
          {/* Left: < Back button, Profile Capsule, and Master-only Ruang Guru button */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto min-w-0 shrink max-w-[54%] sm:max-w-none">
            {/* Back button */}
            <button
              onClick={handleLogout}
              className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 rounded-full bg-[#121e2c]/68 hover:bg-[#1a293b]/80 backdrop-blur-md text-slate-200 hover:text-white border border-slate-600/50 shadow-lg flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
              title="Ganti Siswa / Keluar"
              aria-label="Kembali"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-200" />
            </button>

            {/* Profile Capsule -> Click to open KWR (Kartu Warga Refleksia) */}
            <button
              type="button"
              onClick={() => setIsKwrModalOpen(true)}
              className="bg-[#121e2c]/68 hover:bg-[#1a293b]/85 backdrop-blur-md border border-slate-600/50 hover:border-amber-400/60 rounded-full px-1.5 sm:px-2.5 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-1.5 shadow-lg min-w-0 shrink transition active:scale-95 cursor-pointer"
              title="Buka KWR (Kartu Warga Refleksia)"
              aria-label="Buka Kartu Warga Refleksia"
            >
              {/* Circular Avatar with gold border */}
              <div className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-200 border-2 border-amber-400 flex items-center justify-center text-slate-950 font-black text-[10px] sm:text-[11px] shadow-sm shrink-0">
                {isMaster
                  ? '⏳'
                  : student.isGuest
                  ? (student.gender === 'P' ? '🧕' : '👦')
                  : student.isTeacher
                  ? (student.gender === 'P' ? '👩‍🏫' : '👨‍🏫')
                  : student.gender === 'P'
                  ? '🧕'
                  : '👦'}
              </div>

              {/* Username Handle (Responsively Truncated so it never overlaps) */}
              <span className="font-extrabold text-[11px] sm:text-xs text-white max-w-[42px] min-[360px]:max-w-[55px] min-[400px]:max-w-[78px] sm:max-w-[125px] md:max-w-[155px] truncate leading-none">
                {studentHandle}
              </span>

              {/* Teacher/Master/Guest Badge - shown only on sm+ to prevent cramping on mobile */}
              {student.isTeacher && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[8.5px] font-extrabold bg-amber-500/25 text-amber-300 border border-amber-400/40 shrink-0">
                  {isMaster ? 'MASTER' : 'GURU'}
                </span>
              )}
              {student.isGuest && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[8.5px] font-extrabold bg-sky-500/25 text-sky-300 border border-sky-400/40 shrink-0">
                  {student.gender === 'P' ? 'WARTAWATI • VIEW ONLY' : 'WARTAWAN • VIEW ONLY'}
                </span>
              )}

              {/* Gold Coin & Saldo */}
              <div className="flex items-center gap-0.5 font-bold text-[10px] sm:text-xs text-amber-400 font-mono shrink-0">
                <span>🪙</span>
                <span>{student.points}</span>
                <span className="hidden md:inline font-sans text-[10px] text-slate-300 font-normal ml-0.5">XP</span>
              </div>
            </button>

            {/* Ruang Guru Button - ONLY visible to Master; completely removed for regular teachers */}
            {isMaster && (
              <button
                onClick={() => setIsTeacherModalOpen(true)}
                className="w-7.5 h-7.5 sm:w-auto sm:px-2.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-500/85 to-orange-500/85 hover:from-amber-400 hover:to-orange-400 backdrop-blur-md text-white font-extrabold text-[10.5px] sm:text-xs shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-amber-300/40 shrink-0"
                title="Buka Ruang Guru (Panel Master)"
                aria-label="Panel Master"
              >
                <span>📋</span>
                <span className="hidden sm:inline">Ruang Guru</span>
              </button>
            )}
          </div>

          {/* Right: Clock • Weather • Notifikasi Misi Harian • QuickNav (Desktop) • Radio • Audio */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0 ml-auto">
            {/* Live Clock Pill (without WITA) -> Click to open Kalender Bulanan & Hari Nasional */}
            <button
              type="button"
              onClick={() => setIsCalendarModalOpen(true)}
              className="flex items-center gap-1 bg-[#121e2c]/68 hover:bg-[#1a293b]/85 backdrop-blur-md border border-slate-600/50 hover:border-amber-400/60 rounded-full px-1.5 sm:px-2.5 py-1 sm:py-1.5 shadow-lg text-[10px] sm:text-xs font-bold text-amber-400 font-mono shrink-0 transition active:scale-95 cursor-pointer"
              title="Buka Kalender Bulanan & Daftar Hari Nasional RI"
              aria-label="Buka Kalender Nasional"
            >
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{currentTimeWita}</span>
              {student.isTeacher && student.subject && (
                <span className="hidden xl:inline ml-1 pl-1.5 border-l border-slate-600 text-emerald-300 truncate max-w-[130px] font-sans text-[10px]">
                  {student.subject}
                </span>
              )}
            </button>

            {/* Realtime Gorontalo Weather & Celsius Pill - Only Master kikybahsoan can click or change */}
            {isMaster ? (
              <button
                type="button"
                onClick={() => setIsWeatherModalOpen(true)}
                className={`hidden min-[360px]:flex bg-[#121e2c]/68 backdrop-blur-md border rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5 items-center gap-1 sm:gap-1.5 shadow-lg text-[10px] sm:text-xs font-bold cursor-pointer transition active:scale-95 shrink-0 ${
                  weatherType === 'hujan_ringan'
                    ? 'border-cyan-400/50 text-cyan-300 hover:bg-cyan-950/40'
                    : weatherType === 'salju'
                    ? 'border-indigo-300/50 text-indigo-200 hover:bg-indigo-950/40'
                    : weatherType === 'berawan'
                    ? 'border-sky-400/50 text-sky-200 hover:bg-sky-950/40'
                    : 'border-amber-400/50 text-amber-300 hover:bg-amber-950/40'
                }`}
                title={`Cuaca Gorontalo Realtime: ${currentWeatherInfo.name} (${currentWeatherInfo.tempCelsius}°C) • Klik untuk Mengatur Cuaca (Khusus Master)`}
                aria-label="Atur Cuaca (Khusus Master)"
              >
                <span className="text-xs sm:text-sm leading-none drop-shadow-sm">{currentWeatherInfo.icon}</span>
                <span className="font-mono font-extrabold text-white">{currentWeatherInfo.tempCelsius}°C</span>
              </button>
            ) : (
              <div
                className={`hidden min-[360px]:flex bg-[#121e2c]/68 backdrop-blur-md border rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5 items-center gap-1 sm:gap-1.5 shadow-lg text-[10px] sm:text-xs font-bold select-none cursor-default shrink-0 ${
                  weatherType === 'hujan_ringan'
                    ? 'border-cyan-400/50 text-cyan-300'
                    : weatherType === 'salju'
                    ? 'border-indigo-300/50 text-indigo-200'
                    : weatherType === 'berawan'
                    ? 'border-sky-400/50 text-sky-200'
                    : 'border-amber-400/50 text-amber-300'
                }`}
                title={`Cuaca Realtime Gorontalo: ${currentWeatherInfo.name} (${currentWeatherInfo.tempCelsius}°C)`}
                aria-label="Cuaca Realtime Gorontalo"
              >
                <span className="text-xs sm:text-sm leading-none drop-shadow-sm">{currentWeatherInfo.icon}</span>
                <span className="font-mono font-extrabold text-white">{currentWeatherInfo.tempCelsius}°C</span>
              </div>
            )}

            {/* Notifikasi Misi Harian (Displayed right after Cuaca on Mobile & Desktop) */}
            <button
              type="button"
              onClick={() => handleSelectBuilding('balai_kota')}
              className="relative flex w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 rounded-full bg-[#121e2c]/68 hover:bg-[#1a293b]/80 backdrop-blur-md text-slate-200 hover:text-white border border-slate-600/50 hover:border-amber-400/60 shadow-lg items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
              title={`Notifikasi Misi Harian (${completedMissionIds.length}/${assignedMissions.length} Tuntas)`}
              aria-label="Notifikasi Misi Harian"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              {assignedMissions.length > 0 && (
                <span
                  className={`absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full text-[8.5px] font-black flex items-center justify-center shadow ${
                    completedMissionIds.length >= assignedMissions.length
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {completedMissionIds.length}/{assignedMissions.length}
                </span>
              )}
            </button>

            {/* Tombol Teleport / Menu Cepat Lokasi Kota (Termasuk Arena Rumah Misteri) */}
            <button
              type="button"
              onClick={() => setIsQuickNavOpen(true)}
              className="flex items-center gap-1 bg-[#121e2c]/68 hover:bg-[#1a293b]/85 backdrop-blur-md text-sky-300 hover:text-white border border-sky-500/50 hover:border-sky-400 rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-lg text-[10px] sm:text-xs font-extrabold transition active:scale-95 shrink-0 cursor-pointer"
              title="Teleport Cepat ke Bangunan & Arena Rumah Misteri"
              aria-label="Teleport Cepat"
            >
              <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="hidden sm:inline">Teleport</span>
            </button>

            {/* Radio Background Music Controller (Dynamic 5 Time-of-Day Stations) */}
            <LofiAudioControl timePeriod={timePeriod} />

            {/* Audio Toggle (Desktop only) */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="hidden md:flex w-8 h-8 rounded-full bg-[#121e2c]/68 hover:bg-[#1a293b]/80 backdrop-blur-md text-slate-300 hover:text-white border border-slate-600/50 shadow-lg items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
              title={audioEnabled ? 'Matikan Suara Chime' : 'Nyalakan Suara Chime'}
              aria-label="Toggle Suara"
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>
        </header>
      )}

      {/* FLOATING IN-WORLD CHAT (Bottom-left panel & Bottom-center input matching screenshot) */}
      {!activeBuilding && !isQuickNavOpen && (
        <FloatingWorldChat
          messages={publicChats}
          roomNumber={roomNum}
          onSendMessage={handleSendWorldChat}
          onReportMessage={handleReportMessage}
          studentHandle={studentHandle}
        />
      )}

      {/* Automatic Mission Completion Notification Banner */}
      {missionToast && (
        <div className="fixed bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-2xl bg-emerald-950/95 border border-emerald-400/60 text-emerald-100 text-xs sm:text-sm font-extrabold shadow-2xl flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-bottom-2 max-w-[92vw]">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">{missionToast}</span>
        </div>
      )}

      {/* BUILDING MODALS */}
      {activeBuilding === 'balai_kota' && (
        <BalaiKotaModal
          onClose={() => setActiveBuilding(null)}
          onNavigateBuilding={handleSelectBuilding}
          objectives={objectives}
          materis={materis}
          studentName={student.name}
          studentXp={student.points}
          assignedMissions={assignedMissions}
          completedMissionIds={completedMissionIds}
        />
      )}

      {activeBuilding === 'perpustakaan' && (
        <PerpustakaanModal
          onClose={() => setActiveBuilding(null)}
          materis={materis}
          onNavigateBuilding={(id) => handleSelectBuilding(id)}
          onSelectMateriForReflection={(mId) => setPreselectedMateriForReflection(mId)}
          onAddXp={handleAddPoints}
          student={student}
        />
      )}

      {activeBuilding === 'taman_refleksi' && (
        <TamanRefleksiModal
          onClose={() => {
            setActiveBuilding(null);
            setPreselectedMateriForReflection(undefined);
          }}
          materis={materis}
          objectives={objectives}
          student={student}
          preselectedMateriId={preselectedMateriForReflection}
          onSubmitReflection={handleSubmitReflection}
          onNavigateBuilding={(id) => handleSelectBuilding(id)}
        />
      )}

      {activeBuilding === 'menara_mentor' && (
        <MenaraMentorModal
          onClose={() => setActiveBuilding(null)}
          feedbacks={feedbacks}
          reflections={reflections}
          student={student}
          materis={materis}
          onUpdateFeedbackSteps={handleUpdateFeedbackSteps}
          onNavigateBuilding={(id) => handleSelectBuilding(id)}
          onAddXp={handleAddPoints}
        />
      )}

      {activeBuilding === 'bengkel_latihan' && (
        <BengkelLatihanModal
          onClose={() => setActiveBuilding(null)}
          questions={quizQuestions}
          student={student}
          onAnswerCorrect={handleAnswerCorrect}
          onCompleteQuiz={() => completeMissionIfActive('m_bengkel')}
        />
      )}

      {activeBuilding === 'kantor_pos' && (
        <KantorPosModal
          onClose={() => setActiveBuilding(null)}
          messages={messages}
          student={student}
          onSendMessage={handleSendMessage}
          onSyncMessages={(synced) => setMessages(synced)}
        />
      )}

      {activeBuilding === 'pasar_prestasi' && (
        <PasarPrestasiModal
          onClose={() => setActiveBuilding(null)}
          student={student}
          reflections={reflections}
          students={StorageService.getStudents()}
          publicChats={publicChats}
          messages={messages}
        />
      )}

      {activeBuilding === 'monumen_warga' && (
        <MonumenWargaChatModal
          onClose={() => setActiveBuilding(null)}
          student={student}
        />
      )}

      {activeBuilding === 'masjid' && (
        <MasjidModal
          onClose={() => setActiveBuilding(null)}
          student={student}
          onAddXp={handleAddPoints}
          onCompleteMasjidMission={() => completeMissionIfActive('m_masjid')}
        />
      )}

      {activeBuilding === 'arena_rumah_misteri' && (
        <ArenaRumahMisteriModal
          onClose={() => setActiveBuilding(null)}
          student={student}
          onAddXp={handleAddPoints}
        />
      )}

      {activeBuilding === 'pencakar_langit' && !showCareerModalInSkyscraper && (
        <EscapeRoomMenaraModal
          onClose={() => {
            setShowCareerModalInSkyscraper(false);
            setActiveBuilding(null);
          }}
          student={student}
          onAddXp={handleAddPoints}
          onOpenCareerBuildingModal={() => setShowCareerModalInSkyscraper(true)}
        />
      )}

      {activeBuilding === 'menara_asesmen' && (
        <MenaraAsesmenIndividuModal
          onClose={() => setActiveBuilding(null)}
          currentStudent={student}
          onAddXp={handleAddPoints}
        />
      )}

      {activeBuilding === 'bank_materi' && student.isTeacher && (
        <BankMateriModal
          onClose={() => setActiveBuilding(null)}
          teacher={student}
          bankMateriList={bankMateriList}
          settings={settings}
          onSaveBankMateri={async (entry: BankMateriEntry) => {
            await StorageService.saveAndDistributeBankMateri(entry);
            setBankMateriList(StorageService.getBankMateri());
            setMateris(StorageService.getMateri());
            setObjectives(StorageService.getObjectives());
            setQuizQuestions(StorageService.getQuizQuestions());
            handleAddPoints(5, `Sebarkan Bank Materi AI: ${entry.mataPelajaran}`);
          }}
          onDeleteBankMateri={async (id: string) => {
            await StorageService.deleteBankMateriEntry(id);
            setBankMateriList(StorageService.getBankMateri());
            setMateris(StorageService.getMateri());
            setObjectives(StorageService.getObjectives());
            setQuizQuestions(StorageService.getQuizQuestions());
          }}
          onRefreshBankMateri={refreshBankMateriState}
          onSelectBuilding={(id: BuildingId) => handleSelectBuilding(id)}
        />
      )}

      {activeBuilding &&
        activeBuilding !== 'menara_asesmen' &&
        isPusatKotaBuilding(activeBuilding) &&
        (activeBuilding !== 'pencakar_langit' || showCareerModalInSkyscraper) && (
          <PusatKotaBuildingModal
            buildingId={activeBuilding}
            student={student}
            materis={materis}
            objectives={objectives}
            reflections={reflections}
            messages={messages}
            onClose={() => {
              if (activeBuilding === 'pencakar_langit' && showCareerModalInSkyscraper) {
                setShowCareerModalInSkyscraper(false);
              } else {
                setActiveBuilding(null);
              }
            }}
          onSubmitReflection={(materiId, scale, answers, moodEmoji) => {
            const matchedMat = materis.find((m) => m.id === materiId);
            const nowStr = new Date().toLocaleString('id-ID');
            const refId = `ref-pk-${Date.now()}`;
            const newRef: Reflection = {
              id: refId,
              studentId: student.id,
              studentName: student.name,
              className: student.className,
              materiId,
              materiTitle: matchedMat ? matchedMat.title : `Refleksi Pusat Kota (${activeBuilding})`,
              scale,
              moodEmoji: moodEmoji || '😊',
              answers,
              createdAt: nowStr,
            };
            const newFb: MentorFeedback = {
              id: `fb-pk-${Date.now()}`,
              reflectionId: refId,
              studentId: student.id,
              apresiasi: `Terima kasih ${student.name}, refleksi belajarmu di Pusat Kota sangat inspiratif!`,
              saran: 'Terus terapkan wawasan ini dalam proyek dan keseharian di sekolah.',
              pertanyaanLanjutan: 'Langkah konkret apa yang akan kamu mulai minggu ini?',
              skorRefleksi: scale * 20,
              perlu_perhatian_guru: scale <= 2,
              createdAt: nowStr,
            };
            handleSubmitReflection(newRef, newFb);
          }}
          onSendMessage={handleSendMessage}
          onGainXp={handleAddPoints}
          onRefreshMateris={() => {
            setMateris(StorageService.getMateri());
            setObjectives(StorageService.getObjectives());
          }}
        />
      )}

      {/* 2D QUICK NAVIGATION MODAL */}
      {isQuickNavOpen && (
        <QuickNav2D
          onClose={() => setIsQuickNavOpen(false)}
          onSelectBuilding={(id) => handleSelectBuilding(id)}
          newMateriBuildingIds={newMateriBuildingIds}
          onOpenTeacher={isMaster ? () => setIsTeacherPinModalOpen(true) : undefined}
        />
      )}

      {/* TEACHER PIN MODAL */}
      {isTeacherPinModalOpen && (
        <TeacherPinModal
          onClose={() => setIsTeacherPinModalOpen(false)}
          expectedPin={settings.teacherPin}
          onSuccess={(teacherInfo) => {
            const teacherGender = teacherInfo?.gender || 'L';
            const isMaster = teacherInfo?.isMasterPin || teacherInfo?.username === 'kikybahsoan' || teacherInfo?.name === 'kikybahsoan';
            const teacherUser: Student = {
              id: `teacher-${teacherInfo?.username || 'guru'}`,
              name: teacherInfo?.name || 'kikybahsoan',
              className: isMaster ? 'Master Guru' : 'Guru Pembimbing DKV',
              studentNumber: isMaster ? 'MASTER-DKV' : 'GURU-DKV',
              password: '',
              gender: teacherGender,
              points: teacherInfo?.points !== undefined ? teacherInfo.points : (isMaster ? 999 : 10),
              badges: isMaster
                ? ['guru_pembimbing', 'penjelajah_rajin', 'master_refleksi', 'bintang_kota']
                : ['guru_pembimbing', 'penjelajah_rajin'],
              lastLogin: new Date().toISOString().slice(0, 10),
              streakDays: 5,
              isTeacher: true,
            };
              if (teacherInfo?.name) {
                setLoggedTeacherName(teacherInfo.name);
              }
              handleLoginTeacher(teacherUser, teacherInfo?.destination);
            }}
          onOpenSettings={() => {
            setTeacherModalInitialTab('pengaturan');
            setIsTeacherPinModalOpen(false);
            setIsTeacherModalOpen(true);
          }}
        />
      )}

      {/* RUANG GURU MODAL */}
      {isTeacherModalOpen && (
        <RuangGuruModal
          onClose={() => setIsTeacherModalOpen(false)}
          teacherName={loggedTeacherName || undefined}
          materis={materis}
          objectives={objectives}
          reflections={reflections}
          feedbacks={feedbacks}
          messages={messages}
          students={StorageService.getStudents()}
          settings={settings}
          initialTab={teacherModalInitialTab}
          onAddMateri={handleAddMateri}
          onDeleteMateri={handleDeleteMateri}
          onAddObjective={handleAddObjective}
          onReplyMessage={handleReplyMessage}
          onUpdateSettings={handleUpdateSettings}
          onDeleteReflection={handleDeleteReflection}
          onClearAllReflections={handleClearAllReflections}
          onSyncReflectionsAndMessages={handleSyncReflectionsAndMessages}
        />
      )}

      {/* GORONTALO REAL-TIME WEATHER MODAL (Khusus Master kikybahsoan) */}
      {isWeatherModalOpen && isMaster && (
        <WeatherGorontaloModal
          onClose={() => setIsWeatherModalOpen(false)}
          currentWeather={currentWeatherInfo}
          activeWeatherType={weatherType}
          weatherOverride={weatherOverride}
          onSetWeatherOverride={(type) => {
            setWeatherOverride(type);
            if (type === 'auto') {
              setWeatherType(getWeatherTypeWita());
            } else {
              setWeatherType(type);
            }
          }}
          currentTimeWita={currentTimeWita}
        />
      )}

      {/* KALENDER BULANAN & HARI-HARI NASIONAL RI MODAL */}
      {isCalendarModalOpen && (
        <KalenderNasionalModal
          onClose={() => setIsCalendarModalOpen(false)}
          currentTimeWita={currentTimeWita}
        />
      )}

      {/* KWR (KARTU WARGA REFLEKSIA) MODAL */}
      {isKwrModalOpen && (
        <KartuWargaModal
          onClose={() => setIsKwrModalOpen(false)}
          student={student}
          studentHandle={studentHandle}
          levelInfo={levelInfo}
          reflectionsCount={reflections.filter((r) => r.studentId === student.id).length}
          completedMissionsCount={completedMissionIds.length}
          totalMissionsCount={assignedMissions.length || 5}
          isMaster={isMaster}
        />
      )}
    </div>
  );
}
