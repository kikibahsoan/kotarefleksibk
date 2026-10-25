import React, { useState } from 'react';
import { X, Send, Sparkles, CheckCircle2, Users, BookOpen, MessageSquare, Settings, RefreshCw, Trash2, Plus, Award } from 'lucide-react';
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

export interface RuangGuruModalProps {
  onClose: () => void;
  studentName?: string;
  onAddXp?: (amount: number, reason: string) => void;
  materis?: Materi[];
  objectives?: LearningObjective[];
  reflections?: Reflection[];
  feedbacks?: MentorFeedback[];
  messages?: Message[];
  students?: Student[];
  settings?: TownSettings;
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
  onAddXp,
  materis = [],
  objectives = [],
  reflections = [],
  feedbacks = [],
  messages = [],
  students = [],
  settings,
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
    isTeacherView ? 'refleksi' : 'konsultasi'
  );

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
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {isTeacherView ? 'Panel Manajemen Pendidik' : 'Konsultasi & Mentoring'}
                </span>
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Ruang Guru Kota Refleksi
                </span>
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
      </div>
    </div>
  );
};
