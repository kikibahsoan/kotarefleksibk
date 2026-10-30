import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { QuizQuestion, Student } from '../../types/index.ts';
import { INITIAL_QUIZ } from '../../data/initialData.ts';
import { X, CheckCircle, AlertCircle, ArrowRight, Award, Clock, RotateCcw, Zap, Shuffle } from 'lucide-react';
import { sounds } from '../../utils/audio.ts';

interface BengkelLatihanModalProps {
  onClose: () => void;
  questions: QuizQuestion[];
  student: Student;
  onAnswerCorrect: (pointsEarned: number) => void;
  onCompleteQuiz?: () => void;
}

const TIER_LABELS = [
  { level: 1, name: 'Jenjang 1 • Dasar', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { level: 2, name: 'Jenjang 2 • Pemahaman', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  { level: 3, name: 'Jenjang 3 • Penerapan', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { level: 4, name: 'Jenjang 4 • Analisis', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { level: 5, name: 'Jenjang 5 • Mahir', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
];

const QUESTION_TIME_LIMIT_MS = 5000; // 5 detik per nomor
const USED_QIDS_STORAGE_KEY = 'kota_lab_dkv_used_qids_v2';
const ROUND_NUMBER_STORAGE_KEY = 'kota_lab_dkv_round_v2';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function shuffleQuestionOptions(q: QuizQuestion): QuizQuestion {
  const indexed = q.options.map((text, idx) => ({
    text,
    isCorrect: idx === q.correctIndex,
  }));
  const shuffled = shuffleArray(indexed);
  const newCorrectIdx = shuffled.findIndex((item) => item.isCorrect);
  return {
    ...q,
    options: shuffled.map((item) => item.text),
    correctIndex: newCorrectIdx >= 0 ? newCorrectIdx : q.correctIndex,
  };
}

function getTierForQuestion(q: QuizQuestion): number {
  if (q.id.startsWith('q-bk-1') || q.materiTitle?.includes('Jenjang 1') || q.materiId === 'materi-bk-01') return 1;
  if (q.id.startsWith('q-bk-2') || q.materiTitle?.includes('Jenjang 2') || q.materiId === 'materi-bk-02') return 2;
  if (q.id.startsWith('q-bk-3') || q.materiTitle?.includes('Jenjang 3') || q.materiId === 'materi-bk-03') return 3;
  if (q.id.startsWith('q-bk-4') || q.materiTitle?.includes('Jenjang 4') || q.materiId === 'materi-bk-04') return 4;
  if (q.id.startsWith('q-bk-5') || q.materiTitle?.includes('Jenjang 5') || q.materiId === 'materi-bk-05') return 5;
  return 1;
}

export const BengkelLatihanModal: React.FC<BengkelLatihanModalProps> = ({
  onClose,
  questions,
  student,
  onAnswerCorrect,
  onCompleteQuiz,
}) => {
  // Combine incoming questions with the 25-question INITIAL_QUIZ pool so there are always 25 diverse questions
  const fullPool = useMemo(() => {
    const map = new Map<string, QuizQuestion>();
    INITIAL_QUIZ.forEach((q) => map.set(q.id, q));
    if (questions && questions.length > 0) {
      questions.forEach((q) => map.set(q.id, q));
    }
    return Array.from(map.values());
  }, [questions]);

  // Function to pick 5 random questions different from previously completed sets continuously
  const pickRandomFiveQuestions = useCallback(
    (previousIds: string[] = []): QuizQuestion[] => {
      let usedIds: string[] = [];
      try {
        const raw = localStorage.getItem(USED_QIDS_STORAGE_KEY);
        if (raw) usedIds = JSON.parse(raw);
      } catch {}

      const usedSet = new Set<string>(usedIds);
      const prevSet = new Set<string>(previousIds);
      const picked: QuizQuestion[] = [];

      for (let tier = 1; tier <= 5; tier++) {
        const tierCandidates = fullPool.filter((q) => getTierForQuestion(q) === tier);
        // Prefer questions in this tier that have not been used yet AND were not in the immediate previous round
        let available = tierCandidates.filter((q) => !usedSet.has(q.id) && !prevSet.has(q.id));

        if (available.length === 0) {
          // All variants for this tier have been played — reset used tracking for this tier,
          // while still excluding the question from the immediate previous round so it never repeats back-to-back!
          tierCandidates.forEach((q) => usedSet.delete(q.id));
          available = tierCandidates.filter((q) => !prevSet.has(q.id));
          if (available.length === 0) {
            available = tierCandidates;
          }
        }

        const chosen = shuffleArray(available)[0];
        if (chosen) {
          usedSet.add(chosen.id);
          picked.push(shuffleQuestionOptions(chosen));
        }
      }

      // Fallback if any tier was missing
      if (picked.length < 5) {
        const remaining = shuffleArray(
          fullPool.filter((q) => !picked.some((p) => p.id === q.id))
        ).slice(0, 5 - picked.length);
        remaining.forEach((q) => {
          usedSet.add(q.id);
          picked.push(shuffleQuestionOptions(q));
        });
      }

      try {
        localStorage.setItem(USED_QIDS_STORAGE_KEY, JSON.stringify(Array.from(usedSet)));
      } catch {}

      return picked.slice(0, 5);
    },
    [fullPool]
  );

  const [roundNumber, setRoundNumber] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(ROUND_NUMBER_STORAGE_KEY) || '1');
      return Number.isFinite(saved) && saved >= 1 ? saved : 1;
    } catch {
      return 1;
    }
  });

  const [tieredQuestions, setTieredQuestions] = useState<QuizQuestion[]>(() =>
    pickRandomFiveQuestions([])
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [score, setScore] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [resultsHistory, setResultsHistory] = useState<Array<'correct' | 'wrong' | 'timeout' | null>>([
    null,
    null,
    null,
    null,
    null,
  ]);

  // 5-second countdown state in milliseconds
  const [remainingMs, setRemainingMs] = useState<number>(QUESTION_TIME_LIMIT_MS);
  const questionStartRef = useRef<number>(performance.now());

  const currentQ = tieredQuestions[currentIndex];
  const currentTier = TIER_LABELS[currentIndex] || TIER_LABELS[0];

  // Reset and run 5-second timer whenever currentIndex changes or a new randomized round starts
  useEffect(() => {
    if (isAnswered || isFinished) return;

    questionStartRef.current = performance.now();
    setRemainingMs(QUESTION_TIME_LIMIT_MS);

    const timer = window.setInterval(() => {
      const elapsed = performance.now() - questionStartRef.current;
      const left = Math.max(0, QUESTION_TIME_LIMIT_MS - elapsed);
      setRemainingMs(left);

      if (left <= 0) {
        window.clearInterval(timer);
        setIsTimedOut(true);
        setIsAnswered(true);
        setResultsHistory((prev) => {
          const next = [...prev];
          next[currentIndex] = 'timeout';
          return next;
        });
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, [currentIndex, isAnswered, isFinished, roundNumber]);

  const handleSelect = (idx: number) => {
    if (isAnswered || isFinished || !currentQ) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    setIsTimedOut(false);

    const isRight = idx === currentQ.correctIndex;
    setResultsHistory((prev) => {
      const next = [...prev];
      next[currentIndex] = isRight ? 'correct' : 'wrong';
      return next;
    });

    if (isRight) {
      sounds.playRewardXp();
      setScore((prev) => prev + 1);
      setEarnedXp((prev) => prev + 1);
      onAnswerCorrect(1); // Persoal jika benar dapat 1 XP
    } else {
      sounds.playClick();
    }
  };

  // Start a brand-new randomized set of 5 questions continuously
  const handleStartNextRandomSet = () => {
    sounds.playClick();
    const currentIds = tieredQuestions.map((q) => q.id);
    const nextFive = pickRandomFiveQuestions(currentIds);
    const nextRound = roundNumber + 1;
    setRoundNumber(nextRound);
    try {
      localStorage.setItem(ROUND_NUMBER_STORAGE_KEY, String(nextRound));
    } catch {}
    setTieredQuestions(nextFive);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsTimedOut(false);
    setScore(0);
    setEarnedXp(0);
    setIsFinished(false);
    setResultsHistory([null, null, null, null, null]);
    setRemainingMs(QUESTION_TIME_LIMIT_MS);
  };

  const handleNext = () => {
    sounds.playClick();
    if (currentIndex < tieredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsTimedOut(false);
      setRemainingMs(QUESTION_TIME_LIMIT_MS);
    } else {
      // Completed 5 questions! Trigger mission completion and prepare next random round counter
      setIsFinished(true);
      const nextRound = roundNumber + 1;
      try {
        localStorage.setItem(ROUND_NUMBER_STORAGE_KEY, String(nextRound));
      } catch {}
      if (onCompleteQuiz) {
        onCompleteQuiz();
      }
    }
  };

  const secondsLeftDisplay = Math.ceil(remainingMs / 1000);
  const progressPercent = Math.max(0, Math.min(100, (remainingMs / QUESTION_TIME_LIMIT_MS) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              🛠️
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold font-display leading-tight">
                  Lab DKV & Tefa • 5 Soal Acak
                </h2>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-black/30 text-amber-200 border border-white/20 flex items-center gap-1">
                  <Shuffle className="w-3 h-3" /> Paket Acak #{roundNumber}
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                Waktu 5 Detik / Nomor • Benar +1 XP per Soal • Saldo: 🪙 {student.points} XP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Lab DKV & Tefa"
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 5 Tiered Steps Bar */}
        <div className="px-5 sm:px-6 pt-4 pb-2 bg-slate-950/50 border-b border-slate-800">
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {tieredQuestions.map((_, idx) => {
              const res = resultsHistory[idx];
              const isCurrent = idx === currentIndex && !isFinished;
              let stepClass = 'bg-slate-800/80 border-slate-700 text-slate-400';
              if (res === 'correct') {
                stepClass = 'bg-emerald-950/90 border-emerald-500 text-emerald-300';
              } else if (res === 'wrong' || res === 'timeout') {
                stepClass = 'bg-red-950/80 border-red-500/70 text-red-300';
              } else if (isCurrent) {
                stepClass = 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/30';
              }
              return (
                <div
                  key={idx}
                  className={`px-2 py-1.5 rounded-xl border text-center transition-all ${stepClass}`}
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-wider">
                    Nomor {idx + 1}
                  </div>
                  <div className="text-[9px] opacity-85 truncate">
                    Jenjang {idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {!isFinished && currentQ ? (
            <div className="space-y-4">
              {/* Top Status Row: Tier Badge + 5-Second Countdown Timer */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${currentTier.badgeColor}`}>
                    Nomor {currentIndex + 1}/5 • {currentTier.name}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-950/90 text-amber-300 border border-amber-700/70 font-mono font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> +1 XP jika benar
                  </span>
                </div>

                {/* 5-Second Countdown Pill */}
                <div
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-mono text-xs sm:text-sm font-black border transition-colors ${
                    isAnswered
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : secondsLeftDisplay <= 2
                      ? 'bg-red-950/90 text-red-300 border-red-500 animate-pulse'
                      : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{isAnswered ? (isTimedOut ? '0 Detik (Habis)' : 'Selesai') : `${secondsLeftDisplay} Detik`}</span>
                </div>
              </div>

              {/* 5-Second Countdown Visual Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80">
                <div
                  className={`h-full transition-all duration-75 rounded-full ${
                    secondsLeftDisplay <= 2
                      ? 'bg-gradient-to-r from-red-600 to-rose-400'
                      : secondsLeftDisplay <= 3
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${isAnswered ? 0 : progressPercent}%` }}
                />
              </div>

              {/* Materi Tag */}
              <div className="px-3.5 py-2 rounded-xl bg-slate-800/70 border border-slate-700/70 text-xs text-slate-300 flex items-center justify-between gap-2">
                <span>
                  Topik: <strong className="text-white">{currentQ.materiTitle || currentTier.name}</strong>
                </span>
                <span className="text-[10px] font-mono text-amber-300 shrink-0">
                  Soal Acak #{currentIndex + 1}
                </span>
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-2xl bg-slate-800/95 border border-slate-700 shadow-inner">
                <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  const isCorrect = idx === currentQ.correctIndex;
                  const isChosen = selectedOption === idx;

                  let btnStyle =
                    'bg-slate-800 border-slate-700 hover:bg-slate-700/80 hover:border-amber-500/50 text-slate-100 cursor-pointer';
                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-950/85 border-emerald-500 text-emerald-200 shadow-md cursor-default';
                    } else if (isChosen) {
                      btnStyle = 'bg-red-950/85 border-red-500 text-red-200 cursor-default';
                    } else {
                      btnStyle = 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60 cursor-default';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelect(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between text-xs sm:text-sm font-semibold ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-700/80 flex items-center justify-center font-bold text-xs shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isAnswered && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
                      {isAnswered && isChosen && !isCorrect && (
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Next Button when answered or timed out */}
              {isAnswered && (
                <div className="p-4 rounded-2xl bg-slate-800/95 border border-slate-700 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-2">
                    {isTimedOut ? (
                      <span className="text-xs sm:text-sm font-extrabold text-amber-400 flex items-center gap-1.5">
                        ⏰ Waktu 5 Detik Habis! Belum sempat terjawab (0 XP)
                      </span>
                    ) : selectedOption === currentQ.correctIndex ? (
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-400 flex items-center gap-1.5">
                        🎉 Jawaban Benar! (+1 XP masuk ke saldo)
                      </span>
                    ) : (
                      <span className="text-xs sm:text-sm font-extrabold text-red-400 flex items-center gap-1.5">
                        ❌ Jawaban Kurang Tepat (0 XP)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-slate-100">Pembahasan:</strong> {currentQ.explanation}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      onClick={handleNext}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                    >
                      <span>
                        {currentIndex < tieredQuestions.length - 1
                          ? `Lanjut ke Nomor ${currentIndex + 2} (Jenjang ${currentIndex + 2})`
                          : 'Selesai 5 Nomor & Lihat Skor'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    {currentIndex === tieredQuestions.length - 1 && (
                      <button
                        onClick={() => {
                          if (onCompleteQuiz) onCompleteQuiz();
                          handleStartNextRandomSet();
                        }}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                      >
                        <Shuffle className="w-4 h-4" />
                        <span>Lanjut 5 Soal Acak Berikutnya</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Final Summary Card after completing 5 Tiered Questions */
            <div className="text-center py-6 px-4 space-y-5 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto text-3xl shadow-inner">
                🏆
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Selesai 5 Nomor • Paket Acak #{roundNumber}
                </span>
                <h3 className="text-2xl font-black text-white mt-2">
                  Skor Kamu: {score} / {tieredQuestions.length} Benar
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Kamu berhasil mengumpulkan total <strong className="text-amber-300">+{earnedXp} XP</strong> dari 5 nomor ini! Klik tombol di bawah untuk langsung mengerjakan <strong>5 soal acak lainnya</strong> secara terus-menerus.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700 max-w-md mx-auto">
                <Award className="w-8 h-8 text-amber-400 shrink-0" />
                <div className="text-left">
                  <div className="text-xs text-slate-400">Saldo Koin (XP) Saat Ini</div>
                  <div className="text-lg font-black text-amber-300 font-mono">🪙 {student.points} XP</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 max-w-md mx-auto">
                <button
                  onClick={handleStartNextRandomSet}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Kerjakan 5 Soal Acak Berikutnya</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>Kembali ke Kota</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
