import React, { useState, useEffect, useRef } from 'react';
import { lofiMusic, RadioStationMeta, RADIO_STATIONS, TimePeriod } from '../utils/lofiAudio.ts';
import { Radio, Volume2, VolumeX, Sparkles } from 'lucide-react';

export const LofiAudioControl: React.FC<{ timePeriod?: TimePeriod }> = ({ timePeriod }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const [stationMeta, setStationMeta] = useState<RadioStationMeta>(() => lofiMusic.getStationInfo());
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timePeriod) {
      lofiMusic.setTimePeriod(timePeriod);
    }
  }, [timePeriod]);

  useEffect(() => {
    const unsubscribe = lofiMusic.subscribe((playing, vol, _period, meta) => {
      setIsPlaying(playing);
      setVolume(vol);
      if (meta) {
        setStationMeta(meta);
      }
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
      {/* Radio Toggle Button */}
      <button
        onClick={handleTogglePlay}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowVolumeSlider((prev) => !prev);
        }}
        className={`group relative h-7.5 sm:h-9 w-7.5 sm:w-auto px-0 sm:px-3 rounded-full backdrop-blur-md border shadow-lg flex items-center justify-center sm:justify-start gap-1.5 transition active:scale-95 cursor-pointer shrink-0 ${
          isPlaying
            ? 'bg-amber-950/80 border-amber-500/70 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
            : 'bg-[#121e2c]/95 border-slate-700/60 text-slate-300 hover:text-white hover:bg-[#1a293b]'
        }`}
        title={
          isPlaying
            ? `${stationMeta.stationName} (${stationMeta.frequency}): Mengudara • Klik untuk jeda`
            : `Nyalakan Radio Kota Refleksia (${stationMeta.stationName})`
        }
        aria-label="Radio Kota Refleksia"
      >
        {isPlaying ? (
          <>
            {/* Animated Radio broadcast pulse dot + Radio icon */}
            <div className="relative flex items-center justify-center">
              <span className="absolute -inset-1 rounded-full bg-amber-400/30 animate-ping"></span>
              <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse relative z-10" />
            </div>

            {/* Radio frequency bars */}
            <div className="hidden sm:flex items-end gap-0.5 h-3.5 w-3 py-0.5">
              <span className="w-0.5 bg-amber-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-2"></span>
              <span className="w-0.5 bg-amber-300 rounded-full animate-[pulse_1.1s_ease-in-out_infinite] h-3.5"></span>
              <span className="w-0.5 bg-amber-400 rounded-full animate-[pulse_0.85s_ease-in-out_infinite] h-2.5"></span>
            </div>

            <span className="text-[11px] sm:text-xs font-bold text-amber-300 font-mono hidden sm:inline">
              Radio
            </span>
          </>
        ) : (
          <>
            <Radio className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 transition" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-300 font-mono hidden sm:inline">
              Radio
            </span>
          </>
        )}

        {/* Small Volume Cog / Dropdown Trigger */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            setShowVolumeSlider((prev) => !prev);
          }}
          className="hidden sm:inline-block text-[10px] opacity-70 hover:opacity-100 hover:text-white px-0.5 py-0.5"
          title="Atur Frekuensi & Volume Radio"
        >
          ▾
        </span>
      </button>

      {/* Floating Radio Tuner Dropdown */}
      {showVolumeSlider && (
        <div className="absolute right-0 top-11 z-50 bg-[#121e2c]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5 min-w-[210px] animate-fade-in-up">
          {/* Station Title & Frequency */}
          <div className="pb-2 border-b border-slate-700/60">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-white">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Radio className="w-3.5 h-3.5" />
                <span>{stationMeta.stationName}</span>
              </span>
              <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-400/30">
                {stationMeta.frequency}
              </span>
            </div>
            <p className="text-[9.5px] text-slate-300 mt-0.5 italic truncate">
              {stationMeta.tagline}
            </p>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-300">
            <span className="flex items-center gap-1 text-slate-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Volume Suara
            </span>
            <span className="font-mono text-amber-400">{Math.round(volume * 100)}%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => lofiMusic.setVolume(volume > 0 ? 0 : 0.45)}
              className="text-slate-400 hover:text-white transition cursor-pointer"
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
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Play / Pause Toggle Button */}
          <div className="pt-1">
            <button
              onClick={handleTogglePlay}
              className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold text-center transition cursor-pointer shadow-sm ${
                isPlaying
                  ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 border border-rose-800/40'
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-black shadow-md'
              }`}
            >
              {isPlaying ? '⏸ Jeda Siaran Radio' : '▶ Nyalakan Radio'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
