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
import {
  Compass,
  Lock,
  LogOut,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  Sparkles,
  School,
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
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [preselectedMateriForReflection, setPreselectedMateriForReflection] = useState<string | undefined>(undefined);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night' | 'auto'>('day');

  // Check ?autostart=1 for headless testing & fast access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !student) {
      const demoStudent: Student = {
        id: 'std-demo',
        name: 'Budi Santoso',
        className: 'X DKV 1 (Desain Komunikasi Visual)',
        studentNumber: '05',
        points: 120,
        badges: ['reflektor_pertama', 'penjelajah_rajin'],
        lastLogin: new Date().toISOString().slice(0, 10),
        streakDays: 3,
      };
      setStudent(demoStudent);
      StorageService.setCurrentStudent(demoStudent);
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
    // Merge reflections by ID
    const refMap = new Map<string, Reflection>();
    syncedReflections.forEach((r) => refMap.set(r.id, r));
    reflections.forEach((r) => {
      if (!refMap.has(r.id)) refMap.set(r.id, r);
    });
    const mergedReflections = Array.from(refMap.values());

    // Merge feedbacks
    const fbMap = new Map<string, MentorFeedback>();
    syncedFeedbacks.forEach((f) => fbMap.set(f.id, f));
    feedbacks.forEach((f) => {
      if (!fbMap.has(f.id)) fbMap.set(f.id, f);
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
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none">
      {/* 3D WebGL Town Canvas */}
      <ThreeTownCanvas
        onSelectBuilding={(buildingId) => setActiveBuilding(buildingId)}
        activeBuilding={activeBuilding}
        newMateriBuildingIds={newMateriBuildingIds}
        studentName={student.name}
        timeOfDay={timeOfDay}
      />

      {/* TOP HEADER OVERLAY (Minimal, Non-obstructive) */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        {/* Left: Town title & Student Info */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-4 py-2 rounded-2xl shadow-lg pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-base shadow">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-white font-display">
                {settings.townName || 'Kota Refleksi'}
              </span>
              <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-800">
                SMK
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              {student.name} <span className="text-slate-500">•</span> {student.className.split(' ')[0]}
            </p>
          </div>
        </div>

        {/* Right: Day/Night, Quick Nav 2D, Teacher Room, Logout */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Day / Night Cycle Button */}
          <button
            onClick={() => {
              if (timeOfDay === 'day') setTimeOfDay('night');
              else if (timeOfDay === 'night') setTimeOfDay('auto');
              else setTimeOfDay('day');
            }}
            className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3 py-2 rounded-2xl shadow-lg text-xs font-bold flex items-center gap-1.5 transition"
            title="Ganti Waktu Kota: Siang / Malam / Otomatis (Pergantian Siklus)"
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

          {/* Quick Nav 2D button */}
          <button
            onClick={() => setIsQuickNavOpen(true)}
            className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3 py-2 rounded-2xl shadow-lg text-xs font-bold flex items-center gap-1.5 transition"
            title="Buka daftar 2D semua bangunan"
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Menu Cepat 2D</span>
          </button>

          {/* Teacher Room */}
          <button
            onClick={() => setIsTeacherPinModalOpen(true)}
            className="bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-slate-700/80 px-3 py-2 rounded-2xl shadow-lg text-xs font-bold flex items-center gap-1.5 transition"
            title="Masuk ke Ruang Guru (PIN)"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Ruang Guru</span>
          </button>

          {/* Logout / Switch User */}
          <button
            onClick={handleLogout}
            className="bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-700/80 p-2 sm:px-3 sm:py-2 rounded-2xl shadow-lg text-xs font-bold flex items-center gap-1.5 transition"
            title="Keluar / Ganti Siswa"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Ganti Siswa</span>
          </button>
        </div>
      </header>

      {/* UNIFIED COLLAPSIBLE BOTTOM DOCK (Per Three.js skill layout directive) */}
      <footer
        className={`absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-300 flex flex-col items-center pointer-events-auto max-w-[96vw] ${
          isDockCollapsed ? 'bottom-2' : 'bottom-5'
        }`}
      >
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="mb-1.5 px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-[11px] font-bold flex items-center gap-1 shadow-md transition"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Tampilkan Menu Gedung Kota</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sembunyikan Menu</span>
            </>
          )}
        </button>

        {/* Horizontal Glassmorphic Dock */}
        {!isDockCollapsed && (
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl p-2 sm:p-2.5 shadow-2xl flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full">
            {/* Student Points Pill */}
            <button
              onClick={() => setActiveBuilding('pasar_prestasi')}
              className="px-3 py-2 rounded-2xl bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-700/50 flex items-center gap-2 text-left shrink-0 hover:border-cyan-500 transition"
              title="Lihat Poin dan Lencana"
            >
              <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                {levelInfo.level}
              </div>
              <div className="hidden sm:block">
                <span className="text-[10px] text-cyan-300 block font-bold leading-none">
                  {student.points} XP
                </span>
                <span className="text-[11px] text-white font-extrabold leading-tight">
                  {levelInfo.title}
                </span>
              </div>
            </button>

            <div className="w-px h-7 bg-slate-800 shrink-0 mx-1" />

            {/* Quick Icon Buttons for 7 Buildings */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
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
                };

                return (
                  <button
                    key={b.id}
                    onClick={() => setActiveBuilding(b.id)}
                    className="relative p-2 sm:px-3 sm:py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 hover:border-slate-500 flex items-center gap-1.5 text-xs font-bold text-slate-200 transition group"
                    title={`${b.name} - ${b.tagline}`}
                  >
                    <span className="text-base group-hover:scale-110 transition transform">
                      {icons[b.id]}
                    </span>
                    <span className="hidden md:inline">{b.name}</span>
                    {hasNew && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </footer>

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
