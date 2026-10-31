import React, { useState } from 'react';
import {
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { sounds } from '../utils/audio.ts';
import { TEACHER_ACCOUNTS } from '../data/teacherAccounts.ts';

export interface TeacherLoginResult {
  name: string;
  username: string;
  gender?: 'L' | 'P';
  subject?: string;
  destination?: 'town' | 'panel';
  points?: number;
  isMasterPin?: boolean;
}

interface TeacherPinModalProps {
  onClose: () => void;
  onSuccess: (teacherInfo: TeacherLoginResult) => void;
  onOpenSettings?: () => void;
  expectedPin: string;
}

export const TeacherPinModal: React.FC<TeacherPinModalProps> = ({
  onClose,
  onSuccess,
  expectedPin,
}) => {
  const [loginMode, setLoginMode] = useState<'account' | 'pin'>('account');
  const [selectedUsername, setSelectedUsername] = useState<string>(TEACHER_ACCOUNTS[0].username);
  const [password, setPassword] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticatedTeacher, setAuthenticatedTeacher] = useState<TeacherLoginResult | null>(null);

  const currentTeacher = TEACHER_ACCOUNTS.find((t) => t.username === selectedUsername) || TEACHER_ACCOUNTS[0];
  const [selectedSubject, setSelectedSubject] = useState<string>(currentTeacher.subjects[0] || '');

  const handleAccountLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPw = password.trim();

    // Check against teacher's password, or master passwords
    if (
      cleanPw === currentTeacher.defaultPassword ||
      cleanPw === 'Kiki123!' ||
      cleanPw === expectedPin
    ) {
      sounds.playRewardXp();
      setAuthenticatedTeacher({
        name: currentTeacher.name,
        username: currentTeacher.username,
        gender: currentTeacher.gender,
        subject: selectedSubject || currentTeacher.subjects[0],
        points: 10,
      });
    } else {
      sounds.playClick();
      setError(`Password tidak sesuai untuk akun ${currentTeacher.name}. Silakan periksa kembali kata sandi rahasia Anda.`);
    }
  };

  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinInput.trim();
    if (clean === expectedPin || clean === 'Kiki123!') {
      sounds.playRewardXp();
      setAuthenticatedTeacher({
        name: 'kikybahsoan',
        username: 'kikybahsoan',
        gender: 'L',
        points: 999,
        isMasterPin: true,
      });
      return;
    }

    // Also check if entered password belongs to any of the registered teachers
    const matched = TEACHER_ACCOUNTS.find((t) => t.defaultPassword === clean || t.username === clean);
    if (matched) {
      sounds.playRewardXp();
      setAuthenticatedTeacher({
        name: matched.name,
        username: matched.username,
        gender: matched.gender,
        subject: matched.subjects[0],
        points: 10,
      });
      return;
    }

    sounds.playClick();
    setError('Kata sandi atau PIN guru tidak valid!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-backdrop-fade">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 relative animate-fade-in-up transition-all max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Tutup Login Guru"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* VIEW 1: DESTINATION SELECTION (AFTER SUCCESSFUL AUTH) */}
        {authenticatedTeacher ? (
          <div className="text-center py-3 space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full">
                Autentikasi Berhasil
              </span>
              <h3 className="text-lg font-black text-white mt-2">
                Selamat Datang, {authenticatedTeacher.isMasterPin ? 'Master PIN' : 'Bapak/Ibu'}!
              </h3>
              <p className="text-sm font-extrabold text-amber-300 mt-0.5">
                {authenticatedTeacher.name}
              </p>
              {authenticatedTeacher.isMasterPin ? (
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-xs px-3 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/60 text-amber-300 font-bold">
                    Master PIN • 999 XP
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  Guru Pembimbing DKV • SMKN 2 Gorontalo
                </p>
              )}
            </div>

            {(() => {
              const matchedT = TEACHER_ACCOUNTS.find((t) => t.username === authenticatedTeacher.username) || currentTeacher;
              const subjectsList = authenticatedTeacher.isMasterPin
                ? [
                    'Master Guru (Seluruh Mapel DKV)',
                    ...matchedT.subjects,
                  ]
                : matchedT.subjects;
              return (
                <div className="space-y-3 max-w-sm mx-auto text-left">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Pilih Mata Pelajaran / Konsentrasi Keahlian
                    </label>
                    <select
                      value={selectedSubject || subjectsList[0]}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full text-xs font-semibold py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {subjectsList.map((subj) => (
                        <option key={subj} value={subj}>
                          {subj}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onSuccess({
                        ...authenticatedTeacher,
                        points: authenticatedTeacher.isMasterPin ? 999 : (authenticatedTeacher.points || 10),
                        subject: selectedSubject || subjectsList[0],
                        destination: 'town',
                      })
                    }
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs sm:text-sm shadow-xl flex items-center gap-3 transition transform hover:scale-[1.02] active:scale-95 cursor-pointer border border-emerald-400/40 text-left"
                  >
                    <span className="text-2xl shrink-0">🏛️</span>
                    <div className="flex-1">
                      <div className="font-extrabold">Masuk ke Kota (Sebagai {authenticatedTeacher.isMasterPin ? 'Master' : 'Guru'})</div>
                      <div className="text-[10px] text-emerald-100/90 font-normal mt-0.5">
                        Jelajahi kota Refleksia dengan akun {authenticatedTeacher.name} {authenticatedTeacher.isMasterPin ? '(999 XP)' : ''}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSuccess({ ...authenticatedTeacher, subject: selectedSubject || matchedT.subjects[0], destination: 'panel' })}
                    className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white font-bold text-xs shadow-md flex items-center gap-3 transition cursor-pointer border border-slate-700 hover:border-amber-500/50 text-left"
                  >
                    <span className="text-xl shrink-0">📋</span>
                    <div className="flex-1">
                      <div className="font-bold text-amber-300">Buka Panel Ruang Guru</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Rekap refleksi & manajemen materi DKV
                      </div>
                    </div>
                  </button>
                </div>
              );
            })()}
          </div>
        ) : (
          /* VIEW 2: LOGIN FORM */
          <div>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-500/30">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Login Akademik Guru DKV
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                SMKN 2 Gorontalo • Akses Khusus Pendidik
              </p>
            </div>

            {/* Mode Switch: Akun Guru vs Master PIN */}
            <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/70 mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('account');
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                  loginMode === 'account'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pilih Akun Guru ({TEACHER_ACCOUNTS.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('pin');
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                  loginMode === 'pin'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                PIN / Sandi Utama
              </button>
            </div>

            {/* Sub-View: Account Login */}
            {loginMode === 'account' ? (
              <form onSubmit={handleAccountLogin} className="space-y-3.5">
                {/* Select Teacher Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Nama Guru</span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      @{currentTeacher.username}
                    </span>
                  </label>
                  <select
                    value={selectedUsername}
                    onChange={(e) => {
                      setSelectedUsername(e.target.value);
                      setPassword('');
                      setError(null);
                    }}
                    className="w-full text-xs font-semibold py-2.5 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {TEACHER_ACCOUNTS.map((t) => (
                      <option key={t.username} value={t.username}>
                        {t.no}. {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password Input (Secure without exposing defaults) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kata Sandi Akun Guru
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Masukkan kata sandi guru..."
                      className="w-full text-xs font-medium py-2.5 pl-3 pr-10 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-xs text-red-400 bg-red-950/60 p-2.5 rounded-xl border border-red-800 leading-snug">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs shadow transition cursor-pointer active:scale-95"
                >
                  Masuk sebagai {currentTeacher.name.split(',')[0]}
                </button>
              </form>
            ) : (
              /* Sub-View: Master PIN / Password */
              <form onSubmit={handlePinLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Ketik Master PIN (Akun kikybahsoan • 999 XP)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        setError(null);
                      }}
                      placeholder="Masukkan Master PIN..."
                      className="w-full text-center text-sm font-bold py-2.5 px-10 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/60 p-2.5 rounded-xl border border-red-800">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs shadow transition cursor-pointer active:scale-95"
                >
                  Buka Ruang Guru
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
