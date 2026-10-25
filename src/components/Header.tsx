import React from 'react';
import { Sun, Moon, Volume2, VolumeX, Sparkles, User, Award } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  studentName: string;
  studentClass: string;
  studentXp: number;
  isNight: boolean;
  soundEnabled: boolean;
  onToggleTime: () => void;
  onToggleSound: () => void;
  onOpenProfile: () => void;
  onOpenPapanInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  studentName,
  studentClass,
  studentXp,
  isNight,
  soundEnabled,
  onToggleTime,
  onToggleSound,
  onOpenProfile,
  onOpenPapanInfo,
}) => {
  // Calculate Level based on XP
  const level = Math.floor(studentXp / 100) + 1;
  const nextLevelXp = level * 100;
  const currentLevelProgress = studentXp % 100;

  return (
    <header className="fixed top-3 left-4 right-4 z-40 max-w-6xl mx-auto">
      <div className="liquid-glass-dark rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl transition-all border border-white/20 backdrop-blur-xl">
        {/* 1. JUDUL: Refleksia City */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-xl font-bold ring-2 ring-white/30">
            🏙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black tracking-tight text-white font-['Outfit'] drop-shadow-sm">
                Refleksia City
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                Pulau Langit Geometris
              </span>
            </div>
            <p className="text-xs text-slate-300 hidden md:block">
              Kota Refleksi Pembelajaran Berbasis Metakognisi
            </p>
          </div>
        </div>

        {/* 2. NAMA & 3. XP */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Student Profile Card (Clickable to change name) */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenProfile();
            }}
            title="Klik untuk ubah nama atau profil murid"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-1 ring-white/20">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                {studentName}
              </div>
              <div className="text-[10px] text-slate-300 font-medium">
                {studentClass}
              </div>
            </div>
          </button>

          {/* XP & Level Badge (USER REQUIREMENT: header menampilkan Judul, Nama dan XP) */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenPapanInfo();
            }}
            title="Lihat Papan Info & Leaderboard XP"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 hover:border-amber-400/80 transition-all shadow-sm group"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-400/30 flex items-center justify-center text-amber-300">
              <Award className="w-4 h-4 animate-bounce" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-amber-300 flex items-center gap-1">
                ⭐ {studentXp} XP
              </div>
              <div className="text-[9px] text-amber-200/90 font-medium">
                Level {level} ({currentLevelProgress}/{100})
              </div>
            </div>
          </button>

          {/* Controls: Day/Night & Sound */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-white/15">
            <button
              onClick={() => {
                sounds.playClick();
                onToggleTime();
              }}
              title={isNight ? 'Ganti ke Siang Hari' : 'Ganti ke Malam Hari'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all hover:scale-105 active:scale-95"
            >
              {isNight ? (
                <Moon className="w-4 h-4 text-yellow-300" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            <button
              onClick={() => {
                onToggleSound();
              }}
              title={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all hover:scale-105 active:scale-95"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
