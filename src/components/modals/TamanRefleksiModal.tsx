import React, { useState } from 'react';
import { Materi, LearningObjective, Student, Reflection, MentorFeedback, BuildingId } from '../../types/index.ts';
import { validateReflection } from '../../utils/rules.ts';
import { X, Star, Mic, MicOff, Send, Sparkles, AlertCircle, HeartHandshake, CheckCircle2 } from 'lucide-react';

interface TamanRefleksiModalProps {
  onClose: () => void;
  materis: Materi[];
  objectives: LearningObjective[];
  student: Student;
  preselectedMateriId?: string;
  onSubmitReflection: (reflection: Reflection, feedback: MentorFeedback) => void;
  onNavigateBuilding: (buildingId: BuildingId) => void;
}

const MOODS = [
  { emoji: '😊', label: 'Semangat' },
  { emoji: '🚀', label: 'Tertantang' },
  { emoji: '🤔', label: 'Bingung' },
  { emoji: '😴', label: 'Lelah' },
  { emoji: '💡', label: 'Tercerahkan' },
];

export const TamanRefleksiModal: React.FC<TamanRefleksiModalProps> = ({
  onClose,
  materis,
  objectives,
  student,
  preselectedMateriId,
  onSubmitReflection,
  onNavigateBuilding,
}) => {
  const [selectedMateriId, setSelectedMateriId] = useState<string>(
    preselectedMateriId || materis[0]?.id || ''
  );
  const [scale, setScale] = useState<number>(4);
  const [moodEmoji, setMoodEmoji] = useState<string>('😊');
  const [understood, setUnderstood] = useState('');
  const [difficult, setDifficult] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [customAnswer, setCustomAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechField, setActiveSpeechField] = useState<'understood' | 'difficult' | 'actionPlan' | null>(null);

  const selectedMateri = materis.find((m) => m.id === selectedMateriId);
  const relatedObjective = objectives.find((tp) => tp.materiId === selectedMateriId);

  // Web Speech API handler
  const handleToggleSpeech = (field: 'understood' | 'difficult' | 'actionPlan') => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Fitur input suara belum didukung di browser ini. Silakan ketik langsung di kolom teks.');
      return;
    }

    if (isListening && activeSpeechField === field) {
      setIsListening(false);
      setActiveSpeechField(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setActiveSpeechField(field);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (field === 'understood') setUnderstood((prev) => (prev ? `${prev} ${transcript}` : transcript));
        if (field === 'difficult') setDifficult((prev) => (prev ? `${prev} ${transcript}` : transcript));
        if (field === 'actionPlan') setActionPlan((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
        setActiveSpeechField(null);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setActiveSpeechField(null);
      };

      recognition.onend = () => {
        setIsListening(false);
        setActiveSpeechField(null);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
      setActiveSpeechField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const answers = {
      understood: understood.trim(),
      difficult: difficult.trim(),
      actionPlan: actionPlan.trim(),
      customAnswers: selectedMateri?.customQuestions?.[0] && customAnswer.trim()
        ? { [selectedMateri.customQuestions[0]]: customAnswer.trim() }
        : undefined,
    };

    const validation = validateReflection(answers, scale);
    if (!validation.valid) {
      setError(validation.error || 'Harap lengkapi semua isian refleksi.');
      return;
    }

    setIsSubmitting(true);

    const reflectionId = `ref-${Date.now().toString(36)}`;
    const reflection: Reflection = {
      id: reflectionId,
      studentId: student.id,
      studentName: student.name,
      className: student.className,
      materiId: selectedMateriId,
      materiTitle: selectedMateri?.title || 'Materi Belajar',
      answers,
      scale,
      moodEmoji,
      createdAt: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    };

    try {
      // Call Gemini Server Endpoint
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.name,
          className: student.className,
          materiTitle: selectedMateri?.title,
          goalStatement: relatedObjective?.goalStatement,
          answers,
          scale,
          moodEmoji,
        }),
      });

      const resData = await response.json();
      const aiData = resData.data;

      const feedback: MentorFeedback = {
        id: `fb-${Date.now().toString(36)}`,
        reflectionId,
        apresiasi: aiData.apresiasi || 'Bagus sekali refleksimu!',
        sudah_dikuasai: Array.isArray(aiData.sudah_dikuasai) ? aiData.sudah_dikuasai : ['Pemahaman konsep dasar'],
        perlu_diperkuat: Array.isArray(aiData.perlu_diperkuat) ? aiData.perlu_diperkuat : ['Latihan mandiri lebih intens'],
        saran: Array.isArray(aiData.saran) ? aiData.saran : ['Tanyakan kesulitanmu ke guru.'],
        pertanyaan_pemantik: aiData.pertanyaan_pemantik || 'Bagaimana caramu menerapkan hal ini?',
        rencana_belajar: Array.isArray(aiData.rencana_belajar) ? aiData.rencana_belajar : ['Baca materi', 'Latihan soal', 'Diskusi'],
        perlu_perhatian_guru: Boolean(aiData.perlu_perhatian_guru),
        completedSteps: [false, false, false],
      };

      onSubmitReflection(reflection, feedback);
      onClose();
      onNavigateBuilding('menara_mentor');
    } catch (err) {
      console.error('Error submitting reflection:', err);
      // Fallback feedback if network problem
      const fallbackFeedback: MentorFeedback = {
        id: `fb-${Date.now().toString(36)}`,
        reflectionId,
        apresiasi: `Luar biasa ${student.name}! Kamu sudah menyelesaikan refleksi dengan sangat baik.`,
        sudah_dikuasai: [answers.understood],
        perlu_diperkuat: [answers.difficult],
        saran: ['Kaji kembali materi modul di Perpustakaan', 'Diskusikan bersama rekan sekelompok'],
        pertanyaan_pemantik: 'Bagaimana materi ini bisa membantumu dalam proyek kejuruannu?',
        rencana_belajar: ['Buka kembali modul materi', 'Latih pemahaman di Bengkel Latihan', 'Tanyakan guru di Kantor Pos'],
        perlu_perhatian_guru: scale <= 2,
        completedSteps: [false, false, false],
      };
      onSubmitReflection(reflection, fallbackFeedback);
      onClose();
      onNavigateBuilding('menara_mentor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-700 via-rose-700 to-fuchsia-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              🌸
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-display leading-tight">Taman Refleksi</h2>
              <p className="text-xs text-pink-100 font-medium">Refleksikan Belajarmu & Terima Masukan Personal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Taman Refleksi"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Step 1: Select Materi */}
          <div>
            <label htmlFor="materi-select" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              1. Materi yang Baru Dipelajari <span className="text-pink-400">*</span>
            </label>
            <select
              id="materi-select"
              value={selectedMateriId}
              onChange={(e) => setSelectedMateriId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 font-medium"
            >
              {materis.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  [{m.subject}] {m.title}
                </option>
              ))}
            </select>

            {relatedObjective && (
              <div className="mt-2.5 p-3 rounded-xl bg-pink-950/40 border border-pink-700/40 text-xs text-pink-200">
                <strong className="text-pink-300">🎯 Target Tujuan Pembelajaran Guru:</strong> {relatedObjective.goalStatement}
              </div>
            )}
          </div>

          {/* Step 2: Scale of Understanding & Mood */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            {/* Scale 1-5 */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                2. Skala Pemahaman (1 - 5 Bintang)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setScale(num)}
                    className="p-1 text-2xl transition transform hover:scale-110 active:scale-95"
                    aria-label={`Skala ${num} bintang`}
                  >
                    <Star
                      className={`w-7 h-7 ${
                        num <= scale
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-transparent text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-[11px] font-bold text-amber-300 mt-1">
                {scale === 1 && '⭐ Belum paham sama sekali'}
                {scale === 2 && '⭐⭐ Masih banyak yang bingung'}
                {scale === 3 && '⭐⭐⭐ Cukup paham dasarnya'}
                {scale === 4 && '⭐⭐⭐⭐ Sudah paham dan bisa mempraktikkan'}
                {scale === 5 && '⭐⭐⭐⭐⭐ Sangat paham dan siap bantu teman!'}
              </p>
            </div>

            {/* Mood Emoji */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Suasana Hati Saat Belajar
              </label>
              <div className="flex items-center gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.emoji}
                    type="button"
                    onClick={() => setMoodEmoji(m.emoji)}
                    className={`px-3 py-2 rounded-xl text-lg transition border flex flex-col items-center gap-0.5 ${
                      moodEmoji === m.emoji
                        ? 'bg-pink-600/30 border-pink-500 scale-105 shadow'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span className="text-[10px] font-semibold">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3: Guided Reflection Questions */}
          <div className="space-y-4">
            {/* Question 1 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="q1-input" className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Apa yang sudah kamu pahami dari materi ini?</span>
                  <span className="text-pink-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleToggleSpeech('understood')}
                  title="Dikte dengan suara"
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                    isListening && activeSpeechField === 'understood'
                      ? 'bg-red-600 text-white border-red-500 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {isListening && activeSpeechField === 'understood' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">Suara</span>
                </button>
              </div>
              <textarea
                id="q1-input"
                required
                rows={2}
                value={understood}
                onChange={(e) => setUnderstood(e.target.value)}
                placeholder="Ceritakan dengan kata-katamu sendiri apa yang berhasil kamu mengerti..."
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Question 2 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="q2-input" className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Bagian mana yang masih terasa sulit atau membingungkan?</span>
                  <span className="text-pink-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleToggleSpeech('difficult')}
                  title="Dikte dengan suara"
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                    isListening && activeSpeechField === 'difficult'
                      ? 'bg-red-600 text-white border-red-500 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {isListening && activeSpeechField === 'difficult' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">Suara</span>
                </button>
              </div>
              <textarea
                id="q2-input"
                required
                rows={2}
                value={difficult}
                onChange={(e) => setDifficult(e.target.value)}
                placeholder="Jujurlah, tidak ada salah dalam refleksi. Sebutkan istilah atau konsep yang bikin pusing..."
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Question 3 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="q3-input" className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-sky-400" />
                  <span>Apa strategi atau rencanamu agar bisa lebih paham?</span>
                  <span className="text-pink-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleToggleSpeech('actionPlan')}
                  title="Dikte dengan suara"
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                    isListening && activeSpeechField === 'actionPlan'
                      ? 'bg-red-600 text-white border-red-500 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {isListening && activeSpeechField === 'actionPlan' ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">Suara</span>
                </button>
              </div>
              <textarea
                id="q3-input"
                required
                rows={2}
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                placeholder="Misal: membaca ulang catatan, mencoba latihan mandiri di VS Code, atau bertanya ke guru..."
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Custom Question from Teacher if exists */}
            {selectedMateri?.customQuestions?.[0] && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-700/50">
                <label htmlFor="custom-q-input" className="block text-xs font-bold text-indigo-300 mb-1.5">
                  Pertanyaan Khusus dari Guru: "{selectedMateri.customQuestions[0]}"
                </label>
                <input
                  id="custom-q-input"
                  type="text"
                  value={customAnswer}
                  onChange={(e) => setCustomAnswer(e.target.value)}
                  placeholder="Tuliskan jawabanmu di sini..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-xl shadow-pink-600/30 transition transform active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2.5"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin text-amber-300" />
                  <span>AI Mentor Kota sedang membaca refleksimu...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Kirim Refleksi & Dapatkan Umpan Balik AI (+30 Poin)</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              Refleksi ini dibaca oleh gurumu dan diproses AI Mentor Kota secara aman.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
