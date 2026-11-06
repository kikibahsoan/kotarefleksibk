import React, { useState, useEffect, useRef } from 'react';
import { lofiMusic, RadioStationMeta, RadioChannel, TimePeriod } from '../utils/lofiAudio.ts';
import { Radio, Volume2, VolumeX, Sparkles, ExternalLink, Music, Disc, Check, Loader2, X, Repeat, Link2 } from 'lucide-react';

export const LofiAudioControl: React.FC<{ timePeriod?: TimePeriod }> = ({ timePeriod }) => {
  const [isPlaying, setIsPlaying] = useState(() => lofiMusic.getIsPlaying());
  const [volume, setVolume] = useState(() => lofiMusic.getVolume());
  const [activeChannel, setActiveChannel] = useState<RadioChannel>(() => lofiMusic.getChannel());
  const [stationMeta, setStationMeta] = useState<RadioStationMeta>(() => lofiMusic.getStationInfo());
  const [showTuner, setShowTuner] = useState(false);
  const [isRriConnecting, setIsRriConnecting] = useState(() => lofiMusic.getIsRriConnecting());
  const [customDriveInput, setCustomDriveInput] = useState(() => lofiMusic.getCustomDriveUrl());
  const [showDriveInput, setShowDriveInput] = useState(false);
  const [driveSavedNotice, setDriveSavedNotice] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timePeriod) {
      lofiMusic.setTimePeriod(timePeriod);
    }
  }, [timePeriod]);

  useEffect(() => {
    const unsubscribe = lofiMusic.subscribe((playing, vol, channel, meta) => {
      setIsPlaying(playing);
      setVolume(vol);
      setActiveChannel(channel);
      if (meta) {
        setStationMeta(meta);
      }
      setIsRriConnecting(lofiMusic.getIsRriConnecting());
    });
    return () => unsubscribe();
  }, []);

  // Poll connecting state for live streams
  useEffect(() => {
    if (!isPlaying || activeChannel !== 'rri_gorontalo') return;
    const interval = setInterval(() => {
      setIsRriConnecting(lofiMusic.getIsRriConnecting());
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, activeChannel]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTuner(false);
      }
    };
    if (showTuner) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTuner]);

  const handleTogglePlay = () => {
    lofiMusic.toggle();
  };

  const handleSelectChannel = (channel: RadioChannel) => {
    lofiMusic.setChannel(channel);
    if (!isPlaying) {
      lofiMusic.play();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    lofiMusic.setVolume(newVol);
  };

  const handleSaveDriveLink = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    lofiMusic.setCustomDriveUrl(customDriveInput);
    setDriveSavedNotice(true);
    setTimeout(() => setDriveSavedNotice(false), 2200);
  };

  // Station list for manual switching
  const STATIONS_LIST: {
    id: RadioChannel;
    label: string;
    sublabel: string;
    freq: string;
    icon: string;
    badge: string;
    externalUrl?: string;
  }[] = [
    {
      id: 'rri_gorontalo',
      label: 'RRI Pro 1 Gorontalo',
      sublabel: 'Live streaming publik • Saluran Utama',
      freq: '101.8 FM',
      icon: '📻',
      badge: 'Live Streaming',
      externalUrl: 'https://onlineradiobox.com/id/rripro1gorontalo/?cs=id.rripro1gorontalo&played=1',
    },
    {
      id: 'malam_tenang',
      label: 'Malam Tenang dari Antent',
      sublabel: 'Ambient Loop • Antent (Hope to See You Again)',
      freq: '99.9 FM',
      icon: '🌙',
      badge: 'Loop 99.9 FM',
    },
    {
      id: 'ghibli',
      label: 'Musik Seperti Ghibli',
      sublabel: 'Piano & orkestra Joe Hisaishi nostalgia',
      freq: '89.5 FM',
      icon: '🍃',
      badge: 'Ghibli Style',
    },
    {
      id: 'lofi_wita',
      label: 'Lo-Fi Kota Refleksia',
      sublabel: 'Irama santai belajar 5 waktu WITA',
      freq: '104.2 FM',
      icon: '☕',
      badge: 'Lo-Fi Chill',
    },
  ];

  return (
    <div className="relative pointer-events-auto" ref={dropdownRef}>
      {/* Radio Trigger Pill Button (Icon Radar + Icon Pilihan: 📻 Radio, 🌙 Malam Tenang, 🍃 Daun Jatuh, ☕ Kopi) */}
      <div className="flex items-center">
        <button
          onClick={handleTogglePlay}
          className={`group relative h-7.5 sm:h-8.5 px-2 sm:px-2.5 rounded-full backdrop-blur-md border shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 ${
            isPlaying
              ? 'bg-amber-950/70 border-amber-500/70 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
              : 'bg-[#121e2c]/68 border-slate-600/50 text-slate-200 hover:text-white hover:bg-[#1a293b]/80'
          }`}
          title={
            isPlaying
              ? `${stationMeta.stationName} (${stationMeta.frequency}): Mengudara • Klik untuk jeda`
              : `Nyalakan Radio (${stationMeta.stationName}) • Pertama otomatis RRI Gorontalo`
          }
          aria-label="Radio Kota Refleksia"
        >
          {isPlaying ? (
            <>
              {/* Broadcast Pulse or Loading Spinner (Radar Icon) */}
              <div className="relative flex items-center justify-center">
                {isRriConnecting && activeChannel === 'rri_gorontalo' ? (
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                ) : (
                  <>
                    <span className="absolute -inset-1 rounded-full bg-amber-400/30 animate-ping"></span>
                    <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 relative z-10 animate-pulse" />
                  </>
                )}
              </div>

              {/* Station icon badge */}
              <span className="text-xs sm:text-sm leading-none drop-shadow-sm">{stationMeta.icon}</span>
            </>
          ) : (
            <>
              {/* Radar Icon (Off) */}
              <Radio className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-300 transition" />
              {/* Station icon badge */}
              <span className="text-xs sm:text-sm leading-none drop-shadow-sm opacity-90">{stationMeta.icon}</span>
            </>
          )}

          {/* Quick tuner toggle caret */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              setShowTuner((prev) => !prev);
            }}
            className="text-[10px] text-slate-300 hover:text-white px-0.5 py-0.5 rounded transition"
            title="Pilih Saluran Manual (📻 RRI Gorontalo, 🌙 Malam Tenang 99.9 FM, 🍃 Ghibli, ☕ Lo-Fi) / Atur Suara"
          >
            ▾
          </span>
        </button>
      </div>

      {/* FLOATING RADIO TUNER & MANUAL CHANNEL SELECTOR */}
      {showTuner && (
        <div className="absolute right-0 top-11 z-50 bg-[#0d1622]/95 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-3.5 shadow-[0_15px_45px_rgba(0,0,0,0.85)] flex flex-col gap-3 w-[300px] sm:w-[340px] animate-fade-in-up text-left">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                <Radio className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-black text-white tracking-wide">
                  RADIO KOTA REFLEKSIA
                </h4>
                <p className="text-[10px] text-amber-300/80 font-mono">
                  Pilih Saluran Radio Manual
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTuner(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* MANUAL STATION SELECTION */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Music className="w-3 h-3 text-amber-400" />
              Daftar Saluran Radio:
            </span>

            {STATIONS_LIST.map((st) => {
              const isCurrent = activeChannel === st.id;
              return (
                <div
                  key={st.id}
                  onClick={() => handleSelectChannel(st.id)}
                  className={`relative p-2.5 rounded-xl border transition cursor-pointer text-left ${
                    isCurrent
                      ? 'bg-amber-950/40 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-850/80 hover:border-slate-500/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-lg leading-none mt-0.5">{st.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">
                            {st.label}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                            {st.freq}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-300 leading-tight mt-0.5">
                          {st.sublabel}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {isCurrent ? (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                          Pilih
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Special Link for RRI Gorontalo to OnlineRadioBox */}
                  {st.externalUrl && (
                    <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between">
                      <a
                        href={st.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 transition"
                        title="Buka player siaran di OnlineRadioBox"
                      >
                        <span>Buka di OnlineRadioBox</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {isCurrent && isPlaying ? (
                          isRriConnecting ? (
                            <span className="text-amber-400 animate-pulse">Menghubungkan...</span>
                          ) : (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                              Siaran Aktif
                            </span>
                          )
                        ) : (
                          '101.8 FM Live'
                        )}
                      </span>
                    </div>
                  )}

                  {/* Special info & Drive Link option for 99.9 FM Malam Tenang dari Antent */}
                  {st.id === 'malam_tenang' && (
                    <div
                      className="mt-2 pt-1.5 border-t border-slate-800/90 flex flex-col gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="inline-flex items-center gap-1 text-[9.5px] text-indigo-300 font-semibold">
                          <Repeat className="w-2.5 h-2.5 text-amber-400" />
                          <span>Loop Otomatis • Antent</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowDriveInput((prev) => !prev)}
                          className="inline-flex items-center gap-1 text-[9.5px] text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 px-1.5 py-0.5 rounded transition cursor-pointer"
                          title="Atur tautan Google Drive kustom untuk saluran 99.9 FM"
                        >
                          <Link2 className="w-2.5 h-2.5" />
                          <span>{customDriveInput ? 'Link Drive Aktif' : 'Tautan Drive'}</span>
                        </button>
                      </div>

                      {showDriveInput && (
                        <form onSubmit={handleSaveDriveLink} className="flex flex-col gap-1.5 pt-1">
                          <input
                            type="text"
                            value={customDriveInput}
                            onChange={(e) => setCustomDriveInput(e.target.value)}
                            placeholder="Tempel link Google Drive MP3 (opsional)..."
                            className="w-full px-2 py-1 rounded-lg bg-slate-950/90 border border-slate-700 text-[10px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                          />
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[9px] text-slate-400">
                              {driveSavedNotice
                                ? '✅ Link disimpan (otomatis loop)'
                                : 'Kosongkan untuk audio bawaan Antent'}
                            </span>
                            <div className="flex items-center gap-1">
                              {customDriveInput && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomDriveInput('');
                                    lofiMusic.setCustomDriveUrl('');
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] text-slate-300 cursor-pointer"
                                >
                                  Reset
                                </button>
                              )}
                              <button
                                type="submit"
                                className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[9.5px] cursor-pointer"
                              >
                                Simpan
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Special info for Ghibli */}
                  {st.id === 'ghibli' && isCurrent && (
                    <div className="mt-1.5 pt-1.5 border-t border-amber-900/40 text-[9.5px] text-amber-200/90 italic flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      Akustik piano syahdu, string & lonceng melodi Joe Hisaishi
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Volume Control */}
          <div className="pt-2 border-t border-slate-700/60 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1 text-slate-300">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Volume Radio
              </span>
              <span className="font-mono text-amber-400">{Math.round(volume * 100)}%</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => lofiMusic.setVolume(volume > 0 ? 0 : 0.45)}
                className="text-slate-400 hover:text-white transition cursor-pointer p-0.5"
                title={volume === 0 ? 'Bunyikan' : 'Senyap'}
              >
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
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
          </div>

          {/* Big Play / Pause Action Button */}
          <div className="pt-1">
            <button
              onClick={handleTogglePlay}
              className={`w-full py-2 px-3 rounded-xl text-xs font-black text-center transition cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                isPlaying
                  ? 'bg-rose-950/70 text-rose-300 hover:bg-rose-900/90 border border-rose-800/60 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Disc className="w-3.5 h-3.5 animate-spin" />
                  <span>Jeda Siaran ({stationMeta.stationName})</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" />
                  <span>Putar {stationMeta.stationName}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
