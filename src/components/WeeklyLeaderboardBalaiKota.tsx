import React, { useEffect, useState } from 'react';
import { WeeklyLeaderboardCitizen } from '../types/index.ts';
import { StorageService } from '../utils/storage.ts';
import { Trophy, RefreshCw, Sparkles, CheckCircle2, Flame } from 'lucide-react';
import { sounds } from '../utils/audio.ts';

interface WeeklyLeaderboardBalaiKotaProps {
  currentStudentName?: string;
  compact?: boolean;
}

export const WeeklyLeaderboardBalaiKota: React.FC<WeeklyLeaderboardBalaiKotaProps> = ({
  currentStudentName,
  compact = false,
}) => {
  const [top5, setTop5] = useState<WeeklyLeaderboardCitizen[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [syncedFromSheet, setSyncedFromSheet] = useState<boolean>(false);
  const [spreadsheetName, setSpreadsheetName] = useState<string>('Google Spreadsheet');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadLeaderboard = async (manual = false) => {
    if (manual) {
      sounds.playClick();
      setIsRefreshing(true);
    }
    try {
      const res = await StorageService.fetchWeeklyLeaderboardFromSpreadsheet();
      setTop5(res.top5);
      setSyncedFromSheet(res.syncedFromSheet);
      setSpreadsheetName(res.spreadsheetName);
      setLastUpdated(res.lastUpdated);
    } catch {
      // safe fallback
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard(false);

    const handleRefresh = () => {
      loadLeaderboard(false);
    };
    window.addEventListener('kota_refleksi_lab_dkv_updated', handleRefresh);
    return () => window.removeEventListener('kota_refleksi_lab_dkv_updated', handleRefresh);
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return {
        medal: '🥇',
        label: 'JUARA 1',
        cardBg: 'bg-gradient-to-r from-amber-500/20 via-amber-950/40 to-slate-900/90 border-amber-400/60',
        xpBadge: 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
      };
    }
    if (rank === 2) {
      return {
        medal: '🥈',
        label: 'PERINGKAT 2',
        cardBg: 'bg-gradient-to-r from-slate-300/15 via-slate-900/80 to-slate-900/90 border-slate-400/50',
        xpBadge: 'bg-slate-200 text-slate-950 border-white',
      };
    }
    if (rank === 3) {
      return {
        medal: '🥉',
        label: 'PERINGKAT 3',
        cardBg: 'bg-gradient-to-r from-orange-500/15 via-orange-950/35 to-slate-900/90 border-orange-400/50',
        xpBadge: 'bg-orange-500/90 text-white border-orange-300',
      };
    }
    return {
      medal: `#${rank}`,
      label: `PERINGKAT ${rank}`,
      cardBg: 'bg-slate-900/85 border-slate-700/70 hover:border-slate-600',
      xpBadge: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    };
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-950/35 via-slate-900/95 to-indigo-950/35 border border-amber-500/45 p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Header Leaderboard Mingguan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 mb-3.5 border-b border-amber-500/25">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-slate-950 flex items-center justify-center shadow-lg shrink-0">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                <span>Leaderboard Mingguan Balai Kota</span>
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                7 Hari Terakhir
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Top 5 warga dengan perolehan XP terbanyak dalam 7 hari terakhir (Sumber: {spreadsheetName})
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
              syncedFromSheet
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                : 'bg-sky-950/60 text-sky-300 border-sky-500/40'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>{syncedFromSheet ? 'Live Spreadsheet' : 'Tersinkron'}</span>
            {lastUpdated && <span className="opacity-75 font-mono">• {lastUpdated}</span>}
          </span>

          <button
            type="button"
            onClick={() => loadLeaderboard(true)}
            disabled={isRefreshing}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[11px] font-extrabold flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
            title="Tarik data terbaru dari Google Spreadsheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-300' : ''}`} />
            <span className="hidden min-[420px]:inline">
              {isRefreshing ? 'Menarik Data...' : 'Segarkan'}
            </span>
          </button>
        </div>
      </div>

      {/* Daftar 5 Warga Terbaik Minggu Ini */}
      {isLoading ? (
        <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          <span>Menarik rekap XP 7 hari terakhir dari Google Spreadsheet...</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {top5.map((citizen) => {
            const badge = getRankBadge(citizen.rank);
            const isMe =
              Boolean(currentStudentName) &&
              citizen.studentName.trim().toLowerCase() === currentStudentName!.trim().toLowerCase();

            return (
              <div
                key={citizen.studentId}
                className={`p-3 sm:p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  badge.cardBg
                } ${isMe ? 'ring-2 ring-amber-400' : ''}`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  {/* Medali Peringkat */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black shrink-0 border ${
                      citizen.rank === 1
                        ? 'bg-amber-400/25 border-amber-300 text-xl'
                        : citizen.rank === 2
                        ? 'bg-slate-300/20 border-slate-300 text-xl'
                        : citizen.rank === 3
                        ? 'bg-orange-400/20 border-orange-300 text-xl'
                        : 'bg-slate-800 border-slate-600 text-xs text-slate-300 font-mono'
                    }`}
                  >
                    {badge.medal}
                  </div>

                  {/* Identitas & Rincian Aktivitas 7 Hari */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                        {citizen.studentName}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700">
                        {citizen.className.replace(' (Desain Komunikasi Visual)', '')}
                      </span>
                      {isMe && (
                        <span className="text-[9.5px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                          KAMU
                        </span>
                      )}
                    </div>

                    {!compact && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {citizen.breakdown.refleksi > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
                            🌿 Refleksi +{citizen.breakdown.refleksi} XP
                          </span>
                        )}
                        {citizen.breakdown.tesLabDkv > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-700/50">
                            🛠️ Lab DKV +{citizen.breakdown.tesLabDkv} XP
                          </span>
                        )}
                        {citizen.breakdown.podcast > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-700/50">
                            🎙️ Podcast +{citizen.breakdown.podcast} XP
                          </span>
                        )}
                        {citizen.breakdown.misi > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-sky-950/60 text-sky-300 border border-sky-700/50">
                            🎯 Misi +{citizen.breakdown.misi} XP
                          </span>
                        )}
                        {citizen.breakdown.lainnya > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-700/50">
                            📮 Pos & Kota +{citizen.breakdown.lainnya} XP
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-[10.5px] text-slate-400 truncate mt-1">
                      <Sparkles className="w-3 h-3 text-amber-400 inline mr-1 -mt-0.5" />
                      {citizen.lastActivityText}
                    </p>
                  </div>
                </div>

                {/* Skor XP Mingguan (7 Hari Terakhir) */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 shrink-0">
                  <div
                    className={`px-3 py-1 rounded-xl border font-extrabold text-xs sm:text-sm font-mono flex items-center gap-1 ${badge.xpBadge}`}
                  >
                    <span>+{citizen.weeklyXp} XP</span>
                    <span className="text-[9.5px] font-sans font-bold opacity-85">7 Hari</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Total Saldo: <strong className="text-amber-300">{citizen.totalXp} XP</strong> •{' '}
                    {citizen.weeklyActivitiesCount} Aktivitas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
