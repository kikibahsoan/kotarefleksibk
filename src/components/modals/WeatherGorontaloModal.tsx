import React from 'react';
import { WeatherInfo, WeatherType } from '../../utils/weather.ts';
import { sounds } from '../../utils/audio.ts';
import { X, CloudRain, Snowflake, Cloud, Sun, Clock, Compass, Sparkles, Check } from 'lucide-react';

interface WeatherGorontaloModalProps {
  onClose: () => void;
  currentWeather: WeatherInfo;
  activeWeatherType: WeatherType;
  weatherOverride: WeatherType | 'auto';
  onSetWeatherOverride: (type: WeatherType | 'auto') => void;
  currentTimeWita: string;
}

export const WeatherGorontaloModal: React.FC<WeatherGorontaloModalProps> = ({
  onClose,
  currentWeather,
  activeWeatherType,
  weatherOverride,
  onSetWeatherOverride,
  currentTimeWita,
}) => {
  const weatherSchedules = [
    {
      type: 'berawan' as WeatherType,
      name: 'Berawan',
      timeSlot: '15.00 - 17.00 WITA',
      icon: '☁️',
      color: 'from-sky-500/20 to-blue-600/10 border-sky-400/40 text-sky-200',
      desc: 'Langit teduh dengan awan kumulus bergulung lembut yang menyejukkan suasana kota Refleksia.',
    },
    {
      type: 'hujan_ringan' as WeatherType,
      name: 'Hujan Ringan',
      timeSlot: '10.00 - 12.00 & 21.00 - 22.30 WITA',
      icon: '🌧️',
      color: 'from-cyan-500/20 to-blue-600/10 border-cyan-400/40 text-cyan-200',
      desc: 'Rintik hujan lembut membasahi tanah dengan efek tetesan air dan riak halus yang menenangkan.',
    },
    {
      type: 'salju' as WeatherType,
      name: 'Salju',
      timeSlot: '00.00 - 02.30 WITA',
      icon: '❄️',
      color: 'from-indigo-500/20 to-purple-600/10 border-indigo-300/40 text-indigo-200',
      desc: 'Serpihan salju putih berkilau melayang anggun di tengah heningnya malam kota.',
    },
    {
      type: 'normal' as WeatherType,
      name: 'Cuaca Normal (Cerah)',
      timeSlot: 'Selain jam-jam di atas',
      icon: '☀️',
      color: 'from-amber-500/20 to-orange-600/10 border-amber-400/40 text-amber-200',
      desc: 'Langit cerah alami khas Kota Gorontalo yang hangat mengikuti siklus Subuh, Pagi, Siang, Sore, dan Malam.',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#121e2c]/90 backdrop-blur-xl border border-slate-600/60 w-full max-w-lg rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col text-slate-100 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600/80 via-blue-600/80 to-indigo-700/80 px-5 sm:px-6 py-4 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {currentWeather.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black leading-tight">
                  Cuaca Realtime Gorontalo
                </h3>
                <span className="text-[10px] uppercase font-black tracking-wider bg-black/30 text-sky-200 px-2 py-0.5 rounded-full border border-sky-300/30 font-mono">
                  WITA
                </span>
              </div>
              <p className="text-xs text-sky-100 font-medium">
                Sistem 4 Tipe Cuaca Interaktif Refleksia City
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            aria-label="Tutup Cuaca"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Current Live Weather Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-850/80 to-slate-900/90 border border-slate-700 shadow-md flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{currentTimeWita}</span>
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-[10px] font-bold text-slate-300">Kota Gorontalo</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>{currentWeather.name}</span>
                <span className="text-2xl">{currentWeather.icon}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-snug">
                {currentWeather.description}
              </p>
            </div>

            <div className="text-right shrink-0 bg-black/30 px-3 py-2 rounded-2xl border border-white/10">
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 leading-none">
                {currentWeather.tempCelsius}°C
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Lembap: {currentWeather.humidity}%
              </div>
            </div>
          </div>

          {/* Quick Preview Selector (Optional interactive test for all 4 weathers) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Atur Cuaca Kota (Master Control):</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                👑 Khusus Master kikybahsoan
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onSetWeatherOverride('auto');
                }}
                className={`px-2 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                  weatherOverride === 'auto'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                {weatherOverride === 'auto' && <Check className="w-3 h-3 text-white" />}
                <span>Otomatis (Jam)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onSetWeatherOverride('berawan');
                }}
                className={`px-2 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                  weatherOverride === 'berawan'
                    ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <span>☁️ Berawan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onSetWeatherOverride('hujan_ringan');
                }}
                className={`px-2 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                  weatherOverride === 'hujan_ringan'
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <span>🌧️ Hujan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onSetWeatherOverride('salju');
                }}
                className={`px-2 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                  weatherOverride === 'salju'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <span>❄️ Salju</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onSetWeatherOverride('normal');
                }}
                className={`px-2 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                  weatherOverride === 'normal'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <span>☀️ Normal</span>
              </button>
            </div>
          </div>

          {/* Schedule List */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Jadwal 4 Tipe Cuaca di Kota Refleksia:</span>
            </h4>

            <div className="space-y-2">
              {weatherSchedules.map((ws) => {
                const isCurrent = activeWeatherType === ws.type;
                return (
                  <div
                    key={ws.type}
                    className={`p-3 rounded-2xl bg-gradient-to-r ${ws.color} border transition flex items-start gap-3 ${
                      isCurrent ? 'ring-2 ring-emerald-400/80 shadow-md' : 'opacity-85'
                    }`}
                  >
                    <div className="text-2xl shrink-0 pt-0.5">{ws.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-extrabold text-sm text-white">{ws.name}</h5>
                          {isCurrent && (
                            <span className="text-[9px] font-black bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-full uppercase">
                              Aktif Sekarang
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-black/40 px-2 py-0.5 rounded-full border border-white/10 shrink-0">
                          {ws.timeSlot}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {ws.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900/60 px-5 py-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Data suhu realtime diambil langsung dari koordinat Kota Gorontalo.
          </span>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
