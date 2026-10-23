/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { BalaiKotaModal } from './components/modals/BalaiKotaModal.tsx';
import { PerpustakaanModal } from './components/modals/PerpustakaanModal.tsx';
import { TamanRefleksiModal } from './components/modals/TamanRefleksiModal.tsx';
import { MenaraMentorModal } from './components/modals/MenaraMentorModal.tsx';
import { BengkelLatihanModal } from './components/modals/BengkelLatihanModal.tsx';
import { KantorPosModal } from './components/modals/KantorPosModal.tsx';
import { PasarPrestasiModal } from './components/modals/PasarPrestasiModal.tsx';
import { RuangGuruModal } from './components/modals/RuangGuruModal.tsx';
import { MonumenWargaChatModal } from './components/modals/MonumenWargaChatModal.tsx';
import {
  LogOut,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [student, setStudent] = useState<Student | null>(() => StorageService.getCurrentStudent());
  const [materis, setMateris] = useState<Materi[]>(() => StorageService.getMateri());
  const [objectives, setObjectives] = useState<LearningObjective[]>(() => StorageService.getObjectives());
  const [reflections, setReflections] = useState<Reflection[]>(() => StorageService.getReflections());
  const [feedbacks, setFeedbacks] = useState<MentorFeedback[]>(() => StorageService.getFeedbacks());
  const [messages, setMessages] = useState<Message[]>(() => StorageService.getMessages());
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() => StorageService.getQuizQuestions());
  const [settings, setSettings] = useState<TownSettings>(() => StorageService.getSettings());

  const [activeBuilding, setActiveBuilding] = useState<BuildingId | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isTeacherPinModalOpen, setIsTeacherPinModalOpen] = useState(false);
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false);
  const [preselectedMateriForReflection, setPreselectedMateriForReflection] = useState<string | undefined>(undefined);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night' | 'auto'>('night');

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
        points: 120,
        badges: ['reflektor_pertama', 'penjelajah_rajin'],
        lastLogin: new Date().toISOString().slice(0, 10),
        streakDays: 3,
      };
      setStudent(demoStudent);
      StorageService.setCurrentStudent(demoStudent);
    }
  }, [student]);

  // If previous saved student was in removed DKV 1, clear session
  useEffect(() => {
    if (student && student.className.includes('DKV 1')) {
      StorageService.setCurrentStudent(null);
      setStudent(null);
    }
  }, [student]);

  // Handle Student Login
  const handleLoginStudent = (newStudent: Student) => {
    setStudent(newStudent);
    StorageService.setCurrentStudent(newStudent);
    StorageService.saveOrUpdateStudent(newStudent);
  };

  // Handle Logout
  const handleLogout = () => {
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

    // Award +30 XP and recalculate badges
    if (student) {
      const newPoints = student.points + 30;
      const myReflections = updatedReflections.filter((r) => r.studentId === student.id);
      const myMessages = messages.filter((m) => m.studentId === student.id);
      const newBadges = evaluateBadges(student, myReflections, 1, myMessages.length);

      const updatedStudent: Student = {
        ...student,
        points: newPoints,
        badges: newBadges,
      };

      setStudent(updatedStudent);
      StorageService.saveOrUpdateStudent(updatedStudent);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // Safe fallback
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

  // Answer Quiz Correctly
  const handleAnswerCorrect = (pointsEarned: number) => {
    if (!student) return;
    const newPoints = student.points + pointsEarned;
    const myReflections = reflections.filter((r) => r.studentId === student.id);
    const myMessages = messages.filter((m) => m.studentId === student.id);
    const newBadges = evaluateBadges(student, myReflections, 2, myMessages.length);

    const updatedStudent: Student = {
      ...student,
      points: newPoints,
      badges: newBadges,
    };
    setStudent(updatedStudent);
    StorageService.saveOrUpdateStudent(updatedStudent);

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {
      // Safe fallback
    }
  };

  // Send Message from Kantor Pos
  const handleSendMessage = (content: string) => {
    if (!student) return;
    const newMsg: Message = {
      id: `msg-${Date.now().toString(36)}`,
      studentId: student.id,
      studentName: student.name,
      className: student.className,
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

    // Update student badges if first time
    const myReflections = reflections.filter((r) => r.studentId === student.id);
    const newBadges = evaluateBadges(student, myReflections, 0, updatedMessages.length);
    const updatedStudent: Student = { ...student, badges: newBadges };
    setStudent(updatedStudent);
    StorageService.saveOrUpdateStudent(updatedStudent);
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

  // Building ids with new materials
  const newMateriBuildingIds: BuildingId[] = materis
    .filter((m) => m.isNew)
    .map((m) => m.location);

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
            onSuccess={() => {
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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-emerald-950 select-none">
      {/* 3D WebGL Town Canvas */}
      <ThreeTownCanvas
        onSelectBuilding={(buildingId) => setActiveBuilding(buildingId)}
        activeBuilding={activeBuilding}
        newMateriBuildingIds={newMateriBuildingIds}
        studentName={student.name}
        studentGender={student.gender}
        timeOfDay={timeOfDay}
      />

      {/* TOP HEADER OVERLAY (Hidden when inside building modals or 2D menu) - Liquid Glass */}
      {!activeBuilding && !isQuickNavOpen && (
        <header className="absolute top-4 sm:top-5 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between pointer-events-none z-20 gap-2">
          {/* Left: Refleksia City • Nama • Kelas • XP • Level */}
          <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-b from-white/20 via-slate-900/70 to-slate-950/85 backdrop-blur-2xl backdrop-saturate-150 border border-white/25 px-3.5 py-2 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.25)] pointer-events-auto max-w-[75vw] sm:max-w-none overflow-x-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-base shadow-sm shrink-0">
              🏛️
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs whitespace-nowrap">
              <span className="font-extrabold text-white font-display text-xs sm:text-sm tracking-tight">
                Refleksia City
              </span>
              <span className="text-slate-400 font-bold">•</span>
              <span className="font-bold text-slate-100 max-w-[120px] sm:max-w-[200px] truncate" title={student.name}>
                {student.name}
              </span>
              <span className="text-slate-400 font-bold">•</span>
              <span className="px-2 py-0.5 rounded-lg bg-blue-900/60 text-blue-200 font-bold border border-blue-400/40 text-[11px] backdrop-blur-sm">
                {student.className}
              </span>
              <span className="text-slate-400 font-bold">•</span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-900/60 text-amber-200 font-bold border border-amber-400/40 text-[11px] flex items-center gap-1 backdrop-blur-sm">
                ⭐ {student.points} XP
              </span>
              <span className="text-slate-400 font-bold hidden md:inline">•</span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-900/60 text-emerald-200 font-bold border border-emerald-400/40 text-[11px] backdrop-blur-sm">
                Lv. {levelInfo.level} ({levelInfo.title})
              </span>
            </div>
          </div>

          {/* Right: ONLY Siang/Malam and Keluar - Liquid Glass */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
            {/* Day / Night Cycle Button */}
            <button
              onClick={() => {
                if (timeOfDay === 'day') setTimeOfDay('night');
                else if (timeOfDay === 'night') setTimeOfDay('auto');
                else setTimeOfDay('day');
              }}
              className="bg-gradient-to-b from-white/20 via-slate-900/70 to-slate-950/85 backdrop-blur-2xl backdrop-saturate-150 text-slate-100 border border-white/25 hover:border-white/50 px-3 py-2 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.25)] text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              title="Ganti Waktu Kota: Siang / Malam / Otomatis"
            >
              {timeOfDay === 'day' && (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Siang</span>
                </>
              )}
              {timeOfDay === 'night' && (
                <>
                  <Moon className="w-4 h-4 text-indigo-300" />
                  <span className="hidden sm:inline">Malam</span>
                </>
              )}
              {timeOfDay === 'auto' && (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">Auto</span>
                </>
              )}
            </button>

            {/* Logout / Switch User */}
            <button
              onClick={handleLogout}
              className="bg-gradient-to-b from-white/20 via-slate-900/70 to-slate-950/85 backdrop-blur-2xl backdrop-saturate-150 hover:from-red-900/40 text-slate-200 hover:text-red-300 border border-white/25 hover:border-red-400/50 px-3 py-2 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.25)] text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              title="Keluar / Ganti Siswa"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </header>
      )}

      {/* BOTTOM DOCK - ICON ONLY MENU - Liquid Glass (Elevated above chat bar) */}
      {!activeBuilding && !isQuickNavOpen && (
        <footer className="absolute bottom-16 sm:bottom-18 left-1/2 -translate-x-1/2 z-20 flex items-center pointer-events-auto max-w-[96vw]">
          <div className="bg-gradient-to-b from-white/25 via-slate-900/75 to-slate-950/90 backdrop-blur-2xl backdrop-saturate-150 border border-white/25 rounded-full px-2.5 sm:px-3.5 py-2 sm:py-2.5 shadow-[0_16px_48px_0_rgba(0,0,0,0.55),inset_0_1px_1px_0_rgba(255,255,255,0.25)] flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto">
            {BUILDINGS_INFO.map((b) => {
              const hasNew = newMateriBuildingIds.includes(b.id);
              const icons: Record<BuildingId, string> = {
                balai_kota: '🏛️',
                perpustakaan: '📚',
                taman_refleksi: '🌸',
                menara_mentor: '🔭',
                bengkel_latihan: '🛠️',
                kantor_pos: '📮',
                pasar_prestasi: '🎪',
                monumen_warga: '📋',
              };

              return (
                <button
                  key={b.id}
                  onClick={() => setActiveBuilding(b.id)}
                  className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 hover:border-white/45 flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-sm group shrink-0"
                  title={`${b.name} — ${b.tagline}`}
                  aria-label={b.name}
                >
                  <span className="text-lg sm:text-xl select-none transition-transform group-hover:scale-110">
                    {icons[b.id]}
                  </span>
                  {hasNew && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-slate-900 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </footer>
      )}

      {/* BUILDING MODALS */}
      {activeBuilding === 'balai_kota' && (
        <BalaiKotaModal
          onClose={() => setActiveBuilding(null)}
          onNavigateBuilding={(id) => setActiveBuilding(id)}
          objectives={objectives}
          materis={materis}
          studentName={student.name}
        />
      )}

      {activeBuilding === 'perpustakaan' && (
        <PerpustakaanModal
          onClose={() => setActiveBuilding(null)}
          materis={materis}
          onNavigateBuilding={(id) => setActiveBuilding(id)}
          onSelectMateriForReflection={(mId) => setPreselectedMateriForReflection(mId)}
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
          onNavigateBuilding={(id) => setActiveBuilding(id)}
        />
      )}

      {activeBuilding === 'menara_mentor' && (
        <MenaraMentorModal
          onClose={() => setActiveBuilding(null)}
          feedbacks={feedbacks}
          reflections={reflections}
          student={student}
          onUpdateFeedbackSteps={handleUpdateFeedbackSteps}
          onNavigateBuilding={(id) => setActiveBuilding(id)}
        />
      )}

      {activeBuilding === 'bengkel_latihan' && (
        <BengkelLatihanModal
          onClose={() => setActiveBuilding(null)}
          questions={quizQuestions}
          student={student}
          onAnswerCorrect={handleAnswerCorrect}
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
          onSelectBuilding={(id) => setActiveBuilding(id)}
          newMateriBuildingIds={newMateriBuildingIds}
        />
      )}

      {/* TEACHER PIN MODAL */}
      {isTeacherPinModalOpen && (
        <TeacherPinModal
          onClose={() => setIsTeacherPinModalOpen(false)}
          expectedPin={settings.teacherPin}
          onSuccess={() => {
            setIsTeacherPinModalOpen(false);
            setIsTeacherModalOpen(true);
          }}
        />
      )}

      {/* RUANG GURU MODAL */}
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
