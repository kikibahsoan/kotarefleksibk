import React, { useState, useEffect, useRef } from 'react';
import { lofiMusic } from '../utils/lofiAudio.ts';
import { Music, Volume2, VolumeX, Sparkles } from 'lucide-react';

export const LofiAudioControl: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = lofiMusic.subscribe((playing, vol) => {
      setIsPlaying(playing);
      setVolume(vol);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowVolumeSlider(false);
      }
    };
    if (showVolumeSlider) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showVolumeSlider]);

  const handleTogglePlay = () => {
    lofiMusic.toggle();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    lofiMusic.setVolume(newVol);
  };

  return (
    <div className="relative pointer-events-auto" ref={dropdownRef}>
      {/* Lo-Fi Toggle Button */}
      <button
        onClick={handleTogglePlay}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowVolumeSlider((prev) => !prev);
        }}
        className={`group relative h-7.5 sm:h-9 w-7.5 sm:w-auto px-0 sm:px-3 rounded-full backdrop-blur-md border shadow-lg flex items-center justify-center sm:justify-start gap-1.5 transition active:scale-95 cursor-pointer shrink-0 ${
          isPlaying
            ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            : 'bg-[#121e2c]/95 border-slate-700/60 text-slate-300 hover:text-white hover:bg-[#1a293b]'
        }`}
        title={isPlaying ? 'Lo-Fi Musik: Berputar (Klik untuk jeda, klik kanan untuk volume)' : 'Putar Musik Lo-Fi Santai'}
        aria-label="Lo-Fi Background Music"
      >
        {isPlaying ? (
          <>
            {/* Animated Lo-Fi Sound Wave equalizer bars */}
            <div className="flex items-end gap-0.5 h-3.5 w-3.5 py-0.5">
              <span className="w-0.5 bg-emerald-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-2"></span>
              <span className="w-0.5 bg-emerald-300 rounded-full animate-[pulse_1.2s_ease-in-out_infinite] h-3.5"></span>
              <span className="w-0.5 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2.5"></span>
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-emerald-300 font-mono hidden sm:inline">
              Lo-Fi
            </span>
          </>
        ) : (
          <>
            <Music className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 transition" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-300 font-mono hidden sm:inline">
              Lo-Fi
            </span>
          </>
        )}

        {/* Small Volume Cog / Slider Trigger */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            setShowVolumeSlider((prev) => !prev);
          }}
          className="hidden sm:inline-block text-[10px] opacity-70 hover:opacity-100 hover:text-white px-0.5 py-0.5"
          title="Atur Volume Musik"
        >
          ▾
        </span>
      </button>

      {/* Floating Volume Slider Dropdown */}
      {showVolumeSlider && (
        <div className="absolute right-0 top-11 z-50 bg-[#121e2c]/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 min-w-[190px] animate-fade-in-up">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 pb-1 border-b border-slate-700/60">
            <span className="flex items-center gap-1 text-emerald-400">
              <Sparkles className="w-3 h-3" />
              Volume Lo-Fi
            </span>
            <span className="font-mono text-amber-400">{Math.round(volume * 100)}%</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => lofiMusic.setVolume(volume > 0 ? 0 : 0.45)}
              className="text-slate-400 hover:text-white transition"
              title={volume === 0 ? 'Bunyikan' : 'Senyap'}
            >
              {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleTogglePlay}
              className={`w-full py-1 px-2 rounded-lg text-[10px] font-bold text-center transition ${
                isPlaying
                  ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 border border-rose-800/40'
                  : 'bg-emerald-800/60 text-emerald-200 hover:bg-emerald-700/80 border border-emerald-500/40'
              }`}
            >
              {isPlaying ? '⏸ Jeda Musik' : '▶ Putar Lo-Fi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
