import React, { useState } from 'react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Settings,
  FileSpreadsheet,
  Code2,
  RefreshCw,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { StorageService } from '../utils/storage.ts';
import { GOOGLE_APPS_SCRIPT_CODE } from './modals/RuangGuruModal.tsx';
import { sounds } from '../utils/audio.ts';

interface TeacherPinModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onOpenSettings?: () => void;
  expectedPin: string;
}

export const TeacherPinModal: React.FC<TeacherPinModalProps> = ({
  onClose,
  onSuccess,
  onOpenSettings,
  expectedPin,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'settings'>('login');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  // Settings state directly in login modal
  const initialSettings = StorageService.getSettings();
  const [gasUrlInput, setGasUrlInput] = useState(initialSettings.gasWebAppUrl || '');
  const [sheetUrlInput, setSheetUrlInput] = useState(initialSettings.spreadsheetUrl || '');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    // Validates against configured pin or master teacher password 'Kiki123!'
    if (cleanPin === expectedPin || cleanPin === 'Kiki123!') {
      onSuccess();
    } else {
      setError(true);
    }
  };

  const handleTestConnection = async () => {
    const targetUrl = gasUrlInput.trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      setTestStatus('error');
      setTestMessage('URL Google Apps Script tidak valid. Pastikan berawalan https://script.google.com/macros/s/.../exec');
      return;
    }

    setTestStatus('testing');
    setTestMessage(null);
    const start = Date.now();

    try {
      const url = new URL(targetUrl);
      url.searchParams.set('action', 'get_data');
      url.searchParams.set('_t', String(Date.now()));

      const res = await fetch(url.toString(), { method: 'GET' });
      const latency = Date.now() - start;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const sheetName = data.spreadsheet || 'Google Spreadsheet';
      const chatCount = Array.isArray(data.chats) ? data.chats.length : 0;

      setTestStatus('success');
      setTestMessage(`Koneksi Sukses! Terhubung ke "${sheetName}" (${chatCount} chat tersimpan • ${latency}ms).`);
      sounds.playRewardXp();
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Gagal terhubung: ${err.message || 'Periksa URL atau pastikan izin deployment adalah Anyone / Siapa saja'}.`);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const current = StorageService.getSettings();
    const updated = {
      ...current,
      gasWebAppUrl: gasUrlInput.trim(),
      spreadsheetUrl: sheetUrlInput.trim(),
    };
    StorageService.setSettings(updated);
    setIsSaved(true);
    sounds.playRewardXp();
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopyScript = () => {
    try {
      navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setIsCopied(true);
      sounds.playClick();
      setTimeout(() => setIsCopied(false), 3000);
    } catch (e) {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-backdrop-fade">
      <div className={`bg-slate-900 border border-slate-700 w-full ${activeTab === 'settings' ? 'max-w-lg' : 'max-w-sm'} rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 relative animate-fade-in-up transition-all max-h-[92vh] overflow-y-auto`}>
        <button
          onClick={onClose}
          aria-label="Tutup Login Guru"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-2xl mb-4 border border-slate-700/60 max-w-fit mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Akses Guru</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Setting Spreadsheet & Apps Script</span>
          </button>
        </div>

        {/* VIEW 1: LOGIN FORM */}
        {activeTab === 'login' && (
          <div>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Akses Ruang Guru</h3>
              <p className="text-xs text-slate-400 mt-1">
                Masukkan kata sandi guru untuk membuka panel pengelolaan.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(false);
                  }}
                  placeholder="Ketik kata sandi..."
                  className="w-full text-center text-lg font-bold py-3 px-10 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/60 p-2.5 rounded-xl border border-red-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Kata sandi salah! Masukkan kata sandi guru yang benar.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-sm shadow transition cursor-pointer active:scale-95"
              >
                Buka Ruang Guru
              </button>

              <div className="pt-3 border-t border-slate-800/80 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Konfigurasi Google Spreadsheet & Apps Script &gt;</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 2: SETTINGS SPREADSHEET & APPS SCRIPT FORM */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Setting Spreadsheet & Apps Script</h3>
                  <p className="text-[11px] text-slate-400">
                    Sinkronisasi realtime obrolan murid & data refleksi
                  </p>
                </div>
              </div>

              {sheetUrlInput && (
                <a
                  href={sheetUrlInput}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-xl"
                >
                  <span>Buka Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {isSaved && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500 rounded-xl flex items-center gap-2 text-emerald-200 text-xs font-bold animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan Spreadsheet & Apps Script berhasil disimpan!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-3.5">
              {/* URL Google Spreadsheet */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>URL Google Spreadsheet</span>
                </label>
                <input
                  type="url"
                  value={sheetUrlInput}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* URL Google Apps Script Web App */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>URL Google Apps Script Web App (/exec)</span>
                </label>
                <input
                  type="url"
                  value={gasUrlInput}
                  onChange={(e) => setGasUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Realtime Chat Sync Badge */}
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-[11px] text-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mt-1 shrink-0"></span>
                <span>
                  Obrolan murid otomatis tersimpan di sheet <b>Obrolan_Warga</b> dan sinkron antar-device setiap 3.5 detik (terhapus otomatis setelah 24 jam).
                </span>
              </div>

              {/* Test Connection Button & Message */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>{testStatus === 'testing' ? 'Menguji...' : '⚡ Uji Koneksi'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="py-2 px-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Salin skrip Apps Script v2.5 untuk ditempel di Google Sheets"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Tersalin!' : 'Salin Skrip'}</span>
                  </button>
                </div>

                {testMessage && (
                  <p
                    className={`text-xs p-2 rounded-lg ${
                      testStatus === 'success'
                        ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-900/50 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {testMessage}
                  </p>
                )}
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow transition cursor-pointer active:scale-95"
              >
                💾 Simpan Pengaturan Cloud
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
