import React, { useState } from 'react';
import { QuizQuestion, Student } from '../../types/index.ts';
import { X, Wrench, CheckCircle, AlertCircle, HelpCircle, ArrowRight, Award } from 'lucide-react';

interface BengkelLatihanModalProps {
  onClose: () => void;
  questions: QuizQuestion[];
  student: Student;
  onAnswerCorrect: (pointsEarned: number) => void;
}

export const BengkelLatihanModal: React.FC<BengkelLatihanModalProps> = ({
  onClose,
  questions,
  student,
  onAnswerCorrect,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const currentQ = questions[currentIndex];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
      onAnswerCorrect(15); // Award +15 XP for correct quiz challenge
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Finished all
      setSelectedOption(null);
      setIsAnswered(false);
      setCurrentIndex(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-backdrop-fade">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              🛠️
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-display leading-tight">Bengkel Latihan</h2>
              <p className="text-xs text-amber-100 font-medium">Uji & Asah Pemahamanmu Lewat Kuis Cepat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Bengkel Latihan"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {questions.length > 0 && currentQ ? (
            <div className="space-y-5">
              {/* Progress & Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Tantangan Soal {currentIndex + 1} dari {questions.length}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                  +15 Poin tiap benar
                </span>
              </div>

              {/* Materi Tag */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
                Topik: <strong className="text-white">{currentQ.materiTitle || 'Kejuruan SMK'}</strong>
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
                <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  const isCorrect = idx === currentQ.correctIndex;
                  const isChosen = selectedOption === idx;

                  let btnStyle = 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-200';
                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md';
                    } else if (isChosen) {
                      btnStyle = 'bg-red-950/80 border-red-500 text-red-200';
                    } else {
                      btnStyle = 'bg-slate-850/40 border-slate-800 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelect(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between text-xs sm:text-sm font-medium ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-700/60 flex items-center justify-center font-bold text-xs shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isAnswered && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
                      {isAnswered && isChosen && !isCorrect && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation note when answered */}
              {isAnswered && (
                <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    {selectedOption === currentQ.correctIndex ? (
                      <span className="text-xs font-bold text-emerald-400">🎉 Jawabanmu Benar! (+15 XP)</span>
                    ) : (
                      <span className="text-xs font-bold text-red-400">Perlu sedikit penguatan lagi!</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-slate-200">Penjelasan:</strong> {currentQ.explanation}
                  </p>
                  <button
                    onClick={handleNext}
                    className="mt-3 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <span>{currentIndex < questions.length - 1 ? 'Soal Berikutnya' : 'Ulangi Kuis'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">Belum ada soal kuis yang disiapkan oleh guru.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
