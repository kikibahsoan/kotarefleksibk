import React, { useState } from 'react';
import { MentorFeedback, Reflection, Student, BuildingId } from '../../types/index.ts';
import { X, Sparkles, CheckSquare, Square, Lightbulb, HelpCircle, History, MessageSquare, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';

interface MenaraMentorModalProps {
  onClose: () => void;
  feedbacks: MentorFeedback[];
  reflections: Reflection[];
  student: Student;
  onUpdateFeedbackSteps: (feedbackId: string, steps: boolean[]) => void;
  onNavigateBuilding: (buildingId: BuildingId) => void;
}

export const MenaraMentorModal: React.FC<MenaraMentorModalProps> = ({
  onClose,
  feedbacks,
  reflections,
  student,
  onUpdateFeedbackSteps,
  onNavigateBuilding,
}) => {
  const [activeTab, setActiveTab] = useState<'latest' | 'history'>('latest');

  // Filter feedbacks for this student
  const studentReflections = reflections.filter((r) => r.studentId === student.id);
  const latestReflection = studentReflections[0];
  const latestFeedback = latestReflection
    ? feedbacks.find((f) => f.reflectionId === latestReflection.id) || feedbacks[0]
    : feedbacks[0];

  const [selectedReflectionId, setSelectedReflectionId] = useState<string>(
    latestReflection?.id || ''
  );

  const displayedReflection =
    studentReflections.find((r) => r.id === selectedReflectionId) || latestReflection;
  const displayedFeedback = displayedReflection
    ? feedbacks.find((f) => f.reflectionId === displayedReflection.id) || latestFeedback
    : latestFeedback;

  const handleToggleStep = (index: number) => {
    if (!displayedFeedback) return;
    const currentSteps = [...(displayedFeedback.completedSteps || [false, false, false])];
    currentSteps[index] = !currentSteps[index];
    onUpdateFeedbackSteps(displayedFeedback.id, currentSteps);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-backdrop-fade">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-violet-800 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              🔭
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold font-display leading-tight">Menara Mentor Kota</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  AI Mentor
                </span>
              </div>
              <p className="text-xs text-purple-200 font-medium">
                Umpan Balik Personal & Rencana Belajar untuk {student.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Menara Mentor"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('latest')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'latest'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Umpan Balik Terbaru</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Refleksi ({studentReflections.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'latest' ? (
            displayedFeedback ? (
              <div className="space-y-5">
                {/* Appreciation Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/40 shadow-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">🌟</span>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                        Apresiasi Mentor Kota
                      </h4>
                      <p className="text-sm font-semibold text-white mt-1 leading-relaxed">
                        "{displayedFeedback.apresiasi}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Teacher attention note if flagged */}
                {displayedFeedback.perlu_perhatian_guru && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-600/50 flex items-start gap-3 text-xs text-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300 block mb-0.5">Pesan Pendampingan Khusus:</strong>
                      Mentor melihat kamu sedang menghadapi kesulitan yang cukup berat. Jangan ragu untuk berdiskusi dengan guru pengampu atau guru BK ya. Ingat, meminta bantuan adalah tanda keberanian belajar!
                    </div>
                  </div>
                )}

                {/* 2-column: Yang Dikuasai vs Perlu Diperkuat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Yang sudah dikuasai */}
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-600/40">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Yang Sudah Kamu Kuasai</span>
                    </h5>
                    <ul className="space-y-1.5">
                      {(displayedFeedback.sudah_dikuasai || []).map((item: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Yang perlu diperkuat */}
                  <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/40">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4" />
                      <span>Area Perlu Diperkuat</span>
                    </h5>
                    <ul className="space-y-1.5">
                      {(displayedFeedback.perlu_diperkuat || []).map((item: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Concrete Advice */}
                <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>Saran Konkret untuk Belajar Berikutnya</span>
                  </h5>
                  <div className="space-y-2">
                    {(Array.isArray(displayedFeedback.saran)
                      ? displayedFeedback.saran
                      : displayedFeedback.saran
                      ? [displayedFeedback.saran]
                      : []
                    ).map((s: string, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-xs text-slate-200 flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inspiring Thought Question */}
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                      Pertanyaan Pemantik dari Mentor
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-200 font-medium italic">
                      "{displayedFeedback.pertanyaan_pemantik}"
                    </p>
                  </div>
                </div>

                {/* Checkable 3-Step Action Plan */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-850 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-purple-400" />
                      <span>Rencana Belajar 3 Langkah (Bisa Dicentang)</span>
                    </h5>
                    <span className="text-[11px] font-bold text-slate-400">
                      {(displayedFeedback.completedSteps || []).filter(Boolean).length} / 3 Selesai
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {(displayedFeedback.rencana_belajar || []).map((step: string, idx: number) => {
                      const isChecked = displayedFeedback.completedSteps?.[idx] || false;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleToggleStep(idx)}
                          className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${
                            isChecked
                              ? 'bg-purple-950/60 border-purple-500 text-purple-200 line-through'
                              : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:border-slate-600'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                          )}
                          <span className="text-xs sm:text-sm leading-snug">{step}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action: Question to Teacher */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <p className="text-slate-400">Masih belum mengerti? Tanyakan langsung ke gurumu.</p>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateBuilding('kantor_pos');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Kirim Pesan ke Guru di Kantor Pos</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-purple-900/50 flex items-center justify-center text-3xl mx-auto">
                  🌸
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Belum Ada Refleksi untuk Ditinjau</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Kamu belum menulis refleksi pembelajaran. Pergilah ke Pusat Refleksi untuk menulis refleksimu (+3 Poin)!
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateBuilding('taman_refleksi');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold inline-flex items-center gap-2 transition"
                >
                  <span>Buka Pusat Refleksi (+3 Poin)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {studentReflections.length > 0 ? (
                studentReflections.map((r) => {
                  const isSelected = r.id === displayedReflection?.id;
                  const fb = feedbacks.find((f) => f.reflectionId === r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedReflectionId(r.id);
                        setActiveTab('latest');
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition ${
                        isSelected
                          ? 'bg-purple-950/60 border-purple-500 shadow'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{r.materiTitle}</span>
                        <span className="text-[11px] text-amber-400 font-mono">
                          {'★'.repeat(r.scale)}
                          {'☆'.repeat(5 - r.scale)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">
                        Waktu: {r.createdAt} • Mood: {r.moodEmoji}
                      </p>
                      {fb && (
                        <p className="text-xs text-slate-300 italic line-clamp-2">
                          "{fb.apresiasi}"
                        </p>
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="text-center text-xs text-slate-500 py-10">Belum ada riwayat refleksi.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
