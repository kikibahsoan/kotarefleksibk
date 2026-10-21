import React, { useState } from 'react';
import { SMK_CLASSES } from '../data/initialData.ts';
import { Student } from '../types/index.ts';
import { School, User, Lock, Sparkles, BookOpen, MapPin, Compass } from 'lucide-react';

interface StudentWelcomeProps {
  onLoginStudent: (student: Student) => void;
  onOpenTeacherLogin: () => void;
  existingStudent: Student | null;
}

export const StudentWelcome: React.FC<StudentWelcomeProps> = ({
  onLoginStudent,
  onOpenTeacherLogin,
  existingStudent,
}) => {
  const [name, setName] = useState(existingStudent?.name || '');
  const [className, setClassName] = useState(existingStudent?.className || SMK_CLASSES[0]);
  const [studentNumber, setStudentNumber] = useState(existingStudent?.studentNumber || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Silakan isi nama lengkapmu terlebih dahulu.');
      return;
    }
    if (!className) {
      setError('Silakan pilih kelas dari daftar.');
      return;
    }

    const student: Student = {
      id: existingStudent?.id || `std-${Date.now().toString(36)}`,
      name: name.trim(),
      className,
      studentNumber: studentNumber.trim() || undefined,
      points: existingStudent?.points || 20,
      badges: existingStudent?.badges || ['reflektor_pertama'],
      lastLogin: new Date().toISOString().slice(0, 10),
      streakDays: existingStudent?.streakDays || 1,
    };

    onLoginStudent(student);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-sky-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-xl bg-slate-800/95 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-10 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30 mb-4">
            <School className="w-9 h-9" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 font-display">
            Kota Refleksi
          </h1>
          <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-sky-300 border border-blue-500/30 text-xs font-bold mb-2">
            Informatika (KKA) • Kelas X DKV 1, 2 & 3
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Media interaktif belajar & refleksi materi <strong className="text-amber-400">Berpikir Komputasional</strong> bersama <strong className="text-sky-300">AI Mentor Kota</strong>.
          </p>
        </div>

        {/* Existing User Quick Resume Banner */}
        {existingStudent && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-950/70 border border-blue-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold">
                {existingStudent.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-blue-300 font-medium">Akun tersimpan di perangkat ini</p>
                <p className="text-sm font-bold text-white">{existingStudent.name} ({existingStudent.className.split(' ')[0]})</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onLoginStudent(existingStudent)}
              className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow transition"
            >
              Lanjutkan →
            </button>
          </div>
        )}

        {/* Student Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label htmlFor="student-name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-sky-400" />
              Nama Lengkap Murid <span className="text-red-400">*</span>
            </label>
            <input
              id="student-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="student-class-select" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Pilih Kelas <span className="text-red-400">*</span>
              </label>
              <select
                id="student-class-select"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {SMK_CLASSES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="student-number-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                No. Absen
              </label>
              <input
                id="student-number-input"
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="Misal: 05"
                className="w-full px-3 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 font-semibold bg-red-950/60 p-2.5 rounded-lg border border-red-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full mt-4 py-3.5 px-6 rounded-xl font-extrabold text-base bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition transform active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Compass className="w-5 h-5" />
            <span>Masuk Kota Refleksi</span>
          </button>
        </form>

        {/* Feature Pills */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-slate-700/60 text-center">
          <div className="p-2 rounded-xl bg-slate-900/50">
            <p className="text-base">🏛️</p>
            <p className="text-[11px] font-semibold text-slate-300 mt-1">Kota 3D Mini</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/50">
            <p className="text-base">🤖</p>
            <p className="text-[11px] font-semibold text-slate-300 mt-1">AI Mentor Kota</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/50">
            <p className="text-base">🏆</p>
            <p className="text-[11px] font-semibold text-slate-300 mt-1">Poin & Lencana</p>
          </div>
        </div>

        {/* Teacher Entry Button */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onOpenTeacherLogin}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-700/50 transition border border-transparent hover:border-slate-600"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Masuk sebagai Guru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
