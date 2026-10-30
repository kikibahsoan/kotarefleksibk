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
} from './types/index.ts';
import { StorageService } from './utils/storage.ts';
import { evaluateBadges, calculateStudentLevel } from './utils/rules.ts';
import { ThreeTownCanvas, BUILDINGS_INFO } from './components/ThreeTownCanvas.tsx';
import { StudentWelcome } from './components/StudentWelcome.tsx';
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
import { FloatingWorldChat } from './components/FloatingWorldChat.tsx';
import { LofiAudioControl } from './components/LofiAudioControl.tsx';
import { getTimePeriodWita, TimePeriod } from './utils/lofiAudio.ts';
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
  BarChart3,
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
    return cur;
  });
  const studentRef = useRef<Student | null>(student);
  studentRef.current = student;

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

  const [activeBuilding, setActiveBuilding] = useState<BuildingId | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isTeacherPinModalOpen, setIsTeacherPinModalOpen] = useState(false);
  const [loggedTeacherName, setLoggedTeacherName] = useState<string | null>(null);
  const [teacherModalInitialTab, setTeacherModalInitialTab] = useState<'refleksi' | 'materi' | 'pesan' | 'pengaturan' | 'konsultasi'>('refleksi');
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);
  const [preselectedMateriForReflection, setPreselectedMateriForReflection] = useState<string | undefined>(undefined);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(() => getTimePeriodWita());

  // Live WITA Clock (Waktu Indonesia Tengah - Asia/Makassar)
  const [currentTimeWita, setCurrentTimeWita] = useState(() => {
    const now = new Date();
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now) + ' WITA';
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimePeriod(getTimePeriodWita(now));
      setCurrentTimeWita(
        new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Makassar',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(now) + ' WITA'
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      if (!current) return;
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
    },
    [reflections, messages]
  );

  // Automatically complete a randomized mission and award +3 XP (no manual claim button)
  const completeMissionIfActive = useCallback(
    (missionId: string) => {
      const current = studentRef.current;
      if (!current) return;
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
      handleAddPoints(3, foundMission.title);

      if (missionToastTimerRef.current) {
        window.clearTimeout(missionToastTimerRef.current);
      }
      setMissionToast(`🎯 Misi Tuntas: "${foundMission.title}" (+3 XP otomatis masuk ke saldo!)`);
      missionToastTimerRef.current = window.setTimeout(() => {
        setMissionToast(null);
        missionToastTimerRef.current = null;
      }, 3600);
    },
    [handleAddPoints]
  );

  const handleSelectBuilding = useCallback(
    (buildingId: BuildingId) => {
      setActiveBuilding(buildingId);
      if (buildingId === 'perpustakaan') {
        completeMissionIfActive('m_perpustakaan');
      } else if (buildingId === 'menara_mentor') {
        completeMissionIfActive('m_mentor');
      } else if (buildingId === 'monumen_warga') {
        completeMissionIfActive('m_papan');
      } else if (buildingId === 'pasar_prestasi') {
        completeMissionIfActive('m_pasar');
      }
    },
    [completeMissionIfActive]
  );

  // Deduct points from student/teacher saldo automatically when used in town
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

    // Automatically complete chat mission (+3 XP) if assigned
    completeMissionIfActive('m_chat');

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

  // Handle Student Login (Students get 5 XP on login, Teachers get 10 XP)
  const handleLoginStudent = (newStudent: Student) => {
    const loginXp = newStudent.isTeacher ? 10 : 5;
    const studentWithLoginXp: Student = {
      ...newStudent,
      points: loginXp,
    };
    studentRef.current = studentWithLoginXp;
    setStudent(studentWithLoginXp);
    StorageService.setCurrentStudent(studentWithLoginXp);
    StorageService.saveOrUpdateStudent(studentWithLoginXp);

    // Randomize missions on login
    const randomMissions = getOrInitUserRandomMissions(studentWithLoginXp.id, true);
    assignedMissionsRef.current = randomMissions;
    setAssignedMissions(randomMissions);
    completedMissionIdsRef.current = [];
    setCompletedMissionIds([]);
    saveCompletedMissionIds(studentWithLoginXp.id, []);
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
    const updatedReflections = [newReflection, ...reflections];
    const updatedFeedbacks = [newFeedback, ...feedbacks];

    setReflections(updatedReflections);
    setFeedbacks(updatedFeedbacks);
    StorageService.addReflection(newReflection);
    StorageService.addFeedback(newFeedback);

    // Sync to Google Apps Script if URL is configured
    StorageService.syncWithGAS('submit_reflection', {
      reflection: newReflection,
      feedback: newFeedback,
    });

    // Complete reflection mission (+3 XP automatic) or update badges
    const current = studentRef.current;
    if (current) {
      const hasReflectionMission =
        assignedMissionsRef.current.some((m) => m.id === 'm_refleksi') &&
        !completedMissionIdsRef.current.includes('m_refleksi');

      if (hasReflectionMission) {
        completeMissionIfActive('m_refleksi');
      } else {
        sounds.playRewardXp();
        handleAddPoints(3, 'Kirim Refleksi di Pusat Refleksi');
        if (missionToastTimerRef.current) {
          window.clearTimeout(missionToastTimerRef.current);
        }
        setMissionToast('🌍 Refleksi terkirim di Pusat Refleksi! (+3 Poin otomatis masuk ke saldo!)');
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

    // Sync to Google Apps Script
    StorageService.syncWithGAS('send_message', { message: newMsg });

    // Complete Kantor Pos mission (+3 XP automatic) if assigned
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
              studentRef.current = teacherUser;
              setStudent(teacherUser);
              StorageService.setCurrentStudent(teacherUser);
              StorageService.saveOrUpdateStudent(teacherUser);

              const randomMissions = getOrInitUserRandomMissions(teacherUser.id, true);
              assignedMissionsRef.current = randomMissions;
              setAssignedMissions(randomMissions);
              completedMissionIdsRef.current = [];
              setCompletedMissionIds([]);
              saveCompletedMissionIds(teacherUser.id, []);

              if (info?.name) {
                setLoggedTeacherName(info.name);
              }
              setIsTeacherPinModalOpen(false);

              if (info?.destination === 'panel') {
                setTeacherModalInitialTab('refleksi');
                setIsTeacherModalOpen(true);
              }
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
      } select-none transition-colors duration-700`}
    >
      {/* 2D Isometric Town Canvas */}
      <ThreeTownCanvas
        onSelectBuilding={handleSelectBuilding}
        activeBuilding={activeBuilding}
        newMateriBuildingIds={newMateriBuildingIds}
        studentId={student.id}
        studentName={student.name}
        studentGender={student.gender}
        isTeacher={student.isTeacher}
        timePeriod={timePeriod}
        latestMessage={latestChat}
        studentPoints={student.points}
        onDeductPoints={handleDeductPoints}
      />

      {/* TOP HEADER OVERLAY (Clean & Perfectly Responsive on Mobile) */}
      {/* TOP HEADER OVERLAY (Clean & Perfectly Responsive on Mobile, Never Overlaps) */}
      {!activeBuilding && !isQuickNavOpen && (
        <header className="absolute top-2 sm:top-3.5 left-2 sm:left-4 right-2 sm:right-4 flex items-center justify-between pointer-events-none z-20 gap-1 sm:gap-2 max-w-full">
          {/* Left: < Back button, Profile Capsule, and Teacher Ruang Guru button */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto min-w-0 shrink">
            {/* Back button */}
            <button
              onClick={handleLogout}
              className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 rounded-full bg-[#121e2c]/95 hover:bg-[#1a293b] text-slate-200 hover:text-white border border-slate-700/60 shadow-lg flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
              title="Ganti Siswa / Keluar"
              aria-label="Kembali"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-200" />
            </button>

            {/* Profile Capsule */}
            <div className="bg-[#121e2c]/95 backdrop-blur-md border border-slate-700/60 rounded-full px-1.5 sm:px-2.5 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-1.5 shadow-xl min-w-0 shrink">
              {/* Circular Avatar with gold border */}
              <div className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 rounded-full bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-200 border-2 border-amber-400 flex items-center justify-center text-slate-950 font-black text-[10px] sm:text-[11px] shadow-sm shrink-0">
                {student.isTeacher ? (student.gender === 'P' ? '👩‍🏫' : '👨‍🏫') : student.gender === 'P' ? '👧' : '👦'}
              </div>

              {/* Username Handle (Responsively Truncated so it never overlaps) */}
              <span className="font-extrabold text-[11px] sm:text-xs text-white max-w-[46px] min-[360px]:max-w-[62px] min-[420px]:max-w-[95px] sm:max-w-[130px] md:max-w-[160px] truncate leading-none">
                {studentHandle}
              </span>

              {/* Teacher Badge if teacher */}
              {student.isTeacher && (
                <span className="hidden min-[480px]:inline-block px-1.5 py-0.5 rounded text-[8.5px] font-extrabold bg-amber-500/25 text-amber-300 border border-amber-400/40 shrink-0">
                  GURU
                </span>
              )}

              {/* Gold Coin & Saldo */}
              <div className="flex items-center gap-0.5 font-bold text-[10.5px] sm:text-xs text-amber-400 font-mono shrink-0">
                <span>🪙</span>
                <span>{student.points}</span>
                <span className="hidden md:inline font-sans text-[10px] text-slate-400 font-normal ml-0.5">XP</span>
              </div>
            </div>

            {/* Teacher Ruang Guru Quick Button (Compact 28px circle on mobile, expanded pill on sm+) */}
            {student.isTeacher && (
              <button
                onClick={() => setIsTeacherModalOpen(true)}
                className="w-7.5 h-7.5 sm:w-auto sm:px-2.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-[10.5px] sm:text-xs shadow-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-amber-300/40 shrink-0"
                title="Buka Ruang Guru (Panel Pengajar)"
                aria-label="Ruang Guru"
              >
                <span>📋</span>
                <span className="hidden sm:inline">Ruang Guru</span>
              </button>
            )}
          </div>

          {/* Right: Clock • Class • Chart/Nav • Bell • Lo-Fi • Audio • Day/Night */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0 ml-auto">
            {/* Live WITA Clock Pill & Subject for teacher */}
            <div className="flex items-center gap-1 bg-[#121e2c]/95 backdrop-blur-md border border-slate-700/60 rounded-full px-1.5 sm:px-2.5 py-1 sm:py-1.5 shadow-xl text-[10px] sm:text-xs font-bold text-amber-400 font-mono shrink-0">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{currentTimeWita}</span>
              {student.isTeacher && student.subject && (
                <span className="hidden xl:inline ml-1 pl-1.5 border-l border-slate-600 text-emerald-300 truncate max-w-[130px] font-sans text-[10px]">
                  {student.subject}
                </span>
              )}
            </div>

            {/* Class Badge Pill (Hidden on narrowest screens < 370px to preserve space) */}
            <div
              className="hidden min-[370px]:flex bg-[#121e2c]/95 backdrop-blur-md border border-slate-700/60 rounded-full px-1.5 sm:px-2.5 py-1 sm:py-1.5 items-center gap-1 shadow-xl text-[10px] sm:text-xs font-bold text-emerald-400 shrink-0"
              title={student.isTeacher ? 'DKV SMKN 2 Gorontalo' : student.className}
            >
              <GraduationCap className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[48px] sm:max-w-none">
                {student.isTeacher ? 'DKV' : (student.className.includes('DKV 2') ? 'X DKV 2' : student.className.includes('DKV 3') ? 'X DKV 3' : 'XII RPL 1')}
              </span>
            </div>

            {/* Chart / Quick Navigation */}
            <button
              onClick={() => setIsQuickNavOpen(true)}
              className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 rounded-full bg-[#121e2c]/95 hover:bg-[#1a293b] text-slate-200 hover:text-white border border-slate-700/60 shadow-lg flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
              title="Daftar Gedung & Peta Kota"
              aria-label="Peta Gedung"
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
            </button>

            {/* Balai Kota Announcements (Bell) */}
            <button
              onClick={() => setActiveBuilding('balai_kota')}
              className="hidden min-[480px]:flex w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 rounded-full bg-[#121e2c]/95 hover:bg-[#1a293b] text-slate-200 hover:text-white border border-slate-700/60 shadow-lg items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
              title="Pengumuman & Misi Balai Kota"
              aria-label="Pengumuman"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </button>

            {/* Radio Background Music Controller (Dynamic 5 Time-of-Day Stations) */}
            <LofiAudioControl timePeriod={timePeriod} />

            {/* Audio Toggle (Desktop only) */}
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="hidden md:flex w-8 h-8 rounded-full bg-[#121e2c]/95 hover:bg-[#1a293b] text-slate-300 hover:text-white border border-slate-700/60 shadow-lg items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
              title={audioEnabled ? 'Matikan Suara Chime' : 'Nyalakan Suara Chime'}
              aria-label="Toggle Suara"
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
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
          onUpdateFeedbackSteps={handleUpdateFeedbackSteps}
          onNavigateBuilding={(id) => handleSelectBuilding(id)}
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
        />
      )}

      {activeBuilding === 'pasar_prestasi' && (
        <PasarPrestasiModal
          onClose={() => setActiveBuilding(null)}
          student={student}
          reflections={reflections}
        />
      )}

      {activeBuilding === 'monumen_warga' && (
        <MonumenWargaChatModal
          onClose={() => setActiveBuilding(null)}
          student={student}
        />
      )}

      {/* 2D QUICK NAVIGATION MODAL */}
      {isQuickNavOpen && (
        <QuickNav2D
          onClose={() => setIsQuickNavOpen(false)}
          onSelectBuilding={(id) => handleSelectBuilding(id)}
          newMateriBuildingIds={newMateriBuildingIds}
          onOpenTeacher={() => setIsTeacherPinModalOpen(true)}
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
            studentRef.current = teacherUser;
            setStudent(teacherUser);
            StorageService.setCurrentStudent(teacherUser);
            StorageService.saveOrUpdateStudent(teacherUser);

            const randomMissions = getOrInitUserRandomMissions(teacherUser.id, true);
            assignedMissionsRef.current = randomMissions;
            setAssignedMissions(randomMissions);
            completedMissionIdsRef.current = [];
            setCompletedMissionIds([]);
            saveCompletedMissionIds(teacherUser.id, []);

            if (teacherInfo?.name) {
              setLoggedTeacherName(teacherInfo.name);
            }
            setIsTeacherPinModalOpen(false);
            if (teacherInfo?.destination === 'panel') {
              setTeacherModalInitialTab('refleksi');
              setIsTeacherModalOpen(true);
            }
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
    </div>
  );
}
